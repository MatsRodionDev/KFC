import { useState, useEffect } from 'react'
import { createTopping } from '../api/catalog'
import './AddProductModal.css'

const DRINK_TYPES = [
  { value: 'Tea', label: 'Чай' },
  { value: 'Coffe', label: 'Кофе' },
  { value: 'HotChocolate', label: 'Горячий шоколад' },
  { value: 'Cocktail', label: 'Коктейль' },
] as const

const DRINK_TYPE_INDEX: Record<string, number> = {
  Tea: 0,
  Coffe: 1,
  HotChocolate: 2,
  Cocktail: 3,
}

interface AddToppingModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddToppingModal({
  isOpen,
  onClose,
  onSuccess,
}: AddToppingModalProps) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [availableTypes, setAvailableTypes] = useState<string[]>(['Tea'])
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
    setAvailableTypes(['Tea'])
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
    if (availableTypes.length === 0) {
      setError('Выберите хотя бы один тип напитка')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('Name', nameTrim)
      formData.append('Price', String(priceNum))
      availableTypes.forEach((type) => {
        formData.append('AvailableForTypes', String(DRINK_TYPE_INDEX[type] ?? 0))
      })
      if (imageFile) {
        formData.append('Image', imageFile)
      }

      await createTopping(formData)
      handleClose()
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания топинга')
    } finally {
      setLoading(false)
    }
  }

  const toggleType = (type: string) => {
    setAvailableTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
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
          <h2 className="add-product-modal-title">Новый топинг</h2>
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
            <label htmlFor="add-topping-name">Название *</label>
            <input
              id="add-topping-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Название топинга"
            />
          </div>

          <div className="add-product-field">
            <label htmlFor="add-topping-price">Цена *</label>
            <input
              id="add-topping-price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              placeholder="0.00"
            />
          </div>

          <div className="add-product-field-group">
            <span className="add-product-field-group-title">Доступен для типов напитков *</span>
            <div className="add-product-field-group-options">
              {DRINK_TYPES.map((d) => (
                <label key={d.value}>
                  <input
                    type="checkbox"
                    checked={availableTypes.includes(d.value)}
                    onChange={() => toggleType(d.value)}
                    aria-hidden
                  />
                  <span className="add-product-custom-checkbox" aria-hidden />
                  <span>{d.label}</span>
                </label>
              ))}
            </div>
            {availableTypes.length === 0 && (
              <span className="add-product-field-group-hint">
                Выберите хотя бы один тип
              </span>
            )}
          </div>

          <div className="add-product-field">
            <span className="add-product-field-group-title">Изображение</span>
            <div className="add-product-file-wrap">
              <input
                id="add-topping-image"
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
              disabled={loading || availableTypes.length === 0}
            >
              {loading ? 'Создание…' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
