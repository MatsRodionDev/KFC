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
  fetchMenu,
} from '../../store/slices/menuSlice';
import {
  selectIsVoiceChatOpen,
  selectVoiceTextInput,
  selectAddingToCartProductId,
  selectIsCustomizationModalOpen,
  openVoiceChat,
  setRecording,
  setProcessingVoiceOrder,
  addVoiceChatMessage,
  setVoiceTextInput,
  setAddingToCartProductId,
  openCustomizationModal,
  closeCustomizationModal,
} from '../../store/slices/uiSlice';
import { addToCart, fetchCart } from '../../store/slices/cartSlice';
import { ProductCustomizationModal } from '../../components/ProductCustomizationModal';
import { chatService, catalogService } from '../../services/api';
import {
  ProductCategory,
  IngredientQuantityCustomization,
  Product,
  OrderResponse,
} from '../../types';
import { useUserId } from '../../hooks/useUserId';
import { useOrderStatusHub } from '../../hooks/useOrderStatusHub';
import { groupProductsByCategory } from './catalogUtils';
import { ActiveOrdersBlock } from './ActiveOrdersBlock';
import { CatalogControls } from './CatalogControls';
import { CatalogContent } from './CatalogContent';
import { VoiceOrderModal } from './VoiceOrderModal';
import { MenuLoadingState } from './MenuLoadingState';
import { MenuErrorState } from './MenuErrorState';
import './MenuPage.css';

declare global {
  interface Window {
    webkitSpeechRecognition: unknown;
    SpeechRecognition: unknown;
  }
}

