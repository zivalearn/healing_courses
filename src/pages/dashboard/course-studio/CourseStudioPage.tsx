import React, { useState, useEffect } from 'react';
import { Course, SupabaseCourse, CreateCourseInput } from '../../../models/course';
import { Lesson } from '../../../models/lesson';
import { courseService, mapSupabaseToCourse } from '../../../services/courseService';
import { CourseSidebar } from './CourseSidebar';
import { CourseContent } from './CourseContent';
import { CourseSettings } from './CourseSettings';
import { LoadingState } from './LoadingState';
import { CoursePreview } from '../../../components/CoursePreview';
import {
  Sparkles,
  ArrowLeft,
  Globe,
  Lock,
  Plus,
  Save,
  CheckCircle,
  X,
  Eye,
  Settings,
  Layers,
  BookOpen,
} from 'lucide-react';

export const CourseStudioPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCoursePreviewOpen, setIsCoursePreviewOpen] = useState(false);
  const [activeStudioTab, setActiveStudioTab] = useState<'curriculum' | 'settings'>('curriculum');

  // New Course Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseCategory, setNewCourseCategory] = useState('Healing');
  const [newCoursePrice, setNewCoursePrice] = useState(99);
  const [newCourseDescription, setNewCourseDescription] = useState('');
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadCourses = async () => {
    setIsLoading(true);
    const list = await courseService.getAllCourses();
    setCourses(list || []);
    if (list && list.length > 0 && !selectedCourse) {
      setSelectedCourse(list[0]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle.trim()) return;
    setIsCreatingCourse(true);

    const slug = newCourseTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const input: CreateCourseInput = {
      title: newCourseTitle.trim(),
      slug,
      category: newCourseCategory,
      price: Number(newCoursePrice),
      short_description: newCourseDescription.trim(),
      status: 'draft',
    };

    const { data, error } = await courseService.createCourse(input);
    setIsCreatingCourse(false);

    if (data) {
      showToast('Course created successfully!');
      setIsCreateModalOpen(false);
      setNewCourseTitle('');
      setNewCourseDescription('');
      await loadCourses();
      const mapped = mapSupabaseToCourse(data);
      setSelectedCourse(mapped);
    } else if (error) {
      alert(`Error creating course: ${error.message}`);
    }
  };

  const handleToggleCourseStatus = async () => {
    if (!selectedCourse) return;
    const nextStatus = selectedCourse.isPublished ? 'draft' : 'published';
    await courseService.updateCourse(selectedCourse.id, {
      status: nextStatus,
    });
    setSelectedCourse({
      ...selectedCourse,
      isPublished: !selectedCourse.isPublished,
      status: nextStatus as any,
    });
    showToast(`Course status updated to ${nextStatus.toUpperCase()}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingState message="Initializing Kajabi Course Studio..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden font-sans">
      {/* Studio Header Bar */}
      <header className="h-12 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0 z-40 text-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-200 font-semibold text-xs shadow-2xs">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold tracking-tight text-slate-100">Course Studio</span>
            <span className="hidden sm:inline-block text-[10px] text-slate-400 bg-slate-800/80 border border-slate-700/80 px-2 py-0.2 rounded font-mono">
              Curriculum Editor
            </span>
          </div>
        </div>

        {/* Status & Preview Actions */}
        {selectedCourse && (
          <div className="flex items-center gap-2">
            {/* View Tab Switcher */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded-md border border-slate-700/80">
              <button
                onClick={() => setActiveStudioTab('curriculum')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  activeStudioTab === 'curriculum'
                    ? 'bg-slate-700 text-white shadow-2xs font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Curriculum</span>
              </button>
              <button
                onClick={() => setActiveStudioTab('settings')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  activeStudioTab === 'settings'
                    ? 'bg-slate-700 text-white shadow-2xs font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </button>
            </div>

            <button
              onClick={() => setIsCoursePreviewOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-2xs cursor-pointer"
              title="Launch Complete Student Preview Mode"
            >
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>Preview</span>
            </button>

            <button
              onClick={handleToggleCourseStatus}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedCourse.isPublished
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
              }`}
            >
              {selectedCourse.isPublished ? (
                <>
                  <Globe className="w-3 h-3 text-emerald-400" />
                  <span>Published</span>
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>Draft</span>
                </>
              )}
            </button>
          </div>
        )}
      </header>

      {/* Course Student Preview Mode Overlay */}
      {isCoursePreviewOpen && selectedCourse && (
        <CoursePreview
          course={selectedCourse}
          initialLessonId={selectedLesson?.id}
          onClose={() => setIsCoursePreviewOpen(false)}
        />
      )}

      {/* Main Studio Work Area */}
      <div className="flex flex-1 overflow-hidden relative">
        <CourseSidebar
          selectedCourse={selectedCourse}
          coursesList={courses}
          onSelectCourse={(course) => {
            setSelectedCourse(course);
            setSelectedLesson(null);
          }}
          selectedLessonId={selectedLesson?.id || null}
          onSelectLesson={(lesson) => {
            setSelectedLesson(lesson);
            setActiveStudioTab('curriculum');
          }}
          onRefreshCourse={loadCourses}
          onOpenCreateCourseModal={() => setIsCreateModalOpen(true)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {activeStudioTab === 'settings' && selectedCourse ? (
          <div className="flex-1 overflow-y-auto bg-slate-100 p-4 sm:p-6">
            <CourseSettings
              course={selectedCourse}
              onCourseUpdated={(updatedCourse) => {
                setSelectedCourse(updatedCourse);
                showToast('Course settings updated successfully!');
                loadCourses();
              }}
            />
          </div>
        ) : (
          <CourseContent
            course={selectedCourse}
            selectedLesson={selectedLesson}
            onRefreshLesson={loadCourses}
            onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          />
        )}
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-2xl border border-slate-700 shadow-2xl flex items-center gap-2.5 z-50 animate-in fade-in slide-in-from-bottom-3 text-xs font-medium">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modal: Create Course */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-5 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 mb-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Create New Course
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Course Title *
                </label>
                <input
                  type="text"
                  required
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                  placeholder="e.g. Somatic Sound & Energy Healing"
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newCourseCategory}
                    onChange={(e) => setNewCourseCategory(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-white focus:outline-none focus:border-slate-900"
                  >
                    <option value="Healing">Healing</option>
                    <option value="Certification">Certification</option>
                    <option value="Personal Growth">Personal Growth</option>
                    <option value="Energy Healing">Energy Healing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newCoursePrice}
                    onChange={(e) => setNewCoursePrice(Number(e.target.value))}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  value={newCourseDescription}
                  onChange={(e) => setNewCourseDescription(e.target.value)}
                  placeholder="Brief summary for students..."
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCourse || !newCourseTitle.trim()}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-md shadow-2xs disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isCreatingCourse ? 'Creating...' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseStudioPage;
