import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Achievement } from '../utils/achievements';

interface Props {
  achievement: Achievement | null;
  onDismiss: () => void;
}

export default function AchievementToast({ achievement, onDismiss }: Props) {
  const translateY = useRef(new Animated.Value(-200)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!achievement) return;

    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(dismiss, 4000);
    return () => clearTimeout(timer);
  }, [achievement?.id]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -200, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => onDismiss());
  };

  if (!achievement) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }], opacity }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={dismiss}
        style={[styles.card, { borderLeftColor: achievement.color }]}
      >
        <Text style={styles.icon}>{achievement.icon}</Text>
        <View style={styles.textBlock}>
          <Text style={styles.label}>🎉 Достижение разблокировано!</Text>
          <Text style={styles.title}>{achievement.title}</Text>
          <Text style={styles.desc}>{achievement.description}</Text>
        </View>
        <View style={[styles.bonusBadge, { backgroundColor: achievement.color }]}>
          <Text style={styles.bonusText}>+{achievement.bonus} ₽</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderLeftWidth: 5,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: { fontSize: 40 },
  textBlock: { flex: 1 },
  label: { fontSize: 11, color: '#888', marginBottom: 2 },
  title: { fontSize: 17, fontWeight: 'bold', color: '#111' },
  desc: { fontSize: 13, color: '#555', marginTop: 2 },
  bonusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
  },
  bonusText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
