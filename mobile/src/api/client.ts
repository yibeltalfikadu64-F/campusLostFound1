
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'injibara_access_token';
const REFRESH_TOKEN_KEY = 'injibara_refresh_token';

// Determine default API URL
const DEFAULT_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:5000/api/v1'
    : 'http://localhost:5000/api/v1';

export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || DEFAULT_URL;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Web uses localStorage.
 * Android and iOS use Expo SecureStore.
 */
async function readStoredToken(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage === 'undefined') {
        return null;
      }

      return localStorage.getItem(key);
    }

    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error('Failed to read authentication token', error);
    return null;
  }
}

async function saveStoredToken(
  key: string,
  value: string,
): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') {
      throw new Error('Browser storage is unavailable');
    }

    localStorage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function removeStoredToken(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }

    return;
  }

  await SecureStore.deleteItemAsync(key);
}

// Public token helpers
export async function getAccessToken(): Promise<string | null> {
  return readStoredToken(TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return readStoredToken(REFRESH_TOKEN_KEY);
}

export async function setAuthTokens(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  try {
    await saveStoredToken(TOKEN_KEY, accessToken);
    await saveStoredToken(REFRESH_TOKEN_KEY, refreshToken);
  } catch (error) {
    console.error('Failed to save authentication tokens', error);
    throw error;
  }
}

export async function clearAuthTokens(): Promise<void> {
  try {
    await Promise.all([
      removeStoredToken(TOKEN_KEY),
      removeStoredToken(REFRESH_TOKEN_KEY),
    ]);
  } catch (error) {
    console.error('Failed to clear authentication tokens', error);
  }
}

// Request interceptor: attach access token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: refresh expired access tokens
type QueuedRequest = {
  resolve: (token: string) => void;
  reject: (reason?: unknown) => void;
};

let isRefreshing = false;
let failedQueue: QueuedRequest[] = [];

function processQueue(
  error: unknown,
  token: string | null = null,
): void {
  failedQueue.forEach((request) => {
    if (error || !token) {
      request.reject(error ?? new Error('Token refresh failed'));
    } else {
      request.resolve(token);
    }
  });

  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as
      | (typeof error.config & { _retry?: boolean })
      | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Do not refresh tokens for failed login or refresh requests.
    const requestUrl = String(originalRequest.url ?? '');

    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/refresh')
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await getRefreshToken();

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Use plain axios to avoid recursively triggering this interceptor.
      const refreshResponse = await axios.post(
        `${BASE_URL}/auth/refresh`,
        { refreshToken },
        {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      );

      const tokens = refreshResponse.data?.data?.tokens;
      const newAccess = tokens?.accessToken;
      const newRefresh = tokens?.refreshToken;

      if (!newAccess || !newRefresh) {
        throw new Error('Refresh response did not contain valid tokens');
      }

      await setAuthTokens(newAccess, newRefresh);

      apiClient.defaults.headers.common.Authorization =
        `Bearer ${newAccess}`;

      processQueue(null, newAccess);

      originalRequest.headers.Authorization = `Bearer ${newAccess}`;

      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await clearAuthTokens();

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
