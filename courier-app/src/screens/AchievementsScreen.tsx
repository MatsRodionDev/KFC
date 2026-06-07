import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAppStore } from '../store/useAppStore';
import {
  ACHIEVEMENTS, getUnlocked, getNextAchievement, getTotalBonus,
} from '../utils/achievements';

export default function AchievementsScreen() {
  const historyOrders = useAppStore(s => s.historyOrders);
  const loadHistory = useAppStore(s => s.loadHistory);
  const deliveryCount = historyOrders.length;

  useFocusEffect(
    useCallback(() => {
      void loadHistory();
    }, [loadHistory]),
  );

  const unlocked  = getUnlocked(deliveryCount);
  const next      = getNextAchievement(deliveryCount);
  const totalBonus = getTotalBonus(deliveryCount);

  const progressToNext = next
    ? Math.min(deliveryCount / next.count, 1)
    : 1;

  return (
    <View style={styles.container}>
      {/* Шапка со статистикой */}
      <View style={styles.header}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{deliveryCount}</Text>
          <Text style={styles.statLabel}>доставок</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{unlocked.length}</Text>
          <Text style={styles.statLabel}>достижений</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: '#28a745' }]}>
            +{totalBonus} ₽
          </Text>
          <Text style={styles.statLabel}>бонусов</Text>
        </View>
      </View>

      {/* Прогресс к следующему */}
      {next && (
        <View style={styles.nextWrap}>
          <View style={styles.nextRow}>
            <Text style={styles.nextLabel}>
              До «{next.title}» {next.icon}
            </Text>
            <Text style={styles.nextCount}>
              {deliveryCount} / {next.count}
            </Text>
          </View>
          <View style={styles.progressBg}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressToNext * 100}%`, backgroundColor: next.color },
              ]}
            />
          </View>
        </View>
      )}

      {!next && (
        <View style={[styles.nextWrap, { alignItems: 'center' }]}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#28a745' }}>
            👑 Все достижения разблокированы!
          </Text>
        </View>
      )}

      {/* Список достижений */}
      <FlatList
        data={ACHIEVEMENTS}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => {
          const isUnlocked = deliveryCount >= item.count;
          return (
            <View
              style={[
                styles.card,
                isUnlocked
                  ? { borderColor: item.color, borderWidth: 2 }
                  : styles.cardLocked,
              ]}
            >
              <Text style={[styles.cardIcon, !isUnlocked && styles.iconLocked]}>
                {isUnlocked ? item.icon : '🔒'}
              </Text>
              <Text
                style={[styles.cardTitle, !isUnlocked && styles.textLocked]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text style={styles.cardDesc} numberOfLines={2}>
                {item.description}
              </Text>
              <View
                style={[
                  styles.bonusPill,
                  { backgroundColor: isUnlocked ? item.color : '#ccc' },
                ]}
              >
                <Text style={styles.bonusPillText}>+{item.bonus} ₽</Text>
              </View>
              {isUnlocked && (
                <Text style={styles.unlockedBadge}>✓ Получено</Text>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },

  header: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  statBox:    { alignItems: 'center' },
  statValue:  { fontSize: 28, fontWeight: 'bold', color: '#FF9500' },
  statLabel:  { fontSize: 13, color: '#888', marginTop: 2 },

  nextWrap: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  nextRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  nextLabel:{ fontSize: 14, fontWeight: '600', color: '#333' },
  nextCount:{ fontSize: 14, color: '#888' },
  progressBg: {
    height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4 },

  grid: { padding: 12 },
  row:  { justifyContent: 'space-between', marginBottom: 12 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLocked:  { borderColor: '#e0e0e0', borderWidth: 1, opacity: 0.7 },
  cardIcon:    { fontSize: 38, marginBottom: 6 },
  iconLocked:  { opacity: 0.4 },
  cardTitle:   { fontSize: 15, fontWeight: 'bold', color: '#111', marginBottom: 4 },
  textLocked:  { color: '#aaa' },
  cardDesc:    { fontSize: 12, color: '#777', textAlign: 'center', marginBottom: 8 },
  bonusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 4,
  },
  bonusPillText:  { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  unlockedBadge: {
    marginTop: 6,
    fontSize: 11,
    color: '#28a745',
    fontWeight: '600',
  },
});
