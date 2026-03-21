import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getToppingsPaged,
  type ToppingListItem,
  type PagedToppingsResponse,
} from '../api/catalog'
import AddToppingModal from '../components/AddToppingModal'
import './ToppingsPage.css'

const DRINK_TYPES_LIST = ['Tea', 'Coffe', 'HotChocolate', 'Cocktail'] as const
const MAX_NAME_LENGTH = 200

type FilterState = {
  name: string
  availableForDrinkType: string
}

function validatePage(value: unknown): number {
  const n = typeof value === 'string' ? parseInt(value, 10) : Number(value)
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.floor(n)
}

function validateDrinkType(value: unknown): string {
  const s = typeof value === 'string' ? value.trim() : ''
  return DRINK_TYPES_LIST.includes(s as (typeof DRINK_TYPES_LIST)[number]) ? s : ''
}

function sanitizeString(value: unknown, maxLen: number): string {
  const s = typeof value === 'string' ? value.trim() : ''
  return s.slice(0, maxLen)
}

function parseSearchParams(sp: URLSearchParams): { page: number; filters: FilterState } {
  const page = validatePage(sp.get('page'))
  const availableForDrinkType = validateDrinkType(sp.get('availableForDrinkType'))
  return {
    page,
    filters: {
      name: sanitizeString(sp.get('name'), MAX_NAME_LENGTH),
      availableForDrinkType,
    },
  }
}

function buildSearchParams(page: number, filters: FilterState): URLSearchParams {
  const params = new URLSearchParams()
  const safePage = validatePage(page)
  if (safePage > 1) params.set('page', String(safePage))
  const name = sanitizeString(filters.name, MAX_NAME_LENGTH)
  if (name) params.set('name', name)
  const availableForDrinkType = validateDrinkType(filters.availableForDrinkType)
  if (availableForDrinkType) params.set('availableForDrinkType', availableForDrinkType)
  return params
}

const PAGE_SIZE = 20
const PAGINATION_VISIBLE_PAGES = 5
const TABLE_CELL_MAX_LENGTH = 25

function truncateCell(value: string | null | undefined): string {
  if (value == null || value === '') return '—'
  const s = String(value).trim()
  if (s.length <= TABLE_CELL_MAX_LENGTH) return s
  return s.slice(0, TABLE_CELL_MAX_LENGTH) + '...'
}

function getPaginationPages(
  totalPages: number,
  currentPage: number
): (number | 'ellipsis')[] {
  if (totalPages <= 1) return []
  if (totalPages <= PAGINATION_VISIBLE_PAGES + 2) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  const pages: (number | 'ellipsis')[] = []
  const half = Math.floor(PAGINATION_VISIBLE_PAGES / 2)
  let start = Math.max(1, currentPage - half)
  const end = Math.min(totalPages, start + PAGINATION_VISIBLE_PAGES - 1)
  if (end - start + 1 < PAGINATION_VISIBLE_PAGES) {
    start = Math.max(1, end - PAGINATION_VISIBLE_PAGES + 1)
  }
  if (start > 1) {
    pages.push(1)
    if (start > 2) pages.push('ellipsis')
  }
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < totalPages) {
    if (end < totalPages - 1) pages.push('ellipsis')
    pages.push(totalPages)
  }
  return pages
}

function getToppingImageUrl(imageName: string | null): string | null {
  if (!imageName) return null
  return `http://localhost:9000/catalog/${imageName}`
}

