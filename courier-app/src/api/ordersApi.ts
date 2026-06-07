/**
 * Клиент к OrderService для получения заказов курьером.
 */

import { getOrderApiBase } from '../config/apiBase';
import { logger } from '../utils/logger';
import { Order } from '../types';
import { DEFAULT_CLIENT_PHONE } from '../utils/phone';
import { loggedFetch } from './loggedFetch';

interface GeoPoint {
  address?: string;
  coordinates?: { latitude: number; longitude: number };
}

interface StoreAddressInfo {
  storeId?: string;
  address?: string | GeoPoint;
  coordinates?: { latitude: number; longitude: number };
}

interface ServerOrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface ServerDelivery {
  serviceType: number;
  address?: GeoPoint;
  storeAddressInfo?: StoreAddressInfo;
}

interface ServerOrder {
  id: string;
  userId: string;
  totalPrice: number;
  status: number;
  delivery: ServerDelivery;
  items?: ServerOrderItem[];
}

const DEFAULT_PICKUP: { latitude: number; longitude: number } = {
  latitude: 53.9,
  longitude: 30.31,
};

const resolveGeo = (
  node?: string | GeoPoint | null,
  fallback = DEFAULT_PICKUP,
): { label: string; coords: { latitude: number; longitude: number } } => {
  if (!node) {
    return { label: 'Адрес не указан', coords: fallback };
  }
  if (typeof node === 'string') {
    return { label: node, coords: fallback };
  }
  return {
    label: node.address ?? 'Адрес не указан',
    coords: node.coordinates ?? fallback,
  };
};

const resolveStorePickup = (
  store?: StoreAddressInfo,
): { label: string; coords: { latitude: number; longitude: number } } => {
  if (!store) {
    return { label: 'Ресторан', coords: DEFAULT_PICKUP };
  }
  if (store.address && typeof store.address === 'object') {
    const geo = resolveGeo(store.address, DEFAULT_PICKUP);
    return { label: geo.label || 'Ресторан', coords: geo.coords };
  }
  if (typeof store.address === 'string') {
    return {
      label: store.address,
      coords: store.coordinates ?? DEFAULT_PICKUP,
    };
  }
  return {
    label: 'Ресторан',
    coords: store.coordinates ?? DEFAULT_PICKUP,
  };
};

function mapServerOrder(s: ServerOrder): Order {
  const delivery = resolveGeo(s.delivery?.address, {
    latitude: DEFAULT_PICKUP.latitude + 0.01,
    longitude: DEFAULT_PICKUP.longitude + 0.01,
  });
  const pickup = resolveStorePickup(s.delivery?.storeAddressInfo);

  const dx = delivery.coords.latitude - pickup.coords.latitude;
  const dy = delivery.coords.longitude - pickup.coords.longitude;
  const distKm = Math.sqrt(dx * dx + dy * dy) * 111;

  const userLabel = s.userId?.includes('|')
    ? s.userId.split('|').pop()?.slice(0, 8) ?? s.userId
    : (s.userId?.slice(0, 8) ?? '—');

  return {
    id: s.id,
    clientName: `Клиент ${userLabel}`,
    clientPhone: DEFAULT_CLIENT_PHONE,
    addressA: pickup.label,
    addressB: delivery.label,
    price: s.totalPrice,
    distance: `${distKm.toFixed(1)} км`,
    status: 'new',
    pickupCoords: pickup.coords,
    destinationCoords: delivery.coords,
    items: (s.items ?? []).map(i => ({
      id: i.id,
      name: i.name,
      quantity: i.quantity,
    })),
  };
}

export type FetchAvailableOrdersResult = {
  orders: Order[];
  error?: string;
};

/**
 * Загружает заказы со статусом Ready — доступные для принятия курьером.
 */
export async function fetchAvailableOrders(): Promise<FetchAvailableOrdersResult> {
  const base = getOrderApiBase();
  const url = `${base}/api/orders/available`;

  try {
    const res = await loggedFetch(
      url,
      { headers: { Accept: 'application/json' } },
      'OrderAPI',
    );

    if (!res.ok) {
      const text = await res.text();
      return {
        orders: [],
        error: `Сервер ответил ${res.status}: ${text || 'без тела'}`,
      };
    }

    const data = (await res.json()) as ServerOrder[];
    if (!Array.isArray(data)) {
      return { orders: [], error: 'Неверный формат ответа (ожидался массив)' };
    }

    const orders: Order[] = [];
    for (const row of data) {
      try {
        orders.push(mapServerOrder(row));
      } catch (e) {
        logger.warn('OrderAPI', 'пропуск заказа при маппинге', { id: row?.id, e });
      }
    }

    return { orders };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'Не удалось подключиться к OrderService';
    return {
      orders: [],
      error: `${message}. URL: ${url}. На телефоне localhost не работает — проверьте EXPO_PUBLIC_ORDER_API_URL или Wi‑Fi.`,
    };
  }
}
