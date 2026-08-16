import { IncomingMessage } from 'node:http';
import { createClient } from '@supabase/supabase-js';

function getZivaSupabase(token?: string) {
  const supabaseUrl =
    process.env.VITE_ZIVA_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.ZIVA_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_ZIVA_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    const options: any = { auth: { persistSession: false } };
    if (token) {
      options.global = { headers: { Authorization: `Bearer ${token}` } };
    }
    return createClient(supabaseUrl, supabaseKey, options);
  }
  return null;
}

export function validateZivaKeyFormat(key: string): { valid: boolean; error?: string } {
  if (!key || typeof key !== 'string') {
    return { valid: false, error: 'Object key is required.' };
  }

  // Anti-traversal & formatting checks
  if (
    key.includes('..') ||
    key.includes('\\') ||
    key.startsWith('/') ||
    key.includes('//') ||
    !/^[a-zA-Z0-9_\-\.\/]+$/.test(key)
  ) {
    return { valid: false, error: 'Invalid object key format or path traversal detected.' };
  }

  // Strict Ziva prefix enforcement
  if (!key.startsWith('ziva/')) {
    return { valid: false, error: 'Access denied: Object key must reside within the ziva/ namespace.' };
  }

  const allowedZivaSubPrefixes = [
    'ziva/images/',
    'ziva/videos/',
    'ziva/audio/',
    'ziva/documents/',
    'ziva/resources/',
  ];

  if (!allowedZivaSubPrefixes.some((prefix) => key.startsWith(prefix))) {
    return { valid: false, error: 'Access denied: Unsupported Ziva media category.' };
  }

  return { valid: true };
}

export async function verifyZivaAdminAuth(
  req: IncomingMessage
): Promise<{ authorized: boolean; user?: any; error?: string; status?: number }> {
  const authHeader = req.headers.authorization;
  const isDev = process.env.NODE_ENV === 'development';

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (isDev) {
      return { authorized: true, user: { id: 'ziva-dev-admin-user', role: 'admin' } };
    }
    return {
      authorized: false,
      status: 401,
      error: 'Authorization header missing or invalid. Format: Bearer <ziva_jwt_token>',
    };
  }

  const token = authHeader.split(' ')[1];
  const supabase = getZivaSupabase(token);

  if (!supabase) {
    if (isDev) {
      return { authorized: true, user: { id: 'ziva-dev-admin-user', role: 'admin' } };
    }
    return {
      authorized: false,
      status: 500,
      error: 'Supabase is not configured on the server to verify Ziva credentials.',
    };
  }

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      if (isDev) {
        return { authorized: true, user: { id: 'ziva-dev-admin-user', role: 'admin' } };
      }
      return {
        authorized: false,
        status: 401,
        error: 'Invalid or expired Ziva session token.',
      };
    }

    // Check user app_metadata or user_metadata for admin role
    const metadataRole = (user.app_metadata as any)?.role || (user.user_metadata as any)?.role;
    if (metadataRole === 'admin') {
      return { authorized: true, user: { ...user, role: 'admin' } };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || profile.role !== 'admin') {
      if (isDev) {
        return { authorized: true, user: { ...user, role: 'admin' } };
      }
      return {
        authorized: false,
        status: 403,
        error: 'Access denied. Only authenticated Ziva administrators can perform this action.',
      };
    }

    return { authorized: true, user: { ...user, role: 'admin' } };
  } catch (err: any) {
    if (isDev) {
      return { authorized: true, user: { id: 'ziva-dev-admin-user', role: 'admin' } };
    }
    return {
      authorized: false,
      status: 500,
      error: 'Failed to authenticate Ziva user: ' + (err.message || 'Unknown error'),
    };
  }
}

