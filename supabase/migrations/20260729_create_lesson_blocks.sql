-- Migration: Create lesson_blocks table with RLS and updated_at trigger

CREATE TABLE IF NOT EXISTS public.lesson_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT,
  content TEXT,
  media_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup by lesson_id and display_order
CREATE INDEX IF NOT EXISTS idx_lesson_blocks_lesson_id_order ON public.lesson_blocks (lesson_id, display_order ASC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.lesson_blocks ENABLE ROW LEVEL SECURITY;

-- 1. Everyone can view blocks belonging to published courses
CREATE POLICY "Anyone can view blocks of published courses"
  ON public.lesson_blocks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      JOIN public.sections ON sections.id = lessons.section_id
      JOIN public.courses ON courses.id = sections.course_id
      WHERE lessons.id = lesson_blocks.lesson_id
        AND courses.status = 'published'
    )
  );

-- 2. Authenticated course creators or admins can view all blocks of their lessons
CREATE POLICY "Creators or admins can view course lesson blocks"
  ON public.lesson_blocks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      JOIN public.sections ON sections.id = lessons.section_id
      JOIN public.courses ON courses.id = sections.course_id
      WHERE lessons.id = lesson_blocks.lesson_id
        AND (courses.created_by = auth.uid() OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        ))
    )
  );

-- 3. Course creators or admins can insert lesson blocks
CREATE POLICY "Creators or admins can create lesson blocks"
  ON public.lesson_blocks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lessons
      JOIN public.sections ON sections.id = lessons.section_id
      JOIN public.courses ON courses.id = sections.course_id
      WHERE lessons.id = lesson_blocks.lesson_id
        AND (courses.created_by = auth.uid() OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        ))
    )
  );

-- 4. Course creators or admins can update lesson blocks
CREATE POLICY "Creators or admins can update lesson blocks"
  ON public.lesson_blocks
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      JOIN public.sections ON sections.id = lessons.section_id
      JOIN public.courses ON courses.id = sections.course_id
      WHERE lessons.id = lesson_blocks.lesson_id
        AND (courses.created_by = auth.uid() OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        ))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lessons
      JOIN public.sections ON sections.id = lessons.section_id
      JOIN public.courses ON courses.id = sections.course_id
      WHERE lessons.id = lesson_blocks.lesson_id
        AND (courses.created_by = auth.uid() OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        ))
    )
  );

-- 5. Course creators or admins can delete lesson blocks
CREATE POLICY "Creators or admins can delete lesson blocks"
  ON public.lesson_blocks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      JOIN public.sections ON sections.id = lessons.section_id
      JOIN public.courses ON courses.id = sections.course_id
      WHERE lessons.id = lesson_blocks.lesson_id
        AND (courses.created_by = auth.uid() OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        ))
    )
  );

-- Trigger to automatically update updated_at timestamp on lesson_blocks update
CREATE OR REPLACE FUNCTION public.handle_lesson_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_lesson_blocks_updated ON public.lesson_blocks;
CREATE TRIGGER on_lesson_blocks_updated
  BEFORE UPDATE ON public.lesson_blocks
  FOR EACH ROW EXECUTE FUNCTION public.handle_lesson_blocks_updated_at();
