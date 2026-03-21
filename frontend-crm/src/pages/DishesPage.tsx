import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getProductsPaged, type ProductListItem, type PagedProductsResponse } from '../api/catalog'
import AddProductModal from '../components/AddProductModal'
import './DishesPage.css'

const PRODUCT_CATEGORIES_LIST = ['Pizza', 'Burger', 'Basket'] as const
const MAX_LENGTH = { name: 200, description: 300, userId: 100 }

type FilterState = {
  name: string
  description: string
  productCategory: string
  userId: string
}

function validatePage(value: unknown): number {
  const n = typeof value === 'string' ? parseInt(value, 10) : Number(value)
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.floor(n)
}

function validateCategory(value: unknown): string {
  const s = typeof value === 'string' ? value.trim() : ''
  return PRODUCT_CATEGORIES_LIST.includes(s as (typeof PRODUCT_CATEGORIES_LIST)[number]) ? s : ''
}

function sanitizeString(value: unknown, maxLen: number): string {
  const s = typeof value === 'string' ? value.trim() : ''
  return s.slice(0, maxLen)
}

function parseSearchParams(sp: URLSearchParams): { page: number; filters: FilterState } {
  const page = validatePage(sp.get('page'))
  const productCategory = validateCategory(sp.get('productCategory'))
  return {
    page,
    filters: {
      name: sanitizeString(sp.get('name'), MAX_LENGTH.name),
      description: sanitizeString(sp.get('description'), MAX_LENGTH.description),
      productCategory,
      userId: sanitizeString(sp.get('userId'), MAX_LENGTH.userId),
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
  const productCategory = validateCategory(filters.productCategory)
  if (productCategory) params.set('productCategory', productCategory)
  const userId = sanitizeString(filters.userId, MAX_LENGTH.userId)
  if (userId) params.set('userId', userId)
  return params
}

const PAGE_SIZE = 20
const PRODUCT_CATEGORIES = ['Pizza', 'Burger', 'Basket'] as const
const PAGINATION_VISIBLE_PAGES = 5
const TABLE_CELL_MAX_LENGTH = 25

function truncateCell(value: string | null | undefined): string {
  if (value == null || value === '') return '—'
  const s = String(value).trim()
  if (s.length <= TABLE_CELL_MAX_LENGTH) return s
  return s.slice(0, TABLE_CELL_MAX_LENGTH) + '...'
}

/** Формирует массив номеров страниц для пагинации с многоточием */
function getPaginationPages(totalPages: number, currentPage: number): (number | 'ellipsis')[] {
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

/** URL изображения продукта — как в сервисе frontend (MinIO bucket catalog) */
function getProductImageUrl(imageName: string | null): string | null {
  if (!imageName) return null
  return `http://localhost:9000/catalog/${imageName}`
}

/** Базовое изображение по категории — как во frontend (ProductCard, ProductPage) */
function getFallbackEmoji(productCategory: string): string {
  const category = productCategory || ''
  if (category === 'Pizza' || category === '0') return '🍕'
  if (category === 'Burger' || category === '1') return '🍔'
  return '🧺'
}

export default function DishesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const parsedFromUrl = useMemo(() => parseSearchParams(searchParams), [searchParams])

  const [data, setData] = useState<PagedProductsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(parsedFromUrl.page)
  const [formFilters, setFormFilters] = useState(parsedFromUrl.filters)
  const [appliedFilters, setAppliedFilters] = useState(parsedFromUrl.filters)

  // Синхронизация URL -> state (навигация назад/вперёд или прямая ссылка)
  useEffect(() => {
    setPage(parsedFromUrl.page)
    setAppliedFilters(parsedFromUrl.filters)
    setFormFilters(parsedFromUrl.filters)
  }, [searchParams])

  // Синхронизация state -> URL при смене страницы или применённых фильтров
  useEffect(() => {
    const next = buildSearchParams(page, appliedFilters)
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true })
    }
  }, [page, appliedFilters.name, appliedFilters.description, appliedFilters.productCategory, appliedFilters.userId, searchParams])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getProductsPaged({
        page,
        pageSize: PAGE_SIZE,
        name: appliedFilters.name || undefined,
        description: appliedFilters.description || undefined,
        productCategory: appliedFilters.productCategory || undefined,
        userId: appliedFilters.userId || undefined,
      })
      setData(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [page, appliedFilters.name, appliedFilters.description, appliedFilters.productCategory, appliedFilters.userId])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleApplyFilters = () => {
    setAppliedFilters(formFilters)
    setPage(1)
  }

  const handleResetFilters = () => {
    setFormFilters({ name: '', description: '', productCategory: '', userId: '' })
    setAppliedFilters({ name: '', description: '', productCategory: '', userId: '' })
    setPage(1)
  }

  const totalPages = data ? Math.ceil(data.totalCount / PAGE_SIZE) : 0
  const hasPrev = page > 1
  const hasNext = page < totalPages
  const [addModalOpen, setAddModalOpen] = useState(false)

  return (
    <div className="dishes-page">
      <div className="container dishes-page__inner">
      <header className="dishes-header">
        <div className="dishes-header-left">
          <h1 className="dishes-title">Блюда</h1>
        </div>
        <button
          type="button"
          className="dishes-btn-primary"
          onClick={() => setAddModalOpen(true)}
        >
          Новое блюдо
        </button>
      </header>

      <AddProductModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={fetchProducts}
      />

      <section className="dishes-filters">
        <div className="dishes-filters-grid">
          <div className="dishes-filter-field">
            <label htmlFor="filter-name">Название</label>
            <input
              id="filter-name"
              type="text"
              placeholder="Поиск по названию"
              value={formFilters.name}
              onChange={(e) => setFormFilters((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="dishes-filter-field">
            <label htmlFor="filter-description">Описание</label>
            <input
              id="filter-description"
              type="text"
              placeholder="Поиск по описанию"
              value={formFilters.description}
              onChange={(e) => setFormFilters((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="dishes-filter-field">
            <label htmlFor="filter-category">Категория продукта</label>
            <select
              id="filter-category"
              value={formFilters.productCategory}
              onChange={(e) => setFormFilters((f) => ({ ...f, productCategory: e.target.value }))}
            >
              <option value="">Все</option>
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="dishes-filter-field">
            <label htmlFor="filter-userId">ID пользователя</label>
            <input
              id="filter-userId"
              type="text"
              placeholder="UserId"
              value={formFilters.userId}
              onChange={(e) => setFormFilters((f) => ({ ...f, userId: e.target.value }))}
            />
          </div>
        </div>
        <div className="dishes-filters-footer">
          <span className="dishes-total">
            Всего: {data?.totalCount ?? '—'}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="dishes-btn-primary" onClick={handleApplyFilters}>
              Применить
            </button>
            <button type="button" className="dishes-btn-reset" onClick={handleResetFilters}>
              ✕ Сбросить
            </button>
          </div>
        </div>
      </section>

      <div className="dishes-table-card">
        <div className="dishes-table-wrap">
          {loading ? (
            <div className="dishes-loading">Загрузка…</div>
          ) : error ? (
            <div className="dishes-error">{error}</div>
          ) : (
            <table className="dishes-table">
              <thead>
                <tr>
                  <th>Картинка</th>
                  <th>ID</th>
                  <th>Название</th>
                  <th>Описание</th>
                  <th>Цена</th>
                  <th>Категория</th>
                  <th>UserId</th>
                  <th>Ингредиентов</th>
                </tr>
              </thead>
              <tbody>
                {(data?.items ?? []).map((row) => (
                  <tr key={row.id}>
                    <td className="dishes-cell-image">
                      <ProductImage item={row} />
                    </td>
                    <td className="dishes-cell-id">{row.id}</td>
                    <td className="dishes-cell-name" title={row.name}>{truncateCell(row.name)}</td>
                    <td className="dishes-cell-name" title={row.description}>{truncateCell(row.description)}</td>
                    <td>{row.price != null ? Number(row.price).toFixed(2) : '—'}</td>
                    <td>{row.productCategory}</td>
                    <td className="dishes-cell-id">{row.userId ?? '—'}</td>
                    <td>{row.ingredientsCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {data && (
          <div className="dishes-pagination">
            <span className="dishes-pagination-info">
              {data.totalCount === 0
                ? 'Нет записей'
                : `Стр. ${page} из ${totalPages || 1} · всего ${data.totalCount}`}
            </span>
            <div className="dishes-pagination-btns">
              <button
                type="button"
                className="dishes-pagination-arrow"
                disabled={!hasPrev}
                onClick={() => setPage(1)}
                aria-label="В начало"
              >
                «
              </button>
              <button
                type="button"
                className="dishes-pagination-arrow"
                disabled={!hasPrev}
                onClick={() => setPage((p) => p - 1)}
                aria-label="Назад"
              >
                ‹
              </button>
              {getPaginationPages(totalPages || 1, page).map((p, i) =>
                p === 'ellipsis' ? (
                  <span key={`ellipsis-${i}`} className="dishes-pagination-ellipsis">
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
                className="dishes-pagination-arrow"
                disabled={!hasNext}
                onClick={() => setPage((p) => p + 1)}
                aria-label="Вперёд"
              >
                ›
              </button>
              <button
                type="button"
                className="dishes-pagination-arrow"
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

function ProductImage({ item }: { item: ProductListItem }) {
  const [failed, setFailed] = useState(false)
  const src = !failed ? getProductImageUrl(item.imageName) : null
  if (src) {
    return (
      <img
        src={src}
        alt=""
        onError={() => setFailed(true)}
      />
    )
  }
  return (
    <div className="img-placeholder" aria-hidden>
      {getFallbackEmoji(item.productCategory)}
    </div>
  )
}
