import React from 'react';
import { Course } from '../types';
import { X, CheckCircle2, Clock, Award, ShieldCheck, Star, Calendar, ArrowRight, Sparkles } from 'lucide-react';
import { sanitizeImageUrl, DEFAULT_BANNER_IMAGE } from '../utils/imageUtils';

interface CourseDetailsModalProps {
  course: Course | null;
  onClose: () => void;
  onEnroll: (course: Course) => void;
}

export const CourseDetailsModal: React.FC<CourseDetailsModalProps> = ({
  course,
  onClose,
  onEnroll
}) => {
  if (!course) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-4xl bg-white rounded-[2rem] border border-[#C8E6E1] shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col text-[#102A36]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Banner */}
        <div className="relative h-32 sm:h-40 md:h-44 w-full overflow-hidden shrink-0">
          <img
            src={sanitizeImageUrl(course.bannerImage || course.image, DEFAULT_BANNER_IMAGE)}
            alt={course.name}
            className="w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = DEFAULT_BANNER_IMAGE;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#102A36] via-[#102A36]/60 to-black/20" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-all cursor-pointer z-10"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Top Category & Mode */}
          <div className="absolute top-3 left-3 flex gap-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[#287687] text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
              {course.category}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#287687] text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
              {course.mode}
            </span>
          </div>

          <div className="absolute bottom-3 left-4 right-4 text-white">
            <span className="text-[10px] sm:text-xs font-bold text-[#CBA258] uppercase tracking-widest block mb-0.5">
              {course.level} Level • Accredited Program
            </span>
            <h2 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold leading-tight line-clamp-1">
              {course.name}
            </h2>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1">
          
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-[#E2F1EE] border border-[#C8E6E1] text-xs">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-[#287687]" />
              <div>
                <span className="text-[#486D7A] block font-semibold uppercase text-[10px] tracking-wider">Duration</span>
                <span className="font-bold text-[#102A36]">{course.duration}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Award className="w-4 h-4 text-[#287687]" />
              <div>
                <span className="text-[#486D7A] block font-semibold uppercase text-[10px] tracking-wider">Certification</span>
                <span className="font-bold text-[#102A36]">Accredited</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
              <div>
                <span className="text-[#486D7A] block font-semibold uppercase text-[10px] tracking-wider">Rating</span>
                <span className="font-bold text-[#102A36]">{course.rating.toFixed(2)} ({course.reviewsCount} reviews)</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-[#287687]" />
              <div>
                <span className="text-[#486D7A] block font-semibold uppercase text-[10px] tracking-wider">Next Batch</span>
                <span className="font-bold text-[#102A36]">{course.upcomingBatchDate || 'Enrollment Open'}</span>
              </div>
            </div>
          </div>

          {/* Full Description */}
          <div className="space-y-3">
            <h3 className="text-xl font-serif font-bold text-[#102A36]">
              About This Program
            </h3>
            <p className="text-sm sm:text-base text-[#486D7A] leading-relaxed whitespace-pre-line">
              {course.fullDescription}
            </p>
          </div>

          {/* Key Learning Outcomes */}
          <div className="space-y-3">
            <h3 className="text-xl font-serif font-bold text-[#102A36] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#287687]" />
              What You Will Master & Achieve
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {course.keyOutcomes.map((outcome, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#EEF7F5] border border-[#C8E6E1] text-xs sm:text-sm text-[#102A36]">
                  <CheckCircle2 className="w-4 h-4 text-[#287687] shrink-0 mt-0.5" />
                  <span>{outcome}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Certification Badge Box */}
          <div className="p-6 rounded-2xl bg-[#E2F1EE] border border-[#C8E6E1] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#287687] text-white flex items-center justify-center shrink-0 shadow-md">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-widest font-bold text-[#287687]">
                  Official Certificate
                </span>
                <h4 className="font-serif text-lg font-bold text-[#102A36]">
                  {course.certificationName}
                </h4>
                <p className="text-xs text-[#486D7A]">
                  Signed directly by Heer upon course completion & practical evaluation.
                </p>
              </div>
            </div>
          </div>

          {/* Instructor Bio */}
          <div className="p-5 rounded-2xl bg-[#E2F1EE] border border-[#C8E6E1] flex items-center gap-4">
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#486D7A] block">Your Lead Facilitator</span>
              <h4 className="font-serif font-bold text-lg text-[#102A36]">
                {course.instructor}
              </h4>
              <p className="text-xs text-[#486D7A]">
                {course.instructorRole} • Personally guiding your transformation journey
              </p>
            </div>
          </div>

        </div>

        {/* Footer Action Bar */}
        <div className="p-4 sm:p-6 bg-[#E2F1EE] border-t border-[#C8E6E1] flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-[#486D7A] font-semibold uppercase tracking-wider">Fee:</span>
            <span className="text-3xl font-bold font-serif text-[#102A36]">
              {course.currency}{course.price.toLocaleString()}
            </span>
            {course.originalPrice && (
              <span className="text-sm text-[#486D7A] line-through font-medium">
                {course.currency}{course.originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial py-3 px-6 rounded-full bg-white text-[#102A36] text-xs font-bold uppercase tracking-widest border border-[#C8E6E1] hover:border-[#287687] cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onEnroll(course);
              }}
              className="flex-1 sm:flex-initial py-3 px-8 rounded-full bg-[#102A36] hover:bg-[#287687] text-white text-xs font-bold uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Enroll Now</span>
              <ArrowRight className="w-4 h-4 text-[#CBA258]" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
