import { useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectVoiceChatMessages,
  selectVoiceTextInput,
  selectIsRecording,
  selectIsProcessingVoiceOrder,
  setVoiceTextInput,
  closeVoiceChat,
} from '../../store/slices/uiSlice';
import { ProductCard } from '../../components/ProductCard';
import type { Product, OrderResponse } from '../../types';

export interface VoiceOrderModalProps {
  onStartRecording: () => void;
  onStopRecording: () => void;
  onSubmitText: () => void;
  onCreateOrder: (orderResponse: OrderResponse, products: Product[]) => void;
}

export function VoiceOrderModal({
  onStartRecording,
  onStopRecording,
  onSubmitText,
  onCreateOrder,
}: VoiceOrderModalProps) {
  const dispatch = useAppDispatch();
  const chatMessages = useAppSelector(selectVoiceChatMessages);
  const textInput = useAppSelector(selectVoiceTextInput);
  const isRecording = useAppSelector(selectIsRecording);
  const isProcessingVoiceOrder = useAppSelector(selectIsProcessingVoiceOrder);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  return (
    <div className="voice-order-modal">
      <div className="voice-order-content">
        <div className="voice-order-header">
          <h2>Голосовой заказ</h2>
          <button type="button" className="voice-order-close" onClick={() => dispatch(closeVoiceChat())}>
            ×
          </button>
        </div>
        <div className="voice-chat-messages" ref={chatMessagesRef}>
          {chatMessages.map((message, index) => (
            <div key={index} className={`chat-message ${message.type === 'user' ? 'user-message' : 'bot-message'}`}>
              <div className="message-avatar">{message.type === 'user' ? '👤' : '🤖'}</div>
              <div className={`message-content ${message.type === 'error' ? 'error-message-content' : ''}`}>
                {message.type === 'user' && <p>{message.content}</p>}
                {message.type === 'bot' && <p>{message.content}</p>}
                {message.type === 'error' && <p>{message.content}</p>}
                {message.type === 'products' && message.products && message.products.length > 0 && (
                  <>
                    <div className="voice-order-products">
                      {message.products.map((product, productIndex) => {
                        const orderDto = message.orderResponse?.products?.[productIndex];
                        return (
                          <div key={product.id} className="voice-order-product-card">
                            <ProductCard product={product} onAddToCart={undefined} />
                            {orderDto && (
                              <div className="voice-order-info">
                                <span>Количество: {orderDto.quantity}</span>
                                {orderDto.customIngredients?.filter((ci: { delta: number }) => ci.delta !== 0).length ? (
                                  <div className="voice-order-customizations">
                                    <strong>Изменения:</strong>
                                    {orderDto.customIngredients
                                      .filter((ci: { delta: number }) => ci.delta !== 0)
                                      .map((ci: { name: string; delta: number }, idx: number) => (
                                        <div key={idx} className="customization-item">
                                          <span className="customization-name">
                                            {ci.name}: {ci.delta > 0 ? '+' : ''}{ci.delta}
                                          </span>
                                        </div>
                                      ))}
                                  </div>
                                ) : null}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {message.orderResponse && message.products && message.products.length > 0 && (
                      <VoiceOrderFooter
                        message={{ type: 'products', products: message.products, orderResponse: message.orderResponse }}
                        index={index}
                        isProcessingVoiceOrder={isProcessingVoiceOrder}
                        onCreateOrder={onCreateOrder}
                      />
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
                  <span />
                  <span />
                  <span />
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
                onSubmitText();
              }
            }}
            disabled={isProcessingVoiceOrder || isRecording}
          />
          <button
            type="button"
            className={`voice-chat-mic-btn ${isRecording ? 'recording' : ''}`}
            onClick={isRecording ? onStopRecording : onStartRecording}
            disabled={isProcessingVoiceOrder}
            title={isRecording ? 'Остановить запись' : 'Запись голоса'}
          >
            {isRecording ? <span>⏹️</span> : <span>🎤</span>}
          </button>
          <button
            type="button"
            className="voice-chat-send-btn"
            onClick={onSubmitText}
            disabled={isProcessingVoiceOrder || isRecording || !textInput.trim()}
            title="Отправить"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}

interface VoiceChatMessageProducts {
  type: 'products';
  products?: Product[];
  orderResponse?: OrderResponse;
}

interface VoiceOrderFooterProps {
  message: VoiceChatMessageProducts;
  index: number;
  isProcessingVoiceOrder: boolean;
  onCreateOrder: (orderResponse: OrderResponse, products: Product[]) => void;
}

function VoiceOrderFooter({ message, index, isProcessingVoiceOrder, onCreateOrder }: VoiceOrderFooterProps) {
  const totalPrice =
    message.products?.reduce((sum, product, productIndex) => {
      const orderDto = message.orderResponse?.products?.[productIndex];
      if (!orderDto) return sum;
      const productPrice = product.price ?? (product as { ingredientsPrice?: number }).ingredientsPrice ?? 0;
      const quantity = orderDto.quantity || 1;
      let customizationPrice = 0;
      if (orderDto.customIngredients && product.productIngredients) {
        orderDto.customIngredients.forEach((ci: { name: string; delta: number }) => {
          const ingredient = product.productIngredients?.find(
            (pi: { ingredientName: string }) => pi.ingredientName.toLowerCase() === ci.name.toLowerCase()
          );
          if (ingredient && ci.delta > 0) {
            customizationPrice += (ingredient as { price: number }).price * ci.delta * quantity;
          }
        });
      }
      return sum + productPrice * quantity + customizationPrice;
    }, 0) ?? 0;

  return (
    <div className="voice-order-footer" key={`footer-${index}`}>
      <div className="voice-order-total-price">
        <span className="total-price-label">Итого:</span>
        <span className="total-price-value">{totalPrice.toFixed(0)} ₽</span>
      </div>
      <button
        type="button"
        className="voice-order-create-btn"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (message.orderResponse && message.products) {
            onCreateOrder(message.orderResponse, message.products);
          }
        }}
        disabled={isProcessingVoiceOrder}
      >
        {isProcessingVoiceOrder ? 'Добавление...' : 'Создать заказ'}
      </button>
    </div>
  );
}
