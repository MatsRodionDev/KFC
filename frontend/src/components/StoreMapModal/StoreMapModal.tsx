import { useCallback, useEffect, useRef, useState } from 'react';
import { geoService } from '../../services/api';
import { GeoStoreResponse } from '../../types';
import './StoreMapModal.css';

interface StoreMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoreSelect?: (store: GeoStoreResponse) => void;
}

declare global {
  interface Window {
    ymaps: any;
  }
}

const DEFAULT_CENTER: [number, number] = [53.9, 30.35];
const DEFAULT_ZOOM = 12;
const STORE_RADIUS_KM = 30;
const YANDEX_MAPS_SCRIPT_URL = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU';
const YANDEX_ELEMENTS_SELECTOR = [
  '[class*="ymaps-2-1-79-copyright"]',
  '[class*="ymaps-2-1-79-float-button"]',
  'a[href*="yandex.ru/maps"]',
  'a[href*="yandex.com/maps"]'
].join(', ');
const svgToDataUrl = (svg: string) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.trim())}`;

export const StoreMapModal = ({ isOpen, onClose, onStoreSelect }: StoreMapModalProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const storeMarkersRef = useRef<any[]>([]);
  const userLocationMarkerRef = useRef<any>(null);
  const hideElementsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [stores, setStores] = useState<GeoStoreResponse[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [savedUserLocation, setSavedUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [selectedStore, setSelectedStore] = useState<GeoStoreResponse | null>(null);

  const destroyMap = useCallback(() => {
    if (mapInstanceRef.current) {
      try {
        // Удаляем маркеры магазинов
        storeMarkersRef.current.forEach(marker => {
          try {
            mapInstanceRef.current.geoObjects.remove(marker);
          } catch (e) {
            // Игнорируем ошибки при удалении маркеров
          }
        });
        storeMarkersRef.current = [];
        
        // Удаляем маркер местоположения пользователя
        if (userLocationMarkerRef.current) {
          try {
            mapInstanceRef.current.geoObjects.remove(userLocationMarkerRef.current);
          } catch (e) {
            // Игнорируем ошибки при удалении маркера
          }
          userLocationMarkerRef.current = null;
        }
        
        // Уничтожаем карту
        mapInstanceRef.current.destroy();
      } catch (e) {
        console.error('Error destroying map:', e);
      } finally {
        // Всегда очищаем ссылку, даже если была ошибка
        mapInstanceRef.current = null;
      }
    }
  }, []);

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

  const getUserLocation = useCallback((): Promise<{ lat: number; lon: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLoadingLocation(false);
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          setIsLoadingLocation(false);
          console.error('Error getting user location:', error);
          reject(error);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
  }, []);

  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Радиус Земли в километрах
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  const loadStores = useCallback(async (latitude: number, longitude: number) => {
    try {
      setIsLoadingStores(true);
      console.log('Loading stores with coordinates:', { latitude, longitude, radius: STORE_RADIUS_KM });
      const storesData = await geoService.getStoresInRadius(latitude, longitude, STORE_RADIUS_KM);
      
      // Вычисляем расстояние на клиенте для каждого магазина
      const storesWithCalculatedDistance = (storesData || []).map(store => {
        const calculatedDistance = calculateDistance(
          latitude,
          longitude,
          store.coordinates.latitude,
          store.coordinates.longitude
        );
        console.log('Store:', store.address, 'Server distance:', store.distance, 'Calculated distance:', calculatedDistance);
        return {
          ...store,
          distance: calculatedDistance // Используем вычисленное расстояние
        };
      });
      
      // Сортируем по расстоянию
      storesWithCalculatedDistance.sort((a, b) => a.distance - b.distance);
      
      setStores(storesWithCalculatedDistance);
    } catch (error) {
      console.error('Error loading stores:', error);
      setStores([]);
    } finally {
      setIsLoadingStores(false);
    }
  }, [calculateDistance]);

  const addUserLocationMarker = useCallback((location: { lat: number; lon: number }) => {
    if (!mapInstanceRef.current || !window.ymaps) {
      return;
    }

    // Удаляем старый маркер местоположения пользователя
    if (userLocationMarkerRef.current) {
      try {
        mapInstanceRef.current.geoObjects.remove(userLocationMarkerRef.current);
      } catch (e) {
        console.error('Error removing user location marker:', e);
      }
      userLocationMarkerRef.current = null;
    }

    // Добавляем красивый маркер местоположения пользователя
    try {
      const marker = new window.ymaps.Placemark(
        [location.lat, location.lon],
        {
          balloonContent: '<div style="padding: 8px;"><strong>📍 Ваше местоположение</strong></div>',
          iconCaption: 'Вы здесь'
        },
        {
          iconLayout: 'default#imageWithContent',
          iconImageHref: svgToDataUrl(`
            <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="12" fill="#4285F4" stroke="#fff" stroke-width="3"/>
              <circle cx="20" cy="20" r="6" fill="#fff"/>
              <path d="M 20 32 L 15 50 L 25 50 Z" fill="#4285F4" stroke="#fff" stroke-width="2"/>
            </svg>
          `),
          iconImageSize: [40, 50],
          iconImageOffset: [-20, -50],
          iconContentOffset: [0, -10]
        }
      );

      mapInstanceRef.current.geoObjects.add(marker);
      userLocationMarkerRef.current = marker;
    } catch (e) {
      console.error('Error adding user location marker:', e);
      // Fallback на стандартный маркер
      try {
        const marker = new window.ymaps.Placemark(
          [location.lat, location.lon],
          {
            balloonContent: 'Ваше местоположение',
            iconCaption: 'Вы здесь'
          },
          {
            preset: 'islands#blueCircleDotIcon',
            draggable: false
          }
        );
        mapInstanceRef.current.geoObjects.add(marker);
        userLocationMarkerRef.current = marker;
      } catch (e2) {
        console.error('Error adding fallback user location marker:', e2);
      }
    }
  }, []);

  const addStoreMarkers = useCallback((storesList: GeoStoreResponse[], currentSelectedStore: GeoStoreResponse | null) => {
    if (!mapInstanceRef.current || !window.ymaps) {
      return;
    }

    // Удаляем старые маркеры
    storeMarkersRef.current.forEach(marker => {
      try {
        mapInstanceRef.current.geoObjects.remove(marker);
      } catch (e) {
        console.error('Error removing marker:', e);
      }
    });
    storeMarkersRef.current = [];

    // Добавляем красивые маркеры магазинов
    storesList.forEach((store) => {
      try {
        const isSelected = currentSelectedStore && currentSelectedStore.address === store.address;
        const markerColor = isSelected ? '#FF6A00' : '#FF9800';
        
        const marker = new window.ymaps.Placemark(
          [store.coordinates.latitude, store.coordinates.longitude],
          {
            balloonContent: `
              <div style="padding: 12px; min-width: 200px;">
                <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px; color: #1a1a1a;">
                  🏪 ${store.address}
                </div>
                <div style="font-size: 14px; color: #666;">
                  📍 Расстояние: <strong style="color: #FF6A00;">${store.distance.toFixed(1)} км</strong>
                </div>
              </div>
            `,
            iconCaption: store.address
          },
          {
            iconLayout: 'default#imageWithContent',
            iconImageHref: svgToDataUrl(`
              <svg width="50" height="60" viewBox="0 0 50 60" xmlns="http://www.w3.org/2000/svg">
                <circle cx="25" cy="25" r="18" fill="${markerColor}" stroke="#fff" stroke-width="3" opacity="0.9"/>
                <text x="25" y="30" font-family="Arial" font-size="24" font-weight="bold" fill="#fff" text-anchor="middle">🏪</text>
                <path d="M 25 43 L 20 60 L 30 60 Z" fill="${markerColor}" stroke="#fff" stroke-width="2" opacity="0.9"/>
              </svg>
            `),
            iconImageSize: [50, 60],
            iconImageOffset: [-25, -60],
            iconContentOffset: [0, -10]
          }
        );

        marker.events.add('click', () => {
          setSelectedStore(store);
          if (onStoreSelect) {
            onStoreSelect(store);
          }
        });

        mapInstanceRef.current.geoObjects.add(marker);
        storeMarkersRef.current.push(marker);
      } catch (e) {
        console.error('Error adding store marker:', e);
        // Fallback на стандартный маркер
        try {
          const marker = new window.ymaps.Placemark(
            [store.coordinates.latitude, store.coordinates.longitude],
            {
              balloonContent: `
                <div style="padding: 8px;">
                  <strong>${store.address}</strong><br/>
                  <span>Расстояние: ${store.distance.toFixed(1)} км</span>
                </div>
              `,
              iconCaption: store.address
            },
            {
              preset: 'islands#orangeStretchyIcon',
              draggable: false
            }
          );
          marker.events.add('click', () => {
            setSelectedStore(store);
            if (onStoreSelect) {
              onStoreSelect(store);
            }
          });
          mapInstanceRef.current.geoObjects.add(marker);
          storeMarkersRef.current.push(marker);
        } catch (e2) {
          console.error('Error adding fallback store marker:', e2);
        }
      }
    });
  }, [onStoreSelect]);

  const initializeMap = useCallback((center: [number, number]) => {
    if (!mapRef.current || !window.ymaps) {
      return;
    }

    // Если карта уже существует, не создаем новую
    if (mapInstanceRef.current) {
      return;
    }

    try {
      const map = new window.ymaps.Map(mapRef.current, {
        center,
        zoom: DEFAULT_ZOOM,
        controls: [],
        behaviors: ['drag', 'scrollZoom', 'dblClickZoom', 'multiTouch']
      });

      // Масштаб разрешен для удобства выбора магазина

      mapInstanceRef.current = map;
      setIsLoading(false);

      setTimeout(startHidingYandexElements, 100);
    } catch (err) {
      console.error('Map initialization error:', err);
      setIsLoading(false);
    }
  }, [startHidingYandexElements]);

  const initializeWithUserLocation = useCallback(async (location: { lat: number; lon: number }) => {
    setUserLocation(location);
    initializeMap([location.lat, location.lon]);
    await loadStores(location.lat, location.lon);
    // Добавляем маркер местоположения пользователя после инициализации карты
    setTimeout(() => {
      addUserLocationMarker(location);
    }, 500);
  }, [initializeMap, loadStores, addUserLocationMarker]);

  const getOrRequestUserLocation = useCallback(async (): Promise<{ lat: number; lon: number }> => {
    // Если координаты уже сохранены, используем их
    if (savedUserLocation) {
      return savedUserLocation;
    }

    // Если координаты не сохранены, запрашиваем их
    try {
      setIsLoadingLocation(true);
      const location = await getUserLocation();
      // Сохраняем координаты для будущего использования
      setSavedUserLocation(location);
      return location;
    } catch (error) {
      console.error('Failed to get user location:', error);
      throw error;
    } finally {
      setIsLoadingLocation(false);
    }
  }, [savedUserLocation, getUserLocation]);

  const loadYandexMapsScript = useCallback(async () => {
    const initMap = async () => {
      try {
        const location = await getOrRequestUserLocation();
        await initializeWithUserLocation(location);
      } catch (error) {
        // Если не удалось получить геолокацию, используем центр по умолчанию
        initializeMap(DEFAULT_CENTER);
      }
    };

    if (window.ymaps && typeof window.ymaps.ready === 'function') {
      window.ymaps.ready(initMap);
      return;
    }

    const existingScript = document.querySelector(`script[src*="${YANDEX_MAPS_SCRIPT_URL}"]`);
    if (existingScript) {
      const checkInterval = setInterval(() => {
        if (window.ymaps && typeof window.ymaps.ready === 'function') {
          clearInterval(checkInterval);
          window.ymaps.ready(initMap);
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.ymaps) {
          setIsLoading(false);
        }
      }, 10000);
      return;
    }

    const script = document.createElement('script');
    script.src = YANDEX_MAPS_SCRIPT_URL;
    script.async = true;
    
    script.onload = () => {
      if (window.ymaps && typeof window.ymaps.ready === 'function') {
        window.ymaps.ready(initMap);
      }
    };

    script.onerror = () => {
      setIsLoading(false);
    };

    document.head.appendChild(script);
  }, [getOrRequestUserLocation, initializeWithUserLocation, initializeMap]);

  useEffect(() => {
    if (stores.length > 0 && mapInstanceRef.current) {
      addStoreMarkers(stores, selectedStore);
    }
  }, [stores, selectedStore, addStoreMarkers]);

  useEffect(() => {
    if (!isOpen) {
      // Очищаем все при закрытии (кроме сохраненных координат)
      if (hideElementsIntervalRef.current) {
        clearInterval(hideElementsIntervalRef.current);
        hideElementsIntervalRef.current = null;
      }
      destroyMap();
      setStores([]);
      setSelectedStore(null);
      setUserLocation(null);
      setIsLoadingLocation(false);
      setIsLoading(false);
      setIsLoadingStores(false);
      return;
    }

    // При открытии сбрасываем состояния (кроме savedUserLocation)
    setIsLoading(true);
    // Показываем индикатор загрузки только если координаты еще не сохранены
    if (!savedUserLocation) {
      setIsLoadingLocation(true);
    }
    setIsLoadingStores(false);
    setStores([]);
    setSelectedStore(null);
    setUserLocation(null);
    
    // Убеждаемся, что карта полностью уничтожена перед созданием новой
    if (mapInstanceRef.current) {
      destroyMap();
    }
    
    // Небольшая задержка для гарантии полной очистки перед инициализацией
    const initTimer = setTimeout(() => {
      // Проверяем, что модальное окно все еще открыто и карта уничтожена
      if (isOpen && !mapInstanceRef.current) {
        loadYandexMapsScript();
      }
    }, 100);
    
    return () => {
      clearTimeout(initTimer);
    };
  }, [isOpen, destroyMap, loadYandexMapsScript, savedUserLocation]);

  const handleStoreClick = useCallback((store: GeoStoreResponse) => {
    setSelectedStore(store);
    if (onStoreSelect) {
      onStoreSelect(store);
    }
    
    // Центрируем карту на выбранном магазине
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(
        [store.coordinates.latitude, store.coordinates.longitude],
        16,
        { duration: 300 }
      );
    }
  }, [onStoreSelect]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="store-map-modal-overlay" onClick={onClose}>
      <div className="store-map-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Закрыть">
          ×
        </button>
        
        <div className="map-container" ref={mapRef}>
          {(isLoading || isLoadingLocation) && (
            <div className="map-loading">
              <div className="loading-spinner"></div>
              <p>{isLoadingLocation ? 'Определение вашего местоположения...' : 'Загрузка карты...'}</p>
            </div>
          )}
        </div>

        <div className="stores-panel">
          <div className="stores-panel-header">
            <h3>Магазины в радиусе {STORE_RADIUS_KM} км</h3>
            {isLoadingStores && (
              <div className="loading-spinner-small"></div>
            )}
          </div>
          
          {isLoadingStores && stores.length === 0 ? (
            <div className="stores-loading">
              <div className="loading-spinner-small"></div>
              <span>Загрузка магазинов...</span>
            </div>
          ) : stores.length === 0 ? (
            <div className="stores-empty">
              <span>Магазины не найдены</span>
            </div>
          ) : (
            <div className="stores-list">
              {stores.map((store, index) => (
                <div
                  key={index}
                  className={`store-item ${selectedStore === store ? 'selected' : ''}`}
                  onClick={() => handleStoreClick(store)}
                >
                  <div className="store-icon">📍</div>
                  <div className="store-content">
                    <div className="store-address">{store.address}</div>
                    <div className="store-distance">
                      {store.distance.toFixed(1)} км
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

