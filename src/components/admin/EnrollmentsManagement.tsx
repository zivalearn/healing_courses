import React, { useState, useEffect } from 'react';
import { Enrollment } from '../../types/enrollment';
import { enrollmentService } from '../../services/enrollmentService';
import { courseService } from '../../services/courseService';
import { Course } from '../../models/course';
import { 
  CreditCard, 
  Search, 
  Filter, 
  Plus, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  X,
  UserCheck,
  TrendingUp,
  Sparkles
} from 'lucide-react';

export const EnrollmentsManagement: React.FC = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // New Enrollment Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newCourseId, setNewCourseId] = useState('');
  const [newAmountPaid, setNewAmountPaid] = useState<number>(199);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [enrRes, courseList] = await Promise.all([
      enrollmentService.getAllEnrollments(),
      courseService.getAllCourses()
    ]);

    setEnrollments(enrRes.data || []);
    setCourses(courseList || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter enrollments
  const filteredEnrollments = enrollments.filter((e) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      (e.user_id || '').toLowerCase().includes(query) ||
      (e.course_id || '').toLowerCase().includes(query) ||
      (e.id || '').toLowerCase().includes(query);

    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || e.payment_status === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredEnrollments.length / itemsPerPage) || 1;
  const paginatedEnrollments = filteredEnrollments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Quick stats
  const totalEnrollmentsCount = enrollments.length;
  const activeCount = enrollments.filter(e => e.status === 'active').length;
  const completedCount = enrollments.filter(e => e.status === 'completed').length;
  const totalRevenue = enrollments.reduce((sum, e) => sum + (e.amount_paid || 0), 0);

  // Handlers
  const handleCreateEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId || !newCourseId) return;

    setSubmitting(true);
    const res = await enrollmentService.createEnrollment({
      user_id: newUserId,
      course_id: newCourseId,
      status: 'active',
      payment_status: 'paid',
      amount_paid: newAmountPaid,
      enrolled_at: new Date().toISOString()
    });

    if (res.data) {
      await loadData();
      setShowAddModal(false);
      setNewUserId('');
      setNewCourseId('');
    }
    setSubmitting(false);
  };

  const handleUpdateStatus = async (id: string, status: 'active' | 'completed' | 'cancelled') => {
    const res = await enrollmentService.updateEnrollment(id, { status });
    if (res.data) {
      setEnrollments(prev => prev.map(e => e.id === id ? { ...e, status } : e));
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
          <h2 className="font-serif font-bold text-2xl text-[#102A36]">Enrollments & Revenue</h2>
          <p className="text-xs text-[#486D7A] mt-1">Manage student course enrollments, verify payment statuses, and track revenue.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-[#287687] hover:bg-[#1C5B69] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 text-[#CBA258]" />
          <span>Manual Enrollment</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-teal-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#486D7A] uppercase tracking-wider">Total Enrollments</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-serif font-bold text-[#102A36]">{totalEnrollmentsCount}</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-emerald-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#486D7A] uppercase tracking-wider">Active</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-serif font-bold text-[#102A36]">{activeCount}</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-sky-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#486D7A] uppercase tracking-wider">Completed</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-serif font-bold text-[#102A36]">{completedCount}</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#C8E6E1] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#486D7A] uppercase tracking-wider">Total Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-[#EEF7F5] text-[#287687] flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-serif font-bold text-[#102A36]">${totalRevenue.toLocaleString()}</div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="p-4 rounded-2xl bg-white border border-[#C8E6E1] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#486D7A] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search enrollment, student ID, or course..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[#C8E6E1] bg-[#F7FCFA] text-[#102A36] focus:outline-none focus:ring-2 focus:ring-[#287687]"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2 text-xs text-[#486D7A] font-semibold">
            <Filter className="w-3.5 h-3.5 text-[#287687]" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs px-3 py-2 rounded-xl border border-[#C8E6E1] bg-[#F7FCFA] text-[#102A36] font-semibold focus:outline-none focus:ring-2 focus:ring-[#287687]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs px-3 py-2 rounded-xl border border-[#C8E6E1] bg-[#F7FCFA] text-[#102A36] font-semibold focus:outline-none focus:ring-2 focus:ring-[#287687]"
          >
            <option value="all">All Payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Enrollments Table */}
      <div className="bg-white rounded-2xl border border-[#C8E6E1] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#486D7A] flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#287687]" />
            <span className="text-xs font-semibold">Loading enrollment records...</span>
          </div>
        ) : paginatedEnrollments.length === 0 ? (
          <div className="p-12 text-center text-[#486D7A]">
            <CreditCard className="w-10 h-10 mx-auto text-[#C8E6E1] mb-2" />
            <p className="text-sm font-bold text-[#102A36]">No enrollment records found</p>
            <p className="text-xs text-[#486D7A] mt-1">Try modifying your search filter or add a manual enrollment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#EEF7F5] border-b border-[#C8E6E1] text-[11px] font-bold text-[#102A36] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Student ID</th>
                  <th className="py-3.5 px-4">Course</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Enrolled Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2F1EE] text-xs">
                {paginatedEnrollments.map((enr) => (
                  <tr key={enr.id} className="hover:bg-[#F7FCFA] transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#102A36]">
                      <span className="font-mono text-[11px] bg-[#EEF7F5] px-2 py-1 rounded-md border border-[#C8E6E1]">
                        {enr.user_id?.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-[#102A36]">
                      {getCourseTitle(enr.course_id)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        enr.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : enr.status === 'cancelled'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-teal-100 text-teal-800'
                      }`}>
                        {enr.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                        {enr.status === 'cancelled' && <XCircle className="w-3 h-3" />}
                        {enr.status === 'active' && <Clock className="w-3 h-3" />}
                        {enr.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        enr.payment_status === 'paid'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {enr.payment_status || 'paid'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-[#102A36]">
                      ${enr.amount_paid ?? 0}
                    </td>
                    <td className="py-3 px-4 text-[#486D7A]">
                      {enr.enrolled_at ? new Date(enr.enrolled_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {enr.status !== 'completed' && (
                          <button
                            onClick={() => handleUpdateStatus(enr.id, 'completed')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white font-bold text-[10px] transition-colors cursor-pointer"
                            title="Mark as Completed"
                          >
                            Complete
                          </button>
                        )}
                        {enr.status !== 'cancelled' && (
                          <button
                            onClick={() => handleUpdateStatus(enr.id, 'cancelled')}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white font-bold text-[10px] transition-colors cursor-pointer"
                            title="Cancel Enrollment"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {filteredEnrollments.length > 0 && (
          <div className="p-4 border-t border-[#C8E6E1] bg-[#F7FCFA] flex items-center justify-between">
            <span className="text-xs text-[#486D7A] font-medium">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredEnrollments.length)} of {filteredEnrollments.length} enrollments
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

      {/* Modal: Manual Enrollment */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#C8E6E1] shadow-2xl w-full max-w-md p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#C8E6E1] pb-4">
              <h3 className="font-serif font-bold text-lg text-[#102A36] flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#CBA258]" />
                Add Student Enrollment
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-[#486D7A] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEnrollment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#102A36] mb-1">
                  Student User ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., student-123 or UUID"
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#C8E6E1] bg-[#F7FCFA] text-[#102A36] focus:outline-none focus:ring-2 focus:ring-[#287687]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#102A36] mb-1">
                  Select Course <span className="text-rose-500">*</span>
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
                      {c.name || c.title} (${c.price || 0})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#102A36] mb-1">
                  Amount Paid ($)
                </label>
                <input
                  type="number"
                  min="0"
                  value={newAmountPaid}
                  onChange={(e) => setNewAmountPaid(Number(e.target.value))}
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
                  <span>Confirm Enrollment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
