export const AUTH0_CONFIG = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN || 'dev-68w2668n3ozgs1cf.us.auth0.com',
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || 'GUlh4AJYJkgDZjZKDUK9al5JXOdlkeuj',
  audience: import.meta.env.VITE_AUTH0_AUDIENCE || 'https://kfc-uni-pir-221.com',
  redirectUri: window.location.origin,
  scope: 'openid profile email offline_access',
  useRefreshTokens: true,
  cacheLocation: 'localstorage' as const,
} as const;

export const AUTH0_SCOPES = {
  OPENID: 'openid',
  PROFILE: 'profile',
  EMAIL: 'email',
  OFFLINE_ACCESS: 'offline_access',
} as const;

export const getAuth0Scopes = (): string => {
  return `${AUTH0_SCOPES.OPENID} ${AUTH0_SCOPES.PROFILE} ${AUTH0_SCOPES.EMAIL} ${AUTH0_SCOPES.OFFLINE_ACCESS}`;
};
