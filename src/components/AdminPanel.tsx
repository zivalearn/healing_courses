import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Course, CourseCategory, CourseLevel, CourseMode } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { 
  sanitizeImageUrl, 
  DEFAULT_COURSE_IMAGE, 
  getImageOverrides, 
  setImageOverride, 
  removeImageOverride, 
  compressBase64Image 
} from '../utils/imageUtils';
import { CourseImagePicker } from './CourseImagePicker';
import { 
  X, Plus, Trash2, Edit3, Star, Eye, EyeOff, 
  RotateCcw, Sparkles, Check, Image as ImageIcon,
  DollarSign, Clock, Layers, Award, Lock, User, LogOut,
  ShieldCheck, AlertCircle, Info, Link as LinkIcon, Camera, Search, Filter
} from 'lucide-react';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  initialTab?: 'list' | 'create' | 'edit' | 'image-studio';
  onAddCourse: (courseData: Partial<Course>) => void;
  onUpdateCourse: (id: string, updates: Partial<Course>) => void;
  onSetFeatured: (id: string) => void;
  onDeleteCourse: (id: string) => void;
  onResetDefault: () => void;
}

const CATEGORIES: CourseCategory[] = ['Certification', 'Healing', 'Personal Growth', 'Energy Healing'];
const LEVELS: CourseLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Mastery', 'All Levels'];
const MODES: CourseMode[] = ['Online', 'Offline', 'Hybrid'];

