import { supabase } from '../lib/supabase';
import { 
  SupabaseCourse, 
  CreateCourseInput, 
  UpdateCourseInput, 
  Course 
} from '../models/course';
import { INITIAL_COURSES } from '../data/initialCourses';
import { 
  getStoredCourses, 
  saveCourses, 
  markCourseAsDeleted, 
  isCourseDeleted, 
  deleteCourse as deleteStoredCourse 
} from '../utils/storage';
import { removeImageOverride } from '../utils/imageUtils';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUUID(val?: string | null): boolean {
  if (!val || typeof val !== 'string') return false;
  return UUID_REGEX.test(val.trim());
}

/**
 * Map a Supabase DB row to the legacy UI Course model for seamless UI rendering
 */
export function mapSupabaseToCourse(sc: SupabaseCourse): Course {
  const status = sc.status || 'published';
  const isPublished = status === 'published';
  const thumb = sc.thumbnail_url || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop';
  const banner = sc.banner_url || thumb;

  return {
    id: sc.id,
    slug: sc.slug,
    title: sc.title,
    name: sc.title,
    shortDescription: sc.short_description || '',
    fullDescription: sc.description || '',
    thumbnail: thumb,
    image: thumb,
    heroImage: banner,
    bannerImage: banner,
    previewVideo: sc.preview_video_url || '',
    modality: sc.category || 'Healing',
    category: (sc.category as any) || 'Healing',
    level: (sc.level as any) || 'All Levels',
    difficulty: (sc.level as any) || 'All Levels',
    mode: 'Online',
    language: sc.language || 'English',
    duration: sc.duration || '4 Weeks',
    price: sc.price || 0,
    discountPrice: sc.discount_price || undefined,
    originalPrice: sc.discount_price || undefined,
    currency: '$',
    instructor: sc.instructor_name || 'Heer',
    rating: 4.9,
    reviewsCount: 12,
    keyOutcomes: [],
    curriculum: [],
    isPublished,
    status: status as any,
    isFeatured: sc.is_featured ?? false,
    createdAt: sc.created_at || new Date().toISOString(),
  };
}

