import React, { useState } from 'react';
import { View, Text, Switch, FlatList, TouchableOpacity, StyleSheet, Button } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Slider from '@react-native-community/slider';

import { useAppStore } from '../store/useAppStore';
import { RootStackParamList, Order } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;
};

export default function DashboardScreen({ navigation }: Props) {
  const { isOnline, toggleStatus, orders, logout } = useAppStore();
  
  const [maxDistance, setMaxDistance] = useState<number>(10);

  const activeOrders = orders.filter((order) => {
    const orderDistance = parseFloat(order.distance);
    return order.status !== 'delivered' && orderDistance <= maxDistance;
  });

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity style={styles.orderCard} onPress={() => navigation.navigate('OrderDetails', { order: item })}>
      <View style={styles.orderHeader}>
        <Text style={styles.price}>{item.price} ₽</Text>
        <Text style={styles.distance}>{item.distance}</Text>
      </View>
      <Text style={styles.address}>А: {item.addressA}</Text>
      <Text style={styles.address}>Б: {item.addressB}</Text>
      <Text style={styles.statusBadge}>Статус: {item.status}</Text> 
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.statusRow}>
            <Text style={styles.statusText}>{isOnline ? '🟢 На линии' : '🔴 Офлайн'}</Text>
            <Switch value={isOnline} onValueChange={toggleStatus} />
        </View>
        
        <TouchableOpacity style={styles.historyBtn} onPress={() => navigation.navigate('History')}>
            <Text style={styles.historyBtnText}>🗓 История</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.historyBtn, { backgroundColor: '#ffebee' }]} onPress={logout}>
              <Text style={[styles.historyBtnText, { color: '#d32f2f' }]}>🚪 Выйти</Text>
          </TouchableOpacity>
      </View>

      {isOnline ? (
        <>
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Радиус: <Text style={styles.sliderValue}>{maxDistance} км</Text></Text>
            <Slider
              style={styles.slider} minimumValue={1} maximumValue={15} step={0.5} value={maxDistance} onValueChange={setMaxDistance}
              minimumTrackTintColor="#007AFF" maximumTrackTintColor="#d3d3d3" thumbTintColor="#007AFF"
            />
          </View>
          <FlatList
            data={activeOrders} keyExtractor={(item) => item.id} renderItem={renderOrderItem} contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={styles.emptyText}>Нет доступных заказов</Text>}
          />
        </>
      ) : (
        <View style={styles.offlineContainer}>
          <Text style={styles.offlineText}>Выйдите на линию, чтобы получать заказы</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  statusText: { fontSize: 18, fontWeight: '600' },
  historyBtn: { backgroundColor: '#e8e8e8', padding: 10, borderRadius: 8, alignItems: 'center' },
  historyBtnText: { fontSize: 16, fontWeight: '600', color: '#333' },
  sliderContainer: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderColor: '#eee' },
  sliderLabel: { fontSize: 15, color: '#555', marginBottom: 10 },
  sliderValue: { fontWeight: 'bold', color: '#007AFF' },
  slider: { width: '100%', height: 40 },
  list: { padding: 15 },
  orderCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  price: { fontSize: 20, fontWeight: 'bold', color: '#28a745' },
  distance: { fontSize: 16, color: '#666' },
  address: { fontSize: 16, marginBottom: 5 },
  statusBadge: { marginTop: 10, fontSize: 14, color: '#007AFF', fontWeight: 'bold' },
  offlineContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  offlineText: { fontSize: 16, color: '#888', textAlign: 'center', padding: 20 },
  emptyText: { textAlign: 'center', marginTop: 30, fontSize: 16, color: '#888' }
});
