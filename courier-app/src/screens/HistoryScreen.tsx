import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { Order } from '../types';

export default function HistoryScreen() {
  const { orders } = useAppStore();

  // Берем только завершенные заказы
  const historyOrders = orders.filter(order => order.status === 'delivered');

  // Считаем заработок за день
  const totalEarned = historyOrders.reduce((sum, order) => sum + order.price, 0);

  const renderItem = ({ item }: { item: Order }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.price}>{item.price} ₽</Text>
        <Text style={styles.status}>✅ Доставлен</Text>
      </View>
      <Text style={styles.client}>{item.clientName}</Text>
      <Text style={styles.address}>Куда: {item.addressB}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Плашка со статистикой */}
      <View style={styles.statsPanel}>
        <Text style={styles.statsLabel}>Заработано за смену:</Text>
        <Text style={styles.statsValue}>{totalEarned} ₽</Text>
        <Text style={styles.statsCount}>Выполнено заказов: {historyOrders.length}</Text>
      </View>

      <FlatList 
        data={historyOrders}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Вы еще не выполнили ни одного заказа</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  statsPanel: { backgroundColor: '#fff', padding: 20, alignItems: 'center', borderBottomWidth: 1, borderColor: '#eee' },
  statsLabel: { fontSize: 16, color: '#666' },
  statsValue: { fontSize: 32, fontWeight: 'bold', color: '#28a745', marginVertical: 5 },
  statsCount: { fontSize: 14, color: '#888' },
  list: { padding: 15 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: '#e0e0e0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  price: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  status: { fontSize: 14, color: '#28a745', fontWeight: 'bold' },
  client: { fontSize: 16, fontWeight: '500', marginBottom: 4 },
  address: { fontSize: 14, color: '#666' },
  empty: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 16 },
});
