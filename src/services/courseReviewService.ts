import { supabase } from '../lib/supabase';
import {
  CourseReview,
  CreateCourseReviewInput,
  UpdateCourseReviewInput,
  RatingDistribution,
} from '../types/courseReview';

/**
 * Create a new course review.
 */
export async function createReview(
  reviewData: CreateCourseReviewInput
): Promise<{ data: CourseReview | null; error: Error | null }> {
  try {
    const now = new Date().toISOString();
    const payload = {
      ...reviewData,
      rating: Math.min(5, Math.max(1, reviewData.rating)),
      is_published: reviewData.is_published ?? true,
      is_featured: reviewData.is_featured ?? false,
      is_verified: reviewData.is_verified ?? false,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('course_reviews')
      .insert(payload)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }
    return { data: data as CourseReview, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Update an existing course review by ID.
 */
export async function updateReview(
  id: string,
  updates: UpdateCourseReviewInput
): Promise<{ data: CourseReview | null; error: Error | null }> {
  try {
    const payload: Record<string, any> = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (updates.rating !== undefined) {
      payload.rating = Math.min(5, Math.max(1, updates.rating));
    }

    const { data, error } = await supabase
      .from('course_reviews')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      return { data: null, error };
    }
    return { data: data as CourseReview | null, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Delete a course review by ID.
 */
export async function deleteReview(
  id: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('course_reviews')
      .delete()
      .eq('id', id);

    return { error };
  } catch (err: any) {
    return { error: err };
  }
}

/**
 * Get all reviews for a given course ID.
 * Defaults to fetching only published reviews unless publishedOnly is set to false.
 */
export async function getCourseReviews(
  courseId: string,
  options?: { publishedOnly?: boolean }
): Promise<{ data: CourseReview[]; error: Error | null }> {
  try {
    let query = supabase
      .from('course_reviews')
      .select('*')
      .eq('course_id', courseId);

    const publishedOnly = options?.publishedOnly ?? true;
    if (publishedOnly) {
      query = query.eq('is_published', true);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return { data: [], error };
    }
    return { data: (data as CourseReview[]) || [], error: null };
  } catch (err: any) {
    return { data: [], error: err };
  }
}

/**
 * Fetch a specific user's review for a given course.
 */
export async function getUserReview(
  userId: string,
  courseId: string
): Promise<{ data: CourseReview | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('course_reviews')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (error) {
      return { data: null, error };
    }
    return { data: data as CourseReview | null, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Add or update an instructor's reply to a review.
 */
export async function replyToReview(
  id: string,
  reply: string
): Promise<{ data: CourseReview | null; error: Error | null }> {
  const now = new Date().toISOString();
  return updateReview(id, {
    instructor_reply: reply,
    replied_at: now,
  });
}

/**
 * Toggle or set whether a review is featured.
 */
export async function featureReview(
  id: string,
  isFeatured: boolean = true
): Promise<{ data: CourseReview | null; error: Error | null }> {
  return updateReview(id, {
    is_featured: isFeatured,
  });
}

/**
 * Toggle or set whether a review is published.
 */
export async function publishReview(
  id: string,
  isPublished: boolean = true
): Promise<{ data: CourseReview | null; error: Error | null }> {
  return updateReview(id, {
    is_published: isPublished,
  });
}

/**
 * Calculate the average rating and total count of published reviews for a course.
 */
export async function getAverageRating(
  courseId: string
): Promise<{ average: number; count: number; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('course_reviews')
      .select('rating')
      .eq('course_id', courseId)
      .eq('is_published', true);

    if (error) {
      return { average: 0, count: 0, error };
    }

    if (!data || data.length === 0) {
      return { average: 0, count: 0, error: null };
    }

    const totalRating = data.reduce((sum, item) => sum + (item.rating || 0), 0);
    const count = data.length;
    const average = Math.round((totalRating / count) * 100) / 100;

    return { average, count, error: null };
  } catch (err: any) {
    return { average: 0, count: 0, error: err };
  }
}

/**
 * Calculate rating distribution (1-5 stars) for published reviews of a course.
 */
export async function getRatingDistribution(
  courseId: string
): Promise<{ distribution: RatingDistribution; error: Error | null }> {
  const initialDistribution: RatingDistribution = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    total: 0,
  };

  try {
    const { data, error } = await supabase
      .from('course_reviews')
      .select('rating')
      .eq('course_id', courseId)
      .eq('is_published', true);

    if (error) {
      return { distribution: initialDistribution, error };
    }

    if (!data) {
      return { distribution: initialDistribution, error: null };
    }

    const distribution: RatingDistribution = { ...initialDistribution };
    data.forEach((item) => {
      const r = item.rating as 1 | 2 | 3 | 4 | 5;
      if (r >= 1 && r <= 5) {
        distribution[r] = (distribution[r] || 0) + 1;
        distribution.total += 1;
      }
    });

    return { distribution, error: null };
  } catch (err: any) {
    return { distribution: initialDistribution, error: err };
  }
}

/**
 * Get all reviews across all courses.
 */
export async function getAllReviews(): Promise<{ data: CourseReview[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('course_reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { data: [], error };
    }
    return { data: (data as CourseReview[]) || [], error: null };
  } catch (err: any) {
    return { data: [], error: err };
  }
}

export const courseReviewService = {
  getAllReviews,
  createReview,
  updateReview,
  deleteReview,
  getCourseReviews,
  getUserReview,
  replyToReview,
  featureReview,
  publishReview,
  getAverageRating,
  getRatingDistribution,
};

export default courseReviewService;
