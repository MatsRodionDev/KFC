import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatService, ChatMessage, fetchChatHistory } from '../../services/chatService';
import { appendUniqueChatMessage, dedupeChatMessages } from '../../utils/chatMessages';
import './ChatWidget.css';

interface Props {
  orderId: string;
  customerName: string;
}

export function ChatWidget({ orderId, customerName }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const serviceRef = useRef<ChatService | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  useEffect(() => {
    let cancelled = false;
    const svc = new ChatService();
    serviceRef.current = svc;

    const init = async () => {
      const history = await fetchChatHistory(orderId);
      if (cancelled) return;
      setMessages(dedupeChatMessages(history));

      try {
        await svc.connect();
        if (cancelled) return;
        await svc.joinRoom(orderId, customerName);
        if (cancelled) return;
        setIsConnected(true);
      } catch (e) {
        console.warn('Chat connection failed:', e);
      }

      svc.onMessage((msg) => {
        if (cancelled) return;
        setMessages((prev) => appendUniqueChatMessage(prev, msg));
        if (!isOpenRef.current) setUnreadCount((n) => n + 1);
      });
    };

    init();

    return () => {
      cancelled = true;
      serviceRef.current = null;
      svc.leaveRoom(orderId, customerName).catch(() => {});
      svc.offAll();
      svc.disconnect().catch(() => {});
    };
  }, [orderId, customerName]);

  // Прокрутка вниз при новом сообщении
  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Сброс непрочитанных при открытии
  const handleToggle = () => {
    setIsOpen((v) => !v);
    setUnreadCount(0);
  };

  // ── Отправка ──────────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !serviceRef.current || !isConnected) return;
    setInputText('');
    try {
      await serviceRef.current.sendMessage(orderId, text, customerName);
    } catch (e) {
      console.warn('Send failed:', e);
    }
  }, [inputText, orderId, customerName, isConnected]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="chat-widget">
      {/* Всплывающая панель */}
      {isOpen && (
        <div className="chat-panel">
          <div className="chat-header">
            <span className="chat-title">💬 Чат с курьером</span>
            <span className={`chat-status ${isConnected ? 'online' : 'offline'}`}>
              {isConnected ? '● Онлайн' : '○ Нет связи'}
            </span>
          </div>

          <div className="chat-messages">
            {messages.length === 0 && (
              <p className="chat-empty">Напишите первое сообщение курьеру</p>
            )}
            {messages.map((msg) => {
              const isMine = msg.role === 'customer';
              return (
                <div
                  key={msg.id}
                  className={`chat-bubble ${isMine ? 'mine' : 'theirs'}`}
                >
                  {!isMine && (
                    <span className="chat-sender">{msg.senderName}</span>
                  )}
                  <p className="chat-text">{msg.text}</p>
                  <span className="chat-time">
                    {new Date(msg.sentAt).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <div className="chat-input-row">
            <textarea
              className="chat-input"
              placeholder="Сообщение…"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              maxLength={500}
            />
            <button
              className="chat-send-btn"
              onClick={handleSend}
              disabled={!inputText.trim() || !isConnected}
            >
              ↑
            </button>
          </div>
        </div>
      )}

      {/* FAB-кнопка */}
      <button className="chat-fab" onClick={handleToggle} title="Чат с курьером">
        💬
        {unreadCount > 0 && (
          <span className="chat-badge">{unreadCount}</span>
        )}
      </button>
    </div>
  );
}
