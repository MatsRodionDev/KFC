import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { catalogService, orderService } from '../../services/api';
import { ProductCategory, Ingredient, IngredientSnapshot } from '../../types';
import { useCart } from '../../hooks/useCart';
import { DEFAULT_USER_ID } from '../../constants';
import './CustomProductBuilder.css';

interface SelectedIngredient {
  ingredient: Ingredient;
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
}

export const CustomProductBuilder = () => {
  const navigate = useNavigate();
  const { refreshCart } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [baseIngredient, setBaseIngredient] = useState<Ingredient | null>(null);
  const [baseIngredients, setBaseIngredients] = useState<Ingredient[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([]);
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(1);

  useEffect(() => {
    if (selectedCategory !== null) {
      loadIngredients();
    }
  }, [selectedCategory]);

  // Автоматический переход на следующий шаг после выбора базового ингредиента
  useEffect(() => {
    if (baseIngredient !== null && currentStep === 1) {
      // Не переходим автоматически, пользователь сам нажмет "Далее"
    }
  }, [baseIngredient, currentStep]);

  const loadIngredients = async () => {
    if (selectedCategory === null) return;
    
    try {
      setLoading(true);
      setError(null);
      const categoryNum = typeof selectedCategory === 'number' 
        ? selectedCategory 
        : Number(selectedCategory);
      console.log('Загрузка ингредиентов для категории:', selectedCategory, 'как число:', categoryNum);
      const ingredientsData = await catalogService.getIngredientsByCategory(categoryNum);
      console.log('Загружено ингредиентов:', ingredientsData.length, ingredientsData);
      
      if (!ingredientsData || ingredientsData.length === 0) {
        setError('Ингредиенты для выбранной категории не найдены');
        setIngredients([]);
        setBaseIngredient(null);
        return;
      }
      
      setIngredients(ingredientsData);
      
      // Находим все базовые ингредиенты для категории
      const baseIngredientsList = ingredientsData.filter(ing => {
        const isBase = ing.isBase;
        const ingCategory = ing.forProductCategory !== null 
          ? (typeof ing.forProductCategory === 'number' ? ing.forProductCategory : Number(ing.forProductCategory))
          : null;
        return isBase && ingCategory === categoryNum;
      });
      
      setBaseIngredients(baseIngredientsList);
      
      // Если есть базовые ингредиенты, выбираем первый по умолчанию
      if (baseIngredientsList.length > 0) {
        setBaseIngredient(baseIngredientsList[0]);
      } else {
        setBaseIngredient(null);
        console.warn('Базовые ингредиенты не найдены для категории:', selectedCategory);
      }
      
      // Сбрасываем выбранные ингредиенты
      setSelectedIngredients([]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Не удалось загрузить ингредиенты';
      setError(errorMessage);
      console.error('Error loading ingredients:', err);
      if (err instanceof Error && err.message) {
        console.error('Error details:', err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (category: ProductCategory) => {
    setSelectedCategory(category);
    setBaseIngredient(null);
    setBaseIngredients([]);
    setSelectedIngredients([]);
    setProductName('');
    setProductDescription('');
    setCurrentStep(2); // После выбора категории переходим на шаг 2
  };

  const canGoToStep = (step: number): boolean => {
    if (step === 1) return true; // Выбор категории всегда доступен
    if (step === 2) return selectedCategory !== null; // Выбор базового ингредиента доступен после выбора категории
    if (step === 3) return baseIngredient !== null; // Дополнительные ингредиенты доступны после выбора базового
    if (step === 4) return baseIngredient !== null && currentStep >= 3; // Информация о продукте доступна только после прохождения всех шагов
    return false;
  };

  const getCategoryName = (category: ProductCategory | null): string => {
    if (category === null) return '';
    const categoryNum = typeof category === 'number' ? category : Number(category);
    switch (categoryNum) {
      case 0: return 'Пицца';
      case 1: return 'Бургер';
      case 2: return 'Корзина';
      default: return 'Неизвестная категория';
    }
  };

  const handleNextStep = () => {
    if (currentStep < 4) {
      // Для перехода на шаг 4 нужно пройти все предыдущие шаги
      if (currentStep === 3 && baseIngredient !== null) {
        setCurrentStep(4);
      } else if (currentStep < 3 && canGoToStep(currentStep + 1)) {
      setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleBaseIngredientSelect = (ingredient: Ingredient) => {
    setBaseIngredient(ingredient);
  };

  const handleAddIngredient = (ingredient: Ingredient) => {
    console.log('Добавление ингредиента:', ingredient.name, ingredient.id);
    
    // Проверяем, не добавлен ли уже этот ингредиент
    if (selectedIngredients.some(sel => sel.ingredient.id === ingredient.id)) {
      console.log('Ингредиент уже добавлен');
      return;
    }

    // Получаем минимальное и максимальное количество (по умолчанию 0 и 10)
    // minQuantity = 0 означает, что ингредиент можно убрать
    const minQty = 0;
    const maxQty = 10;

    setSelectedIngredients(prev => {
      const newList = [...prev, {
        ingredient,
        quantity: 1, // Начальное количество
        minQuantity: minQty,
        maxQuantity: maxQty
      }];
      console.log('Обновленный список ингредиентов:', newList.length);
      return newList;
    });
  };

  const handleRemoveIngredient = (ingredientId: string) => {
    setSelectedIngredients(prev => prev.filter(sel => sel.ingredient.id !== ingredientId));
  };

  const handleQuantityChange = (ingredientId: string, delta: number) => {
    setSelectedIngredients(prev => {
      return prev.map(sel => {
        if (sel.ingredient.id === ingredientId) {
          const newQuantity = sel.quantity + delta;
          // Если количество становится 0 или меньше, удаляем ингредиент из списка
          if (newQuantity <= 0) {
            return null; // Помечаем для удаления
          }
          // Проверяем максимальное количество
          if (newQuantity <= sel.maxQuantity) {
            return { ...sel, quantity: newQuantity };
          }
        }
        return sel;
      }).filter(sel => sel !== null) as SelectedIngredient[]; // Удаляем null значения
    });
  };

  const calculateTotalPrice = (): number => {
    let total = 0;
    
    if (baseIngredient) {
      total += baseIngredient.price;
    }
    
    selectedIngredients.forEach(sel => {
      total += sel.ingredient.price * sel.quantity;
    });
    
    return total * quantity;
  };

  const getAvailableIngredients = (): Ingredient[] => {
    if (selectedCategory === null) return [];
    
    const categoryNum = Number(selectedCategory);
    
    return ingredients.filter(ing => {
      // Исключаем базовый ингредиент для выбранной категории
      if (ing.isBase) {
        const ingCategory = ing.forProductCategory !== null 
          ? (typeof ing.forProductCategory === 'number' ? ing.forProductCategory : Number(ing.forProductCategory))
          : null;
        if (ingCategory === categoryNum) {
          return false; // Это базовый ингредиент для этой категории - исключаем
        }
      }
      
      // НЕ исключаем уже добавленные ингредиенты - показываем все доступные
      // Это позволяет управлять количеством прямо в сетке
      
      // Проверяем доступность для категории
      const ingCategory = ing.forProductCategory !== null 
        ? (typeof ing.forProductCategory === 'number' ? ing.forProductCategory : Number(ing.forProductCategory))
        : null;
      
      // Если forProductCategory совпадает с выбранной категорией - доступен
      if (ingCategory === categoryNum) {
        return true;
      }
      
      // Проверяем availableForProductCategories
      if (ing.availableForProductCategories && Array.isArray(ing.availableForProductCategories)) {
        const isAvailable = ing.availableForProductCategories.some(cat => {
          const catNum = typeof cat === 'number' ? cat : Number(cat);
          return catNum === categoryNum;
        });
        if (isAvailable) {
          return true;
        }
      }
      
      // Если ингредиент не базовый и загружен для этой категории через API - делаем доступным
      // (API уже отфильтровал ингредиенты по категории, поэтому если он здесь - он доступен)
      if (!ing.isBase) {
        return true;
      }
      
      return false;
    });
  };

  const handleSaveAndAddToCart = async () => {
    if (!selectedCategory) {
      alert('Выберите категорию продукта');
      return;
    }

    if (!baseIngredient) {
      alert('Выберите базовый ингредиент');
      return;
    }

    if (!productName.trim()) {
      alert('Введите название продукта');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Формируем базовый ингредиент (обязательно quantity = 1, min = 1, max = 1)
      const baseIngredientSnapshot: IngredientSnapshot = {
        ingredientId: baseIngredient.id,
        quantity: 1,
        minQuantity: 1,
        maxQuantity: 1
      };

      // Формируем список ингредиентов (фильтруем те, у которых quantity > 0)
      const ingredientsSnapshots: IngredientSnapshot[] = selectedIngredients
        .filter(sel => sel.quantity > 0)
        .map(sel => ({
          ingredientId: sel.ingredient.id,
          quantity: sel.quantity,
          minQuantity: 0, // Можно убрать ингредиент
          maxQuantity: sel.maxQuantity
        }));

      // Создаем кастомный продукт
      const productId = await catalogService.addCustomProduct({
        name: productName.trim(),
        description: productDescription.trim() || 'Кастомный продукт',
        userId: DEFAULT_USER_ID,
        productCategory: selectedCategory,
        baseIngredient: baseIngredientSnapshot,
        ingredients: ingredientsSnapshots
      });

      // Добавляем в корзину
      await orderService.addItemToCart({
        userId: DEFAULT_USER_ID,
        productId,
        quantity,
        ingredientsQuantityCustomizations: []
      });

      await refreshCart();
      navigate('/cart');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Не удалось создать продукт';
      setError(errorMessage);
      console.error('Error saving custom product:', err);
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const getCategoryEmoji = (category: ProductCategory): string => {
    switch (category) {
      case ProductCategory.Pizza:
        return '🍕';
      case ProductCategory.Burger:
        return '🍔';
      case ProductCategory.Basket:
        return '🧺';
      default:
        return '';
    }
  };

  return (
    <div className="custom-product-builder">
      <div className="container">
        {/* Индикатор прогресса шагов - один раз сверху */}
        <div className="steps-indicator-top">
                  {[1, 2, 3, 4].map((step) => {
                    const isActive = currentStep === step;
                    const isCompleted = step < currentStep;
                    
                    return (
                      <div
                        key={step}
                        className={`step-indicator ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                      >
                        <div className="step-number">
                          {isCompleted ? '✓' : step}
                        </div>
                        <div className="step-label">
                          {step === 1 && 'Категория'}
                          {step === 2 && 'Основа'}
                          {step === 3 && 'Ингредиенты'}
                          {step === 4 && 'Информация'}
                        </div>
                      </div>
                    );
                  })}
                </div>

        <div className="product-builder-content">
          <div className="product-builder-content-grid">
            <div className="builder-main">
              {/* Выбор категории - Шаг 1 */}
              <div className={`category-selection-section step-content ${currentStep === 1 ? 'active' : 'hidden'}`}>
                <div className="section-header">
                  <h2>Выберите категорию</h2>
                </div>
                <div className="section-content-scrollable">
                  <div className="category-cards">
                    {[ProductCategory.Pizza, ProductCategory.Burger, ProductCategory.Basket].map((category) => (
                      <button
                        key={category}
                        className="category-card"
                        onClick={() => handleCategorySelect(category)}
                      >
                        <div className="category-emoji">{getCategoryEmoji(category)}</div>
                        <div className="category-name">{getCategoryName(category)}</div>
                        <div className="category-arrow">→</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="step-navigation">
                  <button
                    className="btn-next-step"
                    onClick={handleNextStep}
                    disabled={selectedCategory === null}
                    style={{ marginLeft: 'auto' }}
                  >
                    Далее →
                  </button>
                </div>
              </div>

              {/* Базовый ингредиент - Шаг 2 */}
              {!loading && selectedCategory !== null && (
                <div className={`base-ingredient-section step-content ${currentStep === 2 ? 'active' : 'hidden'}`}>
                  <div className="section-header">
                    <h2>Выберите основу</h2>
                  </div>
                  <div className="section-content-scrollable">
                    {baseIngredients.length > 0 ? (
                        <div className="base-ingredients-grid">
                          {baseIngredients.map((ing) => (
                            <button
                              key={ing.id}
                              className={`base-ingredient-card-selectable ${baseIngredient?.id === ing.id ? 'selected' : ''}`}
                              onClick={() => handleBaseIngredientSelect(ing)}
                            >
                              <div className="base-card-content">
                                <div className="base-card-header">
                                  <span className="base-card-name">{ing.name}</span>
                                  {baseIngredient?.id === ing.id && (
                                    <span className="selected-check">✓</span>
                                  )}
                                </div>
                                <div className="base-card-price">{ing.price.toFixed(2)} руб.</div>
                              </div>
                              {baseIngredient?.id === ing.id && (
                                <div className="selected-indicator"></div>
                              )}
                            </button>
                          ))}
                        </div>
                    ) : (
                      <div className="error-message">
                        Базовые ингредиенты не найдены для выбранной категории. Пожалуйста, выберите другую категорию.
                      </div>
                    )}
                  </div>
                  
                  {/* Кнопки навигации для шага 2 */}
                  <div className="step-navigation">
                    <button
                      className="btn-prev-step"
                      onClick={handlePrevStep}
                    >
                      ← Назад
                    </button>
                    <button
                      className="btn-next-step"
                      onClick={handleNextStep}
                      disabled={!baseIngredient || baseIngredients.length === 0}
                    >
                      Далее →
                    </button>
                  </div>
                </div>
              )}

              {/* Дополнительные ингредиенты - Шаг 3 */}
              <div className={`ingredients-section step-content ${currentStep === 3 ? 'active' : 'hidden'}`}>
                <div className="section-header">
                  <h2>Дополнительные ингредиенты</h2>
                </div>
                
                <div className="section-content-scrollable">
                  {loading ? (
                    <div className="loading-state">
                      <div className="loading-spinner"></div>
                      <p>Загрузка...</p>
                    </div>
                  ) : getAvailableIngredients().length > 0 ? (
                        <div className="ingredients-unified-grid">
                          {getAvailableIngredients().map((ingredient) => {
                            const selectedItem = selectedIngredients.find(sel => sel.ingredient.id === ingredient.id);
                            const quantity = selectedItem?.quantity || 0;
                            const hasQuantity = quantity > 0;
                            
                            return (
                              <div
                                key={ingredient.id}
                                className={`ingredient-card-unified ${hasQuantity ? 'selected' : ''}`}
                              >
                                <div className="ingredient-card-header">
                                  <h4 className="ingredient-card-name">{ingredient.name}</h4>
                                  <span className="ingredient-card-price">{ingredient.price.toFixed(0)} ₽</span>
                                </div>
                                
                                <div className="ingredient-card-controls">
                                  <button
                                    className="ingredient-control-btn decrease"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (quantity > 0) {
                                        handleQuantityChange(ingredient.id, -1);
                                      }
                                    }}
                                    disabled={quantity <= 0}
                                    aria-label="Уменьшить"
                                  >
                                    −
                                  </button>
                                  <span className={`ingredient-quantity-badge ${hasQuantity ? 'active' : ''}`}>
                                    {quantity}
                                  </span>
                                  <button
                                    className="ingredient-control-btn increase"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (quantity === 0) {
                                        handleAddIngredient(ingredient);
                                      } else {
                                        handleQuantityChange(ingredient.id, 1);
                                      }
                                    }}
                                    disabled={quantity >= 10}
                                    aria-label="Увеличить"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                  ) : null}
                </div>
                
                {/* Кнопки навигации для шага 2 */}
                <div className="step-navigation">
                  <button
                    className="btn-prev-step"
                    onClick={handlePrevStep}
                  >
                    ← Назад
                  </button>
                  <button
                    className="btn-next-step"
                    onClick={handleNextStep}
                  >
                    Далее →
                  </button>
                </div>
              </div>

              {/* Информация о продукте - Шаг 4 */}
              <div className={`product-info-section step-content ${currentStep === 4 ? 'active' : 'hidden'}`}>
                <div className="section-header">
                  <h2>Информация о продукте</h2>
                </div>
                <div className="section-content-scrollable">
                  <div className="form-group">
                    <label>Название продукта *</label>
                    <input
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="Например: Моя пицца"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Описание (необязательно)</label>
                    <textarea
                      value={productDescription}
                      onChange={(e) => setProductDescription(e.target.value)}
                      placeholder="Описание вашего продукта"
                      className="form-textarea"
                      rows={3}
                    />
                  </div>
                </div>
                
                {/* Кнопки навигации для шага 4 */}
                <div className="step-navigation">
                  <button
                    className="btn-prev-step"
                    onClick={handlePrevStep}
                  >
                    ← Назад
                  </button>
                </div>
              </div>
              </div>

              {/* Боковая панель с итогом */}
              <div className="builder-sidebar">
              <div className="summary-card">
                <div className="summary-header">
                  <h3>Ваш продукт</h3>
                </div>
                
                <div className="summary-content">
                  {baseIngredient ? (
                    <>
                      <div className="summary-item base-item">
                        <span className="item-name">{baseIngredient.name}</span>
                        <span className="item-price">{baseIngredient.price.toFixed(0)} ₽</span>
                      </div>
                      
                      {selectedIngredients
                        .filter(sel => sel.quantity > 0)
                        .map((sel) => (
                          <div key={sel.ingredient.id} className="summary-item">
                            <span className="item-name">{sel.ingredient.name} × {sel.quantity}</span>
                            <span className="item-price">{(sel.ingredient.price * sel.quantity).toFixed(0)} ₽</span>
                          </div>
                        ))}
                    </>
                  ) : (
                    <div className="summary-empty">
                      <p>Выберите категорию</p>
                    </div>
                  )}
                </div>

                <div className="quantity-selector">
                  <span>Количество:</span>
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

                <div className="total-price">
                  <span>Итого:</span>
                  <span className="total-amount">{calculateTotalPrice().toFixed(0)} ₽</span>
                </div>

                <button
                  className="btn-save-product"
                  onClick={handleSaveAndAddToCart}
                  disabled={saving || !baseIngredient || !productName.trim() || loading}
                >
                  {saving ? (
                    <>
                      <span className="btn-spinner"></span>
                      <span>Сохранение...</span>
                    </>
                  ) : (
                    <span>Добавить в корзину</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

