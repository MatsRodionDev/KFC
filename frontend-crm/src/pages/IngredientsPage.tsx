import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getIngredientsPaged,
  type IngredientListItem,
  type PagedIngredientsResponse,
} from '../api/catalog'
import AddIngredientModal from '../components/AddIngredientModal'
import './IngredientsPage.css'

const CATEGORIES_LIST = ['Pizza', 'Burger', 'Basket'] as const
const MAX_NAME_LENGTH = 200

type FilterState = {
  name: string
  isBase: string
  forProductCategory: string
}

function validatePage(value: unknown): number {
  const n = typeof value === 'string' ? parseInt(value, 10) : Number(value)
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.floor(n)
}

function validateCategory(value: unknown): string {
  const s = typeof value === 'string' ? value.trim() : ''
  return CATEGORIES_LIST.includes(s as (typeof CATEGORIES_LIST)[number]) ? s : ''
}

function sanitizeString(value: unknown, maxLen: number): string {
  const s = typeof value === 'string' ? value.trim() : ''
  return s.slice(0, maxLen)
}

function parseSearchParams(sp: URLSearchParams): { page: number; filters: FilterState } {
  const page = validatePage(sp.get('page'))
  const forProductCategory = validateCategory(sp.get('forProductCategory'))
  const isBaseParam = sp.get('isBase')
  let isBase = ''
  if (isBaseParam === 'true') isBase = 'true'
  if (isBaseParam === 'false') isBase = 'false'
  return {
    page,
    filters: {
      name: sanitizeString(sp.get('name'), MAX_NAME_LENGTH),
      isBase,
      forProductCategory,
    },
  }
}

