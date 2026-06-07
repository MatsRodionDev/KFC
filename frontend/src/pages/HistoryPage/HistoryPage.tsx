import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderApi } from '../../services/apiConfig';
import { Order, OrderStatus } from '../../types';
import { useUserId } from '../../hooks/useUserId';
import './HistoryPage.css';

export const HistoryPage = () => {
  const navigate = useNavigate();
  const userId = useUserId();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data: ordersData } = await orderApi.post<Order[]>('/orders/by_userid', { customerId: userId });
        setOrders(ordersData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Не удалось загрузить заказы';
        setError(errorMessage);
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userId]);

  const formatDate = (dateString: string) => {
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
      <div className="container">
        <h1>История заказов</h1>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Загрузка истории заказов...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <h1>История заказов</h1>
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <p className="error-title">Не удалось загрузить заказы</p>
          <p className="error-message">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary" style={{ marginTop: '20px' }}>
            🔄 Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container">
        <h1>История заказов</h1>
        <div className="empty-orders">
          <div className="empty-icon">📦</div>
          <p>У вас пока нет заказов</p>
          <p style={{ fontSize: '15px', color: '#666', marginTop: '12px', lineHeight: '1.6' }}>
            Сделайте первый заказ, чтобы он появился здесь
          </p>
          <button onClick={() => navigate('/')} className="btn-primary" style={{ marginTop: '24px' }}>
            🛍️ Перейти в каталог
          </button>
        </div>
      </div>
    );
  }

  const totalOrders = orders.length;
  const last90DaysText = `${totalOrders} ${totalOrders === 1 ? 'заказ' : totalOrders < 5 ? 'заказа' : 'заказов'} за последние 90 дней`;

  return (
    <div className="container">
      <h1>История заказов</h1>
      <p className="orders-subtitle">{last90DaysText}</p>
      
      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>№</th>
              <th>Время заказа</th>
              <th>Сумма</th>
              <th>Статус</th>
              <th>Чек</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, _index) => {
              const totalPrice = order.totalPrice || order.items?.reduce((sum, item) => {
                return sum + item.price * item.quantity;
              }, 0) || 0;

              // Используем короткий номер заказа (первые 8 символов ID)
              const orderNumber = order.id.slice(0, 8).toUpperCase();

              return (
                <tr key={order.id}>
                  <td className="order-number-cell">{orderNumber}</td>
                  <td className="order-date-cell">{formatDate(order.createdAt || new Date().toISOString())}</td>
                  <td className="order-price-cell">{totalPrice.toFixed(2)} руб.</td>
                  <td className="order-status-cell">
                    <span className={`status-badge status-${typeof order.status === 'number' ? OrderStatus[order.status]?.toLowerCase() || 'created' : order.status?.toLowerCase() || 'created'}`}>
                      {getStatusText(order.status || OrderStatus.Created)}
                    </span>
                  </td>
                  <td className="order-receipt-cell">
                    <button 
                      className="btn-view-receipt"
                      onClick={() => navigate(`/order/${order.id}`)}
                    >
                      Посмотреть
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
