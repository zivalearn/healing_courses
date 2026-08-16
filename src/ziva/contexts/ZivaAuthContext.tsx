import React, { createContext, useContext, useState, useEffect } from 'react';
import { ZivaUserProfile } from '../types';
import { zivaAuthService } from '../services/zivaAuthService';
import { zivaSupabase, isZivaSupabaseConfigured } from '../lib/supabase';

interface ZivaAuthContextType {
  user: ZivaUserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<ZivaUserProfile>;
  signup: (email: string, pass: string, fullName: string) => Promise<ZivaUserProfile>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const ZivaAuthContext = createContext<ZivaAuthContextType | undefined>(undefined);

export const ZivaAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ZivaUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      setLoading(true);
      if (isZivaSupabaseConfigured && zivaSupabase) {
        try {
          const { data: { session } } = await zivaSupabase.auth.getSession();
          if (session?.user) {
            const profile = await zivaAuthService.fetchUserProfile(
              session.user.id,
              session.user.email,
              session.user.user_metadata?.full_name
            );
            if (isMounted && profile) {
              setUser(profile);
              setLoading(false);
              return;
            }
          }
        } catch (err) {
          console.warn('Error checking Ziva auth session:', err);
        }
      }

      const cached = zivaAuthService.getCurrentUser();
      if (isMounted) {
        setUser(cached);
        setLoading(false);
      }
    }

    initializeAuth();

    let subscription: { unsubscribe: () => void } | null = null;

    if (isZivaSupabaseConfigured && zivaSupabase) {
      const { data } = zivaSupabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const profile = await zivaAuthService.fetchUserProfile(
            session.user.id,
            session.user.email,
            session.user.user_metadata?.full_name
          );
          if (isMounted) {
            setUser(profile);
          }
        } else if (event === 'SIGNED_OUT') {
          if (isMounted) {
            setUser(null);
            zivaAuthService.setCurrentUser(null);
          }
        }
      });
      subscription = data.subscription;
    }

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const login = async (email: string, pass: string) => {
    const u = await zivaAuthService.login(email, pass);
    setUser(u);
    return u;
  };

  const signup = async (email: string, pass: string, fullName: string) => {
    const u = await zivaAuthService.signup(email, pass, fullName);
    setUser(u);
    return u;
  };

  const logout = async () => {
    await zivaAuthService.logout();
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    return await zivaAuthService.resetPassword(email);
  };

  const isAdmin = Boolean(user && user.role === 'admin');

  return (
    <ZivaAuthContext.Provider value={{ user, loading, isAdmin, login, signup, logout, resetPassword }}>
      {children}
    </ZivaAuthContext.Provider>
  );
};

export const useZivaAuth = (): ZivaAuthContextType => {
  const ctx = useContext(ZivaAuthContext);
  if (!ctx) {
    throw new Error('useZivaAuth must be used within a ZivaAuthProvider');
  }
  return ctx;
};
