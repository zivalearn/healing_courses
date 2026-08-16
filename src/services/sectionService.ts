import { supabase } from '../lib/supabase';
import {
  Section,
  CreateSectionInput,
  UpdateSectionInput,
  SectionReorderItem,
} from '../models/section';
import { builderService } from './builderService';

export const sectionService = {
  /**
   * Create a new section for a course.
   */
  async createSection(
    sectionData: CreateSectionInput
  ): Promise<{ data: Section | null; error: Error | null }> {
    try {
      const payload = {
        ...sectionData,
        display_order: sectionData.display_order ?? 0,
        is_locked: sectionData.is_locked ?? false,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('sections')
        .insert(payload)
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }
      return { data: data as Section, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  /**
   * Update an existing section by ID.
   * Automatically updates the updated_at timestamp.
   */
  async updateSection(
    id: string,
    updates: UpdateSectionInput
  ): Promise<{ data: Section | null; error: Error | null }> {
    try {
      const payload = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('sections')
        .update(payload)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) {
        return { data: null, error };
      }
      return { data: data as Section | null, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  /**
   * Delete a section by ID.
   */
  async deleteSection(id: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('sections')
        .delete()
        .eq('id', id);

      return { error };
    } catch (err: any) {
      return { error: err };
    }
  },

  /**
   * Fetch all sections for a given course ID, ordered by display_order ascending.
   * Falls back to Course Builder data in LocalStorage if database query is empty.
   */
  async getSectionsByCourse(
    courseId: string
  ): Promise<{ data: Section[]; error: Error | null }> {
    // Check LocalStorage builder data first
    try {
      let builderData = builderService.getCourseBuilderData(courseId);

      if (!builderData || !builderData.sections || builderData.sections.length === 0) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('hwh_builder_course_')) {
            const raw = localStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed && parsed.sections && parsed.sections.length > 0) {
                if (parsed.courseId === courseId || key.includes(courseId)) {
                  builderData = parsed;
                  break;
                }
              }
            }
          }
        }
      }

      if (builderData && builderData.sections && builderData.sections.length > 0) {
        const mappedSections: Section[] = builderData.sections.map((bSec, index) => ({
          id: bSec.id,
          course_id: courseId,
          title: bSec.title,
          description: bSec.subtitle || null,
          display_order: index,
          is_locked: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
        return { data: mappedSections, error: null };
      }
    } catch (e) {
      console.warn('Builder service LocalStorage check for sections:', e);
    }

    // Fallback to Supabase database
    try {
      const { data, error } = await supabase
        .from('sections')
        .select('*')
        .eq('course_id', courseId)
        .order('display_order', { ascending: true });

      if (!error && data && data.length > 0) {
        return { data: data as Section[], error: null };
      }
    } catch (err: any) {
      console.warn('Supabase section query warning:', err);
    }

    return { data: [], error: null };
  },

  /**
   * Reorder multiple sections within a course by updating display_order for each item.
   */
  async reorderSections(
    courseId: string,
    items: SectionReorderItem[]
  ): Promise<{ data: Section[]; error: Error | null }> {
    try {
      const now = new Date().toISOString();
      const updates = items.map((item) =>
        supabase
          .from('sections')
          .update({ display_order: item.display_order, updated_at: now })
          .eq('id', item.id)
          .eq('course_id', courseId)
      );

      const results = await Promise.all(updates);

      const firstError = results.find((r) => r.error)?.error;
      if (firstError) {
        return { data: [], error: firstError };
      }

      // Re-fetch all sections after ordering update
      return await this.getSectionsByCourse(courseId);
    } catch (err: any) {
      return { data: [], error: err };
    }
  },
};

export default sectionService;
