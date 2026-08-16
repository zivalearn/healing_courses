import { supabase } from '../lib/supabase';
import {
  LessonProgress,
  UpsertLessonProgressInput,
  UpdateLessonProgressInput,
} from '../types/lessonProgress';

/**
 * Fetch all lesson progress records for a user.
 */
export async function getLessonProgress(
  userId: string
): Promise<{ data: LessonProgress[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      return { data: [], error };
    }
    return { data: (data as LessonProgress[]) || [], error: null };
  } catch (err: any) {
    return { data: [], error: err };
  }
}

/**
 * Fetch lesson progress record for a specific user and lesson.
 */
export async function getLessonProgressByLesson(
  userId: string,
  lessonId: string
): Promise<{ data: LessonProgress | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    if (error) {
      return { data: null, error };
    }
    return { data: data as LessonProgress | null, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Upsert lesson progress (insert or update on conflict user_id, lesson_id).
 */
export async function upsertProgress(
  progressData: UpsertLessonProgressInput
): Promise<{ data: LessonProgress | null; error: Error | null }> {
  try {
    const now = new Date().toISOString();
    const payload = {
      ...progressData,
      progress_percentage: progressData.progress_percentage ?? 0,
      is_completed: progressData.is_completed ?? false,
      time_spent_seconds: progressData.time_spent_seconds ?? 0,
      last_viewed_at: progressData.last_viewed_at || now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('lesson_progress')
      .upsert(payload, { onConflict: 'user_id,lesson_id' })
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }
    return { data: data as LessonProgress, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Update an existing lesson progress record by ID.
 */
export async function updateProgress(
  id: string,
  updates: UpdateLessonProgressInput
): Promise<{ data: LessonProgress | null; error: Error | null }> {
  try {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('lesson_progress')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      return { data: null, error };
    }
    return { data: data as LessonProgress | null, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Mark a lesson as completed for a user.
 */
export async function markLessonCompleted(
  userId: string,
  lessonId: string
): Promise<{ data: LessonProgress | null; error: Error | null }> {
  const now = new Date().toISOString();
  return upsertProgress({
    user_id: userId,
    lesson_id: lessonId,
    progress_percentage: 100,
    is_completed: true,
    completed_at: now,
    last_viewed_at: now,
  });
}

/**
 * Update the time spent on a lesson by record ID.
 */
export async function updateTimeSpent(
  id: string,
  timeSpentSeconds: number
): Promise<{ data: LessonProgress | null; error: Error | null }> {
  return updateProgress(id, {
    time_spent_seconds: timeSpentSeconds,
    last_viewed_at: new Date().toISOString(),
  });
}

/**
 * Delete a lesson progress record by ID.
 */
export async function deleteProgress(
  id: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('lesson_progress')
      .delete()
      .eq('id', id);

    return { error };
  } catch (err: any) {
    return { error: err };
  }
}

export const lessonProgressService = {
  getLessonProgress,
  getLessonProgressByLesson,
  upsertProgress,
  updateProgress,
  markLessonCompleted,
  updateTimeSpent,
  deleteProgress,
};

export default lessonProgressService;
