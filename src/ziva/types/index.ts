export type ZivaCourseCategory = 'Confidence' | 'Communication' | 'Public Speaking' | 'Personality Development' | 'Coaching & Mindset' | 'Executive Presence';
export type ZivaCourseLevel = 'All Levels' | 'Beginner' | 'Intermediate' | 'Advanced' | 'Executive Mastery';
export type ZivaCourseStatus = 'draft' | 'published' | 'archived';

export type ZivaBlockType = 
  | 'paragraph' 
  | 'video' 
  | 'audio' 
  | 'image' 
  | 'gallery'
  | 'quiz' 
  | 'attachment' 
  | 'worksheet'
  | 'callout' 
  | 'checklist'
  | 'accordion' 
  | 'quote' 
  | 'code';

export interface ZivaQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface ZivaLessonBlock {
  id: string;
  lesson_id?: string;
  type: ZivaBlockType;
  title?: string | null;
  content?: string | null;
  media_url?: string | null;
  poster_url?: string | null;
  file_name?: string | null;
  file_size?: string | null;
  duration_seconds?: number;
  callout_type?: 'info' | 'warning' | 'success' | 'tip' | 'principle';
  code_language?: string;
  questions?: ZivaQuizQuestion[];
  accordion_items?: { title: string; content: string }[];
  gallery_images?: { url: string; caption?: string }[];
  checklist_items?: { id: string; text: string; is_checked?: boolean }[];
  worksheet_data?: { instructions?: string; template_url?: string; template_name?: string };
  quote_author?: string;
  metadata?: Record<string, any> | null;
  display_order?: number;
  order?: number;
  is_required?: boolean;
  is_collapsed?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ZivaLesson {
  id: string;
  section_id?: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  display_order?: number;
  order?: number;
  estimated_duration?: number;
  is_preview?: boolean;
  is_locked?: boolean;
  blocks?: ZivaLessonBlock[];
  created_at?: string;
  updated_at?: string;
}

export interface ZivaSection {
  id: string;
  course_id?: string;
  title: string;
  subtitle?: string | null;
  display_order?: number;
  order?: number;
  lessons?: ZivaLesson[];
  is_collapsed?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ZivaCourse {
  id: string;
  slug: string;
  title: string;
  name?: string; // fallback alias
  tagline?: string;
  shortDescription: string;
  fullDescription: string;
  category: ZivaCourseCategory;
  level: ZivaCourseLevel;
  mode?: string;
  language?: string;
  price: number;
  salePrice?: number;
  currency?: string;
  duration: string;
  thumbnailUrl: string;
  bannerUrl?: string;
  promoVideoUrl?: string;
  promoVideoPoster?: string;
  instructorName: string;
  instructorTitle: string;
  instructorAvatar: string;
  instructorBio?: string;
  certificationName?: string;
  isPublished: boolean;
  isFeatured: boolean;
  enrolmentOpen?: boolean;
  upcomingBatchDate?: string;
  keyOutcomes: string[];
  requirements?: string[];
  tags?: string[];
  sections?: ZivaSection[];
  metaTitle?: string;
  metaDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ZivaUserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'student' | 'admin' | 'instructor' | string;
  avatarUrl?: string;
  createdAt: string;
}

export interface ZivaEnrollment {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  courseId: string;
  enrolledAt: string;
  progressPercent: number;
  lastAccessedAt: string;
  completedLessonIds: string[];
  status?: 'active' | 'completed' | 'revoked';
}

export interface ZivaCertificate {
  id: string;
  userId: string;
  userName?: string;
  courseId: string;
  courseTitle: string;
  issuedAt: string;
  certificateNumber: string;
  status?: 'active' | 'revoked';
  revokeReason?: string;
}

export interface ZivaNote {
  id: string;
  userId: string;
  courseId: string;
  lessonId: string;
  lessonTitle?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ZivaBookmark {
  id: string;
  userId: string;
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  createdAt: string;
}

export interface ZivaAnnouncement {
  id: string;
  courseId?: string;
  courseTitle?: string;
  title: string;
  message: string;
  isPinned?: boolean;
  createdBy?: string;
  createdAt: string;
}

export interface ZivaDiscussion {
  id: string;
  courseId: string;
  lessonId?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole?: string;
  title?: string;
  content: string;
  parentId?: string | null;
  replies?: ZivaDiscussion[];
  createdAt: string;
}

export interface ZivaCourseReview {
  id: string;
  courseId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  isPublished: boolean;
  createdAt: string;
}

export interface ZivaFilterState {
  searchQuery: string;
  category: string;
  level: string;
  sortBy: 'featured' | 'price-low' | 'price-high' | 'newest';
}
