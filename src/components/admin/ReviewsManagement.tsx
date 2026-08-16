import React, { useState, useEffect } from 'react';
import { CourseReview } from '../../types/courseReview';
import { courseReviewService } from '../../services/courseReviewService';
import { courseService } from '../../services/courseService';
import { Course } from '../../models/course';
import { 
  Star, 
  Search, 
  Filter, 
  MessageSquare, 
  CheckCircle2, 
  XCircle, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  X,
  Sparkles,
  MessageCircle,
  Trash2,
  CornerDownRight
} from 'lucide-react';

export const ReviewsManagement: React.FC = () => {
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [starFilter, setStarFilter] = useState<number | 'all'>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Reply Modal
  const [replyingReview, setReplyingReview] = useState<CourseReview | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [revRes, courseList] = await Promise.all([
      courseReviewService.getAllReviews(),
      courseService.getAllCourses()
    ]);

    setReviews(revRes.data || []);
    setCourses(courseList || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter reviews
  const filteredReviews = reviews.filter((r) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      (r.comment || '').toLowerCase().includes(query) ||
      (r.user_id || '').toLowerCase().includes(query) ||
      (r.course_id || '').toLowerCase().includes(query);

    const matchesStar = starFilter === 'all' || r.rating === starFilter;

    return matchesSearch && matchesStar;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage) || 1;
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Stats
  const totalReviewsCount = reviews.length;
  const avgRating = totalReviewsCount > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviewsCount).toFixed(1)
    : '5.0';

  // Handlers
  const handleTogglePublish = async (review: CourseReview) => {
    const nextState = !review.is_published;
    const res = await courseReviewService.publishReview(review.id, nextState);
    if (res.data) {
      setReviews(prev => prev.map(r => r.id === review.id ? { ...r, is_published: nextState } : r));
    }
  };

  const handleToggleFeatured = async (review: CourseReview) => {
    const nextState = !review.is_featured;
    const res = await courseReviewService.featureReview(review.id, nextState);
    if (res.data) {
      setReviews(prev => prev.map(r => r.id === review.id ? { ...r, is_featured: nextState } : r));
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (window.confirm('Delete this review permanently?')) {
      const res = await courseReviewService.deleteReview(id);
      if (!res.error) {
        setReviews(prev => prev.filter(r => r.id !== id));
      }
    }
  };

  const handleOpenReplyModal = (review: CourseReview) => {
    setReplyingReview(review);
    setReplyText(review.instructor_reply || '');
  };

  const handleSaveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingReview) return;

    setSubmittingReply(true);
    const res = await courseReviewService.replyToReview(replyingReview.id, replyText);
    if (res.data) {
      setReviews(prev => prev.map(r => r.id === replyingReview.id ? { ...r, instructor_reply: replyText, replied_at: new Date().toISOString() } : r));
      setReplyingReview(null);
    }
    setSubmittingReply(false);
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
          <h2 className="font-serif font-bold text-2xl text-[#102A36]">Course Reviews</h2>
          <p className="text-xs text-[#486D7A] mt-1">Moderate student feedback, feature top testimonials, and post instructor replies.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Avg Rating: {avgRating} / 5.0 ({totalReviewsCount} reviews)</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="p-4 rounded-2xl bg-white border border-[#C8E6E1] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#486D7A] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search review comments or student ID..."
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
            <span>Rating:</span>
          </div>
          <select
            value={starFilter}
            onChange={(e) => {
              setStarFilter(e.target.value === 'all' ? 'all' : Number(e.target.value));
              setCurrentPage(1);
            }}
            className="text-xs px-3 py-2 rounded-xl border border-[#C8E6E1] bg-[#F7FCFA] text-[#102A36] font-semibold focus:outline-none focus:ring-2 focus:ring-[#287687]"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-2xl border border-[#C8E6E1] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#486D7A] flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#287687]" />
            <span className="text-xs font-semibold">Loading student reviews...</span>
          </div>
        ) : paginatedReviews.length === 0 ? (
          <div className="p-12 text-center text-[#486D7A]">
            <Star className="w-10 h-10 mx-auto text-[#C8E6E1] mb-2" />
            <p className="text-sm font-bold text-[#102A36]">No reviews found</p>
            <p className="text-xs text-[#486D7A] mt-1">Try updating your rating filter or search term.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#EEF7F5] border-b border-[#C8E6E1] text-[11px] font-bold text-[#102A36] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Course</th>
                  <th className="py-3.5 px-4 w-1/3">Comment</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2F1EE] text-xs">
                {paginatedReviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-[#F7FCFA] transition-colors">
                    <td className="py-3 px-4 font-bold text-[#102A36]">
                      <div className="flex items-center gap-1 text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < (rev.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-[#102A36]">
                      {getCourseTitle(rev.course_id)}
                    </td>
                    <td className="py-3 px-4 text-[#102A36]">
                      <p className="line-clamp-2 italic">"{rev.comment || 'No comment provided.'}"</p>
                      {rev.instructor_reply && (
                        <div className="mt-1.5 p-2 rounded-lg bg-[#EEF7F5] border border-[#C8E6E1] text-[11px] text-[#287687] flex items-start gap-1.5">
                          <CornerDownRight className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Instructor Reply:</span> {rev.instructor_reply}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#486D7A]">
                      {rev.user_id?.slice(0, 8)}...
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit ${
                          rev.is_published ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {rev.is_published ? 'Published' : 'Hidden'}
                        </span>
                        {rev.is_featured && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-bold uppercase tracking-wider w-fit">
                            <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleTogglePublish(rev)}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-colors cursor-pointer ${
                            rev.is_published
                              ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                              : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white'
                          }`}
                        >
                          {rev.is_published ? 'Unpublish' : 'Publish'}
                        </button>

                        <button
                          onClick={() => handleOpenReplyModal(rev)}
                          className="px-2.5 py-1 rounded-lg bg-[#EEF7F5] hover:bg-[#287687] text-[#287687] hover:text-white font-bold text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>Reply</span>
                        </button>

                        <button
                          onClick={() => handleDeleteReview(rev.id)}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {filteredReviews.length > 0 && (
          <div className="p-4 border-t border-[#C8E6E1] bg-[#F7FCFA] flex items-center justify-between">
            <span className="text-xs text-[#486D7A] font-medium">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredReviews.length)} of {filteredReviews.length} reviews
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

      {/* Modal: Instructor Reply */}
      {replyingReview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#C8E6E1] shadow-2xl w-full max-w-md p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#C8E6E1] pb-4">
              <h3 className="font-serif font-bold text-lg text-[#102A36] flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-[#287687]" />
                Instructor Reply
              </h3>
              <button
                onClick={() => setReplyingReview(null)}
                className="p-2 rounded-full hover:bg-gray-100 text-[#486D7A] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#F7FCFA] border border-[#E2F1EE] text-xs space-y-1">
              <div className="font-bold text-[#102A36]">Student Comment:</div>
              <p className="text-[#486D7A] italic">"{replyingReview.comment}"</p>
            </div>

            <form onSubmit={handleSaveReply} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#102A36] mb-1">
                  Your Public Response
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Thank the student or address their feedback..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#C8E6E1] bg-[#F7FCFA] text-[#102A36] focus:outline-none focus:ring-2 focus:ring-[#287687]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReplyingReview(null)}
                  className="px-4 py-2 rounded-xl border border-[#C8E6E1] text-[#102A36] font-bold text-xs hover:bg-[#F7FCFA] cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingReply}
                  className="px-5 py-2 rounded-xl bg-[#287687] hover:bg-[#1C5B69] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {submittingReply && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Post Reply</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