const HEADER_OFFSET = 180;

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
  const addingToCart = useAppSelector(selectAddingToCartProductId);
  const isCustomizationModalOpen = useAppSelector(selectIsCustomizationModalOpen);

  const userId = useUserId();
  const { activeOrders: orderStatusesFromHub, hasReceivedFromHub } = useOrderStatusHub(userId ?? null);

  const [customizationProduct, setCustomizationProduct] = useState<{ id: string; product: Product } | null>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  const groupedProducts =
    selectedCategory === null && !searchQuery ? groupProductsByCategory(allProducts) : null;

  useEffect(() => {
    dispatch(fetchMenu());
  }, [dispatch]);

  const handleAddToCart = useCallback(
    async (productId: string) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return;
      if (product.productIngredients?.length) {
        setCustomizationProduct({ id: productId, product });
        dispatch(openCustomizationModal(productId));
      } else {
        await addToCartDirectly(productId, [], 1);
      }
    },
    [products]
  );

  const addToCartDirectly = useCallback(
    async (
      productId: string,
      customizations: IngredientQuantityCustomization[],
      quantity: number
    ) => {
      try {
        dispatch(setAddingToCartProductId(productId));
        await dispatch(
          addToCart({ userId: userId!, productId, quantity, customizations })
        ).unwrap();
      } catch (err) {
        console.error('Error adding to cart:', err);
        alert('Не удалось добавить товар в корзину');
      } finally {
        dispatch(setAddingToCartProductId(null));
      }
    },
    [dispatch, userId]
  );

  const handleCustomizationConfirm = useCallback(
    async (customizations: IngredientQuantityCustomization[], quantity: number) => {
      if (!customizationProduct) return;
      await addToCartDirectly(customizationProduct.id, customizations, quantity);
      setCustomizationProduct(null);
      dispatch(closeCustomizationModal());
    },
    [customizationProduct, addToCartDirectly, dispatch]
  );

  const scrollToSection = useCallback(
    (category: ProductCategory | null, groupedWhenAll?: Record<ProductCategory, Product[]>) => {
      const key =
        category !== null
          ? category
          : (groupedWhenAll && (Object.keys(groupedWhenAll)[0] as unknown as ProductCategory));
      if (key === undefined) return;
      const section = sectionRefs.current[key];
      if (section) {
        const elementPosition = section.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - HEADER_OFFSET;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    },
    []
  );

  const handleCategoryClick = useCallback(
    (category: ProductCategory | null) => {
      dispatch(setSelectedCategory(category));
      dispatch(setSearchQuery(''));
      if (category === null) {
        scrollToSection(null, groupProductsByCategory(allProducts));
      } else {
        scrollToSection(category);
      }
    },
    [dispatch, scrollToSection, allProducts]
  );

  const processVoiceOrder = useCallback(
    async (text: string) => {
      try {
        dispatch(setProcessingVoiceOrder(true));
        const orderResponse = await chatService.start(text);

        if (!orderResponse.products?.length) {
          const content =
            orderResponse.comment ||
            'Не удалось распознать заказ. Попробуйте еще раз или уточните ваш запрос.';
          dispatch(
            addVoiceChatMessage({ type: orderResponse.comment ? 'bot' : 'error', content })
          );
          setTimeout(() => {
            chatMessagesRef.current && (chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight);
          }, 100);
          return;
        }

        const productList = await Promise.all(
          orderResponse.products.map((dto) => catalogService.getProduct(dto.productId))
        );

        dispatch(
          addVoiceChatMessage({
            type: 'products',
            content: '',
            products: productList,
            orderResponse,
          })
        );

        if (orderResponse.comment) {
          dispatch(addVoiceChatMessage({ type: 'bot', content: orderResponse.comment }));
        }

        orderResponse.products.forEach((orderDto, productIndex) => {
          orderDto.customIngredients?.forEach((ci) => {
            if (ci.comment) {
              const product = productList[productIndex];
              const commentText = `${product?.name ?? ''}: ${ci.name} - ${ci.comment}`.trim();
              if (commentText) {
                dispatch(addVoiceChatMessage({ type: 'bot', content: commentText }));
              }
            }
          });
        });

        setTimeout(() => {
          chatMessagesRef.current && (chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight);
        }, 100);
      } catch (err: unknown) {
        const errObj = err as { response?: { data?: { message?: string } }; message?: string };
        const errorText =
          errObj?.response?.data?.message ?? errObj?.message ?? 'Неизвестная ошибка';
        dispatch(
          addVoiceChatMessage({ type: 'error', content: `Ошибка обработки заказа: ${errorText}` })
        );
        setTimeout(() => {
          chatMessagesRef.current && (chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight);
        }, 100);
      } finally {
        dispatch(setProcessingVoiceOrder(false));
      }
    },
    [dispatch]
  );

  const startVoiceRecording = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Ваш браузер не поддерживает распознавание речи');
      return;
    }
    const SpeechRecognition =
      (window as Window & { webkitSpeechRecognition?: new () => { stop: () => void; start: () => void; onstart: () => void; onresult: (e: unknown) => void; onerror: (e: unknown) => void; onend: () => void; lang: string; continuous: boolean; interimResults: boolean } }).webkitSpeechRecognition ||
      (window as Window & { SpeechRecognition?: new () => { stop: () => void; start: () => void; onstart: () => void; onresult: (e: unknown) => void; onerror: (e: unknown) => void; onend: () => void; lang: string; continuous: boolean; interimResults: boolean } }).SpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'ru-RU';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => dispatch(setRecording(true));
    recognition.onresult = async (event: unknown) => {
      const e = event as { results: Iterable<{ 0: { transcript: string } }> };
      const transcript = Array.from(e.results).map((r) => r[0].transcript).join(' ');
      dispatch(addVoiceChatMessage({ type: 'user', content: transcript }));
      setTimeout(() => {
        chatMessagesRef.current && (chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight);
      }, 100);
      await processVoiceOrder(transcript);
      dispatch(setRecording(false));
    };
    recognition.onerror = (event: unknown) => {
      const e = event as { error: string };
      dispatch(setRecording(false));
      alert(e.error === 'no-speech' ? 'Речь не распознана. Попробуйте еще раз.' : `Ошибка: ${e.error}`);
    };
    recognition.onend = () => dispatch(setRecording(false));
    recognitionRef.current = recognition;
    recognition.start();
  }, [dispatch, processVoiceOrder]);

  const stopVoiceRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      dispatch(setRecording(false));
    }
  }, [dispatch]);

  const textInput = useAppSelector(selectVoiceTextInput);
  const handleTextSubmit = useCallback(() => {
    if (!textInput.trim()) return;
    const text = textInput.trim();
    dispatch(setVoiceTextInput(''));
    dispatch(addVoiceChatMessage({ type: 'user', content: text }));
    setTimeout(() => {
      chatMessagesRef.current && (chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight);
    }, 100);
    processVoiceOrder(text);
  }, [dispatch, processVoiceOrder, textInput]);

  const handleCreateOrder = useCallback(
    async (orderResponse: OrderResponse, productList: Product[]) => {
      if (!orderResponse?.products?.length || !productList?.length) return;
      try {
        dispatch(setProcessingVoiceOrder(true));
        for (let i = 0; i < productList.length; i++) {
          const product = productList[i];
          const orderDto = orderResponse.products[i];
          if (!orderDto) continue;
          const customizations: IngredientQuantityCustomization[] =
            orderDto.customIngredients?.map((ci: { name: string; delta: number }) => ({
              ingredientId:
                product.productIngredients?.find(
                  (pi) => pi.ingredientName.toLowerCase() === ci.name.toLowerCase()
                )?.ingredientId ?? '',
              delta: ci.delta,
            })).filter((c) => c.ingredientId) ?? [];
          await dispatch(
            addToCart({
              userId: userId!,
              productId: product.id,
              quantity: orderDto.quantity,
              customizations,
            })
          ).unwrap();
        }
        await dispatch(fetchCart(userId!)).unwrap();
        navigate('/checkout');
      } catch (err: unknown) {
        const errObj = err as { response?: { data?: { message?: string } }; message?: string };
        alert(`Ошибка: ${errObj?.response?.data?.message ?? errObj?.message ?? 'Неизвестная ошибка'}`);
      } finally {
        dispatch(setProcessingVoiceOrder(false));
      }
    },
    [dispatch, userId, navigate]
  );

  useEffect(() => {
    return () => {
      stopVoiceRecording();
    };
  }, [stopVoiceRecording]);

  if (loading) return <MenuLoadingState />;
  if (error) return <MenuErrorState error={error} />;

  return (
    <div className="container">
      <ActiveOrdersBlock activeOrders={orderStatusesFromHub} visible={hasReceivedFromHub} />

      <CatalogControls
        searchQuery={searchQuery}
        onSearchChange={(value) => dispatch(setSearchQuery(value))}
        selectedCategory={selectedCategory}
        onCategoryClick={handleCategoryClick}
      />

      <CatalogContent
        groupedProducts={groupedProducts}
        products={products}
        selectedCategory={selectedCategory}
        searchQuery={searchQuery}
        sectionRefs={sectionRefs}
        addingToCartProductId={addingToCart}
        onAddToCart={handleAddToCart}
      />

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

      <button
        type="button"
        className="voice-order-btn"
        onClick={() => dispatch(openVoiceChat())}
        title="Открыть голосовой заказ"
      >
        <span className="voice-icon">🎤</span>
      </button>

      {isChatOpen && (
        <VoiceOrderModal
          onStartRecording={startVoiceRecording}
          onStopRecording={stopVoiceRecording}
          onSubmitText={handleTextSubmit}
          onCreateOrder={handleCreateOrder}
        />
      )}
    </div>
  );
};
