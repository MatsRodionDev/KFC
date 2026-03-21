import { useAuth0 } from '@auth0/auth0-react';
import { DEFAULT_USER_ID } from '../constants';

/**
 * Возвращает ID текущего пользователя из токена (Auth0 sub).
 * Бэкенд принимает string UserId, поэтому передаём sub как есть.
 */
export const useUserId = (): string => {
  const { user } = useAuth0();
  return user?.sub ?? DEFAULT_USER_ID;
};
