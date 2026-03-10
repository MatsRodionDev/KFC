import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { selectCart } from '../../store/slices/cartSlice';
import { geoService, orderService, paymentService } from '../../services/api';
import { Order, OrderStatus, PaymentStatus, ServiceType } from '../../types';
import { getCurrentPositionWithWatchFallback } from '../../utils/geolocation';
import { useOrderStatusForOrder } from '../../hooks/useOrderStatusHub';
import { useUserId } from '../../hooks/useUserId';
import './OrderCheckoutPage.css';

export const OrderCheckoutPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cart = useAppSelector(selectCart);
  const userId = useUserId();
  const { orderStatus } = useOrderStatusForOrder(userId, orderId ?? undefined);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [resolvedDeliveryCoords, setResolvedDeliveryCoords] = useState<[number, number] | null>(null);
  const [resolvedStoreCoords, setResolvedStoreCoords] = useState<[number, number] | null>(null);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const routeRef = useRef<any>(null);
  const redirectingRef = useRef(false);
  const hideElementsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationRequestIdRef = useRef(0);

  const DEFAULT_CENTER: [number, number] = [53.9, 30.35];
  const DEFAULT_ZOOM = 15;
  const YANDEX_MAPS_API_KEY = import.meta.env.VITE_YANDEX_MAPS_API_KEY ?? '45e040cd-8625-4021-b31a-795da9728fc2';
  const YANDEX_MAPS_SCRIPT_URL = `https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=${YANDEX_MAPS_API_KEY}&load=package.full`;
  const YANDEX_ELEMENTS_SELECTOR = [
    '[class*="ymaps-2-1-79-copyright"]',
    '[class*="ymaps-2-1-79-float-button"]',
    'a[href*="yandex.ru/maps"]',
    'a[href*="yandex.com/maps"]'
  ].join(', ');
  const svgToDataUrl = (svg: string) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.trim())}`;

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError('ID заказа не указан');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const orderData = await orderService.getOrderById(orderId);
        setOrder(orderData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Не удалось загрузить заказ';
        setError(errorMessage);
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  /** Обновляем статус заказа в реальном времени из Order Status Hub (ConnectToOrderStatuses для одного заказа). */
  useEffect(() => {
    if (orderStatus == null || !order) return;
    if (orderStatus === order.status) return;
    setOrder((prev) => (prev ? { ...prev, status: orderStatus } : null));
  }, [orderStatus, order?.status]);

  const hideYandexElements = useCallback(() => {
    const elements = document.querySelectorAll(YANDEX_ELEMENTS_SELECTOR);
    elements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.display = 'none';
      htmlEl.style.visibility = 'hidden';
      htmlEl.style.opacity = '0';
      htmlEl.style.pointerEvents = 'none';
    });
  }, []);

  const startHidingYandexElements = useCallback(() => {
    hideYandexElements();
    if (hideElementsIntervalRef.current) {
      clearInterval(hideElementsIntervalRef.current);
    }
    hideElementsIntervalRef.current = setInterval(hideYandexElements, 500);
    setTimeout(() => {
      if (hideElementsIntervalRef.current) {
        clearInterval(hideElementsIntervalRef.current);
        hideElementsIntervalRef.current = null;
      }
    }, 5000);
  }, [hideYandexElements]);

  const getLocationErrorMessage = useCallback((error: GeolocationPositionError | Error): string => {
    const code = 'code' in error ? (error as GeolocationPositionError).code : undefined;
    if (code === 1) {
      return 'Доступ к геолокации запрещён. Разрешите его в настройках браузера или системы.';
    }
    if (code === 2) {
      return 'Не удалось определить местоположение. Включите геолокацию в настройках устройства и разрешите доступ для сайта.';
    }
    if (code === 3) {
      return 'Превышено время ожидания. Проверьте, что геолокация включена, и нажмите «Повторить».';
    }
    return 'Не удалось получить местоположение. Разрешите доступ к геолокации и нажмите «Повторить».';
  }, []);

  const requestUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Геолокация не поддерживается вашим браузером.');
      return;
    }
    const requestId = ++locationRequestIdRef.current;
    setIsLoadingLocation(true);
    setLocationError(null);
    getCurrentPositionWithWatchFallback()
      .then(({ lat, lon }) => {
        if (requestId !== locationRequestIdRef.current) return;
        setIsLoadingLocation(false);
        setLocationError(null);
        setUserCoords([lat, lon]);
      })
      .catch((err) => {
        if (requestId !== locationRequestIdRef.current) return;
        setIsLoadingLocation(false);
        setLocationError(getLocationErrorMessage(err as GeolocationPositionError | Error));
        setUserCoords(null);
        console.error('Error getting user location:', err);
      });
  }, [getLocationErrorMessage]);

  const handleRetryLocation = useCallback(() => {
    setLocationError(null);
    requestUserLocation();
  }, [requestUserLocation]);

  const destroyMap = useCallback(() => {
    if (routeRef.current && mapInstanceRef.current) {
      try {
        mapInstanceRef.current.geoObjects.remove(routeRef.current);
      } catch (e) {
        // ignore
      }
      routeRef.current = null;
    }
    if (mapInstanceRef.current) {
      try {
        markersRef.current.forEach((marker) => {
          try {
            mapInstanceRef.current.geoObjects.remove(marker);
          } catch (e) {
            // ignore
          }
        });
        markersRef.current = [];
        mapInstanceRef.current.destroy();
      } catch (e) {
        console.error('Error destroying map:', e);
      } finally {
        mapInstanceRef.current = null;
      }
    }
  }, []);

  const addMarker = useCallback((coords: [number, number], iconHref: string, size: [number, number], caption: string) => {
    if (!mapInstanceRef.current || !window.ymaps) {
      return;
    }

    const marker = new window.ymaps.Placemark(
      coords,
      { iconCaption: caption },
      {
        iconLayout: 'default#imageWithContent',
        iconImageHref: iconHref,
        iconImageSize: size,
        iconImageOffset: [-size[0] / 2, -size[1]],
        iconContentOffset: [0, -10],
        draggable: false
      }
    );

    mapInstanceRef.current.geoObjects.add(marker);
    markersRef.current.push(marker);
  }, []);

  const initializeMap = useCallback((center: [number, number]) => {
    if (!mapRef.current || !window.ymaps || mapInstanceRef.current) {
      return;
    }

    try {
      const map = new window.ymaps.Map(mapRef.current, {
        center,
        zoom: DEFAULT_ZOOM,
        controls: [],
        behaviors: ['drag', 'scrollZoom', 'dblClickZoom', 'multiTouch']
      });

      map.behaviors.disable('scrollZoom');
      map.behaviors.disable('dblClickZoom');
      map.behaviors.disable('multiTouch');

      mapInstanceRef.current = map;
      setIsMapLoading(false);
      setTimeout(startHidingYandexElements, 100);
    } catch (err) {
      console.error('Map initialization error:', err);
      setIsMapLoading(false);
    }
  }, [startHidingYandexElements]);

  const loadYandexMapsScript = useCallback((center: [number, number]) => {
    if (window.ymaps && typeof window.ymaps.ready === 'function') {
      window.ymaps.ready(() => initializeMap(center));
      return;
    }

    const existingScript = document.querySelector(`script[src="${YANDEX_MAPS_SCRIPT_URL}"]`);
    if (existingScript) {
      const checkInterval = setInterval(() => {
        if (window.ymaps && typeof window.ymaps.ready === 'function') {
          clearInterval(checkInterval);
          window.ymaps.ready(() => initializeMap(center));
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkInterval);
      }, 10000);
      return;
    }

    const script = document.createElement('script');
    script.src = YANDEX_MAPS_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      if (window.ymaps && typeof window.ymaps.ready === 'function') {
        window.ymaps.ready(() => initializeMap(center));
      }
    };
    script.onerror = () => {
      setIsMapLoading(false);
    };
    document.head.appendChild(script);
  }, [initializeMap]);

  useEffect(() => {
    if (!order) {
      return;
    }

    const paymentStatus = order.payment?.status;
    const isPaid = order.payment?.paid === true ||
      paymentStatus === PaymentStatus.Completed ||
      order.status === OrderStatus.Paid;

    const paymentParam = searchParams.get('payment');
    if (paymentParam || isPaid || !order.payment?.checkoutId || redirectingRef.current) {
      return;
    }

    redirectingRef.current = true;
    paymentService.getSession(order.payment.checkoutId)
      .then((session) => {
        const checkoutUrl = session.url || session.Url;
        if (checkoutUrl) {
          window.location.href = checkoutUrl;
          return;
        }
        redirectingRef.current = false;
      })
      .catch((err) => {
        console.error('Error fetching payment session:', err);
        redirectingRef.current = false;
      });
  }, [order]);

  useEffect(() => {
    if (!order) {
      return;
    }

    setIsMapLoading(true);
    destroyMap();

    const deliveryCoords = resolvedDeliveryCoords;
    const storeCoords = resolvedStoreCoords;
    const isPickup = order.delivery?.serviceType === ServiceType.ClickCollect;
    const center =
      order.delivery?.serviceType === ServiceType.Delivery
        ? deliveryCoords || DEFAULT_CENTER
        : storeCoords || DEFAULT_CENTER;
    loadYandexMapsScript(center);

    const interval = setInterval(() => {
      if (!mapInstanceRef.current || !window.ymaps) {
        return;
      }

      clearInterval(interval);
      if (deliveryCoords && order.delivery?.serviceType === ServiceType.Delivery) {
        addMarker(
          deliveryCoords,
          svgToDataUrl(`
            <svg width="60" height="76" viewBox="0 0 60 76" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="deliveryGradient" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stop-color="#ff7a18"/>
                  <stop offset="100%" stop-color="#ff6a00"/>
                </linearGradient>
              </defs>
              <circle cx="30" cy="30" r="20" fill="url(#deliveryGradient)" stroke="#fff" stroke-width="3"/>
              <circle cx="30" cy="30" r="10" fill="#fff" opacity="0.2"/>
              <path d="M 30 48 L 22 76 L 38 76 Z" fill="url(#deliveryGradient)" stroke="#fff" stroke-width="2"/>
              <text x="30" y="36" font-family="Arial" font-size="18" font-weight="700" fill="#fff" text-anchor="middle">🚚</text>
            </svg>
          `),
          [60, 76],
          'Доставка'
        );
        mapInstanceRef.current.setCenter(deliveryCoords, DEFAULT_ZOOM, { duration: 0 });
      }

      if (storeCoords) {
        addMarker(
          storeCoords,
          svgToDataUrl(`
            <svg width="60" height="76" viewBox="0 0 60 76" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="storeGradient" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stop-color="#ffb347"/>
                  <stop offset="100%" stop-color="#ff9800"/>
                </linearGradient>
              </defs>
              <circle cx="30" cy="30" r="20" fill="url(#storeGradient)" stroke="#fff" stroke-width="3"/>
              <circle cx="30" cy="30" r="10" fill="#fff" opacity="0.2"/>
              <path d="M 30 48 L 22 76 L 38 76 Z" fill="url(#storeGradient)" stroke="#fff" stroke-width="2"/>
              <text x="30" y="36" font-family="Arial" font-size="20" font-weight="700" fill="#fff" text-anchor="middle">🏪</text>
            </svg>
          `),
          [60, 76],
          'Ресторан'
        );
        if (!isPickup) {
          mapInstanceRef.current.setCenter(storeCoords, DEFAULT_ZOOM, { duration: 0 });
        }
      }

      if (isPickup && userCoords) {
        addMarker(
          userCoords,
          svgToDataUrl(`
            <svg width="48" height="60" viewBox="0 0 48 60" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="userGradient" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stop-color="#3b82f6"/>
                  <stop offset="100%" stop-color="#2563eb"/>
                </linearGradient>
              </defs>
              <circle cx="24" cy="24" r="16" fill="url(#userGradient)" stroke="#fff" stroke-width="2"/>
              <path d="M 24 36 L 16 58 L 32 58 Z" fill="url(#userGradient)" stroke="#fff" stroke-width="1.5"/>
              <text x="24" y="28" font-family="Arial" font-size="14" font-weight="700" fill="#fff" text-anchor="middle">👤</text>
            </svg>
          `),
          [48, 60],
          'Вы здесь'
        );
      }

      if (isPickup && userCoords && storeCoords && window.ymaps.multiRouter?.MultiRoute) {
        try {
          if (routeRef.current && mapInstanceRef.current) {
            mapInstanceRef.current.geoObjects.remove(routeRef.current);
            routeRef.current = null;
          }
          const multiRoute = new window.ymaps.multiRouter.MultiRoute(
            {
              referencePoints: [userCoords, storeCoords]
            },
            {
              boundsAutoApply: true,
              zoomMargin: 40
            }
          );
          mapInstanceRef.current.geoObjects.add(multiRoute);
          routeRef.current = multiRoute;
        } catch (e) {
          console.warn('Не удалось построить маршрут:', e);
          if (storeCoords) {
            mapInstanceRef.current.setCenter(storeCoords, DEFAULT_ZOOM, { duration: 0 });
          }
        }
      } else if (isPickup && storeCoords) {
        mapInstanceRef.current.setCenter(storeCoords, DEFAULT_ZOOM, { duration: 0 });
      }
    }, 200);

    return () => {
      clearInterval(interval);
    };
  }, [order, destroyMap, loadYandexMapsScript, addMarker, resolvedDeliveryCoords, resolvedStoreCoords, userCoords]);

  useEffect(() => {
    if (!order) {
      return;
    }

    const deliveryAddress = order.delivery?.address?.address;
    const deliveryCoords = order.delivery?.address?.coordinates
      ? [order.delivery.address.coordinates.latitude, order.delivery.address.coordinates.longitude] as [number, number]
      : null;

    if (deliveryCoords) {
      setResolvedDeliveryCoords(deliveryCoords);
    } else if (deliveryAddress) {
      geoService.getAddressInfo(deliveryAddress)
        .then((response) => {
          setResolvedDeliveryCoords([response.coordinates.latitude, response.coordinates.longitude]);
        })
        .catch((err) => {
          console.error('Error resolving delivery coordinates:', err);
        });
    } else {
      setResolvedDeliveryCoords(null);
    }
  }, [order]);

  useEffect(() => {
    const cartStoreCoords = cart?.delivery?.storeAddressInfo?.address?.coordinates
      ? [cart.delivery.storeAddressInfo.address.coordinates.latitude, cart.delivery.storeAddressInfo.address.coordinates.longitude] as [number, number]
      : null;
    const orderStoreCoords = order?.delivery?.storeAddressInfo?.address?.coordinates
      ? [order.delivery.storeAddressInfo.address.coordinates.latitude, order.delivery.storeAddressInfo.address.coordinates.longitude] as [number, number]
      : null;
    setResolvedStoreCoords(cartStoreCoords ?? orderStoreCoords ?? null);
  }, [cart, order]);

  useEffect(() => {
    if (!order || order.delivery?.serviceType !== ServiceType.ClickCollect) {
      return;
    }
    requestUserLocation();
  }, [order?.id, order?.delivery?.serviceType, requestUserLocation]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);
  const getStatusText = (status: string | number) => {
    const statusValue = typeof status === 'number' 
      ? OrderStatus[status] || 'Created'
      : status;
    
    const statusMap: Record<string, string> = {
      'Created': 'Заказ создан',
      'Paid': 'Оплачен',
      'Cooking': 'Готовится',
      'Ready': 'Готов к выдаче',
      'Shipped': 'Отправлен',
      'Cancelled': 'Отменен'
    };
    return statusMap[statusValue] || String(status);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return new Date().toLocaleString('ru-RU');
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Загрузка заказа...</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <p className="error-title">Не удалось загрузить заказ</p>
          <p className="error-message">{error}</p>
          <button onClick={() => navigate('/cart')} className="btn-primary" style={{ marginTop: '20px' }}>
            ← Вернуться в корзину
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <p className="error-title">Заказ не найден</p>
          <button onClick={() => navigate('/cart')} className="btn-primary" style={{ marginTop: '20px' }}>
            ← Вернуться в корзину
          </button>
        </div>
      </div>
    );
  }

  const paymentStatus = order.payment?.status;
  const isPaid = order.payment?.paid === true || 
                 paymentStatus === PaymentStatus.Completed || 
                 order.status === OrderStatus.Paid;
  const isCancelled = order.status === OrderStatus.Cancelled;

  const deliveryLabel = order.delivery?.serviceType === ServiceType.ClickCollect ? 'Самовывоз' : 'Доставка';
  const deliveryAddress = order.delivery?.serviceType === ServiceType.ClickCollect
    ? order.delivery?.storeAddressInfo?.address?.address
    : order.delivery?.address?.address;

  return (
    <div className="order-checkout-map-page">
      <div className="order-checkout-map" ref={mapRef}>
        {isMapLoading && (
          <div className="order-checkout-map-loading">
            <div className="loading-spinner"></div>
            <p>Загрузка карты...</p>
          </div>
        )}
      </div>

      <div className="order-checkout-panel">
        <div className="order-checkout-header">
          <div>
            <div className="order-checkout-title">Заказ #{order.id}</div>
            <div className="order-checkout-date">{formatDate(order.createdAt)}</div>
          </div>
          <div className={`order-checkout-status ${isPaid ? 'paid' : isCancelled ? 'cancelled' : 'pending'}`}>
            {isPaid ? 'Оплачен' : isCancelled ? 'Отменен' : 'Ожидает оплаты'}
          </div>
        </div>

        <div className="order-checkout-section">
          <div className="order-checkout-row">
            <span className="order-checkout-label">Статус</span>
            <span className="order-checkout-value">{getStatusText(order.status)}</span>
          </div>
          <div className="order-checkout-row">
            <span className="order-checkout-label">{deliveryLabel}</span>
            <span className="order-checkout-value">{deliveryAddress || 'Не указан'}</span>
          </div>
          <div className="order-checkout-row total">
            <span className="order-checkout-label">Итого</span>
            <span className="order-checkout-value">{order.totalPrice.toFixed(0)} ₽</span>
          </div>
        </div>

        <div className="order-checkout-section">
          <div className="order-checkout-subtitle">Состав заказа</div>
          <div className="order-checkout-items">
            {order.items && order.items.length > 0 ? (
              order.items.map((item) => (
                <div key={item.id} className="order-checkout-item">
                  <div>
                    <div className="order-item-name">{item.name}</div>
                    <div className="order-item-quantity">× {item.quantity}</div>
                  </div>
                  <div className="order-item-price">
                    {(item.price * item.quantity).toFixed(0)} ₽
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-items">Товары не найдены</div>
            )}
          </div>
        </div>

        {error && (
          <div className="order-checkout-error">
            <span>⚠️ {error}</span>
          </div>
        )}

        <button className="order-checkout-back" onClick={() => navigate('/history')}>
          ← К истории заказов
        </button>
      </div>

      {order.delivery?.serviceType === ServiceType.ClickCollect && locationError && (
        <div className="order-checkout-location-panel">
          <p className="order-checkout-location-error-text">{locationError}</p>
          <button
            type="button"
            className="order-checkout-location-retry-btn"
            onClick={handleRetryLocation}
            disabled={isLoadingLocation}
          >
            {isLoadingLocation ? 'Запрос...' : 'Повторить'}
          </button>
        </div>
      )}
    </div>
  );
};

