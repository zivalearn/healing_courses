import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { LessonBlock } from '../../models/lessonBlock';
import { QuizBlock } from '../../components/QuizBlock';
import { HLSVideoPlayer } from '../../components/HLSVideoPlayer';
import { storageService } from '../../services/storageService';
import {
  FileText,
  Video,
  Music,
  Image as ImageIcon,
  Download,
  Code,
  CheckSquare,
  ExternalLink,
  HelpCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Heart,
  BookOpen,
  Send,
  AlertCircle,
  Quote,
  Layers,
  CheckCircle2,
} from 'lucide-react';

interface StudentBlockRendererProps {
  block: LessonBlock;
  userId: string;
  onBlockCompleted?: (blockId: string) => void;
}

const R2StreamPlayer: React.FC<{
  courseId: string;
  lessonId: string;
  manifestKey?: string;
  fallbackUrl?: string;
  poster?: string;
  title?: string;
}> = ({ courseId, lessonId, manifestKey, fallbackUrl, poster, title }) => {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [useFallback, setUseFallback] = useState<boolean>(false);

  // Extract precise courseId & lessonId if generic placeholders were passed
  const effectiveCourseId =
    courseId && courseId !== 'course' && courseId !== 'general'
      ? courseId
      : manifestKey?.split('/courses/')?.[1]?.split('/')?.[0] ||
        fallbackUrl?.split('/courses/')?.[1]?.split('/')?.[0] ||
        courseId ||
        'general';

  const effectiveLessonId =
    lessonId && lessonId !== 'lesson' && lessonId !== 'general'
      ? lessonId
      : manifestKey?.split('/lessons/')?.[1]?.split('/')?.[0] ||
        fallbackUrl?.split('/lessons/')?.[1]?.split('/')?.[0] ||
        lessonId ||
        'general';

  useEffect(() => {
    let isMounted = true;
    async function authorize() {
      setIsLoading(true);
      setUseFallback(false);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch('/api/video/authorize-playback', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            courseId: effectiveCourseId,
            lessonId: effectiveLessonId,
            manifestKey: manifestKey || (fallbackUrl?.includes('hls/') ? fallbackUrl : undefined),
          }),
        });

        let data: any = null;
        try {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            data = await res.json();
          } else {
            const text = await res.text();
            try {
              data = JSON.parse(text);
            } catch {
              data = null;
            }
          }
        } catch {
          data = null;
        }

        if (isMounted) {
          if (res.ok && data?.ok && data?.playbackUrl) {
            setStreamUrl(data.playbackUrl);
          } else {
            setUseFallback(true);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setUseFallback(true);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    authorize();

    return () => {
      isMounted = false;
    };
  }, [effectiveCourseId, effectiveLessonId, manifestKey, fallbackUrl]);

  if (isLoading) {
    return (
      <div className="aspect-video w-full rounded-2xl bg-slate-950 flex flex-col items-center justify-center text-white space-y-2">
        <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-medium">Loading video player...</span>
      </div>
    );
  }

  const resolvedFallback = fallbackUrl ? storageService.getStorageUrl(fallbackUrl) : null;

  if (useFallback || !streamUrl) {
    if (resolvedFallback) {
      return (
        <HLSVideoPlayer
          src={resolvedFallback}
          poster={poster ? storageService.getStorageUrl(poster) : undefined}
          title={title}
        />
      );
    }
    return (
      <div className="aspect-video w-full rounded-2xl bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-2">
        <Video className="w-8 h-8 text-slate-600 mx-auto" />
        <p className="text-xs text-slate-400 font-medium">Video currently unavailable.</p>
      </div>
    );
  }

  return (
    <HLSVideoPlayer
      src={streamUrl}
      fallbackUrl={resolvedFallback || undefined}
      poster={poster ? storageService.getStorageUrl(poster) : undefined}
      title={title}
    />
  );
};

