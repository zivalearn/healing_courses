import { supabase } from '../lib/supabase';
import {
  LessonBlock,
  CreateLessonBlockInput,
  UpdateLessonBlockInput,
  LessonBlockReorderItem,
} from '../models/lessonBlock';

export const lessonBlockService = {
  /**
   * Create a new lesson block inside a lesson.
   */
  async createBlock(
    blockData: CreateLessonBlockInput
  ): Promise<{ data: LessonBlock | null; error: Error | null }> {
    try {
      const payload = {
        ...blockData,
        metadata: blockData.metadata ?? {},
        display_order: blockData.display_order ?? 0,
        is_required: blockData.is_required ?? false,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('lesson_blocks')
        .insert(payload)
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }
      return { data: data as LessonBlock, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  /**
   * Update an existing lesson block by ID.
   * Automatically maintains the updated_at timestamp.
   */
  async updateBlock(
    id: string,
    updates: UpdateLessonBlockInput
  ): Promise<{ data: LessonBlock | null; error: Error | null }> {
    try {
      const payload = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('lesson_blocks')
        .update(payload)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) {
        return { data: null, error };
      }
      return { data: data as LessonBlock | null, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  /**
   * Delete a lesson block by ID.
   */
  async deleteBlock(id: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('lesson_blocks')
        .delete()
        .eq('id', id);

      return { error };
    } catch (err: any) {
      return { error: err };
    }
  },

  /**
   * Fetch all lesson blocks belonging to a specific lesson, ordered by display_order ascending.
   * Falls back to Course Builder data in LocalStorage if database query is empty.
   */
  async getBlocksByLesson(
    lessonId: string,
    courseId?: string
  ): Promise<{ data: LessonBlock[]; error: Error | null }> {
    // Check LocalStorage builder data first so Course Builder media uploads take immediate effect
    try {
      // Helper function to map raw builder block to LessonBlock
      const mapRawBlocks = (rawBlocks: any[]): LessonBlock[] => {
        return rawBlocks.map((bBlk: any, index: number) => {
          const contentObj = typeof bBlk.content === 'object' && bBlk.content ? bBlk.content : {};
          const mediaUrl =
            bBlk.media_url ||
            contentObj.url ||
            contentObj.secure_url ||
            contentObj.videoUrl ||
            contentObj.video_url ||
            contentObj.video?.secure_url ||
            contentObj.video?.url ||
            contentObj.media?.secure_url ||
            contentObj.media?.url ||
            (typeof contentObj.media === 'string' ? contentObj.media : null) ||
            contentObj.asset?.secure_url ||
            contentObj.asset?.url ||
            contentObj.meditationAudioUrl ||
            contentObj.audioUrl ||
            contentObj.worksheetFileUrl ||
            contentObj.fileUrl ||
            contentObj.embedUrl ||
            null;

          const textContent =
            typeof bBlk.content === 'string'
              ? bBlk.content
              : contentObj.text ||
                contentObj.prompt ||
                contentObj.affirmationText ||
                contentObj.meditationInstructions ||
                contentObj.exerciseInstructions ||
                contentObj.assignmentInstructions ||
                contentObj.completionMessage ||
                contentObj.caption ||
                null;

          return {
            id: bBlk.id,
            lesson_id: lessonId,
            course_id: courseId || bBlk.course_id || undefined,
            type: bBlk.type || 'paragraph',
            title: bBlk.title || contentObj.title || contentObj.caption || contentObj.quizTitle || null,
            content: textContent,
            media_url: mediaUrl,
            metadata: contentObj,
            display_order: index,
            is_required: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        });
      };

      // 1. If courseId provided, check that specific key first
      if (courseId) {
        const primaryKey = 'hwh_builder_course_' + courseId;
        const raw = localStorage.getItem(primaryKey);
        if (raw) {
          const builderData = JSON.parse(raw);
          for (const sec of builderData.sections || []) {
            const foundLes = sec.lessons?.find((l: any) => l.id === lessonId);
            if (foundLes && foundLes.blocks) {
              return { data: mapRawBlocks(foundLes.blocks), error: null };
            }
          }
        }
      }

      // 2. Scan all builder keys if courseId key wasn't matched
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('hwh_builder_course_')) {
          // Skip if we already checked this specific course key above
          if (courseId && key === 'hwh_builder_course_' + courseId) continue;

          const raw = localStorage.getItem(key);
          if (raw) {
            const builderData = JSON.parse(raw);
            for (const sec of builderData.sections || []) {
              const foundLes = sec.lessons?.find((l: any) => l.id === lessonId);
              if (foundLes && foundLes.blocks) {
                return { data: mapRawBlocks(foundLes.blocks), error: null };
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('Builder service LocalStorage check for blocks:', e);
    }

    // Fallback to Supabase database
    try {
      const { data, error } = await supabase
        .from('lesson_blocks')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('display_order', { ascending: true });

      if (!error && data && data.length > 0) {
        return { data: data as LessonBlock[], error: null };
      }
    } catch (err: any) {
      console.warn('Supabase block query warning:', err);
    }

    return { data: [], error: null };
  },

  /**
   * Reorder multiple blocks within a lesson by updating display_order for each item.
   */
  async reorderBlocks(
    lessonId: string,
    items: LessonBlockReorderItem[]
  ): Promise<{ data: LessonBlock[]; error: Error | null }> {
    try {
      const now = new Date().toISOString();
      const updates = items.map((item) =>
        supabase
          .from('lesson_blocks')
          .update({ display_order: item.display_order, updated_at: now })
          .eq('id', item.id)
          .eq('lesson_id', lessonId)
      );

      const results = await Promise.all(updates);

      const firstError = results.find((r) => r.error)?.error;
      if (firstError) {
        return { data: [], error: firstError };
      }

      // Re-fetch all blocks after ordering update
      return await this.getBlocksByLesson(lessonId);
    } catch (err: any) {
      return { data: [], error: err };
    }
  },
};

export default lessonBlockService;
