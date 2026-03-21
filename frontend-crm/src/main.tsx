import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react'
import { AUTH0_CONFIG } from './config/auth0.config'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
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
  </StrictMode>,
)
