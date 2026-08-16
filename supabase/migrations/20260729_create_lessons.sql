-- Migration: Create lessons table with RLS and updated_at trigger

CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  estimated_duration INTEGER DEFAULT 0,
  is_preview BOOLEAN NOT NULL DEFAULT FALSE,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup by section_id and display_order
CREATE INDEX IF NOT EXISTS idx_lessons_section_id_order ON public.lessons (section_id, display_order ASC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- 1. Everyone can view lessons belonging to published courses
CREATE POLICY "Anyone can view lessons of published courses"
  ON public.lessons
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sections
      JOIN public.courses ON courses.id = sections.course_id
      WHERE sections.id = lessons.section_id
        AND courses.status = 'published'
    )
  );

-- 2. Authenticated course creators or admins can view all lessons of their sections
CREATE POLICY "Creators or admins can view course lessons"
  ON public.lessons
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sections
      JOIN public.courses ON courses.id = sections.course_id
      WHERE sections.id = lessons.section_id
        AND (courses.created_by = auth.uid() OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        ))
    )
  );

-- 3. Course creators or admins can insert lessons
CREATE POLICY "Creators or admins can create lessons"
  ON public.lessons
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sections
      JOIN public.courses ON courses.id = sections.course_id
      WHERE sections.id = lessons.section_id
        AND (courses.created_by = auth.uid() OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        ))
    )
  );

-- 4. Course creators or admins can update lessons
CREATE POLICY "Creators or admins can update lessons"
  ON public.lessons
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sections
      JOIN public.courses ON courses.id = sections.course_id
      WHERE sections.id = lessons.section_id
        AND (courses.created_by = auth.uid() OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        ))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sections
      JOIN public.courses ON courses.id = sections.course_id
      WHERE sections.id = lessons.section_id
        AND (courses.created_by = auth.uid() OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        ))
    )
  );

-- 5. Course creators or admins can delete lessons
CREATE POLICY "Creators or admins can delete lessons"
  ON public.lessons
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sections
      JOIN public.courses ON courses.id = sections.course_id
      WHERE sections.id = lessons.section_id
        AND (courses.created_by = auth.uid() OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        ))
    )
  );

-- Trigger to automatically update updated_at timestamp on lesson update
CREATE OR REPLACE FUNCTION public.handle_lessons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_lessons_updated ON public.lessons;
CREATE TRIGGER on_lessons_updated
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.handle_lessons_updated_at();
