import { createClient, SupabaseClient } from '@supabase/supabase-js';

const zivaSupabaseUrl = import.meta.env.VITE_ZIVA_SUPABASE_URL || '';
const zivaSupabaseAnonKey = import.meta.env.VITE_ZIVA_SUPABASE_ANON_KEY || '';

export const isZivaSupabaseConfigured = Boolean(
  zivaSupabaseUrl && zivaSupabaseAnonKey && !zivaSupabaseUrl.includes('placeholder')
);

export const zivaSupabase: SupabaseClient | null = isZivaSupabaseConfigured
  ? createClient(zivaSupabaseUrl, zivaSupabaseAnonKey, {
      auth: {
        storageKey: 'ziva-supabase-auth-token',
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
