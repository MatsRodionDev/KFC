import { create } from 'zustand';
import { Order } from '../types';
import { getNewlyUnlocked } from '../utils/achievements';
import ordersData from '../data/mockOrders.json';

interface User {
  phone: string;
  password: string;
}

interface AppState {
  isAuthenticated: boolean;
  isOnline: boolean;
  orders: Order[];
  users: User[];
  /** ID достижений, для которых уже показывался попап. */
  shownAchievements: string[];
  /** Достижение для показа в тосте (null = скрыт). */
  pendingAchievement: string | null;

  login: (phone: string, password: string) => boolean;
  register: (phone: string, password: string) => boolean;
  logout: () => void;
  toggleStatus: () => void;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  dismissAchievement: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  isAuthenticated: false,
  isOnline: false,
  orders: ordersData as Order[],
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

  logout: () =>