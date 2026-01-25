import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { setAuthTokenGetter, clearAuthTokenGetter } from '../services/apiConfig';
import { AUTH0_CONFIG } from '../config/auth0.config';

export const useAuth = () => {
  const auth0 = useAuth0();
  const { isAuthenticated, isLoading, getAccessTokenSilently } = auth0;

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && getAccessTokenSilently) {
      setAuthTokenGetter(async () => {
        return await getAccessTokenSilently({
          authorizationParams: {
            audience: AUTH0_CONFIG.audience,
            scope: AUTH0_CONFIG.scope,
          },
        });
      });
    } else {
      clearAuthTokenGetter();
    }
  }, [isAuthenticated, isLoading, getAccessTokenSilently]);

  return {
    ...auth0,
    isReady: !auth0.isLoading,
  };
};
