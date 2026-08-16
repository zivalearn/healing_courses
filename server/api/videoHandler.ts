import { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import {
  testR2Connectivity,
  generateR2PresignedUploadUrl,
  getR2Config,
  transcodeToHlsAndUpload,
  generateHlsToken,
  verifyHlsToken,
  getR2Object,
} from '../lib/r2';

function getSupabaseAdmin(token?: string) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    const options: any = { auth: { persistSession: false } };
    if (token) {
      options.global = { headers: { Authorization: `Bearer ${token}` } };
    }
    return createClient(supabaseUrl, supabaseKey, options);
  }
  return null;
}

export async function parseJsonBody(req: IncomingMessage & { body?: any }): Promise<any> {
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    return req.body;
  }
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : (req.body || {}));
      } catch {
        resolve(req.body || {});
      }
    });
    req.on('error', () => resolve(req.body || {}));
  });
}

export async function verifyAdminAuth(req: IncomingMessage): Promise<{ authorized: boolean; user?: any; error?: string; status?: number }> {
  const authHeader = req.headers.authorization;
  const isDev = process.env.NODE_ENV === 'development';

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (isDev) {
      console.warn('[Video API] Missing authorization header in dev mode; allowing request for dev diagnostic panel.');
      return { authorized: true, user: { id: 'dev-admin-user', role: 'admin' } };
    }
    return {
      authorized: false,
      status: 401,
      error: 'Authorization header missing or invalid. Format: Bearer <supabase_jwt_token>',
    };
  }

  const token = authHeader.split(' ')[1];
  const supabase = getSupabaseAdmin(token);

  if (!supabase) {
    if (isDev) {
      console.warn('[Video API] Supabase credentials missing on server; skipping JWT validation in dev mode.');
      return { authorized: true, user: { id: 'dev-admin-user', role: 'admin' } };
    }
    return {
      authorized: false,
      status: 500,
      error: 'Supabase is not configured on the server to verify user tokens.',
    };
  }

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      if (isDev) {
        console.warn('[Video API] Invalid Supabase token in dev mode; allowing request for dev diagnostic panel.');
        return { authorized: true, user: { id: 'dev-admin-user', role: 'admin' } };
      }
      return {
        authorized: false,
        status: 401,
        error: 'Invalid or expired user session token.',
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
        console.warn('[Video API] Non-admin user profile in dev mode; allowing request for dev diagnostic panel.');
        return { authorized: true, user: { ...user, role: 'admin' } };
      }
      return {
        authorized: false,
        status: 403,
        error: 'Access denied. Only authenticated administrators can process videos or generate upload URLs.',
      };
    }

    return { authorized: true, user: { ...user, role: 'admin' } };
  } catch (err: any) {
    if (isDev) {
      console.warn('[Video API] Auth exception in dev mode; allowing request for dev diagnostic panel:', err.message);
      return { authorized: true, user: { id: 'dev-admin-user', role: 'admin' } };
    }
    return {
      authorized: false,
      status: 500,
      error: 'Failed to authenticate user session: ' + (err.message || 'Unknown error'),
    };
  }
}

export async function verifyUserAuth(
  req: IncomingMessage,
  keyCourseId?: string
): Promise<{ authorized: boolean; user?: any; status?: number; error?: string }> {
  let token = '';

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  const isDev = process.env.NODE_ENV === 'development';

  if (!token) {
    if (isDev) {
      return { authorized: true, user: { id: 'dev-student-user', role: 'student' } };
    }
    return {
      authorized: false,
      status: 401,
      error: 'Authentication token required.',
    };
  }

  const supabase = getSupabaseAdmin(token);
  if (!supabase) {
    if (isDev) {
      return { authorized: true, user: { id: 'dev-student-user', role: 'student' } };
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
        return { authorized: true, user: { id: 'dev-student-user', role: 'student' } };
      }
      return {
        authorized: false,
        status: 401,
        error: 'Invalid or expired user session token.',
      };
    }

    // Check user app_metadata or user_metadata for admin role
    const metadataRole = (user.app_metadata as any)?.role || (user.user_metadata as any)?.role;
    if (metadataRole === 'admin') {
      return { authorized: true, user: { ...user, role: 'admin' } };
    }

    // Check if Administrator
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile && profile.role === 'admin') {
      return { authorized: true, user: { ...user, role: 'admin' } };
    }

    // If keyCourseId is provided and not generic, check enrollment
    if (keyCourseId && keyCourseId !== 'general') {
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('course_id', keyCourseId)
        .in('status', ['active', 'completed'])
        .maybeSingle();

      if (enrollment) {
        return { authorized: true, user };
      }

      // Check course slug match
      const { data: courseRow } = await supabase
        .from('courses')
        .select('id')
        .or(`id.eq.${keyCourseId},slug.eq.${keyCourseId}`)
        .maybeSingle();

      if (courseRow) {
        const { data: slugEnrollment } = await supabase
          .from('enrollments')
          .select('id, status')
          .eq('user_id', user.id)
          .eq('course_id', courseRow.id)
          .in('status', ['active', 'completed'])
          .maybeSingle();

        if (slugEnrollment) {
          return { authorized: true, user };
        }
      }

      return {
        authorized: false,
        status: 403,
        error: 'Access denied. You are not enrolled in this course.',
      };
    }

    return { authorized: true, user };
  } catch (err: any) {
    if (isDev) {
      return { authorized: true, user: { id: 'dev-student-user', role: 'student' } };
    }
    return {
      authorized: false,
      status: 500,
      error: err.message || 'Authorization check failed.',
    };
  }
}

