import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ZivaLayout } from '../layouts/ZivaLayout';
import { useZivaAuth } from '../contexts/ZivaAuthContext';
import { zivaStudentService } from '../services/zivaStudentService';
import { zivaCourseService } from '../services/zivaCourseService';
import { storageService } from '../../services/storageService';
import { ZivaEnrollment, ZivaCourse, ZivaCertificate, ZivaNote, ZivaAnnouncement, ZivaDiscussion, ZivaBookmark } from '../types';
import { ZivaCertificateModal } from '../components/ZivaCertificateModal';
import {
  BookOpen,
  Award,
  Clock,
  Play,
  CheckCircle,
  ArrowRight,
  Sparkles,
  FileText,
  Megaphone,
  MessageSquare,
  BarChart2,
  Bookmark,
  Calendar,
  Zap,
  Trash2,
  Eye,
  Search,
  Filter,
  X
} from 'lucide-react';

export const ZivaStudentDashboard: React.FC = () => {
  const { user } = useZivaAuth();
  const navigate = useNavigate();

  const [enrollments, setEnrollments] = useState<ZivaEnrollment[]>([]);
  const [coursesMap, setCoursesMap] = useState<Record<string, ZivaCourse>>({});
  const [certificates, setCertificates] = useState<ZivaCertificate[]>([]);
  const [notes, setNotes] = useState<ZivaNote[]>([]);
  const [bookmarks, setBookmarks] = useState<ZivaBookmark[]>([]);
  const [announcements, setAnnouncements] = useState<ZivaAnnouncement[]>([]);
  const [discussions, setDiscussions] = useState<ZivaDiscussion[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [courseSearch, setCourseSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in-progress' | 'completed'>('all');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'courses' | 'certificates' | 'notes' | 'bookmarks' | 'announcements' | 'stats'>('courses');

  // Toast banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Certificate Modal State
  const [selectedCert, setSelectedCert] = useState<ZivaCertificate | null>(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      const userEnrollments = zivaStudentService.getEnrollments(user.id);
      const userCerts = zivaStudentService.getCertificates(user.id);
      const userNotes = zivaStudentService.getNotes(user.id);
      const userBookmarks = zivaStudentService.getBookmarks(user.id);
      const annList = zivaStudentService.getAnnouncements();
      const allCourses = await zivaCourseService.getAllCourses();

      const map: Record<string, ZivaCourse> = {};
      allCourses.forEach(c => { map[c.id] = c; });

      setEnrollments(userEnrollments);
      setCertificates(userCerts);
      setNotes(userNotes);
      setBookmarks(userBookmarks);
      setAnnouncements(annList);
      setCoursesMap(map);
      setLoading(false);
    }

    loadData();
  }, [user]);

  if (!user) return null;

  // Find most recently accessed enrollment for Resume Hero
  const activeEnrollment = enrollments.length > 0 
    ? [...enrollments].sort((a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime())[0]
    : null;

  const activeCourse = activeEnrollment ? coursesMap[activeEnrollment.courseId] : null;

  const totalCompletedLessons = enrollments.reduce((acc, e) => acc + (e.completedLessonIds?.length || 0), 0);

  return (
    <ZivaLayout>
      {/* HEADER BAR */}
      <div className="bg-black border-b border-gray-900 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-serif text-pink-500 uppercase tracking-widest font-bold">
              Student LMS Portal
            </span>
            <h1 className="text-3xl sm:text-5xl font-serif text-amber-300 font-bold">
              Welcome back, {user.fullName}
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Track your transformational course progress, notes, and certificates.
            </p>
          </div>

          <Link
            to="/ziva/catalogue"
            className="inline-flex items-center gap-2 bg-[#FF2E93] hover:bg-pink-600 text-white font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-md shadow-lg transition-all shrink-0"
          >
            Explore Catalogue
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* TOAST BANNER */}
        {toastMessage && (
          <div className="bg-gradient-to-r from-amber-500 to-[#FF2E93] text-black font-bold text-xs py-3 px-6 rounded-2xl shadow-xl flex items-center justify-between">
            <span>✨ {toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-black hover:opacity-75">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* RESUME LEARNING HERO CARD */}
        {activeEnrollment && activeCourse && (
          <div className="bg-gradient-to-r from-amber-950/60 via-black to-pink-950/40 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
            <Sparkles className="w-32 h-32 text-amber-500/10 absolute right-4 bottom-4 pointer-events-none" />

            <div className="flex items-center space-x-6">
              <img
                src={activeCourse.thumbnailUrl}
                alt={activeCourse.title}
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover border border-amber-500/30 shrink-0"
              />
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded bg-amber-500 text-black">
                  Resume Learning
                </span>
                <h2 className="text-2xl font-serif font-bold text-white line-clamp-1">
                  {activeCourse.title}
                </h2>
                <div className="flex items-center space-x-4 text-xs text-gray-400">
                  <span>{activeEnrollment.progressPercent}% Completed</span>
                  <span>•</span>
                  <span>{activeEnrollment.completedLessonIds.length} lessons completed</span>
                </div>

                <div className="w-full sm:w-64 bg-neutral-900 h-2 rounded-full overflow-hidden border border-gray-800">
                  <div
                    className="bg-gradient-to-r from-amber-400 to-[#FF2E93] h-full"
                    style={{ width: `${activeEnrollment.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <Link
              to={`/ziva/player/${activeCourse.id}`}
              className="w-full md:w-auto bg-[#FF2E93] hover:bg-pink-600 text-white font-bold text-xs uppercase tracking-widest px-8 py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer shrink-0 transition-transform hover:scale-105"
            >
              <Play className="w-4 h-4 fill-white" />
              Continue Masterclass
            </Link>
          </div>
        )}

        {/* NAVIGATION TABS */}
        <div className="border-b border-gray-900 flex space-x-6 text-xs font-bold uppercase tracking-widest overflow-x-auto">
          <button
            onClick={() => setActiveTab('courses')}
            className={`py-3 border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'courses' ? 'border-[#FF2E93] text-pink-400' : 'border-transparent text-gray-400'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Enrolled Courses ({enrollments.length})
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`py-3 border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'certificates' ? 'border-[#FF2E93] text-pink-400' : 'border-transparent text-gray-400'
            }`}
          >
            <Award className="w-4 h-4" /> Certificates ({certificates.length})
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-3 border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'notes' ? 'border-[#FF2E93] text-pink-400' : 'border-transparent text-gray-400'
            }`}
          >
            <FileText className="w-4 h-4" /> Lesson Notes ({notes.length})
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`py-3 border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'bookmarks' ? 'border-[#FF2E93] text-pink-400' : 'border-transparent text-gray-400'
            }`}
          >
            <Bookmark className="w-4 h-4" /> Bookmarks ({bookmarks.length})
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`py-3 border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'announcements' ? 'border-[#FF2E93] text-pink-400' : 'border-transparent text-gray-400'
            }`}
          >
            <Megaphone className="w-4 h-4" /> Announcements ({announcements.length})
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-3 border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'stats' ? 'border-[#FF2E93] text-pink-400' : 'border-transparent text-gray-400'
            }`}
          >
            <BarChart2 className="w-4 h-4" /> Learning Stats
          </button>
        </div>

        {/* TAB 1: ENROLLED COURSES */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            {/* SEARCH AND FILTER BAR */}
            {enrollments.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-neutral-950 p-4 rounded-2xl border border-gray-900">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search your masterclasses..."
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    className="w-full bg-black border border-gray-800 text-white text-xs pl-9 pr-3 py-2.5 rounded-xl focus:ring-1 focus:ring-[#FF2E93] outline-none"
                  />
                </div>

                <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider">
                  <span className="text-gray-500 text-[10px] mr-1">Filter:</span>
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-lg border text-[10px] cursor-pointer ${
                      statusFilter === 'all' ? 'bg-[#FF2E93] text-white border-pink-500' : 'bg-black text-gray-400 border-gray-800'
                    }`}
                  >
                    All ({enrollments.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('in-progress')}
                    className={`px-3 py-1.5 rounded-lg border text-[10px] cursor-pointer ${
                      statusFilter === 'in-progress' ? 'bg-[#FF2E93] text-white border-pink-500' : 'bg-black text-gray-400 border-gray-800'
                    }`}
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => setStatusFilter('completed')}
                    className={`px-3 py-1.5 rounded-lg border text-[10px] cursor-pointer ${
                      statusFilter === 'completed' ? 'bg-[#FF2E93] text-white border-pink-500' : 'bg-black text-gray-400 border-gray-800'
                    }`}
                  >
                    Completed
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="py-12 text-center text-amber-400">Loading your courses...</div>
            ) : enrollments.length === 0 ? (
              <div className="bg-neutral-950 border border-gray-800 rounded-2xl p-8 text-center space-y-4">
                <Sparkles className="w-10 h-10 text-amber-400 mx-auto" />
                <h3 className="text-xl font-serif text-white">No enrolled masterclasses yet</h3>
                <p className="text-xs text-gray-400 max-w-md mx-auto">
                  Explore Ziva's confidence, communication, and public speaking masterclasses to start learning.
                </p>
                <Link
                  to="/ziva/catalogue"
                  className="inline-block bg-[#FF2E93] text-white font-bold text-xs uppercase tracking-widest px-6 py-2.5 rounded"
                >
                  Browse Catalogue
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrollments
                  .filter(enr => {
                    const course = coursesMap[enr.courseId];
                    if (!course) return false;

                    if (courseSearch && !course.title.toLowerCase().includes(courseSearch.toLowerCase())) {
                      return false;
                    }

                    if (statusFilter === 'in-progress' && enr.progressPercent >= 100) return false;
                    if (statusFilter === 'completed' && enr.progressPercent < 100) return false;

                    return true;
                  })
                  .map((enr) => {
                    const course = coursesMap[enr.courseId];
                    if (!course) return null;

                    return (
                      <div
                        key={enr.id}
                        className="bg-neutral-950 border border-amber-500/30 rounded-2xl overflow-hidden hover:border-pink-500 transition-all flex flex-col justify-between shadow-xl"
                      >
                        <div>
                          <div className="h-44 overflow-hidden relative">
                            <img
                              src={storageService.getCourseImageUrl(course.thumbnailUrl || (course as any).image)}
                              alt={course.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop';
                              }}
                            />
                            <div className="absolute top-2 right-2 bg-black/80 border border-amber-400 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded">
                              {enr.progressPercent}% Completed
                            </div>
                          </div>

                          <div className="p-5 space-y-3">
                            <h3 className="text-lg font-serif font-bold text-white line-clamp-1">
                              {course.title}
                            </h3>

                            {/* PROGRESS BAR */}
                            <div className="space-y-1">
                              <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden border border-gray-800">
                                <div
                                  className="bg-gradient-to-r from-amber-400 to-[#FF2E93] h-full transition-all duration-500"
                                  style={{ width: `${enr.progressPercent}%` }}
                                />
                              </div>
                              <p className="text-[10px] text-gray-400 text-right">
                                {enr.completedLessonIds.length} lessons finished
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="p-5 pt-0 border-t border-gray-900 mt-2">
                          <Link
                            to={`/ziva/player/${course.id}`}
                            className="w-full bg-[#FF2E93] hover:bg-pink-600 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-md flex items-center justify-center gap-2 transition-colors"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" />
                            {enr.progressPercent > 0 ? 'Resume Learning' : 'Start Masterclass'}
                          </Link>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CERTIFICATES */}
        {activeTab === 'certificates' && (
          <div className="space-y-6">
            {certificates.length === 0 ? (
              <div className="bg-neutral-950 border border-gray-900 rounded-2xl p-8 text-center text-gray-400 text-xs">
                Complete 100% of any masterclass to earn your official Ziva certification!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {certificates.map((cert) => (
                  <div key={cert.id} className="bg-gradient-to-br from-amber-950/40 via-black to-black border-2 border-amber-500/50 p-6 rounded-2xl space-y-4 relative overflow-hidden shadow-xl">
                    <Award className="w-20 h-20 text-amber-500/10 absolute right-4 bottom-4 pointer-events-none" />
                    <div>
                      <span className="text-[10px] text-amber-400 font-bold tracking-widest uppercase">Certified Achievement</span>
                      <h3 className="text-xl font-serif font-bold text-white mt-1">{cert.courseTitle}</h3>
                      <p className="text-xs text-gray-400 mt-1">Certificate ID: <span className="font-mono text-amber-300">{cert.certificateNumber}</span></p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Issued on: {new Date(cert.issuedAt).toLocaleDateString()}</p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedCert(cert);
                        setIsCertModalOpen(true);
                      }}
                      className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase px-5 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer"
                    >
                      <Eye className="w-4 h-4" /> View Certificate
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: NOTES */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            {notes.length === 0 ? (
              <div className="bg-neutral-950 border border-gray-900 rounded-2xl p-8 text-center text-gray-400 text-xs">
                No personal notes taken yet. Open any lesson player to record notes!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {notes.map((n) => (
                  <div key={n.id} className="bg-neutral-950 border border-gray-900 p-5 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-900 pb-2">
                      <span className="text-xs font-serif font-bold text-amber-300">{n.lessonTitle || 'Lesson Note'}</span>
                      <button
                        onClick={() => {
                          zivaStudentService.deleteNote(n.id);
                          setNotes(notes.filter(item => item.id !== n.id));
                          showToast('Note deleted');
                        }}
                        className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed italic">{n.content}</p>
                    <div className="pt-2 flex items-center justify-between text-[10px] text-gray-500 border-t border-gray-900">
                      <span>Updated: {new Date(n.updatedAt).toLocaleDateString()}</span>
                      <Link to={`/ziva/player/${n.courseId}`} className="text-pink-400 font-bold hover:underline">
                        Open Lesson →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: BOOKMARKS */}
        {activeTab === 'bookmarks' && (
          <div className="space-y-4">
            {bookmarks.length === 0 ? (
              <div className="bg-neutral-950 border border-gray-900 rounded-2xl p-8 text-center text-gray-400 text-xs">
                No bookmarked lessons saved yet. Click the bookmark icon in any masterclass player to save key lessons!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookmarks.map((bm) => {
                  const course = coursesMap[bm.courseId];
                  return (
                    <div key={bm.id} className="bg-neutral-950 border border-amber-500/30 p-5 rounded-2xl flex items-center justify-between gap-4 shadow-xl">
                      <div className="space-y-1">
                        <span className="text-[10px] text-pink-400 font-bold uppercase tracking-wider">{course?.title || 'Masterclass'}</span>
                        <h4 className="text-sm font-serif font-bold text-white">{bm.lessonTitle}</h4>
                        <p className="text-[10px] text-gray-500">Saved on {new Date(bm.createdAt).toLocaleDateString()}</p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <Link
                          to={`/ziva/player/${bm.courseId}`}
                          className="bg-[#FF2E93] hover:bg-pink-600 text-white font-bold text-[10px] uppercase px-3.5 py-2 rounded flex items-center gap-1 cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-white" /> Open
                        </Link>
                        <button
                          onClick={() => {
                            zivaStudentService.toggleBookmark(bm.userId, bm.courseId, bm.lessonId, bm.lessonTitle);
                            setBookmarks(bookmarks.filter(b => b.id !== bm.id));
                            showToast('Bookmark removed');
                          }}
                          className="text-gray-500 hover:text-red-400 p-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ANNOUNCEMENTS */}
        {activeTab === 'announcements' && (
          <div className="space-y-4">
            {announcements.map((ann) => (
              <div key={ann.id} className="bg-neutral-950 border border-amber-500/30 p-6 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-pink-400 bg-pink-950 px-2 py-0.5 rounded border border-pink-500/30">
                    {ann.createdBy || 'Instructor Announcement'}
                  </span>
                  <span className="text-[10px] text-gray-500">{new Date(ann.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 className="text-base font-serif font-bold text-white">{ann.title}</h3>
                <p className="text-xs text-gray-300 leading-relaxed">{ann.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* TAB 5: STATS */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-neutral-950 border border-amber-500/30 p-6 rounded-2xl space-y-2">
              <Zap className="w-6 h-6 text-amber-400" />
              <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">Completed Lessons</p>
              <p className="text-3xl font-serif font-bold text-amber-300">{totalCompletedLessons}</p>
            </div>
            <div className="bg-neutral-950 border border-pink-500/30 p-6 rounded-2xl space-y-2">
              <BookOpen className="w-6 h-6 text-pink-400" />
              <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">Enrolled Masterclasses</p>
              <p className="text-3xl font-serif font-bold text-pink-400">{enrollments.length}</p>
            </div>
            <div className="bg-neutral-950 border border-emerald-500/30 p-6 rounded-2xl space-y-2">
              <Award className="w-6 h-6 text-emerald-400" />
              <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">Earned Certificates</p>
              <p className="text-3xl font-serif font-bold text-emerald-400">{certificates.length}</p>
            </div>
          </div>
        )}

      </div>

      {/* CERTIFICATE MODAL */}
      {selectedCert && (
        <ZivaCertificateModal
          certificate={selectedCert}
          isOpen={isCertModalOpen}
          onClose={() => setIsCertModalOpen(false)}
        />
      )}
    </ZivaLayout>
  );
};
