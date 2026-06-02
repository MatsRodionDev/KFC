import { useState, useEffect, useRef, useCallback } from 'react'
import type { Order } from '../api/orders'
import {
  STATUS_LABELS, STATUS_COLORS,
  fetchAllOrders, startCooking, verifyReady, fetchPickupQr,
} from '../api/orders'
import './OrdersPage.css'

// ─── QR-helper (использует публичный API без зависимостей) ────────────────
function qrUrl(payload: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(payload)}`
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: number }) {
  return (
    <span
      className="status-badge"
      style={{ backgroundColor: STATUS_COLORS[status] ?? '#9e9e9e' }}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

// ─── OrderCard ───────────────────────────────────────────────────────────────
function OrderCard({ order, onRefresh }: { order: Order; onRefresh: () => void }) {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [qr, setQr] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Автозагрузка QR когда заказ Ready
  useEffect(() => {
    if (order.status === 3 && !qr) {
      fetchPickupQr(order.id).then(r => r && setQr(r.qrPayload))
    }
  }, [order.status, order.id])

  const handleStartCooking = async () => {
    setLoading(true)
    setMsg('')
    const ok = await startCooking(order.id)
    setMsg(ok ? '✅ Передано на кухню' : '❌ Ошибка')
    setLoading(false)
    if (ok) setTimeout(onRefresh, 800)
  }

  const handleVerifyReady = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setMsg('⏳ CV проверяет фото… (первый запрос загружает модель YOLO, ~30-60 сек)')
    const result = await verifyReady(order.id, file)
    setMsg(result.success ? `✅ ${result.message}` : `❌ ${result.message}`)
    setLoading(false)
    if (fileRef.current) fileRef.current.value = ''
    if (result.success) setTimeout(onRefresh, 800)
  }

  const deliveryAddr = order.delivery?.address?.address ?? '—'
  const pickupAddr   = order.delivery?.storeAddressInfo?.address?.address ?? 'Ресторан'

  return (
    <div className="order-card">
      <div className="order-card-header">
        <div className="order-id">#{order.id.slice(0, 8).toUpperCase()}</div>
        <StatusBadge status={order.status} />
        <div className="order-price">{order.totalPrice.toFixed(0)} ₽</div>
      </div>

      <div className="order-addresses">
        <div><span className="addr-label">А:</span> {pickupAddr}</div>
        <div><span className="addr-label">Б:</span> {deliveryAddr}</div>
      </div>

      <div className="order-items">
        {order.items.map(i => (
          <span key={i.id} className="item-chip">{i.name} ×{i.quantity}</span>
        ))}
      </div>

      {/* Действия */}
      <div className="order-actions">
        {/* Paid → Cooking */}
        {order.status === 1 && (
          <button className="btn btn-cook" onClick={handleStartCooking} disabled={loading}>
            🍳 Начать готовку
          </button>
        )}

        {/* Cooking → Ready (загрузка фото) */}
        {order.status === 2 && (
          <>
            <button
              className="btn btn-verify"
              onClick={() => fileRef.current?.click()}
              disabled={loading}
            >
              📷 Фото заказа → Ready
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={handleVerifyReady}
            />
          </>
        )}

        {/* Ready — показываем QR */}
        {order.status === 3 && qr && (
          <div className="qr-block">
            <p className="qr-label">QR для курьера:</p>
            <img src={qrUrl(qr)} alt="QR код" className="qr-img" />
          </div>
        )}
        {order.status === 3 && !qr && (
          <button className="btn btn-qr" onClick={() =>
            fetchPickupQr(order.id).then(r => r && setQr(r.qrPayload))
          }>
            🔄 Загрузить QR
          </button>
        )}
      </div>

      {msg && <div className="order-msg">{msg}</div>}
    </div>
  )
}

// ─── OrdersPage ───────────────────────────────────────────────────────────────
const GROUP_ORDER = [1, 2, 3] // Paid, Cooking, Ready
const GROUP_LABELS: Record<number, string> = {
  1: '💳 Оплачены',
  2: '🍳 Готовятся',
  3: '✅ Готовы к выдаче',
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState('')

  const load = useCallback(async () => {
    const data = await fetchAllOrders()
    setOrders(data)
    setLastUpdate(new Date().toLocaleTimeString('ru-RU'))
    setLoading(false)
  }, [])

  // Первичная загрузка + автообновление каждые 10 сек
  useEffect(() => {
    load()
    const timer = setInterval(load, 10_000)
    return () => clearInterval(timer)
  }, [load])

  const grouped = GROUP_ORDER.map(status => ({
    status,
    items: orders.filter(o => o.status === status),
  }))

  if (loading) {
    return <div className="orders-loading">Загрузка заказов…</div>
  }

  return (
    <div className="orders-page">
      <div className="orders-toolbar">
        <h1 className="orders-title">Управление заказами</h1>
        <div className="orders-meta">
          <span className="orders-count">{orders.length} активных</span>
          <span className="orders-updated">обновлено {lastUpdate}</span>
          <button className="btn btn-refresh" onClick={load}>↻ Обновить</button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="orders-empty">
          <p>Активных заказов нет</p>
          <p className="orders-empty-hint">Новые заказы появятся автоматически</p>
        </div>
      ) : (
        <div className="orders-columns">
          {grouped.map(({ status, items }) => (
            <div key={status} className="orders-column">
              <div className="column-header" style={{ borderColor: STATUS_COLORS[status] }}>
                <span>{GROUP_LABELS[status]}</span>
                <span className="column-count">{items.length}</span>
              </div>
              <div className="column-cards">
                {items.length === 0 ? (
                  <div className="column-empty">Нет заказов</div>
                ) : (
                  items.map(o => (
                    <OrderCard key={o.id} order={o} onRefresh={load} />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
