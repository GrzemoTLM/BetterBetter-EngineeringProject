/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useCallback, useEffect } from 'react';
import type { AuthContextType, UserProfile } from '../types/auth';
import apiService from '../services/api';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('AuthContext: Initializing...');
        const savedToken = apiService.getToken();
        console.log('AuthContext: Token from localStorage:', savedToken ? 'Found ✅' : 'Not found ❌');

        if (savedToken) {
          setToken(savedToken);
          try {
            console.log('AuthContext: Fetching current user...');
            const currentUser = await apiService.getCurrentUser();
            console.log('AuthContext: User fetched successfully:', currentUser);
            setUser(currentUser);
          } catch (err) {
            console.error('AuthContext: Failed to fetch current user:', err);
            apiService.removeToken();
            setToken(null);
          }
        }
      } catch (err) {
        console.error('AuthContext: Auth initialization error:', err);
      } finally {
        setIsLoading(false);
        console.log('AuthContext: Initialization complete');
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.login({ email, password });

      // Only set user and token if there's no 2FA challenge
      if (!response.challenge_id && response.access) {
        setToken(response.access);
        const currentUser = await apiService.getCurrentUser();
        setUser(currentUser);
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verify2FA = useCallback(async (challengeId: string, code: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.verify2FA({ challenge_id: challengeId, code });
      if (response.access) {
        setToken(response.access);
        const currentUser = await apiService.getCurrentUser();
        setUser(currentUser);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '2FA verification error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.register({ username, email, password });
      setToken(response.access);
      const currentUser = await apiService.getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    apiService.logout();
    setUser(null);
    setToken(null);
    setError(null);
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    verify2FA,
    register,
    logout,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