export default function ToppingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const parsedFromUrl = useMemo(() => parseSearchParams(searchParams), [searchParams])

  const [data, setData] = useState<PagedToppingsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(parsedFromUrl.page)
  const [formFilters, setFormFilters] = useState(parsedFromUrl.filters)
  const [appliedFilters, setAppliedFilters] = useState(parsedFromUrl.filters)
  const [addModalOpen, setAddModalOpen] = useState(false)

  useEffect(() => {
    setPage(parsedFromUrl.page)
    setAppliedFilters(parsedFromUrl.filters)
    setFormFilters(parsedFromUrl.filters)
  }, [searchParams])

  useEffect(() => {
    const next = buildSearchParams(page, appliedFilters)
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true })
    }
  }, [page, appliedFilters.name, appliedFilters.availableForDrinkType, searchParams])

  const fetchToppings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getToppingsPaged({
        page,
        pageSize: PAGE_SIZE,
        name: appliedFilters.name || undefined,
        availableForDrinkType: appliedFilters.availableForDrinkType || undefined,
      })
      setData(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [page, appliedFilters.name, appliedFilters.availableForDrinkType])

  useEffect(() => {
    fetchToppings()
  }, [fetchToppings])

  const handleApplyFilters = () => {
    setAppliedFilters(formFilters)
    setPage(1)
  }

  const handleResetFilters = () => {
    setFormFilters({ name: '', availableForDrinkType: '' })
    setAppliedFilters({ name: '', availableForDrinkType: '' })
    setPage(1)
  }

  const totalPages = data ? Math.ceil(data.totalCount / PAGE_SIZE) : 0
  const hasPrev = page > 1
  const hasNext = page < totalPages

  return (
    <div className="toppings-page">
      <div className="container toppings-page__inner">
        <header className="toppings-header">
          <div className="toppings-header-left">
            <h1 className="toppings-title">Топинги</h1>
          </div>
          <button
            type="button"
            className="toppings-btn-primary"
            onClick={() => setAddModalOpen(true)}
          >
            Новый топинг
          </button>
        </header>

        <AddToppingModal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onSuccess={fetchToppings}
        />

        <section className="toppings-filters">
          <div className="toppings-filters-grid">
            <div className="toppings-filter-field">
              <label htmlFor="filter-name">Название</label>
              <input
                id="filter-name"
                type="text"
                placeholder="Поиск по названию"
                value={formFilters.name}
                onChange={(e) =>
                  setFormFilters((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="toppings-filter-field">
              <label htmlFor="filter-drinkType">Тип напитка</label>
              <select
                id="filter-drinkType"
                value={formFilters.availableForDrinkType}
                onChange={(e) =>
                  setFormFilters((f) => ({
                    ...f,
                    availableForDrinkType: e.target.value,
                  }))
                }
              >
                <option value="">Все</option>
                {DRINK_TYPES_LIST.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="toppings-filters-footer">
            <span className="toppings-total">
              Всего: {data?.totalCount ?? '—'}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="toppings-btn-primary"
                onClick={handleApplyFilters}
              >
                Применить
              </button>
              <button
                type="button"
                className="toppings-btn-reset"
                onClick={handleResetFilters}
              >
                ✕ Сбросить
              </button>
            </div>
          </div>
        </section>

        <div className="toppings-table-card">
          <div className="toppings-table-wrap">
            {loading ? (
              <div className="toppings-loading">Загрузка…</div>
            ) : error ? (
              <div className="toppings-error">{error}</div>
            ) : (
              <table className="toppings-table">
                <thead>
                  <tr>
                    <th>Картинка</th>
                    <th>ID</th>
                    <th>Название</th>
                    <th>Цена</th>
                    <th>Типы напитков</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.items ?? []).map((row) => (
                    <tr key={row.id}>
                      <td className="toppings-cell-image">
                        <ToppingImage item={row} />
                      </td>
                      <td className="toppings-cell-id">{row.id}</td>
                      <td className="toppings-cell-name" title={row.name}>
                        {truncateCell(row.name)}
                      </td>
                      <td>{Number(row.price).toFixed(2)}</td>
                      <td className="toppings-cell-types">
                        {row.availableForTypes?.length
                          ? row.availableForTypes.join(', ')
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {data && (
            <div className="toppings-pagination">
              <span className="toppings-pagination-info">
                {data.totalCount === 0
                  ? 'Нет записей'
                  : `Стр. ${page} из ${totalPages || 1} · всего ${data.totalCount}`}
              </span>
              <div className="toppings-pagination-btns">
                <button
                  type="button"
                  className="toppings-pagination-arrow"
                  disabled={!hasPrev}
                  onClick={() => setPage(1)}
                  aria-label="В начало"
                >
                  «
                </button>
                <button
                  type="button"
                  className="toppings-pagination-arrow"
                  disabled={!hasPrev}
                  onClick={() => setPage((p) => p - 1)}
                  aria-label="Назад"
                >
                  ‹
                </button>
                {getPaginationPages(totalPages || 1, page).map((p, i) =>
                  p === 'ellipsis' ? (
                    <span
                      key={`ellipsis-${i}`}
                      className="toppings-pagination-ellipsis"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      className={page === p ? 'active' : ''}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  type="button"
                  className="toppings-pagination-arrow"
                  disabled={!hasNext}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Вперёд"
                >
                  ›
                </button>
                <button
                  type="button"
                  className="toppings-pagination-arrow"
                  disabled={!hasNext}
                  onClick={() => setPage(totalPages || 1)}
                  aria-label="В конец"
                >
                  »
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ToppingImage({ item }: { item: ToppingListItem }) {
  const [failed, setFailed] = useState(false)
  const src = !failed ? getToppingImageUrl(item.imageName) : null
  if (src) {
    return <img src={src} alt="" onError={() => setFailed(true)} />
  }
  return (
    <div className="img-placeholder" aria-hidden>
      🥤
    </div>
  )
}
