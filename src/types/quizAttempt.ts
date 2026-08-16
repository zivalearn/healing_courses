export interface QuizAttempt {
  id: string;
  user_id: string;
  lesson_block_id: string;
  attempt_number: number;
  score?: number | null;
  passing_score?: number | null;
  is_passed?: boolean | null;
  answers?: Record<string, any> | any[] | null;
  started_at?: string | null;
  submitted_at?: string | null;
  duration_seconds?: number | null;
  created_at?: string;
  updated_at?: string;
}

export type CreateQuizAttemptInput = {
  id?: string;
  user_id: string;
  lesson_block_id: string;
  attempt_number?: number;
  score?: number | null;
  passing_score?: number | null;
  is_passed?: boolean | null;
  answers?: Record<string, any> | any[] | null;
  started_at?: string | null;
  submitted_at?: string | null;
  duration_seconds?: number | null;
};

export type SubmitQuizAttemptInput = {
  score: number;
  passing_score?: number | null;
  is_passed?: boolean | null;
  answers?: Record<string, any> | any[] | null;
  submitted_at?: string | null;
  duration_seconds?: number | null;
};
