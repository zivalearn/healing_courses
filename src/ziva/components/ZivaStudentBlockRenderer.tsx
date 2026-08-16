import React, { useState, useEffect } from 'react';
import { ZivaLessonBlock } from '../types';
import { getZivaOptimizedCloudinaryUrl } from '../lib/cloudinary';
import { zivaMediaService } from '../services/zivaMediaService';
import { ZivaHLSVideoPlayer } from './ZivaHLSVideoPlayer';
import { 
  FileText, 
  Video, 
  Music, 
  Download, 
  Code, 
  HelpCircle, 
  AlertCircle, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  Info,
  CheckSquare,
  Volume2
} from 'lucide-react';

interface ZivaStudentBlockRendererProps {
  block: ZivaLessonBlock;
  courseId?: string;
  lessonId?: string;
  onCompleted?: () => void;
}

export const ZivaStudentBlockRenderer: React.FC<ZivaStudentBlockRendererProps> = ({
  block,
  courseId,
  lessonId,
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submittedQuiz, setSubmittedQuiz] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [openAccordionIndex, setOpenAccordionIndex] = useState<number | null>(null);
  const [resolvedMediaUrl, setResolvedMediaUrl] = useState<string>('');

  // Dynamically resolve media URL for R2 objects or legacy Cloudinary assets
  useEffect(() => {
    let isMounted = true;

    async function resolveUrl() {
      if (!block.media_url || !block.media_url.trim()) {
        if (isMounted) setResolvedMediaUrl('');
        return;
      }

      const rawUrl = block.media_url.trim();

      // If it's a Cloudinary URL
      if (rawUrl.includes('cloudinary.com')) {
        if (isMounted) setResolvedMediaUrl(getZivaOptimizedCloudinaryUrl(rawUrl));
        return;
      }

      // If it's an R2 key or relative API URL
      if (rawUrl.startsWith('ziva/') || rawUrl.startsWith('/api/ziva/')) {
        try {
          const authUrl = await zivaMediaService.getMediaUrl(rawUrl);
          if (isMounted) setResolvedMediaUrl(authUrl);
        } catch {
          if (isMounted) setResolvedMediaUrl(`/api/ziva/media/file?key=${encodeURIComponent(rawUrl)}`);
        }
        return;
      }

      // Standard HTTP/HTTPS
      if (isMounted) setResolvedMediaUrl(rawUrl);
    }

    resolveUrl();

    return () => {
      isMounted = false;
    };
  }, [block.media_url]);

  switch (block.type) {
    case 'paragraph':
      return (
        <div className="bg-neutral-950 border border-gray-900 rounded-2xl p-6 space-y-3">
          {block.title && (
            <h3 className="text-lg font-serif font-bold text-amber-300">{block.title}</h3>
          )}
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
            {block.content}
          </p>
        </div>
      );

    case 'video': {
      const posterUrl = block.poster_url || block.metadata?.posterUrl || block.metadata?.thumbnailUrl;
      return (
        <div className="bg-neutral-950 border border-gray-900 rounded-2xl p-6 space-y-4">
          {block.title && (
            <h3 className="text-lg font-serif font-bold text-amber-300 flex items-center gap-2">
              <Video className="w-5 h-5 text-pink-500" />
              {block.title}
            </h3>
          )}
          {block.media_url && block.media_url.trim() ? (
            <ZivaHLSVideoPlayer
              src={block.media_url}
              courseId={courseId}
              lessonId={lessonId}
              title={block.title || undefined}
              poster={posterUrl || undefined}
            />
          ) : (
            <div className="aspect-video bg-black rounded-xl flex items-center justify-center border border-gray-800 text-gray-500 text-xs">
              No video media URL configured
            </div>
          )}
          {block.content && (
            <p className="text-xs text-gray-400 italic">{block.content}</p>
          )}
        </div>
      );
    }

    case 'gallery': {
      const images = block.gallery_images || (block.metadata?.images as { url: string; caption?: string }[]) || [];
      return (
        <div className="bg-neutral-950 border border-gray-900 rounded-2xl p-6 space-y-4">
          {block.title && (
            <h3 className="text-lg font-serif font-bold text-amber-300 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              {block.title}
            </h3>
          )}
          {images.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((img, idx) => (
                <div key={idx} className="bg-black rounded-xl border border-gray-800 overflow-hidden group">
                  <img
                    src={img.url}
                    alt={img.caption || `Gallery ${idx + 1}`}
                    className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {img.caption && (
                    <p className="text-[11px] text-gray-400 p-2.5 bg-neutral-900/90 border-t border-gray-800">
                      {img.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="h-36 bg-black rounded-xl flex items-center justify-center border border-gray-800 text-gray-500 text-xs">
              No gallery images added
            </div>
          )}
          {block.content && (
            <p className="text-xs text-gray-400">{block.content}</p>
          )}
        </div>
      );
    }

    case 'worksheet': {
      const data = block.worksheet_data || {};
      return (
        <div className="bg-neutral-950 border border-amber-500/40 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-900 pb-3">
            <h3 className="text-lg font-serif font-bold text-amber-300 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-amber-400" />
              {block.title || 'Executive Practical Worksheet & Action Assignment'}
            </h3>
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2.5 py-1 rounded">
              Practical Task
            </span>
          </div>

          {block.content && (
            <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-line">{block.content}</p>
          )}

          {data.instructions && (
            <div className="bg-black p-4 rounded-xl border border-gray-800 space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Instructions</span>
              <p className="text-xs text-gray-300 whitespace-pre-line">{data.instructions}</p>
            </div>
          )}

          {data.template_url && (
            <div className="flex items-center justify-between p-3.5 bg-black rounded-xl border border-amber-500/20">
              <div className="flex items-center gap-2 text-xs text-amber-300">
                <Download className="w-4 h-4 text-pink-500" />
                <span>{data.template_name || 'Downloadable Worksheet Template'}</span>
              </div>
              <a
                href={data.template_url}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="bg-[#FF2E93] hover:bg-pink-600 text-white font-bold text-xs px-4 py-2 rounded uppercase tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </a>
            </div>
          )}

          <div className="space-y-2 pt-2">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Student Reflection / Submission Notes
            </label>
            <textarea
              rows={4}
              placeholder="Record your executive insights, answers, or implementation reflections here..."
              className="w-full bg-black border border-gray-800 text-white text-xs p-3 rounded-xl outline-none focus:ring-1 focus:ring-[#FF2E93] resize-none"
            />
          </div>
        </div>
      );
    }

    case 'checklist': {
      const items = block.checklist_items || [
        { id: 'c1', text: 'Complete vocal resonance warmup for 5 minutes' },
        { id: 'c2', text: 'Identify the 3 subconscious anchors before speech' },
        { id: 'c3', text: 'Deliver the 60-second executive elevator narrative' },
      ];

      return (
        <div className="bg-neutral-950 border border-gray-900 rounded-2xl p-6 space-y-4">
          {block.title && (
            <h3 className="text-lg font-serif font-bold text-amber-300 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-emerald-400" />
              {block.title}
            </h3>
          )}
          {block.content && <p className="text-xs text-gray-400">{block.content}</p>}
          <div className="space-y-2 pt-1">
            {items.map((item, idx) => (
              <label
                key={item.id || idx}
                className="flex items-start gap-3 p-3 bg-black rounded-xl border border-gray-800/80 hover:border-gray-700 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  defaultChecked={item.is_checked}
                  className="accent-[#FF2E93] w-4 h-4 mt-0.5 shrink-0 rounded"
                />
                <span className="text-xs text-gray-200 leading-snug">{item.text}</span>
              </label>
            ))}
          </div>
        </div>
      );
    }

    case 'quote':
      return (
        <div className="bg-gradient-to-r from-neutral-950 via-black to-neutral-950 border-l-4 border-[#FF2E93] rounded-r-2xl p-6 sm:p-8 space-y-3 shadow-xl">
          <p className="text-base sm:text-lg font-serif italic text-amber-200 leading-relaxed">
            "{block.content || 'Authentic executive presence is not the absence of fear, but the mastery of subconscious alignment.'}"
          </p>
          {(block.quote_author || block.title) && (
            <p className="text-xs font-bold text-pink-400 uppercase tracking-widest text-right">
              — {block.quote_author || block.title}
            </p>
          )}
        </div>
      );

    case 'image':
      return (
        <div className="bg-neutral-950 border border-gray-900 rounded-2xl p-6 space-y-4">
          {block.title && (
            <h3 className="text-lg font-serif font-bold text-amber-300 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              {block.title}
            </h3>
          )}
          {resolvedMediaUrl ? (
            <div className="rounded-xl overflow-hidden border border-gray-800 shadow-xl bg-black">
              <img
                src={resolvedMediaUrl}
                alt={block.title || 'Lesson Diagram'}
                className="w-full max-h-[500px] object-contain mx-auto"
              />
            </div>
          ) : (
            <div className="h-48 bg-black rounded-xl flex items-center justify-center border border-gray-800 text-gray-500 text-xs">
              No image media URL configured
            </div>
          )}
          {block.content && (
            <p className="text-xs text-gray-400 italic text-center">{block.content}</p>
          )}
        </div>
      );

    case 'audio':
      return (
        <div className="bg-neutral-950 border border-gray-900 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Volume2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-white">{block.title || 'Guided Audio Exercise'}</h3>
              <p className="text-xs text-gray-400">Listen carefully to the audio commentary</p>
            </div>
          </div>
          {resolvedMediaUrl ? (
            <audio src={resolvedMediaUrl} controls className="w-full" />
          ) : (
            <div className="p-3 bg-neutral-900 rounded-xl text-xs text-gray-500 text-center">
              No audio recording attached
            </div>
          )}
          {block.content && (
            <p className="text-xs text-gray-300">{block.content}</p>
          )}
        </div>
      );

    case 'quiz': {
      const questions = block.questions || [
        {
          id: 'q1',
          question: 'What is the primary key to unshakeable executive confidence?',
          options: [
            'Relying purely on external validation',
            'Deep subconscious grounding and clear communication frameworks',
            'Avoiding public speaking',
            'Memorizing scripts word-for-word'
          ],
          correctAnswer: 1,
          explanation: 'Subconscious grounding allows authentic presence without anxiety.'
        }
      ];

      const handleQuizSubmit = () => {
        let correctCount = 0;
        questions.forEach((q, idx) => {
          if (selectedAnswers[idx] === q.correctAnswer) {
            correctCount++;
          }
        });
        setQuizScore(correctCount);
        setSubmittedQuiz(true);
      };

      return (
        <div className="bg-neutral-950 border border-amber-500/30 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-900 pb-3">
            <h3 className="text-lg font-serif font-bold text-amber-300 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-amber-400" />
              {block.title || 'Knowledge Assessment Quiz'}
            </h3>
            {submittedQuiz && (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950 border border-emerald-500/40 px-3 py-1 rounded-full">
                Score: {quizScore} / {questions.length}
              </span>
            )}
          </div>

          <div className="space-y-6">
            {questions.map((q, qIdx) => (
              <div key={q.id || qIdx} className="space-y-3 bg-black p-4 rounded-xl border border-gray-900">
                <p className="text-sm font-bold text-white">
                  Q{qIdx + 1}. {q.question}
                </p>

                <div className="space-y-2">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = selectedAnswers[qIdx] === oIdx;
                    const isCorrect = q.correctAnswer === oIdx;

                    let btnStyle = 'border-gray-800 bg-neutral-900 text-gray-300 hover:border-gray-700';
                    if (submittedQuiz) {
                      if (isCorrect) {
                        btnStyle = 'border-emerald-500 bg-emerald-950/60 text-emerald-300 font-bold';
                      } else if (isSelected && !isCorrect) {
                        btnStyle = 'border-red-500 bg-red-950/60 text-red-300';
                      }
                    } else if (isSelected) {
                      btnStyle = 'border-[#FF2E93] bg-pink-950/40 text-pink-300 font-bold';
                    }

                    return (
                      <button
                        key={oIdx}
                        disabled={submittedQuiz}
                        onClick={() => setSelectedAnswers({ ...selectedAnswers, [qIdx]: oIdx })}
                        className={`w-full text-left p-3 rounded-lg border text-xs flex items-center justify-between transition-colors cursor-pointer ${btnStyle}`}
                      >
                        <span>{opt}</span>
                        {submittedQuiz && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {submittedQuiz && q.explanation && (
                  <p className="text-xs text-amber-300/80 bg-amber-950/30 p-2.5 rounded border border-amber-500/20 italic">
                    Explanation: {q.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>

          {!submittedQuiz ? (
            <button
              onClick={handleQuizSubmit}
              disabled={Object.keys(selectedAnswers).length < questions.length}
              className="w-full bg-[#FF2E93] hover:bg-pink-600 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-widest py-3 rounded-lg shadow-lg cursor-pointer"
            >
              Submit Quiz Answers
            </button>
          ) : (
            <button
              onClick={() => {
                setSubmittedQuiz(false);
                setSelectedAnswers({});
              }}
              className="text-xs text-amber-400 hover:underline font-bold"
            >
              Retake Quiz
            </button>
          )}
        </div>
      );
    }

    case 'attachment':
      return (
        <div className="bg-neutral-950 border border-gray-900 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">{block.title || block.file_name || 'Downloadable Workbook Resource'}</h4>
              <p className="text-xs text-gray-400">{block.file_size || 'PDF Guide / Workbook'}</p>
            </div>
          </div>
          {(resolvedMediaUrl || block.media_url) && (
            <a
              href={resolvedMediaUrl || block.media_url}
              target="_blank"
              rel="noopener noreferrer"
              download={block.file_name || 'download'}
              className="bg-neutral-900 hover:bg-neutral-800 text-white border border-gray-800 font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4 text-pink-400" /> Download Resource
            </a>
          )}
        </div>
      );

    case 'callout': {
      const type = block.callout_type || 'info';
      let borderStyle = 'border-blue-500/40 bg-blue-950/20 text-blue-200';
      if (type === 'warning') borderStyle = 'border-amber-500/40 bg-amber-950/20 text-amber-200';
      if (type === 'success') borderStyle = 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200';
      if (type === 'tip') borderStyle = 'border-pink-500/40 bg-pink-950/20 text-pink-200';

      return (
        <div className={`p-5 rounded-2xl border ${borderStyle} space-y-2`}>
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
            <Info className="w-4 h-4" />
            {block.title || `${type.toUpperCase()} KEY TAKEAWAY`}
          </div>
          <p className="text-xs leading-relaxed">{block.content}</p>
        </div>
      );
    }

    case 'code':
      return (
        <div className="bg-neutral-950 border border-gray-900 rounded-2xl overflow-hidden space-y-0">
          <div className="bg-black px-4 py-2 border-b border-gray-900 flex items-center justify-between text-[10px] text-gray-400 font-mono">
            <span>{block.title || 'Code Example'}</span>
            <span>{block.code_language || 'javascript'}</span>
          </div>
          <pre className="p-4 bg-black text-emerald-400 text-xs font-mono overflow-x-auto">
            <code>{block.content}</code>
          </pre>
        </div>
      );

    case 'accordion': {
      const items = block.accordion_items || [
        { title: 'FAQ 1: How do I apply these frameworks daily?', content: 'Practice 10 minutes of vocal resonance before meetings.' }
      ];

      return (
        <div className="bg-neutral-950 border border-gray-900 rounded-2xl p-6 space-y-3">
          {block.title && <h3 className="text-lg font-serif font-bold text-amber-300">{block.title}</h3>}
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="border border-gray-900 rounded-xl overflow-hidden bg-black">
                <button
                  onClick={() => setOpenAccordionIndex(openAccordionIndex === idx ? null : idx)}
                  className="w-full p-3.5 text-left text-xs font-bold text-white flex items-center justify-between cursor-pointer hover:bg-neutral-900"
                >
                  <span>{item.title}</span>
                  {openAccordionIndex === idx ? <ChevronUp className="w-4 h-4 text-pink-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {openAccordionIndex === idx && (
                  <div className="p-3.5 pt-0 text-xs text-gray-300 border-t border-gray-900 leading-relaxed">
                    {item.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    default:
      return (
        <div className="bg-neutral-950 border border-gray-900 rounded-2xl p-6 space-y-2">
          {block.title && <h3 className="text-sm font-bold text-white">{block.title}</h3>}
          <p className="text-xs text-gray-300">{block.content}</p>
        </div>
      );
  }
};
