import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '../types';
import { apiService } from '../services/api';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; requiresEmailConfirmation?: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setAuthState({
        user: JSON.parse(storedUser),
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await apiService.login(email, password);
      if (!res.success || !res.data) return { success: false, error: (res as any).error || 'Login failed' };

      // Supabase returns { user, session }
      const backendUser = (res.data as any).user as { id: string; email?: string; user_metadata?: Record<string, any> };
      const profile = (res.data as any).profile as { full_name?: string; role?: 'admin' | 'citizen' } | undefined;

      const mappedUser: User = {
        id: backendUser.id,
        email: backendUser.email || email,
        name: profile?.full_name || backendUser.user_metadata?.name || (backendUser.email ? backendUser.email.split('@')[0] : 'User'),
        role: profile?.role || ((email === 'admin@city.gov') ? 'admin' : 'citizen'),
        createdAt: new Date().toISOString(),
        notificationPreferences: {
          email: true,
          push: false,
          sms: false,
        },
      };

      localStorage.setItem('user', JSON.stringify(mappedUser));
      setAuthState({ user: mappedUser, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Login error' };
    }
  };

  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; requiresEmailConfirmation?: boolean; error?: string }> => {
    try {
      const res = await apiService.register(name, email, password);
      if (!res.success || !res.data) return { success: false, error: (res as any).error || 'Registration failed' };

      const backendUser = (res.data as any).user as { id: string; email?: string };
      const profile = (res.data as any).profile as { full_name?: string; role?: 'admin' | 'citizen' } | undefined;
      const newUser: User = {
        id: backendUser.id,
        email: backendUser.email || email,
        name: profile?.full_name || name,
        role: profile?.role || ((email === 'admin@city.gov') ? 'admin' : 'citizen'),
        createdAt: new Date().toISOString(),
        notificationPreferences: {
          email: true,
          push: false,
          sms: false,
        },
      };

      // Supabase may require email confirmation, which means no session yet
      const session = (res.data as any).session;
      const requiresEmailConfirmation = !session; // if email confirmation is enabled

      if (!requiresEmailConfirmation) {
        localStorage.setItem('user', JSON.stringify(newUser));
        setAuthState({ user: newUser, isAuthenticated: true, isLoading: false });
      }
      return { success: true, requiresEmailConfirmation };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Registration error' };
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const updateProfile = async (updates: Partial<User>): Promise<boolean> => {
    try {
      if (!authState.user) return false;

      // Persist to backend (best-effort; depends on your Supabase schema)
      await apiService.updateUserProfile(authState.user.id, updates);

      const updatedUser: User = { ...authState.user, ...updates } as User;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setAuthState(prev => ({ ...prev, user: updatedUser }));
      return true;
    } catch (error) {
      console.error('Profile update error:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      ...authState,
      login,
      register,
      logout,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};