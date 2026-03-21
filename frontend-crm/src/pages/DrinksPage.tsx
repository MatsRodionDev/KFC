import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getDrinksPaged,
  type DrinkListItem,
  type PagedDrinksResponse,
} from '../api/catalog'
import AddDrinkModal from '../components/AddDrinkModal'
import './DrinksPage.css'

const DRINK_TYPES_LIST = ['Tea', 'Coffe', 'HotChocolate', 'Cocktail'] as const
const MAX_LENGTH = { name: 200, description: 300 }

type FilterState = {
  name: string
  description: string
  type: string
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
  const type = validateDrinkType(sp.get('type'))
  return {
    page,
    filters: {
      name: sanitizeString(sp.get('name'), MAX_LENGTH.name),
      description: sanitizeString(sp.get('description'), MAX_LENGTH.description),
      type,
    },
  }
}

function buildSearchParams(page: number, filters: FilterState): URLSearchParams {
  const params = new URLSearchParams()
  const safePage = validatePage(page)
  if (safePage > 1) params.set('page', String(safePage))
  const name = sanitizeString(filters.name, MAX_LENGTH.name)
  if (name) params.set('name', name)
  const description = sanitizeString(filters.description, MAX_LENGTH.description)
  if (description) params.set('description', description)
  const type = validateDrinkType(filters.type)
  if (type) params.set('type', type)
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

function getDrinkImageUrl(imageName: string | null): string | null {
  if (!imageName) return null
  return `http://localhost:9000/catalog/${imageName}`
}

export default function DrinksPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const parsedFromUrl = useMemo(() => parseSearchParams(searchParams), [searchParams])

  const [data, setData] = useState<PagedDrinksResponse | null>(null)
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
  }, [page, appliedFilters.name, appliedFilters.description, appliedFilters.type, searchParams])

  const fetchDrinks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getDrinksPaged({
        page,
        pageSize: PAGE_SIZE,
        name: appliedFilters.name || undefined,
        description: appliedFilters.description || undefined,
        type: appliedFilters.type || undefined,
      })
      setData(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [page, appliedFilters.name, appliedFilters.description, appliedFilters.type])

  useEffect(() => {
    fetchDrinks()
  }, [fetchDrinks])

  const handleApplyFilters = () => {
    setAppliedFilters(formFilters)
    setPage(1)
  }

  const handleResetFilters = () => {
    setFormFilters({ name: '', description: '', type: '' })
    setAppliedFilters({ name: '', description: '', type: '' })
    setPage(1)
  }

  const totalPages = data ? Math.ceil(data.totalCount / PAGE_SIZE) : 0
  const hasPrev = page > 1
  const hasNext = page < totalPages

  return (
    <div className="drinks-page">
      <div className="container drinks-page__inner">
        <header className="drinks-header">
          <div className="drinks-header-left">
            <h1 className="drinks-title">Напитки</h1>
          </div>
          <button
            type="button"
            className="drinks-btn-primary"
            onClick={() => setAddModalOpen(true)}
          >
            Новый напиток
          </button>
        </header>

        <AddDrinkModal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onSuccess={fetchDrinks}
        />

        <section className="drinks-filters">
          <div className="drinks-filters-grid">
            <div className="drinks-filter-field">
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
            <div className="drinks-filter-field">
              <label htmlFor="filter-description">Описание</label>
              <input
                id="filter-description"
                type="text"
                placeholder="Поиск по описанию"
                value={formFilters.description}
                onChange={(e) =>
                  setFormFilters((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div className="drinks-filter-field">
              <label htmlFor="filter-type">Тип напитка</label>
              <select
                id="filter-type"
                value={formFilters.type}
                onChange={(e) =>
                  setFormFilters((f) => ({ ...f, type: e.target.value }))
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
          <div className="drinks-filters-footer">
            <span className="drinks-total">
              Всего: {data?.totalCount ?? '—'}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="drinks-btn-primary"
                onClick={handleApplyFilters}
              >
                Применить
              </button>
              <button
                type="button"
                className="drinks-btn-reset"
                onClick={handleResetFilters}
              >
                ✕ Сбросить
              </button>
            </div>
          </div>
        </section>

        <div className="drinks-table-card">
          <div className="drinks-table-wrap">
            {loading ? (
              <div className="drinks-loading">Загрузка…</div>
            ) : error ? (
              <div className="drinks-error">{error}</div>
            ) : (
              <table className="drinks-table">
                <thead>
                  <tr>
                    <th>Картинка</th>
                    <th>ID</th>
                    <th>Название</th>
                    <th>Описание</th>
                    <th>Цена</th>
                    <th>Тип</th>
                    <th>Топингов</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.items ?? []).map((row) => (
                    <tr key={row.id}>
                      <td className="drinks-cell-image">
                        <DrinkImage item={row} />
                      </td>
                      <td className="drinks-cell-id">{row.id}</td>
                      <td className="drinks-cell-name" title={row.name}>
                        {truncateCell(row.name)}
                      </td>
                      <td className="drinks-cell-name" title={row.description}>
                        {truncateCell(row.description)}
                      </td>
                      <td>{Number(row.price).toFixed(2)}</td>
                      <td>{row.type || '—'}</td>
                      <td>{row.toppingsCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {data && (
            <div className="drinks-pagination">
              <span className="drinks-pagination-info">
                {data.totalCount === 0
                  ? 'Нет записей'
                  : `Стр. ${page} из ${totalPages || 1} · всего ${data.totalCount}`}
              </span>
              <div className="drinks-pagination-btns">
                <button
                  type="button"
                  className="drinks-pagination-arrow"
                  disabled={!hasPrev}
                  onClick={() => setPage(1)}
                  aria-label="В начало"
                >
                  «
                </button>
                <button
                  type="button"
                  className="drinks-pagination-arrow"
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
                      className="drinks-pagination-ellipsis"
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
                  className="drinks-pagination-arrow"
                  disabled={!hasNext}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Вперёд"
                >
                  ›
                </button>
                <button
                  type="button"
                  className="drinks-pagination-arrow"
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

function DrinkImage({ item }: { item: DrinkListItem }) {
  const [failed, setFailed] = useState(false)
  const src = !failed ? getDrinkImageUrl(item.imageName) : null
  if (src) {
    return <img src={src} alt="" onError={() => setFailed(true)} />
  }
  return (
    <div className="img-placeholder" aria-hidden>
      🥤
    </div>
  )
}
