/**
 * Клиент к OrderService для операций курьера.
 */

import { getOrderApiBase } from '../config/apiBase';
import { loggedFetch } from './loggedFetch';

export interface ConfirmPickupResponse {
  message: string;
}

/**
 * Подтверждает получение заказа по QR-токену.
 * Переводит заказ Ready → Shipped на сервере.
 *
 * @param orderId  ID заказа из карточки
 * @param token    Строка, отсканированная из QR-кода
 */
export async function confirmPickup(
  orderId: string,
  token: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await loggedFetch(
      `${getOrderApiBase()}/api/orders/${orderId}/confirm-pickup`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      },
      'OrderAPI',
    );

    const data = await res.json();

    if (res.ok) {
      return { success: true, message: data.message ?? 'Заказ принят.' };
    }

    return {
      success: false,
      message: data.message ?? `Ошибка сервера (${res.status}).`,
    };
  } catch {
    // Сеть недоступна — не блокируем курьера
    return {
      success: true,
      message: 'Сервер недоступен. Получение принято локально.',
    };
  }
}

/**
 * Парсит payload QR-кода формата "delivery-pickup:{orderId}:{token}".
 * Возвращает токен или null если формат не совпадает.
 */
export function parseQrPayload(
  raw: string,
  expectedOrderId: string,
): string | null {
  // Формат: delivery-pickup:<orderId>:<token>
  const PREFIX = 'delivery-pickup:';
  if (!raw.startsWith(PREFIX)) return null;

  const rest = raw.slice(PREFIX.length);
  const colonIdx = rest.indexOf(':');
  if (colonIdx === -1) return null;

  const orderId = rest.slice(0, colonIdx);
  const token = rest.slice(colonIdx + 1);

  if (orderId !== expectedOrderId) return null;
  if (!token) return null;

  return token;
}

/**
 * Подтверждает доставку на сервере после CV-верификации фото.
 * Переводит заказ Shipped → Delivered в OrderService.
 */
export async function confirmDelivery(
  orderId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await loggedFetch(
      `${getOrderApiBase()}/api/orders/${orderId}/confirm-delivery`,
      { method: 'POST' },
      'OrderAPI',
    );
    const data = await res.json().catch(() => ({}));
    return {
      success: res.ok,
      message: data.message ?? (res.ok ? 'Доставка подтверждена.' : 'Ошибка сервера.'),
    };
  } catch {
    // Сеть недоступна — не блокируем курьера
    return { success: true, message: 'Принято локально.' };
  }
}
