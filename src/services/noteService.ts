import { supabase } from '../lib/supabase';
import { Note, CreateNoteInput, UpdateNoteInput } from '../types/note';

/**
 * Create a new user note for a lesson.
 */
export async function createNote(
  noteData: CreateNoteInput
): Promise<{ data: Note | null; error: Error | null }> {
  try {
    const now = new Date().toISOString();
    const payload = {
      ...noteData,
      title: noteData.title || null,
      content: noteData.content || null,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('notes')
      .insert(payload)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }
    return { data: data as Note, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Update an existing note by ID.
 * Automatically updates updated_at timestamp.
 */
export async function updateNote(
  id: string,
  updates: UpdateNoteInput
): Promise<{ data: Note | null; error: Error | null }> {
  try {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('notes')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      return { data: null, error };
    }
    return { data: data as Note | null, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Delete a note by ID.
 */
export async function deleteNote(
  id: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);

    return { error };
  } catch (err: any) {
    return { error: err };
  }
}

/**
 * Get all notes belonging to a specific user.
 * Ordered by updated_at descending.
 */
export async function getNotes(
  userId: string
): Promise<{ data: Note[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      return { data: [], error };
    }
    return { data: (data as Note[]) || [], error: null };
  } catch (err: any) {
    return { data: [], error: err };
  }
}

/**
 * Get all notes for a specific user and lesson.
 * Ordered by created_at descending.
 */
export async function getLessonNotes(
  userId: string,
  lessonId: string
): Promise<{ data: Note[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: [], error };
    }
    return { data: (data as Note[]) || [], error: null };
  } catch (err: any) {
    return { data: [], error: err };
  }
}

/**
 * Search a user's notes by a search query (matching title or content).
 */
export async function searchNotes(
  userId: string,
  query: string
): Promise<{ data: Note[]; error: Error | null }> {
  try {
    if (!query || query.trim() === '') {
      return getNotes(userId);
    }

    const searchTerm = `%${query.trim()}%`;
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`)
      .order('updated_at', { ascending: false });

    if (error) {
      return { data: [], error };
    }
    return { data: (data as Note[]) || [], error: null };
  } catch (err: any) {
    return { data: [], error: err };
  }
}

export const noteService = {
  createNote,
  updateNote,
  deleteNote,
  getNotes,
  getLessonNotes,
  searchNotes,
};

export default noteService;
