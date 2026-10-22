import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../../api/endpoints';
import { setAuthTokens, clearAuthTokens, getAccessToken, getRefreshToken } from '../../api/client';

export interface User {
  id: string;
  fullName: string;
  email?: string | null;
  universityId?: string | null;
  phone: string;
  role: 'USER' | 'ADMIN' | 'SECURITY_OFFICER';
  department?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  login: (identifier: string, pass: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,
  isStaff: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshProfile: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const restoreSession = async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      const res = await api.users.getMe();
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        await clearAuthTokens();
        setUser(null);
      }
    } catch {
      await clearAuthTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    restoreSession();
  }, []);

  const login = async (identifier: string, pass: string) => {
    const res = await api.auth.login({ identifier, password: pass });
    if (res.success && res.data) {
      const { user: authUser, tokens } = res.data;
      await setAuthTokens(tokens.accessToken, tokens.refreshToken);
      setUser(authUser);
    } else {
      throw new Error(res.message || 'Login failed');
    }
  };

  const register = async (data: any) => {
    const res = await api.auth.register(data);
    if (res.success && res.data) {
      const { user: authUser, tokens } = res.data;
      await setAuthTokens(tokens.accessToken, tokens.refreshToken);
      setUser(authUser);
    } else {
      throw new Error(res.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        await api.auth.logout(refreshToken);
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      await clearAuthTokens();
      setUser(null);
    }
  };

  const refreshProfile = async () => {
    try {
      const res = await api.users.getMe();
      if (res.success && res.data) {
        setUser(res.data);
      }
    } catch (e) {
      console.warn('Failed to refresh user profile', e);
    }
  };

  const isAdmin = user?.role === 'ADMIN';
  const isStaff = user?.role === 'ADMIN' || user?.role === 'SECURITY_OFFICER';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin,
        isStaff,
        login,
        register,
        logout,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
