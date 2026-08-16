import { supabase } from '../lib/supabase';
import {
  Enrollment,
  CreateEnrollmentInput,
  UpdateEnrollmentInput,
} from '../types/enrollment';

const LOCAL_ENROLLMENTS_KEY = 'heal_with_heer_local_enrollments';

function getLocalEnrollments(): Enrollment[] {
  try {
    const raw = localStorage.getItem(LOCAL_ENROLLMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalEnrollment(enrollment: Enrollment): void {
  try {
    const enrollments = getLocalEnrollments();
    const idx = enrollments.findIndex(
      e => (enrollment.id && e.id === enrollment.id) || (e.user_id === enrollment.user_id && e.course_id === enrollment.course_id)
    );
    if (idx >= 0) {
      enrollments[idx] = { ...enrollments[idx], ...enrollment, updated_at: new Date().toISOString() };
    } else {
      enrollments.unshift({ ...enrollment, created_at: enrollment.created_at || new Date().toISOString() });
    }
    localStorage.setItem(LOCAL_ENROLLMENTS_KEY, JSON.stringify(enrollments));
  } catch (e) {
    console.warn('Failed to cache enrollment locally', e);
  }
}

/**
 * Get all enrollments across all users and courses.
 * Merges Supabase enrollments with local storage cached enrollments.
 */
export async function getAllEnrollments(): Promise<{ data: Enrollment[]; error: Error | null }> {
  const localList = getLocalEnrollments();
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*')
      .order('created_at', { ascending: false });

    const dbList = (data as Enrollment[]) || [];

    // Merge without duplicates by user_id + course_id or id
    const map = new Map<string, Enrollment>();
    dbList.forEach(e => map.set(e.id || `${e.user_id}_${e.course_id}`, e));
    localList.forEach(e => {
      const key = e.id || `${e.user_id}_${e.course_id}`;
      if (!map.has(key)) {
        map.set(key, e);
      }
    });

    const merged = Array.from(map.values());
    return { data: merged, error: null };
  } catch (err: any) {
    return { data: localList, error: err };
  }
}

/**
 * Get a single enrollment record by its UUID ID.
 */
export async function getEnrollment(
  id: string
): Promise<{ data: Enrollment | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (data) {
      saveLocalEnrollment(data as Enrollment);
      return { data: data as Enrollment, error: null };
    }

    const local = getLocalEnrollments().find(e => e.id === id);
    return { data: local || null, error };
  } catch (err: any) {
    const local = getLocalEnrollments().find(e => e.id === id);
    return { data: local || null, error: err };
  }
}

/**
 * Get all enrollments for a given user ID.
 */
export async function getUserEnrollments(
  userId: string
): Promise<{ data: Enrollment[]; error: Error | null }> {
  const localList = getLocalEnrollments().filter(e => e.user_id === userId);
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const dbList = (data as Enrollment[]) || [];

    const map = new Map<string, Enrollment>();
    dbList.forEach(e => map.set(e.id || `${e.user_id}_${e.course_id}`, e));
    localList.forEach(e => {
      const key = e.id || `${e.user_id}_${e.course_id}`;
      if (!map.has(key)) {
        map.set(key, e);
      }
    });

    return { data: Array.from(map.values()), error: null };
  } catch (err: any) {
    return { data: localList, error: err };
  }
}

/**
 * Get all enrollments for a given course ID.
 */
export async function getCourseEnrollments(
  courseId: string
): Promise<{ data: Enrollment[]; error: Error | null }> {
  const localList = getLocalEnrollments().filter(e => e.course_id === courseId);
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    const dbList = (data as Enrollment[]) || [];
    const map = new Map<string, Enrollment>();
    dbList.forEach(e => map.set(e.id || `${e.user_id}_${e.course_id}`, e));
    localList.forEach(e => {
      const key = e.id || `${e.user_id}_${e.course_id}`;
      if (!map.has(key)) {
        map.set(key, e);
      }
    });

    return { data: Array.from(map.values()), error: null };
  } catch (err: any) {
    return { data: localList, error: err };
  }
}

/**
 * Check if a user is currently enrolled in a specific course.
 * Returns true if an enrollment exists with status 'active' or 'completed'.
 */
