import { useState, useEffect, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import { OrderStatus } from '../types';

/** URL хаба. VITE_ORDER_HUB_URL задаёт явный адрес (напр. http://localhost:5046/order-status). В dev по умолчанию — тот же хост, чтобы запрос был виден в Network. */
const getHubUrl = (): string => {
  const env = import.meta.env.VITE_ORDER_HUB_URL;
  if (env && typeof env === 'string') return env.trim();
  if (import.meta.env.DEV) {
    const port = import.meta.env.VITE_ORDER_SERVICE_PORT || '5046';
    return `http://localhost:${port}/order-status`;
  }
  return '/order-status';
};

/** Краткая информация по заказу: id, тип доставки, статус (только через SignalR). */
export interface ActiveOrderSummary {
  id: string;
  serviceType: number;
  status: number;
}

/**
 * Контракт с бэка: OrderSummaryDto (Id, ServiceType, Status).
 * В JSON приходит camelCase: id, serviceType, status.
 * Учитываем также PascalCase (Id) и orderId на случай старых версий бэка.
 */
function toActiveOrderSummary(raw: Record<string, unknown>): ActiveOrderSummary | null {
  const id = String(
    raw.id ?? raw.Id ?? raw.orderId ?? raw.OrderId ?? ''
  ).trim();
  if (!id) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(HUB_LABEL, 'ReceiveOrderStatus: нет id в payload', raw);
    }
    return null;
  }
  const serviceType = typeof raw.serviceType === 'number' ? raw.serviceType : Number(raw.ServiceType ?? raw.serviceType ?? 0);
  const status = typeof raw.status === 'number' ? raw.status : Number(raw.Status ?? raw.status ?? 0);
  return { id, serviceType: Number(serviceType), status: Number(status) };
}

const HUB_LABEL = '[OrderStatusHub]';

/**
 * Подключается к Order Status Hub. Список заказов отображать только если hasReceivedFromHub === true
 * (данные пришли по SignalR). Иначе заказы не показывать.
 */
