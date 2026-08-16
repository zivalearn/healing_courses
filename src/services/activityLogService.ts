import { supabase } from '../lib/supabase';
import { ActivityLog, LogActivityInput } from '../types/activityLog';

/**
 * Log a user action or system activity event.
 */
export async function logActivity(
  activityData: LogActivityInput
): Promise<{ data: ActivityLog | null; error: Error | null }> {
  try {
    const now = new Date().toISOString();
    const payload = {
      ...activityData,
      metadata: activityData.metadata || {},
      created_at: now,
    };

    const { data, error } = await supabase
      .from('activity_logs')
      .insert(payload)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }
    return { data: data as ActivityLog, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Get activity logs for a specific user.
 * Allows optional filtering by entity type and record limit.
 */
export async function getUserActivity(
  userId: string,
  options?: { limit?: number; entity?: string }
): Promise<{ data: ActivityLog[]; error: Error | null }> {
  try {
    let query = supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId);

    if (options?.entity) {
      query = query.eq('entity', options.entity);
    }

    query = query.order('created_at', { ascending: false });

    if (options?.limit && options.limit > 0) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      return { data: [], error };
    }
    return { data: (data as ActivityLog[]) || [], error: null };
  } catch (err: any) {
    return { data: [], error: err };
  }
}

/**
 * Get activity logs for a specific entity and entity ID.
 */
export async function getEntityActivity(
  entity: string,
  entityId: string,
  options?: { limit?: number }
): Promise<{ data: ActivityLog[]; error: Error | null }> {
  try {
    let query = supabase
      .from('activity_logs')
      .select('*')
      .eq('entity', entity)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (options?.limit && options.limit > 0) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      return { data: [], error };
    }
    return { data: (data as ActivityLog[]) || [], error: null };
  } catch (err: any) {
    return { data: [], error: err };
  }
}

/**
 * Get recent activity logs across users or filtered by user/entity.
 */
export async function getRecentActivity(
  options?: { limit?: number; userId?: string; entity?: string }
): Promise<{ data: ActivityLog[]; error: Error | null }> {
  try {
    let query = supabase
      .from('activity_logs')
      .select('*');

    if (options?.userId) {
      query = query.eq('user_id', options.userId);
    }

    if (options?.entity) {
      query = query.eq('entity', options.entity);
    }

    query = query.order('created_at', { ascending: false });

    const limit = options?.limit ?? 50;
    if (limit > 0) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      return { data: [], error };
    }
    return { data: (data as ActivityLog[]) || [], error: null };
  } catch (err: any) {
    return { data: [], error: err };
  }
}

/**
 * Delete an activity log entry by ID.
 */
export async function deleteActivity(
  id: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('activity_logs')
      .delete()
      .eq('id', id);

    return { error };
  } catch (err: any) {
    return { error: err };
  }
}

export const activityLogService = {
  logActivity,
  getUserActivity,
  getEntityActivity,
  getRecentActivity,
  deleteActivity,
};

export default activityLogService;
