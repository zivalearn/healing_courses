import React, { useState, useEffect } from 'react';
import { Course, CourseCategory, CourseLevel, CourseMode } from '../../models/course';
import { MediaUploader } from './MediaUploader';
import { storageService } from '../../services/storageService';
import { CourseImagePicker } from '../CourseImagePicker';
import { 
  ArrowLeft, 
  Save, 
  Globe, 
  Check, 
  Eye, 
  Sparkles, 
  Plus, 
  Trash2, 
  User, 
  DollarSign, 
  Layers, 
  Tag, 
  Search, 
  Award, 
  HelpCircle,
  FileText,
  Video,
  ListPlus,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface FullPageCourseEditorProps {
  initialCourse?: Course | null;
  onSave: (courseData: Partial<Course>, publish: boolean) => Promise<void>;
  onBack: () => void;
  onPreview: (course: Partial<Course>) => void;
}

const CATEGORIES: CourseCategory[] = ['Certification', 'Healing', 'Personal Growth', 'Energy Healing'];
const LEVELS: CourseLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Mastery', 'All Levels'];
const MODES: CourseMode[] = ['Online', 'Offline', 'Hybrid'];

export const FullPageCourseEditor: React.FC<FullPageCourseEditorProps> = ({
  initialCourse,
  onSave,
  onBack,
  onPreview
}) => {
  const isEditMode = Boolean(initialCourse?.id);

  // Form State initialized with defaults or initialCourse
  const [formData, setFormData] = useState<Partial<Course>>({
    name: '',
    title: '',
    subtitle: '',
    category: 'Healing',
    modality: 'Reiki & Energy Healing',
    shortDescription: '',
    fullDescription: '',
    duration: '4 Weeks (Live + Recorded)',
    level: 'Beginner',
    difficulty: 'Beginner',
    mode: 'Online',
    language: 'English & Hindi',
    price: 299,
    originalPrice: 399,
    discountPrice: 299,
    currency: '$',
    badge: 'Popular Program',
    instructor: 'Heer',
    instructorRole: 'Master Healer & Subconscious Mind Coach',
    instructorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300&auto=format&fit=crop',
    instructorBio: 'Certified practitioner with over 12 years of clinical experience guiding thousands in holistic healing.',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop',
    bannerImage: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?q=80&w=1200&auto=format&fit=crop',
    previewVideo: '',
    certificationName: 'Accredited Heal With Heer Practitioner Certificate',
    isFeatured: false,
    isPublished: true,
    status: 'published',
    enrolmentOpen: true,
    upcomingBatchDate: '1st of Next Month',
    prerequisites: 'Open to all seekers with no prior experience needed.',
    keyOutcomes: [
      'Master subconscious healing techniques',
      'Receive globally accredited practitioner certification',
      'Learn live energetic alignment exercises'
    ],
    curriculum: [
      {
        id: 'm1',
        title: 'Module 1: Subconscious Foundations & Energy Mechanics',
        duration: '1 Week',
        lessons: ['Introduction to Mind Mechanics', 'Centering & Grounding Techniques', 'Daily Practice Rituals']
      }
    ],
    tags: ['Reiki', 'Healing', 'Mindfulness', 'Energy Work'],
    slug: ''
  });

  const [activeSection, setActiveSection] = useState<'basic' | 'pricing' | 'media' | 'instructor' | 'seo' | 'visibility'>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [newOutcome, setNewOutcome] = useState('');
  const [newTag, setNewTag] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialCourse) {
      const thumb = initialCourse.thumbnail || initialCourse.image || '';
      const banner = initialCourse.bannerImage || initialCourse.heroImage || thumb;
      setFormData({
        ...initialCourse,
        name: initialCourse.name || initialCourse.title || '',
        title: initialCourse.title || initialCourse.name || '',
        image: thumb,
        thumbnail: thumb,
        bannerImage: banner,
        heroImage: banner
      });
    }
  }, [initialCourse]);

  // Auto-slugify course name
  const handleNameChange = (val: string) => {
    setFormData(prev => ({
      ...prev,
      name: val,
      title: val,
      slug: prev.slug || val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }));
  };

  const handleAddOutcome = () => {
    if (!newOutcome.trim()) return;
    setFormData(prev => ({
      ...prev,
      keyOutcomes: [...(prev.keyOutcomes || []), newOutcome.trim()]
    }));
    setNewOutcome('');
  };

  const handleRemoveOutcome = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      keyOutcomes: (prev.keyOutcomes || []).filter((_, i) => i !== idx)
    }));
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    setFormData(prev => ({
      ...prev,
      tags: [...(prev.tags || []), newTag.trim()]
    }));
    setNewTag('');
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: (prev.tags || []).filter(t => t !== tag)
    }));
  };

  const handleSubmit = async (publishStatus: boolean) => {
    setIsSaving(true);
    try {
      const thumb = formData.image || formData.thumbnail || '';
      const banner = formData.bannerImage || formData.heroImage || thumb;

      const payload: Partial<Course> = {
        ...formData,
        image: thumb,
        thumbnail: thumb,
        bannerImage: banner,
        heroImage: banner,
        isPublished: publishStatus,
        status: publishStatus ? 'published' : 'draft',
        title: formData.name || formData.title,
        name: formData.name || formData.title
      };

      await onSave(payload, publishStatus);
      setSaveSuccessMsg(publishStatus ? 'Course published successfully!' : 'Course draft saved!');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FCFA] text-[#102A36] flex flex-col animate-fade-in">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#C8E6E1] px-6 py-4 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-[#EEF7F5] hover:bg-[#287687] text-[#287687] hover:text-white transition-all cursor-pointer"
            title="Back to courses list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#287687]">
                {isEditMode ? 'Course Editor' : 'New Program Authoring'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                formData.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {formData.isPublished ? 'Published' : 'Draft'}
              </span>
            </div>
            <h1 className="font-serif font-bold text-lg text-[#102A36] line-clamp-1">
              {formData.name || 'Untitled Course'}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPreview(formData)}
            className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Preview</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={isSaving}
            className="px-3 py-1.5 rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Save Draft</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={isSaving}
            className="px-3.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{formData.isPublished ? 'Save Changes' : 'Publish Course'}</span>
          </button>
        </div>
      </header>

      {saveSuccessMsg && (
        <div className="bg-emerald-600 text-white px-6 py-2 text-xs font-semibold text-center flex items-center justify-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Main Workspace Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs space-y-0.5 sticky top-20">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block px-3 py-1.5">
              Course Sections
            </span>

            {[
              { id: 'basic', label: 'Basic Information', icon: FileText },
              { id: 'pricing', label: 'Pricing & Schedule', icon: DollarSign },
              { id: 'media', label: 'Media & Uploads', icon: Video },
              { id: 'instructor', label: 'Instructor Details', icon: User },
              { id: 'seo', label: 'SEO & Metadata', icon: Search },
              { id: 'visibility', label: 'Publishing & Outcomes', icon: Globe }
            ].map(sec => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveSection(sec.id as any)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors text-left cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-200' : 'text-slate-400'}`} />
                  <span>{sec.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Editor Form Panels */}
        <div className="lg:col-span-3 space-y-8">

          {/* BASIC INFO */}
          {activeSection === 'basic' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#C8E6E1] shadow-xs space-y-6 animate-fade-in">
              <div className="border-b border-[#C8E6E1] pb-4">
                <h2 className="font-serif font-bold text-xl text-[#102A36]">Basic Information</h2>
                <p className="text-xs text-[#486D7A]">Set the main course title, descriptions, category, and modality</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                    Course Title / Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Somatic Breathwork & Subconscious Energetic Release"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#C8E6E1] text-sm focus:outline-none focus:border-[#287687]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                    Subtitle / Tagline
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle || ''}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="e.g. Master energy healing and subconscious repatterning in 4 weeks"
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#C8E6E1] text-xs focus:outline-none focus:border-[#287687]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as CourseCategory })}
                      className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#C8E6E1] text-xs font-semibold focus:outline-none focus:border-[#287687]"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                      Modality
                    </label>
                    <input
                      type="text"
                      value={formData.modality || ''}
                      onChange={(e) => setFormData({ ...formData, modality: e.target.value })}
                      placeholder="e.g. Reiki, NLP, Sound Healing"
                      className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#C8E6E1] text-xs font-semibold focus:outline-none focus:border-[#287687]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                      Level
                    </label>
                    <select
                      value={formData.level}
                      onChange={(e) => setFormData({ ...formData, level: e.target.value as CourseLevel, difficulty: e.target.value as CourseLevel })}
                      className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#C8E6E1] text-xs font-semibold focus:outline-none focus:border-[#287687]"
                    >
                      {LEVELS.map(lvl => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                      Mode
                    </label>
                    <select
                      value={formData.mode}
                      onChange={(e) => setFormData({ ...formData, mode: e.target.value as CourseMode })}
                      className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#C8E6E1] text-xs font-semibold focus:outline-none focus:border-[#287687]"
                    >
                      {MODES.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={formData.duration || ''}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="e.g. 6 Weeks (Live Sessions)"
                      className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#C8E6E1] text-xs font-semibold focus:outline-none focus:border-[#287687]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                      Language
                    </label>
                    <input
                      type="text"
                      value={formData.language || ''}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      placeholder="e.g. English & Hindi"
                      className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#C8E6E1] text-xs font-semibold focus:outline-none focus:border-[#287687]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                    Short Description (Catalog Overview)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.shortDescription || ''}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    placeholder="Short 2-line summary displayed on course catalog cards..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#C8E6E1] text-xs focus:outline-none focus:border-[#287687]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                    Full Description & Journey
                  </label>
                  <textarea
                    rows={6}
                    value={formData.fullDescription || ''}
                    onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                    placeholder="In-depth description of the course curriculum, methodology, and transformation..."
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#C8E6E1] text-sm focus:outline-none focus:border-[#287687]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PRICING & SCHEDULE */}
          {activeSection === 'pricing' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#C8E6E1] shadow-xs space-y-6 animate-fade-in">
              <div className="border-b border-[#C8E6E1] pb-4">
                <h2 className="font-serif font-bold text-xl text-[#102A36]">Pricing & Schedule</h2>
                <p className="text-xs text-[#486D7A]">Set pricing, currency, upcoming batch dates, and enrolment status</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                    Price ($ / INR) *
                  </label>
                  <input
                    type="number"
                    value={formData.price || 0}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#C8E6E1] text-sm font-bold focus:outline-none focus:border-[#287687]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                    Original Price (Strikethrough)
                  </label>
                  <input
                    type="number"
                    value={formData.originalPrice || 0}
                    onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#C8E6E1] text-sm focus:outline-none focus:border-[#287687]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                    Currency Symbol
                  </label>
                  <input
                    type="text"
                    value={formData.currency || '$'}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    placeholder="e.g. $ or ₹"
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#C8E6E1] text-sm focus:outline-none focus:border-[#287687]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                    Upcoming Batch Start Date
                  </label>
                  <input
                    type="text"
                    value={formData.upcomingBatchDate || ''}
                    onChange={(e) => setFormData({ ...formData, upcomingBatchDate: e.target.value })}
                    placeholder="e.g. 1st of Next Month"
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#C8E6E1] text-xs focus:outline-none focus:border-[#287687]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                    Badge Label
                  </label>
                  <input
                    type="text"
                    value={formData.badge || ''}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="e.g. Best Seller, Accredited"
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#C8E6E1] text-xs focus:outline-none focus:border-[#287687]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enrolmentOpen ?? true}
                    onChange={(e) => setFormData({ ...formData, enrolmentOpen: e.target.checked })}
                    className="w-4 h-4 rounded text-[#287687]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#102A36] block">Enrolment Open</span>
                    <span className="text-[11px] text-[#486D7A]">Allow new students to enroll in this course</span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* MEDIA & UPLOADS */}
          {activeSection === 'media' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#C8E6E1] shadow-xs space-y-6 animate-fade-in">
              <div className="border-b border-[#C8E6E1] pb-4">
                <h2 className="font-serif font-bold text-xl text-[#102A36]">Media & Uploads</h2>
                <p className="text-xs text-[#486D7A]">
                  All file uploads communicate exclusively via Storage Service abstraction for seamless cloud switching.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MediaUploader
                  label="Thumbnail Image (Catalogue Card)"
                  description="Recommended 800x600px PNG or JPG"
                  currentUrl={formData.image || formData.thumbnail}
                  onChange={(url) => setFormData(prev => ({ ...prev, image: url, thumbnail: url }))}
                  aspectRatio="aspect-4/3"
                />

                <MediaUploader
                  label="Hero Banner Image"
                  description="Recommended 1200x600px high resolution image"
                  currentUrl={formData.bannerImage || formData.heroImage}
                  onChange={(url) => setFormData(prev => ({ ...prev, bannerImage: url, heroImage: url }))}
                  aspectRatio="aspect-video"
                />
              </div>

              <div className="pt-4 border-t border-[#C8E6E1]">
                <MediaUploader
                  label="Preview Video (Optional)"
                  description="Upload short intro MP4 or paste video URL"
                  currentUrl={formData.previewVideo}
                  type="video"
                  accept="video/*"
                  onChange={(url) => setFormData(prev => ({ ...prev, previewVideo: url }))}
                  aspectRatio="aspect-video"
                />
              </div>

              {/* Course Presets Picker */}
              <div className="pt-4 border-t border-[#C8E6E1]">
                <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-2">
                  Or Pick From Heal With Heer Preset Sanctuary
                </label>
                <CourseImagePicker
                  selectedUrl={formData.image || formData.thumbnail || ''}
                  onSelectUrl={(url) => setFormData(prev => ({ ...prev, image: url, thumbnail: url, bannerImage: url, heroImage: url }))}
                />
              </div>
            </div>
          )}

          {/* INSTRUCTOR DETAILS */}
          {activeSection === 'instructor' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#C8E6E1] shadow-xs space-y-6 animate-fade-in">
              <div className="border-b border-[#C8E6E1] pb-4">
                <h2 className="font-serif font-bold text-xl text-[#102A36]">Instructor Profile</h2>
                <p className="text-xs text-[#486D7A]">Instructor name, title, bio, and avatar photo</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <MediaUploader
                    label="Instructor Avatar"
                    description="Square photo"
                    currentUrl={typeof formData.instructor === 'object' ? formData.instructor?.avatar : formData.instructorAvatar}
                    onChange={(url) => setFormData({ ...formData, instructorAvatar: url })}
                    aspectRatio="aspect-square"
                  />
                </div>

                <div className="md:col-span-2 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                      Instructor Name
                    </label>
                    <input
                      type="text"
                      value={typeof formData.instructor === 'string' ? formData.instructor : formData.instructor?.name || 'Heer'}
                      onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                      placeholder="e.g. Heer"
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#C8E6E1] text-xs font-bold focus:outline-none focus:border-[#287687]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                      Instructor Role / Title
                    </label>
                    <input
                      type="text"
                      value={formData.instructorRole || ''}
                      onChange={(e) => setFormData({ ...formData, instructorRole: e.target.value })}
                      placeholder="e.g. Master Healer & Mind Coach"
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#C8E6E1] text-xs focus:outline-none focus:border-[#287687]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                      Instructor Bio
                    </label>
                    <textarea
                      rows={3}
                      value={formData.instructorBio || ''}
                      onChange={(e) => setFormData({ ...formData, instructorBio: e.target.value })}
                      placeholder="Short professional bio..."
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#C8E6E1] text-xs focus:outline-none focus:border-[#287687]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SEO & METADATA */}
          {activeSection === 'seo' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#C8E6E1] shadow-xs space-y-6 animate-fade-in">
              <div className="border-b border-[#C8E6E1] pb-4">
                <h2 className="font-serif font-bold text-xl text-[#102A36]">SEO & Metadata</h2>
                <p className="text-xs text-[#486D7A]">URL slug and search keywords</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                    URL Slug
                  </label>
                  <div className="flex items-center">
                    <span className="px-3 py-2.5 bg-[#EEF7F5] border border-r-0 border-[#C8E6E1] rounded-l-xl text-xs text-[#486D7A] font-mono">
                      /course/
                    </span>
                    <input
                      type="text"
                      value={formData.slug || ''}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                      placeholder="somatic-breathwork-healing"
                      className="w-full px-4 py-2.5 rounded-r-xl bg-white border border-[#C8E6E1] text-xs font-mono focus:outline-none focus:border-[#287687]"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-2">
                    Search Tags
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                      placeholder="Add tag and press Enter"
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#C8E6E1] bg-white focus:outline-none focus:border-[#287687]"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-[#287687] text-white text-xs font-bold rounded-xl hover:bg-[#102A36]"
                    >
                      Add Tag
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(formData.tags || []).map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full bg-[#EEF7F5] border border-[#C8E6E1] text-[#287687] text-xs font-bold flex items-center gap-1.5"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-rose-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VISIBILITY & OUTCOMES */}
          {activeSection === 'visibility' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#C8E6E1] shadow-xs space-y-6 animate-fade-in">
              <div className="border-b border-[#C8E6E1] pb-4">
                <h2 className="font-serif font-bold text-xl text-[#102A36]">Publishing & Outcomes</h2>
                <p className="text-xs text-[#486D7A]">Certification name, key outcomes, and prerequisites</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                    Certification Title
                  </label>
                  <input
                    type="text"
                    value={formData.certificationName || ''}
                    onChange={(e) => setFormData({ ...formData, certificationName: e.target.value })}
                    placeholder="e.g. Certified Subconscious Mind & Energy Practitioner"
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#C8E6E1] text-xs font-semibold focus:outline-none focus:border-[#287687]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                    Prerequisites
                  </label>
                  <input
                    type="text"
                    value={formData.prerequisites || ''}
                    onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
                    placeholder="e.g. Open to beginners with a sincere interest in energy healing."
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#C8E6E1] text-xs focus:outline-none focus:border-[#287687]"
                  />
                </div>

                {/* Key Outcomes List */}
                <div>
                  <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-2">
                    Key Learning Outcomes
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newOutcome}
                      onChange={(e) => setNewOutcome(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddOutcome(); } }}
                      placeholder="Add key takeaway / skill gained..."
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#C8E6E1] bg-white focus:outline-none focus:border-[#287687]"
                    />
                    <button
                      type="button"
                      onClick={handleAddOutcome}
                      className="px-4 py-2 bg-[#287687] text-white text-xs font-bold rounded-xl hover:bg-[#102A36]"
                    >
                      Add Outcome
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(formData.keyOutcomes || []).map((out, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[#F7FCFA] border border-[#C8E6E1] flex items-center justify-between text-xs font-medium text-[#102A36]"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#287687] shrink-0" />
                          <span>{out}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveOutcome(idx)}
                          className="text-gray-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="pt-4 border-t border-[#C8E6E1] space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured ?? false}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="w-4 h-4 rounded text-[#287687]"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#102A36] block">Mark as Featured Program</span>
                      <span className="text-[11px] text-[#486D7A]">Highlights this course on homepage banners</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPublished ?? true}
                      onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked, status: e.target.checked ? 'published' : 'draft' })}
                      className="w-4 h-4 rounded text-[#287687]"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#102A36] block">Publish Immediately</span>
                      <span className="text-[11px] text-[#486D7A]">Makes course visible in student catalogue</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
