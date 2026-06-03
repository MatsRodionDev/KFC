import { create } from 'zustand';
import { Order } from '../types';
import { getNewlyUnlocked } from '../utils/achievements';
import { fetchAvailableOrders } from '../api/ordersApi';
import {
  loginCourier,
  registerCourier,
  fetchCourierOrders,
  saveCourierOrder,
  patchCourierOrderStatus,
  setCourierOnline,
  fetchCourierProfile,
  fetchShownAchievements,
  saveShownAchievements,
} from '../api/courierApi';
import {
  saveCourierSession,
  loadCourierSession,
  clearCourierSession,
} from '../utils/sessionStorage';
import { logger } from '../utils/logger';

interface AppState {
  isAuthenticated: boolean;
  isSessionRestoring: boolean;
  courierId: string | null;
  displayName: string;
  isOnline: boolean;
  orders: Order[];
  historyOrders: Order[];
  isLoadingOrders: boolean;
  isLoadingHistory: boolean;
  ordersFetchError: string | null;
  shownAchievements: Array<string>;
  pendingAchievement: string | null;

  restoreSession: () => Promise<void>;
  login: (phone: string, password: string) => Promise<string | null>;
  register: (phone: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  toggleStatus: () => Promise<void>;
  fetchOrders: () => Promise<void>;
  loadHistory: () => Promise<void>;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  persistOrder: (order: Order) => Promise<void>;
  dismissAchievement: () => void;
}

const applyAuth = (
  profile: { id: string; phone: string; displayName: string; isOnline: boolean },
) => ({
  isAuthenticated: true,
  courierId: profile.id,
  displayName: profile.displayName,
  isOnline: profile.isOnline,
});

export const useAppStore = create<AppState>((set, get) => ({
  isAuthenticated: false,
  isSessionRestoring: true,
  courierId: null,
  displayName: '',
  isOnline: false,
  orders: [],
  historyOrders: [],
  isLoadingOrders: false,
  isLoadingHistory: false,
  ordersFetchError: null,
  shownAchievements: [],
  pendingAchievement: null,

  restoreSession: async () => {
    set({ isSessionRestoring: true });
    try {
      const session = await loadCourierSession();
      if (!session) return;

      const profile = await fetchCourierProfile(session.id);
      if (!profile) {
        await clearCourierSession();
        return;
      }

      const shown = await fetchShownAchievements(session.id);
      set({
        ...applyAuth(profile),
        shownAchievements: shown,
      });
      logger.info('Store', 'session restored', { courierId: session.id });
    } catch (error) {
      logger.error('Store', 'restoreSession failed', error);
    } finally {
      set({ isSessionRestoring: false });
    }
  },

  register: async (phone, password) => {
    const result = await registerCourier(phone, password);
    if (!result.ok) return result.error;
    return null;
  },

  login: async (phone, password) => {
    const result = await loginCourier(phone, password);
    if (!result.ok) return result.error;

    await saveCourierSession({
      id: result.data.id,
      phone: result.data.phone,
      displayName: result.data.displayName,
    });

    const shown = await fetchShownAchievements(result.data.id);
    set({
      ...applyAuth(result.data),
      shownAchievements: shown,
      orders: [],
      historyOrders: [],
    });
    return null;
  },

  logout: async () => {
    const { courierId, isOnline } = get();
    if (courierId && isOnline) {
      await setCourierOnline(courierId, false).catch(() => {});
    }
    await clearCourierSession();
    set({
      isAuthenticated: false,
      courierId: null,
      displayName: '',
      isOnline: false,
      orders: [],
      historyOrders: [],
      shownAchievements: [],
      pendingAchievement: null,
    });
  },

  toggleStatus: async () => {
    const { courierId, isOnline } = get();
    const next = !isOnline;
    if (courierId) {
      const updated = await setCourierOnline(courierId, next);
      if (updated) {
        set({ isOnline: updated.isOnline });
        return;
      }
    }
    set({ isOnline: next });
  },

  fetchOrders: async () => {
    const { courierId } = get();
    set({ isLoadingOrders: true, ordersFetchError: null });
    logger.info('Store', 'fetchOrders start');
    try {
      const [{ orders: liveOrders, error }, savedActive] = await Promise.all([
        fetchAvailableOrders(),
        courierId ? fetchCourierOrders(courierId, 'active') : Promise.resolve([]),
      ]);

      const savedById = new Map(savedActive.map(o => [o.id, o]));
      const merged: Array<Order> = [];

      for (const saved of savedActive) {
        if (saved.status !== 'delivered') merged.push(saved);
      }

      for (const live of liveOrders) {
        if (!savedById.has(live.id)) merged.push(live);
      }

      set({
        orders: merged,
        ordersFetchError: error ?? null,
      });
      logger.info('Store', 'fetchOrders done', {
        live: liveOrders.length,
        saved: savedActive.length,
        merged: merged.length,
        error,
      });
    } catch (error) {
      logger.error('Store', 'fetchOrders failed', error);
      set({
        ordersFetchError:
          error instanceof Error ? error.message : 'Ошибка загрузки заказов',
      });
    } finally {
      set({ isLoadingOrders: false });
    }
  },

  loadHistory: async () => {
    const { courierId } = get();
    if (!courierId) return;
    set({ isLoadingHistory: true });
    try {
      const historyOrders = await fetchCourierOrders(courierId, 'history');
      set({ historyOrders });
    } catch (error) {
      logger.error('Store', 'loadHistory failed', error);
    } finally {
      set({ isLoadingHistory: false });
    }
  },

  persistOrder: async (order: Order) => {
    const { courierId } = get();
    if (!courierId) return;
    await saveCourierOrder(courierId, order).catch(err => {
      logger.warn('Store', 'persistOrder failed', err);
    });
  },

  updateOrderStatus: (id, status) => {
    const state = get();
    const prevDelivered = state.historyOrders.length;

    const order =
      state.orders.find(o => o.id === id) ??
      state.historyOrders.find(o => o.id === id);
    if (!order) return;

    const updated: Order = { ...order, status };
    const newOrders = state.orders.map(o => (o.id === id ? updated : o));
    const withoutFromActive =
      status === 'delivered'
        ? newOrders.filter(o => o.id !== id)
        : newOrders.some(o => o.id === id)
          ? newOrders
          : [...newOrders, updated];

    const historyOrders =
      status === 'delivered'
        ? [
            updated,
            ...state.historyOrders.filter(o => o.id !== id),
          ]
        : state.historyOrders;

    const newDelivered = historyOrders.length;
    const achievement = getNewlyUnlocked(prevDelivered, newDelivered);
    const isNew =
      achievement && !state.shownAchievements.includes(achievement.id);

    const shownAchievements = isNew
      ? [...state.shownAchievements, achievement!.id]
      : state.shownAchievements;

    set({
      orders: withoutFromActive,
      historyOrders,
      pendingAchievement: isNew ? achievement!.id : state.pendingAchievement,
      shownAchievements,
    });

    const { courierId } = state;
    if (!courierId) return;

    void (async () => {
      if (status === 'new') {
        await saveCourierOrder(courierId, updated);
      } else {
        await patchCourierOrderStatus(courierId, id, status);
        await saveCourierOrder(courierId, updated);
      }
      if (isNew) {
        await saveShownAchievements(courierId, shownAchievements);
      }
    })();
  },

  dismissAchievement: () => set({ pendingAchievement: null }),
}));
