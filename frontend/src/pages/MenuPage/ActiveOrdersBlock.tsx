import { Link, useNavigate } from 'react-router-dom';
import { OrderStatus, ServiceType } from '../../types';
import type { ActiveOrderSummary } from '../../hooks/useOrderStatusHub';

const ORDER_STATUS_LABELS: Record<string, string> = {
  Created: 'Создан',
  Paid: 'Оплачен',
  Cooking: 'Готовится',
  Ready: 'Готов',
  Shipped: 'Отправлен',
  Cancelled: 'Отменен',
};

function getOrderStatusText(status: string | number): string {
  const key = typeof status === 'number' ? OrderStatus[status] : status;
  return ORDER_STATUS_LABELS[key] ?? String(status);
}

/** Неоплачен только статус Created (0). */
function isUnpaid(status: number | undefined): boolean {
  const s = status ?? OrderStatus.Created;
  return s === OrderStatus.Created;
}

export interface ActiveOrdersBlockProps {
  activeOrders: ActiveOrderSummary[];
  visible: boolean;
}

export function ActiveOrdersBlock({ activeOrders, visible }: ActiveOrdersBlockProps) {
  const navigate = useNavigate();
  if (!visible || activeOrders.length === 0) return null;

  return (
    <section className="active-orders-section">
      <h2 className="active-orders-title">Текущие заказы</h2>
      <div className="active-orders-scroll">
        <div className="active-orders-scroll-inner">
          {activeOrders.map((order) => {
            const statusText = getOrderStatusText(order.status ?? OrderStatus.Created);
            const isDelivery = (order.serviceType ?? ServiceType.ClickCollect) === ServiceType.Delivery;
            const statusKey = typeof order.status === 'number' ? OrderStatus[order.status] : 'Created';
            const unpaid = isUnpaid(order.status);
            const paymentUrl = `/order-checkout/${order.id}`;

            return (
              <div
                key={order.id}
                className={`active-order-card active-order-card--${String(statusKey).toLowerCase()}`}
                title={`${isDelivery ? 'Доставка' : 'Самовывоз'} · ${statusText}`}
              >
                <div className="active-order-card-info">
                  <span className="active-order-card-id">#{order.id.slice(0, 8)}</span>
                  <span className="active-order-status">{statusText}</span>
                  <span className={`active-order-delivery ${isDelivery ? 'active-order-delivery--delivery' : 'active-order-delivery--pickup'}`}>
                    {isDelivery ? '🚚 Доставка' : '🏪 Самовывоз'}
                  </span>
                </div>
                <div className="active-order-card-actions">
                  {unpaid ? (
                    <button
                      type="button"
                      className="active-order-btn active-order-btn--pay"
                      onClick={() => navigate(paymentUrl)}
                    >
                      Оплатить
                    </button>
                  ) : (
                    <Link to={paymentUrl} className="active-order-btn active-order-btn--details">
                      Подробнее
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
