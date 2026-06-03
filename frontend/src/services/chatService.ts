import * as SignalR from '@microsoft/signalr';

const chatApiBase =
  import.meta.env.VITE_CHAT_API_URL ??
  (import.meta.env.DEV ? '' : 'http://localhost:5200');

const CHAT_HUB_URL =
  import.meta.env.VITE_CHAT_HUB_URL ??
  (import.meta.env.DEV ? '/hubs/chat' : 'http://localhost:5200/hubs/chat');

const CHAT_API_URL = chatApiBase || '';

export interface ChatMessage {
  id: string;
  orderId: string;
  senderName: string;
  role: 'courier' | 'customer';
  text: string;
  sentAt: string;
}

export type OnMessageCallback = (msg: ChatMessage) => void;

export class ChatService {
  private connection: SignalR.HubConnection;

  constructor() {
    this.connection = new SignalR.HubConnectionBuilder()
      .withUrl(CHAT_HUB_URL, {
        skipNegotiation: false,
        transport: SignalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect()
      .configureLogging(SignalR.LogLevel.Warning)
      .build();
  }

  async connect(): Promise<void> {
    if (this.connection.state === SignalR.HubConnectionState.Disconnected) {
      await this.connection.start();
    }
  }

  async disconnect(): Promise<void> {
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
  ): Promise<void> {
    await this.connection.invoke(
      'SendMessage',
      orderId,
      text,
      senderName,
      'customer',
    );
  }

  onMessage(callback: OnMessageCallback): void {
    this.connection.off('ReceiveMessage');
    this.connection.on('ReceiveMessage', callback);
  }

  offAll(): void {
    this.connection.off('ReceiveMessage');
    this.connection.off('UserJoined');
    this.connection.off('UserLeft');
  }

  get state(): SignalR.HubConnectionState {
    return this.connection.state;
  }
}

export async function fetchChatHistory(
  orderId: string,
): Promise<ChatMessage[]> {
  try {
    const res = await fetch(`${CHAT_API_URL}/api/messages/${orderId}`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}
