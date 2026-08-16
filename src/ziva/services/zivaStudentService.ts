import { 
  ZivaEnrollment, 
  ZivaCertificate, 
  ZivaNote, 
  ZivaAnnouncement, 
  ZivaDiscussion, 
  ZivaCourseReview, 
  ZivaUserProfile,
  ZivaBookmark 
} from '../types';
import { zivaSupabase, isZivaSupabaseConfigured } from '../lib/supabase';

const getZivaProgressKey = (userId: string) => `ziva_student_progress_${userId}`;
const getZivaCertsKey = (userId: string) => `ziva_student_certificates_${userId}`;
const ZIVA_NOTES_KEY = 'ziva_student_notes';
const ZIVA_BOOKMARKS_KEY = 'ziva_student_bookmarks';
const ZIVA_ANNOUNCEMENTS_KEY = 'ziva_announcements';
const ZIVA_DISCUSSIONS_KEY = 'ziva_discussions';
const ZIVA_REVIEWS_KEY = 'ziva_reviews';
const ZIVA_ALL_ENROLLMENTS_KEY = 'ziva_all_enrollments';
const ZIVA_ALL_PROFILES_KEY = 'ziva_all_profiles';

export const zivaStudentService = {
  getEnrollments(userId: string): ZivaEnrollment[] {
    try {
      const raw = localStorage.getItem(getZivaProgressKey(userId));
      const userEnrollments = raw ? JSON.parse(raw) : [];
      if (userEnrollments.length > 0) return userEnrollments;

      // Fallback check global enrollments
      const globalRaw = localStorage.getItem(ZIVA_ALL_ENROLLMENTS_KEY);
      const all: ZivaEnrollment[] = globalRaw ? JSON.parse(globalRaw) : [];
      return all.filter(e => e.userId === userId && e.status !== 'revoked');
    } catch {
      return [];
    }
  },

  saveEnrollments(userId: string, enrollments: ZivaEnrollment[]): void {
    localStorage.setItem(getZivaProgressKey(userId), JSON.stringify(enrollments));

    // Also update global store
    try {
      const globalRaw = localStorage.getItem(ZIVA_ALL_ENROLLMENTS_KEY);
      let all: ZivaEnrollment[] = globalRaw ? JSON.parse(globalRaw) : [];
      enrollments.forEach(enr => {
        const idx = all.findIndex(a => a.id === enr.id || (a.userId === enr.userId && a.courseId === enr.courseId));
        if (idx >= 0) {
          all[idx] = enr;
        } else {
          all.push(enr);
        }
      });
      localStorage.setItem(ZIVA_ALL_ENROLLMENTS_KEY, JSON.stringify(all));
    } catch (e) {
      console.error(e);
    }
  },

  async enrollInCourse(userId: string, courseId: string, userEmail?: string, userName?: string): Promise<ZivaEnrollment> {
    const enrollments = this.getEnrollments(userId);
    const existing = enrollments.find(e => e.courseId === courseId);
    if (existing) {
      if (existing.status === 'revoked') {
        existing.status = 'active';
        this.saveEnrollments(userId, enrollments);
      }
      return existing;
    }

    const newEnrollment: ZivaEnrollment = {
      id: `zenr-${Date.now()}`,
      userId,
      userEmail: userEmail || 'student@zivalms.com',
      userName: userName || 'Ziva Student',
      courseId,
      enrolledAt: new Date().toISOString(),
      progressPercent: 0,
      lastAccessedAt: new Date().toISOString(),
      completedLessonIds: [],
      status: 'active',
    };

    enrollments.push(newEnrollment);
    this.saveEnrollments(userId, enrollments);

    if (isZivaSupabaseConfigured && zivaSupabase) {
      try {
        await zivaSupabase.from('ziva_enrollments').upsert({
          id: newEnrollment.id,
          user_id: userId,
          course_id: courseId,
          enrolled_at: newEnrollment.enrolledAt,
          progress_percent: 0,
          completed_lesson_ids: [],
          status: 'active',
        });
      } catch (err) {
        console.warn('Failed to sync Ziva enrollment to Supabase:', err);
      }
    }

    return newEnrollment;
  },

  async markLessonComplete(
    userId: string,
    courseId: string,
    lessonId: string,
    totalLessonsCount: number
  ): Promise<ZivaEnrollment> {
    const enrollments = this.getEnrollments(userId);
    let enrollment = enrollments.find(e => e.courseId === courseId);

    if (!enrollment) {
      enrollment = await this.enrollInCourse(userId, courseId);
    }

    if (!enrollment.completedLessonIds.includes(lessonId)) {
      enrollment.completedLessonIds.push(lessonId);
    }

    enrollment.lastAccessedAt = new Date().toISOString();
    const count = Math.max(1, totalLessonsCount);
    enrollment.progressPercent = Math.min(100, Math.round((enrollment.completedLessonIds.length / count) * 100));

    this.saveEnrollments(userId, enrollments);

    // If 100% complete, issue certificate automatically
    if (enrollment.progressPercent >= 100) {
      this.issueCertificate(userId, courseId);
    }

    if (isZivaSupabaseConfigured && zivaSupabase) {
      try {
        await zivaSupabase.from('ziva_enrollments').upsert({
          id: enrollment.id,
          user_id: userId,
          course_id: courseId,
          progress_percent: enrollment.progressPercent,
          completed_lesson_ids: enrollment.completedLessonIds,
          last_accessed_at: enrollment.lastAccessedAt,
        });
      } catch (err) {
        console.warn('Failed to sync lesson progress to Ziva Supabase:', err);
      }
    }

    return enrollment;
  },

  // CERTIFICATES
  getCertificates(userId?: string): ZivaCertificate[] {
    try {
      if (userId) {
        const raw = localStorage.getItem(getZivaCertsKey(userId));
        return raw ? JSON.parse(raw) : [];
      } else {
        // Return all certificates across users for admin
        const certs: ZivaCertificate[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('ziva_student_certificates_')) {
            const raw = localStorage.getItem(key);
            if (raw) certs.push(...JSON.parse(raw));
          }
        }
        return certs;
      }
    } catch {
      return [];
    }
  },

  issueCertificate(userId: string, courseId: string, courseTitle = 'Ziva Certification Course', userName?: string): ZivaCertificate {
    const certs = this.getCertificates(userId);
    const existing = certs.find(c => c.courseId === courseId);
    if (existing) return existing;

    const cert: ZivaCertificate = {
      id: `zcert-${Date.now()}`,
      userId,
      userName: userName || 'Ziva Graduate',
      courseId,
      courseTitle,
      issuedAt: new Date().toISOString(),
      certificateNumber: `ZIVA-CERT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      status: 'active',
    };

    certs.push(cert);
    localStorage.setItem(getZivaCertsKey(userId), JSON.stringify(certs));
    return cert;
  },

  revokeCertificate(certId: string, reason: string): boolean {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ziva_student_certificates_')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const certs: ZivaCertificate[] = JSON.parse(raw);
          const found = certs.find(c => c.id === certId);
          if (found) {
            found.status = 'revoked';
            found.revokeReason = reason;
            localStorage.setItem(key, JSON.stringify(certs));
            return true;
          }
        }
      }
    }
    return false;
  },

  reissueCertificate(certId: string): boolean {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ziva_student_certificates_')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const certs: ZivaCertificate[] = JSON.parse(raw);
          const found = certs.find(c => c.id === certId);
          if (found) {
            found.status = 'active';
            delete found.revokeReason;
            localStorage.setItem(key, JSON.stringify(certs));
            return true;
          }
        }
      }
    }
    return false;
  },

  // NOTES
  getNotes(userId: string, courseId?: string, lessonId?: string): ZivaNote[] {
    try {
      const raw = localStorage.getItem(ZIVA_NOTES_KEY);
      const notes: ZivaNote[] = raw ? JSON.parse(raw) : [];
      return notes.filter(n => {
        if (n.userId !== userId) return false;
        if (courseId && n.courseId !== courseId) return false;
        if (lessonId && n.lessonId !== lessonId) return false;
        return true;
      });
    } catch {
      return [];
    }
  },

  saveNote(userId: string, courseId: string, lessonId: string, content: string, lessonTitle?: string): ZivaNote {
    const raw = localStorage.getItem(ZIVA_NOTES_KEY);
    const notes: ZivaNote[] = raw ? JSON.parse(raw) : [];

    const existingIndex = notes.findIndex(n => n.userId === userId && n.lessonId === lessonId);
    const now = new Date().toISOString();

    let note: ZivaNote;
    if (existingIndex >= 0) {
      note = { ...notes[existingIndex], content, lessonTitle, updatedAt: now };
      notes[existingIndex] = note;
    } else {
      note = {
        id: `znote-${Date.now()}`,
        userId,
        courseId,
        lessonId,
        lessonTitle: lessonTitle || 'Lesson Note',
        content,
        createdAt: now,
        updatedAt: now,
      };
      notes.unshift(note);
    }

    localStorage.setItem(ZIVA_NOTES_KEY, JSON.stringify(notes));
    return note;
  },

  deleteNote(noteId: string): void {
    const raw = localStorage.getItem(ZIVA_NOTES_KEY);
    if (!raw) return;
    const notes: ZivaNote[] = JSON.parse(raw);
    const filtered = notes.filter(n => n.id !== noteId);
    localStorage.setItem(ZIVA_NOTES_KEY, JSON.stringify(filtered));
  },

  // BOOKMARKS
  getBookmarks(userId: string, courseId?: string): ZivaBookmark[] {
    try {
      const raw = localStorage.getItem(ZIVA_BOOKMARKS_KEY);
      const list: ZivaBookmark[] = raw ? JSON.parse(raw) : [];
      return list.filter(b => b.userId === userId && (!courseId || b.courseId === courseId));
    } catch {
      return [];
    }
  },

  isBookmarked(userId: string, courseId: string, lessonId: string): boolean {
    const list = this.getBookmarks(userId, courseId);
    return list.some(b => b.lessonId === lessonId);
  },

  toggleBookmark(userId: string, courseId: string, lessonId: string, lessonTitle: string): boolean {
    const raw = localStorage.getItem(ZIVA_BOOKMARKS_KEY);
    const list: ZivaBookmark[] = raw ? JSON.parse(raw) : [];

    const existingIndex = list.findIndex(b => b.userId === userId && b.lessonId === lessonId);
    if (existingIndex >= 0) {
      list.splice(existingIndex, 1);
      localStorage.setItem(ZIVA_BOOKMARKS_KEY, JSON.stringify(list));
      return false;
    } else {
      const newBm: ZivaBookmark = {
        id: `zbm-${Date.now()}`,
        userId,
        courseId,
        lessonId,
        lessonTitle,
        createdAt: new Date().toISOString(),
      };
      list.unshift(newBm);
      localStorage.setItem(ZIVA_BOOKMARKS_KEY, JSON.stringify(list));
      return true;
    }
  },

  // ANNOUNCEMENTS
  getAnnouncements(courseId?: string): ZivaAnnouncement[] {
    try {
      const raw = localStorage.getItem(ZIVA_ANNOUNCEMENTS_KEY);
      const defaults: ZivaAnnouncement[] = [
        {
          id: 'zann-1',
          title: 'Welcome to Ziva LMS Confidence Masterclass',
          message: 'Welcome to your premium coaching experience. Check out Section 1 for mindset exercises!',
          isPinned: true,
          createdBy: 'Meharr (Lead Instructor)',
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        }
      ];
      const list: ZivaAnnouncement[] = raw ? JSON.parse(raw) : defaults;
      if (!raw) localStorage.setItem(ZIVA_ANNOUNCEMENTS_KEY, JSON.stringify(defaults));

      if (courseId) {
        return list.filter(a => !a.courseId || a.courseId === courseId);
      }
      return list;
    } catch {
      return [];
    }
  },

  createAnnouncement(title: string, message: string, courseId?: string, courseTitle?: string): ZivaAnnouncement {
    const list = this.getAnnouncements();
    const newAnn: ZivaAnnouncement = {
      id: `zann-${Date.now()}`,
      title,
      message,
      courseId,
      courseTitle,
      isPinned: true,
      createdBy: 'Ziva Admin',
      createdAt: new Date().toISOString(),
    };
    list.unshift(newAnn);
    localStorage.setItem(ZIVA_ANNOUNCEMENTS_KEY, JSON.stringify(list));
    return newAnn;
  },

  deleteAnnouncement(id: string): void {
    const list = this.getAnnouncements().filter(a => a.id !== id);
    localStorage.setItem(ZIVA_ANNOUNCEMENTS_KEY, JSON.stringify(list));
  },

  // DISCUSSIONS
  getDiscussions(courseId: string, lessonId?: string): ZivaDiscussion[] {
    try {
      const raw = localStorage.getItem(ZIVA_DISCUSSIONS_KEY);
      const list: ZivaDiscussion[] = raw ? JSON.parse(raw) : [];
      return list.filter(d => {
        if (d.courseId !== courseId) return false;
        if (lessonId && d.lessonId !== lessonId) return false;
        return !d.parentId; // Top level
      });
    } catch {
      return [];
    }
  },

  postDiscussion(discussion: Omit<ZivaDiscussion, 'id' | 'createdAt'>): ZivaDiscussion {
    const raw = localStorage.getItem(ZIVA_DISCUSSIONS_KEY);
    const list: ZivaDiscussion[] = raw ? JSON.parse(raw) : [];

    const newDisc: ZivaDiscussion = {
      ...discussion,
      id: `zdisc-${Date.now()}`,
      createdAt: new Date().toISOString(),
      replies: [],
    };

    if (discussion.parentId) {
      const parent = list.find(d => d.id === discussion.parentId);
      if (parent) {
        if (!parent.replies) parent.replies = [];
        parent.replies.push(newDisc);
      }
    } else {
      list.unshift(newDisc);
    }

    localStorage.setItem(ZIVA_DISCUSSIONS_KEY, JSON.stringify(list));
    return newDisc;
  },

  deleteDiscussion(id: string): void {
    const raw = localStorage.getItem(ZIVA_DISCUSSIONS_KEY);
    if (!raw) return;
    const list: ZivaDiscussion[] = JSON.parse(raw);
    const filtered = list.filter(d => d.id !== id);
    localStorage.setItem(ZIVA_DISCUSSIONS_KEY, JSON.stringify(filtered));
  },

  // REVIEWS
  getReviews(courseId?: string): ZivaCourseReview[] {
    try {
      const raw = localStorage.getItem(ZIVA_REVIEWS_KEY);
      const defaults: ZivaCourseReview[] = [
        {
          id: 'zrev-1',
          courseId: 'ziva-confidence-101',
          userId: 'user-demo-1',
          userName: 'Ananya Sharma',
          rating: 5,
          comment: 'This course completely transformed how I speak in public and conduct interviews! Incredible frameworks.',
          isPublished: true,
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        },
        {
          id: 'zrev-2',
          courseId: 'ziva-confidence-101',
          userId: 'user-demo-2',
          userName: 'Rohan Verma',
          rating: 5,
          comment: 'Meharr is an exceptional coach. The actionable video exercises and workbook notes were top notch.',
          isPublished: true,
          createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
        }
      ];
      const list: ZivaCourseReview[] = raw ? JSON.parse(raw) : defaults;
      if (!raw) localStorage.setItem(ZIVA_REVIEWS_KEY, JSON.stringify(defaults));

      if (courseId) {
        return list.filter(r => r.courseId === courseId);
      }
      return list;
    } catch {
      return [];
    }
  },

  postReview(review: Omit<ZivaCourseReview, 'id' | 'createdAt' | 'isPublished'>): ZivaCourseReview {
    const list = this.getReviews();
    const newRev: ZivaCourseReview = {
      ...review,
      id: `zrev-${Date.now()}`,
      isPublished: true,
      createdAt: new Date().toISOString(),
    };
    list.unshift(newRev);
    localStorage.setItem(ZIVA_REVIEWS_KEY, JSON.stringify(list));
    return newRev;
  },

  toggleReviewPublished(id: string): ZivaCourseReview | null {
    const list = this.getReviews();
    const found = list.find(r => r.id === id);
    if (found) {
      found.isPublished = !found.isPublished;
      localStorage.setItem(ZIVA_REVIEWS_KEY, JSON.stringify(list));
      return found;
    }
    return null;
  },

  deleteReview(id: string): void {
    const list = this.getReviews().filter(r => r.id !== id);
    localStorage.setItem(ZIVA_REVIEWS_KEY, JSON.stringify(list));
  },

  // ALL ENROLLMENTS (ADMIN)
  getAllEnrollments(): ZivaEnrollment[] {
    try {
      const all: ZivaEnrollment[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('ziva_student_progress_')) {
          const raw = localStorage.getItem(key);
          if (raw) all.push(...JSON.parse(raw));
        }
      }

      const globalRaw = localStorage.getItem(ZIVA_ALL_ENROLLMENTS_KEY);
      if (globalRaw) {
        const globalList: ZivaEnrollment[] = JSON.parse(globalRaw);
        globalList.forEach(g => {
          if (!all.some(a => a.id === g.id)) all.push(g);
        });
      }

      if (all.length === 0) {
        const defaultEnrollments: ZivaEnrollment[] = [
          {
            id: 'zenr-demo-1',
            userId: 'usr-101',
            userEmail: 'aarav@example.com',
            userName: 'Aarav Patel',
            courseId: 'ziva-confidence-101',
            enrolledAt: new Date(Date.now() - 86400000 * 10).toISOString(),
            progressPercent: 75,
            lastAccessedAt: new Date().toISOString(),
            completedLessonIds: ['zles-1', 'zles-2'],
            status: 'active',
          },
          {
            id: 'zenr-demo-2',
            userId: 'usr-102',
            userEmail: 'riya@example.com',
            userName: 'Riya Gupta',
            courseId: 'ziva-confidence-101',
            enrolledAt: new Date(Date.now() - 86400000 * 20).toISOString(),
            progressPercent: 100,
            lastAccessedAt: new Date().toISOString(),
            completedLessonIds: ['zles-1', 'zles-2', 'zles-3'],
            status: 'completed',
          }
        ];
        localStorage.setItem(ZIVA_ALL_ENROLLMENTS_KEY, JSON.stringify(defaultEnrollments));
        return defaultEnrollments;
      }

      return all;
    } catch {
      return [];
    }
  },

  adminEnrollStudent(studentEmail: string, courseId: string, studentName?: string): ZivaEnrollment {
    const all = this.getAllEnrollments();
    const userId = `usr-m-${Date.now()}`;
    const newEnr: ZivaEnrollment = {
      id: `zenr-m-${Date.now()}`,
      userId,
      userEmail: studentEmail,
      userName: studentName || studentEmail.split('@')[0],
      courseId,
      enrolledAt: new Date().toISOString(),
      progressPercent: 0,
      lastAccessedAt: new Date().toISOString(),
      completedLessonIds: [],
      status: 'active',
    };
    all.unshift(newEnr);
    localStorage.setItem(ZIVA_ALL_ENROLLMENTS_KEY, JSON.stringify(all));
    return newEnr;
  },

  revokeEnrollment(enrollmentId: string): void {
    const all = this.getAllEnrollments();
    const found = all.find(e => e.id === enrollmentId);
    if (found) {
      found.status = 'revoked';
      localStorage.setItem(ZIVA_ALL_ENROLLMENTS_KEY, JSON.stringify(all));
    }
  },

  // ALL PROFILES (ADMIN STUDENTS MANAGEMENT)
  getAllProfiles(): ZivaUserProfile[] {
    try {
      const raw = localStorage.getItem(ZIVA_ALL_PROFILES_KEY);
      const defaults: ZivaUserProfile[] = [
        {
          id: 'usr-101',
          email: 'aarav@example.com',
          fullName: 'Aarav Patel',
          role: 'student',
          createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
        },
        {
          id: 'usr-102',
          email: 'riya@example.com',
          fullName: 'Riya Gupta',
          role: 'student',
          createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
        },
        {
          id: 'usr-admin-ziva',
          email: 'admin@zivalms.com',
          fullName: 'Meharr (Admin)',
          role: 'admin',
          createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
        }
      ];

      const list: ZivaUserProfile[] = raw ? JSON.parse(raw) : defaults;
      if (!raw) localStorage.setItem(ZIVA_ALL_PROFILES_KEY, JSON.stringify(defaults));
      return list;
    } catch {
      return [];
    }
  },

  updateProfileRole(userId: string, role: string): void {
    const profiles = this.getAllProfiles();
    const found = profiles.find(p => p.id === userId);
    if (found) {
      found.role = role;
      localStorage.setItem(ZIVA_ALL_PROFILES_KEY, JSON.stringify(profiles));
    }
  }
};

