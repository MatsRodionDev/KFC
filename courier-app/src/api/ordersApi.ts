/**
 * Клиент к OrderService для получения заказов курьером.
 */

const ORDER_API_BASE =
  process.env.EXPO_PUBLIC_ORDER_API_URL ?? 'http://localhost:5046';

// ── Типы OrderService ────────────────────────────────────────────────────────

interface ServerOrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface ServerDelivery {
  serviceType: number; // 0 = ClickCollect, 1 = Delivery
  address?: {
    address?: string;
    coordinates?: { latitude: number; longitude: number };
  };
  storeAddressInfo?: {
    address?: string;
    coordinates?: { latitude: number; longitude: number };
  };
}

interface ServerOrder {
  id: string;
  userId: string;
  totalPrice: number;
  status: number; // 3 = Ready
  delivery: ServerDelivery;
  items: ServerOrderItem[];
}

// ── Маппинг в формат курьерки ────────────────────────────────────────────────

import { Order } from '../types';

// Координаты ресторана по умолчанию (когда VenueService не вернул данные)
const DEFAULT_PICKUP: { latitude: number; longitude: number } = {
  latitude: 53.9,
  longitude: 30.31,
};

function mapServerOrder(s: ServerOrder): Order {
  const deliveryAddress = s.delivery?.address?.address ?? 'Адрес не указан';
  const deliveryCoords = s.delivery?.address?.coordinates ?? {
    latitude: DEFAULT_PICKUP.latitude + 0.01,
    longitude: DEFAULT_PICKUP.longitude + 0.01,
  };

  const pickupAddress =
    s.delivery?.storeAddressInfo?.address ?? 'Ресторан';
  const pickupCoords =
    s.delivery?.storeAddressInfo?.coordinates ?? DEFAULT_PICKUP;

  // Расстояние приблизительное по координатам
  const dx = deliveryCoords.latitude - pickupCoords.latitude;
  const dy = deliveryCoords.longitude - pickupCoords.longitude;
  const distKm = Math.sqrt(dx * dx + dy * dy) * 111;

  return {
    id: s.id,
    clientName: `Клиент ${s.userId.slice(0, 6)}`,
    clientPhone: '',
    addressA: pickupAddress,
    addressB: deliveryAddress,
    price: s.totalPrice,
    distance: `${distKm.toFixed(1)} км`,
    status: 'new',
    pickupCoords,
    destinationCoords: deliveryCoords,
    items: s.items.map(i => ({ id: i.id, name: i.name, quantity: i.quantity })),
  };
}

// ── Публичные функции ────────────────────────────────────────────────────────

/**
 * Загружает заказы со статусом Ready — доступные для принятия курьером.
 */
export async function fetchAvailableOrders(): Promise<Order[]> {
  try {
    const res = await fetch(`${ORDER_API_BASE}/api/orders/available`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return [];
    const data: ServerOrder[] = await res.json();
    return data.map(mapServerOrder);
  } catch {
    return [];
  }
}
