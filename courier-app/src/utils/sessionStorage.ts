import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = '@courier_session';

export type CourierSession = {
  id: string;
  phone: string;
  displayName: string;
};

export const saveCourierSession = async (session: CourierSession): Promise<void> => {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const loadCourierSession = async (): Promise<CourierSession | null> => {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CourierSession;
  } catch {
    return null;
  }
};

export const clearCourierSession = async (): Promise<void> => {
  await AsyncStorage.removeItem(SESSION_KEY);
};
