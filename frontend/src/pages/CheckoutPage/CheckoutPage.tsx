import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { 
  selectCart, 
  selectCartLoading, 
  selectCartError,
  selectCartTotalPrice,
  fetchCart,
  setDeliveryAddress as setDeliveryAddressAction
} from '../../store/slices/cartSlice';
import {
  selectIsAddressMapModalOpen,
  selectIsStoreMapModalOpen,
  selectIsCreatingOrder,
  openAddressMapModal,
  closeAddressMapModal,
  openStoreMapModal,
  closeStoreMapModal,
  setCreatingOrder
} from '../../store/slices/uiSlice';
import { orderService, geoService, paymentService } from '../../services/api';
import { ServiceType } from '../../types';
import { useUserId } from '../../hooks/useUserId';
import { AddressMapModal } from '../../components/AddressMapModal';
import { StoreMapModal } from '../../components/StoreMapModal';
import './CheckoutPage.css';

export const CheckoutPage = () => {
  const dispatch = useAppDispatch();
  const userId = useUserId();
  const cart = useAppSelector(selectCart);
  const loading = useAppSelector(selectCartLoading);
  const error = useAppSelector(selectCartError);
  const totalPrice = useAppSelector(selectCartTotalPrice);
  const isMapModalOpen = useAppSelector(selectIsAddressMapModalOpen);
  const isStoreMapModalOpen = useAppSelector(selectIsStoreMapModalOpen);
  const isCreatingOrder = useAppSelector(selectIsCreatingOrder);
  const navigate = useNavigate();
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>(ServiceType.Delivery);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const currentServiceType = cart?.delivery?.serviceType ?? serviceType;
  const isDeliveryValid = currentServiceType === ServiceType.Delivery
    ? Boolean(cart?.delivery?.address?.address?.trim())
    : Boolean(cart?.delivery?.storeAddressInfo?.storeId);
  const deliveryTypeLabel = currentServiceType === ServiceType.Delivery ? 'Доставка' : 'Самовывоз';
  const deliverySummaryValue = currentServiceType === ServiceType.Delivery
    ? cart?.delivery?.address?.address?.trim() || 'Не выбран'
    : cart?.delivery?.storeAddressInfo?.address?.address?.trim() || 'Не выбран';

  useEffect(() => {
    dispatch(fetchCart(userId));
  }, [dispatch, userId]);

  useEffect(() => {
    if (cart?.delivery) {
      setServiceType(cart.delivery.serviceType);
      setDeliveryAddress(cart.delivery.address?.address || '');
    }
  }, [cart]);

  useEffect(() => {
    // Перенаправляем на /cart только если загрузка завершена и корзина точно пустая
    if (!loading && cart && (!cart.items || cart.items.length === 0)) {
      navigate('/cart');
    }
  }, [cart, loading, navigate]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (serviceType === ServiceType.Delivery && !deliveryAddress.trim()) {
      errors.deliveryAddress = 'Введите адрес доставки';
    }
    if (serviceType === ServiceType.ClickCollect && !cart?.delivery?.storeAddressInfo?.storeId) {
      errors.deliveryAddress = 'Выберите ресторан для самовывоза';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateOrder = async () => {
    if (!cart || cart.items.length === 0) {
      alert('Корзина пуста');
      navigate('/cart');
      return;
    }

    if (!validateForm()) {
      return;
    }

    if (serviceType === ServiceType.Delivery) {
      // Проверяем, что адрес установлен в корзине
      if (!cart.delivery.address?.address || !cart.delivery.address.address.trim()) {
        if (!deliveryAddress.trim()) {
          setFormErrors({ deliveryAddress: 'Введите адрес доставки' });
          return;
        }
        // Если адрес не установлен, устанавливаем его перед созданием заказа
        try {
          await dispatch(setDeliveryAddressAction({
            userId,
            address: deliveryAddress.trim()
          })).unwrap();
        } catch (err: any) {
          console.error('Error setting address:', err);
          const errorMessage = err?.response?.data?.message || err?.message || 'Не удалось установить адрес доставки';
          alert(`Ошибка: ${errorMessage}`);
          return;
        }
      }
    }

    try {
      dispatch(setCreatingOrder(true));
      const order = await orderService.createOrder({
        userId
      });

      const baseUrl = window.location.origin;
      const session = await paymentService.createSession({
        orderId: order.id,
        customerId: userId,
        successUrl: `${baseUrl}/order-checkout/${order.id}?payment=success`,
        cancelUrl: `${baseUrl}/order-checkout/${order.id}?payment=cancel`
      });

      const checkoutUrl = session.url || session.Url;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }

      alert('Не удалось получить ссылку на оплату');
    } catch (err: any) {
      console.error('Error creating order:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Не удалось создать заказ';
      alert(`Ошибка: ${errorMessage}`);
    } finally {
      dispatch(setCreatingOrder(false));
    }
  };

  if (loading) {
    return (
      <div className="container">
        <h1>Оформление заказа</h1>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Загрузка данных...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <h1>Оформление заказа</h1>
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <p className="error-title">Произошла ошибка</p>
          <p className="error-message">{error}</p>
          <button onClick={() => navigate('/cart')} className="btn-primary" style={{ marginTop: '20px' }}>
            ← Вернуться в корзину
          </button>
        </div>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="container">
        <h1>Оформление заказа</h1>
        <div className="empty-cart">
          <div className="empty-icon">🛒</div>
          <p>Ваша корзина пуста</p>
          <p style={{ fontSize: '15px', color: '#666', marginTop: '8px' }}>
            Добавьте товары в корзину для оформления заказа
          </p>
          <button onClick={() => navigate('/cart')} className="btn-primary" style={{ marginTop: '24px' }}>
            ← Вернуться в корзину
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Оформление заказа</h1>

      <div className="checkout-layout">
        <div className="checkout-form-section">
          <div className="checkout-form">
            <h2 className="form-title">Данные для доставки</h2>

            <div className="form-section">
              <label className="form-label">Способ получения *</label>
              <div className="service-type-buttons">
                <button
                  type="button"
                  className={`service-type-btn ${serviceType === ServiceType.Delivery ? 'active' : ''}`}
                  onClick={() => setServiceType(ServiceType.Delivery)}
                >
                  <span className="service-icon">🚚</span>
                  <span>Доставка</span>
                </button>
                <button
                  type="button"
                  className={`service-type-btn ${serviceType === ServiceType.ClickCollect ? 'active' : ''}`}
                  onClick={() => {
                    setServiceType(ServiceType.ClickCollect);
                  }}
                >
                  <span className="service-icon">🏪</span>
                  <span>Самовывоз</span>
                </button>
              </div>
            </div>

            {serviceType === ServiceType.Delivery && (
              <div className="form-section">
                <label className="form-label">Адрес доставки *</label>
                <div className="address-input-wrapper">
                  <input
                    type="text"
                    className={`form-input ${formErrors.deliveryAddress ? 'error' : ''}`}
                    placeholder="г. Минск, ул. Примерная, д. 1, кв. 1"
                    value={deliveryAddress}
                    onChange={(e) => {
                      setDeliveryAddress(e.target.value);
                      if (formErrors.deliveryAddress) {
                        setFormErrors({ ...formErrors, deliveryAddress: '' });
                      }
                    }}
                    readOnly
                  />
                  <button
                    type="button"
                    className="btn-open-map"
                    onClick={() => dispatch(openAddressMapModal())}
                  >
                    📍 Выбрать на карте
                  </button>
                </div>
                {cart.delivery.serviceType === ServiceType.Delivery && cart.delivery.address?.address && (
                  <div className="address-status">
                    <p className="current-address-info">
                      Текущий адрес в корзине: <strong>{cart.delivery.address.address}</strong>
                    </p>
                  </div>
                )}
              </div>
            )}

            {serviceType === ServiceType.ClickCollect && (
              <div className="form-section">
                <label className="form-label">Адрес ресторана *</label>
                <div className="address-input-wrapper">
                  <input
                    type="text"
                    className={`form-input ${formErrors.deliveryAddress ? 'error' : ''}`}
                    placeholder="Выберите ресторан"
                    value={cart.delivery.serviceType === ServiceType.ClickCollect && cart.delivery.storeAddressInfo?.address.address ? cart.delivery.storeAddressInfo.address.address : ''}
                    readOnly
                  />
                  <button
                    type="button"
                    className="btn-open-map"
                    onClick={() => dispatch(openStoreMapModal())}
                  >
                    📍 Выбрать на карте
                  </button>
                </div>
                {cart.delivery.serviceType === ServiceType.ClickCollect && (
                  <div className="info-box">
                    <span className="info-icon">🏪</span>
                    <span>
                      {cart.delivery.storeAddressInfo?.address?.address
                        ? `Ресторан: ${cart.delivery.storeAddressInfo.address.address}`
                        : 'Выберите ресторан из списка'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="checkout-summary-section">
          <div className="summary-header">
            <h2 className="summary-title">Ваш заказ</h2>
            <div className="items-count-badge">{cart.items.length} {cart.items.length === 1 ? 'товар' : cart.items.length < 5 ? 'товара' : 'товаров'}</div>
          </div>

          <div className="order-items-summary">
            {cart.items.length === 0 ? (
              <div className="empty-items">Корзина пуста</div>
            ) : (
              cart.items.map((item) => (
                <div key={item.id} className="order-item-summary">
                  <div className="order-item-info">
                    <span className="order-item-name">{item.name}</span>
                    <span className="order-item-quantity">× {item.quantity}</span>
                  </div>
                  <div className="order-item-price">
                    {((item.price ?? item.itemIngredients.reduce((sum, ing) => 
                      sum + (ing.quantity + ing.customQuantityDelta) * ing.price, 0
                    )) * item.quantity).toFixed(0)} ₽
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="summary-section">
            <div className="summary-stats">
              <div className="summary-row">
                <span className="summary-label">{deliveryTypeLabel}</span>
                <span className="summary-value">{deliverySummaryValue}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Товаров в заказе</span>
                <span className="summary-value">{cart.items.length} шт.</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Количество позиций</span>
                <span className="summary-value">{cart.items.reduce((sum, item) => sum + item.quantity, 0)} шт.</span>
              </div>
            </div>
            <div className="summary-row total">
              <span className="total-label">Итого к оплате</span>
              <span className="total-price">
                {totalPrice.toFixed(0)} ₽
              </span>
            </div>
          </div>

          {isCreatingOrder ? (
            <div className="checkout-loading" aria-live="polite" aria-busy="true">
              <span className="spinner"></span>
            </div>
          ) : (
            <button
              className="btn-checkout"
              onClick={handleCreateOrder}
              disabled={!isDeliveryValid}
            >
              Оформить заказ
              <span className="arrow">→</span>
            </button>
          )}

          <button
            className="btn-back-to-cart"
            onClick={() => navigate('/cart')}
          >
            ← Вернуться в корзину
          </button>
        </div>
      </div>


      {serviceType === ServiceType.Delivery && (
        <AddressMapModal
          isOpen={isMapModalOpen}
          onClose={() => dispatch(closeAddressMapModal())}
          initialAddress={cart.delivery.address || null}
          userId={userId}
          onAddressSaved={async () => {
            await dispatch(fetchCart(userId));
          }}
        />
      )}

      {serviceType === ServiceType.ClickCollect && (
        <StoreMapModal
          isOpen={isStoreMapModalOpen}
          onClose={() => dispatch(closeStoreMapModal())}
          onStoreSelect={async (store) => {
            try {
              // Получаем storeInfo по адресу из geo
              const storeInfo = await geoService.getStoreByAddress(store.address);
              
              // Передаем storeId в метод доставки с serviceType = 0 (ClickCollect)
              await dispatch(setDeliveryAddressAction({
                userId,
                address: store.address,
                serviceType: ServiceType.ClickCollect,
                storeId: storeInfo.storeId
              })).unwrap();
              
              dispatch(closeStoreMapModal());
            } catch (err: any) {
              console.error('Error setting store address:', err);
              const errorMessage = err?.response?.data?.message || err?.message || 'Не удалось установить адрес магазина';
              alert(`Ошибка: ${errorMessage}`);
            }
          }}
        />
      )}
    </div>
  );
};