export async function verifyZivaUserAuth(
  req: IncomingMessage,
  courseId?: string
): Promise<{ authorized: boolean; user?: any; status?: number; error?: string }> {
  let token = '';
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  const isDev = process.env.NODE_ENV === 'development';

  if (!token) {
    if (isDev) {
      return { authorized: true, user: { id: 'ziva-dev-student-user', role: 'student' } };
    }
    return {
      authorized: false,
      status: 401,
      error: 'Ziva authentication token required.',
    };
  }

  const supabase = getZivaSupabase(token);
  if (!supabase) {
    if (isDev) {
      return { authorized: true, user: { id: 'ziva-dev-student-user', role: 'student' } };
    }
    return {
      authorized: false,
      status: 500,
      error: 'Supabase is not configured on the server.',
    };
  }

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      if (isDev) {
        return { authorized: true, user: { id: 'ziva-dev-student-user', role: 'student' } };
      }
      return {
        authorized: false,
        status: 401,
        error: 'Invalid or expired Ziva session token.',
      };
    }

    // Check user app_metadata or user_metadata for admin role
    const metadataRole = (user.app_metadata as any)?.role || (user.user_metadata as any)?.role;
    if (metadataRole === 'admin') {
      return { authorized: true, user: { ...user, role: 'admin' } };
    }

    // Admins bypass enrollment checks
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile && profile.role === 'admin') {
      return { authorized: true, user: { ...user, role: 'admin' } };
    }

    // If courseId is provided, check Ziva enrollment in ziva_enrollments
    if (courseId && courseId !== 'general') {
      const { data: enrollment } = await supabase
        .from('ziva_enrollments')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .in('status', ['active', 'completed'])
        .maybeSingle();

      if (enrollment) {
        return { authorized: true, user };
      }

      // Check course slug match
      const { data: courseRow } = await supabase
        .from('ziva_courses')
        .select('id')
        .or(`id.eq.${courseId},slug.eq.${courseId}`)
        .maybeSingle();

      if (courseRow) {
        const { data: slugEnrollment } = await supabase
          .from('ziva_enrollments')
          .select('id, status')
          .eq('user_id', user.id)
          .eq('course_id', courseRow.id)
          .in('status', ['active', 'completed'])
          .maybeSingle();

        if (slugEnrollment) {
          return { authorized: true, user };
        }
      }

      if (isDev) {
        return { authorized: true, user };
      }

      return {
        authorized: false,
        status: 403,
        error: 'Access denied. You are not enrolled in this Ziva course.',
      };
    }

    return { authorized: true, user };
  } catch (err: any) {
    if (isDev) {
      return { authorized: true, user: { id: 'ziva-dev-student-user', role: 'student' } };
    }
    return {
      authorized: false,
      status: 500,
      error: err.message || 'Ziva authorization check failed.',
    };
  }
}

export async function verifyZivaAccessForObjectKey(
  user: any,
  objectKey: string
): Promise<{ authorized: boolean; courseId?: string; status?: number; error?: string }> {
  const formatCheck = validateZivaKeyFormat(objectKey);
  if (!formatCheck.valid) {
    return { authorized: false, status: 400, error: formatCheck.error };
  }

  // Admins have access to all Ziva objects
  if (user?.role === 'admin') {
    return { authorized: true };
  }

  // Check if object is public course thumbnail, banner, or instructor avatar
  if (
    objectKey.includes('/instructors/') ||
    objectKey.endsWith('thumbnail.jpg') ||
    objectKey.endsWith('thumbnail.png') ||
    objectKey.endsWith('banner.jpg') ||
    objectKey.endsWith('banner.png')
  ) {
    return { authorized: true };
  }

  // Extract courseId from object key: ziva/images/courses/{courseId}/... or ziva/videos/.../courses/{courseId}/...
  const parts = objectKey.split('/');
  const coursesIdx = parts.indexOf('courses');
  const courseId = coursesIdx !== -1 && parts.length > coursesIdx + 1 ? parts[coursesIdx + 1] : undefined;

  if (!courseId) {
    return { authorized: true };
  }

  const isDev = process.env.NODE_ENV === 'development';
  const supabase = getZivaSupabase();

  if (supabase && user?.id) {
    try {
      const { data: enrollment } = await supabase
        .from('ziva_enrollments')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .in('status', ['active', 'completed'])
        .maybeSingle();

      if (enrollment) {
        return { authorized: true, courseId };
      }
    } catch {
      // Fall through to dev check
    }
  }

  if (isDev) {
    return { authorized: true, courseId };
  }

  return {
    authorized: false,
    status: 403,
    error: 'Access denied. You are not enrolled in this Ziva course.',
  };
}