export function useOrderStatusHub(userId: string | null): {
  activeOrders: ActiveOrderSummary[];
  isConnected: boolean;
  /** true только после получения ReceiveOrders с хаба — тогда можно показывать заказы. */
  hasReceivedFromHub: boolean;
} {
  const [activeOrders, setActiveOrders] = useState<ActiveOrderSummary[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  /** Заказы показывать только когда с хаба пришёл хотя бы один ответ ReceiveOrders. */
  const [hasReceivedFromHub, setHasReceivedFromHub] = useState(false);

  /** Обновить существующий заказ (по id) или добавить новый. Shipped/Cancelled — удаляем из списка. */
  const upsertOrRemoveOrder = useCallback((summary: ActiveOrderSummary) => {
    const { id, status } = summary;

    setActiveOrders((prev) => {
      if (status === OrderStatus.Shipped || status === OrderStatus.Cancelled) {
        return prev.filter((o) => o.id !== id);
      }
      const idx = prev.findIndex((o) => o.id === id);
      if (idx >= 0) {
        return prev.map((o) => (o.id === id ? summary : o));
      }
      return [...prev, summary];
    });
  }, []);

  useEffect(() => {
    setHasReceivedFromHub(false);

    if (userId == null || userId === '') {
      if (typeof console !== 'undefined' && console.info) {
        console.info(HUB_LABEL, 'userId отсутствует, подключение не выполняется');
      }
      setActiveOrders([]);
      setIsConnected(false);
      return;
    }

    const hubUrl = getHubUrl();
    if (typeof console !== 'undefined' && console.info) {
      console.info(HUB_LABEL, 'Подключение к', hubUrl, 'userId:', userId);
    }

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect()
      .build();

    connection.on('ReceiveOrders', (orders: Record<string, unknown>[]) => {
      const list = Array.isArray(orders) ? orders : [];
      if (typeof console !== 'undefined' && console.info) {
        console.info(HUB_LABEL, 'ReceiveOrders:', list.length, 'заказов', list);
      }
      setHasReceivedFromHub(true);
      const normalized = list.map((o) => toActiveOrderSummary(o)).filter((o): o is ActiveOrderSummary => o != null);
      setActiveOrders(normalized);
    });

    connection.on('ReceiveOrderStatus', (summary: Record<string, unknown>) => {
      if (typeof console !== 'undefined' && console.info) {
        console.info(HUB_LABEL, 'ReceiveOrderStatus:', summary);
      }
      const entry = toActiveOrderSummary(summary);
      if (entry) upsertOrRemoveOrder(entry);
    });

    connection
      .start()
      .then(() => {
        if (typeof console !== 'undefined' && console.info) {
          console.info(HUB_LABEL, 'Подключено, вызываю ConnectToOrdersStatuses е');
        }
        setIsConnected(true);
        return connection.invoke('ConnectToOrdersStatuses', userId);
      })
      .then(() => {
        if (typeof console !== 'undefined' && console.info) {
          console.info(HUB_LABEL, 'ConnectToOrdersStatuses выполнен (ожидаем ReceiveOrders)');
        }
      })
      .catch((err) => {
        if (typeof console !== 'undefined' && console.error) {
          console.error(HUB_LABEL, 'Ошибка:', err);
        }
        setIsConnected(false);
      });

    return () => {
      if (typeof console !== 'undefined' && console.info) {
        console.info(HUB_LABEL, 'Отключение');
      }
      connection.off('ReceiveOrders');
      connection.off('ReceiveOrderStatus');
      connection.stop().catch(() => {});
      setIsConnected(false);
      setHasReceivedFromHub(false);
    };
  }, [userId, upsertOrRemoveOrder]);

  return { activeOrders, isConnected, hasReceivedFromHub };
}

const HUB_LABEL_SINGLE = '[OrderStatusHub:single]';

/**
 * Подключается к Order Status Hub только для одного заказа: вызывает ConnectToOrderStatuses(userId, orderId).
 * События ReceiveOrderStatus приходят только по группе userId:orderId.
 * Для страницы checkout одного заказа — не тянем список всех заказов.
 */
export function useOrderStatusForOrder(
  userId: string | null,
  orderId: string | undefined
): { orderStatus: number | null; isConnected: boolean } {
  const [orderStatus, setOrderStatus] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    setOrderStatus(null);

    if (userId == null || userId === '' || orderId == null || orderId === '') {
      if (typeof console !== 'undefined' && console.info) {
        console.info(HUB_LABEL_SINGLE, 'userId или orderId отсутствует');
      }
      setIsConnected(false);
      return;
    }

    const hubUrl = getHubUrl();
    if (typeof console !== 'undefined' && console.info) {
      console.info(HUB_LABEL_SINGLE, 'Подключение к', hubUrl, 'orderId:', orderId);
    }

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect()
      .build();

    connection.on('ReceiveOrderStatus', (summary: Record<string, unknown>) => {
      const id = String(summary?.id ?? summary?.Id ?? '').trim();
      if (id !== orderId) return;
      const status = typeof summary?.status === 'number' ? summary.status : Number(summary?.Status ?? summary?.status ?? 0);
      if (typeof console !== 'undefined' && console.info) {
        console.info(HUB_LABEL_SINGLE, 'ReceiveOrderStatus для заказа', orderId, 'статус', status);
      }
      setOrderStatus(status);
    });

    connection
      .start()
      .then(() => {
        setIsConnected(true);
        return connection.invoke('ConnectToOrderStatuses', userId, orderId);
      })
      .then(() => {
        if (typeof console !== 'undefined' && console.info) {
          console.info(HUB_LABEL_SINGLE, 'ConnectToOrderStatuses выполнен для заказа', orderId);
        }
      })
      .catch((err) => {
        if (typeof console !== 'undefined' && console.error) {
          console.error(HUB_LABEL_SINGLE, 'Ошибка:', err);
        }
        setIsConnected(false);
      });

    return () => {
      if (typeof console !== 'undefined' && console.info) {
        console.info(HUB_LABEL_SINGLE, 'Отключение для заказа', orderId);
      }
      connection.off('ReceiveOrderStatus');
      connection.stop().catch(() => {});
      setIsConnected(false);
    };
  }, [userId, orderId]);

  return { orderStatus, isConnected };
}
