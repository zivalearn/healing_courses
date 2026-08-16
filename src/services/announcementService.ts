import { supabase } from '../lib/supabase';
import {
  Announcement,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
} from '../types/announcement';

/**
 * Create a new course announcement.
 */
export async function createAnnouncement(
  announcementData: CreateAnnouncementInput
): Promise<{ data: Announcement | null; error: Error | null }> {
  try {
    const now = new Date().toISOString();
    const isPublished = announcementData.is_published ?? false;

    const payload = {
      ...announcementData,
      is_published: isPublished,
      published_at: isPublished
        ? announcementData.published_at || now
        : announcementData.published_at || null,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('announcements')
      .insert(payload)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }
    return { data: data as Announcement, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Update an existing announcement by ID.
 */
export async function updateAnnouncement(
  id: string,
  updates: UpdateAnnouncementInput
): Promise<{ data: Announcement | null; error: Error | null }> {
  try {
    const payload: Record<string, any> = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('announcements')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      return { data: null, error };
    }
    return { data: data as Announcement | null, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Delete an announcement by ID.
 */
export async function deleteAnnouncement(
  id: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    return { error };
  } catch (err: any) {
    return { error: err };
  }
}

/**
 * Publish an announcement by ID and update published_at.
 */
export async function publishAnnouncement(
  id: string
): Promise<{ data: Announcement | null; error: Error | null }> {
  const now = new Date().toISOString();
  return updateAnnouncement(id, {
    is_published: true,
    published_at: now,
  });
}

/**
 * Unpublish an announcement by ID.
 */
export async function unpublishAnnouncement(
  id: string
): Promise<{ data: Announcement | null; error: Error | null }> {
  return updateAnnouncement(id, {
    is_published: false,
  });
}

/**
 * Get all announcements for a given course ID.
 * By default, fetches only published announcements unless publishedOnly is explicitly set to false.
 */
export async function getCourseAnnouncements(
  courseId: string,
  options?: { publishedOnly?: boolean }
): Promise<{ data: Announcement[]; error: Error | null }> {
  try {
    let query = supabase
      .from('announcements')
      .select('*')
      .eq('course_id', courseId);

    const publishedOnly = options?.publishedOnly ?? true;
    if (publishedOnly) {
      query = query.eq('is_published', true);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return { data: [], error };
    }
    return { data: (data as Announcement[]) || [], error: null };
  } catch (err: any) {
    return { data: [], error: err };
  }
}

/**
 * Fetch a single announcement by its UUID ID.
 */
export async function getAnnouncement(
  id: string
): Promise<{ data: Announcement | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return { data: null, error };
    }
    return { data: data as Announcement | null, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Get all announcements across all courses.
 */
export async function getAllAnnouncements(): Promise<{ data: Announcement[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { data: [], error };
    }
    return { data: (data as Announcement[]) || [], error: null };
  } catch (err: any) {
    return { data: [], error: err };
  }
}

export const announcementService = {
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  publishAnnouncement,
  unpublishAnnouncement,
  getCourseAnnouncements,
  getAnnouncement,
};

export default announcementService;
