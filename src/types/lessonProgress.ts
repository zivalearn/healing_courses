export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  progress_percentage: number;
  is_completed: boolean;
  completed_at?: string | null;
  started_at?: string | null;
  last_viewed_at?: string | null;
  time_spent_seconds: number;
  created_at?: string;
  updated_at?: string;
}

export type UpsertLessonProgressInput = {
  id?: string;
  user_id: string;
  lesson_id: string;
  progress_percentage?: number;
  is_completed?: boolean;
  completed_at?: string | null;
  started_at?: string | null;
  last_viewed_at?: string | null;
  time_spent_seconds?: number;
};

export type UpdateLessonProgressInput = Partial<
  Omit<LessonProgress, 'id' | 'user_id' | 'lesson_id' | 'created_at' | 'updated_at'>
>;
