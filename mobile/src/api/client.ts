import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'injibara_access_token';
const REFRESH_TOKEN_KEY = 'injibara_refresh_token';

// Determine default API URL
const DEFAULT_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:5000/api/v1'
  : 'http://localhost:5000/api/v1';

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_URL;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
});

// Secure token helpers
export async function getAccessToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setAuthTokens(accessToken: string, refreshToken: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  } catch (e) {
    console.error('Failed to save tokens in secure store', e);
  }
}

export async function clearAuthTokens(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch (e) {
    console.error('Failed to clear tokens', e);
  }
}

// Request Interceptor: Attach Bearer Token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Auto Token Refresh on 401
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: any) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        isRefreshing = false;
        await clearAuthTokens();
        return Promise.reject(error);
      }

      try {
        const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken
        });

        const { accessToken: newAccess, refreshToken: newRefresh } = refreshResponse.data.data.tokens;
        await setAuthTokens(newAccess, newRefresh);

        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
        processQueue(null, newAccess);

        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        await clearAuthTokens();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
