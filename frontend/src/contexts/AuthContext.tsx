import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '../types';
import { apiService } from '../services/api';
import { supabase } from '../services/supabaseClient';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  adminLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; requiresEmailConfirmation?: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
  googleSignIn: (asAdmin?: boolean) => Promise<void>;
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
        // If OAuth was initiated for admin access, enforce role here post-redirect
        const oauthAsAdmin = sessionStorage.getItem('oauth_as_admin');
        if (oauthAsAdmin) {
          sessionStorage.removeItem('oauth_as_admin');
          if (mappedUser.role !== 'admin') {
            await supabase.auth.signOut();
            localStorage.removeItem('user');
            setAuthState({ user: null, isAuthenticated: false, isLoading: false });
            alert('Admin access required. Please contact support if this is an error.');
            return;
          }
        }
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

  const adminLogin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await apiService.adminLogin(email, password);
      if (!res.success || !res.data) return { success: false, error: (res as any).error || 'Admin login failed' };
      const backendUser = (res.data as any).user as { id: string; email?: string; user_metadata?: Record<string, any> };
      const profile = (res.data as any).profile as { full_name?: string; role?: 'admin' | 'citizen' } | undefined;
      if (profile?.role !== 'admin') {
        return { success: false, error: 'Admin access required' };
      }
      const mappedUser: User = {
        id: backendUser.id,
        email: backendUser.email || email,
        name: profile?.full_name || backendUser.user_metadata?.name || (backendUser.email ? backendUser.email.split('@')[0] : 'Admin'),
        role: 'admin',
        createdAt: new Date().toISOString(),
        notificationPreferences: { email: true, push: false, sms: false },
      };
      localStorage.setItem('user', JSON.stringify(mappedUser));
      setAuthState({ user: mappedUser, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (error) {
      console.error('Admin login error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Admin login error' };
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

  const googleSignIn = async (asAdmin?: boolean) => {
    try {
      // Mark intent for admin OAuth so we can enforce after redirect
      if (asAdmin) {
        sessionStorage.setItem('oauth_as_admin', '1');
      } else {
        sessionStorage.removeItem('oauth_as_admin');
      }

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
      adminLogin,
      register,
      logout,
      updateProfile,
      googleSignIn,
    }}>
      {children}
    </AuthContext.Provider>
  );
};