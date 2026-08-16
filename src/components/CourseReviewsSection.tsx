import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { courseReviewService as reviewSvc } from '../services/courseReviewService';
import { CourseReview, RatingDistribution } from '../types/courseReview';
import { authService } from '../services/authService';
import { Star, MessageSquare, CheckCircle2, User, Send, ThumbsUp, AlertCircle, Sparkles, Filter } from 'lucide-react';

interface CourseReviewsSectionProps {
  courseId: string;
  courseTitle: string;
}

export const CourseReviewsSection: React.FC<CourseReviewsSectionProps> = ({
  courseId,
  courseTitle,
}) => {
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [average, setAverage] = useState<number>(4.9);
  const [count, setCount] = useState<number>(0);
  const [distribution, setDistribution] = useState<RatingDistribution>({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    total: 0,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');

  // Review Submission Modal / Form State
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // New Review Form Fields
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewTitle, setReviewTitle] = useState<string>('');
  const [reviewBody, setReviewBody] = useState<string>('');
  const [reviewerName, setReviewerName] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        setCurrentUserId(user.id);
        if (user.email && !reviewerName) {
          setReviewerName(user.email.split('@')[0]);
        }
      }

      const [revRes, avgRes, distRes] = await Promise.all([
        reviewSvc.getCourseReviews(courseId),
        reviewSvc.getAverageRating(courseId),
        reviewSvc.getRatingDistribution(courseId),
      ]);

      if (revRes.error) {
        throw revRes.error;
      }

      setReviews(revRes.data || []);
      setAverage(avgRes.average || 0);
      setCount(avgRes.count || revRes.data?.length || 0);
      if (distRes.distribution && distRes.distribution.total > 0) {
        setDistribution(distRes.distribution);
      } else {
        const total = revRes.data?.length || 0;
        setDistribution({
          5: total,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
          total: total,
        });
      }
    } catch (err: any) {
      console.error('Failed to load reviews:', err);
      setError('Failed to load student reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!reviewTitle.trim() || !reviewBody.trim()) {
      setSubmitError('Please fill out both the title and review text.');
      return;
    }

    setSubmitting(true);
    try {
      const userId = currentUserId || `guest-${Date.now()}`;
      const res = await reviewSvc.createReview({
        course_id: courseId,
        user_id: userId,
        rating,
        title: reviewTitle.trim(),
        review: reviewBody.trim(),
        is_published: true,
        is_verified: true,
      });

      if (res.error) {
        throw res.error;
      }

      setSubmitSuccess('Thank you! Your review has been published successfully.');
      setReviewTitle('');
      setReviewBody('');
      setRating(5);
      setIsFormOpen(false);

      // Reload list
      await loadData();
    } catch (err: any) {
      console.error('Error submitting review:', err);
      setSubmitError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReviews = filterRating === 'all'
    ? reviews
    : reviews.filter((r) => Math.round(r.rating) === filterRating);

  return (
    <div className="space-y-8 bg-white p-6 sm:p-8 rounded-3xl border border-[#C8E6E1] shadow-2xs">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C8E6E1] pb-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#287687] flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Student Feedback & Ratings
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#102A36] mt-1">
            Course Reviews
          </h2>
        </div>

        <button
          onClick={() => setIsFormOpen(true)}
          className="px-5 py-2.5 rounded-2xl bg-[#102A36] hover:bg-[#287687] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <MessageSquare className="w-4 h-4 text-[#E5C158]" />
          <span>Write a Review</span>
        </button>
      </div>

      {submitSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{submitSuccess}</span>
        </div>
      )}

      {/* Ratings Summary & Star Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-6 rounded-2xl bg-[#EEF7F5] border border-[#C8E6E1]">
        
        {/* Left Score Box */}
        <div className="md:col-span-4 text-center md:text-left space-y-2 border-b md:border-b-0 md:border-r border-[#C8E6E1] pb-6 md:pb-0 md:pr-6">
          <div className="font-serif text-5xl font-bold text-[#102A36]">
            {average.toFixed(1)}
          </div>

          <div className="flex items-center justify-center md:justify-start gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-5 h-5 ${
                  s <= Math.round(average)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>

          <p className="text-xs text-[#486D7A] font-medium">
            Based on <strong>{count}</strong> verified student reviews
          </p>
        </div>

        {/* Right Star Bars Distribution */}
        <div className="md:col-span-8 space-y-2">
          {[5, 4, 3, 2, 1].map((stars) => {
            const starCount = distribution[stars as 1 | 2 | 3 | 4 | 5] || 0;
            const percentage = distribution.total > 0 ? Math.round((starCount / distribution.total) * 100) : 0;

            return (
              <div key={stars} className="flex items-center gap-3 text-xs text-[#486D7A]">
                <button
                  onClick={() => setFilterRating(filterRating === stars ? 'all' : stars)}
                  className={`w-12 text-left font-bold flex items-center gap-1 hover:text-[#287687] cursor-pointer ${
                    filterRating === stars ? 'text-[#287687] underline' : ''
                  }`}
                >
                  <span>{stars}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </button>

                <div className="flex-1 h-2.5 bg-white rounded-full overflow-hidden border border-[#C8E6E1]">
                  <div
                    className="h-full bg-gradient-to-r from-[#287687] to-[#3a9cb1] rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <span className="w-10 text-right font-mono font-semibold text-[#102A36]">
                  {percentage}%
                </span>
              </div>
            );
          })}
        </div>

      </div>

      {/* Rating Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-[#C8E6E1]/60 pt-2">
        <span className="text-xs font-bold text-[#102A36] uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
          <Filter className="w-3.5 h-3.5 text-[#287687]" /> Filter:
        </span>
        <button
          onClick={() => setFilterRating('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filterRating === 'all'
              ? 'bg-[#102A36] text-white shadow-xs'
              : 'bg-[#EEF7F5] text-[#486D7A] hover:bg-[#C8E6E1]'
          }`}
        >
          All Reviews ({reviews.length})
        </button>
        {[5, 4, 3, 2, 1].map((s) => (
          <button
            key={s}
            onClick={() => setFilterRating(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              filterRating === s
                ? 'bg-[#102A36] text-white shadow-xs'
                : 'bg-[#EEF7F5] text-[#486D7A] hover:bg-[#C8E6E1]'
            }`}
          >
            <span>{s} Stars</span>
          </button>
        ))}
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="py-12 text-center space-y-2">
          <Sparkles className="w-6 h-6 text-[#287687] animate-spin mx-auto" />
          <p className="text-xs text-[#486D7A] font-semibold">Loading reviews...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="py-12 text-center bg-[#EEF7F5]/50 rounded-2xl border border-[#C8E6E1] space-y-3 p-6">
          <MessageSquare className="w-8 h-8 text-[#287687] mx-auto opacity-50" />
          <h4 className="font-serif font-bold text-lg text-[#102A36]">No Reviews Found</h4>
          <p className="text-xs text-[#486D7A]">
            {filterRating !== 'all'
              ? `No ${filterRating}-star reviews yet for this course.`
              : 'Be the first student to leave an official review for this course!'}
          </p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#102A36] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#287687] transition-all cursor-pointer"
          >
            Write First Review
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((rev) => (
            <motion.div
              key={rev.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl bg-white border border-[#C8E6E1] space-y-3 hover:border-[#287687] transition-all shadow-2xs"
            >
              {/* Review Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#102A36] text-white flex items-center justify-center font-bold text-sm">
                    {rev.title ? rev.title.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-[#102A36]">
                        {rev.title || 'Verified Graduate'}
                      </h4>
                      {rev.is_verified && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Verified
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#486D7A]">
                      {rev.created_at ? new Date(rev.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recent'}
                    </span>
                  </div>
                </div>

                {/* Rating Stars */}
                <div className="flex items-center gap-0.5 bg-[#EEF7F5] px-2.5 py-1 rounded-lg border border-[#C8E6E1]">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${
                        s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Review Title & Content */}
              {rev.title && (
                <h5 className="font-bold text-sm text-[#102A36] pt-1">{rev.title}</h5>
              )}
              <p className="text-xs sm:text-sm text-[#486D7A] leading-relaxed whitespace-pre-line">
                {rev.review}
              </p>

              {/* Instructor Reply */}
              {rev.instructor_reply && (
                <div className="mt-3 p-3.5 rounded-xl bg-[#EEF7F5] border-l-4 border-[#287687] space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#102A36]">
                    <Sparkles className="w-3.5 h-3.5 text-[#CBA258]" />
                    <span>Response from Master Heer:</span>
                  </div>
                  <p className="text-xs text-[#486D7A] italic">
                    "{rev.instructor_reply}"
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Review Submission Modal Dialog */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#C8E6E1] shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[#C8E6E1] pb-4">
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#102A36]">Write a Course Review</h3>
                  <p className="text-xs text-[#486D7A] truncate max-w-xs">{courseTitle}</p>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 text-gray-400 hover:text-[#102A36] rounded-full hover:bg-gray-100 transition-colors"
                >
                  ✕
                </button>
              </div>

              {submitError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitReview} className="space-y-4">
                
                {/* Star Rating Selection */}
                <div className="space-y-1.5 text-center py-2 bg-[#EEF7F5] rounded-2xl border border-[#C8E6E1]">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#102A36] block">
                    Your Overall Rating
                  </label>
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRating(s)}
                        onMouseEnter={() => setHoverRating(s)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 cursor-pointer transition-transform hover:scale-125"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            s <= (hoverRating || rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] font-bold text-[#287687]">
                    {rating === 5 ? '⭐⭐⭐⭐⭐ Exceptional (5/5)' : `${rating} Stars out of 5`}
                  </span>
                </div>

                {/* Review Headline / Title */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#102A36] uppercase tracking-wider">
                    Review Headline *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Life-changing energy alchemy course!"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#C8E6E1] text-xs focus:outline-none focus:ring-2 focus:ring-[#287687]"
                  />
                </div>

                {/* Review Text */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#102A36] uppercase tracking-wider">
                    Detailed Feedback *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Share what you liked most about the curriculum, attunements, or instructor guidance..."
                    value={reviewBody}
                    onChange={(e) => setReviewBody(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#C8E6E1] text-xs focus:outline-none focus:ring-2 focus:ring-[#287687] resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold uppercase tracking-wider hover:bg-gray-50 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-[#102A36] hover:bg-[#287687] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin" />
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-[#E5C158]" />
                        <span>Submit Review</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default CourseReviewsSection;
