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
  fetchCourierRating,
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
  courierRating: number | null;

  restoreSession: () => Promise<void>;
  login: (phone: string, password: string) => Promise<string | null>;
  register: (phone: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  toggleStatus: () => Promise<void>;
  fetchOrders: () => Promise<void>;
  loadHistory: () => Promise<void>;
  updateOrderStatus: (id: string, status: Order['status'], snapshot?: Order) => void;
  persistOrder: (order: Order) => Promise<void>;
  dismissAchievement: () => void;
  refreshRating: () => Promise<void>;
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
  courierRating: null,

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

      const [shown, rating] = await Promise.all([
        fetchShownAchievements(session.id),
        fetchCourierRating(session.id),
      ]);
      set({
        ...applyAuth(profile),
        shownAchievements: shown,
        courierRating: rating,
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

    const [shown, rating] = await Promise.all([
      fetchShownAchievements(result.data.id),
      fetchCourierRating(result.data.id),
    ]);
    set({
      ...applyAuth(result.data),
      shownAchievements: shown,
      courierRating: rating,
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
      courierRating: null,
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
      const [{ orders: liveOrders, error }, savedActive, savedHistory] =
        await Promise.all([
          fetchAvailableOrders(),
          courierId ? fetchCourierOrders(courierId, 'active') : Promise.resolve([]),
          courierId ? fetchCourierOrders(courierId, 'history') : Promise.resolve([]),
        ]);

      const savedById = new Map(savedActive.map(o => [o.id, o]));
      const completedIds = new Set(
        savedHistory.map(o => o.id).filter(id => id.length > 0),
      );
      const merged: Array<Order> = [];

      for (const saved of savedActive) {
        if (saved.status !== 'delivered') merged.push(saved);
      }

      for (const live of liveOrders) {
        if (!savedById.has(live.id) && !completedIds.has(live.id)) {
          merged.push(live);
        }
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
      try {
        if (status === 'new') {
          await saveCourierOrder(courierId, updated);
        } else {
          await patchCourierOrderStatus(courierId, id, status);
          await saveCourierOrder(courierId, updated);
        }
        if (isNew) {
          await saveShownAchievements(courierId, shownAchievements);
        }
        if (status === 'delivered') {
          await get().loadHistory();
          // Обновляем рейтинг после доставки — пользователь мог оставить оценку
          await get().refreshRating();
        }
      } catch (err) {
        logger.warn('Store', 'updateOrderStatus persist failed', err);
      }
    })();
  },

  dismissAchievement: () => set({ pendingAchievement: null }),

  refreshRating: async () => {
    const { courierId } = get();
    if (!courierId) return;
    const rating = await fetchCourierRating(courierId);
    if (rating !== null) set({ courierRating: rating });
  },
}));
