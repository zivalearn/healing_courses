import crypto from 'node:crypto';

// Distinct HMAC Secrets for Ziva LMS to ensure cryptographic isolation from HWH
const ZIVA_MEDIA_SECRET =
  process.env.ZIVA_MEDIA_SECRET ||
  (process.env.R2_SECRET_ACCESS_KEY ? `${process.env.R2_SECRET_ACCESS_KEY}:ziva:media` : 'ziva-lms-media-hmac-secret-v1');

const ZIVA_HLS_SECRET =
  process.env.ZIVA_HLS_SECRET ||
  (process.env.HLS_SIGNING_SECRET ? `${process.env.HLS_SIGNING_SECRET}:ziva:hls` : 'ziva-lms-hls-secret-2026');

/**
 * Generate a short-lived HMAC media access token for a Ziva object key.
 * Strictly requires the object key to start with 'ziva/'.
 */
export function createZivaMediaAccessToken(objectKey: string, expiresInMs: number = 15 * 60 * 1000): string {
  if (!objectKey || !objectKey.startsWith('ziva/')) {
    throw new Error('Ziva media tokens can only be generated for objects within the ziva/ namespace.');
  }

  const exp = Date.now() + expiresInMs;
  const payload = `${objectKey}:${exp}`;
  const hmac = crypto.createHmac('sha256', ZIVA_MEDIA_SECRET).update(payload).digest('hex');
  return `${exp}.${hmac}`;
}

/**
 * Verify a Ziva media access token.
 * Rejects any non-Ziva object key, expired token, or signature mismatch.
 */
export function verifyZivaMediaAccessToken(objectKey: string, token: string): boolean {
  if (!objectKey || !objectKey.startsWith('ziva/')) {
    return false;
  }

  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return false;
  }

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [expStr, hmac] = parts;
  const exp = parseInt(expStr, 10);
  if (isNaN(exp) || Date.now() > exp) return false;

  const payload = `${objectKey}:${exp}`;
  const expectedHmac = crypto.createHmac('sha256', ZIVA_MEDIA_SECRET).update(payload).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(expectedHmac, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Generate a short-lived HMAC token for Ziva HLS video playback.
 */
export function generateZivaHlsToken(courseId: string, lessonId: string, expiresInMinutes = 240): string {
  const exp = Math.floor(Date.now() / 1000) + expiresInMinutes * 60;
  const payload = `ziva:${courseId}:${lessonId}:${exp}`;
  const hmac = crypto.createHmac('sha256', ZIVA_HLS_SECRET).update(payload).digest('hex');
  return `${payload}:${hmac}`;
}

/**
 * Verify a Ziva HLS video playback token.
 */
export function verifyZivaHlsToken(token: string, courseId?: string, lessonId?: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split(':');
  if (parts.length !== 5) return false;

  const [prefix, tokenCourseId, tokenLessonId, expStr, sig] = parts;
  if (prefix !== 'ziva') return false;

  const exp = parseInt(expStr, 10);
  if (isNaN(exp) || Math.floor(Date.now() / 1000) > exp) return false;
  if (courseId && tokenCourseId !== courseId) return false;
  if (lessonId && tokenLessonId !== lessonId) return false;

  const expectedPayload = `ziva:${tokenCourseId}:${tokenLessonId}:${expStr}`;
  const expectedHmac = crypto.createHmac('sha256', ZIVA_HLS_SECRET).update(expectedPayload).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expectedHmac, 'hex'));
  } catch {
    return false;
  }
}
