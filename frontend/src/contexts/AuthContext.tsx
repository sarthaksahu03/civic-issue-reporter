import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '../types';
import { apiService } from '../services/api';
import { supabase } from '../services/supabaseClient';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; requiresEmailConfirmation?: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
  googleSignIn: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}
  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/login',
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Reset error' };
    }
  };

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  // Listen for Supabase auth state changes (OAuth, etc.)
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Sync profile to backend
        const sync = await apiService.syncProfile({ id: session.user.id, email: session.user.email || '', name: session.user.user_metadata?.name });
        const profile = (sync.success && (sync.data as any)?.profile) || undefined;
        const mappedUser: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: profile?.full_name || session.user.user_metadata?.name || (session.user.email ? session.user.email.split('@')[0] : 'User'),
          role: (profile?.role as any) || 'citizen',
          createdAt: new Date().toISOString(),
          notificationPreferences: { email: true, push: false, sms: false },
        };
        localStorage.setItem('user', JSON.stringify(mappedUser));
        setAuthState({ user: mappedUser, isAuthenticated: true, isLoading: false });
      } else {
        // No session, clear user
        localStorage.removeItem('user');
        setAuthState({ user: null, isAuthenticated: false, isLoading: false });
      }
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setAuthState({ user: JSON.parse(storedUser), isAuthenticated: true, isLoading: false });
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }

    // Handle Supabase OAuth return
    const initOAuth = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (user) {
        // Sync profile to backend
        const sync = await apiService.syncProfile({ id: user.id, email: user.email || '', name: user.user_metadata?.name });
        const profile = (sync.success && (sync.data as any)?.profile) || undefined;
        const mappedUser: User = {
          id: user.id,
          email: user.email || '',
          name: profile?.full_name || user.user_metadata?.name || (user.email ? user.email.split('@')[0] : 'User'),
          role: (profile?.role as any) || 'citizen',
          createdAt: new Date().toISOString(),
          notificationPreferences: { email: true, push: false, sms: false },
        };
        localStorage.setItem('user', JSON.stringify(mappedUser));
        setAuthState({ user: mappedUser, isAuthenticated: true, isLoading: false });
      }
    };
    initOAuth();
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

  const googleSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'email profile',
          // redirectTo can be configured if needed; default is current site origin
        },
      });
      if (error) throw error;

      // In Supabase JS v2, signInWithOAuth returns a URL to redirect the user.
      // The authenticated user will be available after redirect via getSession/onAuthStateChange.
      if (data?.url) {
        window.location.assign(data.url);
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      ...authState,
      login,
      register,
      logout,
      updateProfile,
      googleSignIn,
      resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
};