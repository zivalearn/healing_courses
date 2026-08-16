export interface Announcement {
  id: string;
  course_id: string;
  title: string;
  content: string;
  is_published?: boolean;
  published_at?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type CreateAnnouncementInput = {
  id?: string;
  course_id: string;
  title: string;
  content: string;
  is_published?: boolean;
  published_at?: string | null;
  created_by?: string | null;
};

export type UpdateAnnouncementInput = Partial<
  Omit<Announcement, 'id' | 'course_id' | 'created_at' | 'updated_at'>
>;
