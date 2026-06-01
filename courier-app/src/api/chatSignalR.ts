import * as SignalR from '@microsoft/signalr';

const CHAT_HUB_URL =
  process.env.EXPO_PUBLIC_CHAT_HUB_URL ?? 'http://localhost:5200/hubs/chat';

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
      .configureLogging(SignalR.LogLevel.Warning)
      .build();
  }

  async start(): Promise<void> {
    if (this.connection.state === SignalR.HubConnectionState.Disconnected) {
      await this.connection.start();
    }
  }

  async stop(): Promise<void> {
    await this.connection.stop();
  }

  async joinRoom(orderId: string, senderName: string): Promise<void> {
    await this.connection.invoke('JoinRoom', orderId, senderName);
  }

  async leaveRoom(orderId: string, senderName: string): Promise<void> {
    await this.connection.invoke('LeaveRoom', orderId, senderName);
  }

  async sendMessage(
    orderId: string,
    text: string,
    senderName: string,
    role: 'courier' | 'customer',
  ): Promise<void> {
    await this.connection.invoke('SendMessage', orderId, text, senderName, role);
  }

  onMessage(callback: OnMessageCallback): void {
    this.connection.on('ReceiveMessage', callback);
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

const CHAT_API_URL =
  process.env.EXPO_PUBLIC_CHAT_API_URL ?? 'http://localhost:5200';

export async function fetchMessageHistory(
  orderId: string,
): Promise<ChatMessage[]> {
  const res = await fetch(`${CHAT_API_URL}/api/messages/${orderId}`);
  if (!res.ok) return [];
  return res.json();
}
