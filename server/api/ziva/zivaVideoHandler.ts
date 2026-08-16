import { IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  createR2Client,
  getR2Config,
  getR2Object,
  ALLOWED_VIDEO_MIME_TYPES,
} from '../../lib/r2';
import { parseJsonBody } from '../videoHandler';
import {
  validateZivaKeyFormat,
  verifyZivaAdminAuth,
  verifyZivaUserAuth,
} from './zivaAuth';
import { generateZivaHlsToken, verifyZivaHlsToken } from './zivaTokens';
import { transcodeZivaVideoToHls } from './zivaTranscoder';

export async function handleZivaVideoApiRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const rawUrl = (req as any).originalUrl || req.url || '/';
  const urlObj = new URL(rawUrl, `http://${req.headers.host || 'localhost'}`);
  let urlPath = urlObj.pathname.replace(/\/+$/, '') || '/';
  if (!urlPath.startsWith('/api/ziva/video') && urlPath !== '/') {
    urlPath = '/api/ziva/video' + urlPath;
  }

  // Handle CORS OPTIONS preflight
  if (req.method === 'OPTIONS' && urlPath.startsWith('/api/ziva/video')) {
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

  // POST /api/ziva/video/presign-upload - Generate direct R2 presigned upload URL for raw video
  if (urlPath === '/api/ziva/video/presign-upload' && req.method === 'POST') {
    const auth = await verifyZivaAdminAuth(req);
    if (!auth.authorized) {
      res.writeHead(auth.status || 401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: auth.error }));
      return true;
    }

    const body = await parseJsonBody(req);
    const { courseId, lessonId, filename, mimeType, contentType } = body;
    const effectiveMimeType = mimeType || contentType || 'video/mp4';

    if (!courseId || !lessonId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'courseId and lessonId are required parameters.' }));
      return true;
    }

    if (!effectiveMimeType || !ALLOWED_VIDEO_MIME_TYPES.includes(effectiveMimeType.toLowerCase())) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: false,
          error: `Unsupported video MIME type: '${effectiveMimeType}'. Allowed: ${ALLOWED_VIDEO_MIME_TYPES.join(', ')}`,
        })
      );
      return true;
    }

    const { config, missingKeys } = getR2Config();
    if (!config) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: false,
          error: `R2 is not configured on the server: ${missingKeys.join(', ')}`,
        })
      );
      return true;
    }

    const sanitizedCourseId = courseId.replace(/[^a-zA-Z0-9_-]/g, '');
    const sanitizedLessonId = lessonId.replace(/[^a-zA-Z0-9_-]/g, '');
    const fileUuid = randomUUID();
    const objectKey = `ziva/videos/raw/courses/${sanitizedCourseId}/lessons/${sanitizedLessonId}/${fileUuid}.mp4`;

    try {
      const s3Client = createR2Client(config);
      const command = new PutObjectCommand({
        Bucket: config.bucketName,
        Key: objectKey,
        ContentType: effectiveMimeType,
      });

      const expiresInSeconds = 900; // 15 minutes
      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: true,
          uploadUrl,
          objectKey,
          expiresInSeconds,
        })
      );
      return true;
    } catch (err: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: false,
          error: err.message || 'Failed to generate presigned video upload URL for Cloudflare R2.',
        })
      );
      return true;
    }
  }

  // POST /api/ziva/video/transcode-hls - Transcode raw Ziva video to Adaptive HLS
  if (urlPath === '/api/ziva/video/transcode-hls' && req.method === 'POST') {
    const auth = await verifyZivaAdminAuth(req);
    if (!auth.authorized) {
      res.writeHead(auth.status || 401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: auth.error }));
      return true;
    }

    const body = await parseJsonBody(req);
    const { courseId, lessonId, rawObjectKey } = body;

    if (!courseId || !lessonId || !rawObjectKey) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: false,
          error: 'courseId, lessonId, and rawObjectKey are required.',
        })
      );
      return true;
    }

    // Strict Ziva prefix enforcement
    if (!rawObjectKey.startsWith('ziva/')) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: false,
          error: 'Access denied: rawObjectKey must reside within the ziva/ namespace.',
        })
      );
      return true;
    }

    const transcodeResult = await transcodeZivaVideoToHls({
      courseId,
      lessonId,
      rawObjectKey,
    });

    const statusCode = transcodeResult.ok ? 200 : 500;
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(transcodeResult));
    return true;
  }

  // POST /api/ziva/video/authorize-playback - Issue Ziva HLS playback token
  if (urlPath === '/api/ziva/video/authorize-playback' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const { courseId, lessonId, manifestKey } = body;

    let effectiveCourseId = courseId;
    let effectiveLessonId = lessonId;

    if (manifestKey) {
      if (!manifestKey.startsWith('ziva/')) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            ok: false,
            error: 'Access denied: manifestKey must reside within the ziva/ namespace.',
          })
        );
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

    const authResult = await verifyZivaUserAuth(req, effectiveCourseId);
    if (!authResult.authorized) {
      res.writeHead(authResult.status || 403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: authResult.error }));
      return true;
    }

    const token = generateZivaHlsToken(effectiveCourseId, effectiveLessonId, 240); // 4 hours
    const objectKey =
      manifestKey || `ziva/videos/hls/courses/${effectiveCourseId}/lessons/${effectiveLessonId}/master.m3u8`;
    const playbackUrl = `/api/ziva/video/stream?key=${encodeURIComponent(objectKey)}&token=${encodeURIComponent(token)}`;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        ok: true,
        token,
        playbackUrl,
      })
    );
    return true;
  }

  // GET /api/ziva/video/stream - Stream Ziva HLS manifests and segments
  if (urlPath === '/api/ziva/video/stream' && req.method === 'GET') {
    const key = urlObj.searchParams.get('key');
    const token = urlObj.searchParams.get('token');

    if (!key || !token) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'key and token query parameters are required.' }));
      return true;
    }

    // Strict Ziva prefix enforcement
    if (!key.startsWith('ziva/')) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: false,
          error: 'Access denied: Stream requested outside of ziva/ namespace.',
        })
      );
      return true;
    }

    // Extract courseId and lessonId
    const keyParts = key.split('/');
    let courseId = '';
    let lessonId = '';
    const coursesIdx = keyParts.indexOf('courses');
    if (coursesIdx !== -1 && keyParts.length > coursesIdx + 1) {
      courseId = keyParts[coursesIdx + 1];
    }
    const lessonsIdx = keyParts.indexOf('lessons');
    if (lessonsIdx !== -1 && keyParts.length > lessonsIdx + 1) {
      lessonId = keyParts[lessonsIdx + 1];
    }

    const isValid = verifyZivaHlsToken(token, courseId, lessonId);
    if (!isValid) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: false,
          error: 'Access denied: Token is missing, expired, or invalid for this Ziva stream.',
        })
      );
      return true;
    }

    const rangeHeader = req.headers.range;
    const objectResult = await getR2Object(key, rangeHeader);
    if (!objectResult.stream) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: false,
          error: objectResult.error || 'Ziva video file not found in storage.',
        })
      );
      return true;
    }

    // Manifest rewrite
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
        const baseKeyFolder = key.substring(0, key.lastIndexOf('/'));
        const lines = manifestContent.split('\n');
        const rewrittenLines = lines.map((line) => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const targetKey = `${baseKeyFolder}/${trimmed}`;
            return `/api/ziva/video/stream?key=${encodeURIComponent(targetKey)}&token=${encodeURIComponent(token)}`;
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

  return false;
}
