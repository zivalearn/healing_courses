export interface CourseReview {
  id: string;
  user_id: string;
  course_id: string;
  enrollment_id?: string | null;
  rating: number;
  title?: string | null;
  review?: string | null;
  is_featured?: boolean;
  is_verified?: boolean;
  is_published?: boolean;
  instructor_reply?: string | null;
  replied_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type CreateCourseReviewInput = {
  id?: string;
  user_id: string;
  course_id: string;
  enrollment_id?: string | null;
  rating: number;
  title?: string | null;
  review?: string | null;
  is_featured?: boolean;
  is_verified?: boolean;
  is_published?: boolean;
};

export type UpdateCourseReviewInput = Partial<
  Omit<CourseReview, 'id' | 'user_id' | 'course_id' | 'created_at' | 'updated_at'>
>;

export interface RatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
  total: number;
}
