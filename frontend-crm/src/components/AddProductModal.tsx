import { useState, useEffect } from 'react'
import {
  getIngredientsByCategory,
  addProduct,
  type Ingredient,
} from '../api/catalog'
import './AddProductModal.css'

const PRODUCT_CATEGORIES = [
  { value: 'Pizza', label: 'Пицца' },
  { value: 'Burger', label: 'Бургер' },
  { value: 'Basket', label: 'Корзина' },
] as const

type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]['value']

function getIngredientImageUrl(imageName: string | null): string | null {
  if (!imageName) return null
  return `http://localhost:9000/catalog/${imageName}`
}

function IngredientThumb({
  name,
  imageName,
  id: _id,
  onClick,
}: {
  name: string
  imageName: string | null
  id: string
  onClick?: () => void
}) {
  const [imgFailed, setImgFailed] = useState(false)
  const src = !imgFailed ? getIngredientImageUrl(imageName) : null
  const content = (
    <>
      <div className="add-product-ingredient-thumb-img">
        {src ? (
          <img
            src={src}
            alt=""
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span className="add-product-ingredient-thumb-placeholder">🍽</span>
        )}
      </div>
      <span className="add-product-ingredient-thumb-name">{name}</span>
    </>
  )
  if (onClick) {
    return (
      <button
        type="button"
        className="add-product-ingredient-picker-card"
        onClick={onClick}
      >
        {content}
      </button>
    )
  }
  return <div className="add-product-ingredient-display-inner">{content}</div>
}

interface IngredientRow {
  ingredientId: string
  quantity: number
  minQuantity: number
  maxQuantity: number
}

