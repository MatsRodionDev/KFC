import { create } from 'zustand';
import { Order } from '../types';
import { getNewlyUnlocked } from '../utils/achievements';
import { fetchAvailableOrders } from '../api/ordersApi';
import ordersData from '../data/mockOrders.json';

interface User {
  phone: string;
  password: string;
}

interface AppState {
  isAuthenticated: boolean;
  isOnline: boolean;
  orders: Order[];
  isLoadingOrders: boolean;
  users: User[];
  shownAchievements: string[];
  pendingAchievement: string | null;

  login: (phone: string, password: string) => boolean;
  register: (phone: string, password: string) => boolean;
  logout: () => void;
  toggleStatus: () => void;
  fetchOrders: () => Promise<void>;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  dismissAchievement: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  isAuthenticated: false,
  isOnline: false,
  // Сохраняем mock-данные как историю (delivered), реальные подгружаются при fetchOrders
  orders: (ordersData as Order[]).filter(o => o.status === 'delivered'),
  isLoadingOrders: false,
  users: [],
  shownAchievements: [],
  pendingAchievement: null,

  register: (phone, password) => {
    const { users } = get();
    if (users.some(u => u.phone === phone)) return false;
    set({ users: [...users, { phone, password }] });
    return true;
  },

  login: (phone, password) => {
    const { users } = get();
    const ok = users.some(u => u.phone === phone && u.password === password);
    if (ok) set({ isAuthenticated: true });
    return ok;
  },

  logout: () => set({ isAuthenticated: false, isOnline: false }),

  toggleStatus: () => set(s => ({ isOnline: !s.isOnline })),

  fetchOrders: async () => {
    set({ isLoadingOrders: true });
    try {
      const liveOrders = await fetchAvailableOrders();
      const { orders } = get();
      // Сохраняем историю (delivered) + добавляем живые заказы
      const history = orders.filter(o => o.status === 'delivered');
      // Не дублируем — убираем из истории если вдруг совпадает id
      const historyIds = new Set(liveOrders.map(o => o.id));
      const cleanHistory = history.filter(o => !historyIds.has(o.id));
      set({ orders: [...liveOrders, ...cleanHistory] });
    } catch {
      // При ошибке оставляем что было
    } finally {
      set({ isLoadingOrders: false });
    }
  },

  updateOrderStatus: (id, status) => {
    const state = get();
    const prevDelivered = state.orders.filter(o => o.status === 'delivered').length;

    const newOrders = state.orders.map(o =>
      o.id === id ? { ...o, status } : o,
    );
    const newDelivered = newOrders.filter(o => o.status === 'delivered').length;

    const achievement = getNewlyUnlocked(prevDelivered, newDelivered);
    const isNew = achievement && !state.shownAchievements.includes(achievement.id);

    set({
      orders: newOrders,
      pendingAchievement: isNew ? achievement!.id : state.pendingAchievement,
      shownAchievements: isNew
        ? [...state.shownAchievements, achievement!.id]
        : state.shownAchievements,
    });
  },

  dismissAchievement: () => set({ pendingAchievement: null }),
}));
