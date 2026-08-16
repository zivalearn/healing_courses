import { ZivaCourse, ZivaSection, ZivaLesson, ZivaLessonBlock } from '../types';
import { INITIAL_ZIVA_COURSES } from '../data/initialZivaCourses';
import { zivaSupabase, isZivaSupabaseConfigured } from '../lib/supabase';

const ZIVA_COURSES_KEY = 'ziva_courses';

export const zivaCourseService = {
  getStoredCourses(): ZivaCourse[] {
    try {
      const raw = localStorage.getItem(ZIVA_COURSES_KEY);
      if (!raw) {
        localStorage.setItem(ZIVA_COURSES_KEY, JSON.stringify(INITIAL_ZIVA_COURSES));
        return INITIAL_ZIVA_COURSES;
      }
      return JSON.parse(raw);
    } catch {
      return INITIAL_ZIVA_COURSES;
    }
  },

  saveCoursesLocally(courses: ZivaCourse[]): void {
    try {
      localStorage.setItem(ZIVA_COURSES_KEY, JSON.stringify(courses));
    } catch (err) {
      console.error('Failed to save Ziva courses locally:', err);
    }
  },

  async getAllCourses(): Promise<ZivaCourse[]> {
    if (isZivaSupabaseConfigured && zivaSupabase) {
      try {
        const { data, error } = await zivaSupabase
          .from('ziva_courses')
          .select('*, ziva_sections(*, ziva_lessons(*, ziva_lesson_blocks(*)))')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data as ZivaCourse[];
        }
      } catch (err) {
        console.warn('Ziva Supabase query failed, falling back to LocalStorage:', err);
      }
    }
    return this.getStoredCourses();
  },

  async getCourseByIdOrSlug(idOrSlug: string): Promise<ZivaCourse | null> {
    // Check local builder cache first for live Course Builder edits
    const localCourses = this.getStoredCourses();
    let course = localCourses.find(c => c.id === idOrSlug || c.slug === idOrSlug) || null;

    if (course) {
      const builderKey = `ziva_builder_course_${course.id}`;
      const builderRaw = localStorage.getItem(builderKey);
      if (builderRaw) {
        try {
          const builderData = JSON.parse(builderRaw);
          return {
            ...course,
            ...builderData,
            sections: builderData.sections || course.sections || [],
          };
        } catch {
          // fallback
        }
      }
      return course;
    }

    if (isZivaSupabaseConfigured && zivaSupabase) {
      try {
        const { data } = await zivaSupabase
          .from('ziva_courses')
          .select('*, ziva_sections(*, ziva_lessons(*, ziva_lesson_blocks(*)))')
          .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
          .single();

        if (data) return data as ZivaCourse;
      } catch (err) {
        console.warn('Ziva Supabase course fetch failed:', err);
      }
    }

    return null;
  },

  async saveCourse(courseData: Partial<ZivaCourse>): Promise<ZivaCourse> {
    const courses = this.getStoredCourses();
    const existingIndex = courses.findIndex(c => c.id === courseData.id);

    const now = new Date().toISOString();
    let savedCourse: ZivaCourse;

    if (existingIndex >= 0) {
      savedCourse = {
        ...courses[existingIndex],
        ...courseData,
        updatedAt: now,
      } as ZivaCourse;
      courses[existingIndex] = savedCourse;
    } else {
      savedCourse = {
        id: courseData.id || `ziva-course-${Date.now()}`,
        slug: courseData.slug || (courseData.title || 'course').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        title: courseData.title || courseData.name || 'Untitled Ziva Course',
        name: courseData.title || courseData.name || 'Untitled Ziva Course',
        tagline: courseData.tagline || '',
        shortDescription: courseData.shortDescription || '',
        fullDescription: courseData.fullDescription || '',
        category: courseData.category || 'Confidence',
        level: courseData.level || 'All Levels',
        mode: courseData.mode || 'Executive Masterclass',
        language: courseData.language || 'English & Hindi',
        price: courseData.price ?? 199,
        salePrice: courseData.salePrice,
        currency: courseData.currency || '$',
        duration: courseData.duration || '5 Hours',
        thumbnailUrl: courseData.thumbnailUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1000',
        bannerUrl: courseData.bannerUrl || 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&q=80&w=1200',
        promoVideoUrl: courseData.promoVideoUrl || '',
        promoVideoPoster: courseData.promoVideoPoster || '',
        instructorName: courseData.instructorName || 'Meharr',
        instructorTitle: courseData.instructorTitle || 'National Level Speaker & Creative Expression Coach',
        instructorAvatar: courseData.instructorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
        instructorBio: courseData.instructorBio || 'Celebrated executive coach and national level speaker guiding leaders worldwide.',
        certificationName: courseData.certificationName || 'Accredited Ziva Executive Leadership Certificate',
        isPublished: courseData.isPublished ?? true,
        isFeatured: courseData.isFeatured ?? false,
        enrolmentOpen: courseData.enrolmentOpen ?? true,
        upcomingBatchDate: courseData.upcomingBatchDate || '1st of Next Month',
        keyOutcomes: courseData.keyOutcomes || ['Master unshakeable confidence and vocal resonance'],
        requirements: courseData.requirements || ['Open to all ambitious professionals and leaders'],
        tags: courseData.tags || ['Confidence', 'Public Speaking', 'Executive Presence'],
        sections: courseData.sections || [],
        metaTitle: courseData.metaTitle || '',
        metaDescription: courseData.metaDescription || '',
        createdAt: now,
        updatedAt: now,
      };
      courses.unshift(savedCourse);
    }

    this.saveCoursesLocally(courses);

    // Save to Builder key as well
    localStorage.setItem(`ziva_builder_course_${savedCourse.id}`, JSON.stringify(savedCourse));

    if (isZivaSupabaseConfigured && zivaSupabase) {
      try {
        await zivaSupabase.from('ziva_courses').upsert({
          id: savedCourse.id,
          slug: savedCourse.slug,
          title: savedCourse.title,
          short_description: savedCourse.shortDescription,
          full_description: savedCourse.fullDescription,
          category: savedCourse.category,
          level: savedCourse.level,
          price: savedCourse.price,
          sale_price: savedCourse.salePrice,
          duration: savedCourse.duration,
          thumbnail_url: savedCourse.thumbnailUrl,
          promo_video_url: savedCourse.promoVideoUrl,
          instructor_name: savedCourse.instructorName,
          instructor_title: savedCourse.instructorTitle,
          instructor_avatar: savedCourse.instructorAvatar,
          is_published: savedCourse.isPublished,
          is_featured: savedCourse.isFeatured,
          key_outcomes: savedCourse.keyOutcomes,
          updated_at: now,
        });
      } catch (err) {
        console.warn('Failed to sync Ziva course to Supabase:', err);
      }
    }

    return savedCourse;
  },

  async deleteCourse(id: string): Promise<boolean> {
    const courses = this.getStoredCourses().filter(c => c.id !== id);
    this.saveCoursesLocally(courses);
    localStorage.removeItem(`ziva_builder_course_${id}`);

    if (isZivaSupabaseConfigured && zivaSupabase) {
      try {
        await zivaSupabase.from('ziva_courses').delete().eq('id', id);
      } catch (err) {
        console.warn('Failed to delete Ziva course from Supabase:', err);
      }
    }

    return true;
  },

  async duplicateCourse(id: string): Promise<ZivaCourse | null> {
    const original = await this.getCourseByIdOrSlug(id);
    if (!original) return null;

    const newId = `ziva-course-${Date.now()}`;
    const newTitle = `${original.title} (Copy)`;
    const newSlug = `${original.slug}-copy-${Date.now().toString().slice(-4)}`;

    const duplicated: ZivaCourse = {
      ...original,
      id: newId,
      title: newTitle,
      slug: newSlug,
      isPublished: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sections: JSON.parse(JSON.stringify(original.sections || [])),
    };

    return this.saveCourse(duplicated);
  },

  async saveCourseBuilderData(courseId: string, builderData: any): Promise<void> {
    localStorage.setItem(`ziva_builder_course_${courseId}`, JSON.stringify(builderData));

    // Update root courses list
    const courses = this.getStoredCourses();
    const idx = courses.findIndex(c => c.id === courseId);
    if (idx >= 0) {
      courses[idx] = {
        ...courses[idx],
        ...builderData,
        sections: builderData.sections || courses[idx].sections,
        updatedAt: new Date().toISOString(),
      };
      this.saveCoursesLocally(courses);
    }
  }
};