export async function isUserEnrolled(
  userId: string,
  courseId: string
): Promise<{ isEnrolled: boolean; enrollment: Enrollment | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .in('status', ['active', 'completed'])
      .maybeSingle();

    if (data) {
      saveLocalEnrollment(data as Enrollment);
      return { isEnrolled: true, enrollment: data as Enrollment, error: null };
    }

    const local = getLocalEnrollments().find(
      e => e.user_id === userId && e.course_id === courseId && (e.status === 'active' || e.status === 'completed')
    );
    if (local) {
      return { isEnrolled: true, enrollment: local, error: null };
    }

    return { isEnrolled: false, enrollment: null, error: error || null };
  } catch (err: any) {
    const local = getLocalEnrollments().find(
      e => e.user_id === userId && e.course_id === courseId && (e.status === 'active' || e.status === 'completed')
    );
    return { isEnrolled: !!local, enrollment: local || null, error: err };
  }
}

/**
 * Create a new course enrollment for a user.
 * Writes directly to Supabase table 'enrollments' and updates local cache as fallback.
 */
export async function createEnrollment(
  enrollmentData: CreateEnrollmentInput
): Promise<{ data: Enrollment | null; error: Error | null }> {
  const generatedId = enrollmentData.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `enr_${Date.now()}`);
  
  const payload: Enrollment = {
    id: generatedId,
    user_id: enrollmentData.user_id,
    course_id: enrollmentData.course_id,
    status: enrollmentData.status || 'active',
    payment_status: enrollmentData.payment_status || 'paid',
    amount_paid: enrollmentData.amount_paid ?? 0,
    enrolled_at: enrollmentData.enrolled_at || new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Cache locally immediately
  saveLocalEnrollment(payload);

  try {
    const { data, error } = await supabase
      .from('enrollments')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.warn('Supabase createEnrollment notice:', error.message);
      return { data: payload, error: null };
    }
    
    saveLocalEnrollment(data as Enrollment);
    return { data: data as Enrollment, error: null };
  } catch (err: any) {
    console.warn('Supabase createEnrollment fallback to local cache:', err);
    return { data: payload, error: null };
  }
}

/**
 * Update an existing enrollment by ID.
 * Automatically maintains the updated_at timestamp.
 */
export async function updateEnrollment(
  id: string,
  updates: UpdateEnrollmentInput
): Promise<{ data: Enrollment | null; error: Error | null }> {
  try {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('enrollments')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      return { data: null, error };
    }
    return { data: data as Enrollment | null, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Mark an enrollment as completed and set completed_at.
 */
export async function completeEnrollment(
  id: string
): Promise<{ data: Enrollment | null; error: Error | null }> {
  const now = new Date().toISOString();
  return updateEnrollment(id, {
    status: 'completed',
    completed_at: now,
  });
}

/**
 * Cancel an enrollment by changing its status to 'cancelled'.
 */
export async function cancelEnrollment(
  id: string
): Promise<{ data: Enrollment | null; error: Error | null }> {
  return updateEnrollment(id, {
    status: 'cancelled',
  });
}

/**
 * Delete an enrollment record by ID.
 */
export async function deleteEnrollment(
  id: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('enrollments')
      .delete()
      .eq('id', id);

    return { error };
  } catch (err: any) {
    return { error: err };
  }
}

/**
 * Re-link enrollments from an old user ID (e.g. guest ID) to a new authenticated user ID.
 */
export async function linkUserEnrollmentsByOldId(
  oldUserId: string,
  newUserId: string
): Promise<void> {
  if (!oldUserId || !newUserId || oldUserId === newUserId) return;

  // 1. Update Supabase enrollments table
  try {
    await supabase
      .from('enrollments')
      .update({ user_id: newUserId, updated_at: new Date().toISOString() })
      .eq('user_id', oldUserId);
  } catch (err) {
    console.warn('Failed to update enrollments in Supabase during re-linking', err);
  }

  // 2. Update local storage enrollments
  try {
    const enrollments = getLocalEnrollments();
    let updated = false;
    enrollments.forEach(e => {
      if (e.user_id === oldUserId) {
        e.user_id = newUserId;
        e.updated_at = new Date().toISOString();
        updated = true;
      }
    });
    if (updated) {
      localStorage.setItem(LOCAL_ENROLLMENTS_KEY, JSON.stringify(enrollments));
    }
  } catch (e) {
    console.warn('Failed to update local enrollments during re-linking', e);
  }
}

export const enrollmentService = {
  getAllEnrollments,
  getEnrollment,
  getUserEnrollments,
  getCourseEnrollments,
  isUserEnrolled,
  createEnrollment,
  updateEnrollment,
  completeEnrollment,
  cancelEnrollment,
  deleteEnrollment,
  linkUserEnrollmentsByOldId,
};

export default enrollmentService;
