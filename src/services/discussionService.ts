import { supabase } from '../lib/supabase';
import {
  DiscussionThread,
  CreateThreadInput,
  UpdateThreadInput,
  DiscussionReply,
  CreateReplyInput,
  UpdateReplyInput,
} from '../types/discussion';

/**
 * Create a new discussion thread for a lesson.
 */
export async function createThread(
  threadData: CreateThreadInput
): Promise<{ data: DiscussionThread | null; error: Error | null }> {
  try {
    const now = new Date().toISOString();
    const payload = {
      ...threadData,
      is_pinned: threadData.is_pinned ?? false,
      is_locked: threadData.is_locked ?? false,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('discussion_threads')
      .insert(payload)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }
    return { data: data as DiscussionThread, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Update an existing discussion thread by ID.
 */
export async function updateThread(
  id: string,
  updates: UpdateThreadInput
): Promise<{ data: DiscussionThread | null; error: Error | null }> {
  try {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('discussion_threads')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      return { data: null, error };
    }
    return { data: data as DiscussionThread | null, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Delete a discussion thread by ID.
 */
export async function deleteThread(
  id: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('discussion_threads')
      .delete()
      .eq('id', id);

    return { error };
  } catch (err: any) {
    return { error: err };
  }
}

/**
 * Pin or unpin a discussion thread.
 */
export async function pinThread(
  id: string,
  isPinned: boolean = true
): Promise<{ data: DiscussionThread | null; error: Error | null }> {
  return updateThread(id, { is_pinned: isPinned });
}

/**
 * Lock or unlock a discussion thread.
 */
export async function lockThread(
  id: string,
  isLocked: boolean = true
): Promise<{ data: DiscussionThread | null; error: Error | null }> {
  return updateThread(id, { is_locked: isLocked });
}

/**
 * Get all discussion threads for a given lesson ID.
 * Pinned threads are ordered first, followed by newest threads.
 */
export async function getThreads(
  lessonId: string
): Promise<{ data: DiscussionThread[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('discussion_threads')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      return { data: [], error };
    }
    return { data: (data as DiscussionThread[]) || [], error: null };
  } catch (err: any) {
    return { data: [], error: err };
  }
}

/**
 * Fetch a single discussion thread by ID.
 */
export async function getThread(
  id: string
): Promise<{ data: DiscussionThread | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('discussion_threads')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return { data: null, error };
    }
    return { data: data as DiscussionThread | null, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Create a reply for a discussion thread.
 */
export async function createReply(
  replyData: CreateReplyInput
): Promise<{ data: DiscussionReply | null; error: Error | null }> {
  try {
    const now = new Date().toISOString();
    const payload = {
      ...replyData,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('discussion_replies')
      .insert(payload)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }
    return { data: data as DiscussionReply, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Update an existing reply by ID.
 */
export async function updateReply(
  id: string,
  updates: UpdateReplyInput
): Promise<{ data: DiscussionReply | null; error: Error | null }> {
  try {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('discussion_replies')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      return { data: null, error };
    }
    return { data: data as DiscussionReply | null, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Delete a reply by ID.
 */
export async function deleteReply(
  id: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('discussion_replies')
      .delete()
      .eq('id', id);

    return { error };
  } catch (err: any) {
    return { error: err };
  }
}

/**
 * Fetch all replies for a given discussion thread ID.
 * Ordered chronologically by created_at.
 */
export async function getReplies(
  threadId: string
): Promise<{ data: DiscussionReply[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('discussion_replies')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error) {
      return { data: [], error };
    }
    return { data: (data as DiscussionReply[]) || [], error: null };
  } catch (err: any) {
    return { data: [], error: err };
  }
}

export const discussionService = {
  createThread,
  updateThread,
  deleteThread,
  pinThread,
  lockThread,
  getThreads,
  getThread,
  createReply,
  updateReply,
  deleteReply,
  getReplies,
};

export default discussionService;