interface AddProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddProductModal({
  isOpen,
  onClose,
  onSuccess,
}: AddProductModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState<string>('')
  const [productCategory, setProductCategory] = useState<ProductCategory>('Pizza')
  const [baseIngredientId, setBaseIngredientId] = useState<string>('')
  const [ingredients, setIngredients] = useState<IngredientRow[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [ingredientsCatalog, setIngredientsCatalog] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingIngredients, setLoadingIngredients] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    setLoadingIngredients(true)
    setError(null)
    getIngredientsByCategory(productCategory)
      .then(setIngredientsCatalog)
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки ингредиентов'))
      .finally(() => setLoadingIngredients(false))
  }, [isOpen, productCategory])

  const baseIngredients = ingredientsCatalog.filter((i) => i.isBase)
  const otherIngredients = ingredientsCatalog.filter((i) => !i.isBase)
  const addedIds = new Set(ingredients.map((r) => r.ingredientId))
  const availableToAdd = otherIngredients.filter((ing) => !addedIds.has(ing.id))

  const openPicker = () => setPickerOpen(true)
  const closePicker = () => setPickerOpen(false)

  const handleSelectIngredient = (ing: Ingredient) => {
    setIngredients((prev) => [
      ...prev,
      {
        ingredientId: ing.id,
        quantity: 1,
        minQuantity: 0,
        maxQuantity: 10,
      },
    ])
    closePicker()
  }

  const getIngredientById = (id: string) => ingredientsCatalog.find((i) => i.id === id)

  const handleRemoveIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index))
  }

  const handleIngredientChange = (
    index: number,
    field: keyof IngredientRow,
    value: string | number
  ) => {
    setIngredients((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    )
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setPrice('')
    setProductCategory('Pizza')
    setBaseIngredientId('')
    setIngredients([])
    setImageFile(null)
    setError(null)
    setPickerOpen(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!name.trim() || !description.trim()) {
      setError('Заполните название и описание')
      return
    }
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('Name', name.trim())
      formData.append('Description', description.trim())
      formData.append('Price', price.trim() === '' ? '' : String(price.trim()))
      formData.append(
        'ProductCategory',
        String(PRODUCT_CATEGORIES.findIndex((c) => c.value === productCategory))
      )

      if (baseIngredientId) {
        formData.append('BaseIngredient.IngredientId', baseIngredientId)
        formData.append('BaseIngredient.Quantity', '1')
        formData.append('BaseIngredient.MinQuantity', '1')
        formData.append('BaseIngredient.MaxQuantity', '1')
      }

      ingredients.forEach((row, i) => {
        formData.append(`Ingredients[${i}].IngredientId`, row.ingredientId)
        formData.append(`Ingredients[${i}].Quantity`, String(row.quantity))
        formData.append(`Ingredients[${i}].MinQuantity`, String(row.minQuantity))
        formData.append(`Ingredients[${i}].MaxQuantity`, String(row.maxQuantity))
      })

      if (imageFile) {
        formData.append('Image', imageFile)
      }

      await addProduct(formData)
      handleClose()
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания продукта')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="add-product-overlay" onClick={handleClose}>
      <div
        className="add-product-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="add-product-modal-header">
          <h2 className="add-product-modal-title">Новое блюдо</h2>
          <button
            type="button"
            className="add-product-modal-close"
            onClick={handleClose}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="add-product-form">
          {error && (
            <div className="add-product-error" role="alert">
              {error}
            </div>
          )}
          <div className="add-product-field">
            <label htmlFor="add-product-name">Название *</label>
            <input
              id="add-product-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Название блюда"
            />
          </div>
          <div className="add-product-field">
            <label htmlFor="add-product-description">Описание *</label>
            <textarea
              id="add-product-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              placeholder="Описание"
            />
          </div>
          <div className="add-product-row">
            <div className="add-product-field">
              <label htmlFor="add-product-price">Цена</label>
              <input
                id="add-product-price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="add-product-field">
              <label htmlFor="add-product-category">Категория *</label>
              <select
                id="add-product-category"
                value={productCategory}
                onChange={(e) => {
                  setProductCategory(e.target.value as ProductCategory)
                  setBaseIngredientId('')
                  setIngredients([])
                }}
              >
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="add-product-field">
            <label htmlFor="add-product-base">Базовый ингредиент</label>
            <select
              id="add-product-base"
              value={baseIngredientId}
              onChange={(e) => setBaseIngredientId(e.target.value)}
              disabled={loadingIngredients}
            >
              <option value="">— не выбран —</option>
              {baseIngredients.map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {ing.name}
                </option>
              ))}
            </select>
          </div>
          <div className="add-product-ingredients-block">
            <div className="add-product-ingredients-header">
              <div>
                <label>Доп. ингредиенты</label>
                <p className="add-product-ingredients-hint">
                  Кол-во — по умолчанию в блюде; Мин/Макс — границы изменения в кастомизации
                </p>
              </div>
              <button
                type="button"
                className="add-product-btn-add-ing"
                onClick={openPicker}
                disabled={loadingIngredients || availableToAdd.length === 0}
              >
                + Добавить
              </button>
            </div>
            {ingredients.length > 0 && (
              <div className="add-product-ingredient-table">
                <div className="add-product-ingredient-row add-product-ingredient-header">
                  <span className="add-product-ingredient-col-name">Ингредиент</span>
                  <span className="add-product-ingredient-col-qty" title="Количество по умолчанию">
                    Кол-во
                  </span>
                  <span className="add-product-ingredient-col-min" title="Минимальное количество для кастомизации">
                    Мин
                  </span>
                  <span className="add-product-ingredient-col-max" title="Максимальное количество для кастомизации">
                    Макс
                  </span>
                  <span className="add-product-ingredient-col-action" aria-hidden />
                </div>
                {ingredients.map((row, index) => {
                  const ing = getIngredientById(row.ingredientId)
                  return (
                  <div key={`${row.ingredientId}-${index}`} className="add-product-ingredient-row">
                    <div className="add-product-ingredient-col-name add-product-ingredient-display">
                      <IngredientThumb name={ing?.name ?? '—'} imageName={ing?.imageName ?? null} id={ing?.id ?? ''} />
                    </div>
                    <div className="add-product-ingredient-col-qty">
                      <input
                        type="number"
                        min="0"
                        value={row.quantity}
                        onChange={(e) =>
                          handleIngredientChange(
                            index,
                            'quantity',
                            parseInt(e.target.value, 10) || 0
                          )
                        }
                        aria-label="Количество"
                        placeholder="0"
                      />
                    </div>
                    <div className="add-product-ingredient-col-min">
                      <input
                        type="number"
                        min="0"
                        value={row.minQuantity}
                        onChange={(e) =>
                          handleIngredientChange(
                            index,
                            'minQuantity',
                            parseInt(e.target.value, 10) || 0
                          )
                        }
                        aria-label="Минимум"
                        placeholder="0"
                      />
                    </div>
                    <div className="add-product-ingredient-col-max">
                      <input
                        type="number"
                        min="0"
                        value={row.maxQuantity}
                        onChange={(e) =>
                          handleIngredientChange(
                            index,
                            'maxQuantity',
                            parseInt(e.target.value, 10) || 0
                          )
                        }
                        aria-label="Максимум"
                        placeholder="0"
                      />
                    </div>
                    <div className="add-product-ingredient-col-action">
                      <button
                        type="button"
                        className="add-product-btn-remove-ing"
                        onClick={() => handleRemoveIngredient(index)}
                        aria-label="Удалить ингредиент"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )
                })}
              </div>
            )}
          </div>

          {pickerOpen && (
            <div className="add-product-picker-overlay" onClick={closePicker}>
              <div
                className="add-product-picker"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="add-product-picker-header">
                  <h3 className="add-product-picker-title">Выберите ингредиент</h3>
                  <button
                    type="button"
                    className="add-product-modal-close"
                    onClick={closePicker}
                    aria-label="Закрыть"
                  >
                    ×
                  </button>
                </div>
                <div className="add-product-picker-grid">
                  {availableToAdd.map((ing) => (
                    <IngredientThumb
                      key={ing.id}
                      name={ing.name}
                      imageName={ing.imageName ?? null}
                      id={ing.id}
                      onClick={() => handleSelectIngredient(ing)}
                    />
                  ))}
                </div>
                {availableToAdd.length === 0 && (
                  <p className="add-product-picker-empty">
                    Все ингредиенты категории уже добавлены
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="add-product-field">
            <label htmlFor="add-product-image">Изображение</label>
            <input
              id="add-product-image"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="add-product-modal-footer">
            <button
              type="button"
              className="dishes-btn-reset"
              onClick={handleClose}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="dishes-btn-primary"
              disabled={loading}
            >
              {loading ? 'Создание…' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
