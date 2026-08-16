-- Migration: Create sections table with RLS and updated_at trigger

CREATE TABLE IF NOT EXISTS public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup by course_id and display_order
CREATE INDEX IF NOT EXISTS idx_sections_course_id_order ON public.sections (course_id, display_order ASC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

-- 1. Everyone can view sections belonging to published courses
CREATE POLICY "Anyone can view sections of published courses"
  ON public.sections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = sections.course_id
        AND courses.status = 'published'
    )
  );

-- 2. Authenticated course creators or admins can view all sections of their courses
CREATE POLICY "Creators or admins can view course sections"
  ON public.sections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = sections.course_id
        AND (courses.created_by = auth.uid() OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        ))
    )
  );

-- 3. Course creators or admins can insert sections
CREATE POLICY "Creators or admins can create sections"
  ON public.sections
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = sections.course_id
        AND (courses.created_by = auth.uid() OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        ))
    )
  );

-- 4. Course creators or admins can update sections
CREATE POLICY "Creators or admins can update sections"
  ON public.sections
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = sections.course_id
        AND (courses.created_by = auth.uid() OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        ))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = sections.course_id
        AND (courses.created_by = auth.uid() OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        ))
    )
  );

-- 5. Course creators or admins can delete sections
CREATE POLICY "Creators or admins can delete sections"
  ON public.sections
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = sections.course_id
        AND (courses.created_by = auth.uid() OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        ))
    )
  );

-- Trigger to automatically update updated_at timestamp on section update
CREATE OR REPLACE FUNCTION public.handle_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_sections_updated ON public.sections;
CREATE TRIGGER on_sections_updated
  BEFORE UPDATE ON public.sections
  FOR EACH ROW EXECUTE FUNCTION public.handle_sections_updated_at();
