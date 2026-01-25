import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';

let getTokenFn: (() => Promise<string>) | null = null;

export const setAuthTokenGetter = (fn: (() => Promise<string>) | null) => {
  getTokenFn = fn;
};

export const clearAuthTokenGetter = () => {
  getTokenFn = null;
};

const setupAxiosInstance = (baseURL: string): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      if (getTokenFn) {
        try {
          const token = await getTokenFn();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Error getting access token:', error);
          return Promise.reject(error);
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      if (error.response?.status === 401 && !originalRequest._retry && getTokenFn) {
        originalRequest._retry = true;

        try {
          const newToken = await getTokenFn();
          if (newToken && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return instance(originalRequest);
          }
        } catch (tokenError) {
          console.error('Error refreshing token:', tokenError);
          return Promise.reject(tokenError);
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

export const catalogApi = setupAxiosInstance('/api/catalog');
export const orderApi = setupAxiosInstance('/api/orders');
export const paymentApi = setupAxiosInstance('/api/checkout');
export const geoApi = setupAxiosInstance('/api/geo');
export const chatClientApi = setupAxiosInstance('/api/chatclient');
