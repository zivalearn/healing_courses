import React, { useEffect, useState } from 'react';
import { Course } from '../../models/course';
import { studentService } from '../../services/studentService';
import { storageService } from '../../services/storageService';
import { getLessonProgress } from '../../services/lessonProgressService';
import { getUserCertificates } from '../../services/certificateService';
import { Certificate } from '../../types/certificate';
import { StudentLessonPlayer } from './StudentLessonPlayer';
import { CertificateViewer } from './CertificateViewer';
import {
  GraduationCap,
  BookOpen,
  Award,
  PlayCircle,
  Clock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Search,
} from 'lucide-react';

interface StudentDashboardProps {
  userId?: string;
  studentName?: string;
  onExploreCourses?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  userId = 'demo-student-id',
  studentName = 'Seeker',
  onExploreCourses,
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeLessonPlayerCourse, setActiveLessonPlayerCourse] = useState<Course | null>(null);
  const [completedLessonsCount, setCompletedLessonsCount] = useState<number>(0);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedCertificate, setSelectedCertificate] = useState<{ cert: Certificate; courseTitle: string } | null>(null);

  useEffect(() => {
    loadStudentDashboardData();

    const handleEnrollmentUpdated = () => {
      loadStudentDashboardData();
    };

    window.addEventListener('enrollment_updated', handleEnrollmentUpdated);
    window.addEventListener('storage', handleEnrollmentUpdated);

    return () => {
      window.removeEventListener('enrollment_updated', handleEnrollmentUpdated);
      window.removeEventListener('storage', handleEnrollmentUpdated);
    };
  }, [userId]);

  const loadStudentDashboardData = async () => {
    setLoading(true);
    try {
      const studentCourses = await studentService.getStudentCourses(userId);
      setCourses(studentCourses);

      if (studentCourses.length > 0) {
        setActiveCourse(studentCourses[0]);
      }

      // Load progress count
      const { data: userProgress } = await getLessonProgress(userId);
      if (userProgress) {
        const completed = userProgress.filter((p) => p.is_completed).length;
        setCompletedLessonsCount(completed);
      }

      // Load certificates
      const { data: userCerts } = await getUserCertificates(userId);
      setCertificates(userCerts || []);
    } catch (err) {
      console.error('Failed to load student dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (activeLessonPlayerCourse) {
    return (
      <StudentLessonPlayer
        course={activeLessonPlayerCourse}
        userId={userId}
        studentName={studentName}
        onClose={() => setActiveLessonPlayerCourse(null)}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. WELCOME BANNER & STATS BAR */}
      <div className="bg-gradient-to-r from-[#102A36] via-[#1a3e4e] to-[#287687] text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#E5C158] bg-[#E5C158]/10 px-3 py-1 rounded-full border border-[#E5C158]/30 inline-flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-[#E5C158]" /> STUDENT LEARNING DASHBOARD
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white">
              Welcome Back, {studentName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 max-w-xl leading-relaxed">
              Continue your transformational healing journey. Track lesson progress, submit exercises, and view accredited certificates.
            </p>
          </div>

          {activeCourse && (
            <button
              onClick={() => setActiveLessonPlayerCourse(activeCourse)}
              className="px-6 py-3.5 rounded-2xl bg-[#E5C158] hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2.5 shrink-0 cursor-pointer"
            >
              <PlayCircle className="w-5 h-5" />
              <span>Resume Learning Player</span>
            </button>
          )}
        </div>

        {/* Overview Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-white/10 relative z-10">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-300">Enrolled Programs</span>
            <p className="font-serif text-2xl font-bold text-white">{courses.length}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-300">Completed Lessons</span>
            <p className="font-serif text-2xl font-bold text-white">{completedLessonsCount}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-300">Certificates Earned</span>
            <p className="font-serif text-2xl font-bold text-amber-300">{certificates.length}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-300">Learning Status</span>
            <p className="font-serif text-sm font-bold text-emerald-300 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" /> Active Student
            </p>
          </div>
        </div>
      </div>

      {/* 2. CONTINUE LEARNING SPOTLIGHT CARD */}
      {activeCourse && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#C8E6E1] shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-[#102A36] flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-[#287687]" />
              <span>Continue Learning</span>
            </h2>
            <span className="text-xs font-bold text-[#287687]">Active Progress</span>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6 bg-[#EEF7F5] rounded-2xl p-5 border border-[#C8E6E1]">
            <img
              src={storageService.getCourseImageUrl(activeCourse.thumbnail || activeCourse.image)}
              alt={activeCourse.title}
              className="w-full md:w-48 h-32 rounded-xl object-cover border border-[#C8E6E1] shrink-0"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop';
              }}
            />

            <div className="space-y-2 flex-1 w-full">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#287687] bg-white px-3 py-1 rounded-full border border-[#C8E6E1]">
                {activeCourse.modality}
              </span>
              <h3 className="font-serif font-bold text-lg text-[#102A36]">
                {activeCourse.title || activeCourse.name}
              </h3>
              <p className="text-xs text-[#486D7A] line-clamp-2">
                {activeCourse.shortDescription}
              </p>

              {/* Progress Bar */}
              <div className="space-y-1 pt-2">
                <div className="flex justify-between text-[11px] font-bold text-[#486D7A]">
                  <span>Progress</span>
                  <span className="text-[#287687]">In Progress</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white overflow-hidden border border-[#C8E6E1]">
                  <div className="h-full bg-[#287687] rounded-full w-2/5" />
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveLessonPlayerCourse(activeCourse)}
              className="w-full md:w-auto px-6 py-3 rounded-2xl bg-[#102A36] hover:bg-[#287687] text-white text-xs font-bold uppercase tracking-wider transition-all shrink-0 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Launch Player</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. MY ENROLLED COURSES GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl font-bold text-[#102A36] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#287687]" />
            <span>My Enrolled Courses ({courses.length})</span>
          </h2>

          {onExploreCourses && (
            <button
              onClick={onExploreCourses}
              className="text-xs font-bold text-[#287687] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Explore Catalogue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center space-y-3">
            <Sparkles className="w-8 h-8 text-[#287687] animate-spin mx-auto" />
            <p className="text-xs font-semibold text-[#486D7A]">Loading Enrolled Courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center max-w-md mx-auto border border-[#C8E6E1] space-y-4">
            <GraduationCap className="w-12 h-12 text-[#287687] mx-auto opacity-60" />
            <h3 className="font-serif text-xl font-bold text-[#102A36]">No Enrolled Courses</h3>
            <p className="text-xs text-[#486D7A]">
              Explore our certified courses to begin your healing & consciousness journey.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-3xl p-5 border border-[#C8E6E1] shadow-2xs hover:border-[#287687] transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden h-40 bg-slate-100">
                    <img
                      src={storageService.getCourseImageUrl(course.thumbnail || course.image)}
                      alt={course.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop';
                      }}
                    />
                    <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-widest text-[#102A36] bg-white/95 px-3 py-1 rounded-full border border-[#C8E6E1] shadow-xs">
                      {course.modality}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-serif font-bold text-base text-[#102A36] line-clamp-1">
                      {course.title || course.name}
                    </h3>
                    <p className="text-xs text-[#486D7A] line-clamp-2">
                      {course.shortDescription}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#C8E6E1] flex items-center justify-between">
                  <span className="text-[11px] text-[#486D7A] font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#287687]" /> Self-Paced
                  </span>

                  <button
                    onClick={() => setActiveLessonPlayerCourse(course)}
                    className="px-4 py-2 rounded-xl bg-[#102A36] hover:bg-[#287687] text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Open Player</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. ACCREDITED CERTIFICATES */}
      {certificates.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#C8E6E1] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-[#102A36] flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Your Accredited Certificates ({certificates.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {certificates.map((cert) => {
              const matchedCourse = courses.find((c) => c.id === cert.course_id);
              const title = matchedCourse?.title || 'Certified Healing Practitioner';

              return (
                <div
                  key={cert.id}
                  className="p-4 rounded-2xl bg-[#EEF7F5] border border-[#C8E6E1] flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      Verified Certificate
                    </span>
                    <h4 className="font-serif font-bold text-sm text-[#102A36]">{title}</h4>
                    <p className="text-[10px] text-[#486D7A] font-mono">ID: {cert.certificate_number}</p>
                  </div>

                  <button
                    onClick={() => setSelectedCertificate({ cert, courseTitle: title })}
                    className="px-3 py-2 rounded-xl bg-[#102A36] hover:bg-[#287687] text-white text-xs font-bold transition-all shrink-0 cursor-pointer"
                  >
                    View
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CERTIFICATE MODAL */}
      {selectedCertificate && (
        <CertificateViewer
          certificate={selectedCertificate.cert}
          studentName={studentName}
          courseTitle={selectedCertificate.courseTitle}
          onClose={() => setSelectedCertificate(null)}
        />
      )}
    </div>
  );
};
