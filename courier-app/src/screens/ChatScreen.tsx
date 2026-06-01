import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from '../types';
import {
  ChatConnection,
  ChatMessage,
  fetchMessageHistory,
} from '../api/chatSignalR';

type Props = {
  route: RouteProp<RootStackParamList, 'Chat'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'Chat'>;
};

export default function ChatScreen({ route }: Props) {
  const { orderId, courierName } = route.params;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const connRef = useRef<ChatConnection | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  // ── Инициализация ─────────────────────────────────────────────────────────

  useEffect(() => {
    const conn = new ChatConnection();
    connRef.current = conn;

    const init = async () => {
      // Загружаем историю через REST
      const history = await fetchMessageHistory(orderId);
      setMessages(history);
      setIsLoading(false);

      // Подключаемся к хабу
      try {
        await conn.start();
        await conn.joinRoom(orderId, courierName);
        setIsConnected(true);
      } catch (e) {
        console.warn('ChatHub connection failed:', e);
      }

      // Слушаем входящие сообщения
      conn.onMessage((msg) => {
        setMessages((prev) => [...prev, msg]);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      });
    };

    init();

    return () => {
      conn.leaveRoom(orderId, courierName).catch(() => {});
      conn.offMessage();
      conn.stop().catch(() => {});
    };
  }, [orderId, courierName]);

  // ── Отправка ──────────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !connRef.current || !isConnected) return;

    setInputText('');
    try {
      await connRef.current.sendMessage(orderId, text, courierName, 'courier');
    } catch (e) {
      console.warn('Send failed:', e);
    }
  }, [inputText, orderId, courierName, isConnected]);

  // ── Рендер сообщения ──────────────────────────────────────────────────────

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isMine = item.role === 'courier';
    return (
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheir]}>
        {!isMine && (
          <Text style={styles.senderName}>{item.senderName}</Text>
        )}
        <Text style={isMine ? styles.textMine : styles.textTheir}>
          {item.text}
        </Text>
        <Text style={styles.time}>
          {new Date(item.sentAt).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  // ── UI ────────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Строка статуса подключения */}
      <View style={[styles.statusBar, isConnected ? styles.statusOnline : styles.statusOffline]}>
        <Text style={styles.statusText}>
          {isConnected ? '🟢 Подключено' : '🔴 Нет соединения'}
        </Text>
      </View>

      {/* Список сообщений */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9500" />
          <Text style={styles.loadingText}>Загрузка истории…</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: false })
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>Напишите первое сообщение</Text>
          }
        />
      )}

      {/* Поле ввода */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Сообщение…"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || !isConnected}
        >
          <Text style={styles.sendBtnText}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },

  statusBar: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  statusOnline: { backgroundColor: '#e8f5e9' },
  statusOffline: { backgroundColor: '#ffebee' },
  statusText: { fontSize: 12, fontWeight: '600' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#888' },

  messageList: { padding: 12, paddingBottom: 8 },
  emptyText: { textAlign: 'center', color: '#aaa', marginTop: 40 },

  bubble: {
    maxWidth: '78%',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  bubbleMine: {
    alignSelf: 'flex-end',
    backgroundColor: '#FF9500',
    borderBottomRightRadius: 4,
  },
  bubbleTheir: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  senderName: { fontSize: 11, color: '#888', marginBottom: 2 },
  textMine: { color: '#fff', fontSize: 15 },
  textTheir: { color: '#222', fontSize: 15 },
  time: { fontSize: 10, color: 'rgba(0,0,0,0.35)', marginTop: 4, alignSelf: 'flex-end' },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FF9500',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#ccc' },
  sendBtnText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
});
