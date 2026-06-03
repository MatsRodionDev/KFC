import type { ChatMessage } from '../services/chatService';

/** Убирает дубликаты по id (история REST + SignalR). */
export const dedupeChatMessages = (messages: ChatMessage[]): ChatMessage[] => {
  const seen = new Set<string>();
  return messages.filter((m) => {
    if (!m.id || seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
};

export const appendUniqueChatMessage = (
  prev: ChatMessage[],
  msg: ChatMessage,
): ChatMessage[] => {
  if (msg.id && prev.some((m) => m.id === msg.id)) return prev;
  return [...prev, msg];
};
