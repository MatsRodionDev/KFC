import * as SignalR from '@microsoft/signalr';

import { getChatApiBase, getChatHubUrl } from '../config/apiBase';
import { loggedFetch } from './loggedFetch';
import { logger } from '../utils/logger';

const CHAT_HUB_URL = getChatHubUrl();

export interface ChatMessage {
  id: string;
  orderId: string;
  senderName: string;
  role: 'courier' | 'customer';
  text: string;
  sentAt: string;
}

export type OnMessageCallback = (msg: ChatMessage) => void;
export type OnUserCallback = (name: string) => void;

export class ChatConnection {
  private connection: SignalR.HubConnection;

  constructor() {
    this.connection = new SignalR.HubConnectionBuilder()
      .withUrl(CHAT_HUB_URL)
      .withAutomaticReconnect()
      .configureLogging(
        __DEV__ ? SignalR.LogLevel.Information : SignalR.LogLevel.Warning,
      )
      .build();
  }

  async start(): Promise<void> {
    if (this.connection.state === SignalR.HubConnectionState.Disconnected) {
      logger.info('ChatHub', `→ connect ${CHAT_HUB_URL}`);
      await this.connection.start();
      logger.info('ChatHub', '← connected', { state: this.connection.state });
    }
  }

  async stop(): Promise<void> {
    await this.connection.stop();
  }

  async joinRoom(orderId: string, senderName: string): Promise<void> {
    logger.info('ChatHub', '→ JoinRoom', { orderId, senderName });
    await this.connection.invoke('JoinRoom', orderId, senderName);
    logger.info('ChatHub', '← JoinRoom ok');
  }

  async leaveRoom(orderId: string, senderName: string): Promise<void> {
    logger.info('ChatHub', '→ LeaveRoom', { orderId, senderName });
    await this.connection.invoke('LeaveRoom', orderId, senderName);
    logger.info('ChatHub', '← LeaveRoom ok');
  }

  async sendMessage(
    orderId: string,
    text: string,
    senderName: string,
    role: 'courier' | 'customer',
  ): Promise<void> {
    logger.info('ChatHub', '→ SendMessage', { orderId, senderName, role, text });
    await this.connection.invoke('SendMessage', orderId, text, senderName, role);
    logger.info('ChatHub', '← SendMessage ok');
  }

  onMessage(callback: OnMessageCallback): void {
    this.connection.on('ReceiveMessage', (msg: ChatMessage) => {
      logger.info('ChatHub', '← ReceiveMessage', msg);
      callback(msg);
    });
  }

  onUserJoined(callback: OnUserCallback): void {
    this.connection.on('UserJoined', callback);
  }

  onUserLeft(callback: OnUserCallback): void {
    this.connection.on('UserLeft', callback);
  }

  offMessage(): void {
    this.connection.off('ReceiveMessage');
  }
}

// ── REST: загрузка истории ────────────────────────────────────────────────

export async function fetchMessageHistory(
  orderId: string,
): Promise<ChatMessage[]> {
  const res = await loggedFetch(
    `${getChatApiBase()}/api/messages/${orderId}`,
    undefined,
    'ChatAPI',
  );
  if (!res.ok) return [];
  return res.json();
}
