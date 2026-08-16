import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ZivaLayout } from '../layouts/ZivaLayout';
import { useZivaAuth } from '../contexts/ZivaAuthContext';
import { zivaCourseService } from '../services/zivaCourseService';
import { zivaStudentService } from '../services/zivaStudentService';
import { ZivaCourse, ZivaSection, ZivaLesson, ZivaCertificate, ZivaNote, ZivaDiscussion } from '../types';
import { ZivaStudentBlockRenderer } from '../components/ZivaStudentBlockRenderer';
import { ZivaCertificateModal } from '../components/ZivaCertificateModal';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Play,
  Award,
  Bookmark,
  FileText,
  MessageSquare,
  Download,
  BookOpen,
  ArrowLeft,
  Menu,
  X,
  Search,
  Sparkles,
  Send,
  Trash2,
  Lock
} from 'lucide-react';

export const ZivaStudentPlayer: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useZivaAuth();

  const [course, setCourse] = useState<ZivaCourse | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<ZivaLesson | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [bookmarked, setBookmarked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Player Bottom Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'discussions' | 'downloads'>('overview');

  // Notes state
  const [notes, setNotes] = useState<ZivaNote[]>([]);
  const [noteContent, setNoteContent] = useState('');

  // Discussions state
  const [discussions, setDiscussions] = useState<ZivaDiscussion[]>([]);
  const [newDiscussion, setNewDiscussion] = useState('');

  // Certificate Modal State
  const [certificate, setCertificate] = useState<ZivaCertificate | null>(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  // Section Accordions
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    async function load() {
      if (!courseId) return;
      const data = await zivaCourseService.getCourseByIdOrSlug(courseId);
      if (data) {
        setCourse(data);

        // Expand first section
        if (data.sections?.[0]) {
          setExpandedSections({ [data.sections[0].id]: true });
        }

        let completedSet = new Set<string>();
        if (user) {
          const enrollments = zivaStudentService.getEnrollments(user.id);
          const enr = enrollments.find(e => e.courseId === data.id || e.courseId === courseId);
          if (enr) {
            completedSet = new Set(enr.completedLessonIds);
            setCompletedLessonIds(completedSet);
          }

          // Check certificates
          const certs = zivaStudentService.getCertificates(user.id);
          const foundCert = certs.find(c => c.courseId === data.id || c.courseId === courseId);
          if (foundCert) {
            setCertificate(foundCert);
          }
        }

        // Collect all lessons to determine resume target
        const lessonsList: ZivaLesson[] = [];
        data.sections?.forEach(s => s.lessons?.forEach(l => lessonsList.push(l)));

        // Resume target: first uncompleted lesson, or default to first lesson
        const firstUncompleted = lessonsList.find(l => !completedSet.has(l.id));
        if (firstUncompleted) {
          setSelectedLesson(firstUncompleted);
        } else if (lessonsList[0]) {
          setSelectedLesson(lessonsList[0]);
        }
      }
    }

    load();
  }, [courseId, user]);

  // Load Notes, Discussions & Bookmark status when lesson changes
  useEffect(() => {
    if (user && course && selectedLesson) {
      const userNotes = zivaStudentService.getNotes(user.id, course.id, selectedLesson.id);
      setNotes(userNotes);
      setNoteContent(userNotes[0]?.content || '');

      const discList = zivaStudentService.getDiscussions(course.id, selectedLesson.id);
      setDiscussions(discList);

      const isBm = zivaStudentService.isBookmarked(user.id, course.id, selectedLesson.id);
      setBookmarked(isBm);
    }
  }, [selectedLesson, user, course]);

  if (!course) {
    return (
      <ZivaLayout>
        <div className="py-20 text-center text-amber-400">Loading Masterclass Player...</div>
      </ZivaLayout>
    );
  }

  // Calculate total lessons & downloadable resources
  const allLessons: ZivaLesson[] = [];
  course.sections?.forEach(s => s.lessons?.forEach(l => allLessons.push(l)));
  const totalLessonsCount = allLessons.length;

  const downloadableBlocks = selectedLesson?.blocks?.filter(b => b.type === 'attachment' || Boolean(b.media_url)) || [];

  const currentLessonIndex = allLessons.findIndex(l => l.id === selectedLesson?.id);
  const progressPercent = totalLessonsCount > 0 
    ? Math.round((completedLessonIds.size / totalLessonsCount) * 100) 
    : 0;

  const handleBookmarkToggle = () => {
    if (!user || !course || !selectedLesson) return;
    const state = zivaStudentService.toggleBookmark(user.id, course.id, selectedLesson.id, selectedLesson.title);
    setBookmarked(state);
    showToast(state ? 'Lesson bookmarked!' : 'Bookmark removed');
  };

  const handleMarkComplete = async () => {
    if (!user || !selectedLesson) return;

    const newSet = new Set(completedLessonIds);
    newSet.add(selectedLesson.id);
    setCompletedLessonIds(newSet);

    const updatedEnr = await zivaStudentService.markLessonComplete(
      user.id,
      course.id,
      selectedLesson.id,
      totalLessonsCount
    );

    showToast('Lesson marked as completed!');

    if (updatedEnr.progressPercent >= 100) {
      const cert = zivaStudentService.issueCertificate(user.id, course.id, course.title, user.fullName);
      setCertificate(cert);
      setIsCertModalOpen(true);
    } else if (currentLessonIndex < allLessons.length - 1) {
      // Auto advance
      setSelectedLesson(allLessons[currentLessonIndex + 1]);
    }
  };

  const handleSaveNote = () => {
    if (!user || !selectedLesson || !noteContent.trim()) return;
    const note = zivaStudentService.saveNote(
      user.id,
      course.id,
      selectedLesson.id,
      noteContent,
      selectedLesson.title
    );
    setNotes([note]);
    showToast('Lesson note saved!');
  };

  const handlePostDiscussion = () => {
    if (!user || !selectedLesson || !newDiscussion.trim()) return;
    const post = zivaStudentService.postDiscussion({
      courseId: course.id,
      lessonId: selectedLesson.id,
      userId: user.id,
      userName: user.fullName,
      content: newDiscussion,
    });
    setDiscussions([post, ...discussions]);
    setNewDiscussion('');
    showToast('Discussion comment posted!');
  };

  return (
    <ZivaLayout>
      {/* TOP LEARNING BAR */}
      <div className="bg-black border-b border-gray-900 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Link to="/ziva/student" className="p-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <span className="text-[10px] font-serif text-pink-500 font-bold uppercase tracking-widest">
                {course.category} Masterclass
              </span>
              <h1 className="text-lg font-serif font-bold text-amber-300 line-clamp-1">{course.title}</h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-3">
              <div className="text-right">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Progress</p>
                <p className="text-xs font-serif text-amber-400 font-bold">{progressPercent}% Completed</p>
              </div>
              <div className="w-24 bg-neutral-900 h-2 rounded-full overflow-hidden border border-gray-800">
                <div
                  className="bg-gradient-to-r from-amber-400 to-[#FF2E93] h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {certificate && (
              <button
                onClick={() => setIsCertModalOpen(true)}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase px-4 py-2 rounded flex items-center gap-1.5 cursor-pointer"
              >
                <Award className="w-4 h-4" /> View Certificate
              </button>
            )}

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 bg-neutral-900 text-gray-300 hover:text-white rounded border border-gray-800 lg:hidden cursor-pointer"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-[85vh]">
        
        {/* SIDEBAR CURRICULUM NAVIGATION */}
        <div
          className={`${
            sidebarOpen ? 'block' : 'hidden'
          } lg:block lg:col-span-4 bg-neutral-950 border-r border-gray-900 p-4 space-y-4 max-h-[85vh] overflow-y-auto`}
        >
          <div className="space-y-3 border-b border-gray-900 pb-3">
            <h3 className="text-xs font-serif font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-pink-500" />
              Masterclass Curriculum ({allLessons.length} Lessons)
            </h3>
            
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search lessons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black border border-gray-800 text-white text-xs pl-8 pr-3 py-2 rounded focus:ring-1 focus:ring-[#FF2E93] outline-none"
              />
            </div>
          </div>

          <div className="space-y-3">
            {course.sections?.map((section) => {
              const isExpanded = expandedSections[section.id] ?? true;
              const filteredLessons = section.lessons?.filter(l => 
                l.title.toLowerCase().includes(searchQuery.toLowerCase())
              );

              return (
                <div key={section.id} className="border border-gray-900 rounded-xl overflow-hidden bg-black">
                  <button
                    onClick={() => setExpandedSections({ ...expandedSections, [section.id]: !isExpanded })}
                    className="w-full p-3 text-left font-serif text-xs font-bold text-amber-200 bg-neutral-900/60 flex items-center justify-between cursor-pointer hover:bg-neutral-900"
                  >
                    <span className="truncate">{section.title}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-pink-400" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </button>

                  {isExpanded && (
                    <div className="divide-y divide-gray-900">
                      {filteredLessons?.map((les) => {
                        const isCompleted = completedLessonIds.has(les.id);
                        const isSelected = selectedLesson?.id === les.id;

                        return (
                          <button
                            key={les.id}
                            onClick={() => setSelectedLesson(les)}
                            className={`w-full p-3 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#FF2E93] text-white font-bold'
                                : 'hover:bg-neutral-900/80 text-gray-300'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 truncate">
                              {isCompleted ? (
                                <CheckCircle className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-emerald-400'}`} />
                              ) : (
                                <Play className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-amber-400'}`} />
                              )}
                              <span className="truncate">{les.title}</span>
                            </div>
                            <span className="text-[10px] opacity-70 shrink-0 ml-2">
                              {les.estimated_duration || 10}m
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* MAIN PLAYER AREA */}
        <div className="lg:col-span-8 bg-black p-4 sm:p-8 space-y-8 overflow-y-auto max-h-[85vh]">
          {selectedLesson ? (
            <div className="space-y-8">
              
              {/* TOAST BANNER */}
              {toastMessage && (
                <div className="bg-gradient-to-r from-amber-500 to-[#FF2E93] text-black font-bold text-xs py-2.5 px-4 rounded-xl shadow-lg flex items-center justify-between animate-fadeIn">
                  <span>✨ {toastMessage}</span>
                  <button onClick={() => setToastMessage(null)} className="text-black hover:opacity-75">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* LESSON TITLE & ACTIONS HEADER */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-900 pb-4">
                <div>
                  <p className="text-[10px] text-pink-500 font-bold uppercase tracking-widest">
                    Lesson {currentLessonIndex + 1} of {allLessons.length}
                  </p>
                  <h2 className="text-2xl font-serif font-bold text-white mt-1">
                    {selectedLesson.title}
                  </h2>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleBookmarkToggle}
                    className={`p-2 rounded border text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                      bookmarked ? 'bg-amber-950 text-amber-300 border-amber-500/50' : 'bg-neutral-900 text-gray-400 border-gray-800 hover:text-white'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
                    <span className="hidden sm:inline">{bookmarked ? 'Bookmarked' : 'Bookmark'}</span>
                  </button>

                  <button
                    onClick={handleMarkComplete}
                    className="bg-[#FF2E93] hover:bg-pink-600 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded shadow-lg flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {completedLessonIds.has(selectedLesson.id) ? 'Completed ✓' : 'Mark as Complete'}
                  </button>
                </div>
              </div>

              {/* BLOCKS RENDERER */}
              <div className="space-y-6">
                {selectedLesson.blocks && selectedLesson.blocks.length > 0 ? (
                  selectedLesson.blocks.map((block) => (
                    <ZivaStudentBlockRenderer
                      key={block.id}
                      block={block}
                      courseId={course.id}
                      lessonId={selectedLesson.id}
                    />
                  ))
                ) : (
                  <div className="bg-neutral-950 border border-gray-900 rounded-2xl p-8 text-center text-gray-400 text-xs">
                    No content blocks found for this lesson.
                  </div>
                )}
              </div>

              {/* NAVIGATION BUTTONS */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-900">
                <button
                  disabled={currentLessonIndex <= 0}
                  onClick={() => setSelectedLesson(allLessons[currentLessonIndex - 1])}
                  className="bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 text-white text-xs font-bold uppercase px-4 py-2.5 rounded flex items-center gap-1 cursor-pointer border border-gray-800"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous Lesson
                </button>

                <button
                  disabled={currentLessonIndex >= allLessons.length - 1}
                  onClick={() => setSelectedLesson(allLessons[currentLessonIndex + 1])}
                  className="bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 text-white text-xs font-bold uppercase px-4 py-2.5 rounded flex items-center gap-1 cursor-pointer border border-gray-800"
                >
                  Next Lesson <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* BOTTOM INTERACTIVE TABS */}
              <div className="bg-neutral-950 border border-gray-900 rounded-2xl overflow-hidden mt-8">
                <div className="flex border-b border-gray-900 bg-black text-xs font-bold uppercase tracking-wider">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-5 py-3 flex items-center gap-1.5 cursor-pointer border-b-2 ${
                      activeTab === 'overview' ? 'border-[#FF2E93] text-pink-400' : 'border-transparent text-gray-400'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" /> Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('notes')}
                    className={`px-5 py-3 flex items-center gap-1.5 cursor-pointer border-b-2 ${
                      activeTab === 'notes' ? 'border-[#FF2E93] text-pink-400' : 'border-transparent text-gray-400'
                    }`}
                  >
                    <FileText className="w-4 h-4" /> My Notes
                  </button>
                  <button
                    onClick={() => setActiveTab('discussions')}
                    className={`px-5 py-3 flex items-center gap-1.5 cursor-pointer border-b-2 ${
                      activeTab === 'discussions' ? 'border-[#FF2E93] text-pink-400' : 'border-transparent text-gray-400'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" /> Discussions
                  </button>
                  <button
                    onClick={() => setActiveTab('downloads')}
                    className={`px-5 py-3 flex items-center gap-1.5 cursor-pointer border-b-2 ${
                      activeTab === 'downloads' ? 'border-[#FF2E93] text-pink-400' : 'border-transparent text-gray-400'
                    }`}
                  >
                    <Download className="w-4 h-4" /> Resources ({downloadableBlocks.length})
                  </button>
                </div>

                <div className="p-6">
                  {activeTab === 'overview' && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-serif font-bold text-amber-300">Lesson Summary</h4>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        {selectedLesson.description || 'Focus on implementing key communication frameworks in your daily vocal and mindset practice.'}
                      </p>
                    </div>
                  )}

                  {activeTab === 'notes' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-serif font-bold text-amber-300">Personal Lesson Notes</h4>
                        <button
                          onClick={handleSaveNote}
                          className="bg-[#FF2E93] hover:bg-pink-600 text-white font-bold text-[10px] uppercase tracking-wider px-4 py-1.5 rounded cursor-pointer"
                        >
                          Save Note
                        </button>
                      </div>
                      <textarea
                        rows={4}
                        placeholder="Write down key takeaways, personal insights, or action steps for this lesson..."
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        className="w-full bg-black border border-gray-800 text-white text-xs p-3 rounded focus:ring-1 focus:ring-[#FF2E93] outline-none"
                      />
                    </div>
                  )}

                  {activeTab === 'discussions' && (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <h4 className="text-sm font-serif font-bold text-amber-300">Lesson Discussions Q&A</h4>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Ask a question or share feedback on this lesson..."
                            value={newDiscussion}
                            onChange={(e) => setNewDiscussion(e.target.value)}
                            className="flex-1 bg-black border border-gray-800 text-white text-xs p-2.5 rounded focus:ring-1 focus:ring-[#FF2E93] outline-none"
                          />
                          <button
                            onClick={handlePostDiscussion}
                            className="bg-[#FF2E93] hover:bg-pink-600 text-white font-bold text-xs uppercase px-4 py-2.5 rounded flex items-center gap-1 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" /> Post
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {discussions.length === 0 ? (
                          <p className="text-xs text-gray-500 italic">No discussions yet. Be the first to start a conversation!</p>
                        ) : (
                          discussions.map((disc) => (
                            <div key={disc.id} className="bg-black p-4 rounded-xl border border-gray-900 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-amber-400">{disc.userName}</span>
                                <span className="text-[10px] text-gray-500">{new Date(disc.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-xs text-gray-300">{disc.content}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'downloads' && (
                    <div className="space-y-4">
                      <h4 className="text-sm font-serif font-bold text-amber-300">Downloadable Resources & Files</h4>
                      {downloadableBlocks.length === 0 ? (
                        <p className="text-xs text-gray-500 italic">No downloadable files attached to this lesson.</p>
                      ) : (
                        <div className="space-y-3">
                          {downloadableBlocks.map((blk) => (
                            <div key={blk.id} className="bg-black border border-gray-900 p-4 rounded-xl flex items-center justify-between gap-4">
                              <div className="flex items-center space-x-3">
                                <Download className="w-5 h-5 text-pink-500 shrink-0" />
                                <div>
                                  <p className="text-xs font-bold text-white">{blk.title || blk.file_name || 'Lesson Resource'}</p>
                                  <p className="text-[10px] text-gray-400">{blk.file_size || 'Resource file'}</p>
                                </div>
                              </div>
                              {blk.media_url && (
                                <a
                                  href={blk.media_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-neutral-900 hover:bg-neutral-800 border border-gray-800 text-white font-bold text-[10px] uppercase px-4 py-2 rounded flex items-center gap-1 shrink-0"
                                >
                                  Download <Download className="w-3 h-3 text-pink-400" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="py-20 text-center text-gray-500">
              Select a lesson from the left curriculum to begin learning.
            </div>
          )}
        </div>

      </div>

      {/* CERTIFICATE MODAL */}
      {certificate && (
        <ZivaCertificateModal
          certificate={certificate}
          isOpen={isCertModalOpen}
          onClose={() => setIsCertModalOpen(false)}
        />
      )}
    </ZivaLayout>
  );
};
