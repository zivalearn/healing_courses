import React, { useState, useEffect, useMemo } from 'react';
import { Course } from '../models/course';
import { Section } from '../models/section';
import { Lesson } from '../models/lesson';
import { LessonBlock } from '../models/lessonBlock';
import { sectionService } from '../services/sectionService';
import { lessonService } from '../services/lessonService';
import { lessonBlockService } from '../services/lessonBlockService';
import { storageService } from '../services/storageService';
import { QuizBlock } from './QuizBlock';
import {
  Monitor,
  Tablet,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Eye,
  Lock,
  BookOpen,
  Clock,
  Sparkles,
  ArrowLeft,
  X,
  FileText,
  Video,
  Music,
  Image as ImageIcon,
  Download,
  Code,
  CheckSquare,
  MessageSquare,
  ExternalLink,
  Loader2,
  Menu,
  ShieldAlert,
  Award,
} from 'lucide-react';

export type ViewportMode = 'desktop' | 'tablet' | 'mobile';

export interface CoursePreviewProps {
  course: Course;
  initialLessonId?: string | null;
  onClose?: () => void;
}

interface SectionWithLessons extends Section {
  lessons: Lesson[];
}

export const CoursePreview: React.FC<CoursePreviewProps> = ({
  course,
  initialLessonId = null,
  onClose,
}) => {
  // Device Preview Frame Mode
  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop');

  // Course Data Loading State
  const [sectionsWithLessons, setSectionsWithLessons] = useState<SectionWithLessons[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessonBlocks, setLessonBlocks] = useState<LessonBlock[]>([]);
  const [isLoadingCourseData, setIsLoadingCourseData] = useState<boolean>(true);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState<boolean>(false);

  // Student Progress Preview (Local State)
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Load Course Curriculum (Sections -> Lessons)
  useEffect(() => {
    const fetchCurriculum = async () => {
      setIsLoadingCourseData(true);
      try {
        const { data: sections } = await sectionService.getSectionsByCourse(course.id);
        const sectionList = sections || [];

        const fullSections: SectionWithLessons[] = await Promise.all(
          sectionList.map(async (sec) => {
            const { data: lessons } = await lessonService.getLessonsBySection(sec.id);
            return {
              ...sec,
              lessons: lessons || [],
            };
          })
        );

        setSectionsWithLessons(fullSections);

        // Flatten all lessons to find initial lesson
        const allLessons = fullSections.flatMap((s) => s.lessons);
        let targetLesson: Lesson | null = null;

        if (initialLessonId) {
          targetLesson = allLessons.find((l) => l.id === initialLessonId) || null;
        }

        if (!targetLesson && allLessons.length > 0) {
          targetLesson = allLessons[0];
        }

        setSelectedLesson(targetLesson);
      } catch (err) {
        console.error('Failed to load course preview curriculum:', err);
      } finally {
        setIsLoadingCourseData(false);
      }
    };

    fetchCurriculum();
  }, [course.id, initialLessonId]);

  // Load Blocks when selectedLesson changes
  useEffect(() => {
    if (!selectedLesson) {
      setLessonBlocks([]);
      return;
    }

    const fetchLessonBlocks = async () => {
      setIsLoadingBlocks(true);
      try {
        const { data: blocks } = await lessonBlockService.getBlocksByLesson(
          selectedLesson.id
        );
        setLessonBlocks(blocks || []);
      } catch (err) {
        console.error('Failed to load lesson blocks for preview:', err);
      } finally {
        setIsLoadingBlocks(false);
      }
    };

    fetchLessonBlocks();
  }, [selectedLesson?.id]);

  // Flatten all lessons in order for Prev/Next navigation
  const flatLessonsList = useMemo(() => {
    return sectionsWithLessons.flatMap((sec) => sec.lessons);
  }, [sectionsWithLessons]);

  const currentLessonIndex = useMemo(() => {
    if (!selectedLesson) return -1;
    return flatLessonsList.findIndex((l) => l.id === selectedLesson.id);
  }, [flatLessonsList, selectedLesson]);

  const prevLesson = currentLessonIndex > 0 ? flatLessonsList[currentLessonIndex - 1] : null;
  const nextLesson =
    currentLessonIndex >= 0 && currentLessonIndex < flatLessonsList.length - 1
      ? flatLessonsList[currentLessonIndex + 1]
      : null;

  // Progress metrics
  const totalLessonsCount = flatLessonsList.length;
  const completedCount = completedLessonIds.size;
  const progressPercent =
    totalLessonsCount > 0 ? Math.round((completedCount / totalLessonsCount) * 100) : 0;

  const toggleLessonCompletion = (lessonId: string) => {
    setCompletedLessonIds((prev) => {
      const next = new Set(prev);
      if (next.has(lessonId)) {
        next.delete(lessonId);
      } else {
        next.add(lessonId);
      }
      return next;
    });
  };

  // Helper to render static/interactive preview of standard lesson blocks
  const renderBlockPreview = (block: LessonBlock) => {
    const isReq = block.is_required;

    switch (block.type) {
      case 'quiz':
        return (
          <QuizBlock
            key={block.id}
            block={block}
            isStudentView={true}
          />
        );

      case 'video':
        return (
          <div key={block.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            {block.title && (
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Video className="w-4 h-4 text-purple-600" />
                {block.title}
                {isReq && (
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    Required
                  </span>
                )}
              </h4>
            )}
            {block.media_url && block.media_url.trim() ? (
              <div className="aspect-video w-full rounded-xl bg-slate-900 overflow-hidden shadow-sm flex items-center justify-center">
                {block.media_url.includes('youtube') || block.media_url.includes('vimeo') ? (
                  <iframe
                    src={block.media_url}
                    className="w-full h-full border-0"
                    title={block.title || 'Video player'}
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={storageService.getStorageUrl(block.media_url)}
                    controls
                    preload="metadata"
                    className="w-full h-full object-contain"
                  >
                    Your browser does not support HTML video playback.
                  </video>
                )}
              </div>
            ) : (
              <div className="p-8 bg-slate-100 rounded-xl text-center text-xs text-slate-500 font-mono">
                No video file attached.
              </div>
            )}
            {block.content && (
              <p className="text-xs text-slate-600 leading-relaxed pt-1">{block.content}</p>
            )}
          </div>
        );

      case 'audio':
        return (
          <div key={block.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            {block.title && (
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Music className="w-4 h-4 text-emerald-600" />
                {block.title}
              </h4>
            )}
            {block.media_url && block.media_url.trim() ? (
              <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 rounded-xl text-white space-y-2">
                <p className="text-xs font-medium text-slate-300">Audio Lecture Track</p>
                <audio controls src={storageService.getStorageUrl(block.media_url)} className="w-full accent-emerald-500">
                  Your browser does not support audio playback.
                </audio>
              </div>
            ) : (
              <div className="p-4 bg-slate-100 rounded-xl text-center text-xs text-slate-500 font-mono">
                No audio file attached.
              </div>
            )}
            {block.content && (
              <p className="text-xs text-slate-600 leading-relaxed">{block.content}</p>
            )}
          </div>
        );

      case 'image':
        return (
          <div key={block.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            {block.title && (
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                {block.title}
              </h4>
            )}
            {block.media_url && (
              <div className="rounded-xl overflow-hidden border border-slate-100 bg-slate-900">
                <img
                  src={block.media_url}
                  alt={block.title || 'Lesson graphic'}
                  className="w-full max-h-96 object-contain mx-auto"
                />
              </div>
            )}
            {block.content && (
              <p className="text-xs text-slate-600 leading-relaxed">{block.content}</p>
            )}
          </div>
        );

      case 'checklist':
        const checkItems = (block.content || '')
          .split('\n')
          .filter((line) => line.trim().length > 0);
        return (
          <div key={block.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-600" />
              {block.title || 'Lesson Checklist'}
            </h4>
            <div className="space-y-2 pt-1">
              {checkItems.map((item, idx) => (
                <label
                  key={idx}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50/50 text-xs text-slate-800 font-medium cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 shrink-0"
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'code':
        return (
          <div key={block.id} className="bg-slate-950 rounded-2xl border border-slate-800 p-5 shadow-md space-y-2 text-slate-200">
            {block.title && (
              <h4 className="text-xs font-mono font-bold text-indigo-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                <Code className="w-4 h-4" />
                {block.title}
              </h4>
            )}
            <pre className="p-3 bg-slate-900 rounded-xl text-xs font-mono overflow-x-auto text-emerald-400 leading-relaxed">
              <code>{block.content || '// Code snippet...'}</code>
            </pre>
          </div>
        );

      case 'download':
      case 'pdf':
        return (
          <div key={block.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Download className="w-4 h-4 text-rose-600" />
                {block.title || 'Downloadable Learning Resource'}
              </h4>
              {block.media_url && (
                <a
                  href={block.media_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-xl inline-flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open File
                </a>
              )}
            </div>
            {block.content && (
              <p className="text-xs text-slate-600 leading-relaxed">{block.content}</p>
            )}
          </div>
        );

      default:
        // Text / Paragraph / Reflection / Heading
        return (
          <div key={block.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2">
            {block.title && (
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                {block.title}
              </h3>
            )}
            {block.content && (
              <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                {block.content}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 text-slate-100 flex flex-col overflow-hidden select-none">
      {/* TOP BAR: Preview Controls & Mode Banner */}
      <header className="h-16 bg-slate-950 border-b border-slate-800 px-6 flex items-center justify-between shrink-0 z-20">
        {/* Left: Brand & Preview Status */}
        <div className="flex items-center gap-4">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Exit Preview</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-2.5">
            <span className="p-1.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Eye className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Student Preview Mode
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-amber-400" />
                  No Editing Allowed
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-xs">
                {course.title || course.name}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Device Viewport Switcher (Desktop, Tablet, Mobile) */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-2xl shadow-inner">
          <button
            onClick={() => setViewportMode('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewportMode === 'desktop'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Desktop Viewport"
          >
            <Monitor className="w-4 h-4" />
            <span className="hidden md:inline">Desktop</span>
          </button>

          <button
            onClick={() => setViewportMode('tablet')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewportMode === 'tablet'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Tablet Viewport (768px)"
          >
            <Tablet className="w-4 h-4" />
            <span className="hidden md:inline">Tablet</span>
          </button>

          <button
            onClick={() => setViewportMode('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewportMode === 'mobile'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Mobile Viewport (375px)"
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden md:inline">Mobile</span>
          </button>
        </div>

        {/* Right: Progress Preview Counter */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-3 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-2xl">
            <div className="text-right">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">
                Student Progress
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {completedCount} / {totalLessonsCount} Completed ({progressPercent}%)
              </span>
            </div>
            <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
            title="Toggle Curriculum Sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN VIEWPORT STAGING CONTAINER */}
      <div className="flex-1 bg-slate-900/90 overflow-hidden relative flex items-center justify-center p-2 sm:p-6">
        {/* Device Wrapper Container */}
        <div
          className={`h-full bg-slate-100 text-slate-900 rounded-3xl shadow-2xl border border-slate-800 flex overflow-hidden transition-all duration-300 ${
            viewportMode === 'desktop'
              ? 'w-full max-w-7xl'
              : viewportMode === 'tablet'
              ? 'w-[768px] max-h-[1024px] rounded-3xl border-8 border-slate-800 shadow-2xl ring-1 ring-slate-700'
              : 'w-[375px] max-h-[812px] rounded-3xl border-8 border-slate-800 shadow-2xl ring-1 ring-slate-700'
          }`}
        >
          {/* COURSE CURRICULUM NAVIGATION SIDEBAR */}
          {isSidebarOpen && (
            <aside
              className={`bg-white border-r border-slate-200/80 flex flex-col shrink-0 transition-all ${
                viewportMode === 'mobile'
                  ? 'w-full absolute inset-0 z-30'
                  : 'w-72 lg:w-80 relative'
              }`}
            >
              {/* Sidebar Header */}
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Course Curriculum
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {totalLessonsCount} Lessons • {completedCount} Done
                  </p>
                </div>

                {viewportMode === 'mobile' && (
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-1 hover:bg-slate-200 rounded-lg text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Progress Bar inside Sidebar */}
              <div className="px-4 py-3 bg-indigo-50/60 border-b border-indigo-100">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-900 mb-1">
                  <span>Course Completion</span>
                  <span className="font-mono">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-indigo-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Sections & Lessons Tree */}
              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {isLoadingCourseData ? (
                  <div className="p-6 text-center text-xs text-slate-400 space-y-2">
                    <Loader2 className="w-5 h-5 text-indigo-600 animate-spin mx-auto" />
                    <span>Loading Curriculum Data...</span>
                  </div>
                ) : sectionsWithLessons.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No curriculum sections found in this course.
                  </div>
                ) : (
                  sectionsWithLessons.map((section, sIdx) => (
                    <div key={section.id} className="space-y-1">
                      <div className="px-2 py-1 text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                        <span className="truncate">
                          Section {sIdx + 1}: {section.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {section.lessons.length}
                        </span>
                      </div>

                      <div className="space-y-1 pl-1">
                        {section.lessons.map((lesson) => {
                          const isSelected = selectedLesson?.id === lesson.id;
                          const isDone = completedLessonIds.has(lesson.id);

                          return (
                            <button
                              key={lesson.id}
                              onClick={() => {
                                setSelectedLesson(lesson);
                                if (viewportMode === 'mobile') {
                                  setIsSidebarOpen(false);
                                }
                              }}
                              className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between gap-2 ${
                                isSelected
                                  ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                                  : 'hover:bg-slate-100 text-slate-700 font-medium'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleLessonCompletion(lesson.id);
                                  }}
                                  className="shrink-0 text-slate-400 hover:text-emerald-500"
                                >
                                  {isDone ? (
                                    <CheckCircle2
                                      className={`w-4 h-4 ${
                                        isSelected ? 'text-white' : 'text-emerald-600'
                                      }`}
                                    />
                                  ) : (
                                    <Circle className="w-4 h-4 opacity-50" />
                                  )}
                                </button>
                                <span className="truncate">{lesson.title}</span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0 text-[10px]">
                                {lesson.is_preview && (
                                  <span
                                    className={`px-1.5 py-0.5 rounded font-mono ${
                                      isSelected
                                        ? 'bg-indigo-700 text-indigo-100'
                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    }`}
                                  >
                                    Free
                                  </span>
                                )}
                                {lesson.estimated_duration ? (
                                  <span className="opacity-70 font-mono">
                                    {lesson.estimated_duration}m
                                  </span>
                                ) : null}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </aside>
          )}

          {/* LESSON CONTENT STUDENT PREVIEW DISPLAY */}
          <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/80">
            {selectedLesson ? (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Lesson Header */}
                <div className="bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between shrink-0 shadow-2xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">
                        {selectedLesson.title}
                      </h2>
                      {selectedLesson.is_preview && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Free Preview Lesson
                        </span>
                      )}
                    </div>
                    {selectedLesson.estimated_duration ? (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5" />
                        Estimated completion time: {selectedLesson.estimated_duration} mins
                      </p>
                    ) : null}
                  </div>

                  {/* Mark Completed Toggle */}
                  <button
                    onClick={() => toggleLessonCompletion(selectedLesson.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      completedLessonIds.has(selectedLesson.id)
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-4 h-4 ${
                        completedLessonIds.has(selectedLesson.id)
                          ? 'text-emerald-600'
                          : 'text-slate-400'
                      }`}
                    />
                    <span>
                      {completedLessonIds.has(selectedLesson.id)
                        ? 'Completed'
                        : 'Mark Complete'}
                    </span>
                  </button>
                </div>

                {/* Lesson Blocks Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {isLoadingBlocks ? (
                    <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                      <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
                      <span>Rendering Lesson Blocks...</span>
                    </div>
                  ) : lessonBlocks.length === 0 ? (
                    <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-2">
                      <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                      <h4 className="text-sm font-bold text-slate-700">
                        No Blocks Created Yet
                      </h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        This lesson does not contain any content blocks yet. Switch back to Studio Editor to add content.
                      </p>
                    </div>
                  ) : (
                    lessonBlocks.map((block) => renderBlockPreview(block))
                  )}
                </div>

                {/* PREVIEW NAVIGATION FOOTER: Previous Lesson & Next Lesson */}
                <div className="bg-white border-t border-slate-200/80 px-6 py-3 flex items-center justify-between shrink-0 shadow-2xs">
                  {/* Previous Lesson Button */}
                  <button
                    disabled={!prevLesson}
                    onClick={() => prevLesson && setSelectedLesson(prevLesson)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-2 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <div className="text-left hidden sm:block">
                      <span className="block text-[10px] text-slate-400 font-normal">
                        Previous Lesson
                      </span>
                      <span className="truncate max-w-[140px] block">
                        {prevLesson ? prevLesson.title : 'None'}
                      </span>
                    </div>
                    <span className="sm:hidden">Previous</span>
                  </button>

                  {/* Lesson Counter */}
                  <span className="text-xs font-mono text-slate-500 font-semibold">
                    {currentLessonIndex >= 0 ? currentLessonIndex + 1 : 0} of{' '}
                    {totalLessonsCount}
                  </span>

                  {/* Next Lesson Button */}
                  <button
                    disabled={!nextLesson}
                    onClick={() => nextLesson && setSelectedLesson(nextLesson)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-2xs"
                  >
                    <div className="text-right hidden sm:block">
                      <span className="block text-[10px] text-indigo-200 font-normal">
                        Next Lesson
                      </span>
                      <span className="truncate max-w-[140px] block">
                        {nextLesson ? nextLesson.title : 'Finish'}
                      </span>
                    </div>
                    <span className="sm:hidden">Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6 text-center">
                <div className="space-y-3 max-w-sm">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto border border-indigo-100">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Select a Lesson to Preview
                  </h3>
                  <p className="text-xs text-slate-500">
                    Choose any lesson from the curriculum sidebar on the left to start student preview playback.
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default CoursePreview;
