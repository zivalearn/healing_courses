import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session, AuthResponse, OAuthResponse } from '@supabase/supabase-js';
import { authService } from '../services/authService';
import { profileService } from '../services/profileService';
import { UserProfile } from '../models/profile';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<AuthResponse>;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ data: any; error: Error | null }>;
  signInWithGoogle: () => Promise<OAuthResponse>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ data: UserProfile | null; error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Helper to load or auto-create profile for authenticated user from Supabase public.profiles table
  const syncUserProfile = useCallback(async (authUser: User | null) => {
    if (!authUser) {
      setProfile(null);
      return;
    }

    try {
      // First fetch directly from public.profiles in Supabase database
      const { data: fetchedProf } = await profileService.getProfile(authUser.id);
      if (fetchedProf) {
        setProfile(fetchedProf);
      } else {
        // Create profile if missing (e.g. Google OAuth or standard signup)
        const { data: prof } = await profileService.createProfileIfMissing(authUser);
        setProfile(prof);
      }
    } catch (err) {
      console.error('Failed to sync user profile:', err);
    }
  }, []);

  useEffect(() => {
    // Check initial session
    authService.getSession().then(async (sessionData) => {
      setSession(sessionData);
      const currentUser = sessionData?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await syncUserProfile(currentUser);
      }
      setLoading(false);
    }).catch((err) => {
      console.error('Error fetching Supabase session:', err);
      setLoading(false);
    });

    // Subscribe to auth state changes
    const subscription = authService.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await syncUserProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [syncUserProfile]);

  const signUp = async (email: string, password: string): Promise<AuthResponse> => {
    const res = await authService.signUp(email, password);
    if (res.data?.user) {
      await syncUserProfile(res.data.user);
    }
    return res;
  };

  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    const res = await authService.signIn(email, password);
    if (res.data?.user) {
      await syncUserProfile(res.data.user);
    }
    return res;
  };

  const signOut = async (): Promise<{ error: Error | null }> => {
    const result = await authService.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    return result;
  };

  const resetPassword = async (email: string): Promise<{ data: any; error: Error | null }> => {
    return await authService.resetPassword(email);
  };

  const signInWithGoogle = async (): Promise<OAuthResponse> => {
    return await authService.signInWithGoogle();
  };

  const updateProfile = async (
    updates: Partial<UserProfile>
  ): Promise<{ data: UserProfile | null; error: Error | null }> => {
    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }
    const result = await profileService.updateProfile(user.id, updates);
    if (result.data) {
      setProfile(result.data);
    }
    return result;
  };

  const refreshProfile = async (): Promise<void> => {
    if (user) {
      const { data } = await profileService.getProfile(user.id);
      if (data) setProfile(data);
    }
  };

  const isAdmin = Boolean(user && profile && profile.role === 'admin');

  const value: AuthContextType = {
    user,
    session,
    profile,
    isAdmin,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    signInWithGoogle,
    updateProfile,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
