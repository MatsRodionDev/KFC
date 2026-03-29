import { create } from 'zustand';
import { Order } from '../types';
import ordersData from '../data/mockOrders.json';

// Описываем тип пользователя
interface User {
  phone: string;
  password: string;
}

interface AppState {
  isAuthenticated: boolean;
  isOnline: boolean;
  orders: Order[];
  users: User[]; // "База данных" пользователей
  
  // Функции теперь возвращают boolean (успешно или нет), чтобы UI мог показать ошибку
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
  users: [], // Изначально база пуста
  
  register: (phone, password) => {
    const { users } = get();
    // Проверяем, нет ли уже такого пользователя
    const userExists = users.some(u => u.phone === phone);
    if (userExists) return false; // Ошибка: пользователь уже существует

    // Добавляем нового пользователя в массив
    set({ users: [...users, { phone, password }] });
    return true; // Успешная регистрация
  },

  login: (phone, password) => {
    const { users } = get();
    // Ищем пользователя с таким телефоном и паролем
    const isValidUser = users.some(u => u.phone === phone && u.password === password);
    
    if (isValidUser) {
      set({ isAuthenticated: true });
      return true;
    }
    return false; // Ошибка: неверный логин или пароль
  },

  logout: () => set({ isAuthenticated: false, isOnline: false }),
  toggleStatus: () => set((state) => ({ isOnline: !state.isOnline })),
  
  updateOrderStatus: (id, status) => set((state) => ({
    orders: state.orders.map(order => 
      order.id === id ? { ...order, status } : order
    )
  })),
}));
