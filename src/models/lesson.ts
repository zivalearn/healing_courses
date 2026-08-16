export interface Lesson {
  id: string;
  section_id: string;
  title: string;
  description?: string | null;
  display_order: number;
  estimated_duration: number;
  is_preview: boolean;
  is_locked: boolean;
  created_at?: string;
  updated_at?: string;
}

export type CreateLessonInput = Omit<
  Lesson,
  'id' | 'created_at' | 'updated_at'
> & {
  id?: string;
};

export type UpdateLessonInput = Partial<
  Omit<Lesson, 'id' | 'section_id' | 'created_at' | 'updated_at'>
>;

export interface LessonReorderItem {
  id: string;
  display_order: number;
}
