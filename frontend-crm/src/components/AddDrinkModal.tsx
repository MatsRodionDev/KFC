import { useState, useEffect } from 'react'
import { createDrink, getToppingsPaged, type ToppingListItem } from '../api/catalog'
import './AddProductModal.css'

const DRINK_TYPES = [
  { value: 'Tea', label: 'Чай' },
  { value: 'Coffe', label: 'Кофе' },
  { value: 'HotChocolate', label: 'Горячий шоколад' },
  { value: 'Cocktail', label: 'Коктейль' },
] as const

interface AddDrinkModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddDrinkModal({
  isOpen,
  onClose,
  onSuccess,
}: AddDrinkModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [drinkType, setDrinkType] = useState<string>('Tea')
  const [selectedToppingIds, setSelectedToppingIds] = useState<string[]>([])
  const [toppings, setToppings] = useState<ToppingListItem[]>([])
  const [loadingToppings, setLoadingToppings] = useState(false)
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

  useEffect(() => {
    if (!isOpen) return
    setLoadingToppings(true)
    getToppingsPaged({
      pageSize: 100,
      availableForDrinkType: drinkType,
    })
      .then((res) => setToppings(res.items))
      .catch(() => setToppings([]))
      .finally(() => setLoadingToppings(false))
  }, [isOpen, drinkType])

  useEffect(() => {
    if (!isOpen) return
    setSelectedToppingIds([])
  }, [isOpen, drinkType])

  const resetForm = () => {
    setName('')
    setDescription('')
    setPrice('')
    setDrinkType('Tea')
    setSelectedToppingIds([])
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
    const descriptionTrim = description.trim()
    const priceNum = parseFloat(price.replace(',', '.'))
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setError('Укажите корректную цену')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('Name', nameTrim)
      formData.append('Description', descriptionTrim)
      formData.append('Price', String(priceNum))
      formData.append('DrinkType', drinkType)
      selectedToppingIds.forEach((id) => formData.append('ToppingsIds', id))
      if (imageFile) {
        formData.append('Image', imageFile)
      }

      await createDrink(formData)
      handleClose()
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания напитка')
    } finally {
      setLoading(false)
    }
  }

  const toggleTopping = (id: string) => {
    setSelectedToppingIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
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
          <h2 className="add-product-modal-title">Новый напиток</h2>
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
            <label htmlFor="add-drink-name">Название *</label>
            <input
              id="add-drink-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Название напитка"
            />
          </div>

          <div className="add-product-field">
            <label htmlFor="add-drink-description">Описание</label>
            <textarea
              id="add-drink-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Описание"
            />
          </div>

          <div className="add-product-row">
            <div className="add-product-field">
              <label htmlFor="add-drink-price">Цена *</label>
              <input
                id="add-drink-price"
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
              <label htmlFor="add-drink-type">Тип напитка *</label>
              <select
                id="add-drink-type"
                value={drinkType}
                onChange={(e) => setDrinkType(e.target.value)}
              >
                {DRINK_TYPES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="add-product-field-group">
            <span className="add-product-field-group-title">Топинги (доступны для выбранного типа)</span>
            {loadingToppings ? (
              <p className="add-product-field-group-hint" style={{ color: 'var(--crm-text-muted)' }}>
                Загрузка…
              </p>
            ) : toppings.length === 0 ? (
              <p className="add-product-field-group-hint" style={{ color: 'var(--crm-text-muted)' }}>
                Нет топингов для этого типа
              </p>
            ) : (
              <div className="add-product-field-group-options">
                {toppings.map((t) => (
                  <label key={t.id}>
                    <input
                      type="checkbox"
                      checked={selectedToppingIds.includes(t.id)}
                      onChange={() => toggleTopping(t.id)}
                      aria-hidden
                    />
                    <span className="add-product-custom-checkbox" aria-hidden />
                    <span>{t.name} ({Number(t.price).toFixed(2)} ₽)</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="add-product-field">
            <span className="add-product-field-group-title">Изображение</span>
            <div className="add-product-file-wrap">
              <input
                id="add-drink-image"
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
            <button type="submit" className="add-product-btn-primary" disabled={loading}>
              {loading ? 'Создание…' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
