import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Course, CourseCategory, CourseLevel, CourseStatus } from '../../../models/course';
import { courseService } from '../../../services/courseService';
import { MediaPicker, MediaItem } from '../../../components/MediaPicker';
import {
  Settings,
  Save,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
  Globe,
  Lock,
  Archive,
  DollarSign,
  Tag,
  Clock,
  User,
  Image as ImageIcon,
  FileText,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
  Sliders,
  CheckCircle2,
  ExternalLink,
  Video,
} from 'lucide-react';

interface CourseSettingsProps {
  course: Course;
  onCourseUpdated?: (updatedCourse: Course) => void;
  onClose?: () => void;
}

interface FormErrors {
  title?: string;
  slug?: string;
  price?: string;
  discountPrice?: string;
}

export const CourseSettings: React.FC<CourseSettingsProps> = ({
  course,
  onCourseUpdated,
  onClose,
}) => {
  // Form State
  const [title, setTitle] = useState(course.title || course.name || '');
  const [slug, setSlug] = useState(course.slug || '');
  const [shortDescription, setShortDescription] = useState(
    course.shortDescription || ''
  );
  const [fullDescription, setFullDescription] = useState(
    course.fullDescription || ''
  );
  const [thumbnailUrl, setThumbnailUrl] = useState(
    course.thumbnail || course.image || ''
  );
  const [bannerUrl, setBannerUrl] = useState(
    course.bannerImage || course.heroImage || ''
  );
  const [previewVideoUrl, setPreviewVideoUrl] = useState(
    course.previewVideo || ''
  );
  const [instructorName, setInstructorName] = useState(
    typeof course.instructor === 'string'
      ? course.instructor
      : course.instructor?.name || 'Heer'
  );
  const [category, setCategory] = useState<CourseCategory>(
    course.category || 'Healing'
  );
  const [level, setLevel] = useState<CourseLevel>(
    course.level || course.difficulty || 'All Levels'
  );
  const [language, setLanguage] = useState(course.language || 'English');
  const [duration, setDuration] = useState(course.duration || '4 Weeks');
  const [price, setPrice] = useState<number>(course.price || 0);
  const [discountPrice, setDiscountPrice] = useState<number | undefined>(
    course.discountPrice
  );
  const [isFeatured, setIsFeatured] = useState<boolean>(
    course.isFeatured || false
  );
  const [status, setStatus] = useState<CourseStatus>(
    course.status || (course.isPublished ? 'published' : 'draft')
  );
  const [publishedAt, setPublishedAt] = useState<string>(
    course.createdAt ? course.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [displayOrder, setDisplayOrder] = useState<number>(1);

  // Status & Validation State
  const [errors, setErrors] = useState<FormErrors>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'general' | 'media' | 'pricing' | 'advanced'>('general');

  // Debounce Auto-save Ref
  const isFirstRender = useRef(true);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper function to slugify text
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Auto-generate slug when title changes if slug is empty or matches previous title slug
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(newTitle));
    }
  };

  // Form Validation
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Course title is required';
    }

    if (!slug.trim()) {
      newErrors.slug = 'Course slug URL is required';
    } else if (!/^[a-z0-9-]+$/.test(slug)) {
      newErrors.slug = 'Slug must only contain lowercase letters, numbers, and hyphens';
    }

    if (price < 0) {
      newErrors.price = 'Price cannot be negative';
    }

    if (discountPrice !== undefined && discountPrice !== null && discountPrice < 0) {
      newErrors.discountPrice = 'Discount price cannot be negative';
    } else if (
      discountPrice !== undefined &&
      discountPrice !== null &&
      discountPrice > price
    ) {
      newErrors.discountPrice = 'Discount price cannot exceed the original price';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, slug, price, discountPrice]);

  // Execute Save API Call
  const handleSave = useCallback(
    async (isAutoSave: boolean = false) => {
      if (!validateForm()) {
        setSaveStatus('error');
        setSaveMessage('Please resolve form validation errors before saving.');
        return;
      }

      setSaveStatus('saving');
      setSaveMessage(isAutoSave ? 'Auto-saving changes...' : 'Saving course settings...');

      try {
        const payload = {
          title: title.trim(),
          slug: slug.trim(),
          short_description: shortDescription.trim(),
          description: fullDescription.trim(),
          thumbnail_url: thumbnailUrl.trim(),
          banner_url: bannerUrl.trim(),
          preview_video_url: previewVideoUrl.trim(),
          instructor_name: instructorName.trim(),
          category,
          level,
          language,
          duration,
          price: Number(price),
          discount_price: discountPrice !== undefined && discountPrice !== null ? Number(discountPrice) : null,
          is_featured: isFeatured,
          status,
          display_order: displayOrder,
          published_at: status === 'published' ? new Date(publishedAt).toISOString() : null,
        };

        const { data, error } = await courseService.updateCourse(course.id, payload);

        if (error) {
          throw error;
        }

        setSaveStatus('saved');
        setSaveMessage('All changes saved successfully');

        if (onCourseUpdated && data) {
          const updatedModel: Course = {
            ...course,
            title: data.title,
            name: data.title,
            slug: data.slug,
            shortDescription: data.short_description || '',
            fullDescription: data.description || '',
            thumbnail: data.thumbnail_url || '',
            image: data.thumbnail_url || course.image,
            bannerImage: data.banner_url || '',
            heroImage: data.banner_url || '',
            previewVideo: data.preview_video_url || previewVideoUrl,
            instructor: data.instructor_name || 'Heer',
            category: (data.category as CourseCategory) || 'Healing',
            level: (data.level as CourseLevel) || 'All Levels',
            language: data.language || 'English',
            duration: data.duration || '4 Weeks',
            price: data.price || 0,
            discountPrice: data.discount_price || undefined,
            isFeatured: data.is_featured ?? false,
            status: (data.status as CourseStatus) || 'draft',
            isPublished: data.status === 'published',
          };
          onCourseUpdated(updatedModel);
        }

        setTimeout(() => {
          setSaveStatus('idle');
          setSaveMessage('');
        }, 3000);
      } catch (err: any) {
        console.error('Failed to save course settings:', err);
        setSaveStatus('error');
        setSaveMessage(err.message || 'Failed to save course settings. Please try again.');
      }
    },
    [
      validateForm,
      title,
      slug,
      shortDescription,
      fullDescription,
      thumbnailUrl,
      bannerUrl,
      instructorName,
      category,
      level,
      language,
      duration,
      price,
      discountPrice,
      isFeatured,
      status,
      displayOrder,
      publishedAt,
      course,
      onCourseUpdated,
    ]
  );

  // Debounced Auto-save Effect
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      handleSave(true);
    }, 1200);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [
    title,
    slug,
    shortDescription,
    fullDescription,
    thumbnailUrl,
    bannerUrl,
    instructorName,
    category,
    level,
    language,
    duration,
    price,
    discountPrice,
    isFeatured,
    status,
    displayOrder,
    publishedAt,
    handleSave,
  ]);

  return (
    <div className="bg-slate-50 min-h-full p-4 sm:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Top Header & Save Status Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Course Settings
              </h2>
              <p className="text-xs text-slate-500">
                Manage metadata, pricing, status, branding, and publication details.
              </p>
            </div>
          </div>
        </div>

        {/* Action & Auto-save Status */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Auto-saving...
            </span>
          )}

          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Saved
            </span>
          )}

          {saveStatus === 'error' && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100">
              <AlertCircle className="w-3.5 h-3.5" />
              Save Failed
            </span>
          )}

          <button
            onClick={() => handleSave(false)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
              title="Close Settings"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {saveMessage && saveStatus === 'error' && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-medium text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Settings Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'general'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>General Info</span>
        </button>

        <button
          onClick={() => setActiveTab('media')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'media'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/60'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Thumbnail & Banner</span>
        </button>

        <button
          onClick={() => setActiveTab('pricing')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'pricing'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/60'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Pricing & Access</span>
        </button>

        <button
          onClick={() => setActiveTab('advanced')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'advanced'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/60'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Publishing & Status</span>
        </button>
      </div>

      {/* TAB 1: GENERAL INFO */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title & Slug */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4 md:col-span-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Course Identity
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Course Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Master Subconscious Mind & Energy Healing"
                  className={`w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 ${
                    errors.title ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                  }`}
                />
                {errors.title && (
                  <p className="text-[11px] font-medium text-rose-600 mt-1">
                    {errors.title}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>URL Slug <span className="text-rose-500">*</span></span>
                  <button
                    type="button"
                    onClick={() => setSlug(generateSlug(title))}
                    className="text-[10px] text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <RefreshCw className="w-3 h-3" /> Auto-generate
                  </button>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-mono text-slate-400">
                    /courses/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    placeholder="reiki-energy-healing-mastery"
                    className={`w-full pl-20 pr-3.5 py-2.5 text-xs font-mono bg-slate-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 ${
                      errors.slug ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                    }`}
                  />
                </div>
                {errors.slug && (
                  <p className="text-[11px] font-medium text-rose-600 mt-1">
                    {errors.slug}
                  </p>
                )}
              </div>
            </div>

            {/* Descriptions */}
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Short Summary / Subtitle
                </label>
                <input
                  type="text"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="A concise 1-2 sentence overview of what students will achieve..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Description & Curriculum Overview
                </label>
                <textarea
                  rows={5}
                  value={fullDescription}
                  onChange={(e) => setFullDescription(e.target.value)}
                  placeholder="Detailed course description, objectives, target audience, prerequisites..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 leading-relaxed font-sans"
                />
              </div>
            </div>
          </div>

          {/* Instructor & Metadata */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-4 h-4 text-indigo-600" />
              Instructor & Delivery
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Instructor Name
                </label>
                <input
                  type="text"
                  value={instructorName}
                  onChange={(e) => setInstructorName(e.target.value)}
                  placeholder="Heer / Lead Master Instructor"
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Language
                </label>
                <input
                  type="text"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder="English"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Duration Display Text
                </label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 6 Weeks (24 Hours total)"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Category & Difficulty Level */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Tag className="w-4 h-4 text-indigo-600" />
              Categorization
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Course Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CourseCategory)}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
                >
                  <option value="Certification">Certification Program</option>
                  <option value="Healing">Healing Arts</option>
                  <option value="Personal Growth">Personal Growth</option>
                  <option value="Energy Healing">Energy Healing</option>
                  <option value="All Courses">General / All Courses</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Difficulty Level
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as CourseLevel)}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
                >
                  <option value="All Levels">All Levels Welcome</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Mastery">Mastery / Practitioner</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: THUMBNAIL & BANNER (MEDIA UPLOADS) */}
      {activeTab === 'media' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Thumbnail Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <ImageIcon className="w-4 h-4 text-indigo-600" />
              Course Card Thumbnail
            </h3>
            <p className="text-xs text-slate-500">
              Main image displayed on course catalog cards and search listings (Recommended aspect ratio 16:9).
            </p>

            <MediaPicker
              value={thumbnailUrl}
              onChange={(media) => {
                if (media?.url) setThumbnailUrl(media.url);
              }}
              acceptTypes={['image']}
              folder="course-thumbnails"
              title="Upload Thumbnail Image"
              description="Drop an image file here or select from computer."
            />

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Direct Thumbnail Image URL
              </label>
              <input
                type="text"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
              />
            </div>

            {thumbnailUrl && (
              <div className="mt-2 rounded-xl border border-slate-200 overflow-hidden bg-slate-900">
                <img
                  src={thumbnailUrl}
                  alt="Thumbnail Preview"
                  className="w-full h-40 object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Banner Hero Image Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <ImageIcon className="w-4 h-4 text-purple-600" />
              Hero Banner Image
            </h3>
            <p className="text-xs text-slate-500">
              Wide header banner image used on the course sales page hero section.
            </p>

            <MediaPicker
              value={bannerUrl}
              onChange={(media) => {
                if (media?.url) setBannerUrl(media.url);
              }}
              acceptTypes={['image']}
              folder="course-banners"
              title="Upload Banner Image"
              description="Drop a wide banner graphic or select from computer."
            />

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Direct Banner Image URL
              </label>
              <input
                type="text"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
              />
            </div>

            {bannerUrl && (
              <div className="mt-2 rounded-xl border border-slate-200 overflow-hidden bg-slate-900">
                <img
                  src={bannerUrl}
                  alt="Banner Preview"
                  className="w-full h-40 object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Preview Video Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4 md:col-span-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Video className="w-4 h-4 text-rose-600" />
              Course Trailer / Preview Video
            </h3>
            <p className="text-xs text-slate-500">
              Upload a promotional video from your computer or secure storage, or paste a direct MP4, YouTube, or Vimeo URL for the course catalog preview.
            </p>

            <MediaPicker
              value={previewVideoUrl}
              onChange={(media) => {
                if (media?.url) setPreviewVideoUrl(media.url);
              }}
              acceptTypes={['video']}
              folder="course-previews"
              title="Upload Video File From Computer"
              description="Select an MP4, WEBM, or MOV file from your computer or drag & drop."
            />

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Direct Video / YouTube / Vimeo URL
              </label>
              <input
                type="text"
                value={previewVideoUrl}
                onChange={(e) => setPreviewVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or https://storage.provider/video.mp4"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
              />
            </div>

            {previewVideoUrl && (
              <div className="mt-2 rounded-xl border border-slate-200 overflow-hidden bg-slate-900 aspect-video max-w-xl">
                {previewVideoUrl.includes('youtube') || previewVideoUrl.includes('vimeo') || previewVideoUrl.includes('/embed/') ? (
                  <iframe
                    src={previewVideoUrl}
                    className="w-full h-full border-0"
                    title="Course preview video"
                  />
                ) : (
                  <video
                    src={previewVideoUrl}
                    controls
                    preload="metadata"
                    className="w-full h-full object-contain"
                  >
                    Your browser does not support video playback.
                  </video>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PRICING & ACCESS */}
      {activeTab === 'pricing' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Course Pricing Structure
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Regular Price ($ USD) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    placeholder="299.00"
                    className={`w-full pl-8 pr-3.5 py-2.5 text-xs font-bold bg-slate-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 ${
                      errors.price ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                    }`}
                  />
                </div>
                {errors.price && (
                  <p className="text-[11px] font-medium text-rose-600 mt-1">
                    {errors.price}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Discount / Promotional Price ($ USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountPrice !== undefined ? discountPrice : ''}
                    onChange={(e) =>
                      setDiscountPrice(
                        e.target.value === '' ? undefined : parseFloat(e.target.value)
                      )
                    }
                    placeholder="199.00 (Optional)"
                    className={`w-full pl-8 pr-3.5 py-2.5 text-xs font-bold bg-slate-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 ${
                      errors.discountPrice ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                    }`}
                  />
                </div>
                {errors.discountPrice && (
                  <p className="text-[11px] font-medium text-rose-600 mt-1">
                    {errors.discountPrice}
                  </p>
                )}
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-xs font-bold text-slate-800 block">
                  Price Preview Display
                </span>
                <div className="flex items-baseline gap-2">
                  {discountPrice !== undefined && discountPrice < price ? (
                    <>
                      <span className="text-lg font-extrabold text-emerald-600">
                        ${discountPrice.toFixed(2)}
                      </span>
                      <span className="text-xs line-through text-slate-400 font-bold">
                        ${price.toFixed(2)}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Save ${(price - discountPrice).toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="text-lg font-extrabold text-slate-900">
                      {price === 0 ? 'FREE' : `$${price.toFixed(2)}`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Featured Flags & Promotion
            </h3>

            <div className="space-y-4 pt-1">
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <div>
                  <span className="block text-xs font-bold text-slate-900">
                    Feature this course on Home Page
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Displays a prominent highlight badge on main course carousels and hero banners.
                  </span>
                </div>
              </label>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catalog Display Order
                </label>
                <input
                  type="number"
                  min="1"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Lower numbers appear first in custom sorted course grids.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PUBLISHING & STATUS */}
      {activeTab === 'advanced' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Globe className="w-4 h-4 text-indigo-600" />
              Course Publication Status
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Publication Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('published')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                      status === 'published'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Globe className="w-4 h-4 text-emerald-600" />
                    <span>Published</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('draft')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                      status === 'draft'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span>Draft</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('archived')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                      status === 'archived'
                        ? 'bg-slate-200 border-slate-400 text-slate-900 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Archive className="w-4 h-4 text-slate-600" />
                    <span>Archived</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Publishing Date
                </label>
                <input
                  type="date"
                  value={publishedAt}
                  onChange={(e) => setPublishedAt(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Calendar className="w-4 h-4 text-slate-600" />
              Course System Metadata
            </h3>

            <div className="space-y-3 text-xs text-slate-600 font-mono">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400 font-sans font-semibold">Course UUID:</span>
                <span className="font-bold text-slate-800 truncate max-w-[200px]">{course.id}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400 font-sans font-semibold">Slug Path:</span>
                <span className="font-bold text-indigo-600">/courses/{slug}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400 font-sans font-semibold">Created At:</span>
                <span className="font-bold text-slate-800">
                  {course.createdAt ? new Date(course.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseSettings;
