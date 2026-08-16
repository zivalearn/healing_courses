import React, { useState, useEffect, useMemo } from 'react';
import { Course } from '../../models/course';
import { Section } from '../../models/section';
import { Lesson } from '../../models/lesson';
import { LessonBlock } from '../../models/lessonBlock';
import { sectionService } from '../../services/sectionService';
import { lessonService } from '../../services/lessonService';
import { lessonBlockService } from '../../services/lessonBlockService';
import {
  getLessonProgress,
  upsertProgress,
} from '../../services/lessonProgressService';
import {
  toggleBookmark,
  isBookmarked,
  addBookmark,
  removeBookmark,
} from '../../services/bookmarkService';
import { createCertificate, getUserCertificates } from '../../services/certificateService';
import { Certificate } from '../../types/certificate';
import { StudentBlockRenderer } from './StudentBlockRenderer';
import { StudentNotes } from './StudentNotes';
import { StudentDiscussions } from './StudentDiscussions';
import { StudentAnnouncements } from './StudentAnnouncements';
import { CertificateViewer } from './CertificateViewer';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Circle,
  Bookmark,
  BookOpen,
  Clock,
  Sparkles,
  ArrowLeft,
  Search,
  Menu,
  X,
  Award,
  MessageSquare,
  Bell,
  FileText,
  Loader2,
  ShieldCheck,
  Lock,
} from 'lucide-react';

interface StudentLessonPlayerProps {
  course: Course;
  userId?: string;
  studentName?: string;
  initialLessonId?: string | null;
  onClose?: () => void;
}

interface SectionWithLessons extends Section {
  lessons: Lesson[];
}

