import { supabase } from '../lib/supabase';
import { Notification, CreateNotificationInput } from '../types/notification';

/**
 * Create a new notification for a user.
 */
export async function createNotification(
  notificationData: CreateNotificationInput
): Promise<{ data: Notification | null; error: Error | null }> {
  try {
    const now = new Date().toISOString();
    const payload = {
      ...notificationData,
      is_read: notificationData.is_read ?? false,
      created_at: now,
    };

    const { data, error } = await supabase
      .from('notifications')
      .insert(payload)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }
    return { data: data as Notification, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Get notifications for a user.
 * Optional parameters allow filtering unread notifications or setting a fetch limit.
 * Ordered by created_at descending.
 */
export async function getNotifications(
  userId: string,
  options?: { limit?: number; unreadOnly?: boolean }
): Promise<{ data: Notification[]; error: Error | null }> {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId);

    if (options?.unreadOnly) {
      query = query.eq('is_read', false);
    }

    query = query.order('created_at', { ascending: false });

    if (options?.limit && options.limit > 0) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      return { data: [], error };
    }
    return { data: (data as Notification[]) || [], error: null };
  } catch (err: any) {
    return { data: [], error: err };
  }
}

/**
 * Mark a single notification as read by ID.
 */
export async function markAsRead(
  id: string
): Promise<{ data: Notification | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      return { data: null, error };
    }
    return { data: data as Notification | null, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Mark all unread notifications for a user as read.
 */
export async function markAllAsRead(
  userId: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    return { error };
  } catch (err: any) {
    return { error: err };
  }
}

/**
 * Delete a single notification by ID.
 */
export async function deleteNotification(
  id: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    return { error };
  } catch (err: any) {
    return { error: err };
  }
}

/**
 * Clear (delete) all notifications for a specific user.
 */
export async function clearNotifications(
  userId: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    return { error };
  } catch (err: any) {
    return { error: err };
  }
}

/**
 * Get total unread notifications count for a user.
 */
export async function getUnreadCount(
  userId: string
): Promise<{ count: number; error: Error | null }> {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      return { count: 0, error };
    }
    return { count: count || 0, error: null };
  } catch (err: any) {
    return { count: 0, error: err };
  }
}

export const notificationService = {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearNotifications,
  getUnreadCount,
};

export default notificationService;
