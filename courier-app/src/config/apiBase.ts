import { Platform } from 'react-native';

import { logger } from '../utils/logger';

/**
 * Базовый URL API в dev: EXPO_PUBLIC_* → localhost (Android-эмулятор: 10.0.2.2).
 * Хост Metro/tunnel (exp.direct) для API не используется.
 */
const resolveDevHost = (port: number): string => {
  const fromEnv =
    process.env.EXPO_PUBLIC_ORDER_API_URL ??
    process.env.EXPO_PUBLIC_API_HOST;

  if (fromEnv) {
    if (fromEnv.startsWith('http')) return fromEnv.replace(/\/$/, '');
    return `http://${fromEnv}:${port}`;
  }

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${port}`;
  }

  return `http://localhost:${port}`;
};

let loggedOrderBase = false;

export const getOrderApiBase = (): string => {
  const base = resolveDevHost(5046);
  if (__DEV__ && !loggedOrderBase) {
    loggedOrderBase = true;
    logger.info('Config', 'Order API base', { base });
  }
  return base;
};

export const getChatApiBase = (): string => {
  const fromEnv = process.env.EXPO_PUBLIC_CHAT_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  return resolveDevHost(5200);
};

export const getChatHubUrl = (): string => {
  const fromEnv = process.env.EXPO_PUBLIC_CHAT_HUB_URL;
  if (fromEnv) return fromEnv;
  return `${getChatApiBase()}/hubs/chat`;
};

export const getCvApiBase = (): string => {
  const fromEnv = process.env.EXPO_PUBLIC_CV_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  return resolveDevHost(8000);
};

let loggedCourierBase = false;

export const getCourierApiBase = (): string => {
  const fromEnv = process.env.EXPO_PUBLIC_COURIER_API_URL;
  const base = fromEnv ? fromEnv.replace(/\/$/, '') : resolveDevHost(5055);
  if (__DEV__ && !loggedCourierBase) {
    loggedCourierBase = true;
    logger.info('Config', 'Courier API base', { base });
  }
  return base;
};
