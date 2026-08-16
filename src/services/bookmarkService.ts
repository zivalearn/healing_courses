import { supabase } from '../lib/supabase';
import { Bookmark } from '../types/bookmark';

/**
 * Add a bookmark for a lesson for a specific user.
 */
export async function addBookmark(
  userId: string,
  lessonId: string
): Promise<{ data: Bookmark | null; error: Error | null }> {
  try {
    const payload = {
      user_id: userId,
      lesson_id: lessonId,
    };

    const { data, error } = await supabase
      .from('bookmarks')
      .insert(payload)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }
    return { data: data as Bookmark, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Remove a bookmark for a specific lesson and user.
 */
export async function removeBookmark(
  userId: string,
  lessonId: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('lesson_id', lessonId);

    return { error };
  } catch (err: any) {
    return { error: err };
  }
}

/**
 * Check if a specific lesson is bookmarked by a user.
 */
export async function isBookmarked(
  userId: string,
  lessonId: string
): Promise<{ isBookmarked: boolean; bookmark: Bookmark | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    if (error) {
      return { isBookmarked: false, bookmark: null, error };
    }

    return {
      isBookmarked: !!data,
      bookmark: (data as Bookmark) || null,
      error: null,
    };
  } catch (err: any) {
    return { isBookmarked: false, bookmark: null, error: err };
  }
}

/**
 * Toggle bookmark status for a lesson (adds if not bookmarked, removes if bookmarked).
 */
export async function toggleBookmark(
  userId: string,
  lessonId: string
): Promise<{ isBookmarked: boolean; data: Bookmark | null; error: Error | null }> {
  try {
    const checkResult = await isBookmarked(userId, lessonId);
    if (checkResult.error) {
      return { isBookmarked: false, data: null, error: checkResult.error };
    }

    if (checkResult.isBookmarked) {
      const removeResult = await removeBookmark(userId, lessonId);
      if (removeResult.error) {
        return { isBookmarked: true, data: checkResult.bookmark, error: removeResult.error };
      }
      return { isBookmarked: false, data: null, error: null };
    } else {
      const addResult = await addBookmark(userId, lessonId);
      if (addResult.error) {
        return { isBookmarked: false, data: null, error: addResult.error };
      }
      return { isBookmarked: true, data: addResult.data, error: null };
    }
  } catch (err: any) {
    return { isBookmarked: false, data: null, error: err };
  }
}

/**
 * Get all bookmarks for a specific user ID.
 */
export async function getBookmarks(
  userId: string
): Promise<{ data: Bookmark[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: [], error };
    }
    return { data: (data as Bookmark[]) || [], error: null };
  } catch (err: any) {
    return { data: [], error: err };
  }
}

export const bookmarkService = {
  addBookmark,
  removeBookmark,
  toggleBookmark,
  isBookmarked,
  getBookmarks,
};

export default bookmarkService;
