import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { courseService, mapSupabaseToCourse } from '../services/courseService';
import { studentService, PurchaseResult } from '../services/studentService';
import { wishlistService } from '../services/wishlistService';
import { enrollmentService } from '../services/enrollmentService';
import { profileService } from '../services/profileService';
import { storageService } from '../services/storageService';
import { authService } from '../services/authService';
import { Course } from '../models/course';
import { CourseCard } from '../components/CourseCard';
import { CourseReviewsSection } from '../components/CourseReviewsSection';
import { CoursePreview } from '../components/CoursePreview';
import { VideoPreviewModal } from '../components/VideoPreviewModal';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ContactModal } from '../components/ContactModal';
import { EnrollmentModal } from '../components/EnrollmentModal';
import { SEO } from '../components/SEO';
import {
  Star, Clock, Award, ShieldCheck, CheckCircle2, ChevronDown, ChevronUp,
  ArrowRight, Sparkles, BookOpen, User, Globe, Video, HelpCircle,
  Share2, ArrowLeft, Info, Lock, Heart, PlayCircle, AlertCircle, RefreshCw
} from 'lucide-react';

export const CourseDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  // Course & Related Data
  const [course, setCourse] = useState<Course | null>(null);
  const [relatedCourses, setRelatedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // User & Wishlist
  const [userId, setUserId] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);

  // UI Accordions & Modals
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [openModuleId, setOpenModuleId] = useState<string | null>('m1');
  const [purchaseNotice, setPurchaseNotice] = useState<string | null>(null);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [selectedEnrollCourse, setSelectedEnrollCourse] = useState<Course | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);

  const fetchCourseData = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    try {
      const currentUser = await authService.getCurrentUser();
      const uid = currentUser ? currentUser.id : null;
      setUserId(uid);

      const res = await courseService.getCourseBySlug(slug);
      let targetCourse: Course | null = null;

      if (res.data) {
        targetCourse = mapSupabaseToCourse(res.data);
      }

      setCourse(targetCourse);

      if (targetCourse) {
        // Fetch Wishlist status
        if (uid) {
          const wishRes = await wishlistService.isWishlisted(uid, targetCourse.id);
          setIsWishlisted(wishRes.isWishlisted);

          // Fetch Enrollment status
          const enrollRes = await enrollmentService.isUserEnrolled(uid, targetCourse.id);
          setIsEnrolled(enrollRes.isEnrolled);
        } else {
          // Guest wishlist fallback
          try {
            const guestWish = localStorage.getItem('guest_wishlist');
            if (guestWish) {
              const list: string[] = JSON.parse(guestWish);
              setIsWishlisted(list.includes(targetCourse.id));
            }
          } catch (e) {
            console.warn('Guest wishlist parse error:', e);
          }
        }

        // Fetch Related Courses
        const related = await courseService.getCoursesByModality(targetCourse.modality);
        setRelatedCourses(related.filter((r) => r.id !== targetCourse!.id).slice(0, 3));
      }
    } catch (err: any) {
      console.error('Error loading course details:', err);
      setError('Unable to load course details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchCourseData();
  }, [fetchCourseData]);

  // Wishlist Toggle Handler
  const handleToggleWishlist = async () => {
    if (!course) return;
    const newStatus = !isWishlisted;
    setIsWishlisted(newStatus);

    if (userId) {
      await wishlistService.toggleWishlist(userId, course.id);
    } else {
      try {
        const guestWish = localStorage.getItem('guest_wishlist');
        let list: string[] = guestWish ? JSON.parse(guestWish) : [];
        if (newStatus) {
          list.push(course.id);
        } else {
          list = list.filter((id) => id !== course.id);
        }
        localStorage.setItem('guest_wishlist', JSON.stringify(list));
      } catch (e) {
        console.warn('Guest wishlist error:', e);
      }
    }
  };

  // Buy / Direct Enrollment Handler
  const handleBuyNow = async () => {
    if (!course) return;
    if (userId) {
      const user = await authService.getCurrentUser();
      await profileService.upsertProfile({
        id: userId,
        email: user?.email || '',
        full_name: user?.user_metadata?.full_name || 'Enrolled Student',
        role: 'student',
      });

      const enrollRes = await enrollmentService.createEnrollment({
        user_id: userId,
        course_id: course.id,
        status: 'active',
        payment_status: 'paid',
        amount_paid: course.price,
      });

      await studentService.enrollDemoCourse(course.id, userId);

      if (enrollRes.data || enrollRes.error === null) {
        setIsEnrolled(true);
        setPurchaseNotice(`Congratulations! You have successfully enrolled in "${course.title || course.name}". You now have instant access in your Student Portal.`);
        return;
      }
    }

    // Open Enrollment Modal so guest can fill out name, email & phone
    setSelectedEnrollCourse(course);
  };

  const toggleFaq = (index: number) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  const toggleModule = (id: string) => {
    setOpenModuleId((prev) => (prev === id ? null : id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EEF7F5] flex flex-col justify-between">
        <Header onOpenContact={() => setIsContactOpen(true)} />
        <div className="flex-1 flex items-center justify-center py-24">
          <div className="text-center space-y-4">
            <Sparkles className="w-10 h-10 text-[#287687] animate-spin mx-auto" />
            <p className="text-sm font-semibold text-[#102A36]">Loading Course Details...</p>
          </div>
        </div>
        <Footer onOpenContact={() => setIsContactOpen(true)} />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-[#EEF7F5] flex flex-col justify-between">
        <Header onOpenContact={() => setIsContactOpen(true)} />
        <div className="flex-1 max-w-xl mx-auto text-center py-24 px-4 space-y-5">
          <Info className="w-12 h-12 text-[#287687] mx-auto" />
          <h2 className="font-serif text-3xl font-bold text-[#102A36]">
            {error || 'Course Not Found'}
          </h2>
          <p className="text-sm text-[#486D7A]">
            We couldn't locate the requested course. It may have been archived or moved.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={fetchCourseData}
              className="px-5 py-2.5 rounded-full bg-[#102A36] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#287687] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
            <Link
              to="/"
              className="px-5 py-2.5 rounded-full border border-[#287687] text-[#287687] text-xs font-bold uppercase tracking-widest hover:bg-[#EEF7F5] transition-all"
            >
              Back to Home
            </Link>
          </div>
        </div>
        <Footer onOpenContact={() => setIsContactOpen(true)} />
      </div>
    );
  }

  const instructorName = typeof course.instructor === 'string' ? course.instructor : course.instructor.name;
  const instructorRole = course.instructorRole || (typeof course.instructor === 'object' ? course.instructor.title : 'Master Healer & Mind Coach');
  const instructorBio = typeof course.instructor === 'object'
    ? course.instructor.bio
    : 'Heer is a certified Usui Reiki Grand Master, Master NLP Practitioner, and Subconscious Alchemist who has empowered thousands across 18+ countries.';
  const instructorAvatar = storageService.getInstructorAvatarUrl(course.instructorAvatar || (typeof course.instructor === 'object' ? course.instructor.avatar : undefined));

  const outcomes = course.learningOutcomes || course.keyOutcomes || [];
  const reqs = course.requirements || (course.prerequisites ? [course.prerequisites] : []);
  const curriculum = course.curriculumPreview || course.curriculum || [];

  const faqs = [
    {
      q: 'When do I get access after enrolling?',
      a: 'Immediate instant access to orientation materials, course modules, live batch session calendar, and the student learning community portal.'
    },
    {
      q: 'Is there a live interactive component with Heer?',
      a: 'Yes! All certification courses include live Q&A sessions, supervised practice calls, and direct attunement ceremonies guided personally by Master Heer.'
    },
    {
      q: 'Will I receive an accredited certificate upon completion?',
      a: `Yes, upon completing the course requirements you will receive an official digital ${course.certificationName || 'Accredited Certificate'} signed by Heer.`
    },
    {
      q: 'What if I cannot attend the live batch calls?',
      a: 'All live sessions are recorded in HD and uploaded to your Student LMS portal within 24 hours with lifetime access.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#EEF7F5] text-[#102A36] flex flex-col font-sans selection:bg-[#C8E6E1] selection:text-[#102A36]">
      
      {/* Dynamic SEO Tags & Schema */}
      <SEO
        title={`${course.title || course.name} | Heal With Heer LMS`}
        description={course.shortDescription || course.fullDescription.slice(0, 160)}
        image={course.thumbnail || course.image}
        courseSchema={{
          name: course.title || course.name,
          description: course.shortDescription,
          provider: 'Heal With Heer Academy',
          price: course.price,
          currency: 'USD',
          rating: course.rating,
          reviewCount: course.reviewsCount || 12,
          image: course.thumbnail || course.image,
        }}
      />

      <Header onOpenContact={() => setIsContactOpen(true)} />

      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-[#102A36] to-[#0B232D] text-white pt-8 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#CBA258_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs text-gray-300 mb-6 flex-wrap">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link to="/" className="hover:text-white transition-colors">Courses</Link>
            <span>/</span>
            <span className="text-[#CBA258] font-semibold">{course.modality}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            
            {/* Left Column: Course Overview */}
            <div className="lg:col-span-2 space-y-5">
              
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full bg-[#287687] text-white text-[10px] font-bold uppercase tracking-widest">
                  {course.modality}
                </span>
                <span className="px-3 py-1 rounded-full bg-[#CBA258]/20 border border-[#CBA258]/40 text-[#E5C158] text-[10px] font-bold uppercase tracking-widest">
                  {course.category}
                </span>
                <span className="px-3 py-1 rounded-full bg-white/10 text-gray-200 text-[10px] font-bold uppercase tracking-widest">
                  {course.level || course.difficulty}
                </span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl font-bold leading-tight text-white">
                {course.title || course.name}
              </h1>

              <p className="text-base sm:text-lg text-gray-200 leading-relaxed font-normal">
                {course.subtitle || course.shortDescription}
              </p>

              {/* Course Meta Info */}
              <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-gray-300">
                <div className="flex items-center gap-1.5 font-semibold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-white font-bold text-sm">{course.rating.toFixed(1)}</span>
                  <span>({course.students?.toLocaleString() || '150+'} Students Enrolled)</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#CBA258]" />
                  <span>Instructor: <strong className="text-white">{instructorName}</strong></span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-[#CBA258]" />
                  <span>Language: <strong className="text-white">{course.language || 'English'}</strong></span>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* Main Content Grid & Sticky Purchase Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Left 2 Columns */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-white border border-[#C8E6E1] shadow-2xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#486D7A] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#287687]" /> Duration
                </span>
                <p className="font-bold text-sm text-[#102A36]">{course.duration}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#486D7A] flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-[#287687]" /> Certificate
                </span>
                <p className="font-bold text-sm text-[#102A36]">{course.certificateAvailable ? 'Accredited' : 'Certificate'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#486D7A] flex items-center gap-1">
                  <Video className="w-3.5 h-3.5 text-[#287687]" /> Mode
                </span>
                <p className="font-bold text-sm text-[#102A36]">{course.mode || 'Online'} Live Cohort</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#486D7A] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#287687]" /> Access
                </span>
                <p className="font-bold text-sm text-[#102A36]">Lifetime Access</p>
              </div>
            </div>

            {/* 1. Course Overview */}
            <div className="space-y-4 bg-white p-6 sm:p-8 rounded-3xl border border-[#C8E6E1] shadow-2xs">
              <h2 className="font-serif text-2xl font-bold text-[#102A36]">Course Overview</h2>
              <div className="text-sm text-[#486D7A] leading-relaxed space-y-3 whitespace-pre-line">
                {course.fullDescription}
              </div>
            </div>

            {/* 2. What You Will Learn */}
            {outcomes.length > 0 && (
              <div className="space-y-4 bg-white p-6 sm:p-8 rounded-3xl border border-[#C8E6E1] shadow-2xs">
                <h2 className="font-serif text-2xl font-bold text-[#102A36]">What You Will Learn</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {outcomes.map((outcome, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-[#EEF7F5] border border-[#C8E6E1]">
                      <CheckCircle2 className="w-5 h-5 text-[#287687] shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm font-medium text-[#102A36] leading-snug">{outcome}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Prerequisites & Requirements */}
            {reqs.length > 0 && (
              <div className="space-y-4 bg-white p-6 sm:p-8 rounded-3xl border border-[#C8E6E1] shadow-2xs">
                <h2 className="font-serif text-2xl font-bold text-[#102A36]">Prerequisites & Requirements</h2>
                <ul className="space-y-2.5 text-xs sm:text-sm text-[#486D7A]">
                  {reqs.map((req, idx) => (
                    <li key={idx} className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-[#CBA258]" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 4. Curriculum Preview */}
            {curriculum.length > 0 && (
              <div className="space-y-4 bg-white p-6 sm:p-8 rounded-3xl border border-[#C8E6E1] shadow-2xs">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-2xl font-bold text-[#102A36]">Curriculum Preview</h2>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsPreviewOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#287687] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#102A36] transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <PlayCircle className="w-4 h-4" /> Interactive Player Preview
                    </button>
                    <span className="text-xs text-[#287687] font-bold uppercase tracking-wider">{curriculum.length} Modules</span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {curriculum.map((mod) => {
                    const isOpen = openModuleId === mod.id;
                    return (
                      <div key={mod.id} className="rounded-xl border border-[#C8E6E1] bg-white overflow-hidden">
                        <button
                          onClick={() => toggleModule(mod.id)}
                          className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-semibold text-sm text-[#102A36] hover:bg-[#EEF7F5] transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-[#287687]" />
                            <span>{mod.title}</span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs text-[#486D7A] bg-[#E2F1EE] px-2.5 py-1 rounded-full border border-[#C8E6E1] font-semibold">
                              {mod.duration}
                            </span>
                            {isOpen ? <ChevronUp className="w-4 h-4 text-[#486D7A]" /> : <ChevronDown className="w-4 h-4 text-[#486D7A]" />}
                          </div>
                        </button>

                        {isOpen && (
                          <div className="px-5 pb-4 pt-1 bg-[#EEF7F5]/50 border-t border-[#C8E6E1] space-y-2 text-xs sm:text-sm text-[#486D7A]">
                            {mod.lessons.map((lesson, lIdx) => (
                              <div key={lIdx} className="flex items-center gap-2 pl-4 py-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#287687]" />
                                <span>{lesson}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 5. Instructor Profile */}
            <div className="space-y-4 bg-white p-6 sm:p-8 rounded-3xl border border-[#C8E6E1] shadow-2xs">
              <h2 className="font-serif text-2xl font-bold text-[#102A36]">Meet Your Lead Facilitator</h2>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-5 rounded-2xl bg-[#EEF7F5] border border-[#C8E6E1]">
                <img
                  src={instructorAvatar}
                  alt={instructorName}
                  className="w-20 h-20 rounded-full object-cover border-2 border-[#287687] shrink-0"
                />
                <div className="space-y-1">
                  <h3 className="font-serif font-bold text-xl text-[#102A36]">{instructorName}</h3>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#287687]">{instructorRole}</p>
                  <p className="text-xs text-[#486D7A] leading-relaxed pt-1">{instructorBio}</p>
                </div>
              </div>
            </div>

            {/* 6. Certification Information */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#102A36] to-[#0B232D] text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#E5C158]">Official Accreditation</span>
                <h3 className="font-serif text-xl sm:text-2xl font-bold">{course.certificationName || 'Certified Practitioner Certificate'}</h3>
                <p className="text-xs text-gray-300">
                  Includes verifiable digital certificate, official seal, and eligibility to join the global Heal With Heer practitioner registry.
                </p>
              </div>
              <Award className="w-16 h-16 text-[#E5C158] shrink-0" />
            </div>

            {/* 7. Course Reviews Component (Connected to course_reviews table) */}
            <CourseReviewsSection
              courseId={course.id}
              courseTitle={course.title || course.name}
            />

            {/* 8. FAQs */}
            <div className="space-y-4 bg-white p-6 sm:p-8 rounded-3xl border border-[#C8E6E1] shadow-2xs">
              <h2 className="font-serif text-2xl font-bold text-[#102A36]">Frequently Asked Questions</h2>
              <div className="space-y-3 pt-2">
                {faqs.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div key={idx} className="rounded-xl border border-[#C8E6E1] overflow-hidden">
                      <button
                        onClick={() => toggleFaq(idx)}
                        className="w-full p-4 text-left font-semibold text-xs sm:text-sm text-[#102A36] flex items-center justify-between gap-4 cursor-pointer hover:bg-[#EEF7F5] transition-colors"
                      >
                        <span>{faq.q}</span>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-[#287687]" /> : <ChevronDown className="w-4 h-4 text-[#287687]" />}
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 pt-1 text-xs text-[#486D7A] leading-relaxed border-t border-[#C8E6E1] bg-[#EEF7F5]/40">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column: Sticky Action Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="sticky top-24 bg-white rounded-3xl p-6 border border-[#C8E6E1] shadow-lg space-y-6">
              
              {/* Media Preview Box */}
              <div className="h-44 rounded-2xl bg-[#EEF7F5] overflow-hidden relative group">
                <img
                  src={storageService.getCourseImageUrl(course.thumbnail || course.image)}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Wishlist Toggle Button */}
                <button
                  onClick={handleToggleWishlist}
                  aria-label="Toggle Wishlist"
                  className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-[#102A36] hover:bg-white shadow-md transition-all cursor-pointer z-10"
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-gray-600 hover:text-rose-500'}`} />
                </button>

                {/* Course Video Preview Button */}
                <button
                  onClick={() => setIsVideoModalOpen(true)}
                  className="absolute inset-0 bg-black/30 hover:bg-black/40 transition-colors flex items-center justify-center cursor-pointer group/play"
                >
                  <div className="w-12 h-12 rounded-full bg-white/90 text-[#287687] flex items-center justify-center shadow-md group-hover/play:scale-110 transition-transform">
                    <PlayCircle className="w-7 h-7 text-[#287687]" />
                  </div>
                </button>
              </div>

              {/* Pricing Box */}
              <div className="space-y-2 border-b border-[#C8E6E1] pb-5">
                <div className="flex items-baseline gap-3">
                  <span className="font-serif text-3xl font-bold text-[#102A36]">
                    {course.currency}{course.price}
                  </span>
                  {(course.discountPrice || course.originalPrice) && (
                    <span className="text-sm text-gray-400 line-through">
                      {course.currency}{course.discountPrice || course.originalPrice}
                    </span>
                  )}
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-100 text-[#B8860B]">
                    Special Price
                  </span>
                </div>
                <p className="text-xs text-[#287687] font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Next Batch: {course.upcomingBatchDate || 'Enrollment Open'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {isEnrolled ? (
                  <Link
                    to="/student/lms"
                    className="w-full py-3.5 px-6 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>Go to My Student LMS</span>
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={handleBuyNow}
                      className="w-full py-3.5 px-6 rounded-2xl bg-[#102A36] hover:bg-[#287687] text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Buy & Enroll Now</span>
                      <ArrowRight className="w-4 h-4 text-[#E5C158]" />
                    </button>

                    <button
                      onClick={() => setSelectedEnrollCourse(course)}
                      className="w-full py-3 px-6 rounded-2xl border-2 border-[#287687] text-[#287687] hover:bg-[#EEF7F5] text-xs font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>Enroll via Application</span>
                    </button>
                  </>
                )}
              </div>

              {/* Course Features Checklist */}
              <div className="space-y-3 pt-2 text-xs text-[#486D7A]">
                <p className="font-bold text-[#102A36] uppercase tracking-wider text-[10px]">This Course Includes:</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#287687]" />
                    <span>Live Interactive Cohort + Q&A</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#287687]" />
                    <span>HD Recordings & Lifetime Access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#287687]" />
                    <span>Accredited Practitioner Certificate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#287687]" />
                    <span>Direct Mentorship from Heer</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Related Courses Section */}
        {relatedCourses.length > 0 && (
          <div className="mt-16 pt-12 border-t border-[#C8E6E1] space-y-6">
            <h2 className="font-serif text-2xl font-bold text-[#102A36]">
              Related Journeys in {course.modality}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedCourses.map((rel, idx) => (
                <CourseCard
                  key={rel.id}
                  course={rel}
                  index={idx}
                  onEnroll={(c) => setSelectedEnrollCourse(c)}
                />
              ))}
            </div>
          </div>
        )}

      </section>

      {/* Interactive Course Player Preview Modal */}
      {isPreviewOpen && (
        <CoursePreview
          course={course}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}

      {/* Video Preview Modal */}
      {isVideoModalOpen && (
        <VideoPreviewModal
          videoUrl={course.previewVideo || (course as any).preview_video_url}
          courseTitle={course.title || course.name}
          onClose={() => setIsVideoModalOpen(false)}
          onOpenInteractivePreview={() => setIsPreviewOpen(true)}
        />
      )}

      {/* Payment Notice / Toast Notification */}
      {purchaseNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#C8E6E1] shadow-xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#EEF7F5] text-[#287687] flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6 text-[#287687]" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#102A36]">Enrollment Notice</h3>
            <p className="text-xs text-[#486D7A] leading-relaxed">
              {purchaseNotice}
            </p>
            <div className="pt-2">
              <button
                onClick={() => setPurchaseNotice(null)}
                className="w-full py-3 rounded-2xl bg-[#102A36] text-white text-xs font-bold uppercase tracking-widest cursor-pointer hover:bg-[#287687] transition-all"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enrollment Form Modal */}
      {selectedEnrollCourse && (
        <EnrollmentModal
          course={selectedEnrollCourse}
          onClose={() => setSelectedEnrollCourse(null)}
        />
      )}

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />

      <Footer onOpenContact={() => setIsContactOpen(true)} />

    </div>
  );
};

export default CourseDetailsPage;
