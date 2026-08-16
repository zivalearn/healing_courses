import { supabase } from '../lib/supabase';
import {
  QuizAttempt,
  CreateQuizAttemptInput,
  SubmitQuizAttemptInput,
} from '../types/quizAttempt';

/**
 * Create a new quiz attempt for a user and lesson block.
 * Automatically computes attempt_number if not explicitly provided.
 */
export async function createAttempt(
  attemptData: CreateQuizAttemptInput
): Promise<{ data: QuizAttempt | null; error: Error | null }> {
  try {
    let attemptNumber = attemptData.attempt_number;

    if (!attemptNumber) {
      // Find current max attempt number for this user & lesson block
      const { data: existingAttempts } = await supabase
        .from('quiz_attempts')
        .select('attempt_number')
        .eq('user_id', attemptData.user_id)
        .eq('lesson_block_id', attemptData.lesson_block_id)
        .order('attempt_number', { ascending: false })
        .limit(1);

      attemptNumber = existingAttempts && existingAttempts.length > 0
        ? existingAttempts[0].attempt_number + 1
        : 1;
    }

    const now = new Date().toISOString();
    const payload = {
      ...attemptData,
      attempt_number: attemptNumber,
      started_at: attemptData.started_at || now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('quiz_attempts')
      .insert(payload)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }
    return { data: data as QuizAttempt, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Submit and grade an existing quiz attempt.
 * Updates score, passing_score, is_passed, answers, submitted_at, and duration_seconds.
 */
export async function submitAttempt(
  id: string,
  submission: SubmitQuizAttemptInput
): Promise<{ data: QuizAttempt | null; error: Error | null }> {
  try {
    const now = new Date().toISOString();
    const payload = {
      score: submission.score,
      passing_score: submission.passing_score ?? null,
      is_passed: submission.is_passed ?? false,
      answers: submission.answers ?? null,
      submitted_at: submission.submitted_at || now,
      duration_seconds: submission.duration_seconds ?? null,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('quiz_attempts')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      return { data: null, error };
    }
    return { data: data as QuizAttempt | null, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Fetch all quiz attempts for a user, optionally filtered by lesson_block_id.
 * Ordered by attempt_number descending.
 */
export async function getAttempts(
  userId: string,
  lessonBlockId?: string
): Promise<{ data: QuizAttempt[]; error: Error | null }> {
  try {
    let query = supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', userId);

    if (lessonBlockId) {
      query = query.eq('lesson_block_id', lessonBlockId);
    }

    const { data, error } = await query.order('attempt_number', { ascending: false });

    if (error) {
      return { data: [], error };
    }
    return { data: (data as QuizAttempt[]) || [], error: null };
  } catch (err: any) {
    return { data: [], error: err };
  }
}

/**
 * Fetch the latest attempt for a user on a given lesson block.
 */
export async function getLatestAttempt(
  userId: string,
  lessonBlockId: string
): Promise<{ data: QuizAttempt | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_block_id', lessonBlockId)
      .order('attempt_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return { data: null, error };
    }
    return { data: data as QuizAttempt | null, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Fetch the highest-scoring attempt for a user on a given lesson block.
 */
export async function getBestAttempt(
  userId: string,
  lessonBlockId: string
): Promise<{ data: QuizAttempt | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_block_id', lessonBlockId)
      .order('score', { ascending: false, nullsFirst: false })
      .order('attempt_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return { data: null, error };
    }
    return { data: data as QuizAttempt | null, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Delete a quiz attempt record by ID.
 */
export async function deleteAttempt(
  id: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('quiz_attempts')
      .delete()
      .eq('id', id);

    return { error };
  } catch (err: any) {
    return { error: err };
  }
}

export const quizAttemptService = {
  createAttempt,
  submitAttempt,
  getAttempts,
  getLatestAttempt,
  getBestAttempt,
  deleteAttempt,
};

export default quizAttemptService;