export const StudentBlockRenderer: React.FC<StudentBlockRendererProps> = ({
  block,
  userId,
  onBlockCompleted,
}) => {
  // Local Interactive States for Student Inputs
  const [reflectionText, setReflectionText] = useState<string>('');
  const [journalText, setJournalText] = useState<string>('');
  const [assignmentSubmitted, setAssignmentSubmitted] = useState<boolean>(false);
  const [assignmentText, setAssignmentText] = useState<string>('');
  const [isAccordionOpen, setIsAccordionOpen] = useState<boolean>(false);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const isReq = block.is_required;

  // Normalized Property Extraction across both DB models and Builder models
  const meta: Record<string, any> =
    block.metadata || (typeof block.content === 'object' && block.content ? (block.content as any) : {});

  const title =
    block.title ||
    meta.title ||
    meta.quizTitle ||
    meta.heading ||
    null;

  const rawMediaUrl =
    block.media_url ||
    meta.url ||
    meta.secure_url ||
    meta.videoUrl ||
    meta.video_url ||
    meta.video?.secure_url ||
    meta.video?.url ||
    meta.media?.secure_url ||
    meta.media?.url ||
    (typeof meta.media === 'string' ? meta.media : null) ||
    meta.asset?.secure_url ||
    meta.asset?.url ||
    meta.meditationAudioUrl ||
    meta.audioUrl ||
    meta.audio_url ||
    meta.audio?.secure_url ||
    meta.audio?.url ||
    meta.worksheetFileUrl ||
    meta.fileUrl ||
    meta.file_url ||
    meta.pdfUrl ||
    meta.pdf_url ||
    meta.embedUrl ||
    null;

  const mediaUrl = rawMediaUrl && rawMediaUrl.trim() ? (storageService.getStorageUrl(rawMediaUrl) || null) : null;

  const rawThumbnailUrl =
    meta.thumbnailUrl ||
    meta.thumbnail_url ||
    meta.thumbnail?.secure_url ||
    meta.thumbnail?.url ||
    (typeof meta.thumbnail === 'string' ? meta.thumbnail : null) ||
    meta.coverUrl ||
    meta.cover_url ||
    meta.bgImage ||
    meta.meditationBgImage ||
    meta.image?.secure_url ||
    meta.image?.url ||
    block.metadata?.thumbnailUrl ||
    null;

  const thumbnailUrl = rawThumbnailUrl && rawThumbnailUrl.trim() ? (storageService.getStorageUrl(rawThumbnailUrl) || null) : null;

  const [, setTokenCacheTrigger] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const keysToAuth: string[] = [];

    if (rawMediaUrl && !rawMediaUrl.startsWith('http://') && !rawMediaUrl.startsWith('https://') && !rawMediaUrl.startsWith('data:')) {
      keysToAuth.push(rawMediaUrl);
    }
    if (rawThumbnailUrl && !rawThumbnailUrl.startsWith('http://') && !rawThumbnailUrl.startsWith('https://') && !rawThumbnailUrl.startsWith('data:')) {
      keysToAuth.push(rawThumbnailUrl);
    }
    if (meta?.gallery_images && Array.isArray(meta.gallery_images)) {
      meta.gallery_images.forEach((img: any) => {
        if (typeof img === 'string' && !img.startsWith('http') && !img.startsWith('data:')) {
          keysToAuth.push(img);
        }
      });
    }

    if (keysToAuth.length > 0) {
      storageService.getAuthorizedMediaUrls(keysToAuth).then(() => {
        if (active) {
          setTokenCacheTrigger(Date.now().toString());
        }
      });
    }

    return () => {
      active = false;
    };
  }, [block.id, rawMediaUrl, rawThumbnailUrl]);

  const text =
    typeof block.content === 'string'
      ? block.content
      : meta.text ||
        meta.prompt ||
        meta.affirmationText ||
        meta.meditationInstructions ||
        meta.exerciseInstructions ||
        meta.assignmentInstructions ||
        meta.completionMessage ||
        meta.caption ||
        '';

  switch (block.type) {
    case 'heading':
      return (
        <div key={block.id} className="py-2">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 flex items-center justify-between">
            <span>{title || text || 'Section Heading'}</span>
            {isReq && (
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                Required
              </span>
            )}
          </h2>
        </div>
      );

    case 'paragraph':
    case 'rich-text':
      return (
        <div key={block.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2">
          {title && <h4 className="text-sm font-bold text-slate-900">{title}</h4>}
          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {text}
          </div>
        </div>
      );

    case 'video': {
      const isHlsVideo =
        Boolean(meta.hls_manifest_key) ||
        (Boolean(mediaUrl) && (
          mediaUrl.includes('.m3u8') ||
          mediaUrl.includes('/api/video/stream?key=hls') ||
          mediaUrl.includes('hls/courses')
        ));

      return (
        <div key={block.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
          {title && (
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Video className="w-4 h-4 text-purple-600" />
              {title}
              {isReq && (
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                  Required Video
                </span>
              )}
            </h4>
          )}

          {isHlsVideo ? (
            <R2StreamPlayer
              courseId={block.course_id || 'course'}
              lessonId={block.lesson_id || 'lesson'}
              manifestKey={meta.hls_manifest_key || (mediaUrl?.includes('hls/') ? mediaUrl : undefined)}
              fallbackUrl={mediaUrl || undefined}
              poster={thumbnailUrl || undefined}
              title={title || undefined}
            />
          ) : mediaUrl ? (
            mediaUrl.includes('youtube') || mediaUrl.includes('vimeo') || mediaUrl.includes('youtu.be') || mediaUrl.includes('loom.com') ? (
              <div className="aspect-video w-full rounded-xl bg-slate-950 overflow-hidden shadow-sm flex items-center justify-center">
                <iframe
                  src={
                    mediaUrl.includes('watch?v=')
                      ? mediaUrl.replace('watch?v=', 'embed/')
                      : mediaUrl.includes('loom.com/share/')
                      ? mediaUrl.replace('loom.com/share/', 'loom.com/embed/')
                      : mediaUrl
                  }
                  className="w-full h-full border-0"
                  title={title || 'Video Player'}
                  allowFullScreen
                />
              </div>
            ) : (
              <HLSVideoPlayer
                src={storageService.getStorageUrl(mediaUrl)}
                poster={thumbnailUrl ? storageService.getStorageUrl(thumbnailUrl) : undefined}
                title={title || undefined}
              />
            )
          ) : (
            <div className="p-8 bg-slate-100 rounded-xl text-center text-xs text-slate-500 font-medium">
              No video source URL provided.
            </div>
          )}
          {text && <p className="text-xs text-slate-600 leading-relaxed">{text}</p>}
        </div>
      );
    }

    case 'audio':
    case 'meditation':
      return (
        <div key={block.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
          {title && (
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Music className="w-4 h-4 text-emerald-600" />
              {title}
            </h4>
          )}
          {mediaUrl ? (
            <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 rounded-xl text-white space-y-2">
              <p className="text-xs font-medium text-slate-300">Audio Guided Exercise</p>
              <audio controls src={mediaUrl} className="w-full accent-emerald-500">
                Your browser does not support audio playback.
              </audio>
            </div>
          ) : (
            <div className="p-4 bg-slate-100 rounded-xl text-center text-xs text-slate-500">
              No audio source file attached.
            </div>
          )}
          {text && <p className="text-xs text-slate-600 leading-relaxed">{text}</p>}
        </div>
      );

    case 'image':
      return (
        <div key={block.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
          {title && (
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-600" />
              {title}
            </h4>
          )}
          {mediaUrl && (
            <div className="rounded-xl overflow-hidden border border-slate-100 bg-slate-900">
              <img
                src={mediaUrl}
                alt={title || 'Lesson graphic'}
                className="w-full max-h-96 object-contain mx-auto"
              />
            </div>
          )}
          {text && <p className="text-xs text-slate-600 leading-relaxed">{text}</p>}
        </div>
      );

    case 'gallery':
      const imagesList = (
        meta?.gallery_images ||
        meta?.images?.map((i: any) => (typeof i === 'string' ? i : i.url)) ||
        [mediaUrl].filter(Boolean)
      ).map((urlItem: string) => storageService.getStorageUrl(urlItem));

      return (
        <div key={block.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            {title || 'Image Gallery'}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {imagesList.map((imgUrl: string, idx: number) => (
              <img
                key={idx}
                src={imgUrl}
                alt={`Gallery image ${idx + 1}`}
                className="w-full h-36 object-cover rounded-xl border border-slate-200 shadow-xs"
              />
            ))}
          </div>
          {text && <p className="text-xs text-slate-600">{text}</p>}
        </div>
      );

    case 'callout':
      return (
        <div key={block.id} className="bg-indigo-50/80 rounded-2xl border border-indigo-200 p-5 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
            <AlertCircle className="w-4 h-4 text-indigo-600" />
            <span>{title || 'Key Takeaway'}</span>
          </div>
          <p className="text-xs text-indigo-950 leading-relaxed">{text}</p>
        </div>
      );

    case 'quote':
      return (
        <div key={block.id} className="bg-amber-50/60 rounded-2xl border-l-4 border-amber-500 p-5 shadow-2xs space-y-2">
          <Quote className="w-6 h-6 text-amber-500/80" />
          <p className="font-serif italic text-sm text-amber-950 leading-relaxed">
            "{text || title}"
          </p>
          {title && text && (
            <p className="text-xs font-bold text-amber-800 text-right">— {title}</p>
          )}
        </div>
      );

    case 'accordion':
      return (
        <div key={block.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <button
            onClick={() => setIsAccordionOpen(!isAccordionOpen)}
            className="w-full px-5 py-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left font-bold text-xs text-slate-900 transition-colors"
          >
            <span>{title || 'Click to Expand Information'}</span>
            {isAccordionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {isAccordionOpen && (
            <div className="p-5 text-xs text-slate-700 leading-relaxed border-t border-slate-200 bg-white">
              {text}
            </div>
          )}
        </div>
      );

    case 'checklist':
      const checkItems = meta?.items
        ? meta.items.map((i: any) => (typeof i === 'string' ? i : i.text))
        : (text || '').split('\n').filter((l: string) => l.trim().length > 0);

      return (
        <div key={block.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-indigo-600" />
            {title || 'Interactive Checklist'}
          </h4>
          <div className="space-y-2 pt-1">
            {checkItems.map((item: string, idx: number) => (
              <label
                key={idx}
                className={`flex items-start gap-2.5 p-2.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                  checkedItems[idx]
                    ? 'bg-emerald-50 text-emerald-900 line-through opacity-80'
                    : 'bg-slate-50 hover:bg-indigo-50/50 text-slate-800'
                }`}
              >
                <input
                  type="checkbox"
                  checked={!!checkedItems[idx]}
                  onChange={(e) => setCheckedItems((prev) => ({ ...prev, [idx]: e.target.checked }))}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 shrink-0"
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </div>
      );

    case 'reflection':
      return (
        <div key={block.id} className="bg-purple-50/60 rounded-2xl border border-purple-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>{title || 'Self-Reflection Prompt'}</span>
          </div>
          <p className="text-xs text-purple-950 font-medium leading-relaxed">{text}</p>
          <textarea
            value={reflectionText}
            onChange={(e) => setReflectionText(e.target.value)}
            placeholder="Write your private reflection notes here..."
            rows={3}
            className="w-full p-3 rounded-xl border border-purple-200 text-xs bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
          />
        </div>
      );

    case 'journal':
      return (
        <div key={block.id} className="bg-emerald-50/60 rounded-2xl border border-emerald-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>{title || 'Guided Journaling Entry'}</span>
          </div>
          <p className="text-xs text-emerald-950 font-medium leading-relaxed">{text}</p>
          <textarea
            value={journalText}
            onChange={(e) => setJournalText(e.target.value)}
            placeholder="Record your personal experience and daily insights..."
            rows={4}
            className="w-full p-3 rounded-xl border border-emerald-200 text-xs bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      );

    case 'affirmation':
      return (
        <div key={block.id} className="bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 rounded-2xl p-6 text-white text-center shadow-md space-y-2">
          <Heart className="w-6 h-6 text-white/90 mx-auto animate-pulse" />
          <h4 className="text-xs font-bold uppercase tracking-widest text-amber-200">Daily Energy Affirmation</h4>
          <p className="font-serif text-lg sm:text-xl font-bold italic leading-snug">
            "{text || title}"
          </p>
        </div>
      );

    case 'assignment':
    case 'exercise':
      return (
        <div key={block.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-indigo-600" />
              {title || 'Practical Assignment'}
            </h4>
            {assignmentSubmitted && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Submitted
              </span>
            )}
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">{text}</p>

          {!assignmentSubmitted ? (
            <div className="space-y-2 pt-2">
              <textarea
                value={assignmentText}
                onChange={(e) => setAssignmentText(e.target.value)}
                placeholder="Paste work link or write your assignment submission here..."
                rows={3}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                onClick={() => setAssignmentSubmitted(true)}
                disabled={!assignmentText.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Submit Assignment
              </button>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 rounded-xl text-xs text-emerald-900">
              Your assignment submission has been received.
            </div>
          )}
        </div>
      );

    case 'download':
    case 'pdf':
    case 'worksheet':
      return (
        <div key={block.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Download className="w-4 h-4 text-rose-600" />
              {title || 'Downloadable PDF Resource'}
            </h4>
            {mediaUrl && (
              <a
                href={mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl inline-flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Download File
              </a>
            )}
          </div>
          {text && <p className="text-xs text-slate-600 leading-relaxed">{text}</p>}
        </div>
      );

    case 'embed':
      return (
        <div key={block.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
          {title && <h4 className="text-sm font-bold text-slate-900">{title}</h4>}
          {mediaUrl ? (
            <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
              <iframe
                src={mediaUrl}
                className="w-full h-full border-0"
                title={title || 'Embedded content'}
                allowFullScreen
              />
            </div>
          ) : (
            <div className="p-6 bg-slate-100 rounded-xl text-center text-xs text-slate-500">
              No embed URL provided.
            </div>
          )}
        </div>
      );

    case 'divider':
      return <hr key={block.id} className="my-6 border-slate-200" />;

    case 'button':
      return (
        <div key={block.id} className="py-2 text-center">
          {mediaUrl || meta?.buttonUrl ? (
            <a
              href={mediaUrl || meta?.buttonUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md"
            >
              <span>{title || meta?.buttonText || 'Open Resource'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <button className="px-6 py-3 rounded-xl bg-indigo-600 text-white text-xs font-bold">
              {title || meta?.buttonText || 'Action Button'}
            </button>
          )}
        </div>
      );

    case 'quiz':
      return <QuizBlock key={block.id} block={block} isStudentView={true} />;

    default:
      return (
        <div key={block.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2">
          {title && <h4 className="text-sm font-bold text-slate-900">{title}</h4>}
          {text && <p className="text-xs text-slate-700 leading-relaxed">{text}</p>}
        </div>
      );
  }
};
