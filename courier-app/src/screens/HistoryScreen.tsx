import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppStore } from '../store/useAppStore';
import { Order, RootStackParamList } from '../types';
import { getNextAchievement, getTotalBonus, getUnlocked } from '../utils/achievements';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'History'>;
};

export default function HistoryScreen({ navigation }: Props) {
  const { orders } = useAppStore();
  const historyOrders = orders.filter(o => o.status === 'delivered');
  const deliveryCount = historyOrders.length;
  const totalEarned   = historyOrders.reduce((s, o) => s + o.price, 0);
  const totalBonus    = getTotalBonus(deliveryCount);
  const unlocked      = getUnlocked(deliveryCount);
  const next          = getNextAchievement(deliveryCount);
  const progress      = next ? Math.min(deliveryCount / next.count, 1) : 1;

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
      <View style={styles.statsPanel}>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statsValue}>{totalEarned} ₽</Text>
            <Text style={styles.statsLabel}>заработано</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statsValue, { color: '#28a745' }]}>+{totalBonus} ₽</Text>
            <Text style={styles.statsLabel}>бонусов</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statsValue}>{deliveryCount}</Text>
            <Text style={styles.statsLabel}>доставок</Text>
          </View>
        </View>

        {next ? (
          <View style={styles.progressBlock}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>До «{next.title}» {next.icon}</Text>
              <Text style={styles.progressCount}>{deliveryCount}/{next.count}</Text>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: next.color }]} />
            </View>
          </View>
        ) : (
          <Text style={styles.allDone}>👑 Все достижения разблокированы!</Text>
        )}

        <TouchableOpacity style={styles.achieveBtn} onPress={() => navigation.navigate('Achievements')}>
          <Text style={styles.achieveBtnText}>🏆 Достижения ({unlocked.length}/8)</Text>
        </TouchableOpacity>
      </View>

      {isLoadingHistory ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#007AFF" />
      ) : (
        <FlatList
          data={historyOrders}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>Вы ещё не выполнили ни одного заказа</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  statsPanel: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderColor: '#eee' },
  statsRow:   { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 14 },
  statBox:    { alignItems: 'center' },
  statsValue: { fontSize: 24, fontWeight: 'bold', color: '#FF9500' },
  statsLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  progressBlock:  { marginBottom: 12 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel:  { fontSize: 13, fontWeight: '600', color: '#333' },
  progressCount:  { fontSize: 13, color: '#888' },
  progressBg:     { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden' },
  progressFill:   { height: '100%', borderRadius: 4 },
  allDone:    { fontSize: 14, fontWeight: 'bold', color: '#28a745', textAlign: 'center', marginBottom: 12 },
  achieveBtn: { backgroundColor: '#FF9500', padding: 12, borderRadius: 10, alignItems: 'center' },
  achieveBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  list:       { padding: 15 },
  card:       { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: '#e0e0e0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  price:      { fontSize: 18, fontWeight: 'bold', color: '#333' },
  status:     { fontSize: 14, color: '#28a745', fontWeight: 'bold' },
  client:     { fontSize: 16, fontWeight: '500', marginBottom: 4 },
  address:    { fontSize: 14, color: '#666' },
  empty:      { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 16 },
});
