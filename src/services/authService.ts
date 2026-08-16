import { supabase } from '../lib/supabase';
import { User, Session, AuthResponse, OAuthResponse } from '@supabase/supabase-js';

export const authService = {
  /**
   * Register a new user with email and password.
   */
  async signUp(email: string, password: string): Promise<AuthResponse> {
    return await supabase.auth.signUp({
      email,
      password,
    });
  },

  /**
   * Sign in an existing user with email and password.
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  },

  /**
   * Sign out the currently authenticated user.
   */
  async signOut(): Promise<{ error: Error | null }> {
    return await supabase.auth.signOut();
  },

  /**
   * Send a password reset email to the specified user email address.
   */
  async resetPassword(email: string): Promise<{ data: any; error: Error | null }> {
    const redirectTo = `${window.location.origin}/reset-password`;
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
  },

  /**
   * Initiate Google OAuth Sign In flow.
   */
  async signInWithGoogle(): Promise<OAuthResponse> {
    const redirectTo = `${window.location.origin}/my-courses`;
    return await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });
  },

  /**
   * Retrieve current authenticated user from session.
   */
  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  /**
   * Get active Supabase session.
   */
  async getSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  /**
   * Listen to auth state updates.
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return subscription;
  }
};