const SAMPLE_IMAGES = [
  { label: 'Reiki Energy & Lotus', url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop' },
  { label: 'NLP & Brain Clarity', url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop' },
  { label: 'Meditation & Nature', url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop' },
  { label: 'Crystals & Chakras', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop' },
  { label: 'Tarot Cards & Celestial', url: 'https://images.unsplash.com/photo-1635863138275-d9b33299680b?q=80&w=800&auto=format&fit=crop' },
  { label: 'Relationships & Connection', url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=800&auto=format&fit=crop' },
  { label: 'Somatic Healing & Breath', url: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?q=80&w=800&auto=format&fit=crop' }
];

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  courses,
  initialTab,
  onAddCourse,
  onUpdateCourse,
  onSetFeatured,
  onDeleteCourse,
  onResetDefault
}) => {
  const { user, profile, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch {
      // Ignore
    }
    onClose();
  };

  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'edit' | 'image-studio'>(initialTab || 'list');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Sync active tab when initialTab changes or modal opens
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Image Management Studio states
  const [studioSearchQuery, setStudioSearchQuery] = useState('');
  const [studioCategory, setStudioCategory] = useState<string>('All Images');
  const [isVisualEditMode, setIsVisualEditMode] = useState(false);

  // Quick Image Changer Modal state for changing catalogue photos without editing full course form
  const [quickImageCourse, setQuickImageCourse] = useState<Course | null>(null);
  const [quickImageTempUrl, setQuickImageTempUrl] = useState<string>('');
  const [quickImageSuccessMsg, setQuickImageSuccessMsg] = useState<string | null>(null);
  const [isSavingImage, setIsSavingImage] = useState(false);

  const handleOpenQuickImage = (course: Course) => {
    setQuickImageCourse(course);
    setQuickImageTempUrl(course.image);
    setQuickImageSuccessMsg(null);
  };

  const handleSaveQuickImage = async () => {
    if (!quickImageCourse) return;
    setIsSavingImage(true);
    
    try {
      // Compress image if base64 data URI
      const compressedUrl = await compressBase64Image(quickImageTempUrl, 1000, 1000, 0.82);
      const sanitized = sanitizeImageUrl(compressedUrl);

      // Save persistent image override
      setImageOverride(quickImageCourse.id, sanitized);

      onUpdateCourse(quickImageCourse.id, {
        image: sanitized,
        bannerImage: sanitized
      });

      setQuickImageSuccessMsg(`Catalogue photo for "${quickImageCourse.name}" updated & persistently saved!`);
      setTimeout(() => {
        setQuickImageCourse(null);
        setQuickImageSuccessMsg(null);
        setIsSavingImage(false);
      }, 1200);
    } catch (err) {
      console.error('Failed to quick save image:', err);
      setIsSavingImage(false);
    }
  };

  const handleResetSingleImage = (courseId: string) => {
    removeImageOverride(courseId);
    onUpdateCourse(courseId, {
      image: DEFAULT_COURSE_IMAGE,
      bannerImage: DEFAULT_COURSE_IMAGE
    });
  };

  // Form State
  const [formState, setFormState] = useState<Partial<Course>>({
    name: '',
    category: 'Healing',
    shortDescription: '',
    fullDescription: '',
    duration: '4 Weeks',
    level: 'Beginner',
    mode: 'Online',
    price: 299,
    originalPrice: 399,
    currency: '$',
    badge: 'Popular',
    image: SAMPLE_IMAGES[0].url,
    certificationName: 'Accredited Heal With Heer Certificate',
    isFeatured: false,
    isPublished: true,
    upcomingBatchDate: 'Next Month 1st'
  });

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-3xl p-8 border border-[#C8E6E1] shadow-2xl flex flex-col items-center gap-3 text-center">
          <Sparkles className="w-8 h-8 text-[#287687] animate-spin" />
          <p className="font-serif font-bold text-[#102A36]">Verifying Admin Credentials...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <div 
          className="w-full max-w-md bg-white rounded-3xl border border-[#C8E6E1] shadow-2xl overflow-hidden text-[#102A36]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 bg-[#102A36] text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-[#CBA258]">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#CBA258] block">Restricted Access</span>
                <h3 className="font-serif text-lg font-bold">Admin Privileges Required</h3>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-5 text-center">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-left space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Authorization Rule</span>
              </div>
              <p>
                Admin access is granted strictly based on the <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">profiles.role = 'admin'</code> stored in the Heal With Heer database.
              </p>
              {user ? (
                <p className="text-[11px] text-amber-800 pt-1">
                  Logged in as: <strong className="font-semibold">{user.email}</strong> (Role: <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">{profile?.role || 'student'}</code>)
                </p>
              ) : (
                <p className="text-[11px] text-amber-800 pt-1">
                  Status: <strong className="font-semibold">Not Authenticated</strong>
                </p>
              )}
            </div>

            <p className="text-xs text-[#486D7A] leading-relaxed">
              Please log in with an authorized administrator account to access the authoring console.
            </p>

            <button
              onClick={() => {
                onClose();
                navigate('/login');
              }}
              className="w-full py-3 rounded-full bg-[#287687] hover:bg-[#1C5B69] text-white font-bold text-xs uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <User className="w-4 h-4 text-[#CBA258]" />
              <span>Go to Sign In Page</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleStartEdit = (course: Course) => {
    setEditingCourse(course);
    setFormState({ ...course });
    setActiveTab('edit');
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-convert any pasted Unsplash page link or URL into a direct CDN image URL
    const sanitizedImage = sanitizeImageUrl(formState.image);
    const sanitizedBanner = sanitizeImageUrl(formState.bannerImage || formState.image);

    const updatedData = {
      ...formState,
      image: sanitizedImage,
      bannerImage: sanitizedBanner
    };

    if (activeTab === 'create') {
      onAddCourse(updatedData);
    } else if (activeTab === 'edit' && editingCourse) {
      onUpdateCourse(editingCourse.id, updatedData);
    }
    setActiveTab('list');
    setEditingCourse(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className={`w-full ${activeTab === 'image-studio' ? 'max-w-4xl' : 'max-w-2xl'} h-full bg-white border-l border-[#C8E6E1] shadow-2xl flex flex-col text-[#102A36] overflow-hidden transition-all duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Admin Header */}
        <div className="p-6 bg-[#102A36] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 text-[#CBA258]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#CBA258] block">
                Client Admin Panel
              </span>
              <h2 className="font-serif text-xl font-bold">
                Dynamic Course Manager
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs text-white/80 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Log out of Admin Panel"
            >
              <LogOut className="w-3.5 h-3.5 text-[#CBA258]" />
              <span>Log Out</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Tabs Bar */}
        <div className="px-6 py-3 bg-[#EEF7F5] border-b border-[#C8E6E1] flex items-center justify-between shrink-0 overflow-x-auto gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => { setActiveTab('list'); setEditingCourse(null); }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'list'
                  ? 'bg-[#287687] text-white shadow-xs'
                  : 'bg-white text-[#486D7A] hover:bg-[#E2F1EE]'
              }`}
            >
              All Courses ({courses.length})
            </button>

            <button
              onClick={() => {
                setFormState({
                  name: '',
                  category: 'Healing',
                  shortDescription: '',
                  fullDescription: '',
                  duration: '4 Weeks',
                  level: 'Beginner',
                  mode: 'Online',
                  price: 299,
                  originalPrice: 399,
                  currency: '$',
                  badge: 'New Program',
                  image: SAMPLE_IMAGES[0].url,
                  certificationName: 'Accredited Heal With Heer Certificate',
                  isFeatured: false,
                  isPublished: true,
                  upcomingBatchDate: 'Next Month 15th'
                });
                setActiveTab('create');
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-[#287687] text-white shadow-xs'
                  : 'bg-white text-[#486D7A] hover:bg-[#E2F1EE]'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Course</span>
            </button>

            <button
              onClick={() => setActiveTab('image-studio')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'image-studio'
                  ? 'bg-[#102A36] text-[#CBA258] shadow-xs ring-1 ring-[#CBA258]/50'
                  : 'bg-white text-[#486D7A] hover:bg-[#E2F1EE]'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-[#CBA258]" />
              <span>Image Studio</span>
            </button>
          </div>

          <button
            onClick={onResetDefault}
            title="Reset to default initial courses"
            className="text-xs text-[#287687] hover:underline flex items-center gap-1 font-semibold cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* IMAGE STUDIO VIEW */}
          {activeTab === 'image-studio' && (
            <div className="space-y-6 animate-fade-in">
              {/* Studio Header & Visual Edit Toggle */}
              <div className="p-5 rounded-2xl bg-[#0B3843] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#103E3B] shadow-md">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#CBA258]">
                      HEAL WITH HEER SANCTUARY
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[#CBA258] text-[10px] font-bold flex items-center gap-1 border border-[#CBA258]/30">
                      <Sparkles className="w-3 h-3" /> Image Studio Active
                    </span>
                    {Object.keys(getImageOverrides()).length > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#D4A017] text-white text-[10px] font-extrabold shadow-xs">
                        {Object.keys(getImageOverrides()).length} Custom Replaced
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-white">
                    Image Management Studio
                  </h3>
                  <p className="text-xs text-white/80 mt-1 max-w-xl leading-relaxed font-normal">
                    Replace, upload, preview, and manage every catalogue image across the website instantly with guaranteed persistence.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsVisualEditMode(!isVisualEditMode)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                      isVisualEditMode
                        ? 'bg-[#CBA258] text-[#0B3843] border-[#E5C158] shadow-md'
                        : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span>Visual Edit Mode: {isVisualEditMode ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              </div>

              {/* Search & Category Filter Chips */}
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#287687]">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={studioSearchQuery}
                    onChange={(e) => setStudioSearchQuery(e.target.value)}
                    placeholder="Search images by name, page, category, or ID..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#C8E6E1] text-xs font-semibold focus:outline-none focus:border-[#287687] text-[#102A36]"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {['All Images', 'Certification', 'Healing', 'Personal Growth', 'Energy Healing', 'Custom Replaced'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setStudioCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        studioCategory === cat
                          ? 'bg-[#287687] text-white shadow-xs'
                          : 'bg-[#EEF7F5] text-[#486D7A] hover:bg-[#E2F1EE] border border-[#C8E6E1]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses
                  .filter((c) => {
                    if (studioCategory === 'Custom Replaced') {
                      if (!getImageOverrides()[c.id]) return false;
                    } else if (studioCategory !== 'All Images') {
                      if (c.category !== studioCategory) return false;
                    }

                    if (studioSearchQuery.trim()) {
                      const q = studioSearchQuery.toLowerCase();
                      const matchName = c.name.toLowerCase().includes(q);
                      const matchCat = c.category.toLowerCase().includes(q);
                      const matchId = c.id.toLowerCase().includes(q);
                      if (!matchName && !matchCat && !matchId) return false;
                    }

                    return true;
                  })
                  .map((c) => {
                    const isReplaced = Boolean(getImageOverrides()[c.id]);
                    return (
                      <div 
                        key={c.id} 
                        className="bg-white rounded-2xl border border-[#C8E6E1] overflow-hidden hover:border-[#287687] transition-all shadow-xs flex flex-col justify-between group"
                      >
                        {/* Image Preview Box */}
                        <div className="h-40 bg-gray-100 relative overflow-hidden">
                          <img
                            src={c.image}
                            alt={c.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          
                          {/* Badge */}
                          <div className="absolute top-2.5 right-2.5">
                            {isReplaced ? (
                              <span className="px-2.5 py-1 rounded-full bg-[#D4A017] text-white text-[9px] font-extrabold uppercase tracking-widest shadow-md flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" /> Custom Replaced
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white/90 text-[9px] font-semibold uppercase tracking-wider">
                                Default
                              </span>
                            )}
                          </div>

                          {/* Title & Tag */}
                          <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-[#CBA258] block">
                              {c.category}
                            </span>
                            <h4 className="font-serif font-bold text-sm line-clamp-1">
                              {c.name}
                            </h4>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="p-3 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono text-gray-500">
                            catalogue.{c.id}
                          </span>

                          <div className="flex items-center gap-2">
                            {isReplaced && (
                              <button
                                onClick={() => handleResetSingleImage(c.id)}
                                className="p-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
                                title="Reset to default original photo"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenQuickImage(c)}
                              className="px-3 py-1.5 rounded-xl bg-[#287687] hover:bg-[#102A36] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <Camera className="w-3.5 h-3.5 text-[#CBA258]" />
                              <span>Replace Photo</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* LIST VIEW */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              <p className="text-xs text-[#486D7A]">
                Manage all healing programs dynamically. Any addition, pricing update, or image change made here updates the website catalogue instantly.
              </p>

              <div className="space-y-3">
                {courses.map((c) => (
                  <div
                    key={c.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      c.isFeatured 
                        ? 'bg-[#E2F1EE] border-[#287687]' 
                        : c.isPublished 
                        ? 'bg-white border-[#C8E6E1]' 
                        : 'bg-gray-100 opacity-60 border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleOpenQuickImage(c)}
                        className="group relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-[#C8E6E1] cursor-pointer"
                        title="Click to change photo for this course"
                      >
                        <img
                          src={c.image}
                          alt={c.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                          <ImageIcon className="w-5 h-5 text-[#CBA258]" />
                        </div>
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#287687] bg-[#E2F1EE] px-2 py-0.5 rounded-full">
                            {c.category}
                          </span>
                          {c.isFeatured && (
                            <span className="text-[10px] font-bold text-[#102A36] bg-[#CBA258] px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Star className="w-3 h-3 fill-[#102A36] text-[#102A36]" />
                              FEATURED
                            </span>
                          )}
                          {!c.isPublished && (
                            <span className="text-[10px] font-bold text-gray-700 bg-gray-200 px-2 py-0.5 rounded-full">
                              UNPUBLISHED
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-sm text-[#102A36] mt-1 line-clamp-1">
                          {c.name}
                        </h4>
                        
                        <p className="text-xs text-[#486D7A]">
                          {c.currency}{c.price} • {c.duration} • {c.mode}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      
                      {/* Quick Change Image Button */}
                      <button
                        onClick={() => handleOpenQuickImage(c)}
                        title="Change Course Photo (Upload or Paste Link)"
                        className="px-3 py-2 rounded-xl bg-[#E2F1EE] hover:bg-[#287687] text-[#287687] hover:text-white border border-[#C8E6E1] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-[#CBA258]" />
                        <span className="hidden md:inline">Change Photo</span>
                      </button>

                      {/* Featured Toggle Button */}
                      <button
                        onClick={() => onSetFeatured(c.id)}
                        title={c.isFeatured ? "Featured Course" : "Set as Featured Course"}
                        className={`p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                          c.isFeatured 
                            ? 'bg-[#287687] text-white border-[#1C5B69]' 
                            : 'bg-white text-gray-600 border-gray-300 hover:bg-[#E2F1EE]'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${c.isFeatured ? 'fill-white' : ''}`} />
                      </button>

                      {/* Publish / Unpublish Toggle */}
                      <button
                        onClick={() => onUpdateCourse(c.id, { isPublished: !c.isPublished })}
                        title={c.isPublished ? "Unpublish Course" : "Publish Course"}
                        className={`p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                          c.isPublished 
                            ? 'bg-[#E2F1EE] text-[#287687] border-[#C8E6E1]' 
                            : 'bg-gray-200 text-gray-600 border-gray-300'
                        }`}
                      >
                        {c.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleStartEdit(c)}
                        title="Edit Course Details"
                        className="p-2 rounded-xl bg-white text-[#287687] border border-[#C8E6E1] hover:bg-[#E2F1EE] transition-all cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => onDeleteCourse(c.id)}
                        title="Delete Course"
                        className="p-2 rounded-xl bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CREATE / EDIT FORM */}
          {(activeTab === 'create' || activeTab === 'edit') && (
            <form onSubmit={handleSaveCourse} className="space-y-4">
              
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-bold text-[#102A36]">
                  {activeTab === 'create' ? 'Add New Healing Program' : `Editing: ${editingCourse?.name}`}
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                  Course Name *
                </label>
                <input
                  type="text"
                  required
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  placeholder="e.g. Somatic Breathwork & Energetic Release"
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#C8E6E1] text-sm focus:outline-none focus:border-[#287687]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={formState.category}
                    onChange={(e) => setFormState({ ...formState, category: e.target.value as CourseCategory })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#C8E6E1] text-xs font-semibold focus:outline-none focus:border-[#287687]"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                    Level
                  </label>
                  <select
                    value={formState.level}
                    onChange={(e) => setFormState({ ...formState, level: e.target.value as CourseLevel })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#C8E6E1] text-xs font-semibold focus:outline-none focus:border-[#287687]"
                  >
                    {LEVELS.map(lvl => (
                      <option key={lvl} value={lvl}>{lvl}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                    Mode
                  </label>
                  <select
                    value={formState.mode}
                    onChange={(e) => setFormState({ ...formState, mode: e.target.value as CourseMode })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#C8E6E1] text-xs font-semibold focus:outline-none focus:border-[#287687]"
                  >
                    {MODES.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    required
                    value={formState.price}
                    onChange={(e) => setFormState({ ...formState, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#C8E6E1] text-sm focus:outline-none focus:border-[#287687]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                    Original Price ($)
                  </label>
                  <input
                    type="number"
                    value={formState.originalPrice}
                    onChange={(e) => setFormState({ ...formState, originalPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#C8E6E1] text-sm focus:outline-none focus:border-[#287687]"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={formState.duration}
                    onChange={(e) => setFormState({ ...formState, duration: e.target.value })}
                    placeholder="e.g. 4 Weeks"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#C8E6E1] text-sm focus:outline-none focus:border-[#287687]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  value={formState.shortDescription}
                  onChange={(e) => setFormState({ ...formState, shortDescription: e.target.value })}
                  placeholder="Catchy 2-sentence overview for catalogue card..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#C8E6E1] text-sm focus:outline-none focus:border-[#287687]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                  Full Description & Syllabus Overview
                </label>
                <textarea
                  rows={4}
                  value={formState.fullDescription}
                  onChange={(e) => setFormState({ ...formState, fullDescription: e.target.value })}
                  placeholder="Detailed program journey..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#C8E6E1] text-sm focus:outline-none focus:border-[#287687]"
                />
              </div>

              {/* Course Image Picker with 30+ Presets, Local File Upload, and Custom Links */}
              <CourseImagePicker
                selectedUrl={formState.image || ''}
                onSelectUrl={(url) => setFormState({ ...formState, image: url, bannerImage: url })}
              />

              {/* Toggles */}
              <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.isFeatured}
                    onChange={(e) => setFormState({ ...formState, isFeatured: e.target.checked })}
                    className="w-4 h-4 rounded text-[#287687]"
                  />
                  <span>Mark as Featured Program</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.isPublished}
                    onChange={(e) => setFormState({ ...formState, isPublished: e.target.checked })}
                    className="w-4 h-4 rounded text-[#287687]"
                  />
                  <span>Publish to Website Catalogue</span>
                </label>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="w-1/3 py-3 rounded-full bg-white text-[#102A36] text-xs font-semibold border border-[#C8E6E1] cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="w-2/3 py-3 rounded-full bg-[#287687] hover:bg-[#1C5B69] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{activeTab === 'create' ? 'Add Course to Catalogue' : 'Save Changes'}</span>
                </button>
              </div>

            </form>
          )}

        </div>

      </div>

      {/* QUICK IMAGE CHANGER MODAL */}
      {quickImageCourse && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
          onClick={() => setQuickImageCourse(null)}
        >
          <div 
            className="w-full max-w-2xl bg-white rounded-3xl border border-[#C8E6E1] shadow-2xl overflow-hidden text-[#102A36] max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 bg-[#102A36] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/10 text-[#CBA258]">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#CBA258] block">
                    Catalogue Box Image Update
                  </span>
                  <h3 className="font-serif text-lg font-bold line-clamp-1">
                    {quickImageCourse.name}
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => setQuickImageCourse(null)}
                className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification message */}
            {quickImageSuccessMsg && (
              <div className="p-3 bg-teal-50 border-b border-teal-200 text-teal-800 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>{quickImageSuccessMsg}</span>
              </div>
            )}

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              <div className="p-3 bg-[#EEF7F5] rounded-xl border border-[#C8E6E1] text-xs text-[#287687] font-medium flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#287687]" />
                <div>
                  <strong>Quick Catalogue Image Update:</strong> Select from 40+ presets, paste any Unsplash image link, or upload a photo directly from your device. Click <strong>"Save & Apply to Catalogue Box"</strong> below to update immediately.
                </div>
              </div>

              {/* CourseImagePicker */}
              <CourseImagePicker
                selectedUrl={quickImageTempUrl}
                onSelectUrl={(url) => setQuickImageTempUrl(url)}
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setQuickImageCourse(null)}
                className="px-5 py-2.5 rounded-full bg-white text-gray-600 hover:bg-gray-100 border border-gray-300 text-xs font-semibold cursor-pointer transition-all"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveQuickImage}
                className="px-6 py-2.5 rounded-full bg-[#287687] hover:bg-[#102A36] text-white text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer transition-all"
              >
                <Check className="w-4 h-4 text-[#CBA258]" />
                <span>Save & Apply to Catalogue Box</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
