import React, { useState } from 'react';
import { X, Play, Video, AlertCircle, Sparkles, BookOpen, ExternalLink, RefreshCw } from 'lucide-react';
import { storageService } from '../services/storageService';

interface VideoPreviewModalProps {
  videoUrl?: string | null;
  courseTitle: string;
  onClose: () => void;
  onOpenInteractivePreview?: () => void;
}

/**
 * Helper to convert YouTube or Vimeo watch URLs into proper embed URLs
 */
function formatEmbedVideoUrl(rawUrl: string): { isEmbed: boolean; formattedUrl: string } {
  if (!rawUrl) return { isEmbed: false, formattedUrl: '' };

  const url = storageService.getStorageUrl(rawUrl);
  const cleanUrl = url.trim();

  // YouTube match
  const ytMatch = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return {
      isEmbed: true,
      formattedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0`,
    };
  }

  // Vimeo match
  const vimeoMatch = cleanUrl.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      isEmbed: true,
      formattedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
    };
  }

  // Already an iframe embed URL
  if (cleanUrl.includes('/embed/')) {
    return { isEmbed: true, formattedUrl: cleanUrl };
  }

  return { isEmbed: false, formattedUrl: cleanUrl };
}

export const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({
  videoUrl,
  courseTitle,
  onClose,
  onOpenInteractivePreview,
}) => {
  const [hasError, setHasError] = useState(false);

  const { isEmbed, formattedUrl } = formatEmbedVideoUrl(videoUrl || '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header Bar */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#287687]/20 border border-[#287687]/40 text-[#287687] flex items-center justify-center shrink-0">
              <Video className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 block">
                Course Preview Video
              </span>
              <h3 className="text-sm font-bold text-white truncate">
                {courseTitle}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Player Container */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
          {formattedUrl && !hasError ? (
            isEmbed ? (
              <iframe
                src={formattedUrl}
                title={`Preview Video - ${courseTitle}`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onError={() => setHasError(true)}
              />
            ) : (
              <video
                src={formattedUrl}
                controls
                autoPlay
                playsInline
                preload="metadata"
                className="w-full h-full object-contain"
                onError={(e) => {
                  console.error('Video error:', e);
                  setHasError(true);
                }}
              >
                Your browser does not support HTML5 video playback.
              </video>
            )
          ) : (
            <div className="p-8 text-center space-y-4 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">
                  {videoUrl ? 'Unable to Load Video Stream' : 'No Preview Video Attached'}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {videoUrl
                    ? 'The preview video link may be restricted or unsupported. You can still explore the full interactive curriculum player below.'
                    : 'The instructor has not attached a preview trailer video for this course yet.'}
                </p>
              </div>

              {onOpenInteractivePreview && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenInteractivePreview();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#287687] hover:bg-[#102A36] text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer shadow-md"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Launch Interactive Player Preview</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium">R2 & Media Streaming Engine</span>
          </div>

          {onOpenInteractivePreview && (
            <button
              onClick={() => {
                onClose();
                onOpenInteractivePreview();
              }}
              className="text-[#287687] hover:text-emerald-300 font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Explore Curriculum Modules</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default VideoPreviewModal;
