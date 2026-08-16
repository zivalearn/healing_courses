import { ZivaUserProfile } from '../types';
import { zivaSupabase, isZivaSupabaseConfigured } from '../lib/supabase';

const ZIVA_USER_KEY = 'ziva-user';
const ZIVA_SESSION_KEY = 'ziva-session';

export const zivaAuthService = {
  getCurrentUser(): ZivaUserProfile | null {
    try {
      const raw = localStorage.getItem(ZIVA_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: ZivaUserProfile | null): void {
    if (user) {
      localStorage.setItem(ZIVA_USER_KEY, JSON.stringify(user));
      localStorage.setItem(ZIVA_SESSION_KEY, 'active');
    } else {
      localStorage.removeItem(ZIVA_USER_KEY);
      localStorage.removeItem(ZIVA_SESSION_KEY);
    }
  },

  /**
   * Fetches user profile directly from public.profiles in Ziva Supabase database.
   * The database record's role column is the SINGLE source of truth.
   */
  async fetchUserProfile(userId: string, email?: string, fullName?: string): Promise<ZivaUserProfile | null> {
    if (isZivaSupabaseConfigured && zivaSupabase) {
      try {
        const { data, error } = await zivaSupabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (!error && data) {
          const profile: ZivaUserProfile = {
            id: data.id || userId,
            email: data.email || email || '',
            fullName: data.full_name || data.fullName || data.name || fullName || (email ? email.split('@')[0] : 'User'),
            role: data.role || 'student',
            avatarUrl: data.avatar_url || data.avatarUrl || undefined,
            createdAt: data.created_at || data.createdAt || new Date().toISOString(),
          };
          this.setCurrentUser(profile);
          return profile;
        }
      } catch (err) {
        console.warn('Error fetching profile from Ziva database:', err);
      }
    }
    return null;
  },

  async login(email: string, pass: string): Promise<ZivaUserProfile> {
    if (isZivaSupabaseConfigured && zivaSupabase) {
      const { data, error } = await zivaSupabase.auth.signInWithPassword({ email, password: pass });
      if (error) {
        throw error;
      }
      if (data.user) {
        // Query public.profiles directly from database
        const dbProfile = await this.fetchUserProfile(
          data.user.id,
          data.user.email || email,
          data.user.user_metadata?.full_name
        );
        if (dbProfile) {
          return dbProfile;
        }

        // Fallback if no profile row in DB exists yet: create default student profile in DB
        const newProfile: ZivaUserProfile = {
          id: data.user.id,
          email: data.user.email || email,
          fullName: data.user.user_metadata?.full_name || email.split('@')[0],
          role: 'student',
          createdAt: data.user.created_at || new Date().toISOString(),
        };

        try {
          await zivaSupabase.from('profiles').upsert({
            id: data.user.id,
            email: newProfile.email,
            full_name: newProfile.fullName,
            role: 'student',
          });
        } catch (err) {
          console.warn('Failed to upsert missing profile into Ziva database:', err);
        }

        this.setCurrentUser(newProfile);
        return newProfile;
      }
    }

    // Local Auth fallback (when Supabase is not configured)
    const profile: ZivaUserProfile = {
      id: `zusr-${Math.random().toString(36).substring(2, 9)}`,
      email,
      fullName: email.split('@')[0].toUpperCase(),
      role: 'student',
      createdAt: new Date().toISOString(),
    };

    this.setCurrentUser(profile);
    return profile;
  },

  async signup(email: string, pass: string, fullName: string): Promise<ZivaUserProfile> {
    if (isZivaSupabaseConfigured && zivaSupabase) {
      const { data, error } = await zivaSupabase.auth.signUp({
        email,
        password: pass,
        options: { data: { full_name: fullName } },
      });
      if (error) {
        throw error;
      }
      if (data.user) {
        const initialProfile: ZivaUserProfile = {
          id: data.user.id,
          email: data.user.email || email,
          fullName,
          role: 'student',
          createdAt: new Date().toISOString(),
        };

        try {
          await zivaSupabase.from('profiles').upsert({
            id: data.user.id,
            email: initialProfile.email,
            full_name: fullName,
            role: 'student',
          });
        } catch (err) {
          console.warn('Failed to insert new profile into Ziva database:', err);
        }

        const dbProfile = await this.fetchUserProfile(data.user.id, email, fullName);
        if (dbProfile) {
          return dbProfile;
        }

        this.setCurrentUser(initialProfile);
        return initialProfile;
      }
    }

    const profile: ZivaUserProfile = {
      id: `zusr-${Math.random().toString(36).substring(2, 9)}`,
      email,
      fullName,
      role: 'student',
      createdAt: new Date().toISOString(),
    };

    this.setCurrentUser(profile);
    return profile;
  },

  async logout(): Promise<void> {
    if (isZivaSupabaseConfigured && zivaSupabase) {
      try {
        await zivaSupabase.auth.signOut();
      } catch (err) {
        console.warn('Ziva Supabase signout error:', err);
      }
    }
    this.setCurrentUser(null);
  },

  async resetPassword(email: string): Promise<{ error: any }> {
    if (isZivaSupabaseConfigured && zivaSupabase) {
      const { error } = await zivaSupabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/ziva/login`,
      });
      return { error };
    }
    return { error: null };
  }
};
