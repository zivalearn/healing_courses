export type LessonBlockType =
  | 'heading'
  | 'paragraph'
  | 'image'
  | 'gallery'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'download'
  | 'quote'
  | 'divider'
  | 'callout'
  | 'accordion'
  | 'button'
  | 'quiz'
  | 'reflection'
  | 'journal'
  | 'affirmation'
  | 'assignment'
  | 'checklist'
  | 'embed';

export interface LessonBlock {
  id: string;
  lesson_id: string;
  type: LessonBlockType | string;
  title?: string | null;
  content?: string | null;
  media_url?: string | null;
  metadata?: Record<string, any> | null;
  display_order: number;
  is_required: boolean;
  created_at?: string;
  updated_at?: string;
}

export type CreateLessonBlockInput = Omit<
  LessonBlock,
  'id' | 'created_at' | 'updated_at'
> & {
  id?: string;
};

export type UpdateLessonBlockInput = Partial<
  Omit<LessonBlock, 'id' | 'lesson_id' | 'created_at' | 'updated_at'>
>;

export interface LessonBlockReorderItem {
  id: string;
  display_order: number;
}
