import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { catalogService, orderService } from '../../services/api';
import { Product, ProductCategory, IngredientQuantityCustomization } from '../../types';
import { useCart } from '../../hooks/useCart';
import { useUserId } from '../../hooks/useUserId';
import './ProductPage.css';

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

export const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const userId = useUserId();
  const { refreshCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [ingredientCustomizations, setIngredientCustomizations] = useState<IngredientCustomization[]>([]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setError('ID продукта не указан');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const productData = await catalogService.getProduct(id);
        setProduct(productData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch product';
        setError(errorMessage);
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (product) {
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
  }, [product]);

  const handleDeltaChange = (ingredientId: string, delta: number) => {
    setIngredientCustomizations(prev => prev.map(ing => {
      if (ing.ingredientId === ingredientId) {
        const newDelta = ing.delta + delta;
        const newTotal = ing.currentQuantity + newDelta;
        
        if (newTotal < ing.minQuantity || newTotal > ing.maxQuantity) {
          return ing;
        }
        
        return { ...ing, delta: newDelta };
      }
      return ing;
    }));
  };

  const handleResetIngredient = (ingredientId: string) => {
    setIngredientCustomizations(prev => prev.map(ing => {
      if (ing.ingredientId === ingredientId) {
        return { ...ing, delta: 0 };
      }
      return ing;
    }));
  };

  const handleAddToCart = async () => {
    if (!product) return;

    const customizations: IngredientQuantityCustomization[] = ingredientCustomizations
      .filter(ing => ing.delta !== 0)
      .map(ing => ({
        ingredientId: ing.ingredientId,
        delta: ing.delta
      }));

    try {
      setAddingToCart(true);
      await orderService.addItemToCart({
        userId,
        productId: product.id,
        quantity,
        ingredientsQuantityCustomizations: customizations
      });
      await refreshCart();
      navigate('/cart');
    } catch (err) {
      console.error('Error adding to cart:', err);
      alert('Не удалось добавить товар в корзину');
    } finally {
      setAddingToCart(false);
    }
  };

  const calculateTotalPrice = () => {
    if (!product) return 0;
    const basePrice = product.price ?? product.productIngredients.reduce((sum, ing) => sum + ing.price, 0);
    const customizationPrice = ingredientCustomizations.reduce((sum, ing) => {
      return sum + (ing.delta * ing.price);
    }, 0);
    return (basePrice + customizationPrice) * quantity;
  };

  const getNutritionInfo = () => {
    if (!product) return { calories: 0, weight: 0 };
    
    if (product.nutrition) {
      return {
        calories: product.nutrition.calories || 0,
        weight: product.nutrition.weight || 0
      };
    }
    
    if (product.productIngredients && product.productIngredients.length > 0) {
      return {
        calories: product.productIngredients.reduce((sum, ing) => sum + (ing.totalNutrition?.calories || 0), 0),
        weight: product.productIngredients.reduce((sum, ing) => sum + (ing.totalNutrition?.weight || 0), 0)
      };
    }
    
    return { calories: 0, weight: 0 };
  };

  if (loading) {
    return (
      <div className="product-page-overlay">
        <div className="product-page-loading">
          <div className="loading-spinner"></div>
          <p>Загрузка информации о продукте...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-page-overlay">
        <div className="product-page-error">
          <div className="error-icon">⚠️</div>
          <p className="error-title">Не удалось загрузить продукт</p>
          <p className="error-message">{error || 'Продукт не найден'}</p>
          <button onClick={() => navigate('/')} className="btn-primary" style={{ marginTop: '20px' }}>
            ← Вернуться в каталог
          </button>
        </div>
      </div>
    );
  }

  const nutrition = getNutritionInfo();
  const totalPrice = calculateTotalPrice();

  return (
    <div className="product-page-overlay" onClick={() => navigate('/')}>
      <div className="product-modal" onClick={(e) => e.stopPropagation()}>
        <button className="product-modal-close" onClick={() => navigate('/')}>×</button>
        
        <div className="product-modal-content">
          <div className="product-modal-image">
            {product.imageName ? (
              <img 
                src={`http://localhost:9000/catalog/${product.imageName}`}
                alt={product.name}
                className="product-modal-image-img"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div className="product-modal-image-fallback" style={{ display: product.imageName ? 'none' : 'flex' }}>
              {(() => {
                const category = typeof product.productCategory === 'string' 
                  ? product.productCategory 
                  : ProductCategory[product.productCategory];
                if (category === 'Pizza' || category === '0' || product.productCategory === 0) return '🍕';
                if (category === 'Burger' || category === '1' || product.productCategory === 1) return '🍔';
                return '🧺';
              })()}
            </div>
          </div>

          <div className="product-modal-info">
            <h1 className="product-modal-title">{product.name}</h1>
            
            <div className="product-modal-description">
              {nutrition.weight > 0 && `${nutrition.weight} г`}
              {product.description && ` • ${product.description}`}
            </div>

            {product.productIngredients.length > 0 && (
              <div className="product-modal-ingredients">
                <div className="ingredients-list">
                  {ingredientCustomizations.map((ing) => {
                    const totalQuantity = ing.currentQuantity + ing.delta;
                    const canDecrease = totalQuantity > ing.minQuantity;
                    const canIncrease = totalQuantity < ing.maxQuantity;

                    return (
                      <div key={ing.ingredientId} className="ingredient-item">
                        <div className="ingredient-name-row">
                          <span className="ingredient-name">
                            {ing.ingredientName}
                            {ing.isBase && <span className="base-badge-small">Основа</span>}
                          </span>
                          {ing.delta !== 0 && (
                            <button
                              className="ingredient-remove"
                              onClick={() => handleResetIngredient(ing.ingredientId)}
                              title="Сбросить изменения"
                            >
                              ×
                            </button>
                          )}
                        </div>
                        <div className="ingredient-controls">
                          <button
                            onClick={() => handleDeltaChange(ing.ingredientId, -1)}
                            disabled={!canDecrease}
                            className="quantity-btn decrease"
                          >
                            −
                          </button>
                          <span className="current-quantity">{totalQuantity}</span>
                          <button
                            onClick={() => handleDeltaChange(ing.ingredientId, 1)}
                            disabled={!canIncrease}
                            className="quantity-btn increase"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="product-modal-quantity">
              <span className="quantity-label">Количество:</span>
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

            <button
              className="btn-add-to-cart-modal"
              onClick={handleAddToCart}
              disabled={addingToCart}
            >
              {addingToCart ? 'Добавление...' : `В корзину за ${totalPrice.toFixed(2)} руб.`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

