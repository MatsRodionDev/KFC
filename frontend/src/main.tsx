import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { Auth0Provider } from '@auth0/auth0-react';
import { AUTH0_CONFIG } from './config/auth0.config';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Auth0Provider
      domain={AUTH0_CONFIG.domain}
      clientId={AUTH0_CONFIG.clientId}
      useRefreshTokens={AUTH0_CONFIG.useRefreshTokens}
      cacheLocation={AUTH0_CONFIG.cacheLocation}
      authorizationParams={{
        redirect_uri: AUTH0_CONFIG.redirectUri,
        audience: AUTH0_CONFIG.audience,
        scope: AUTH0_CONFIG.scope,
      }}
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>,
);






