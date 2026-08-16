export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: 'student' | 'admin' | string;
  created_at?: string;
  updated_at?: string;
}