function buildSearchParams(page: number, filters: FilterState): URLSearchParams {
  const params = new URLSearchParams()
  const safePage = validatePage(page)
  if (safePage > 1) params.set('page', String(safePage))
  const name = sanitizeString(filters.name, MAX_NAME_LENGTH)
  if (name) params.set('name', name)
  if (filters.isBase) params.set('isBase', filters.isBase)
  const forProductCategory = validateCategory(filters.forProductCategory)
  if (forProductCategory) params.set('forProductCategory', forProductCategory)
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

function getIngredientImageUrl(imageName: string | null): string | null {
  if (!imageName) return null
  return `http://localhost:9000/catalog/${imageName}`
}

export default function IngredientsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const parsedFromUrl = useMemo(() => parseSearchParams(searchParams), [searchParams])

  const [data, setData] = useState<PagedIngredientsResponse | null>(null)
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
  }, [
    page,
    appliedFilters.name,
    appliedFilters.isBase,
    appliedFilters.forProductCategory,
    searchParams,
  ])

  const fetchIngredients = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getIngredientsPaged({
        page,
        pageSize: PAGE_SIZE,
        name: appliedFilters.name || undefined,
        isBase:
          appliedFilters.isBase === 'true'
            ? true
            : appliedFilters.isBase === 'false'
              ? false
              : undefined,
        forProductCategory: appliedFilters.forProductCategory || undefined,
      })
      setData(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [
    page,
    appliedFilters.name,
    appliedFilters.isBase,
    appliedFilters.forProductCategory,
  ])

  useEffect(() => {
    fetchIngredients()
  }, [fetchIngredients])

  const handleApplyFilters = () => {
    setAppliedFilters(formFilters)
    setPage(1)
  }

  const handleResetFilters = () => {
    setFormFilters({ name: '', isBase: '', forProductCategory: '' })
    setAppliedFilters({ name: '', isBase: '', forProductCategory: '' })
    setPage(1)
  }

  const totalPages = data ? Math.ceil(data.totalCount / PAGE_SIZE) : 0
  const hasPrev = page > 1
  const hasNext = page < totalPages

  return (
    <div className="ingredients-page">
      <div className="container ingredients-page__inner">
        <header className="ingredients-header">
          <div className="ingredients-header-left">
            <h1 className="ingredients-title">Ингредиенты</h1>
          </div>
          <button
            type="button"
            className="ingredients-btn-primary"
            onClick={() => setAddModalOpen(true)}
          >
            Новый ингредиент
          </button>
        </header>

        <AddIngredientModal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onSuccess={fetchIngredients}
        />

        <section className="ingredients-filters">
          <div className="ingredients-filters-grid">
            <div className="ingredients-filter-field">
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
            <div className="ingredients-filter-field">
              <label htmlFor="filter-isBase">Базовый</label>
              <select
                id="filter-isBase"
                value={formFilters.isBase}
                onChange={(e) =>
                  setFormFilters((f) => ({ ...f, isBase: e.target.value }))
                }
              >
                <option value="">Все</option>
                <option value="true">Да</option>
                <option value="false">Нет</option>
              </select>
            </div>
            <div className="ingredients-filter-field">
              <label htmlFor="filter-category">Категория продукта</label>
              <select
                id="filter-category"
                value={formFilters.forProductCategory}
                onChange={(e) =>
                  setFormFilters((f) => ({
                    ...f,
                    forProductCategory: e.target.value,
                  }))
                }
              >
                <option value="">Все</option>
                {CATEGORIES_LIST.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="ingredients-filters-footer">
            <span className="ingredients-total">
              Всего: {data?.totalCount ?? '—'}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="ingredients-btn-primary"
                onClick={handleApplyFilters}
              >
                Применить
              </button>
              <button
                type="button"
                className="ingredients-btn-reset"
                onClick={handleResetFilters}
              >
                ✕ Сбросить
              </button>
            </div>
          </div>
        </section>

        <div className="ingredients-table-card">
          <div className="ingredients-table-wrap">
            {loading ? (
              <div className="ingredients-loading">Загрузка…</div>
            ) : error ? (
              <div className="ingredients-error">{error}</div>
            ) : (
              <table className="ingredients-table">
                <thead>
                  <tr>
                    <th>Картинка</th>
                    <th>ID</th>
                    <th>Название</th>
                    <th>Цена</th>
                    <th>Ккал</th>
                    <th>Вес (г)</th>
                    <th>Базовый</th>
                    <th>Категория</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.items ?? []).map((row) => (
                    <tr key={row.id}>
                      <td className="ingredients-cell-image">
                        <IngredientImage item={row} />
                      </td>
                      <td className="ingredients-cell-id">{row.id}</td>
                      <td className="ingredients-cell-name" title={row.name}>{truncateCell(row.name)}</td>
                      <td>{Number(row.price).toFixed(2)}</td>
                      <td>{row.calories}</td>
                      <td>{row.weight}</td>
                      <td>{row.isBase ? 'Да' : 'Нет'}</td>
                      <td>
                        {row.isBase
                          ? (row.forProductCategory ?? '—')
                          : (row.availableForProductCategories?.length
                              ? row.availableForProductCategories.join(', ')
                              : '—')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {data && (
            <div className="ingredients-pagination">
              <span className="ingredients-pagination-info">
                {data.totalCount === 0
                  ? 'Нет записей'
                  : `Стр. ${page} из ${totalPages || 1} · всего ${data.totalCount}`}
              </span>
              <div className="ingredients-pagination-btns">
                <button
                  type="button"
                  className="ingredients-pagination-arrow"
                  disabled={!hasPrev}
                  onClick={() => setPage(1)}
                  aria-label="В начало"
                >
                  «
                </button>
                <button
                  type="button"
                  className="ingredients-pagination-arrow"
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
                      className="ingredients-pagination-ellipsis"
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
                  className="ingredients-pagination-arrow"
                  disabled={!hasNext}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Вперёд"
                >
                  ›
                </button>
                <button
                  type="button"
                  className="ingredients-pagination-arrow"
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

function IngredientImage({ item }: { item: IngredientListItem }) {
  const [failed, setFailed] = useState(false)
  const src = !failed ? getIngredientImageUrl(item.imageName) : null
  if (src) {
    return <img src={src} alt="" onError={() => setFailed(true)} />
  }
  return (
    <div className="img-placeholder" aria-hidden>
      🍽
    </div>
  )
}
