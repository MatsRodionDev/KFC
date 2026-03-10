import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import {
  setAuthTokenGetter,
  setOnTokenRefreshError,
  clearAuthTokenGetter,
} from '../services/apiConfig';
import { AUTH0_CONFIG } from '../config/auth0.config';

export const useAuth = () => {
  const auth0 = useAuth0();
  const { isAuthenticated, isLoading, getAccessTokenSilently, logout } = auth0;

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
      setOnTokenRefreshError(() => {
        logout({ logoutParams: { returnTo: AUTH0_CONFIG.redirectUri } });
      });
    } else {
      clearAuthTokenGetter();
    }
  }, [isAuthenticated, isLoading, getAccessTokenSilently, logout]);

  return {
    ...auth0,
    isReady: !auth0.isLoading,
  };
};
