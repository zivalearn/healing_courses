import React from 'react';
import { BuilderLesson, LessonBlock } from '../../../models/builder';
import { storageService } from '../../../services/storageService';
import { 
  X, 
  Sparkles, 
  Clock, 
  Heart, 
  Play, 
  FileText, 
  Download, 
  CheckSquare, 
  BookOpen, 
  PenTool,
  Award,
  Music,
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react';

interface StudentPreviewModalProps {
  isOpen: boolean;
  lesson: BuilderLesson | null;
  courseTitle: string;
  onClose: () => void;
}

export const StudentPreviewModal: React.FC<StudentPreviewModalProps> = ({
  isOpen,
  lesson,
  courseTitle,
  onClose
}) => {
  if (!isOpen || !lesson) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 animate-fade-in overflow-y-auto">
      <div className="bg-[#FAFDFD] rounded-3xl border border-[#C8E6E1] shadow-2xl max-w-4xl w-full my-auto overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Student View Bar */}
        <div className="p-4 bg-[#102A36] text-white border-b border-[#1C3E4C] flex items-center justify-between gap-2 shrink-0">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#CBA258]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Student LMS Preview</span>
            </div>
            <h3 className="text-sm font-bold text-white/90 truncate">{courseTitle}</h3>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Exit Preview</span>
          </button>
        </div>

        {/* Student Lesson Canvas Content */}
        <div className="p-6 sm:p-10 overflow-y-auto space-y-8 flex-1">
          
          {/* Lesson Header */}
          <div className="border-b border-[#E2F1EE] pb-6 space-y-2">
            <div className="flex items-center gap-3 text-xs font-bold text-[#287687]">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-[#CBA258]" />
                {lesson.estimatedTime || '15 mins'}
              </span>
              {lesson.isPreviewAllowed && (
                <span className="px-2 py-0.5 rounded-md bg-[#CBA258] text-[#102A36] text-[10px] uppercase font-bold">
                  Free Preview Lesson
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#102A36]">
              {lesson.title}
            </h1>
            {lesson.subtitle && (
              <p className="text-sm text-[#486D7A] font-medium leading-relaxed">
                {lesson.subtitle}
              </p>
            )}
          </div>

          {/* Render Lesson Blocks */}
          <div className="space-y-6">
            {lesson.blocks.map((block) => (
              <div key={block.id} className="animate-fade-in">
                
                {/* HEADING */}
                {block.type === 'heading' && (
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#102A36] pt-2">
                    {block.content.text}
                  </h2>
                )}

                {/* PARAGRAPH & RICH TEXT */}
                {(block.type === 'paragraph' || block.type === 'rich-text') && (
                  <p className="text-sm sm:text-base text-[#2C414B] leading-relaxed">
                    {block.content.text}
                  </p>
                )}

                {/* QUOTE */}
                {block.type === 'quote' && (
                  <div className="p-5 rounded-2xl bg-[#EEF7F5] border-l-4 border-[#CBA258] space-y-2">
                    <p className="font-serif italic text-base text-[#102A36]">
                      {block.content.text}
                    </p>
                    {block.content.caption && (
                      <p className="text-xs font-bold text-[#287687]">
                        {block.content.caption}
                      </p>
                    )}
                  </div>
                )}

                {/* CALLOUT */}
                {block.type === 'callout' && (
                  <div className="p-4 rounded-2xl bg-[#102A36] text-white flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-[#CBA258] shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm font-medium leading-relaxed">
                      {block.content.text}
                    </p>
                  </div>
                )}

                {/* MEDITATION */}
                {block.type === 'meditation' && (
                  <div className="p-6 rounded-3xl bg-gradient-to-r from-[#102A36] to-[#1C5B69] text-white space-y-4 shadow-xl">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#CBA258]">
                      <Heart className="w-4 h-4 text-[#CBA258]" />
                      <span>Subconscious Meditation Practice</span>
                    </div>
                    <h3 className="text-lg font-serif font-bold">{block.content.title || 'Guided Meditation'}</h3>
                    {block.content.meditationInstructions && (
                      <p className="text-xs text-white/80 leading-relaxed">{block.content.meditationInstructions}</p>
                    )}

                    {block.content.meditationAudioUrl ? (
                      <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-2">
                        <audio
                          controls
                          src={storageService.getStorageUrl(block.content.meditationAudioUrl)}
                          className="w-full accent-[#CBA258]"
                        >
                          Your browser does not support audio playback.
                        </audio>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-black/20 border border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button className="w-12 h-12 rounded-full bg-[#CBA258] text-[#102A36] flex items-center justify-center font-bold cursor-pointer hover:scale-105 transition-transform">
                            <Play className="w-6 h-6 fill-[#102A36] ml-0.5" />
                          </button>
                          <div>
                            <span className="text-xs font-bold block">Start Audio Session</span>
                            <span className="text-[10px] text-white/70">{block.content.meditationDuration || '10:00'} Duration</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* AFFIRMATION */}
                {block.type === 'affirmation' && (
                  <div className="p-8 rounded-3xl bg-gradient-to-r from-[#102A36] to-[#1C5B69] text-white text-center space-y-3 border border-[#CBA258]">
                    <Sparkles className="w-6 h-6 text-[#CBA258] mx-auto" />
                    <p className="font-serif italic text-lg sm:text-xl max-w-xl mx-auto leading-relaxed">
                      "{block.content.affirmationText}"
                    </p>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#CBA258] block">
                      Daily Subconscious Anchor
                    </span>
                  </div>
                )}

                {/* REFLECTION & JOURNAL */}
                {(block.type === 'reflection' || block.type === 'journal') && (
                  <div className="p-5 rounded-2xl bg-white border border-[#C8E6E1] space-y-3 shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#287687]">
                      {block.type === 'reflection' ? <PenTool className="w-4 h-4 text-[#CBA258]" /> : <BookOpen className="w-4 h-4 text-[#CBA258]" />}
                      <span>{block.type === 'reflection' ? 'Self-Reflection Prompt' : 'Daily Journal Entry'}</span>
                    </div>
                    <p className="text-xs font-bold text-[#102A36]">{block.content.prompt}</p>
                    <textarea
                      rows={4}
                      placeholder="Type your personal reflection here... (saved automatically)"
                      className="w-full p-3 rounded-xl border border-[#C8E6E1] bg-[#F7FCFA] text-xs text-[#102A36] focus:outline-none"
                    />
                  </div>
                )}

                {/* VIDEO */}
                {block.type === 'video' && (
                  <div className="space-y-2">
                    {block.content.url ? (
                      <div className="aspect-video bg-[#102A36] rounded-2xl overflow-hidden shadow-lg flex items-center justify-center">
                        <video
                          src={storageService.getStorageUrl(block.content.url)}
                          poster={block.content.thumbnailUrl ? storageService.getStorageUrl(block.content.thumbnailUrl) : undefined}
                          controls
                          preload="metadata"
                          className="w-full h-full object-contain"
                        >
                          Your browser does not support HTML video.
                        </video>
                      </div>
                    ) : (
                      <div className="aspect-video bg-[#102A36] rounded-2xl flex items-center justify-center text-white relative overflow-hidden group">
                        <Play className="w-12 h-12 text-[#CBA258] group-hover:scale-110 transition-transform cursor-pointer" />
                        <span className="absolute bottom-3 left-4 text-xs font-bold bg-black/60 px-2 py-1 rounded">
                          {block.content.caption || 'Lesson Video'} ({block.content.duration || '12:00'})
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* IMAGE */}
                {block.type === 'image' && block.content.url && (
                  <div className="space-y-2">
                    <div className="rounded-2xl overflow-hidden border border-[#C8E6E1] bg-slate-900 shadow-md">
                      <img
                        src={storageService.getStorageUrl(block.content.url)}
                        alt={block.content.caption || 'Lesson visual'}
                        className="w-full max-h-96 object-contain mx-auto"
                      />
                    </div>
                    {block.content.caption && (
                      <p className="text-xs text-center text-[#486D7A] font-medium">{block.content.caption}</p>
                    )}
                  </div>
                )}

                {/* PDF */}
                {block.type === 'pdf' && block.content.url && (
                  <div className="p-5 rounded-2xl bg-[#EEF7F5] border border-[#C8E6E1] flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-7 h-7 text-[#287687] shrink-0" />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-[#102A36] block truncate">
                          {block.content.title || 'PDF Document Resource'}
                        </span>
                        <span className="text-[10px] text-[#486D7A]">Interactive Workbook / PDF</span>
                      </div>
                    </div>
                    <a
                      href={storageService.getStorageUrl(block.content.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-[#287687] hover:bg-[#102A36] text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open PDF</span>
                    </a>
                  </div>
                )}

                {/* DOWNLOAD */}
                {block.type === 'download' && (
                  <div className="p-4 rounded-2xl bg-[#EEF7F5] border border-[#C8E6E1] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-6 h-6 text-[#287687]" />
                      <div>
                        <span className="text-xs font-bold text-[#102A36] block">{block.content.title || 'Download Resource'}</span>
                        <span className="text-[10px] text-[#486D7A]">{block.content.fileSize || 'PDF File'}</span>
                      </div>
                    </div>
                    {block.content.url ? (
                      <a
                        href={storageService.getStorageUrl(block.content.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-[#287687] hover:bg-[#102A36] text-white text-xs font-bold flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    ) : (
                      <button className="px-3 py-1.5 rounded-xl bg-[#287687] text-white text-xs font-bold flex items-center gap-1">
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    )}
                  </div>
                )}

              </div>
            ))}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F7FCFA] border-t border-[#C8E6E1] flex items-center justify-between text-xs text-[#486D7A]">
          <span>Heal With Heer Student LMS Render Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#102A36] text-white font-bold cursor-pointer hover:bg-[#1C5B69]"
          >
            Back to Course Studio
          </button>
        </div>

      </div>
    </div>
  );
};
