import React, { useState, useEffect } from 'react';
import { Announcement } from '../../types/announcement';
import { announcementService } from '../../services/announcementService';
import { courseService } from '../../services/courseService';
import { Course } from '../../models/course';
import { 
  Megaphone, 
  Search, 
  Filter, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  X,
  Trash2,
  Calendar
} from 'lucide-react';

export const AnnouncementsManagement: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // New Announcement Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCourseId, setNewCourseId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [ancRes, courseList] = await Promise.all([
      announcementService.getAllAnnouncements(),
      courseService.getAllCourses()
    ]);

    setAnnouncements(ancRes.data || []);
    setCourses(courseList || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter announcements
  const filteredAnnouncements = announcements.filter((a) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      (a.title || '').toLowerCase().includes(query) ||
      (a.content || '').toLowerCase().includes(query);

    const matchesCourse = courseFilter === 'all' || a.course_id === courseFilter;

    return matchesSearch && matchesCourse;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredAnnouncements.length / itemsPerPage) || 1;
  const paginatedAnnouncements = filteredAnnouncements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handlers
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newContent || !newCourseId) return;

    setSubmitting(true);
    const res = await announcementService.createAnnouncement({
      course_id: newCourseId,
      title: newTitle,
      content: newContent,
      is_published: true
    });

    if (res.data) {
      await loadData();
      setShowAddModal(false);
      setNewTitle('');
      setNewContent('');
      setNewCourseId('');
    }
    setSubmitting(false);
  };

  const handleTogglePublish = async (announcement: Announcement) => {
    if (announcement.is_published) {
      const res = await announcementService.unpublishAnnouncement(announcement.id);
      if (res.data) {
        setAnnouncements(prev => prev.map(a => a.id === announcement.id ? { ...a, is_published: false } : a));
      }
    } else {
      const res = await announcementService.publishAnnouncement(announcement.id);
      if (res.data) {
        setAnnouncements(prev => prev.map(a => a.id === announcement.id ? { ...a, is_published: true } : a));
      }
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (window.confirm('Delete this announcement permanently?')) {
      const res = await announcementService.deleteAnnouncement(id);
      if (!res.error) {
        setAnnouncements(prev => prev.filter(a => a.id !== id));
      }
    }
  };

  const getCourseTitle = (courseId: string) => {
    const course = courses.find(c => c.id === courseId || c.slug === courseId);
    return course ? (course.name || course.title) : courseId;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-[#102A36]">Announcements</h2>
          <p className="text-xs text-[#486D7A] mt-1">Publish important course updates, live stream notices, and batch start reminders.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-[#287687] hover:bg-[#1C5B69] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 text-[#CBA258]" />
          <span>New Announcement</span>
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="p-4 rounded-2xl bg-white border border-[#C8E6E1] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#486D7A] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search announcement title or message..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[#C8E6E1] bg-[#F7FCFA] text-[#102A36] focus:outline-none focus:ring-2 focus:ring-[#287687]"
          />
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2 text-xs text-[#486D7A] font-semibold">
            <Filter className="w-3.5 h-3.5 text-[#287687]" />
            <span>Course:</span>
          </div>
          <select
            value={courseFilter}
            onChange={(e) => {
              setCourseFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs px-3 py-2 rounded-xl border border-[#C8E6E1] bg-[#F7FCFA] text-[#102A36] font-semibold focus:outline-none focus:ring-2 focus:ring-[#287687]"
          >
            <option value="all">All Courses</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.name || c.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Announcements List */}
      <div className="bg-white rounded-2xl border border-[#C8E6E1] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#486D7A] flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#287687]" />
            <span className="text-xs font-semibold">Loading announcements...</span>
          </div>
        ) : paginatedAnnouncements.length === 0 ? (
          <div className="p-12 text-center text-[#486D7A]">
            <Megaphone className="w-10 h-10 mx-auto text-[#C8E6E1] mb-2" />
            <p className="text-sm font-bold text-[#102A36]">No announcements found</p>
            <p className="text-xs text-[#486D7A] mt-1">Click "New Announcement" above to post an update to enrolled students.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E2F1EE]">
            {paginatedAnnouncements.map((anc) => (
              <div key={anc.id} className="p-5 hover:bg-[#F7FCFA] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-bold uppercase tracking-wider">
                      {getCourseTitle(anc.course_id)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      anc.is_published ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {anc.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-base text-[#102A36]">{anc.title}</h3>
                  <p className="text-xs text-[#486D7A] line-clamp-2 leading-relaxed">{anc.content}</p>

                  <div className="text-[10px] text-[#486D7A] flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-[#287687]" />
                    <span>Posted: {anc.created_at ? new Date(anc.created_at).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => handleTogglePublish(anc)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                      anc.is_published
                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white'
                    }`}
                  >
                    {anc.is_published ? 'Unpublish' : 'Publish Now'}
                  </button>

                  <button
                    onClick={() => handleDeleteAnnouncement(anc.id)}
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete Announcement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Footer */}
        {filteredAnnouncements.length > 0 && (
          <div className="p-4 border-t border-[#C8E6E1] bg-[#F7FCFA] flex items-center justify-between">
            <span className="text-xs text-[#486D7A] font-medium">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAnnouncements.length)} of {filteredAnnouncements.length} announcements
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-2 rounded-lg border border-[#C8E6E1] bg-white text-[#102A36] disabled:opacity-40 hover:bg-[#EEF7F5] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-[#102A36] px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-2 rounded-lg border border-[#C8E6E1] bg-white text-[#102A36] disabled:opacity-40 hover:bg-[#EEF7F5] transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: New Announcement */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#C8E6E1] shadow-2xl w-full max-w-md p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#C8E6E1] pb-4">
              <h3 className="font-serif font-bold text-lg text-[#102A36] flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[#CBA258]" />
                Post Announcement
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-[#486D7A] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#102A36] mb-1">
                  Course Target <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={newCourseId}
                  onChange={(e) => setNewCourseId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#C8E6E1] bg-[#F7FCFA] text-[#102A36] focus:outline-none focus:ring-2 focus:ring-[#287687]"
                >
                  <option value="">Select course...</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#102A36] mb-1">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Live Masterclass Schedule Confirmed"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#C8E6E1] bg-[#F7FCFA] text-[#102A36] focus:outline-none focus:ring-2 focus:ring-[#287687]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#102A36] mb-1">
                  Content / Message <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Type the message for enrolled students..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#C8E6E1] bg-[#F7FCFA] text-[#102A36] focus:outline-none focus:ring-2 focus:ring-[#287687]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#C8E6E1] text-[#102A36] font-bold text-xs hover:bg-[#F7FCFA] cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#287687] hover:bg-[#1C5B69] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Publish Announcement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
