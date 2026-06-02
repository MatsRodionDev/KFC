import React, { useEffect, useCallback } from 'react';
import {
  View, Text, Switch, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppStore } from '../store/useAppStore';
import { RootStackParamList, Order } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;
};

export default function DashboardScreen({ navigation }: Props) {
  const { isOnline, toggleStatus, orders, logout, fetchOrders, isLoadingOrders } = useAppStore();

  // Загружаем заказы при монтировании и при выходе на линию
  useEffect(() => {
    if (isOnline) {
      fetchOrders();
    }
  }, [isOnline]);

  const handleRefresh = useCallback(() => {
    if (isOnline) fetchOrders();
  }, [isOnline]);

  const handleToggle = () => {
    toggleStatus();
    // При выходе на линию сразу загружаем актуальные заказы
    if (!isOnline) {
      setTimeout(() => fetchOrders(), 50);
    }
  };

  const activeOrders = orders
    .filter(order => order.status !== 'delivered')
    .sort((a, b) => {
      const distA = parseFloat(a.distance);
      const distB = parseFloat(b.distance);
      if (isNaN(distA) && isNaN(distB)) return 0;
      if (isNaN(distA)) return 1;
      if (isNaN(distB)) return -1;
      return distA - distB;
    });

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => navigation.navigate('OrderDetails', { order: item })}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.price}>{item.price} ₽</Text>
        <Text style={styles.distance}>{item.distance}</Text>
      </View>
      <Text style={styles.address}>А: {item.addressA}</Text>
      <Text style={styles.address}>Б: {item.addressB}</Text>
      {item.items && item.items.length > 0 && (
        <Text style={styles.itemsHint} numberOfLines={1}>
          📦 {item.items.map(i => `${i.name} ×${i.quantity}`).join(', ')}
        </Text>
      )}
      <Text style={styles.statusBadge}>Статус: {item.status}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>
            {isOnline ? '🟢 На линии' : '🔴 Офлайн'}
          </Text>
          <Switch value={isOnline} onValueChange={handleToggle} />
        </View>

        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => navigation.navigate('History')}
        >
          <Text style={styles.historyBtnText}>🗓 История</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.historyBtn, { backgroundColor: '#ffebee' }]}
          onPress={logout}
        >
          <Text style={[styles.historyBtnText, { color: '#d32f2f' }]}>🚪 Выйти</Text>
        </TouchableOpacity>
      </View>

      {isOnline ? (
        <>
          {isLoadingOrders && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Обновление заказов…</Text>
            </View>
          )}

          <FlatList
            data={activeOrders}
            keyExtractor={item => item.id}
            renderItem={renderOrderItem}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={isLoadingOrders}
                onRefresh={handleRefresh}
                tintColor="#007AFF"
                title="Обновление заказов…"
              />
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {isLoadingOrders ? '' : 'Нет доступных заказов'}
              </Text>
            }
          />
        </>
      ) : (
        <View style={styles.offlineContainer}>
          <Text style={styles.offlineText}>
            Выйдите на линию, чтобы получать заказы
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#f5f5f5' },
  header:           { padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  statusRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  statusText:       { fontSize: 18, fontWeight: '600' },
  historyBtn:       { backgroundColor: '#e8e8e8', padding: 10, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
  historyBtnText:   { fontSize: 16, fontWeight: '600', color: '#333' },
  loadingRow:       { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 8, backgroundColor: '#f0f8ff' },
  loadingText:      { fontSize: 13, color: '#007AFF' },
  list:             { padding: 15 },
  orderCard:        { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  orderHeader:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  price:            { fontSize: 20, fontWeight: 'bold', color: '#28a745' },
  distance:         { fontSize: 16, color: '#666' },
  address:          { fontSize: 16, marginBottom: 5 },
  itemsHint:        { fontSize: 13, color: '#888', marginBottom: 6, fontStyle: 'italic' },
  statusBadge:      { marginTop: 10, fontSize: 14, color: '#007AFF', fontWeight: 'bold' },
  offlineContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  offlineText:      { fontSize: 16, color: '#888', textAlign: 'center', padding: 20 },
  emptyText:        { textAlign: 'center', marginTop: 30, fontSize: 16, color: '#888' },
});