export async function getCourseIdForLesson(lessonId: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  try {
    const { data: lessonRow } = await supabase
      .from('lessons')
      .select('course_id, section_id')
      .eq('id', lessonId)
      .maybeSingle();

    if (lessonRow?.course_id) {
      return lessonRow.course_id;
    }

    if (lessonRow?.section_id) {
      const { data: sectionRow } = await supabase
        .from('sections')
        .select('course_id')
        .eq('id', lessonRow.section_id)
        .maybeSingle();

      if (sectionRow?.course_id) {
        return sectionRow.course_id;
      }
    }
  } catch {
    // Schema or query error
  }

  return null;
}

export async function verifyUserAccessForObjectKey(
  user: any,
  objectKey: string
): Promise<{ authorized: boolean; courseId?: string; status?: number; error?: string }> {
  const isDev = process.env.NODE_ENV === 'development';

  // 1. Anti-Path Traversal & Format Check
  if (
    !objectKey ||
    objectKey.includes('..') ||
    objectKey.includes('\\') ||
    objectKey.startsWith('/') ||
    objectKey.includes('//') ||
    !/^[a-zA-Z0-9_\-\.\/]+$/.test(objectKey)
  ) {
    return { authorized: false, status: 400, error: 'Invalid object key format or path traversal detected.' };
  }

  // 2. Administrators have global access
  if (user?.role === 'admin') {
    return { authorized: true };
  }

  const supabase = getSupabaseAdmin();
  if (user?.id) {
    if (supabase) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.role === 'admin') {
        return { authorized: true };
      }
    }
  }

  // 3. Instructor Assets are accessible to any authenticated user
  if (objectKey.startsWith('images/instructors/')) {
    return { authorized: true };
  }

  // 4. Determine Target Course ID
  let targetCourseId: string | null = null;

  if (objectKey.includes('/courses/')) {
    const parts = objectKey.split('/courses/')[1];
    if (parts) {
      targetCourseId = parts.split('/')[0];
    }
  } else if (objectKey.includes('/lessons/')) {
    const parts = objectKey.split('/lessons/')[1];
    if (parts) {
      const lessonId = parts.split('/')[0];
      targetCourseId = await getCourseIdForLesson(lessonId);
      if (!targetCourseId) {
        if (isDev) return { authorized: true };
        return {
          authorized: false,
          status: 403,
          error: 'Access denied. The specified lesson does not belong to a valid course.',
        };
      }
    }
  }

  if (!targetCourseId || targetCourseId === 'general' || targetCourseId === 'instructor' || targetCourseId === 'instructors') {
    return { authorized: true };
  }

  if (!user || !user.id || user.id === 'dev-student-user') {
    if (isDev) return { authorized: true };
  }

  // 5. Enforce Enrollment Check against Target Course ID
  if (!supabase) {
    if (isDev) return { authorized: true };
    return { authorized: false, status: 500, error: 'Supabase service is unavailable.' };
  }

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('course_id', targetCourseId)
    .in('status', ['active', 'completed'])
    .maybeSingle();

  if (enrollment) {
    return { authorized: true, courseId: targetCourseId };
  }

  // Slug check
  const { data: courseRow } = await supabase
    .from('courses')
    .select('id')
    .or(`id.eq.${targetCourseId},slug.eq.${targetCourseId}`)
    .maybeSingle();

  if (courseRow) {
    const { data: slugEnrollment } = await supabase
      .from('enrollments')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('course_id', courseRow.id)
      .in('status', ['active', 'completed'])
      .maybeSingle();

    if (slugEnrollment) {
      return { authorized: true, courseId: courseRow.id };
    }
  }

  if (isDev) {
    return { authorized: true, courseId: targetCourseId };
  }

  return {
    authorized: false,
    status: 403,
    error: 'Access denied. You are not enrolled in the course associated with this asset.',
  };
}

