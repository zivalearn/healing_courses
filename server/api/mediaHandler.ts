import { IncomingMessage, ServerResponse } from 'node:http';
import crypto from 'node:crypto';
import path from 'node:path';
import { generateGenericR2PresignedUrl, getR2Object, R2AssetType } from '../lib/r2';
import { parseJsonBody, verifyAdminAuth, verifyUserAccessForObjectKey, verifyUserAuth } from './videoHandler';

const HMAC_SECRET =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.R2_SECRET_ACCESS_KEY ||
  'healwithheer-media-access-hmac-secret-v1';

export function createMediaAccessToken(objectKey: string, expiresInMs: number = 15 * 60 * 1000): string {
  const exp = Date.now() + expiresInMs;
  const payload = `${objectKey}:${exp}`;
  const hmac = crypto.createHmac('sha256', HMAC_SECRET).update(payload).digest('hex');
  return `${exp}.${hmac}`;
}

export function verifyMediaAccessToken(objectKey: string, token: string): boolean {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [expStr, hmac] = parts;
  const exp = parseInt(expStr, 10);
  if (isNaN(exp) || Date.now() > exp) return false;

  const payload = `${objectKey}:${exp}`;
  const expectedHmac = crypto.createHmac('sha256', HMAC_SECRET).update(payload).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(expectedHmac, 'hex'));
  } catch {
    return false;
  }
}

