import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectAllProducts,
  selectFilteredProducts,
  selectMenuLoading,
  selectMenuError,
  selectSelectedCategory,
  selectSearchQuery,
  setSelectedCategory,
  setSearchQuery,
  fetchMenu
} from '../../store/slices/menuSlice';
import {
  selectIsVoiceChatOpen,
  selectIsRecording,
  selectIsProcessingVoiceOrder,
  selectVoiceChatMessages,
  selectVoiceTextInput,
  selectAddingToCartProductId,
  selectIsCustomizationModalOpen,
  openVoiceChat,
  closeVoiceChat,
  setRecording,
  setProcessingVoiceOrder,
  addVoiceChatMessage,
  setVoiceTextInput,
  setAddingToCartProductId,
  openCustomizationModal,
  closeCustomizationModal
} from '../../store/slices/uiSlice';
import { addToCart, fetchCart } from '../../store/slices/cartSlice';
import { ProductCard } from '../../components/ProductCard';
import { ProductCustomizationModal } from '../../components/ProductCustomizationModal';
import { chatService, catalogService } from '../../services/api';
import { ProductCategory, IngredientQuantityCustomization, Product, OrderResponse } from '../../types';
import { DEFAULT_USER_ID } from '../../constants';
import './MenuPage.css';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export const MenuPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const products = useAppSelector(selectFilteredProducts);
  const allProducts = useAppSelector(selectAllProducts);
  const loading = useAppSelector(selectMenuLoading);
  const error = useAppSelector(selectMenuError);
  const selectedCategory = useAppSelector(selectSelectedCategory);
  const searchQuery = useAppSelector(selectSearchQuery);
  const isChatOpen = useAppSelector(selectIsVoiceChatOpen);
  const isRecording = useAppSelector(selectIsRecording);
  const isProcessingVoiceOrder = useAppSelector(selectIsProcessingVoiceOrder);
  const chatMessages = useAppSelector(selectVoiceChatMessages);
  const textInput = useAppSelector(selectVoiceTextInput);
  const addingToCart = useAppSelector(selectAddingToCartProductId);
  const isCustomizationModalOpen = useAppSelector(selectIsCustomizationModalOpen);
  
  const [customizationProduct, setCustomizationProduct] = useState<{ id: string; product: any } | null>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const recognitionRef = useRef<any>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(fetchMenu());
  }, [dispatch]);

  const handleAddToCart = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Если у продукта есть ингредиенты, открываем модальное окно кастомизации
    if (product.productIngredients && product.productIngredients.length > 0) {
      setCustomizationProduct({ id: productId, product });
      dispatch(openCustomizationModal(productId));
    } else {
      // Если ингредиентов нет, добавляем сразу
      await addToCartDirectly(productId, [], 1);
    }
  };

  const addToCartDirectly = async (
    productId: string,
    customizations: IngredientQuantityCustomization[],
    quantity: number
  ) => {
    try {
      dispatch(setAddingToCartProductId(productId));
      await dispatch(addToCart({
        userId: DEFAULT_USER_ID,
        productId,
        quantity,
        customizations
      })).unwrap();
    } catch (err) {
      console.error('Error adding to cart:', err);
      alert('Не удалось добавить товар в корзину');
    } finally {
      dispatch(setAddingToCartProductId(null));
    }
  };

  const handleCustomizationConfirm = async (
    customizations: IngredientQuantityCustomization[],
    quantity: number
  ) => {
    if (!customizationProduct) return;
    await addToCartDirectly(customizationProduct.id, customizations, quantity);
    setCustomizationProduct(null);
    dispatch(closeCustomizationModal());
  };

  // Группировка продуктов по категориям (используем все продукты, не отфильтрованные)
  const groupedProducts = selectedCategory === null && !searchQuery
    ? allProducts.reduce((acc, product) => {
        const category = typeof product.productCategory === 'string'
          ? product.productCategory
          : ProductCategory[product.productCategory];
        const categoryKey = category === 'Pizza' || category === '0' || product.productCategory === 0
          ? ProductCategory.Pizza
          : category === 'Burger' || category === '1' || product.productCategory === 1
          ? ProductCategory.Burger
          : ProductCategory.Basket;
        
        if (!acc[categoryKey]) {
          acc[categoryKey] = [];
        }
        acc[categoryKey].push(product);
        return acc;
      }, {} as Record<ProductCategory, Product[]>)
    : null;



  const handleCategoryClick = (category: ProductCategory | null) => {
    dispatch(setSelectedCategory(category));
    dispatch(setSearchQuery(''));
    
    if (category === null && groupedProducts) {
      // Прокрутка к первой секции
      const firstCategory = Object.keys(groupedProducts)[0] as unknown as ProductCategory;
      const firstSection = sectionRefs.current[firstCategory];
      if (firstSection) {
        const headerOffset = 180; // Header (60px) + Catalog controls (~120px)
        const elementPosition = firstSection.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    } else if (category !== null) {
      // Прокрутка к секции категории
      const section = sectionRefs.current[category];
      if (section) {
        const headerOffset = 180; // Header (60px) + Catalog controls (~120px)
        const elementPosition = section.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
  };

  const getCategoryName = (category: ProductCategory) => {
    switch (category) {
      case ProductCategory.Pizza:
        return 'Пицца';
      case ProductCategory.Burger:
        return 'Бургеры';
      case ProductCategory.Basket:
        return 'Корзины';
      default:
        return '';
    }
  };

  // Voice order functions
  const startVoiceRecording = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Ваш браузер не поддерживает распознавание речи');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'ru-RU';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      dispatch(setRecording(true));
    };

    recognition.onresult = async (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join(' ');
      
      // Добавляем сообщение пользователя в историю
      dispatch(addVoiceChatMessage({ type: 'user', content: transcript }));
      
      // Прокрутка вниз после добавления сообщения пользователя
      setTimeout(() => {
        if (chatMessagesRef.current) {
          chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
      }, 100);
      
      await processVoiceOrder(transcript);
      dispatch(setRecording(false));
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      dispatch(setRecording(false));
      if (event.error === 'no-speech') {
        alert('Речь не распознана. Попробуйте еще раз.');
      } else {
        alert(`Ошибка распознавания речи: ${event.error}`);
      }
    };

    recognition.onend = () => {
      dispatch(setRecording(false));
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stopVoiceRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      dispatch(setRecording(false));
    }
  }, [dispatch]);

  const processVoiceOrder = async (text: string) => {
    try {
      dispatch(setProcessingVoiceOrder(true));
      
      const orderResponse: OrderResponse = await chatService.start(text);
      
      if (!orderResponse.products || orderResponse.products.length === 0) {
        // Если есть comment, показываем его, иначе показываем ошибку
        const content = orderResponse.comment || 'Не удалось распознать заказ. Попробуйте еще раз или уточните ваш запрос.';
        dispatch(addVoiceChatMessage({ 
          type: orderResponse.comment ? 'bot' : 'error', 
          content: content
        }));
        // Прокрутка вниз после добавления сообщения
        setTimeout(() => {
          if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
          }
        }, 100);
        return;
      }

      // Получаем продукты по id
      const productPromises = orderResponse.products.map(orderDto => 
        catalogService.getProduct(orderDto.productId)
      );
      
      const products = await Promise.all(productPromises);
      
      // Добавляем сообщение с продуктами в историю
      dispatch(addVoiceChatMessage({ 
        type: 'products', 
        content: '',
        products: products,
        orderResponse: orderResponse
      }));
      
      // Если есть комментарий, добавляем его как отдельное сообщение бота
      if (orderResponse.comment) {
        dispatch(addVoiceChatMessage({ 
          type: 'bot', 
          content: orderResponse.comment!
        }));
      }
      
      // Добавляем комментарии по дополнительным ингредиентам как отдельные сообщения бота
      orderResponse.products.forEach((orderDto, productIndex) => {
        if (orderDto.customIngredients) {
          orderDto.customIngredients.forEach((ci) => {
            if (ci.comment) {
              const product = products[productIndex];
              const commentText = `${product?.name || ''}: ${ci.name} - ${ci.comment}`.trim();
              if (commentText) {
                dispatch(addVoiceChatMessage({ 
                  type: 'bot', 
                  content: commentText
                }));
              }
            }
          });
        }
      });
      
      // Прокрутка вниз после получения ответа
      setTimeout(() => {
        if (chatMessagesRef.current) {
          chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
      }, 100);
    } catch (error: any) {
      console.error('Error processing voice order:', error);
      const errorText = error?.response?.data?.message || error?.message || 'Неизвестная ошибка';
      // Добавляем сообщение об ошибке в историю
      dispatch(addVoiceChatMessage({ 
        type: 'error', 
        content: `Ошибка обработки заказа: ${errorText}` 
      }));
      // Прокрутка вниз после добавления сообщения об ошибке
      setTimeout(() => {
        if (chatMessagesRef.current) {
          chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
      }, 100);
    } finally {
      dispatch(setProcessingVoiceOrder(false));
    }
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) {
      return;
    }

    const text = textInput.trim();
    dispatch(setVoiceTextInput(''));
    
    // Добавляем сообщение пользователя в историю
    dispatch(addVoiceChatMessage({ type: 'user', content: text }));
    
    // Прокрутка вниз после добавления сообщения пользователя
    setTimeout(() => {
      if (chatMessagesRef.current) {
        chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
      }
    }, 100);
    
    await processVoiceOrder(text);
  };

  const handleCreateOrder = async (orderResponse: OrderResponse, products: Product[]) => {
    if (!orderResponse || !products || products.length === 0) {
      return;
    }

    try {
      dispatch(setProcessingVoiceOrder(true));
      
      // Добавляем все продукты в корзину по очереди
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const orderDto = orderResponse.products?.[i];
        
        if (!orderDto) continue;
        
        // Преобразуем CustomIngredients в IngredientQuantityCustomization
        const customizations: IngredientQuantityCustomization[] = 
          orderDto.customIngredients?.map((ci: any) => ({
            ingredientId: product.productIngredients.find(
              (pi: any) => pi.ingredientName.toLowerCase() === ci.name.toLowerCase()
            )?.ingredientId || '',
            delta: ci.delta
          })).filter((c: any) => c.ingredientId) || [];

        await dispatch(addToCart({
          userId: DEFAULT_USER_ID,
          productId: product.id,
          quantity: orderDto.quantity,
          customizations
        })).unwrap();
      }
      
      // Обновляем корзину перед переходом на checkout
      await dispatch(fetchCart(DEFAULT_USER_ID)).unwrap();
      
      // Переадресация на страницу checkout
      navigate('/checkout');
    } catch (err: any) {
      console.error('Error creating order:', err);
      alert(`Ошибка при создании заказа: ${err?.response?.data?.message || err?.message || 'Неизвестная ошибка'}`);
    } finally {
      dispatch(setProcessingVoiceOrder(false));
    }
  };

  useEffect(() => {
    return () => {
      stopVoiceRecording();
    };
  }, [stopVoiceRecording]);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  if (loading) {
    return (
      <div className="container">
        <h1>Каталог</h1>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Загрузка каталога...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <h1>Каталог</h1>
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <p className="error-title">Не удалось загрузить каталог</p>
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="catalog-controls">
        <div className="search-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Поиск пиццы, напитков или ингредиентов..."
            value={searchQuery}
            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
          />
        </div>

        <div className="categories-nav">
          <button
            className={`category-pill ${selectedCategory === null ? 'active' : ''}`}
            onClick={() => handleCategoryClick(null)}
          >
            Все
          </button>
          <button
            className={`category-pill ${selectedCategory === ProductCategory.Pizza ? 'active' : ''}`}
            onClick={() => handleCategoryClick(ProductCategory.Pizza)}
          >
            Пицца
          </button>
          <button
            className={`category-pill ${selectedCategory === ProductCategory.Burger ? 'active' : ''}`}
            onClick={() => handleCategoryClick(ProductCategory.Burger)}
          >
            Бургеры
          </button>
          <button
            className={`category-pill ${selectedCategory === ProductCategory.Basket ? 'active' : ''}`}
            onClick={() => handleCategoryClick(ProductCategory.Basket)}
          >
            Корзины
          </button>
        </div>
      </div>

      {selectedCategory === null && !searchQuery && groupedProducts ? (
        <div className="catalog-sections">
          {Object.entries(groupedProducts).map(([category, categoryProducts]) => {
            const categoryNum = parseInt(category) as ProductCategory;
            return (
              <div
                key={category}
                ref={(el) => {
                  sectionRefs.current[categoryNum] = el;
                }}
                data-category={category}
                className="category-section"
              >
                <h2 className="section-title">{getCategoryName(categoryNum)}</h2>
                <div className="catalog-grid">
                  {categoryProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={addingToCart === product.id ? undefined : handleAddToCart}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="catalog-grid">
          {products.length === 0 ? (
            <div className="empty-state">Товары не найдены</div>
          ) : (
            products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addingToCart === product.id ? undefined : handleAddToCart}
              />
            ))
          )}
        </div>
      )}

      {customizationProduct && (
        <ProductCustomizationModal
          product={customizationProduct.product}
          isOpen={isCustomizationModalOpen}
          onClose={() => {
            setCustomizationProduct(null);
            dispatch(closeCustomizationModal());
          }}
          onConfirm={handleCustomizationConfirm}
        />
      )}

      {/* Voice order button - только открывает чат */}
      <button
        className="voice-order-btn"
        onClick={() => dispatch(openVoiceChat())}
        title="Открыть голосовой заказ"
      >
        <span className="voice-icon">🎤</span>
      </button>

      {/* Voice order chat modal */}
      {isChatOpen && (
        <div className="voice-order-modal">
          <div className="voice-order-content">
            <div className="voice-order-header">
              <h2>Голосовой заказ</h2>
              <button 
                className="voice-order-close"
                onClick={() => dispatch(closeVoiceChat())}
              >
                ×
              </button>
            </div>
            <div className="voice-chat-messages" ref={chatMessagesRef}>
              {chatMessages.map((message, index) => (
                <div key={index} className={`chat-message ${message.type === 'user' ? 'user-message' : 'bot-message'}`}>
                  <div className="message-avatar">
                    {message.type === 'user' ? '👤' : '🤖'}
                  </div>
                  <div className={`message-content ${message.type === 'error' ? 'error-message-content' : ''}`}>
                    {message.type === 'user' && <p>{message.content}</p>}
                    
                    {message.type === 'bot' && <p>{message.content}</p>}
                    
                    {message.type === 'error' && <p>{message.content}</p>}
                    
                    {message.type === 'products' && (
                      <>
                        {message.products && message.products.length > 0 && (
                          <>
                            <div className="voice-order-products">
                              {message.products.map((product, productIndex) => {
                                const orderDto = message.orderResponse?.products?.[productIndex];
                                
                                return (
                                  <div key={product.id} className="voice-order-product-card">
                                    <ProductCard
                                      product={product}
                                      onAddToCart={undefined}
                                    />
                                    {orderDto && (
                                      <div className="voice-order-info">
                                        <span>Количество: {orderDto.quantity}</span>
                                        {orderDto.customIngredients && orderDto.customIngredients.filter((ci: any) => ci.delta !== 0).length > 0 && (
                                          <div className="voice-order-customizations">
                                            <strong>Изменения:</strong>
                                            {orderDto.customIngredients
                                              .filter((ci: any) => ci.delta !== 0)
                                              .map((ci: any, idx: number) => (
                                                <div key={idx} className="customization-item">
                                                  <span className="customization-name">
                                                    {ci.name}: {ci.delta > 0 ? '+' : ''}{ci.delta}
                                                  </span>
                                                </div>
                                              ))}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            {message.orderResponse && message.products && message.products.length > 0 && (() => {
                              // Вычисляем итоговую цену
                              const totalPrice = message.products.reduce((sum, product, productIndex) => {
                                const orderDto = message.orderResponse?.products?.[productIndex];
                                if (!orderDto) return sum;
                                
                                const productPrice = product.price ?? product.ingredientsPrice ?? 0;
                                const quantity = orderDto.quantity || 1;
                                
                                // Учитываем кастомизации ингредиентов
                                let customizationPrice = 0;
                                if (orderDto.customIngredients && product.productIngredients) {
                                  orderDto.customIngredients.forEach((ci: any) => {
                                    const ingredient = product.productIngredients.find(
                                      (pi: any) => pi.ingredientName.toLowerCase() === ci.name.toLowerCase()
                                    );
                                    if (ingredient && ci.delta > 0) {
                                      customizationPrice += ingredient.price * ci.delta * quantity;
                                    }
                                  });
                                }
                                
                                return sum + (productPrice * quantity) + customizationPrice;
                              }, 0);
                              
                              return (
                                <div className="voice-order-footer" key={`footer-${index}`}>
                                  <div className="voice-order-total-price">
                                    <span className="total-price-label">Итого:</span>
                                    <span className="total-price-value">{totalPrice.toFixed(0)} ₽</span>
                                  </div>
                                  <button
                                    className="voice-order-create-btn"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (message.orderResponse && message.products) {
                                        handleCreateOrder(message.orderResponse, message.products);
                                      }
                                    }}
                                    disabled={isProcessingVoiceOrder}
                                  >
                                    {isProcessingVoiceOrder ? 'Добавление...' : 'Создать заказ'}
                                  </button>
                                </div>
                              );
                            })()}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
              
              {isProcessingVoiceOrder && (
                <div className="chat-message bot-message">
                  <div className="message-avatar">🤖</div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="voice-chat-input">
              <input
                type="text"
                className="voice-chat-text-input"
                placeholder="Введите ваш заказ или нажмите микрофон..."
                value={textInput}
                onChange={(e) => dispatch(setVoiceTextInput(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleTextSubmit();
                  }
                }}
                disabled={isProcessingVoiceOrder || isRecording}
              />
              <button
                className={`voice-chat-mic-btn ${isRecording ? 'recording' : ''}`}
                onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                disabled={isProcessingVoiceOrder}
                title={isRecording ? 'Остановить запись' : 'Запись голоса'}
              >
                {isRecording ? (
                  <span>⏹️</span>
                ) : (
                  <span>🎤</span>
                )}
              </button>
              <button
                className="voice-chat-send-btn"
                onClick={handleTextSubmit}
                disabled={isProcessingVoiceOrder || isRecording || !textInput.trim()}
                title="Отправить"
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

