import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ZivaLayout } from '../layouts/ZivaLayout';
import { ZivaCourse, ZivaCourseReview, ZivaLesson } from '../types';
import { zivaCourseService } from '../services/zivaCourseService';
import { zivaStudentService } from '../services/zivaStudentService';
import { storageService } from '../../services/storageService';
import { useZivaAuth } from '../contexts/ZivaAuthContext';
import { ZivaStudentBlockRenderer } from '../components/ZivaStudentBlockRenderer';
import { ZivaHLSVideoPlayer } from '../components/ZivaHLSVideoPlayer';
import { 
  Play, 
  CheckCircle, 
  Clock, 
  ShieldCheck, 
  Award, 
  Lock, 
  BookOpen, 
  ArrowRight, 
  Video, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Star, 
  FileText, 
  Smartphone, 
  Sparkles,
  X 
} from 'lucide-react';

export const ZivaCourseDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useZivaAuth();

  const [course, setCourse] = useState<ZivaCourse | null>(null);
  const [reviews, setReviews] = useState<ZivaCourseReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  // Lesson Preview Modal
  const [previewLesson, setPreviewLesson] = useState<ZivaLesson | null>(null);

  // FAQ Expanded State
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  useEffect(() => {
    async function load() {
      if (!slug) return;
      const data = await zivaCourseService.getCourseByIdOrSlug(slug);
      setCourse(data);
      if (data) {
        const revs = zivaStudentService.getReviews(data.id);
        setReviews(revs);
      }
      setLoading(false);
    }
    load();
  }, [slug]);

  const handleEnroll = async () => {
    if (!course) return;
    if (!user) {
      navigate('/ziva/login', { state: { from: `/ziva/course/${slug}` } });
      return;
    }

    setEnrolling(true);
    await zivaStudentService.enrollInCourse(user.id, course.id);
    setEnrolling(false);
    navigate(`/ziva/player/${course.id}`);
  };

  const faqs = [
    {
      q: "Do I get lifetime access to this masterclass?",
      a: "Yes! Once enrolled, you receive full lifetime access to all course video modules, downloadable worksheets, and future course updates at no additional cost."
    },
    {
      q: "Will I receive an official Ziva Certificate of Completion?",
      a: "Absolutely. Upon completing 100% of the curriculum modules, an official, verifiable Ziva Masterclass Certificate will be automatically issued to your profile."
    },
    {
      q: "Can I watch the lessons on mobile or tablet?",
      a: "Yes, the Ziva platform is fully responsive across desktop, tablet, and mobile devices, allowing you to learn seamlessly anywhere, anytime."
    },
    {
      q: "What if I have questions while taking the course?",
      a: "Every lesson features an integrated Discussion Board where you can leave comments, ask questions, and engage directly with fellow students and mentors."
    }
  ];

  if (loading) {
    return (
      <ZivaLayout>
        <div className="py-20 text-center text-amber-400">
          <div className="w-8 h-8 border-2 border-[#FF2E93] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          Loading program details...
        </div>
      </ZivaLayout>
    );
  }

  if (!course) {
    return (
      <ZivaLayout>
        <div className="py-20 text-center text-gray-400 space-y-4">
          <h2 className="text-2xl font-serif text-amber-300">Program Not Found</h2>
          <p className="text-sm">The program you are looking for does not exist or has been removed.</p>
          <Link to="/ziva/catalogue" className="inline-block bg-[#FF2E93] text-white text-xs font-bold uppercase px-6 py-2.5 rounded">
            Back to Catalogue
          </Link>
        </div>
      </ZivaLayout>
    );
  }

  return (
    <ZivaLayout>
      {/* HERO BANNER */}
      <div className="bg-black border-b border-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-7 space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-pink-500 bg-pink-950/60 border border-pink-500/40 px-3 py-1 rounded">
              {course.category}
            </span>

            <h1 className="text-3xl sm:text-5xl font-serif font-extrabold text-amber-300 leading-tight">
              {course.title}
            </h1>

            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
              {course.shortDescription}
            </p>

            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <img
                  src={course.instructorAvatar}
                  alt={course.instructorName}
                  className="w-8 h-8 rounded-full border border-amber-400 object-cover"
                />
                <div>
                  <p className="font-bold text-white">{course.instructorName}</p>
                  <p className="text-[10px] text-amber-300">{course.instructorTitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>{course.duration}</span>
              </div>
              <div className="flex items-center gap-1 text-amber-300 font-bold">
                <Award className="w-4 h-4 text-pink-500" />
                <span>{course.level} Level</span>
              </div>
            </div>
          </div>

          {/* CARD ACTION BOX */}
          <div className="lg:col-span-5 bg-neutral-950 border-2 border-amber-500/40 p-6 rounded-2xl shadow-2xl space-y-6">
            <div className="relative rounded-xl overflow-hidden aspect-video bg-black group border border-gray-800">
              {isPlayingPreview && course.promoVideoUrl ? (
                <ZivaHLSVideoPlayer
                  src={course.promoVideoUrl}
                  courseId={course.id}
                  title={`${course.title} - Preview`}
                  autoPlay
                  className="w-full h-full"
                />
              ) : (
                <>
                  <img
                    src={storageService.getCourseImageUrl(course.thumbnailUrl || (course as any).image)}
                    alt={course.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop';
                    }}
                  />
                  <button
                    onClick={() => setIsPlayingPreview(true)}
                    className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-[#FF2E93] text-white flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Play className="w-6 h-6 fill-white ml-0.5" />
                  </button>
                </>
              )}
            </div>

            <div className="flex items-baseline justify-between border-b border-gray-800 pb-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-serif text-amber-300">${course.salePrice || course.price}</span>
                {course.salePrice && <span className="text-sm text-gray-500 line-through">${course.price}</span>}
              </div>
              <span className="text-xs text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-500/30">
                Instant Lifetime Access
              </span>
            </div>

            <button
              onClick={handleEnroll}
              disabled={enrolling}
              className="w-full bg-[#FF2E93] hover:bg-pink-600 text-white font-bold text-sm uppercase tracking-widest py-4 rounded-md shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {enrolling ? 'Enrolling...' : 'Enroll In Program Now'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* CURRICULUM & DETAILS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        
        {/* WHAT'S INCLUDED & KEY OUTCOMES GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-neutral-950 border border-amber-500/30 p-8 rounded-2xl space-y-4 shadow-xl">
            <h3 className="text-xl font-serif font-bold text-amber-300 uppercase tracking-wide flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-500" /> What You Will Master
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-300 pt-2">
              {course.keyOutcomes.map((out, i) => (
                <div key={i} className="flex items-start gap-2 bg-black/60 p-3 rounded-xl border border-gray-900">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{out}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-neutral-950 border border-pink-500/30 p-6 rounded-2xl space-y-4 shadow-xl">
            <h3 className="text-base font-serif font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-gray-900 pb-3">
              <ShieldCheck className="w-5 h-5 text-pink-500" /> Program Guarantee
            </h3>
            <ul className="space-y-3 text-xs text-gray-300">
              <li className="flex items-center gap-2.5">
                <Video className="w-4 h-4 text-amber-400 shrink-0" /> Full HD Video Masterclasses
              </li>
              <li className="flex items-center gap-2.5">
                <Award className="w-4 h-4 text-emerald-400 shrink-0" /> Certificate of Completion
              </li>
              <li className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-pink-400 shrink-0" /> Downloadable Notes & Guides
              </li>
              <li className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 text-indigo-400 shrink-0" /> Mobile & Desktop Access
              </li>
            </ul>
          </div>
        </div>

        {/* CURRICULUM SECTIONS */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-serif font-bold text-white uppercase tracking-tight">
              Curriculum Outline
            </h3>
            <span className="text-xs text-amber-400 font-bold bg-amber-950/60 px-3 py-1 rounded-full border border-amber-500/30">
              {course.sections?.reduce((acc, s) => acc + (s.lessons?.length || 0), 0)} Total Lessons
            </span>
          </div>

          {!course.sections || course.sections.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Curriculum outline is being finalized by instructor.</p>
          ) : (
            <div className="space-y-4">
              {course.sections.map((sec) => (
                <div key={sec.id} className="bg-neutral-950 border border-gray-800 rounded-2xl overflow-hidden shadow-lg">
                  <div className="p-4 bg-neutral-900/90 flex items-center justify-between border-b border-gray-800">
                    <span className="font-serif font-bold text-amber-300 text-sm">{sec.title}</span>
                    <span className="text-xs text-gray-400 font-mono">{sec.lessons?.length || 0} Lessons</span>
                  </div>
                  <div className="divide-y divide-gray-900">
                    {sec.lessons?.map((les) => (
                      <div key={les.id} className="p-4 flex items-center justify-between text-xs text-gray-300 hover:bg-neutral-900/40 transition-colors">
                        <div className="flex items-center gap-3">
                          <Video className="w-4 h-4 text-pink-400 shrink-0" />
                          <span className="font-medium text-white">{les.title}</span>
                        </div>
                        {les.is_preview ? (
                          <button
                            onClick={() => setPreviewLesson(les)}
                            className="text-emerald-400 hover:text-emerald-300 font-bold uppercase text-[10px] border border-emerald-500/40 bg-emerald-950/50 px-3 py-1 rounded flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Play className="w-3 h-3 fill-emerald-400" /> Free Preview
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Lock className="w-3.5 h-3.5" />
                            <span className="text-[10px] uppercase font-bold">Enrolled Only</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* INSTRUCTOR SECTION */}
        <div className="bg-gradient-to-r from-amber-950/40 via-black to-pink-950/40 border-2 border-amber-500/40 p-8 rounded-3xl space-y-6 shadow-2xl">
          <span className="text-xs font-bold uppercase tracking-widest text-pink-500 font-serif">Meet Your Mentor</span>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <img
              src={course.instructorAvatar}
              alt={course.instructorName}
              className="w-24 h-24 rounded-2xl border-2 border-amber-400 object-cover shadow-xl shrink-0"
            />
            <div className="space-y-3 text-center sm:text-left">
              <div>
                <h4 className="text-2xl font-serif font-bold text-white">{course.instructorName}</h4>
                <p className="text-xs text-amber-300 font-bold">{course.instructorTitle}</p>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed max-w-3xl">
                {course.instructorBio || `${course.instructorName} is an internationally acclaimed leadership coach and communications specialist dedicated to empowering executives, high achievers, and leaders with transformational clarity.`}
              </p>
            </div>
          </div>
        </div>

        {/* FREQUENTLY ASKED QUESTIONS */}
        <div className="space-y-6">
          <h3 className="text-2xl font-serif font-bold text-white uppercase tracking-tight flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-amber-400" /> Frequently Asked Questions
          </h3>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = expandedFaq === index;
              return (
                <div key={index} className="bg-neutral-950 border border-gray-900 rounded-xl overflow-hidden transition-all">
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : index)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-neutral-900/50"
                  >
                    <span className="text-sm font-serif font-bold text-amber-200">{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-5 h-5 text-pink-500 shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-500 shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="p-5 pt-0 text-xs text-gray-400 leading-relaxed border-t border-gray-900/50 mt-2">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* FREE PREVIEW MODAL */}
        {previewLesson && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-neutral-950 border-2 border-emerald-500/50 rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-950 text-emerald-400 text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-emerald-500/40">
                    Free Lesson Preview
                  </span>
                  <h3 className="text-lg font-serif font-bold text-white">{previewLesson.title}</h3>
                </div>
                <button
                  onClick={() => setPreviewLesson(null)}
                  className="text-gray-400 hover:text-white p-1 rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6 pt-2">
                {previewLesson.blocks?.map((blk) => (
                  <ZivaStudentBlockRenderer
                    key={blk.id}
                    block={blk}
                    courseId={course.id}
                    lessonId={previewLesson.id}
                  />
                ))}
              </div>

              <div className="border-t border-gray-900 pt-4 flex justify-between items-center">
                <span className="text-xs text-gray-400">Enjoyed this lesson preview?</span>
                <button
                  onClick={() => {
                    setPreviewLesson(null);
                    handleEnroll();
                  }}
                  className="bg-[#FF2E93] hover:bg-pink-600 text-white font-bold text-xs uppercase px-5 py-2.5 rounded shadow-lg flex items-center gap-1 cursor-pointer"
                >
                  Enroll To Unlock Full Course <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </ZivaLayout>
  );
};