export const courseService = {
  // ==========================================
  // CORE SUPABASE SERVICE METHODS
  // ==========================================

  /**
   * Create a new course in Supabase.
   */
  async createCourse(
    courseData: CreateCourseInput
  ): Promise<{ data: SupabaseCourse | null; error: Error | null }> {
    try {
      let createdBy = courseData.created_by;
      if (!createdBy) {
        const { data: { user } } = await supabase.auth.getUser();
        createdBy = user?.id || null;
      }

      const payload = {
        ...courseData,
        created_by: createdBy,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('courses')
        .insert(payload)
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }
      return { data: data as SupabaseCourse, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  /**
   * Update an existing course by ID in Supabase.
   * Automatically maintains the updated_at timestamp.
   */
  async updateCourse(
    id: string,
    updates: UpdateCourseInput
  ): Promise<{ data: SupabaseCourse | null; error: Error | null }> {
    try {
      const payload = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('courses')
        .update(payload)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) {
        return { data: null, error };
      }
      return { data: data as SupabaseCourse | null, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  /**
   * Delete a course by ID (or slug) in Supabase and all local storage / memory caches.
   */
  async deleteCourse(id: string): Promise<{ error: Error | null }> {
    if (!id || typeof id !== 'string') {
      return { error: new Error('Course ID is required for deletion') };
    }

    const cleanId = id.trim();
    let courseSlug: string | undefined;
    let supabaseTargetId: string | null = isUUID(cleanId) ? cleanId : null;

    // 1. Try to find course locally to extract slug and any matching info
    try {
      const stored = getStoredCourses();
      const match = stored.find(c => c.id === cleanId || c.slug === cleanId);
      if (match) {
        courseSlug = match.slug;
      }
    } catch (e) {}

    if (!courseSlug) {
      try {
        const cached = localStorage.getItem('custom_courses_store');
        if (cached) {
          const list = JSON.parse(cached);
          const match = list.find((c: any) => c.id === cleanId || c.slug === cleanId);
          if (match?.slug) courseSlug = match.slug;
        }
      } catch (e) {}
    }

    // 2. If target is not a UUID, check if Supabase has a matching course by slug or ID
    if (!supabaseTargetId && courseSlug) {
      try {
        const { data: dbCourse } = await supabase
          .from('courses')
          .select('id')
          .eq('slug', courseSlug)
          .maybeSingle();
        if (dbCourse?.id && isUUID(dbCourse.id)) {
          supabaseTargetId = dbCourse.id;
        }
      } catch (e) {}
    }

    // 3. Mark course ID and slug as persistently deleted
    markCourseAsDeleted(cleanId, courseSlug, supabaseTargetId);

    // 4. Remove image overrides
    try {
      removeImageOverride(cleanId);
      if (supabaseTargetId) removeImageOverride(supabaseTargetId);
    } catch (e) {}

    // 5. Remove builder cache
    try {
      localStorage.removeItem('hwh_builder_course_' + cleanId);
      if (supabaseTargetId) localStorage.removeItem('hwh_builder_course_' + supabaseTargetId);
    } catch (e) {}

    // 6. Clean up custom_courses_store
    try {
      const cacheKey = 'custom_courses_store';
      const existing = localStorage.getItem(cacheKey);
      if (existing) {
        const list: Course[] = JSON.parse(existing);
        const filtered = list.filter((c) => c.id !== cleanId && c.id !== supabaseTargetId && (!courseSlug || c.slug !== courseSlug));
        localStorage.setItem(cacheKey, JSON.stringify(filtered));
      }
    } catch (e) {
      console.warn('Error removing course from custom_courses_store:', e);
    }

    // 7. Clean up storage.ts (heal_with_heer_courses_v2)
    try {
      deleteStoredCourse(cleanId);
      if (supabaseTargetId) deleteStoredCourse(supabaseTargetId);
    } catch (e) {
      console.warn('Error removing course from storage.ts:', e);
    }

    // 8. Clean up local enrollments and reviews
    try {
      const enrollKey = 'heal_with_heer_local_enrollments';
      const rawEnroll = localStorage.getItem(enrollKey);
      if (rawEnroll) {
        const enrolls = JSON.parse(rawEnroll);
        if (Array.isArray(enrolls)) {
          const filteredEnrolls = enrolls.filter((e: any) => e.course_id !== cleanId && e.course_id !== supabaseTargetId);
          localStorage.setItem(enrollKey, JSON.stringify(filteredEnrolls));
        }
      }
    } catch (e) {}

    try {
      const reviewKey = 'heal_with_heer_local_reviews';
      const rawReview = localStorage.getItem(reviewKey);
      if (rawReview) {
        const reviews = JSON.parse(rawReview);
        if (Array.isArray(reviews)) {
          const filteredReviews = reviews.filter((r: any) => r.course_id !== cleanId && r.course_id !== supabaseTargetId);
          localStorage.setItem(reviewKey, JSON.stringify(filteredReviews));
        }
      }
    } catch (e) {}

    // 9. If Supabase course exists, perform Supabase deletion with clean child record handling
    if (supabaseTargetId) {
      try {
        // Attempt to clean up dependent child records (non-blocking)
        try {
          await supabase.from('enrollments').delete().eq('course_id', supabaseTargetId);
        } catch (e) {}
        try {
          await supabase.from('course_reviews').delete().eq('course_id', supabaseTargetId);
        } catch (e) {}
        try {
          await supabase.from('announcements').delete().eq('course_id', supabaseTargetId);
        } catch (e) {}
        try {
          await supabase.from('certificates').delete().eq('course_id', supabaseTargetId);
        } catch (e) {}
        try {
          await supabase.from('sections').delete().eq('course_id', supabaseTargetId);
        } catch (e) {}

        const { error } = await supabase
          .from('courses')
          .delete()
          .eq('id', supabaseTargetId);

        if (error) {
          console.error('[courseService] Supabase delete error:', error);
          return { error: new Error(error.message || 'Failed to delete course from database') };
        }
      } catch (err: any) {
        console.error('[courseService] Exception during Supabase delete:', err);
        return { error: err instanceof Error ? err : new Error(String(err)) };
      }
    }

    return { error: null };
  },

  /**
   * Get a single course by its UUID ID.
   */
  async getCourse(id: string): Promise<{ data: SupabaseCourse | null; error: Error | null }> {
    if (isCourseDeleted(id)) {
      return { data: null, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      let result = data as SupabaseCourse | null;

      try {
        const cached = localStorage.getItem('custom_courses_store');
        if (cached) {
          const list = JSON.parse(cached);
          const match = list.find((c: any) => c.id === id);
          if (match) {
            result = {
              ...(result || {}),
              id: match.id,
              title: match.title || match.name || result?.title || '',
              slug: match.slug || result?.slug || '',
              short_description: match.shortDescription || result?.short_description || '',
              description: match.fullDescription || result?.description || '',
              thumbnail_url: match.thumbnail || match.image || result?.thumbnail_url || '',
              banner_url: match.bannerImage || match.heroImage || result?.banner_url || '',
              preview_video_url: match.previewVideo || match.preview_video_url || result?.preview_video_url || '',
              instructor_name: match.instructor || result?.instructor_name || 'Heer',
              category: match.category || result?.category || 'Healing',
              level: match.level || result?.level || 'All Levels',
              language: match.language || result?.language || 'English',
              duration: match.duration || result?.duration || '4 Weeks',
              price: match.price ?? result?.price ?? 0,
              discount_price: match.discountPrice ?? result?.discount_price ?? 0,
              status: match.status || (match.isPublished ? 'published' : 'draft') || result?.status || 'published',
              created_at: result?.created_at || match.createdAt || new Date().toISOString(),
            } as SupabaseCourse;
          }
        }
      } catch (e) {
        console.warn('Local storage cache lookup error:', e);
      }

      if (result && isCourseDeleted(result.id, result.slug)) {
        return { data: null, error: null };
      }

      return { data: result, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  /**
   * Get a single course by its unique URL slug.
   */
  async getCourseBySlug(slug: string): Promise<{ data: SupabaseCourse | null; error: Error | null }> {
    if (isCourseDeleted(undefined, slug)) {
      return { data: null, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      let result = data as SupabaseCourse | null;

      try {
        const cached = localStorage.getItem('custom_courses_store');
        if (cached) {
          const list = JSON.parse(cached);
          const match = list.find((c: any) => c.slug === slug || (result?.id && c.id === result.id));
          if (match) {
            result = {
              ...(result || {}),
              id: match.id || result?.id || `course-${slug}`,
              title: match.title || match.name || result?.title || '',
              slug: match.slug || slug,
              short_description: match.shortDescription || result?.short_description || '',
              description: match.fullDescription || result?.description || '',
              thumbnail_url: match.thumbnail || match.image || result?.thumbnail_url || '',
              banner_url: match.bannerImage || match.heroImage || result?.banner_url || '',
              preview_video_url: match.previewVideo || match.preview_video_url || result?.preview_video_url || '',
              instructor_name: match.instructor || result?.instructor_name || 'Heer',
              category: match.category || result?.category || 'Healing',
              level: match.level || result?.level || 'All Levels',
              language: match.language || result?.language || 'English',
              duration: match.duration || result?.duration || '4 Weeks',
              price: match.price ?? result?.price ?? 0,
              discount_price: match.discountPrice ?? result?.discount_price ?? 0,
              status: match.status || (match.isPublished ? 'published' : 'draft') || result?.status || 'published',
              created_at: result?.created_at || match.createdAt || new Date().toISOString(),
            } as SupabaseCourse;
          }
        }
      } catch (e) {
        console.warn('Local storage cache lookup error by slug:', e);
      }

      if (result && isCourseDeleted(result.id, result.slug)) {
        return { data: null, error: null };
      }

      return { data: result, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  /**
   * Get all published courses for public visitors / course catalog.
   */
  async getAllPublishedCourses(): Promise<{ data: SupabaseCourse[]; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('status', 'published')
        .order('display_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) {
        return { data: [], error };
      }
      return { data: (data as SupabaseCourse[]) || [], error: null };
    } catch (err: any) {
      return { data: [], error: err };
    }
  },

  /**
   * Get courses created by or belonging to the current authenticated user.
   */
  async getMyCourses(): Promise<{ data: SupabaseCourse[]; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: [], error: new Error('User not authenticated') };
      }

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: [], error };
      }
      return { data: (data as SupabaseCourse[]) || [], error: null };
    } catch (err: any) {
      return { data: [], error: err };
    }
  },

  // ==========================================
  // COMPATIBILITY HELPERS FOR EXISTING UI
  // ==========================================

  /**
   * Returns all courses formatted for the UI.
   */
  async getAllCourses(): Promise<Course[]> {
    let baseCourses: Course[] = [];
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        baseCourses = (data as SupabaseCourse[])
          .filter(sc => !isCourseDeleted(sc.id, sc.slug))
          .map(mapSupabaseToCourse);
      }
    } catch (err) {
      console.warn('Error fetching courses:', err);
    }

    const defaultAvailable = INITIAL_COURSES.filter(c => !isCourseDeleted(c.id, c.slug));
    if (baseCourses.length === 0 && defaultAvailable.length > 0) {
      baseCourses = defaultAvailable;
    }

    // Merge from custom_courses_store
    try {
      const cached = localStorage.getItem('custom_courses_store');
      if (cached) {
        const localList: Course[] = JSON.parse(cached);
        if (Array.isArray(localList)) {
          localList
            .filter(lc => !isCourseDeleted(lc.id, lc.slug))
            .forEach((localCourse) => {
              const index = baseCourses.findIndex((bc) => bc.id === localCourse.id || bc.slug === localCourse.slug);
              if (index >= 0) {
                baseCourses[index] = { ...baseCourses[index], ...localCourse };
              } else {
                baseCourses.unshift(localCourse);
              }
            });
        }
      }
    } catch (e) {
      console.warn('Error merging local course cache in getAllCourses:', e);
    }

    // Merge from getStoredCourses() (heal_with_heer_courses_v2)
    try {
      const stored = getStoredCourses();
      if (Array.isArray(stored)) {
        stored
          .filter(sc => !isCourseDeleted(sc.id, sc.slug))
          .forEach((storedCourse) => {
            const index = baseCourses.findIndex((bc) => bc.id === storedCourse.id || bc.slug === storedCourse.slug);
            if (index >= 0) {
              baseCourses[index] = { ...baseCourses[index], ...storedCourse };
            } else {
              baseCourses.unshift(storedCourse);
            }
          });
      }
    } catch (e) {
      console.warn('Error merging getStoredCourses in getAllCourses:', e);
    }

    // Final safety check against deleted course IDs/slugs
    return baseCourses.filter(c => !isCourseDeleted(c.id, c.slug));
  },

  /**
   * Returns only published courses for public catalog.
   */
  async getPublishedCourses(): Promise<Course[]> {
    const all = await this.getAllCourses();
    return all.filter((c) => (c.isPublished || c.status === 'published') && !isCourseDeleted(c.id, c.slug));
  },

  async getCoursesByModality(modality: string): Promise<Course[]> {
    const all = await this.getAllCourses();
    if (!modality || modality.toLowerCase() === 'all') return all;
    return all.filter(
      (c) =>
        c.modality?.toLowerCase().includes(modality.toLowerCase()) ||
        c.category?.toLowerCase().includes(modality.toLowerCase())
    );
  },

  async saveCourse(course: Partial<Course>): Promise<Course> {
    const title = course.title || course.name || 'Untitled Course';
    const slug = course.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const isPub = course.isPublished ?? (course.status === 'published' || course.status === undefined);
    const status = course.status || (isPub ? 'published' : 'draft');

    const input: CreateCourseInput = {
      title,
      slug,
      short_description: course.shortDescription || '',
      description: course.fullDescription || '',
      thumbnail_url: course.thumbnail || course.image || '',
      banner_url: course.bannerImage || course.heroImage || '',
      preview_video_url: course.previewVideo || (course as any).preview_video_url || '',
      instructor_name: typeof course.instructor === 'string' ? course.instructor : course.instructor?.name || 'Heer',
      category: course.category || 'Healing',
      level: course.level || course.difficulty || 'Beginner',
      language: course.language || 'English',
      duration: course.duration || '4 Weeks',
      price: course.price || 0,
      discount_price: course.discountPrice || course.originalPrice || 0,
      status,
      is_featured: course.isFeatured ?? false,
      published_at: status === 'published' ? new Date().toISOString() : null,
    };

    let resultCourse: Course | null = null;

    if (course.id) {
      const res = await this.updateCourse(course.id, input);
      if (res.data) {
        resultCourse = mapSupabaseToCourse(res.data);
      }
    } else {
      const res = await this.createCourse(input);
      if (res.data) {
        resultCourse = mapSupabaseToCourse(res.data);
      }
    }

    if (!resultCourse) {
      const thumb = course.thumbnail || course.image || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop';
      const banner = course.bannerImage || course.heroImage || thumb;
      resultCourse = {
        id: course.id || `course-${Date.now()}`,
        name: title,
        title,
        slug,
        shortDescription: course.shortDescription || '',
        fullDescription: course.fullDescription || '',
        thumbnail: thumb,
        image: thumb,
        heroImage: banner,
        bannerImage: banner,
        previewVideo: course.previewVideo || (course as any).preview_video_url || '',
        modality: course.category || 'Healing',
        category: (course.category as any) || 'Healing',
        level: (course.level as any) || 'Beginner',
        difficulty: (course.level as any) || 'Beginner',
        mode: 'Online',
        language: course.language || 'English',
        duration: course.duration || '4 Weeks',
        price: course.price || 0,
        currency: '$',
        instructor: typeof course.instructor === 'string' ? course.instructor : course.instructor?.name || 'Heer',
        rating: 5.0,
        reviewsCount: 0,
        keyOutcomes: course.keyOutcomes || [],
        curriculum: course.curriculum || [],
        isPublished: isPub,
        status: status,
        isFeatured: course.isFeatured ?? false,
        createdAt: new Date().toISOString(),
        ...course,
      } as Course;
    }

    // Ensure isPublished and status are explicit
    resultCourse.isPublished = isPub;
    resultCourse.status = status;

    // 1. Always persist to custom_courses_store
    try {
      const cacheKey = 'custom_courses_store';
      const existing = localStorage.getItem(cacheKey);
      let list: Course[] = existing ? JSON.parse(existing) : [];
      const idx = list.findIndex((c) => c.id === resultCourse!.id || c.slug === resultCourse!.slug);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...resultCourse };
      } else {
        list.unshift(resultCourse);
      }
      localStorage.setItem(cacheKey, JSON.stringify(list));
    } catch (e) {
      console.warn('Local courses cache save error:', e);
    }

    // 2. Always sync to storage.ts (heal_with_heer_courses_v2)
    try {
      const currentStored = getStoredCourses();
      const idx = currentStored.findIndex(c => c.id === resultCourse!.id || c.slug === resultCourse!.slug);
      let updatedStored = [...currentStored];
      if (idx >= 0) {
        updatedStored[idx] = { ...updatedStored[idx], ...resultCourse };
      } else {
        updatedStored.unshift(resultCourse);
      }
      saveCourses(updatedStored);
    } catch (e) {
      console.warn('Storage.ts sync error:', e);
    }

    return resultCourse;
  },

  async duplicateCourse(id: string): Promise<Course | null> {
    const dbRes = await this.getCourse(id);
    if (dbRes.data) {
      const newCourse = await this.createCourse({
        ...dbRes.data,
        title: `${dbRes.data.title} (Copy)`,
        slug: `${dbRes.data.slug}-copy-${Date.now()}`,
        status: 'draft',
        published_at: null,
      });
      if (newCourse.data) return mapSupabaseToCourse(newCourse.data);
    }
    return null;
  },

  async archiveCourse(id: string): Promise<boolean> {
    const res = await this.updateCourse(id, { status: 'archived' });
    return !res.error;
  },

  async unarchiveCourse(id: string): Promise<boolean> {
    const res = await this.updateCourse(id, { status: 'published', published_at: new Date().toISOString() });
    return !res.error;
  },

  async bulkPublish(ids: string[]): Promise<boolean> {
    const now = new Date().toISOString();
    await Promise.all(ids.map((id) => this.updateCourse(id, { status: 'published', published_at: now })));
    return true;
  },

  async bulkArchive(ids: string[]): Promise<boolean> {
    await Promise.all(ids.map((id) => this.updateCourse(id, { status: 'archived' })));
    return true;
  },

  async bulkDelete(ids: string[]): Promise<boolean> {
    await Promise.all(ids.map((id) => this.deleteCourse(id)));
    return true;
  },

  async bulkChangeCategory(ids: string[], category: string): Promise<boolean> {
    await Promise.all(ids.map((id) => this.updateCourse(id, { category })));
    return true;
  },
};

export default courseService;
