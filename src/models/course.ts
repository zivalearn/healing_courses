export type CourseCategory = 
  | 'All Courses'
  | 'Certification'
  | 'Healing'
  | 'Personal Growth'
  | 'Energy Healing';

export type CourseLevel = 'All Levels' | 'Beginner' | 'Intermediate' | 'Advanced' | 'Mastery';

export type CourseMode = 'Online' | 'Offline' | 'Hybrid';

export type CourseStatus = 'published' | 'draft' | 'archived';

export interface CurriculumModule {
  id: string;
  title: string;
  duration: string;
  lessons: string[];
}

export interface CourseInstructor {
  name: string;
  title: string;
  avatar: string;
  bio: string;
}

export interface Course {
  id: string;
  slug: string;
  title?: string;
  name: string; // Alias for title
  subtitle?: string;
  shortDescription: string;
  fullDescription: string;
  thumbnail?: string;
  heroImage?: string;
  image: string; // Alias for thumbnail
  bannerImage?: string; // Alias for heroImage
  modality?: string;
  category: CourseCategory;
  difficulty?: CourseLevel;
  level: CourseLevel; // Alias for difficulty
  mode: CourseMode;
  language?: string;
  duration: string; // e.g., "6 Weeks"
  weeks?: number;
  price: number;
  discountPrice?: number;
  originalPrice?: number; // Alias for discountPrice
  currency: string;
  certificateAvailable?: boolean;
  previewVideo?: string;
  instructor: string | CourseInstructor;
  instructorRole?: string;
  instructorAvatar?: string;
  rating: number;
  students?: number;
  reviewsCount: number;
  tags?: string[];
  learningOutcomes?: string[];
  keyOutcomes: string[];
  requirements?: string[];
  prerequisites?: string;
  curriculumPreview?: CurriculumModule[];
  curriculum: CurriculumModule[];
  badge?: string;
  certificationName?: string;
  status?: CourseStatus;
  isFeatured?: boolean;
  isPublished?: boolean;
  enrolmentOpen?: boolean;
  upcomingBatchDate?: string;
  createdAt: string;
}


export interface SupabaseCourse {
  id: string;
  title: string;
  slug: string;
  short_description?: string | null;
  description?: string | null;
  thumbnail_url?: string | null;
  banner_url?: string | null;
  preview_video_url?: string | null;
  instructor_name?: string | null;
  category?: string | null;
  level?: string | null;
  language?: string | null;
  duration?: string | null;
  price?: number | null;
  discount_price?: number | null;
  status?: CourseStatus | string;
  is_featured?: boolean;
  display_order?: number;
  published_at?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type CreateCourseInput = Omit<SupabaseCourse, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type UpdateCourseInput = Partial<Omit<SupabaseCourse, 'id' | 'created_at' | 'updated_at'>>;

export interface FilterState {
  searchQuery: string;
  category: CourseCategory | 'All Courses';
  level: CourseLevel | 'All Levels' | 'Beginner' | 'Advanced';
  mode: CourseMode | 'All Modes' | 'Online' | 'Offline';
  modality?: string;
  chipFilter: string;
  sortBy: 'featured' | 'popular' | 'price-low' | 'price-high' | 'rating';
}
