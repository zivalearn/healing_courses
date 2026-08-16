import { Course } from '../models/course';
import { courseService } from './courseService';
import { enrollmentService } from './enrollmentService';

export interface PurchaseResult {
  success: boolean;
  message: string;
  courseId: string;
}

const ENROLLED_KEY = 'heal_with_heer_enrolled_courses';

export class StudentService {
  /**
   * Check if a student has active access to a course
   */
  async hasCourseAccess(courseId: string, studentId: string = ''): Promise<boolean> {
    if (!courseId) return false;
    try {
      if (studentId && studentId !== 'demo-student-id' && studentId !== 'demo-student') {
        const { isEnrolled } = await enrollmentService.isUserEnrolled(studentId, courseId);
        if (isEnrolled) return true;
      }
      const enrolled = this.getEnrolledCourseIds();
      return enrolled.includes(courseId);
    } catch (err) {
      return false;
    }
  }

  /**
   * Purchase course placeholder (prepares integration for Razorpay in future phase)
   */
  async purchaseCourse(courseId: string): Promise<PurchaseResult> {
    return {
      success: false,
      message: 'Payment integration coming soon. Razorpay payment gateway will be enabled in the next phase.',
      courseId
    };
  }

  /**
   * Enroll student in course
   */
  async enrollDemoCourse(courseId: string, studentId?: string): Promise<boolean> {
    try {
      if (studentId && studentId !== 'demo-student-id' && studentId !== 'demo-student') {
        await enrollmentService.createEnrollment({
          user_id: studentId,
          course_id: courseId,
          status: 'active',
          payment_status: 'paid',
        });
      }

      const current = this.getEnrolledCourseIds();
      if (!current.includes(courseId)) {
        current.push(courseId);
        localStorage.setItem(ENROLLED_KEY, JSON.stringify(current));
        window.dispatchEvent(new Event('enrollment_updated'));
      }
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Get all courses enrolled by student
   */
  async getStudentCourses(studentId: string = ''): Promise<Course[]> {
    const enrolledIds: string[] = [];

    if (studentId && studentId !== 'demo-student-id' && studentId !== 'demo-student') {
      const { data: dbEnrollments } = await enrollmentService.getUserEnrollments(studentId);
      if (dbEnrollments && dbEnrollments.length > 0) {
        dbEnrollments
          .filter(e => e.status === 'active' || e.status === 'completed')
          .forEach(e => {
            if (!enrolledIds.includes(e.course_id)) {
              enrolledIds.push(e.course_id);
            }
          });
      }
    }

    const localIds = this.getEnrolledCourseIds();
    localIds.forEach(id => {
      if (!enrolledIds.includes(id)) {
        enrolledIds.push(id);
      }
    });

    if (enrolledIds.length === 0) {
      return [];
    }

    const allCourses = await courseService.getAllCourses();
    return allCourses.filter(c => enrolledIds.includes(c.id) || (c.slug && enrolledIds.includes(c.slug)));
  }

  private getEnrolledCourseIds(): string[] {
    try {
      const stored = localStorage.getItem(ENROLLED_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (err) {
      // fallback
    }
    return [];
  }
}

export const studentService = new StudentService();

