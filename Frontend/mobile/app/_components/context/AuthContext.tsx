import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as authApi from '../api/auth';
import { setSecureItem, getSecureItem, deleteSecureItem } from '../utils/secureStoreWrapper';
import { LoginResponse, User } from '../types';


interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  role?: 'PARTICULIER'; // Forced for mobile
  status: 'PENDING';
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await authApi.verifySession();
        await setSecureItem('user', userData);
        setUser(userData);
      } catch (error) {
        try {
          const user = await getSecureItem('user');
          setUser(user);
        } catch (secureStoreError) {
          console.error('SecureStore error:', secureStoreError);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };
  
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      await setSecureItem('token', response.token);
      await setSecureItem('user', response.user);
      setUser(response.user);
    } catch (error) {
      console.error('Login context error:', error);
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      await authApi.register({ ...userData, role: 'PARTICULIER' });
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
      await deleteSecureItem('token');
      await deleteSecureItem('user');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);