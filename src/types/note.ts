export interface Note {
  id: string;
  user_id: string;
  lesson_id: string;
  title?: string | null;
  content?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type CreateNoteInput = {
  id?: string;
  user_id: string;
  lesson_id: string;
  title?: string | null;
  content?: string | null;
};

export type UpdateNoteInput = Partial<
  Omit<Note, 'id' | 'user_id' | 'lesson_id' | 'created_at' | 'updated_at'>
>;
