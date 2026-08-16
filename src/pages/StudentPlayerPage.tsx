import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService, mapSupabaseToCourse } from '../services/courseService';
import { Course } from '../models/course';
import { StudentLessonPlayer } from './student/StudentLessonPlayer';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles } from 'lucide-react';

export const StudentPlayerPage: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId?: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const studentName = profile?.full_name || (user?.email ? user.email.split('@')[0] : 'Seeker');
  const userId = user?.id || 'demo-student-id';

  useEffect(() => {
    if (!courseId) return;

    setLoading(true);
    courseService.getCourse(courseId).then(async (res) => {
      let foundCourse: Course | null = null;
      if (res.data) {
        foundCourse = mapSupabaseToCourse(res.data);
      } else {
        // Fallback search by slug or all courses
        const all = await courseService.getAllCourses();
        foundCourse = all.find((c) => c.id === courseId || c.slug === courseId) || null;
      }
      setCourse(foundCourse);
      setLoading(false);
    });
  }, [courseId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#EEF7F5] flex flex-col items-center justify-center space-y-3">
        <Sparkles className="w-10 h-10 text-[#287687] animate-spin" />
        <p className="text-sm font-bold text-[#102A36]">Launching Learning Player...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#EEF7F5] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 border border-[#C8E6E1] text-center max-w-md space-y-4 shadow-sm">
          <h3 className="font-serif text-xl font-bold text-[#102A36]">Course Not Found</h3>
          <p className="text-xs text-[#486D7A]">
            The requested course could not be located or may be offline.
          </p>
          <button
            onClick={() => navigate('/my-courses')}
            className="px-5 py-2.5 rounded-2xl bg-[#102A36] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#287687]"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <StudentLessonPlayer
      course={course}
      userId={userId}
      studentName={studentName}
      initialLessonId={lessonId}
      onClose={() => navigate('/my-courses')}
    />
  );
};
