import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { orderService } from '../../services/api';
import { Order, OrderStatus, PaymentStatus } from '../../types';
import { ChatWidget } from '../../components/Chat/ChatWidget';
import { useOrderStatusForOrder } from '../../hooks/useOrderStatusHub';
import { useUserId } from '../../hooks/useUserId';
import { isOrderShipped } from '../../utils/orderStatus';
import './OrderPage.css';

export const OrderPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const userId = useUserId();
  const { orderStatus: liveStatus } = useOrderStatusForOrder(userId, id);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) {
        setError('ID заказа не указан');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const orderData = await orderService.getOrderById(id);
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
  }, [id]);

  useEffect(() => {
    if (liveStatus == null || !order) return;
    if (liveStatus === order.status) return;
    setOrder((prev) => (prev ? { ...prev, status: liveStatus } : null));
  }, [liveStatus, order?.status]);

  useEffect(() => {
    const payment = searchParams.get('payment');
    const orderId = searchParams.get('orderId');
    
    if (payment || orderId) {
      const timer = setTimeout(() => {
        setSearchParams({});
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, setSearchParams]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Не указано';
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('ru-RU', { month: 'short' });
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${day} ${month} ${year} г., ${time}`;
  };

  const getStatusText = (status: string | number) => {
    const statusValue = typeof status === 'number' 
      ? OrderStatus[status] || 'Created'
      : status;
    
    const statusMap: Record<string, string> = {
      'Created': 'Создан',
      'Paid': 'Оплачен',
      'Cooking': 'Готовится',
      'Ready': 'Готов',
      'Shipped': 'Отправлен',
      'Cancelled': 'Отменен'
    };
    return statusMap[statusValue] || String(status);
  };

  if (loading) {
    return (
      <div className="order-page-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Загрузка заказа...</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="order-page-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <p className="error-title">Не удалось загрузить заказ</p>
          <p className="error-message">{error}</p>
          <button onClick={() => navigate('/history')} className="btn-primary" style={{ marginTop: '20px' }}>
            ← Вернуться к истории заказов
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-page-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <p className="error-title">Заказ не найден</p>
          <button onClick={() => navigate('/history')} className="btn-primary" style={{ marginTop: '20px' }}>
            ← Вернуться к истории заказов
          </button>
        </div>
      </div>
    );
  }

  const paymentStatus = order.payment?.status;
  const paymentStatusParam = searchParams.get('payment');
  const isPaid = order.payment?.paid === true || 
                 paymentStatus === PaymentStatus.Completed || 
                 order.status === OrderStatus.Paid;
  const isCancelled = order.status === OrderStatus.Cancelled;

  return (
    <div className="order-page-container">
      <div className="receipt-container">
        <div className="receipt-header">
          <div className="security-badge">
            <span className="lock-icon">🔒</span>
            <span>Безопасная оплата</span>
          </div>
        </div>

        <div className="receipt-box">
          <h1 className="receipt-title">Чек заказа</h1>
          <div className="receipt-date">{formatDate(order.createdAt)}</div>

          {(paymentStatusParam === 'success' || isPaid) && (
            <div className={`payment-status payment-status-success`}>
              <div className="status-icon success">✓</div>
              <div className="status-text">Оплата успешно завершена</div>
            </div>
          )}

          {paymentStatusParam === 'cancel' && !isPaid && (
            <div className={`payment-status payment-status-cancel`}>
              <div className="status-icon cancel">✕</div>
              <div className="status-text">Оплата отменена</div>
            </div>
          )}

          {!paymentStatusParam && !isPaid && !isCancelled && (
            <div className={`payment-status payment-status-pending`}>
              <div className="status-icon pending">⏳</div>
              <div className="status-text">Ожидает оплаты</div>
            </div>
          )}

          <div className="receipt-section">
            <div className="section-title">Информация о заказе</div>
            <div className="merchant-info">
              <div className="merchant-name">KFC - Food Delivery</div>
            </div>
          </div>

          <div className="receipt-divider"></div>

          <div className="receipt-section">
            <div className="section-title">Товары</div>
            <div className="order-items-list">
              {order.items.map((item) => (
                <div key={item.id} className="receipt-item">
                  <div className="item-info">
                    <div className="item-name">{item.name}</div>
                    {item.ingredients && item.ingredients.length > 0 && (
                      <div className="item-ingredients">
                        {item.ingredients.map((ing, idx) => (
                          <span key={idx} className="ingredient-tag">
                            {ing.name}
                            {idx < item.ingredients!.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="item-quantity">× {item.quantity}</div>
                  <div className="item-price">
                    {((item.price ?? 0) * item.quantity).toFixed(0)} ₽
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="receipt-divider"></div>

          <div className="total-row">
            <div className="total-label">Итого:</div>
            <div className="total-amount">{order.totalPrice.toFixed(0)} ₽</div>
          </div>

          <div className="receipt-divider"></div>

          <div className="receipt-section">
            <div className="delivery-info">
              {order.delivery?.address?.address && (
                <div className="delivery-address">
                  <div className="address-label">Адрес доставки:</div>
                  <div className="address-value">{order.delivery.address.address}</div>
                </div>
              )}
              <div className="order-status">
                <div className="status-label">Статус заказа:</div>
                <div className="status-value">{getStatusText(order.status)}</div>
              </div>
            </div>
          </div>

          {order.payment && (
            <div className="receipt-section">
              <div className="section-title">Информация об оплате</div>
              <div className="transaction-info">
                {order.payment.checkoutId && (
                  <div className="transaction-row">
                    <div className="transaction-label">ID транзакции:</div>
                    <div className="transaction-value">{order.payment.checkoutId}</div>
                  </div>
                )}
                {order.payment.status && (
                  <div className="transaction-row">
                    <div className="transaction-label">Статус оплаты:</div>
                    <div className="transaction-value">
                      {paymentStatus === PaymentStatus.Completed ? 'Завершена' :
                       paymentStatus === PaymentStatus.Pending ? 'Ожидает' :
                       paymentStatus === PaymentStatus.Canceled ? 'Отменена' :
                       paymentStatus === PaymentStatus.Expired ? 'Истекла' :
                       'Неизвестно'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="receipt-footer">
            <button onClick={() => navigate('/history')} className="btn-back">
              ← Вернуться к истории заказов
            </button>
          </div>
        </div>
      </div>

      {isOrderShipped(order.status) && id && (
        <ChatWidget
          orderId={id}
          customerName={order.userId ?? 'Клиент'}
        />
      )}
    </div>
  );
};