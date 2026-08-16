import { supabase } from '../lib/supabase';
import { UserProfile } from '../models/profile';
import { User } from '@supabase/supabase-js';
import { enrollmentService } from './enrollmentService';

const LOCAL_PROFILES_KEY = 'heal_with_heer_local_profiles';

function getLocalProfiles(): UserProfile[] {
  try {
    const raw = localStorage.getItem(LOCAL_PROFILES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalProfile(profile: UserProfile): void {
  try {
    const profiles = getLocalProfiles();
    const idx = profiles.findIndex(p => p.id === profile.id || (p.email && profile.email && p.email.toLowerCase() === profile.email.toLowerCase()));
    if (idx >= 0) {
      profiles[idx] = { ...profiles[idx], ...profile, updated_at: new Date().toISOString() };
    } else {
      profiles.unshift({ ...profile, created_at: profile.created_at || new Date().toISOString() });
    }
    localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(profiles));
  } catch (e) {
    console.warn('Failed to cache profile locally', e);
  }
}

export const profileService = {
  /**
   * Fetch a user profile by userId.
   */
  async getProfile(userId: string): Promise<{ data: UserProfile | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        saveLocalProfile(data as UserProfile);
        return { data: data as UserProfile, error: null };
      }

      // Check local cache
      const local = getLocalProfiles().find(p => p.id === userId);
      return { data: local || null, error };
    } catch (err: any) {
      const local = getLocalProfiles().find(p => p.id === userId);
      return { data: local || null, error: err };
    }
  },

  /**
   * Upsert a user profile directly to Supabase and update local cache.
   */
  async upsertProfile(
    profileData: Partial<UserProfile> & { id: string; email: string }
  ): Promise<{ data: UserProfile | null; error: Error | null }> {
    const payload: UserProfile = {
      id: profileData.id,
      email: profileData.email,
      full_name: profileData.full_name || '',
      avatar_url: profileData.avatar_url || '',
      role: profileData.role || 'student',
      updated_at: new Date().toISOString(),
    };

    // Cache locally immediately
    saveLocalProfile(payload);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        return { data: payload, error };
      }

      saveLocalProfile(data as UserProfile);
      return { data: data as UserProfile, error: null };
    } catch (err: any) {
      return { data: payload, error: err };
    }
  },

  /**
   * Update profile fields for a user.
   */
  async updateProfile(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<{ data: UserProfile | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .maybeSingle();

      if (data) {
        saveLocalProfile(data as UserProfile);
        return { data: data as UserProfile, error: null };
      }

      if (error) {
        return { data: null, error };
      }
      return { data: null, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  /**
   * Create profile record if it does not already exist.
   * Useful during initial signup or first-time Google OAuth sign-in.
   */
  async createProfileIfMissing(
    user: User
  ): Promise<{ data: UserProfile | null; error: Error | null }> {
    if (!user) return { data: null, error: new Error('User object is required') };

    try {
      // Re-link guest profile & enrollments matching user's email
      if (user.email) {
        const userEmailLower = user.email.toLowerCase();
        const { data: matchedProfiles } = await supabase
          .from('profiles')
          .select('*')
          .ilike('email', userEmailLower);

        if (matchedProfiles && matchedProfiles.length > 0) {
          for (const oldProf of matchedProfiles) {
            if (oldProf.id !== user.id) {
              await enrollmentService.linkUserEnrollmentsByOldId(oldProf.id, user.id);
            }
          }
        }
      }

      // Check existing profile
      const { data: existing } = await this.getProfile(user.id);
      if (existing) {
        return { data: existing, error: null };
      }

      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
      const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';

      const newProfile: UserProfile = {
        id: user.id,
        email: user.email || '',
        full_name: fullName,
        avatar_url: avatarUrl,
        role: 'student',
        updated_at: new Date().toISOString(),
      };

      saveLocalProfile(newProfile);

      const { data, error } = await supabase
        .from('profiles')
        .upsert(newProfile, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        return { data: newProfile, error };
      }

      saveLocalProfile(data as UserProfile);
      return { data: data as UserProfile, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  /**
   * Fetch all user profiles for admin.
   * Merges Supabase profiles with local cached profiles.
   */
  async getAllProfiles(): Promise<{ data: UserProfile[]; error: Error | null }> {
    const localProfiles = getLocalProfiles();
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      const dbProfiles = (data as UserProfile[]) || [];

      // Merge dbProfiles and localProfiles by id / email
      const map = new Map<string, UserProfile>();
      dbProfiles.forEach(p => map.set(p.id, p));
      localProfiles.forEach(p => {
        if (!map.has(p.id)) {
          map.set(p.id, p);
        }
      });

      const merged = Array.from(map.values());
      return { data: merged, error: null };
    } catch (err: any) {
      return { data: localProfiles, error: err };
    }
  },
};

