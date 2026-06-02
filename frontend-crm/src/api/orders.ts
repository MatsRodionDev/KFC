// ── Типы ────────────────────────────────────────────────────────────────────

export interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
}

interface AddressObject {
  address?: string
  coordinates?: { latitude: number; longitude: number }
}

export interface Order {
  id: string
  userId: string
  totalPrice: number
  status: number // 0=Created 1=Paid 2=Cooking 3=Ready 4=Shipped 5=Cancelled 6=Delivered
  delivery: {
    serviceType: number
    address?: AddressObject
    storeAddressInfo?: {
      storeId?: string
      address?: AddressObject
    }
  }
  items: OrderItem[]
  pickupToken?: string | null
}

export const STATUS_LABELS: Record<number, string> = {
  0: 'Создан',
  1: 'Оплачен',
  2: 'Готовится',
  3: 'Готов',
  4: 'Отправлен',
  5: 'Отменён',
}

export const STATUS_COLORS: Record<number, string> = {
  0: '#9e9e9e',
  1: '#2196f3',
  2: '#ff9800',
  3: '#4caf50',
  4: '#9c27b0',
  5: '#f44336',
}

// ── Запросы ──────────────────────────────────────────────────────────────────

// Получить все активные заказы (не отменённые, не отправленные)
export async function fetchActiveOrders(): Promise<Order[]> {
  const res = await fetch('/api/orders/available')
  if (!res.ok) return []
  return res.json()
}

// Все заказы (Paid + Cooking + Ready)
export async function fetchAllOrders(): Promise<Order[]> {
  // Используем getAvailableOrders как основу — добавим Paid и Cooking
  const res = await fetch('/api/orders/kitchen')
  if (!res.ok) {
    // Fallback: пробуем available
    const r2 = await fetch('/api/orders/available')
    if (!r2.ok) return []
    return r2.json()
  }
  return res.json()
}

// Перевести в Cooking
export async function startCooking(orderId: string): Promise<boolean> {
  const res = await fetch(`/api/orders/${orderId}/start-cooking`, {
    method: 'POST',
  })
  return res.ok
}

// Верификация фото (CV) → Ready
export async function verifyReady(
  orderId: string,
  file: File,
): Promise<{ success: boolean; message: string }> {
  const form = new FormData()
  form.append('image', file)
  const res = await fetch(`/api/orders/${orderId}/verify-ready`, {
    method: 'POST',
    body: form,
  })
  const data = await res.json().catch(() => ({}))
  return { success: res.ok, message: data.message ?? (res.ok ? 'Готово' : 'Ошибка') }
}

// Получить QR-payload для заказа
export async function fetchPickupQr(
  orderId: string,
): Promise<{ qrPayload: string; token: string } | null> {
  const res = await fetch(`/api/orders/${orderId}/pickup-qr`)
  if (!res.ok) return null
  return res.json()
}
