import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ZivaLayout } from '../layouts/ZivaLayout';
import { zivaCourseService } from '../services/zivaCourseService';
import { zivaStudentService } from '../services/zivaStudentService';
import { 
  ZivaCourse, 
  ZivaEnrollment, 
  ZivaCertificate, 
  ZivaUserProfile, 
  ZivaCourseReview, 
  ZivaAnnouncement 
} from '../types';
import { ZivaCertificateModal } from '../components/ZivaCertificateModal';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Crown, 
  BookOpen, 
  Eye, 
  EyeOff, 
  Users, 
  CreditCard, 
  Award, 
  Star, 
  Megaphone, 
  BarChart2, 
  Search, 
  UserPlus, 
  ShieldAlert, 
  RotateCcw, 
  CheckCircle, 
  X, 
  Send,
  Copy,
  Filter,
  ArrowUpDown,
  CheckSquare,
  Square
} from 'lucide-react';

export const ZivaAdminDashboard: React.FC = () => {
  const [courses, setCourses] = useState<ZivaCourse[]>([]);
  const [enrollments, setEnrollments] = useState<ZivaEnrollment[]>([]);
  const [profiles, setProfiles] = useState<ZivaUserProfile[]>([]);
  const [certificates, setCertificates] = useState<ZivaCertificate[]>([]);
  const [reviews, setReviews] = useState<ZivaCourseReview[]>([]);
  const [announcements, setAnnouncements] = useState<ZivaAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<'analytics' | 'courses' | 'students' | 'enrollments' | 'certificates' | 'reviews' | 'announcements'>('courses');

  // Search & Filter & Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'published' | 'draft'>('All');
  const [sortBy, setSortBy] = useState<'title' | 'price' | 'created'>('title');

  // Bulk Selection
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);

  // Toast & Delete Modal
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deleteConfirmCourse, setDeleteConfirmCourse] = useState<ZivaCourse | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Modal States
  const [isManualEnrollModalOpen, setIsManualEnrollModalOpen] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [manualCourseId, setManualCourseId] = useState('');

  const [isNewAnnouncementModalOpen, setIsNewAnnouncementModalOpen] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');

  const [selectedCert, setSelectedCert] = useState<ZivaCertificate | null>(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  const [revokeCertId, setRevokeCertId] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

  useEffect(() => {
    async function loadData() {
      const allCourses = await zivaCourseService.getAllCourses();
      const allEnr = zivaStudentService.getAllEnrollments();
      const allProfs = zivaStudentService.getAllProfiles();
      const allCerts = zivaStudentService.getCertificates();
      const allRevs = zivaStudentService.getReviews();
      const allAnns = zivaStudentService.getAnnouncements();

      setCourses(allCourses);
      setEnrollments(allEnr);
      setProfiles(allProfs);
      setCertificates(allCerts);
      setReviews(allRevs);
      setAnnouncements(allAnns);
      if (allCourses.length > 0) setManualCourseId(allCourses[0].id);
      setLoading(false);
    }
    loadData();
  }, []);

  const safeCourses = Array.isArray(courses) ? courses : [];

  const handleCreateNewCourse = async () => {
    const newCourse = await zivaCourseService.saveCourse({
      title: 'New Ziva Executive Masterclass',
      category: 'Confidence',
      level: 'All Levels',
      price: 199,
      shortDescription: 'Enter short description for your new masterclass...',
      fullDescription: 'Enter comprehensive masterclass details...',
      isPublished: false,
    });
    showToast('New Masterclass Created');
    navigate(`/ziva/admin/course-builder/${newCourse.id}`);
  };

  const handleDeleteCourse = async (id: string) => {
    await zivaCourseService.deleteCourse(id);
    setCourses(safeCourses.filter((c) => c.id !== id));
    setSelectedCourseIds(selectedCourseIds.filter(cId => cId !== id));
    setDeleteConfirmCourse(null);
    showToast('Course deleted');
  };

  const handleDuplicateCourse = async (id: string) => {
    const dup = await zivaCourseService.duplicateCourse(id);
    if (dup) {
      setCourses([dup, ...safeCourses]);
      showToast('Course duplicated successfully');
    }
  };

  const handleTogglePublish = async (course: ZivaCourse) => {
    const updated = await zivaCourseService.saveCourse({
      ...course,
      isPublished: !course.isPublished,
    });
    setCourses(safeCourses.map((c) => (c.id === updated.id ? updated : c)));
    showToast(`Course ${updated.isPublished ? 'Published' : 'Unpublished'}`);
  };

  const handleToggleFeatured = async (course: ZivaCourse) => {
    const updated = await zivaCourseService.saveCourse({
      ...course,
      isFeatured: !course.isFeatured,
    });
    setCourses(safeCourses.map((c) => (c.id === updated.id ? updated : c)));
    showToast(`Course ${updated.isFeatured ? 'Featured' : 'Unfeatured'}`);
  };

  // Bulk Actions
  const handleSelectAll = (filteredList: ZivaCourse[]) => {
    if (selectedCourseIds.length === filteredList.length) {
      setSelectedCourseIds([]);
    } else {
      setSelectedCourseIds(filteredList.map(c => c.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCourseIds.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedCourseIds.length} courses?`)) {
      for (const id of selectedCourseIds) {
        await zivaCourseService.deleteCourse(id);
      }
      setCourses(safeCourses.filter(c => !selectedCourseIds.includes(c.id)));
      setSelectedCourseIds([]);
      showToast('Selected courses deleted');
    }
  };

  const handleBulkPublish = async (publish: boolean) => {
    if (selectedCourseIds.length === 0) return;
    const updatedList = await Promise.all(
      safeCourses.map(async (c) => {
        if (selectedCourseIds.includes(c.id)) {
          return await zivaCourseService.saveCourse({ ...c, isPublished: publish });
        }
        return c;
      })
    );
    setCourses(updatedList);
    setSelectedCourseIds([]);
    showToast(`Bulk ${publish ? 'Published' : 'Unpublished'} completed`);
  };

  // Manual Enroll
  const handleManualEnroll = () => {
    if (!manualEmail.trim() || !manualCourseId) return;
    const newEnr = zivaStudentService.adminEnrollStudent(manualEmail, manualCourseId);
    setEnrollments([newEnr, ...enrollments]);
    setIsManualEnrollModalOpen(false);
    setManualEmail('');
  };

  // Revoke Enrollment
  const handleRevokeEnrollment = (id: string) => {
    if (confirm('Are you sure you want to revoke this student enrollment?')) {
      zivaStudentService.revokeEnrollment(id);
      setEnrollments(enrollments.map(e => e.id === id ? { ...e, status: 'revoked' } : e));
    }
  };

  // Role Toggle
  const handleToggleRole = (userId: string, currentRole: string) => {
    const nextRole = currentRole === 'admin' ? 'student' : 'admin';
    zivaStudentService.updateProfileRole(userId, nextRole);
    setProfiles(profiles.map(p => p.id === userId ? { ...p, role: nextRole } : p));
  };

  // Revoke Certificate
  const handleConfirmRevokeCert = () => {
    if (!revokeCertId || !revokeReason.trim()) return;
    zivaStudentService.revokeCertificate(revokeCertId, revokeReason);
    setCertificates(certificates.map(c => c.id === revokeCertId ? { ...c, status: 'revoked', revokeReason } : c));
    setRevokeCertId(null);
    setRevokeReason('');
  };

  // Reissue Certificate
  const handleReissueCert = (id: string) => {
    zivaStudentService.reissueCertificate(id);
    setCertificates(certificates.map(c => c.id === id ? { ...c, status: 'active', revokeReason: undefined } : c));
  };

  // Create Announcement
  const handleCreateAnnouncement = () => {
    if (!annTitle.trim() || !annMessage.trim()) return;
    const newAnn = zivaStudentService.createAnnouncement(annTitle, annMessage);
    setAnnouncements([newAnn, ...announcements]);
    setIsNewAnnouncementModalOpen(false);
    setAnnTitle('');
    setAnnMessage('');
  };

  // Toggle Review Published
  const handleToggleReview = (id: string) => {
    const updated = zivaStudentService.toggleReviewPublished(id);
    if (updated) {
      setReviews(reviews.map(r => r.id === id ? updated : r));
    }
  };

  // Total Revenue Calculation
  const totalRevenue = enrollments.reduce((acc, e) => {
    const course = safeCourses.find(c => c.id === e.courseId);
    return acc + (course ? course.price : 199);
  }, 0);

  // Filtered & Sorted Courses
  const categories = Array.from(new Set(safeCourses.map((c) => c.category))).filter(Boolean);
  
  const filteredCourses = safeCourses
    .filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || course.category === categoryFilter;
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'published' ? course.isPublished : !course.isPublished);
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'price') return b.price - a.price;
      if (sortBy === 'created') return (b.createdAt || '').localeCompare(a.createdAt || '');
      return 0;
    });

  return (
    <ZivaLayout>
      {/* TOAST NOTIFICATION BANNER */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-[#FF2E93] text-white font-bold text-xs px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-pink-400/30 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* DELETE COURSE CONFIRMATION MODAL */}
      {deleteConfirmCourse && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-red-500/40 rounded-2xl p-6 max-w-md w-full space-y-4 text-white">
            <h3 className="text-lg font-serif font-bold text-red-400">
              Confirm Course Deletion
            </h3>
            <p className="text-xs text-gray-300">
              Are you sure you want to permanently delete masterclass <span className="font-bold text-amber-300">"{deleteConfirmCourse.title}"</span>? All curriculum and student progress records for this course will be removed.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setDeleteConfirmCourse(null)}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-gray-300 rounded text-xs font-bold uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCourse(deleteConfirmCourse.id)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold uppercase cursor-pointer"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
      {/* HEADER BAR */}
      <div className="bg-black border-b border-gray-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-serif text-amber-400 uppercase tracking-widest font-bold flex items-center gap-1">
              <Crown className="w-4 h-4 text-amber-400" />
              Ziva LMS Authoring & Admin Studio
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif text-white font-bold mt-1">
              Admin Management Console
            </h1>
          </div>

          <button
            onClick={handleCreateNewCourse}
            className="inline-flex items-center gap-2 bg-[#FF2E93] hover:bg-pink-600 text-white font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-md shadow-lg transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            Create New Masterclass
          </button>
        </div>
      </div>

      {/* ADMIN TABS NAVIGATION */}
      <div className="bg-neutral-950 border-b border-gray-900 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex space-x-6 text-xs font-bold uppercase tracking-widest overflow-x-auto">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-3.5 border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'analytics' ? 'border-[#FF2E93] text-pink-400' : 'border-transparent text-gray-400'
            }`}
          >
            <BarChart2 className="w-4 h-4" /> Analytics Overview
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`py-3.5 border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'courses' ? 'border-[#FF2E93] text-pink-400' : 'border-transparent text-gray-400'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Courses ({safeCourses.length})
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`py-3.5 border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'students' ? 'border-[#FF2E93] text-pink-400' : 'border-transparent text-gray-400'
            }`}
          >
            <Users className="w-4 h-4" /> Students ({profiles.length})
          </button>
          <button
            onClick={() => setActiveTab('enrollments')}
            className={`py-3.5 border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'enrollments' ? 'border-[#FF2E93] text-pink-400' : 'border-transparent text-gray-400'
            }`}
          >
            <CreditCard className="w-4 h-4" /> Enrollments ({enrollments.length})
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`py-3.5 border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'certificates' ? 'border-[#FF2E93] text-pink-400' : 'border-transparent text-gray-400'
            }`}
          >
            <Award className="w-4 h-4" /> Certificates ({certificates.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-3.5 border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'reviews' ? 'border-[#FF2E93] text-pink-400' : 'border-transparent text-gray-400'
            }`}
          >
            <Star className="w-4 h-4" /> Reviews ({reviews.length})
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`py-3.5 border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'announcements' ? 'border-[#FF2E93] text-pink-400' : 'border-transparent text-gray-400'
            }`}
          >
            <Megaphone className="w-4 h-4" /> Broadcasts ({announcements.length})
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* TAB 1: ANALYTICS OVERVIEW */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-neutral-950 border border-emerald-500/30 p-6 rounded-2xl space-y-2">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Total Estimated Revenue</p>
                <p className="text-3xl font-serif font-bold text-emerald-400">${totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-neutral-950 border border-amber-500/30 p-6 rounded-2xl space-y-2">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Active Enrollments</p>
                <p className="text-3xl font-serif font-bold text-amber-300">{enrollments.length}</p>
              </div>
              <div className="bg-neutral-950 border border-pink-500/30 p-6 rounded-2xl space-y-2">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Registered Students</p>
                <p className="text-3xl font-serif font-bold text-pink-400">{profiles.length}</p>
              </div>
              <div className="bg-neutral-950 border border-blue-500/30 p-6 rounded-2xl space-y-2">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Issued Certificates</p>
                <p className="text-3xl font-serif font-bold text-blue-400">{certificates.length}</p>
              </div>
            </div>

            {/* RECENT ENROLLMENTS FEED */}
            <div className="bg-neutral-950 border border-gray-900 rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-serif font-bold text-white uppercase tracking-wider border-b border-gray-900 pb-3">
                Recent Student Activity Feed
              </h3>
              <div className="divide-y divide-gray-900">
                {enrollments.slice(0, 5).map((e) => {
                  const course = safeCourses.find(c => c.id === e.courseId);
                  return (
                    <div key={e.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-amber-300">{e.userName || e.userEmail}</p>
                        <p className="text-gray-400">Enrolled in: {course?.title || e.courseId}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                          {e.progressPercent}% Completed
                        </span>
                        <p className="text-[10px] text-gray-500 mt-0.5">{new Date(e.enrolledAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COURSES MANAGEMENT */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-900 pb-4">
              <h2 className="text-xl font-serif font-bold text-white uppercase tracking-wide flex items-center gap-2">
                <span>All Ziva Programs ({filteredCourses.length})</span>
              </h2>

              <button
                onClick={handleCreateNewCourse}
                className="bg-[#FF2E93] hover:bg-pink-600 text-white font-bold text-xs uppercase px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-center gap-1.5 cursor-pointer self-start md:self-auto"
              >
                <Plus className="w-4 h-4" /> Create Masterclass
              </button>
            </div>

            {/* FILTER & SEARCH TOOLBAR */}
            <div className="bg-neutral-950 border border-gray-900 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between text-xs text-white">
              {/* SEARCH INPUT */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search masterclasses by title or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white outline-none focus:ring-1 focus:ring-[#FF2E93]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                {/* CATEGORY FILTER */}
                <div className="flex items-center space-x-1.5 bg-black border border-gray-800 px-3 py-1.5 rounded-xl">
                  <Filter className="w-3.5 h-3.5 text-amber-400" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-transparent text-white font-bold outline-none cursor-pointer"
                  >
                    <option value="All" className="bg-black">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat} className="bg-black">{cat}</option>
                    ))}
                  </select>
                </div>

                {/* STATUS FILTER */}
                <div className="flex items-center space-x-1.5 bg-black border border-gray-800 px-3 py-1.5 rounded-xl">
                  <span className="text-gray-400 font-bold">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'All' | 'published' | 'draft')}
                    className="bg-transparent text-white font-bold outline-none cursor-pointer"
                  >
                    <option value="All" className="bg-black">All Status</option>
                    <option value="published" className="bg-black">Published Only</option>
                    <option value="draft" className="bg-black">Drafts Only</option>
                  </select>
                </div>

                {/* SORT BY */}
                <div className="flex items-center space-x-1.5 bg-black border border-gray-800 px-3 py-1.5 rounded-xl">
                  <ArrowUpDown className="w-3.5 h-3.5 text-pink-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'title' | 'price' | 'created')}
                    className="bg-transparent text-white font-bold outline-none cursor-pointer"
                  >
                    <option value="title" className="bg-black">Sort by Title</option>
                    <option value="price" className="bg-black">Sort by Price</option>
                    <option value="created" className="bg-black">Sort by Date</option>
                  </select>
                </div>
              </div>
            </div>

            {/* BULK ACTIONS TOOLBAR */}
            {selectedCourseIds.length > 0 && (
              <div className="bg-[#FF2E93]/20 border border-[#FF2E93]/40 p-3.5 rounded-2xl flex items-center justify-between text-xs text-white animate-fade-in">
                <span className="font-bold text-amber-300">
                  {selectedCourseIds.length} Masterclasses Selected
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleBulkPublish(true)}
                    className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 rounded-lg font-bold cursor-pointer"
                  >
                    Bulk Publish
                  </button>
                  <button
                    onClick={() => handleBulkPublish(false)}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-gray-300 border border-gray-700 rounded-lg font-bold cursor-pointer"
                  >
                    Bulk Unpublish
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-3 py-1.5 bg-red-950 hover:bg-red-900 text-red-300 border border-red-500/40 rounded-lg font-bold cursor-pointer"
                  >
                    Bulk Delete
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="py-12 text-center text-amber-400">Loading courses...</div>
            ) : filteredCourses.length === 0 ? (
              <div className="bg-neutral-950 border border-gray-800 p-8 rounded-2xl text-center space-y-3">
                <BookOpen className="w-8 h-8 text-amber-400 mx-auto" />
                <p className="text-sm text-gray-300">No matching masterclasses found.</p>
                <button
                  onClick={handleCreateNewCourse}
                  className="bg-[#FF2E93] text-white text-xs font-bold uppercase px-4 py-2 rounded"
                >
                  Create Your First Course
                </button>
              </div>
            ) : (
              <div className="bg-neutral-950 border border-gray-900 rounded-2xl overflow-hidden">
                {/* TABLE HEADER */}
                <div className="p-4 bg-black border-b border-gray-900 flex items-center justify-between text-xs font-bold text-gray-400">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleSelectAll(filteredCourses)}
                      className="p-1 hover:text-white cursor-pointer"
                    >
                      {selectedCourseIds.length === filteredCourses.length && filteredCourses.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-[#FF2E93]" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                    <span>SELECT ALL</span>
                  </div>
                  <span>ACTIONS</span>
                </div>

                <div className="divide-y divide-gray-900">
                  {filteredCourses.map((course) => {
                    const isSelected = selectedCourseIds.includes(course.id);
                    return (
                      <div key={course.id} className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                        isSelected ? 'bg-pink-950/20' : 'hover:bg-neutral-900/50'
                      }`}>
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => {
                              if (isSelected) {
                                setSelectedCourseIds(selectedCourseIds.filter(id => id !== course.id));
                              } else {
                                setSelectedCourseIds([...selectedCourseIds, course.id]);
                              }
                            }}
                            className="p-1 hover:text-white cursor-pointer shrink-0"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-[#FF2E93]" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-600" />
                            )}
                          </button>

                          <img
                            src={course.thumbnailUrl}
                            alt={course.title}
                            className="w-16 h-16 rounded-lg object-cover border border-amber-500/30 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
                                {course.category}
                              </span>
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                course.isPublished ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-gray-900 text-gray-400'
                              }`}>
                                {course.isPublished ? 'Published' : 'Draft'}
                              </span>
                              {course.isFeatured && (
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-yellow-950 text-yellow-300 border border-yellow-500/30 flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> Featured
                                </span>
                              )}
                            </div>
                            <h3 className="text-base font-serif font-bold text-white mt-1">
                              {course.title}
                            </h3>
                            <p className="text-xs text-gray-400">${course.price} • {course.duration}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            onClick={() => handleToggleFeatured(course)}
                            title={course.isFeatured ? 'Unfeature' : 'Feature on Homepage'}
                            className={`p-2 border rounded text-xs flex items-center gap-1 cursor-pointer ${
                              course.isFeatured
                                ? 'bg-yellow-950/60 text-yellow-300 border-yellow-500/40'
                                : 'bg-neutral-900 text-gray-400 border-gray-800 hover:text-white'
                            }`}
                          >
                            <Star className={`w-4 h-4 ${course.isFeatured ? 'fill-yellow-400' : ''}`} />
                          </button>

                          <button
                            onClick={() => handleDuplicateCourse(course.id)}
                            title="Duplicate Course"
                            className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-gray-800 rounded text-amber-300 text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-4 h-4" />
                            <span className="hidden sm:inline">Duplicate</span>
                          </button>

                          <button
                            onClick={() => handleTogglePublish(course)}
                            title={course.isPublished ? 'Unpublish' : 'Publish'}
                            className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-gray-800 rounded text-gray-300 text-xs flex items-center gap-1 cursor-pointer"
                          >
                            {course.isPublished ? <EyeOff className="w-4 h-4 text-pink-400" /> : <Eye className="w-4 h-4 text-emerald-400" />}
                            <span className="hidden sm:inline">{course.isPublished ? 'Unpublish' : 'Publish'}</span>
                          </button>

                          <Link
                            to={`/ziva/admin/course-builder/${course.id}`}
                            className="p-2 bg-[#FF2E93] hover:bg-pink-600 text-white rounded text-xs font-bold uppercase flex items-center gap-1 cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                            <span>Builder</span>
                          </Link>

                          <button
                            onClick={() => setDeleteConfirmCourse(course)}
                            className="p-2 bg-red-950/60 hover:bg-red-900 border border-red-500/40 rounded text-red-400 text-xs cursor-pointer"
                            title="Delete Course"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STUDENTS MANAGEMENT */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-900 pb-3">
              <h2 className="text-xl font-serif font-bold text-white uppercase tracking-wide">
                Registered Students ({profiles.length})
              </h2>
            </div>

            <div className="divide-y divide-gray-900 bg-neutral-950 border border-gray-900 rounded-2xl overflow-hidden">
              {profiles.map((p) => (
                <div key={p.id} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-white text-sm">{p.fullName}</p>
                    <p className="text-gray-400">{p.email}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded border ${
                      p.role === 'admin' ? 'bg-amber-950 text-amber-300 border-amber-500/40' : 'bg-neutral-900 text-gray-400 border-gray-800'
                    }`}>
                      {p.role}
                    </span>
                    <button
                      onClick={() => handleToggleRole(p.id, p.role)}
                      className="bg-neutral-900 hover:bg-neutral-800 text-gray-300 text-[10px] font-bold uppercase px-3 py-1.5 rounded border border-gray-800 cursor-pointer"
                    >
                      Toggle Admin Role
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: ENROLLMENTS MANAGEMENT */}
        {activeTab === 'enrollments' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-900 pb-3">
              <h2 className="text-xl font-serif font-bold text-white uppercase tracking-wide">
                Student Course Enrollments ({enrollments.length})
              </h2>
              <button
                onClick={() => setIsManualEnrollModalOpen(true)}
                className="bg-[#FF2E93] hover:bg-pink-600 text-white font-bold text-xs uppercase px-4 py-2 rounded flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" /> Manual Enroll Student
              </button>
            </div>

            <div className="divide-y divide-gray-900 bg-neutral-950 border border-gray-900 rounded-2xl overflow-hidden">
              {enrollments.map((enr) => {
                const course = safeCourses.find(c => c.id === enr.courseId);
                const isRevoked = enr.status === 'revoked';

                return (
                  <div key={enr.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <p className="font-bold text-amber-300">{enr.userName || enr.userEmail}</p>
                      <p className="text-gray-400">{course?.title || enr.courseId}</p>
                      <p className="text-[10px] text-gray-500">Enrolled: {new Date(enr.enrolledAt).toLocaleDateString()}</p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded border ${
                        isRevoked ? 'bg-red-950 text-red-400 border-red-500/30' : 'bg-emerald-950 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {isRevoked ? 'Revoked' : `${enr.progressPercent}% Progress`}
                      </span>

                      {!isRevoked && (
                        <button
                          onClick={() => handleRevokeEnrollment(enr.id)}
                          className="bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-400 text-[10px] font-bold uppercase px-3 py-1.5 rounded cursor-pointer"
                        >
                          Revoke Access
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: CERTIFICATES MANAGEMENT */}
        {activeTab === 'certificates' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-900 pb-3">
              <h2 className="text-xl font-serif font-bold text-white uppercase tracking-wide">
                Issued Certificates ({certificates.length})
              </h2>
            </div>

            <div className="divide-y divide-gray-900 bg-neutral-950 border border-gray-900 rounded-2xl overflow-hidden">
              {certificates.map((cert) => {
                const isRevoked = cert.status === 'revoked';

                return (
                  <div key={cert.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <p className="font-bold text-white">{cert.userName || 'Student'}</p>
                      <p className="text-amber-300 font-serif">{cert.courseTitle}</p>
                      <p className="text-[10px] text-gray-400">ID: <span className="font-mono">{cert.certificateNumber}</span></p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedCert(cert);
                          setIsCertModalOpen(true);
                        }}
                        className="bg-neutral-900 hover:bg-neutral-800 text-gray-200 border border-gray-800 text-[10px] font-bold uppercase px-3 py-1.5 rounded cursor-pointer"
                      >
                        View
                      </button>

                      {!isRevoked ? (
                        <button
                          onClick={() => setRevokeCertId(cert.id)}
                          className="bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-400 text-[10px] font-bold uppercase px-3 py-1.5 rounded cursor-pointer"
                        >
                          Revoke
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReissueCert(cert.id)}
                          className="bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold uppercase px-3 py-1.5 rounded cursor-pointer flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" /> Reissue
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 6: REVIEWS MODERATION */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-900 pb-3">
              <h2 className="text-xl font-serif font-bold text-white uppercase tracking-wide">
                Student Course Reviews ({reviews.length})
              </h2>
            </div>

            <div className="space-y-3">
              {reviews.map((rev) => (
                <div key={rev.id} className="bg-neutral-950 border border-gray-900 p-5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300 text-xs">{rev.userName} ({rev.rating}★)</span>
                    <button
                      onClick={() => handleToggleReview(rev.id)}
                      className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded border cursor-pointer ${
                        rev.isPublished ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30' : 'bg-gray-900 text-gray-400 border-gray-800'
                      }`}
                    >
                      {rev.isPublished ? 'Published' : 'Hidden'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-300 italic">"{rev.comment}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: ANNOUNCEMENTS BROADCAST */}
        {activeTab === 'announcements' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-900 pb-3">
              <h2 className="text-xl font-serif font-bold text-white uppercase tracking-wide">
                Broadcast Announcements ({announcements.length})
              </h2>
              <button
                onClick={() => setIsNewAnnouncementModalOpen(true)}
                className="bg-[#FF2E93] hover:bg-pink-600 text-white font-bold text-xs uppercase px-4 py-2 rounded flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> New Broadcast
              </button>
            </div>

            <div className="space-y-4">
              {announcements.map((ann) => (
                <div key={ann.id} className="bg-neutral-950 border border-amber-500/30 p-5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-pink-400 font-bold uppercase">{ann.title}</span>
                    <button
                      onClick={() => {
                        zivaStudentService.deleteAnnouncement(ann.id);
                        setAnnouncements(announcements.filter(a => a.id !== ann.id));
                      }}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">{ann.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* MANUAL ENROLL MODAL */}
      {isManualEnrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-950 border border-amber-500/50 rounded-2xl p-6 w-full max-w-md space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-gray-900 pb-2">
              <h3 className="text-base font-serif font-bold text-amber-300">Manual Student Enrollment</h3>
              <button onClick={() => setIsManualEnrollModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-amber-300 uppercase mb-1">Student Email</label>
                <input
                  type="email"
                  placeholder="student@example.com"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  className="w-full bg-black border border-gray-800 text-white text-xs p-3 rounded outline-none focus:ring-1 focus:ring-[#FF2E93]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-300 uppercase mb-1">Select Program</label>
                <select
                  value={manualCourseId}
                  onChange={(e) => setManualCourseId(e.target.value)}
                  className="w-full bg-black border border-gray-800 text-white text-xs p-3 rounded outline-none focus:ring-1 focus:ring-[#FF2E93]"
                >
                  {safeCourses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleManualEnroll}
                className="w-full bg-[#FF2E93] hover:bg-pink-600 text-white font-bold text-xs uppercase py-3 rounded tracking-widest cursor-pointer mt-2"
              >
                Enroll Student Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW ANNOUNCEMENT MODAL */}
      {isNewAnnouncementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-950 border border-amber-500/50 rounded-2xl p-6 w-full max-w-md space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-gray-900 pb-2">
              <h3 className="text-base font-serif font-bold text-amber-300">Create Broadcast Announcement</h3>
              <button onClick={() => setIsNewAnnouncementModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-amber-300 uppercase mb-1">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Live Q&A Session Tomorrow"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full bg-black border border-gray-800 text-white text-xs p-3 rounded outline-none focus:ring-1 focus:ring-[#FF2E93]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-300 uppercase mb-1">Message Body</label>
                <textarea
                  rows={4}
                  placeholder="Enter broadcast text for your students..."
                  value={annMessage}
                  onChange={(e) => setAnnMessage(e.target.value)}
                  className="w-full bg-black border border-gray-800 text-white text-xs p-3 rounded outline-none focus:ring-1 focus:ring-[#FF2E93]"
                />
              </div>

              <button
                onClick={handleCreateAnnouncement}
                className="w-full bg-[#FF2E93] hover:bg-pink-600 text-white font-bold text-xs uppercase py-3 rounded tracking-widest cursor-pointer mt-2"
              >
                Publish Broadcast
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVOKE CERTIFICATE REASON MODAL */}
      {revokeCertId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-950 border border-red-500/50 rounded-2xl p-6 w-full max-w-md space-y-4 text-white">
            <h3 className="text-base font-serif font-bold text-red-400">Revoke Student Certificate</h3>
            <p className="text-xs text-gray-400">Please provide a reason for revoking this certificate credential:</p>
            <input
              type="text"
              placeholder="e.g. Administrative review / Course requirements unfulfilled"
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              className="w-full bg-black border border-gray-800 text-white text-xs p-3 rounded outline-none focus:ring-1 focus:ring-red-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setRevokeCertId(null)}
                className="flex-1 bg-neutral-900 text-gray-300 text-xs py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRevokeCert}
                className="flex-1 bg-red-600 text-white text-xs font-bold py-2 rounded"
              >
                Confirm Revoke
              </button>
            </div>
          </div>
        </div>
      )}

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
