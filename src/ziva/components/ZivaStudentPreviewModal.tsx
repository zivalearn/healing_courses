import React from 'react';
import { ZivaLesson, ZivaCourse } from '../types';
import { ZivaStudentBlockRenderer } from './ZivaStudentBlockRenderer';
import { X, Eye, Clock, ShieldCheck, Sparkles } from 'lucide-react';

interface ZivaStudentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: ZivaCourse;
  lesson: ZivaLesson | null;
  moduleTitle?: string;
}

export const ZivaStudentPreviewModal: React.FC<ZivaStudentPreviewModalProps> = ({
  isOpen,
  onClose,
  course,
  lesson,
  moduleTitle,
}) => {
  if (!isOpen || !lesson) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-neutral-950 border border-amber-500/40 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-white my-auto">
        {/* MODAL HEADER */}
        <div className="bg-black/90 border-b border-gray-900 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#FF2E93]/20 border border-pink-500/40 rounded-xl text-pink-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-pink-500">
                  Student Live View Simulator
                </span>
                {lesson.is_preview && (
                  <span className="text-[9px] bg-emerald-950 border border-emerald-500/40 text-emerald-400 font-bold px-2 py-0.5 rounded">
                    Free Preview
                  </span>
                )}
              </div>
              <h2 className="text-base font-serif font-bold text-amber-300 line-clamp-1">
                {course.title} {moduleTitle ? `• ${moduleTitle}` : ''}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-neutral-900 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL CONTENT BODY */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-8 max-h-[calc(92vh-80px)]">
          {/* LESSON BANNER & HEADER */}
          <div className="bg-gradient-to-r from-neutral-950 via-black to-neutral-950 border border-gray-900 p-6 rounded-3xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                {moduleTitle || 'Executive Curriculum'}
              </span>
              <div className="flex items-center gap-2 text-gray-400 text-xs">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{lesson.estimated_duration || 15} mins duration</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
              {lesson.title}
            </h1>

            {lesson.subtitle && (
              <p className="text-sm text-gray-300 font-light leading-relaxed">
                {lesson.subtitle}
              </p>
            )}
          </div>

          {/* LESSON CONTENT BLOCKS */}
          <div className="space-y-6">
            {lesson.blocks && lesson.blocks.length > 0 ? (
              lesson.blocks.map((block) => (
                <ZivaStudentBlockRenderer
                  key={block.id}
                  block={block}
                  courseId={course.id}
                  lessonId={lesson.id}
                />
              ))
            ) : (
              <div className="py-16 text-center text-gray-500 bg-black rounded-2xl border border-gray-900">
                This lesson currently contains no content blocks. Add blocks in the builder to preview here.
              </div>
            )}
          </div>

          {/* SIMULATED LESSON COMPLETION */}
          <div className="bg-black border border-gray-900 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Ready for next executive practice?</p>
                <p className="text-[11px] text-gray-400">Complete all blocks and interactive tasks above</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="bg-[#FF2E93] hover:bg-pink-600 text-white font-bold text-xs uppercase tracking-widest px-6 py-2.5 rounded-xl shadow-lg transition-colors cursor-pointer"
            >
              Exit Preview & Return to Builder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
