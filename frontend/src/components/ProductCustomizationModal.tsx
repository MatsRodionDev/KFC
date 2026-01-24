import { useState, useEffect } from 'react';
import { Product, IngredientQuantityCustomization } from '../types';
import './ProductCustomizationModal.css';

interface ProductCustomizationModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (customizations: IngredientQuantityCustomization[], quantity: number) => void;
}

interface IngredientCustomization {
  ingredientId: string;
  ingredientName: string;
  currentQuantity: number;
  minQuantity: number;
  maxQuantity: number;
  delta: number;
  isBase: boolean;
  price: number;
}

export const ProductCustomizationModal = ({
  product,
  isOpen,
  onClose,
  onConfirm
}: ProductCustomizationModalProps) => {
  const [quantity, setQuantity] = useState(1);
  const [ingredientCustomizations, setIngredientCustomizations] = useState<IngredientCustomization[]>([]);

  useEffect(() => {
    if (product && isOpen) {
      // Инициализируем кастомизации для каждого ингредиента
      const customizations: IngredientCustomization[] = product.productIngredients.map((ing) => {
        const currentQty = typeof ing.quantity === 'object' && ing.quantity !== null
          ? (ing.quantity as any).value || 0
          : typeof ing.quantity === 'number'
          ? ing.quantity
          : 0;
        
        const minQty = typeof ing.minQuantity === 'object' && ing.minQuantity !== null
          ? (ing.minQuantity as any).value || 0
          : typeof ing.minQuantity === 'number'
          ? ing.minQuantity
          : 0;
        
        const maxQty = typeof ing.maxQuantity === 'object' && ing.maxQuantity !== null
          ? (ing.maxQuantity as any).value || 0
          : typeof ing.maxQuantity === 'number'
          ? ing.maxQuantity
          : 0;

        return {
          ingredientId: ing.ingredientId,
          ingredientName: ing.ingredientName,
          currentQuantity: currentQty,
          minQuantity: minQty,
          maxQuantity: maxQty,
          delta: 0,
          isBase: ing.isBase,
          price: ing.price
        };
      });
      setIngredientCustomizations(customizations);
      setQuantity(1);
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const handleDeltaChange = (ingredientId: string, delta: number) => {
    setIngredientCustomizations(prev => prev.map(ing => {
      if (ing.ingredientId === ingredientId) {
        const newDelta = ing.delta + delta;
        const newTotal = ing.currentQuantity + newDelta;
        
        // Проверяем границы
        if (newTotal < ing.minQuantity || newTotal > ing.maxQuantity) {
          return ing; // Не изменяем, если выходит за границы
        }
        
        return { ...ing, delta: newDelta };
      }
      return ing;
    }));
  };

  const handleConfirm = () => {
    const customizations: IngredientQuantityCustomization[] = ingredientCustomizations
      .filter(ing => ing.delta !== 0)
      .map(ing => ({
        ingredientId: ing.ingredientId,
        delta: ing.delta
      }));
    
    onConfirm(customizations, quantity);
    onClose();
  };

  const calculateTotalPrice = () => {
    const basePrice = product.price ?? product.productIngredients.reduce((sum, ing) => sum + ing.price, 0);
    const customizationPrice = ingredientCustomizations.reduce((sum, ing) => {
      return sum + (ing.delta * ing.price);
    }, 0);
    return (basePrice + customizationPrice) * quantity;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Кастомизация: {product.name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="quantity-selector">
            <label>Количество:</label>
            <div className="quantity-control">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                −
              </button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>
          </div>

          <div className="ingredients-customization">
            <h3>Ингредиенты:</h3>
            <div className="ingredients-list">
              {ingredientCustomizations.map((ing) => {
                const totalQuantity = ing.currentQuantity + ing.delta;
                const canDecrease = totalQuantity > ing.minQuantity;
                const canIncrease = totalQuantity < ing.maxQuantity;

                return (
                  <div key={ing.ingredientId} className="ingredient-customization-item">
                    <div className="ingredient-info">
                      <div className="ingredient-header">
                        <span className="ingredient-name">
                          {ing.ingredientName}
                          {ing.isBase && <span className="base-badge-small">Основа</span>}
                        </span>
                        {ing.delta !== 0 && (
                          <span className="delta-info">
                            {ing.delta > 0 ? '+' : ''}{ing.delta} г
                            <span className="price-change">
                              ({ing.delta > 0 ? '+' : ''}{(ing.delta * ing.price).toFixed(0)} ₽)
                            </span>
                          </span>
                        )}
                      </div>
                      <span className="ingredient-quantity-info">
                        Диапазон: {ing.minQuantity} - {ing.maxQuantity} г
                      </span>
                    </div>
                    <div className="ingredient-controls-simple">
                      <button
                        onClick={() => handleDeltaChange(ing.ingredientId, -1)}
                        disabled={!canDecrease}
                        className="quantity-btn decrease"
                        title="Уменьшить"
                      >
                        −
                      </button>
                      <span className="current-quantity">
                        {totalQuantity} г
                      </span>
                      <button
                        onClick={() => handleDeltaChange(ing.ingredientId, 1)}
                        disabled={!canIncrease}
                        className="quantity-btn increase"
                        title="Увеличить"
                      >
                        +
                      </button>
                      {ing.delta !== 0 && (
                        <button
                          onClick={() => handleDeltaChange(ing.ingredientId, -ing.delta)}
                          className="quantity-btn reset"
                          title="Сбросить изменения"
                        >
                          ↺
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="total-price">
            <span>Итого: {calculateTotalPrice().toFixed(0)} ₽</span>
          </div>
          <div className="modal-actions">
            <button className="btn-cancel" onClick={onClose}>
              Отмена
            </button>
            <button className="btn-confirm" onClick={handleConfirm}>
              Добавить в корзину
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

