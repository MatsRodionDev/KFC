/**
 * CourierService — учётные записи курьеров, активные заказы и история.
 */

import { getCourierApiBase } from '../config/apiBase';
import { Order } from '../types';
import { DEFAULT_CLIENT_PHONE } from '../utils/phone';
import { loggedFetch } from './loggedFetch';

export type CourierAuth = {
  id: string;
  phone: string;
  displayName: string;
  isOnline: boolean;
};

type CourierOrderItemDto = {
  id: string;
  name: string;
  quantity: number;
};

type CourierOrderDto = {
  id: string;
  orderId: string;
  clientName: string;
  clientPhone: string;
  addressA: string;
  addressB: string;
  price: number;
  distance: string;
  status: Order['status'];
  pickupLatitude: number;
  pickupLongitude: number;
  destinationLatitude: number;
  destinationLongitude: number;
  items: Array<CourierOrderItemDto>;
  createdAt: string;
  completedAt?: string | null;
};

const parseError = async (res: Response): Promise<string> => {
  try {
    const body = await res.json();
    if (typeof body === 'string') return body;
    if (body?.title) return String(body.title);
    if (body?.detail) return String(body.detail);
  } catch {
    /* ignore */
  }
  const text = await res.text().catch(() => '');
  return text || `Ошибка ${res.status}`;
};

export const mapDtoToOrder = (dto: CourierOrderDto): Order => ({
  id: dto.orderId,
  clientName: dto.clientName,
  clientPhone: dto.clientPhone?.trim() || DEFAULT_CLIENT_PHONE,
  addressA: dto.addressA,
  addressB: dto.addressB,
  price: dto.price,
  distance: dto.distance,
  status: dto.status,
  pickupCoords: {
    latitude: dto.pickupLatitude,
    longitude: dto.pickupLongitude,
  },
  destinationCoords: {
    latitude: dto.destinationLatitude,
    longitude: dto.destinationLongitude,
  },
  items: (dto.items ?? []).map(i => ({
    id: i.id,
    name: i.name,
    quantity: i.quantity,
  })),
});

const orderToSaveBody = (order: Order) => ({
  orderId: order.id,
  clientName: order.clientName,
  clientPhone: order.clientPhone,
  addressA: order.addressA,
  addressB: order.addressB,
  price: order.price,
  distance: order.distance,
  status: order.status,
  pickupLatitude: order.pickupCoords.latitude,
  pickupLongitude: order.pickupCoords.longitude,
  destinationLatitude: order.destinationCoords.latitude,
  destinationLongitude: order.destinationCoords.longitude,
  items: order.items.map(i => ({
    id: i.id,
    name: i.name,
    quantity: i.quantity,
  })),
});

export const registerCourier = async (
  phone: string,
  password: string,
  displayName?: string,
): Promise<{ ok: true; data: CourierAuth } | { ok: false; error: string }> => {
  const base = getCourierApiBase();
  const res = await loggedFetch(
    `${base}/api/couriers/register`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ phone, password, displayName }),
    },
    'CourierAPI',
  );
  if (!res.ok) return { ok: false, error: await parseError(res) };
  const data = (await res.json()) as CourierAuth;
  return {
    ok: true,
    data: {
      id: String(data.id),
      phone: data.phone,
      displayName: data.displayName,
      isOnline: data.isOnline,
    },
  };
};

export const loginCourier = async (
  phone: string,
  password: string,
): Promise<{ ok: true; data: CourierAuth } | { ok: false; error: string }> => {
  const base = getCourierApiBase();
  const res = await loggedFetch(
    `${base}/api/couriers/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ phone, password }),
    },
    'CourierAPI',
  );
  if (!res.ok) return { ok: false, error: await parseError(res) };
  const data = (await res.json()) as CourierAuth;
  return {
    ok: true,
    data: {
      id: String(data.id),
      phone: data.phone,
      displayName: data.displayName,
      isOnline: data.isOnline,
    },
  };
};

export const fetchCourierProfile = async (
  courierId: string,
): Promise<CourierAuth | null> => {
  const base = getCourierApiBase();
  const res = await loggedFetch(
    `${base}/api/couriers/${courierId}`,
    { headers: { Accept: 'application/json' } },
    'CourierAPI',
  );
  if (!res.ok) return null;
  const data = (await res.json()) as CourierAuth;
  return {
    id: String(data.id),
    phone: data.phone,
    displayName: data.displayName,
    isOnline: data.isOnline,
  };
};

export const setCourierOnline = async (
  courierId: string,
  isOnline: boolean,
): Promise<CourierAuth | null> => {
  const base = getCourierApiBase();
  const res = await loggedFetch(
    `${base}/api/couriers/${courierId}/online`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ isOnline }),
    },
    'CourierAPI',
  );
  if (!res.ok) return null;
  const data = (await res.json()) as CourierAuth;
  return {
    id: String(data.id),
    phone: data.phone,
    displayName: data.displayName,
    isOnline: data.isOnline,
  };
};

export const fetchCourierOrders = async (
  courierId: string,
  scope: 'active' | 'history',
): Promise<Order[]> => {
  const base = getCourierApiBase();
  const res = await loggedFetch(
    `${base}/api/couriers/${courierId}/orders?scope=${scope}`,
    { headers: { Accept: 'application/json' } },
    'CourierAPI',
  );
  if (!res.ok) return [];
  const data = (await res.json()) as Array<CourierOrderDto>;
  if (!Array.isArray(data)) return [];
  return data.map(mapDtoToOrder);
};

export const saveCourierOrder = async (
  courierId: string,
  order: Order,
): Promise<boolean> => {
  const base = getCourierApiBase();
  const res = await loggedFetch(
    `${base}/api/couriers/${courierId}/orders`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(orderToSaveBody(order)),
    },
    'CourierAPI',
  );
  return res.ok;
};

export const patchCourierOrderStatus = async (
  courierId: string,
  orderId: string,
  status: Order['status'],
): Promise<boolean> => {
  const base = getCourierApiBase();
  const res = await loggedFetch(
    `${base}/api/couriers/${courierId}/orders/${orderId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ status }),
    },
    'CourierAPI',
  );
  return res.ok;
};

export const fetchShownAchievements = async (
  courierId: string,
): Promise<Array<string>> => {
  const base = getCourierApiBase();
  const res = await loggedFetch(
    `${base}/api/couriers/${courierId}/achievements/shown`,
    { headers: { Accept: 'application/json' } },
    'CourierAPI',
  );
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data.map(String) : [];
};

export const fetchCourierRating = async (
  courierId: string,
): Promise<number | null> => {
  const base = getCourierApiBase();
  const res = await loggedFetch(
    `${base}/api/couriers/${courierId}/rating`,
    { headers: { Accept: 'application/json' } },
    'CourierAPI',
  );
  if (!res.ok) return null;
  const data = await res.json();
  return typeof data?.rating === 'number' ? data.rating : null;
};

export const saveShownAchievements = async (
  courierId: string,
  ids: Array<string>,
): Promise<void> => {
  const base = getCourierApiBase();
  await loggedFetch(
    `${base}/api/couriers/${courierId}/achievements/shown`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ achievementIds: ids }),
    },
    'CourierAPI',
  );
};