export const StudentLessonPlayer: React.FC<StudentLessonPlayerProps> = ({
  course,
  userId = 'demo-student-id',
  studentName = 'Seeker',
  initialLessonId = null,
  onClose,
}) => {
  // Navigation & Data
  const [sectionsWithLessons, setSectionsWithLessons] = useState<SectionWithLessons[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessonBlocks, setLessonBlocks] = useState<LessonBlock[]>([]);
  const [isLoadingCourse, setIsLoadingCourse] = useState<boolean>(true);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState<boolean>(false);

  // Student Progress & Bookmarks State
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [bookmarkedLessonIds, setBookmarkedLessonIds] = useState<Set<string>>(new Set());
  const [isCurrentBookmarked, setIsCurrentBookmarked] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active Bottom Tab
  const [activeBottomTab, setActiveBottomTab] = useState<'content' | 'notes' | 'discussions' | 'announcements' | 'certificate'>('content');

  // Certificate Modal State
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState<boolean>(false);

  // Section Collapsible State
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Auto-expand section containing the active lesson
  useEffect(() => {
    if (selectedLesson && selectedLesson.section_id) {
      setExpandedSections((prev) => ({
        ...prev,
        [selectedLesson.section_id]: true,
      }));
    }
  }, [selectedLesson?.id, selectedLesson?.section_id]);

  // 1. Fetch Curriculum & Resume Student Progress
  useEffect(() => {
    const initPlayer = async () => {
      setIsLoadingCourse(true);
      try {
        // Fetch Sections & Lessons
        const { data: sections } = await sectionService.getSectionsByCourse(course.id);
        const sectionList = sections || [];

        const fullSections: SectionWithLessons[] = await Promise.all(
          sectionList.map(async (sec) => {
            const { data: lessons } = await lessonService.getLessonsBySection(sec.id, course.id);
            return {
              ...sec,
              lessons: lessons || [],
            };
          })
        );

        setSectionsWithLessons(fullSections);

        // Expand all sections by default on initial load
        const initialExpanded: Record<string, boolean> = {};
        fullSections.forEach((s) => {
          initialExpanded[s.id] = true;
        });
        setExpandedSections(initialExpanded);

        // Fetch User Saved Progress
        const { data: userProgress } = await getLessonProgress(userId);
        const completedSet = new Set<string>();
        let lastViewedLessonId: string | null = null;

        if (userProgress && userProgress.length > 0) {
          userProgress.forEach((p) => {
            if (p.is_completed) {
              completedSet.add(p.lesson_id);
            }
          });
          // Find most recent viewed lesson
          lastViewedLessonId = userProgress[0].lesson_id;
        }
        setCompletedLessonIds(completedSet);

        // Select initial, resumed, or first unlocked lesson
        const allLessons = fullSections.flatMap((s) => s.lessons);
        let targetLesson: Lesson | null = null;

        if (initialLessonId) {
          targetLesson = allLessons.find((l) => l.id === initialLessonId) || null;
        } else if (lastViewedLessonId) {
          targetLesson = allLessons.find((l) => l.id === lastViewedLessonId) || null;
        }

        if (!targetLesson && allLessons.length > 0) {
          // Pick first unlocked lesson or first lesson
          targetLesson = allLessons.find((l) => !l.is_locked) || allLessons[0];
        }

        setSelectedLesson(targetLesson);

        // Load existing certificate if completed
        const { data: userCerts } = await getUserCertificates(userId);
        const existingCert = userCerts?.find((c) => c.course_id === course.id);
        if (existingCert) {
          setCertificate(existingCert);
        }
      } catch (err) {
        console.error('Failed to initialize student lesson player:', err);
      } finally {
        setIsLoadingCourse(false);
      }
    };

    initPlayer();
  }, [course.id, userId, initialLessonId]);

  // 2. Fetch Lesson Blocks when selectedLesson changes & update last_viewed_at progress
  useEffect(() => {
    if (!selectedLesson) {
      setLessonBlocks([]);
      return;
    }

    const loadBlocksAndProgress = async () => {
      setIsLoadingBlocks(true);
      try {
        const { data: blocks } = await lessonBlockService.getBlocksByLesson(selectedLesson.id, course.id);
        setLessonBlocks(blocks || []);

        // Record autosave last_viewed_at in Supabase
        await upsertProgress({
          user_id: userId,
          lesson_id: selectedLesson.id,
          is_completed: completedLessonIds.has(selectedLesson.id),
          progress_percentage: completedLessonIds.has(selectedLesson.id) ? 100 : 50,
          last_viewed_at: new Date().toISOString(),
        });

        // Check bookmark status
        const { isBookmarked: bmStatus } = await isBookmarked(userId, selectedLesson.id);
        setIsCurrentBookmarked(bmStatus);
      } catch (err) {
        console.error('Failed to load lesson blocks:', err);
      } finally {
        setIsLoadingBlocks(false);
      }
    };

    loadBlocksAndProgress();
  }, [selectedLesson?.id]);

  // Flatten lessons list for next/prev navigation
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

  // Overall Completion %
  const totalLessonsCount = flatLessonsList.length;
  const completedCount = completedLessonIds.size;
  const overallProgressPercent =
    totalLessonsCount > 0 ? Math.round((completedCount / totalLessonsCount) * 100) : 0;

  // Mark Lesson Complete Handler
  const handleToggleLessonComplete = async (lessonId: string) => {
    const isCompletedNow = !completedLessonIds.has(lessonId);

    setCompletedLessonIds((prev) => {
      const next = new Set(prev);
      if (isCompletedNow) {
        next.add(lessonId);
      } else {
        next.delete(lessonId);
      }
      return next;
    });

    // Save to Supabase DB
    await upsertProgress({
      user_id: userId,
      lesson_id: lessonId,
      is_completed: isCompletedNow,
      progress_percentage: isCompletedNow ? 100 : 0,
    });

    // Check if course is 100% completed -> Unlock Certificate
    const newCompletedCount = isCompletedNow ? completedCount + 1 : completedCount - 1;
    if (newCompletedCount >= totalLessonsCount && totalLessonsCount > 0 && !certificate) {
      const { data: newCert } = await createCertificate({
        user_id: userId,
        course_id: course.id,
      });
      if (newCert) {
        setCertificate(newCert);
        setIsCertificateModalOpen(true);
      }
    }

    // Auto advance if completed
    if (isCompletedNow && nextLesson) {
      setSelectedLesson(nextLesson);
    }
  };

  // Toggle Bookmark Handler
  const handleToggleBookmark = async () => {
    if (!selectedLesson) return;

    const { isBookmarked: nextState } = await toggleBookmark(userId, selectedLesson.id);
    setIsCurrentBookmarked(nextState);

    setBookmarkedLessonIds((prev) => {
      const next = new Set(prev);
      if (nextState) {
        next.add(selectedLesson.id);
      } else {
        next.delete(selectedLesson.id);
      }
      return next;
    });
  };

  if (isLoadingCourse) {
    return (
      <div className="fixed inset-0 z-50 bg-[#EEF7F5] flex flex-col items-center justify-center space-y-4">
        <Sparkles className="w-10 h-10 text-[#287687] animate-spin" />
        <p className="text-sm font-bold text-[#102A36]">Preparing Your Student Learning Workspace...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 text-slate-100 flex flex-col overflow-hidden font-sans">
      {/* 1. TOP LMS NAVIGATION BAR */}
      <header className="h-16 bg-slate-950 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Exit Player</span>
            </button>
          )}

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
            title="Toggle Curriculum Sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="truncate max-w-xs sm:max-w-md">
            <h2 className="font-serif font-bold text-sm text-white truncate">
              {course.title || course.name}
            </h2>
            <p className="text-[11px] text-slate-400 truncate">
              {selectedLesson ? selectedLesson.title : 'Select a lesson'}
            </p>
          </div>
        </div>

        {/* Course Completion Badge / Certificate Button */}
        <div className="flex items-center gap-3">
          {overallProgressPercent === 100 && (
            <button
              onClick={() => setIsCertificateModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-all flex items-center gap-1.5 shadow-md animate-bounce cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>Claim Certificate</span>
            </button>
          )}

          <div className="hidden md:flex items-center gap-3 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-2xl">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Course Progress</span>
              <span className="text-xs font-bold text-indigo-400">{overallProgressPercent}% Complete</span>
            </div>
            <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-500 rounded-full"
                style={{ width: `${overallProgressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* 2. MAIN PLAYER CONTENT LAYOUT */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* SIDEBAR: Course Sections & Lessons Tree */}
        <aside
          className={`${
            isSidebarOpen ? 'translate-x-0 w-80' : '-translate-x-full w-0'
          } transition-all duration-300 ease-in-out bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 z-10 absolute md:relative inset-y-0 left-0`}
        >
          {/* Search Input */}
          <div className="p-3 border-b border-slate-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lessons..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Section Accordions & Lesson List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {sectionsWithLessons.map((section, secIdx) => {
              const matchingLessons = section.lessons.filter((l) =>
                l.title.toLowerCase().includes(searchQuery.toLowerCase())
              );

              if (searchQuery && matchingLessons.length === 0) return null;

              const isExpanded = expandedSections[section.id] ?? true;
              const completedInSection = section.lessons.filter((l) => completedLessonIds.has(l.id)).length;

              return (
                <div key={section.id} className="space-y-1 bg-slate-900/40 rounded-2xl border border-slate-800/80 overflow-hidden">
                  {/* Section Collapsible Header */}
                  <button
                    onClick={() =>
                      setExpandedSections((prev) => ({
                        ...prev,
                        [section.id]: !prev[section.id],
                      }))
                    }
                    className="w-full px-3 py-2.5 bg-slate-900/90 hover:bg-slate-900 flex items-center justify-between text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[10px] font-extrabold uppercase text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-900 shrink-0">
                        Section {secIdx + 1}
                      </span>
                      <h4 className="text-xs font-bold text-slate-200 truncate">{section.title}</h4>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-[10px] font-semibold text-slate-400">
                      <span>
                        {completedInSection}/{section.lessons.length}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Lessons List */}
                  {isExpanded && (
                    <div className="p-1.5 space-y-1">
                      {(searchQuery ? matchingLessons : section.lessons).map((lesson) => {
                        const isSelected = selectedLesson?.id === lesson.id;
                        const isDone = completedLessonIds.has(lesson.id);

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => {
                              setSelectedLesson(lesson);
                              if (window.innerWidth < 768) setIsSidebarOpen(false);
                            }}
                            className={`w-full text-left p-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-md font-bold'
                                : isDone
                                ? 'bg-slate-900/80 text-emerald-300 hover:bg-slate-800'
                                : 'text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              {isDone ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : lesson.is_locked ? (
                                <Lock className="w-3.5 h-3.5 text-amber-500/80 shrink-0" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-600 shrink-0" />
                              )}
                              <span className="truncate">{lesson.title}</span>
                            </div>

                            {lesson.estimated_duration ? (
                              <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1 font-semibold">
                                <Clock className="w-3 h-3" />
                                {lesson.estimated_duration}m
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* MAIN LESSON VIEWPORT & TABBED DRAWER */}
        <main className="flex-1 bg-slate-900 overflow-y-auto p-4 sm:p-8 space-y-6">
          {selectedLesson ? (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* LESSON HEADER CARD */}
              <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-950/60 border border-indigo-800 px-2.5 py-0.5 rounded-full">
                        Active Lesson
                      </span>
                      {selectedLesson.estimated_duration && (
                        <span className="text-xs text-slate-400 flex items-center gap-1 font-semibold">
                          <Clock className="w-3.5 h-3.5" /> {selectedLesson.estimated_duration} Minutes
                        </span>
                      )}
                    </div>
                    <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                      {selectedLesson.title}
                    </h1>
                  </div>

                  {/* Top Lesson Controls (Bookmark & Mark Completed) */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleToggleBookmark}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isCurrentBookmarked
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                      title={isCurrentBookmarked ? 'Bookmarked' : 'Bookmark Lesson'}
                    >
                      <Bookmark className="w-4 h-4 fill-current" />
                    </button>

                    <button
                      onClick={() => handleToggleLessonComplete(selectedLesson.id)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer ${
                        completedLessonIds.has(selectedLesson.id)
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {completedLessonIds.has(selectedLesson.id)
                          ? 'Completed'
                          : 'Mark Completed & Next'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Next / Previous Quick Jump Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-900 text-xs">
                  {prevLesson ? (
                    <button
                      onClick={() => setSelectedLesson(prevLesson)}
                      className="text-slate-400 hover:text-indigo-400 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" /> Previous: {prevLesson.title}
                    </button>
                  ) : (
                    <span />
                  )}

                  {nextLesson && (
                    <button
                      onClick={() => setSelectedLesson(nextLesson)}
                      className="text-slate-400 hover:text-indigo-400 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      Next: {nextLesson.title} <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* LESSON BLOCKS RENDERER */}
              {isLoadingBlocks ? (
                <div className="py-16 text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
                  <p className="text-xs text-slate-400 font-semibold">Loading Lesson Content Blocks...</p>
                </div>
              ) : lessonBlocks.length === 0 ? (
                <div className="p-8 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-2">
                  <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-300">No content added to this lesson yet.</h4>
                  <p className="text-xs text-slate-500">Instructor is updating the course material.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {lessonBlocks.map((block) => (
                    <StudentBlockRenderer
                      key={block.id}
                      block={block}
                      userId={userId}
                      onBlockCompleted={() => handleToggleLessonComplete(selectedLesson.id)}
                    />
                  ))}
                </div>
              )}

              {/* BOTTOM INTERACTIVE STUDY TABS (Notes, Discussions, Announcements, Certificate) */}
              <div className="pt-8 space-y-4">
                <div className="flex border-b border-slate-800 gap-6 text-xs font-bold text-slate-400">
                  <button
                    onClick={() => setActiveBottomTab('content')}
                    className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                      activeBottomTab === 'content'
                        ? 'border-indigo-500 text-indigo-400'
                        : 'border-transparent hover:text-white'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Lesson Content</span>
                  </button>

                  <button
                    onClick={() => setActiveBottomTab('notes')}
                    className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                      activeBottomTab === 'notes'
                        ? 'border-indigo-500 text-indigo-400'
                        : 'border-transparent hover:text-white'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Notes</span>
                  </button>

                  <button
                    onClick={() => setActiveBottomTab('discussions')}
                    className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                      activeBottomTab === 'discussions'
                        ? 'border-indigo-500 text-indigo-400'
                        : 'border-transparent hover:text-white'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Q&A Discussion</span>
                  </button>

                  <button
                    onClick={() => setActiveBottomTab('announcements')}
                    className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                      activeBottomTab === 'announcements'
                        ? 'border-indigo-500 text-indigo-400'
                        : 'border-transparent hover:text-white'
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                    <span>Announcements</span>
                  </button>
                </div>

                {/* Tab Views */}
                {activeBottomTab === 'notes' && (
                  <StudentNotes
                    userId={userId}
                    lessonId={selectedLesson.id}
                    lessonTitle={selectedLesson.title}
                  />
                )}

                {activeBottomTab === 'discussions' && (
                  <StudentDiscussions
                    userId={userId}
                    lessonId={selectedLesson.id}
                    studentName={studentName}
                  />
                )}

                {activeBottomTab === 'announcements' && (
                  <StudentAnnouncements courseId={course.id} />
                )}
              </div>
            </div>
          ) : (
            <div className="py-20 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-400">Select a lesson from the curriculum sidebar to start learning.</p>
            </div>
          )}
        </main>
      </div>

      {/* CERTIFICATE MODAL */}
      {isCertificateModalOpen && certificate && (
        <CertificateViewer
          certificate={certificate}
          studentName={studentName}
          courseTitle={course.title || course.name}
          onClose={() => setIsCertificateModalOpen(false)}
        />
      )}
    </div>
  );
};
