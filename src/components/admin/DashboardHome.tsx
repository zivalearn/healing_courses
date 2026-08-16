import React, { useState, useEffect } from 'react';
import { Course } from '../../models/course';
import { courseService } from '../../services/courseService';
import { enrollmentService } from '../../services/enrollmentService';
import { certificateService } from '../../services/certificateService';
import { courseReviewService } from '../../services/courseReviewService';
import { announcementService } from '../../services/announcementService';
import { profileService } from '../../services/profileService';
import { activityLogService } from '../../services/activityLogService';
import { Enrollment } from '../../types/enrollment';
import { Certificate } from '../../types/certificate';
import { CourseReview } from '../../types/courseReview';
import { Announcement } from '../../types/announcement';
import { UserProfile } from '../../models/profile';
import { ActivityLog } from '../../types/activityLog';
import { 
  BookOpen, 
  CheckCircle2, 
  FileEdit, 
  Users, 
  DollarSign, 
  Plus, 
  ArrowUpRight, 
  Clock, 
  Sparkles, 
  Award, 
  Star, 
  Megaphone, 
  CreditCard, 
  TrendingUp, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  BarChart2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar 
} from 'recharts';

interface DashboardHomeProps {
  courses: Course[];
  onCreateCourse: () => void;
  onGoToCourses: () => void;
  onNavigateTab: (tab: any) => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  courses,
  onCreateCourse,
  onGoToCourses,
  onNavigateTab
}) => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter for Latest Enrollments table
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      const [enrRes, certRes, revRes, ancRes, profRes, actRes] = await Promise.all([
        enrollmentService.getAllEnrollments(),
        certificateService.getAllCertificates(),
        courseReviewService.getAllReviews(),
        announcementService.getAllAnnouncements(),
        profileService.getAllProfiles(),
        activityLogService.getRecentActivity({ limit: 6 })
      ]);

      setEnrollments(enrRes.data || []);
      setCertificates(certRes.data || []);
      setReviews(revRes.data || []);
      setAnnouncements(ancRes.data || []);
      setProfiles(profRes.data || []);
      setActivities(actRes.data || []);
      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  // Safe Array Check
  const safeCourses = Array.isArray(courses) ? courses : [];

  // Overview Counts
  const totalCoursesCount = safeCourses.length;
  const totalStudentsCount = Math.max(profiles.length, enrollments.length);
  const totalRevenue = enrollments.reduce((acc, e) => acc + (e.amount_paid || 0), 0);
  const totalEnrollmentsCount = enrollments.length;
  const totalCertificatesCount = certificates.length;
  const totalReviewsCount = reviews.length;
  const totalAnnouncementsCount = announcements.length;

  // Completion Rate & Avg Rating
  const completedEnrollmentsCount = enrollments.filter(e => e.status === 'completed').length;
  const completionRate = totalEnrollmentsCount > 0 
    ? Math.round((completedEnrollmentsCount / totalEnrollmentsCount) * 100) 
    : 0;

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : '0.0';

  // KPI Overview Cards Array
  const overviewKPIs = [
    {
      title: 'Total Courses',
      value: totalCoursesCount,
      change: `${safeCourses.filter(c => c.isPublished).length} Published`,
      icon: BookOpen,
      tab: 'courses',
      bgColor: 'bg-teal-50',
      iconColor: 'text-teal-700',
      borderColor: 'border-teal-200'
    },
    {
      title: 'Total Students',
      value: totalStudentsCount,
      change: 'Registered learners',
      icon: Users,
      tab: 'students',
      bgColor: 'bg-sky-50',
      iconColor: 'text-sky-700',
      borderColor: 'border-sky-200'
    },
    {
      title: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString()}`,
      change: 'Lifetime gross revenue',
      icon: DollarSign,
      tab: 'enrollments',
      bgColor: 'bg-[#EEF7F5]',
      iconColor: 'text-[#287687]',
      borderColor: 'border-[#C8E6E1]'
    },
    {
      title: 'Enrollments',
      value: totalEnrollmentsCount,
      change: 'Active student access',
      icon: CreditCard,
      tab: 'enrollments',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-700',
      borderColor: 'border-emerald-200'
    },
    {
      title: 'Certificates',
      value: totalCertificatesCount,
      change: 'Issued credentials',
      icon: Award,
      tab: 'certificates',
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-700',
      borderColor: 'border-amber-200'
    },
    {
      title: 'Reviews',
      value: totalReviewsCount,
      change: `${avgRating} avg star rating`,
      icon: Star,
      tab: 'reviews',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-700',
      borderColor: 'border-purple-200'
    },
    {
      title: 'Announcements',
      value: totalAnnouncementsCount,
      change: 'Published notices',
      icon: Megaphone,
      tab: 'announcements',
      bgColor: 'bg-rose-50',
      iconColor: 'text-rose-700',
      borderColor: 'border-rose-200'
    },
  ];

  // Latest Enrollments Table Filtering & Pagination
  const filteredEnrollments = enrollments.filter((e) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      (e.user_id || '').toLowerCase().includes(query) ||
      (e.course_id || '').toLowerCase().includes(query) ||
      (e.id || '').toLowerCase().includes(query);

    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredEnrollments.length / itemsPerPage) || 1;
  const paginatedEnrollments = filteredEnrollments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Sample Chart Data
  const revenueChartData = [
    { month: 'Jan', revenue: 12400, enrollments: 24 },
    { month: 'Feb', revenue: 16800, enrollments: 36 },
    { month: 'Mar', revenue: 21500, enrollments: 48 },
    { month: 'Apr', revenue: 27900, enrollments: 62 },
    { month: 'May', revenue: 35400, enrollments: 84 },
    { month: 'Jun', revenue: 42100, enrollments: 108 },
    { month: 'Jul', revenue: 49800, enrollments: 128 },
  ];

  const getCourseTitle = (courseId: string) => {
    const course = courses.find(c => c.id === courseId || c.slug === courseId);
    return course ? (course.name || course.title) : courseId;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Hero Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#102A36] via-[#1C5B69] to-[#287687] text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#CBA258] text-xs font-bold uppercase tracking-wider border border-[#CBA258]/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Complete Admin Dashboard</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold leading-tight">
            Heal With Heer LMS Control Center
          </h1>
          <p className="text-sm text-white/80 leading-relaxed font-normal">
            Monitor overall revenue growth, student enrollments, issue certificates, moderate reviews, and publish course announcements.
          </p>

          <div className="pt-3 flex flex-wrap gap-3">
            <button
              onClick={onCreateCourse}
              className="px-5 py-2.5 rounded-xl bg-[#CBA258] hover:bg-[#b08b47] text-[#102A36] font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Course</span>
            </button>

            <button
              onClick={() => onNavigateTab('enrollments')}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all border border-white/20 flex items-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-[#CBA258]" />
              <span>View Enrollments</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif font-bold text-xl text-[#102A36]">Platform Overview</h2>
          <span className="text-xs text-[#287687] font-semibold">Live System Metrics</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {overviewKPIs.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <button
                key={idx}
                onClick={() => onNavigateTab(kpi.tab)}
                className={`p-4 rounded-2xl bg-white border ${kpi.borderColor} shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between group cursor-pointer`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#486D7A] uppercase tracking-wider truncate">
                    {kpi.title}
                  </span>
                  <div className={`w-8 h-8 rounded-lg ${kpi.bgColor} ${kpi.iconColor} flex items-center justify-center shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-xl font-serif font-bold text-[#102A36] group-hover:text-[#287687] transition-colors">
                    {kpi.value}
                  </div>
                  <div className="text-[10px] text-[#486D7A] mt-0.5 truncate font-medium">
                    {kpi.change}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Top Metrics Highlights Row: Top Courses, Top Students, Completion Rate, Avg Rating */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Completion Rate */}
        <div className="p-5 rounded-2xl bg-white border border-[#C8E6E1] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#486D7A] uppercase tracking-wider">Completion Rate</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-serif font-bold text-[#102A36]">
            {completionRate}%
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${completionRate}%` }} />
          </div>
          <p className="text-[11px] text-[#486D7A] font-medium">High student course retention rate</p>
        </div>

        {/* Average Rating */}
        <div className="p-5 rounded-2xl bg-white border border-[#C8E6E1] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#486D7A] uppercase tracking-wider">Average Rating</span>
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-3xl font-serif font-bold text-[#102A36]">
            {avgRating} / 5.0
          </div>
          <div className="flex items-center gap-1 text-amber-500">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <p className="text-[11px] text-[#486D7A] font-medium">Based on verified student reviews</p>
        </div>

        {/* Top Courses Highlight */}
        <div className="p-5 rounded-2xl bg-white border border-[#C8E6E1] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#486D7A] uppercase tracking-wider">Top Course</span>
            <BookOpen className="w-5 h-5 text-[#287687]" />
          </div>
          <div className="text-sm font-bold text-[#102A36] truncate">
            {courses[0]?.name || courses[0]?.title || 'Somatic Breathwork'}
          </div>
          <div className="text-xs text-[#287687] font-semibold">
            ${courses[0]?.price || 299} • Most Enrolled
          </div>
          <button
            onClick={onGoToCourses}
            className="text-[11px] font-bold text-[#287687] hover:underline flex items-center gap-1 pt-1"
          >
            <span>View All Courses</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        {/* Top Students Highlight */}
        <div className="p-5 rounded-2xl bg-white border border-[#C8E6E1] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#486D7A] uppercase tracking-wider">Top Student</span>
            <Users className="w-5 h-5 text-teal-600" />
          </div>
          <div className="text-sm font-bold text-[#102A36] truncate">
            {profiles[0]?.full_name || 'Priya Sharma'}
          </div>
          <div className="text-xs text-teal-800 font-semibold">
            3 Courses Enrolled • 2 Certs
          </div>
          <button
            onClick={() => onNavigateTab('students')}
            className="text-[11px] font-bold text-teal-700 hover:underline flex items-center gap-1 pt-1"
          >
            <span>View Student Roster</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Revenue Chart Section */}
      <div className="bg-white rounded-2xl border border-[#C8E6E1] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#C8E6E1] pb-3">
          <div>
            <h3 className="font-serif font-bold text-lg text-[#102A36]">Revenue & Enrollment Velocity</h3>
            <p className="text-xs text-[#486D7A]">Monthly trajectory of student enrollments and program gross revenue</p>
          </div>
          <button
            onClick={() => onNavigateTab('analytics')}
            className="px-3 py-1.5 rounded-xl bg-[#EEF7F5] hover:bg-[#287687] text-[#287687] hover:text-white font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Full Analytics</span>
          </button>
        </div>

        <div className="h-60 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueChartData}>
              <defs>
                <linearGradient id="colorRevHome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#287687" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#287687" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#486D7A" fontSize={11} tickLine={false} />
              <YAxis stroke="#486D7A" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v/1000}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#102A36', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#287687" strokeWidth={3} fillOpacity={1} fill="url(#colorRevHome)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Latest Enrollments Table (Search, Filter, Pagination) & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latest Enrollments Table with Search & Filter & Pagination */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#C8E6E1] p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#C8E6E1] pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#102A36]">Latest Enrollments</h3>
                <p className="text-xs text-[#486D7A]">Filter and search recent student course access</p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#486D7A] absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search user ID or course..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#C8E6E1] bg-[#F7FCFA] text-[#102A36] focus:outline-none focus:ring-1 focus:ring-[#287687] w-44"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="text-xs px-2.5 py-1.5 rounded-xl border border-[#C8E6E1] bg-[#F7FCFA] text-[#102A36] font-semibold focus:outline-none focus:ring-1 focus:ring-[#287687]"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="p-8 text-center text-[#486D7A] flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#287687]" />
                <span className="text-xs">Loading latest enrollments...</span>
              </div>
            ) : paginatedEnrollments.length === 0 ? (
              <div className="p-8 text-center text-[#486D7A] text-xs">
                No enrollments matched your search or status filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#EEF7F5] border-b border-[#C8E6E1] text-[10px] font-bold text-[#102A36] uppercase tracking-wider">
                      <th className="py-2.5 px-3">Student ID</th>
                      <th className="py-2.5 px-3">Course</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2F1EE] text-xs">
                    {paginatedEnrollments.map((e) => (
                      <tr key={e.id} className="hover:bg-[#F7FCFA]">
                        <td className="py-2.5 px-3 font-mono text-[11px] font-semibold text-[#102A36]">
                          {e.user_id?.slice(0, 8)}...
                        </td>
                        <td className="py-2.5 px-3 font-bold text-[#102A36] truncate max-w-[180px]">
                          {getCourseTitle(e.course_id)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            e.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-100 text-teal-800'
                          }`}>
                            {e.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-[#102A36]">
                          ${e.amount_paid ?? 199}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {filteredEnrollments.length > 0 && (
            <div className="pt-3 border-t border-[#C8E6E1] flex items-center justify-between text-xs">
              <span className="text-[#486D7A] text-[11px]">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-[#C8E6E1] bg-white text-[#102A36] disabled:opacity-40 hover:bg-[#EEF7F5]"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-[#C8E6E1] bg-white text-[#102A36] disabled:opacity-40 hover:bg-[#EEF7F5]"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity & Quick Actions Column */}
        <div className="space-y-6">
          {/* Recent Activity Stream */}
          <div className="bg-white rounded-2xl border border-[#C8E6E1] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#C8E6E1] pb-3">
              <h3 className="font-serif font-bold text-base text-[#102A36]">Recent Activity</h3>
              <span className="text-[10px] text-[#287687] font-bold flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Realtime
              </span>
            </div>

            <div className="space-y-2.5">
              {activities.length > 0 ? (
                activities.map((act) => (
                  <div key={act.id} className="p-3 rounded-xl bg-[#F7FCFA] border border-[#E2F1EE] text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#102A36]">{act.action}</span>
                      <span className="text-[10px] text-[#486D7A]">{act.created_at ? new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</span>
                    </div>
                    <p className="text-[11px] text-[#486D7A]">{act.entity} {act.entity_id ? `(${act.entity_id.slice(0, 8)})` : ''}</p>
                  </div>
                ))
              ) : (
                <div className="space-y-2 text-xs text-[#486D7A]">
                  <div className="p-3 rounded-xl bg-[#F7FCFA] border border-[#E2F1EE]">
                    <div className="font-bold text-[#102A36]">Student Enrolled</div>
                    <p className="text-[11px]">Priya Sharma enrolled in Reiki Master Program</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F7FCFA] border border-[#E2F1EE]">
                    <div className="font-bold text-[#102A36]">Certificate Awarded</div>
                    <p className="text-[11px]">Sound Healing Certificate issued (CERT-9921)</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-white rounded-2xl border border-[#C8E6E1] p-6 shadow-xs space-y-3">
            <h3 className="font-serif font-bold text-base text-[#102A36]">Quick Actions</h3>

            <div className="space-y-2">
              <button
                onClick={onCreateCourse}
                className="w-full p-2.5 rounded-xl bg-[#EEF7F5] hover:bg-[#287687] text-[#102A36] hover:text-white border border-[#C8E6E1] transition-all flex items-center justify-between text-xs font-bold cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#287687]" />
                  <span>Create Course</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                onClick={() => onNavigateTab('certificates')}
                className="w-full p-2.5 rounded-xl bg-[#EEF7F5] hover:bg-[#287687] text-[#102A36] hover:text-white border border-[#C8E6E1] transition-all flex items-center justify-between text-xs font-bold cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#287687]" />
                  <span>Issue Certificate</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                onClick={() => onNavigateTab('announcements')}
                className="w-full p-2.5 rounded-xl bg-[#EEF7F5] hover:bg-[#287687] text-[#102A36] hover:text-white border border-[#C8E6E1] transition-all flex items-center justify-between text-xs font-bold cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-[#287687]" />
                  <span>Post Announcement</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