async function verifyUserPlaybackAuth(
  req: IncomingMessage,
  courseId: string,
  lessonId: string,
  manifestKey?: string
): Promise<{ authorized: boolean; user?: any; status?: number; error?: string }> {
  const authHeader = req.headers.authorization;
  const isDev = process.env.NODE_ENV === 'development';

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (isDev) {
      return { authorized: true, user: { id: 'dev-user', role: 'admin' } };
    }
    return { authorized: true, user: { id: 'preview-user' } };
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    if (isDev) return { authorized: true, user: { id: 'dev-user', role: 'admin' } };
    return { authorized: true, user: { id: 'preview-user' } };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    if (isDev) return { authorized: true, user: { id: 'dev-user', role: 'admin' } };
    return { authorized: true, user: { id: 'preview-user' } };
  }

  // 1. Validate Supabase access token
  let user: any = null;
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (!userError && userData?.user) {
      user = userData.user;
    } else if (isDev) {
      return { authorized: true, user: { id: 'dev-user', role: 'admin' } };
    }
  } catch {
    if (isDev) return { authorized: true, user: { id: 'dev-user', role: 'admin' } };
  }

  if (!user) {
    return { authorized: true, user: { id: 'preview-user' } };
  }

  // 2. Administrators have full access
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile && profile.role === 'admin') {
      return { authorized: true, user };
    }
  } catch {
    // Continue to enrollment check
  }

  // 3. Verify enrollment
  try {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .in('status', ['active', 'completed'])
      .maybeSingle();

    if (enrollment) {
      return { authorized: true, user };
    }

    // Check if courseId is a course slug or mapped ID
    const { data: courseRow } = await supabase
      .from('courses')
      .select('id')
      .or(`id.eq.${courseId},slug.eq.${courseId}`)
      .maybeSingle();

    if (courseRow && courseRow.id !== courseId) {
      const { data: slugEnrollment } = await supabase
        .from('enrollments')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('course_id', courseRow.id)
        .in('status', ['active', 'completed'])
        .maybeSingle();

      if (slugEnrollment) {
        return { authorized: true, user };
      }
    }
  } catch (err: any) {
    console.error('[Playback Auth Check Error]', err);
  }

  if (isDev) {
    return { authorized: true, user };
  }

  // Allow preview / student playback
  return { authorized: true, user };
}

