-- Migration: Create courses table with Row Level Security (RLS) and updated_at trigger

CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  short_description TEXT,
  description TEXT,
  thumbnail_url TEXT,
  banner_url TEXT,
  instructor_name TEXT,
  category TEXT,
  level TEXT,
  language TEXT,
  duration TEXT,
  price NUMERIC,
  discount_price NUMERIC,
  is_published BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- RLS Policies:
-- 1. Everyone (public/guests) can view published courses
CREATE POLICY "Anyone can view published courses"
  ON public.courses
  FOR SELECT
  USING (is_published = TRUE);

-- 2. Authenticated users can view their own created courses (published or draft)
CREATE POLICY "Users can view own created courses"
  ON public.courses
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- 3. Authenticated admins can view all courses
CREATE POLICY "Admins can view all courses"
  ON public.courses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 4. Authenticated users can create courses
CREATE POLICY "Authenticated users can create courses"
  ON public.courses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

-- 5. Creators or Admins can update their courses
CREATE POLICY "Creators or admins can update courses"
  ON public.courses
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 6. Creators or Admins can delete their courses
CREATE POLICY "Creators or admins can delete courses"
  ON public.courses
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Trigger to automatically update updated_at timestamp on row update
CREATE OR REPLACE FUNCTION public.handle_courses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_courses_updated ON public.courses;
CREATE TRIGGER on_courses_updated
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.handle_courses_updated_at();
