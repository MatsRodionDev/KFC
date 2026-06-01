/**
 * Система достижений и бонусов курьера.
 *
 * Каждое достижение разблокируется при достижении порогового числа
 * выполненных доставок. Бонус — разовое начисление в рублях.
 */

export interface Achievement {
  id: string;
  count: number;       // порог доставок
  title: string;
  description: string;
  icon: string;        // emoji-иконка
  bonus: number;       // бонус в рублях
  color: string;       // цвет карточки (разблокированной)
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_5',
    count: 5,
    title: 'Первые шаги',
    description: 'Выполни 5 доставок',
    icon: '🚀',
    bonus: 50,
    color: '#4CAF50',
  },
  {
    id: 'ten_deliveries',
    count: 10,
    title: 'На разгоне',
    description: 'Выполни 10 доставок',
    icon: '⚡',
    bonus: 100,
    color: '#2196F3',
  },
  {
    id: 'fifteen_pro',
    count: 15,
    title: 'Быстрые руки',
    description: 'Выполни 15 доставок',
    icon: '💨',
    bonus: 150,
    color: '#00BCD4',
  },
  {
    id: 'twenty_five',
    count: 25,
    title: 'Опытный курьер',
    description: 'Выполни 25 доставок',
    icon: '🎯',
    bonus: 250,
    color: '#9C27B0',
  },
  {
    id: 'thirty',
    count: 30,
    title: 'Стабильность',
    description: 'Выполни 30 доставок',
    icon: '💪',
    bonus: 300,
    color: '#FF5722',
  },
  {
    id: 'fifty_pro',
    count: 50,
    title: 'Профи',
    description: 'Выполни 50 доставок',
    icon: '🏆',
    bonus: 500,
    color: '#FF9800',
  },
  {
    id: 'seventy_five',
    count: 75,
    title: 'Мастер доставки',
    description: 'Выполни 75 доставок',
    icon: '🌟',
    bonus: 750,
    color: '#E91E63',
  },
  {
    id: 'legend_100',
    count: 100,
    title: 'Легенда',
    description: 'Выполни 100 доставок',
    icon: '👑',
    bonus: 1000,
    color: '#F44336',
  },
];

/** Возвращает список достижений, разблокированных при данном кол-ве доставок. */
export function getUnlocked(deliveryCount: number): Achievement[] {
  return ACHIEVEMENTS.filter(a => deliveryCount >= a.count);
}

/** Возвращает достижение, только что разблокированное при переходе
 *  от prevCount к newCount (или null). */
export function getNewlyUnlocked(
  prevCount: number,
  newCount: number,
): Achievement | null {
  return (
    ACHIEVEMENTS.find(a => a.count > prevCount && a.count <= newCount) ?? null
  );
}

/** Следующее ещё не разблокированное достижение. */
export function getNextAchievement(deliveryCount: number): Achievement | null {
  return ACHIEVEMENTS.find(a => a.count > deliveryCount) ?? null;
}

/** Суммарный накопленный бонус за все разблокированные достижения. */
export function getTotalBonus(deliveryCount: number): number {
  return getUnlocked(deliveryCount).reduce((sum, a) => sum + a.bonus, 0);
}