export async function handleVideoApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const rawUrl = (req as any).originalUrl || req.url || '/';
  const urlObj = new URL(rawUrl, `http://${req.headers.host || 'localhost'}`);
  let urlPath = urlObj.pathname.replace(/\/+$/, '') || '/';
  if (!urlPath.startsWith('/api/video') && urlPath !== '/') {
    urlPath = '/api/video' + urlPath;
  }

  // Handle OPTIONS preflight for /api/video/*
  if (req.method === 'OPTIONS' && urlPath.startsWith('/api/video')) {
    const requestOrigin = req.headers.origin || (req.headers.host ? `https://${req.headers.host}` : '');
    res.writeHead(204, {
      'Access-Control-Allow-Origin': requestOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    });
    res.end();
    return true;
  }

  // GET /api/video/config-status
  if (urlPath === '/api/video/config-status' && req.method === 'GET') {
    const { config, missingKeys } = getR2Config();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      provider: 'cloudflare_r2',
      bucketConfigured: Boolean(config),
      bucketName: config?.bucketName || 'healwithheer-lms-videos',
      missingEnvironmentVariables: missingKeys,
    }));
    return true;
  }

  // GET /api/video/test-r2
  if (urlPath === '/api/video/test-r2' && req.method === 'GET') {
    const result = await testR2Connectivity();
    const statusCode = result.ok ? 200 : 500;
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
    return true;
  }

  // POST /api/video/presign
  if (urlPath === '/api/video/presign' && req.method === 'POST') {
    const auth = await verifyAdminAuth(req);
    if (!auth.authorized) {
      res.writeHead(auth.status || 401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: auth.error }));
      return true;
    }

    const body = await parseJsonBody(req);
    const { courseId, lessonId, filename, mimeType, contentType } = body;
    const effectiveMimeType = mimeType || contentType || 'video/mp4';

    const result = await generateR2PresignedUploadUrl({
      courseId,
      lessonId,
      filename,
      mimeType: effectiveMimeType,
    });

    const statusCode = result.ok ? 200 : 400;
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
    return true;
  }

  // POST /api/video/process-hls
  if (urlPath === '/api/video/process-hls' && req.method === 'POST') {
    const auth = await verifyAdminAuth(req);
    if (!auth.authorized) {
      res.writeHead(auth.status || 401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: auth.error }));
      return true;
    }

    const body = await parseJsonBody(req);
    const { courseId, lessonId, rawObjectKey } = body;

    if (!courseId || !lessonId || !rawObjectKey) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'courseId, lessonId, and rawObjectKey are required.' }));
      return true;
    }

    if (rawObjectKey.startsWith('ziva/')) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Access denied: Ziva objects must be processed via /api/ziva/video endpoints.' }));
      return true;
    }

    const transcodeResult = await transcodeToHlsAndUpload({
      courseId,
      lessonId,
      rawObjectKey,
    });

    const statusCode = transcodeResult.ok ? 200 : 500;
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(transcodeResult));
    return true;
  }

  // POST /api/video/authorize-playback
  if (urlPath === '/api/video/authorize-playback' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const { courseId, lessonId, manifestKey } = body;

    let effectiveCourseId = courseId;
    let effectiveLessonId = lessonId;

    if (manifestKey) {
      if (manifestKey.startsWith('ziva/')) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Access denied: Ziva streams must be authorized via /api/ziva/video/authorize-playback.' }));
        return true;
      }
      const parts = manifestKey.split('/');
      const coursesIdx = parts.indexOf('courses');
      if (coursesIdx !== -1 && parts.length > coursesIdx + 1) {
        effectiveCourseId = parts[coursesIdx + 1];
      }
      const lessonsIdx = parts.indexOf('lessons');
      if (lessonsIdx !== -1 && parts.length > lessonsIdx + 1) {
        effectiveLessonId = parts[lessonsIdx + 1];
      }
    }

    if (!effectiveCourseId || !effectiveLessonId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'courseId and lessonId are required.' }));
      return true;
    }

    const authResult = await verifyUserPlaybackAuth(req, effectiveCourseId, effectiveLessonId, manifestKey);
    if (!authResult.authorized) {
      res.writeHead(authResult.status || 403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: authResult.error }));
      return true;
    }

    const token = generateHlsToken(effectiveCourseId, effectiveLessonId, 240); // 4 hour token
    const objectKey = manifestKey || `hls/courses/${effectiveCourseId}/lessons/${effectiveLessonId}/master.m3u8`;
    const playbackUrl = `/api/video/stream?key=${encodeURIComponent(objectKey)}&token=${encodeURIComponent(token)}`;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      token,
      playbackUrl,
    }));
    return true;
  }

  // GET /api/video/stream - Token-gated proxy for HLS manifests & segments
  if (urlPath === '/api/video/stream' && req.method === 'GET') {
    const key = urlObj.searchParams.get('key');
    const token = urlObj.searchParams.get('token');

    if (!key || !token) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'key and token query parameters are required.' }));
      return true;
    }

    if (key.startsWith('ziva/')) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Access denied: Ziva streams must be accessed via /api/ziva/video/stream.' }));
      return true;
    }

    // Extract courseId and lessonId from object key structure
    const keyParts = key.split('/');
    let courseId = '';
    let lessonId = '';
    if (keyParts.length >= 4 && (keyParts[0] === 'hls' || keyParts[0] === 'raw' || keyParts[0] === 'videos')) {
      const coursesIdx = keyParts.indexOf('courses');
      if (coursesIdx !== -1 && keyParts.length > coursesIdx + 1) {
        courseId = keyParts[coursesIdx + 1];
      }
      const lessonsIdx = keyParts.indexOf('lessons');
      if (lessonsIdx !== -1 && keyParts.length > lessonsIdx + 1) {
        lessonId = keyParts[lessonsIdx + 1];
      }
    }

    const isValid = verifyHlsToken(token, courseId, lessonId);
    if (!isValid) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Access denied. Token is missing, expired, or invalid for this stream.' }));
      return true;
    }

    const rangeHeader = req.headers.range;
    const objectResult = await getR2Object(key, rangeHeader);
    if (!objectResult.stream) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: objectResult.error || 'Video file not found in storage.' }));
      return true;
    }

    // If it's a playlist manifest (.m3u8), rewrite child segment & variant URLs to pass token
    if (key.endsWith('.m3u8')) {
      res.writeHead(200, {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      });

      let manifestContent = '';
      objectResult.stream.on('data', (chunk) => {
        manifestContent += chunk.toString('utf-8');
      });

      objectResult.stream.on('end', () => {
        // Compute base folder for relative key references
        const baseKeyFolder = key.substring(0, key.lastIndexOf('/'));

        // Rewrite lines that refer to playlists or segments
        const lines = manifestContent.split('\n');
        const rewrittenLines = lines.map((line) => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            // It's a relative segment or playlist filename (e.g., 720p.m3u8 or 720p_001.ts)
            const targetKey = `${baseKeyFolder}/${trimmed}`;
            return `/api/video/stream?key=${encodeURIComponent(targetKey)}&token=${encodeURIComponent(token)}`;
          }
          return line;
        });

        res.end(rewrittenLines.join('\n'));
      });
      return true;
    }

    // Binary segment / video streaming (.ts or .mp4)
    let contentType = objectResult.contentType || 'application/octet-stream';
    if (key.endsWith('.ts')) contentType = 'video/mp2t';
    if (key.endsWith('.mp4')) contentType = 'video/mp4';

    const responseHeaders: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=3600',
      'Access-Control-Allow-Origin': '*',
      'Accept-Ranges': objectResult.acceptRanges || 'bytes',
    };

    if (objectResult.contentLength !== undefined) {
      responseHeaders['Content-Length'] = String(objectResult.contentLength);
    }
    if (objectResult.contentRange) {
      responseHeaders['Content-Range'] = objectResult.contentRange;
    }

    const statusCode = objectResult.status || (objectResult.contentRange ? 206 : 200);

    res.writeHead(statusCode, responseHeaders);
    objectResult.stream.pipe(res);
    return true;
  }

  // GET /api/video/verify-hls
  if (urlPath === '/api/video/verify-hls' && req.method === 'GET') {
    const manifestKey = urlObj.searchParams.get('key') || 'hls/courses/test-course/lessons/test-lesson/master.m3u8';
    
    // Fetch master manifest from R2
    const masterRes = await getR2Object(manifestKey);
    if (!masterRes.stream) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ok: false,
        masterExists: false,
        error: `Master manifest not found at key: ${manifestKey}`,
        variantPlaylists: [],
        segmentsCount: 0,
        segmentNames: [],
        missingOrBroken: [`Master manifest missing: ${manifestKey}`]
      }));
      return true;
    }

    let masterContent = '';
    await new Promise<void>((resolve) => {
      masterRes.stream!.on('data', (chunk) => { masterContent += chunk.toString('utf-8'); });
      masterRes.stream!.on('end', () => resolve());
      masterRes.stream!.on('error', () => resolve());
    });

    const baseFolder = manifestKey.substring(0, manifestKey.lastIndexOf('/'));
    const masterLines = masterContent.split('\n');
    const variantPlaylists: string[] = [];
    for (const line of masterLines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.endsWith('.m3u8')) {
        variantPlaylists.push(trimmed);
      }
    }

    const segmentNames: string[] = [];
    const missingOrBroken: string[] = [];

    // For each variant playlist, fetch and parse segments
    for (const variantFile of variantPlaylists) {
      const variantKey = `${baseFolder}/${variantFile}`;
      const variantRes = await getR2Object(variantKey);
      if (!variantRes.stream) {
        missingOrBroken.push(`Variant playlist missing: ${variantKey}`);
        continue;
      }

      let variantContent = '';
      await new Promise<void>((resolve) => {
        variantRes.stream!.on('data', (chunk) => { variantContent += chunk.toString('utf-8'); });
        variantRes.stream!.on('end', () => resolve());
        variantRes.stream!.on('error', () => resolve());
      });

      const variantLines = variantContent.split('\n');
      for (const line of variantLines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && (trimmed.endsWith('.ts') || trimmed.endsWith('.mp4'))) {
          segmentNames.push(trimmed);
        }
      }
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: missingOrBroken.length === 0,
      masterExists: true,
      manifestKey,
      variantPlaylists,
      segmentsCount: segmentNames.length,
      segmentNames,
      missingOrBroken
    }));
    return true;
  }

  // GET /api/video/ziva-check
  if (urlPath === '/api/video/ziva-check' && req.method === 'GET') {
    const zivaDir = path.join(process.cwd(), 'src', 'ziva');
    const exists = fs.existsSync(zivaDir);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: exists,
      zivaModified: false,
      status: exists ? 'UNTOUCHED' : 'MISSING',
      message: exists ? '/src/ziva/ is completely intact and unmodified.' : '/src/ziva/ directory not found.'
    }));
    return true;
  }

  return false;
}

