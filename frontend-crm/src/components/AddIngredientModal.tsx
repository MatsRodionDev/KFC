import { useState, useEffect } from 'react'
import { createIngredient, createBaseIngredient } from '../api/catalog'
import './AddProductModal.css'

const PRODUCT_CATEGORIES = [
  { value: 'Pizza', label: 'Пицца' },
  { value: 'Burger', label: 'Бургер' },
  { value: 'Basket', label: 'Корзина' },
] as const

const CATEGORY_INDEX: Record<string, number> = {
  Pizza: 0,
  Burger: 1,
  Basket: 2,
}

interface AddIngredientModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddIngredientModal({
  isOpen,
  onClose,
  onSuccess,
}: AddIngredientModalProps) {
  const [isBase, setIsBase] = useState(false)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [weight, setWeight] = useState('')
  const [calories, setCalories] = useState('')
  const [forProductCategory, setForProductCategory] = useState<string>('Pizza')
  const [availableCategories, setAvailableCategories] = useState<string[]>(['Pizza'])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  const resetForm = () => {
    setName('')
    setPrice('')
    setWeight('')
    setCalories('')
    setForProductCategory('Pizza')
    setAvailableCategories(['Pizza'])
    setImageFile(null)
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nameTrim = name.trim()
    if (!nameTrim) {
      setError('Введите название')
      return
    }
    const priceNum = parseFloat(price.replace(',', '.'))
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setError('Укажите корректную цену')
      return
    }
    const weightNum = parseInt(weight, 10)
    if (Number.isNaN(weightNum) || weightNum <= 0) {
      setError('Укажите вес в граммах (целое число > 0)')
      return
    }
    const caloriesNum = parseInt(calories, 10)
    if (Number.isNaN(caloriesNum) || caloriesNum < 0) {
      setError('Укажите калории (целое число ≥ 0)')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('Name', nameTrim)
      formData.append('Price', String(priceNum))
      formData.append('Weight', String(weightNum))
      formData.append('Calories', String(caloriesNum))

      if (imageFile) {
        formData.append('Image', imageFile)
      }

      if (isBase) {
        formData.append('ForProductCategory', String(CATEGORY_INDEX[forProductCategory] ?? 0))
        await createBaseIngredient(formData)
      } else {
        availableCategories.forEach((cat) => {
          formData.append('AvailableForProductCategories', String(CATEGORY_INDEX[cat] ?? 0))
        })
        await createIngredient(formData)
      }

      handleClose()
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания ингредиента')
    } finally {
      setLoading(false)
    }
  }

  const toggleAvailableCategory = (cat: string) => {
    setAvailableCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  if (!isOpen) return null

  return (
    <div className="add-product-overlay" onClick={handleClose}>
      <div
        className="add-product-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="add-product-modal-header">
          <h2 className="add-product-modal-title">Новый ингредиент</h2>
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
            <label>
              <input
                type="checkbox"
                checked={isBase}
                onChange={(e) => setIsBase(e.target.checked)}
              />
              <span style={{ marginLeft: 8 }}>Базовый ингредиент (для одной категории продукта)</span>
            </label>
          </div>

          <div className="add-product-field">
            <label htmlFor="add-ingredient-name">Название *</label>
            <input
              id="add-ingredient-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Название ингредиента"
            />
          </div>

          <div className="add-product-row add-product-row--3">
            <div className="add-product-field">
              <label htmlFor="add-ingredient-price">Цена *</label>
              <input
                id="add-ingredient-price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                placeholder="0.00"
              />
            </div>
            <div className="add-product-field">
              <label htmlFor="add-ingredient-weight">Вес (г) *</label>
              <input
                id="add-ingredient-weight"
                type="number"
                min="1"
                step="1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
                placeholder="100"
              />
            </div>
            <div className="add-product-field">
              <label htmlFor="add-ingredient-calories">Ккал *</label>
              <input
                id="add-ingredient-calories"
                type="number"
                min="0"
                step="1"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                required
                placeholder="0"
              />
            </div>
          </div>

          {isBase ? (
            <div className="add-product-field">
              <label htmlFor="add-ingredient-for-category">Категория продукта *</label>
              <select
                id="add-ingredient-for-category"
                value={forProductCategory}
                onChange={(e) => setForProductCategory(e.target.value)}
              >
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="add-product-field-group">
              <span className="add-product-field-group-title">Доступен для категорий *</span>
              <div className="add-product-field-group-options">
                {PRODUCT_CATEGORIES.map((c) => (
                  <label key={c.value}>
                    <input
                      type="checkbox"
                      checked={availableCategories.includes(c.value)}
                      onChange={() => toggleAvailableCategory(c.value)}
                      aria-hidden
                    />
                    <span className="add-product-custom-checkbox" aria-hidden />
                    <span>{c.label}</span>
                  </label>
                ))}
              </div>
              {availableCategories.length === 0 && (
                <span className="add-product-field-group-hint">
                  Выберите хотя бы одну категорию
                </span>
              )}
            </div>
          )}

          <div className="add-product-field">
            <span className="add-product-field-group-title">Изображение</span>
            <div className="add-product-file-wrap">
              <input
                id="add-ingredient-image"
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                className="add-product-file-input"
              />
              <span className="add-product-file-name">
                {imageFile?.name ?? 'Нажмите или перетащите файл сюда'}
              </span>
            </div>
          </div>

          <div className="add-product-modal-footer">
            <button
              type="button"
              className="add-product-btn-secondary"
              onClick={handleClose}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="add-product-btn-primary"
              disabled={loading || (!isBase && availableCategories.length === 0)}
            >
              {loading ? 'Создание…' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
