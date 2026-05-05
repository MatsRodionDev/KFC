import { create } from 'zustand';
import { Order } from '../types';
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
  
  login: (phone: string, password: string) => boolean;
  register: (phone: string, password: string) => boolean;
  logout: () => void;
  toggleStatus: () => void;
  updateOrderStatus: (id: string, status: Order['status']) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  isAuthenticated: false,
  isOnline: false,
  orders: ordersData as Order[],
  users: [],
  
  register: (phone, password) => {
    const { users } = get();
    const userExists = users.some(u => u.phone === phone);
    if (userExists) return false;

    set({ users: [...users, { phone, password }] });
    return true;
  },

  login: (phone, password) => {
    const { users } = get();
    const isValidUser = users.some(u => u.phone === phone && u.password === password);
    
    if (isValidUser) {
      set({ isAuthenticated: true });
      return true;
    }
    return false;
  },

  logout: () => set({ isAuthenticated: false, isOnline: false }),
  toggleStatus: () => set((state) => ({ isOnline: !state.isOnline })),
  
  updateOrderStatus: (id, status) => set((state) => ({
    orders: state.orders.map(order => 
      order.id === id ? { ...order, status } : order
    )
  })),
}));
