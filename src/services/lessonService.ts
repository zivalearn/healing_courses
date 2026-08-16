import { supabase } from '../lib/supabase';
import {
  Lesson,
  CreateLessonInput,
  UpdateLessonInput,
  LessonReorderItem,
} from '../models/lesson';

export const lessonService = {
  /**
   * Create a new lesson inside a section.
   */
  async createLesson(
    lessonData: CreateLessonInput
  ): Promise<{ data: Lesson | null; error: Error | null }> {
    try {
      const payload = {
        ...lessonData,
        display_order: lessonData.display_order ?? 0,
        estimated_duration: lessonData.estimated_duration ?? 0,
        is_preview: lessonData.is_preview ?? false,
        is_locked: lessonData.is_locked ?? false,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('lessons')
        .insert(payload)
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }
      return { data: data as Lesson, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  /**
   * Update an existing lesson by ID.
   * Automatically maintains the updated_at timestamp.
   */
  async updateLesson(
    id: string,
    updates: UpdateLessonInput
  ): Promise<{ data: Lesson | null; error: Error | null }> {
    try {
      const payload = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('lessons')
        .update(payload)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) {
        return { data: null, error };
      }
      return { data: data as Lesson | null, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  /**
   * Delete a lesson by ID.
   */
  async deleteLesson(id: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', id);

      return { error };
    } catch (err: any) {
      return { error: err };
    }
  },

  /**
   * Fetch all lessons belonging to a specific section, ordered by display_order ascending.
   * Falls back to Course Builder data in LocalStorage if database query is empty.
   */
  async getLessonsBySection(
    sectionId: string,
    courseId?: string
  ): Promise<{ data: Lesson[]; error: Error | null }> {
    // Check LocalStorage builder data first so Course Builder changes take immediate effect
    try {
      const mapRawLessons = (rawLessons: any[]): Lesson[] => {
        return rawLessons.map((bLes: any, index: number) => ({
          id: bLes.id,
          section_id: sectionId,
          title: bLes.title,
          description: bLes.subtitle || null,
          display_order: index,
          estimated_duration: parseInt(bLes.estimatedTime || '15') || 15,
          is_preview: bLes.isPreviewAllowed ?? false,
          is_locked: bLes.isLocked ?? false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
      };

      // 1. If courseId provided, check that specific key first
      if (courseId) {
        const primaryKey = 'hwh_builder_course_' + courseId;
        const raw = localStorage.getItem(primaryKey);
        if (raw) {
          const builderData = JSON.parse(raw);
          const foundSec = builderData.sections?.find((s: any) => s.id === sectionId);
          if (foundSec && foundSec.lessons) {
            return { data: mapRawLessons(foundSec.lessons), error: null };
          }
        }
      }

      // 2. Scan all builder keys if courseId key wasn't matched
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('hwh_builder_course_')) {
          if (courseId && key === 'hwh_builder_course_' + courseId) continue;

          const raw = localStorage.getItem(key);
          if (raw) {
            const builderData = JSON.parse(raw);
            const foundSec = builderData.sections?.find((s: any) => s.id === sectionId);
            if (foundSec && foundSec.lessons) {
              return { data: mapRawLessons(foundSec.lessons), error: null };
            }
          }
        }
      }
    } catch (e) {
      console.warn('Builder service LocalStorage check for lessons:', e);
    }

    // Fallback to Supabase database
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('section_id', sectionId)
        .order('display_order', { ascending: true });

      if (!error && data && data.length > 0) {
        return { data: data as Lesson[], error: null };
      }
    } catch (err: any) {
      console.warn('Supabase lesson query warning:', err);
    }

    return { data: [], error: null };
  },

  /**
   * Reorder multiple lessons within a section by updating display_order for each item.
   */
  async reorderLessons(
    sectionId: string,
    items: LessonReorderItem[]
  ): Promise<{ data: Lesson[]; error: Error | null }> {
    try {
      const now = new Date().toISOString();
      const updates = items.map((item) =>
        supabase
          .from('lessons')
          .update({ display_order: item.display_order, updated_at: now })
          .eq('id', item.id)
          .eq('section_id', sectionId)
      );

      const results = await Promise.all(updates);

      const firstError = results.find((r) => r.error)?.error;
      if (firstError) {
        return { data: [], error: firstError };
      }

      // Re-fetch all lessons after ordering update
      return await this.getLessonsBySection(sectionId);
    } catch (err: any) {
      return { data: [], error: err };
    }
  },
};

export default lessonService;