export async function handleMediaApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const rawUrl = (req as any).originalUrl || req.url || '/';
  const urlObj = new URL(rawUrl, `http://${req.headers.host || 'localhost'}`);
  let urlPath = urlObj.pathname.replace(/\/+$/, '') || '/';
  if (!urlPath.startsWith('/api/media') && urlPath !== '/') {
    urlPath = '/api/media' + urlPath;
  }

  // Handle CORS OPTIONS preflight for /api/media/*
  if (req.method === 'OPTIONS' && urlPath.startsWith('/api/media')) {
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

  // POST /api/media/token - Issue short-lived HMAC media access tokens for R2 object keys
  if (urlPath === '/api/media/token' && req.method === 'POST') {
    const auth = await verifyUserAuth(req);
    if (!auth.authorized) {
      res.writeHead(auth.status || 401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: auth.error }));
      return true;
    }

    const body = await parseJsonBody(req);
    const rawKeys: string[] = Array.isArray(body.keys)
      ? body.keys
      : typeof body.key === 'string'
      ? [body.key]
      : [];

    const tokens: Record<string, string> = {};
    const urls: Record<string, string> = {};

    for (const rawKey of rawKeys) {
      const key = rawKey.startsWith('/') ? rawKey.slice(1) : rawKey;
      const check = await verifyUserAccessForObjectKey(auth.user, key);
      if (check.authorized) {
        const accessToken = createMediaAccessToken(key);
        tokens[key] = accessToken;
        urls[key] = `/api/media/file?key=${encodeURIComponent(key)}&access_token=${accessToken}`;
      }
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, tokens, urls }));
    return true;
  }

  // GET /api/media/file?key=<objectKey>&access_token=<mediaToken>
  if (urlPath === '/api/media/file' && req.method === 'GET') {
    // Explicitly reject Supabase JWTs passed in query params
    if (urlObj.searchParams.has('token')) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: false,
          error: 'Supabase JWTs must not be passed in query parameters. Use short-lived media access tokens via access_token.',
        })
      );
      return true;
    }

    const key = urlObj.searchParams.get('key') || '';
    const accessToken = urlObj.searchParams.get('access_token') || '';

    // Anti Path Traversal & Key Format Validation
    if (
      !key ||
      key.includes('..') ||
      key.includes('\\') ||
      key.startsWith('/') ||
      key.includes('//') ||
      !/^[a-zA-Z0-9_\-\.\/]+$/.test(key)
    ) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Invalid object key format or path traversal detected.' }));
      return true;
    }

    const allowedPrefixes = ['images/', 'videos/', 'audio/', 'documents/', 'resources/', 'raw/'];
    if (!allowedPrefixes.some((prefix) => key.startsWith(prefix))) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Access denied for requested object key prefix.' }));
      return true;
    }

    // Verify HMAC Media Access Token
    let isAuthorized = verifyMediaAccessToken(key, accessToken);

    // Development mode fallback
    if (!isAuthorized && process.env.NODE_ENV === 'development') {
      const devAuth = await verifyUserAuth(req);
      if (devAuth.authorized) {
        const accessCheck = await verifyUserAccessForObjectKey(devAuth.user, key);
        if (accessCheck.authorized) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: false,
          error: 'Access denied: Invalid, expired, or mismatched media access token.',
        })
      );
      return true;
    }

    // Handle optional Range header for audio/video/document previews
    const rangeHeader = req.headers.range;

    // Stream private object from Cloudflare R2
    const r2Result = await getR2Object(key, rangeHeader);
    if (r2Result.error || !r2Result.stream) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: false,
          error: r2Result.error || 'Media object not found in Cloudflare R2.',
        })
      );
      return true;
    }

    // Determine Content-Disposition
    const filename = path.basename(key);
    const isDownloadable =
      key.startsWith('resources/') ||
      key.startsWith('documents/') ||
      urlObj.searchParams.has('download');

    const contentDisposition = isDownloadable
      ? `attachment; filename="${filename}"`
      : 'inline';

    const headers: Record<string, string> = {
      'Content-Type': r2Result.contentType || 'application/octet-stream',
      'Cache-Control': 'private, max-age=3600',
      'Content-Disposition': contentDisposition,
      'Accept-Ranges': r2Result.acceptRanges || 'bytes',
    };

    if (r2Result.contentLength !== undefined) {
      headers['Content-Length'] = String(r2Result.contentLength);
    }
    if (r2Result.contentRange) {
      headers['Content-Range'] = r2Result.contentRange;
    }

    const statusCode = r2Result.status || (r2Result.contentRange ? 206 : 200);

    res.writeHead(statusCode, headers);
    r2Result.stream.pipe(res);
    return true;
  }

  // POST /api/media/presign
  if (urlPath === '/api/media/presign' && req.method === 'POST') {
    const auth = await verifyAdminAuth(req);
    if (!auth.authorized) {
      res.writeHead(auth.status || 401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: auth.error }));
      return true;
    }

    const body = await parseJsonBody(req);
    const { assetType, courseId, lessonId, filename, mimeType, contentType } = body;
    const effectiveMimeType = mimeType || contentType;

    const result = await generateGenericR2PresignedUrl({
      assetType: assetType as R2AssetType,
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

  // POST /api/media/upload-direct - Server fallback upload when direct R2 CORS is restricted
  if (urlPath === '/api/media/upload-direct' && req.method === 'POST') {
    const auth = await verifyAdminAuth(req);
    if (!auth.authorized) {
      res.writeHead(auth.status || 401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: auth.error }));
      return true;
    }

    const { getR2Config, createR2Client, buildGenericObjectKey, getSafeFileExtension } = await import('../lib/r2');
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    const { randomUUID } = await import('node:crypto');

    const { config, missingKeys } = getR2Config();
    if (!config) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: `R2 is not configured on server: ${missingKeys.join(', ')}` }));
      return true;
    }

    const filenameHeader = (req.headers['x-filename'] as string) || 'upload.bin';
    const assetTypeHeader = ((req.headers['x-asset-type'] as string) || 'image') as R2AssetType;
    const courseIdHeader = (req.headers['x-course-id'] as string) || 'general';
    const lessonIdHeader = req.headers['x-lesson-id'] as string | undefined;
    const contentTypeHeader = (req.headers['content-type'] as string) || 'application/octet-stream';

    const sanitizedCourseId = courseIdHeader.replace(/[^a-zA-Z0-9_-]/g, '');
    const sanitizedLessonId = lessonIdHeader ? lessonIdHeader.replace(/[^a-zA-Z0-9_-]/g, '') : undefined;
    const fileUuid = randomUUID();
    const extension = getSafeFileExtension(filenameHeader, contentTypeHeader);

    const objectKey = buildGenericObjectKey({
      assetType: assetTypeHeader,
      courseId: sanitizedCourseId,
      lessonId: sanitizedLessonId,
      uuid: fileUuid,
      extension,
    });

    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', async () => {
      try {
        const fileBuffer = Buffer.concat(chunks);
        const s3Client = createR2Client(config);
        const command = new PutObjectCommand({
          Bucket: config.bucketName,
          Key: objectKey,
          ContentType: contentTypeHeader,
          Body: fileBuffer,
        });

        await s3Client.send(command);

        const accessToken = createMediaAccessToken(objectKey);
        const fileUrl = `/api/media/file?key=${encodeURIComponent(objectKey)}&access_token=${accessToken}`;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            ok: true,
            objectKey,
            fileUrl,
            accessToken,
          })
        );
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message || 'Direct server R2 upload failed.' }));
      }
    });

    req.on('error', (err) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: err.message }));
    });

    return true;
  }

  return false;
}
