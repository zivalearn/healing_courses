import { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  createR2Client,
  getR2Config,
  getR2Object,
  getSafeFileExtension,
  validateMimeTypeForAssetType,
  R2AssetType,
  ALLOWED_ASSET_TYPES,
} from '../../lib/r2';
import { parseJsonBody } from '../videoHandler';
import {
  validateZivaKeyFormat,
  verifyZivaAdminAuth,
  verifyZivaAccessForObjectKey,
  verifyZivaUserAuth,
} from './zivaAuth';
import { createZivaMediaAccessToken, verifyZivaMediaAccessToken } from './zivaTokens';

export function buildZivaObjectKey(params: {
  assetType: R2AssetType;
  courseId: string;
  lessonId?: string;
  uuid: string;
  extension: string;
}): string {
  const { assetType, courseId, lessonId, uuid, extension } = params;
  const sanitizedCourseId = courseId.replace(/[^a-zA-Z0-9_-]/g, '');
  const sanitizedLessonId = lessonId ? lessonId.replace(/[^a-zA-Z0-9_-]/g, '') : undefined;

  switch (assetType) {
    case 'image':
      if (sanitizedCourseId === 'instructor' || sanitizedCourseId === 'instructors') {
        return `ziva/images/instructors/${uuid}.${extension}`;
      }
      if (sanitizedLessonId) {
        return `ziva/images/lessons/${sanitizedLessonId}/${uuid}.${extension}`;
      }
      return `ziva/images/courses/${sanitizedCourseId}/${uuid}.${extension}`;

    case 'audio':
      if (sanitizedLessonId) {
        return `ziva/audio/lessons/${sanitizedLessonId}/${uuid}.${extension}`;
      }
      return `ziva/audio/courses/${sanitizedCourseId}/${uuid}.${extension}`;

    case 'document':
      if (sanitizedLessonId) {
        return `ziva/documents/lessons/${sanitizedLessonId}/${uuid}.${extension}`;
      }
      return `ziva/documents/courses/${sanitizedCourseId}/${uuid}.${extension}`;

    case 'resource':
      if (sanitizedLessonId) {
        return `ziva/resources/lessons/${sanitizedLessonId}/${uuid}.${extension}`;
      }
      return `ziva/resources/courses/${sanitizedCourseId}/${uuid}.${extension}`;

    case 'video':
      if (sanitizedLessonId) {
        return `ziva/videos/raw/courses/${sanitizedCourseId}/lessons/${sanitizedLessonId}/${uuid}.${extension}`;
      }
      return `ziva/videos/raw/courses/${sanitizedCourseId}/${uuid}.${extension}`;

    default:
      return `ziva/resources/${sanitizedCourseId}/${uuid}.${extension}`;
  }
}

export async function handleZivaMediaApiRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const rawUrl = (req as any).originalUrl || req.url || '/';
  const urlObj = new URL(rawUrl, `http://${req.headers.host || 'localhost'}`);
  let urlPath = urlObj.pathname.replace(/\/+$/, '') || '/';
  if (!urlPath.startsWith('/api/ziva/media') && urlPath !== '/') {
    urlPath = '/api/ziva/media' + urlPath;
  }

  // Handle CORS OPTIONS preflight
  if (req.method === 'OPTIONS' && urlPath.startsWith('/api/ziva/media')) {
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

  // POST /api/ziva/media/presign-upload or /api/ziva/media/presign - Generate Presigned Upload URL for Ziva Admin
  if ((urlPath === '/api/ziva/media/presign-upload' || urlPath === '/api/ziva/media/presign') && req.method === 'POST') {
    const auth = await verifyZivaAdminAuth(req);
    if (!auth.authorized) {
      res.writeHead(auth.status || 401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: auth.error }));
      return true;
    }

    const body = await parseJsonBody(req);
    const { assetType, courseId, lessonId, filename, mimeType, contentType } = body;
    const effectiveMimeType = mimeType || contentType;

    if (!assetType || !ALLOWED_ASSET_TYPES.includes(assetType)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: false,
          error: `Invalid or missing assetType '${assetType}'. Allowed: ${ALLOWED_ASSET_TYPES.join(', ')}`,
        })
      );
      return true;
    }

    if (!courseId || typeof courseId !== 'string' || !courseId.trim()) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'courseId is required.' }));
      return true;
    }

    if (!filename || typeof filename !== 'string' || !filename.trim()) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'filename is required.' }));
      return true;
    }

    if (!effectiveMimeType || typeof effectiveMimeType !== 'string' || !effectiveMimeType.trim()) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'mimeType is required.' }));
      return true;
    }

    if (!validateMimeTypeForAssetType(assetType as R2AssetType, effectiveMimeType)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: false,
          error: `Unsupported MIME type '${effectiveMimeType}' for assetType '${assetType}'.`,
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

    const sanitizedCourseId = courseId.trim().replace(/[^a-zA-Z0-9_-]/g, '');
    const sanitizedLessonId = lessonId ? lessonId.trim().replace(/[^a-zA-Z0-9_-]/g, '') : undefined;
    const fileUuid = randomUUID();
    const extension = getSafeFileExtension(filename, effectiveMimeType);

    const objectKey = buildZivaObjectKey({
      assetType: assetType as R2AssetType,
      courseId: sanitizedCourseId,
      lessonId: sanitizedLessonId,
      uuid: fileUuid,
      extension,
    });

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
          assetType,
          mimeType: effectiveMimeType,
          expiresInSeconds,
        })
      );
      return true;
    } catch (err: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: false,
          error: err.message || 'Failed to generate presigned upload URL for Cloudflare R2.',
        })
      );
      return true;
    }
  }

  // POST /api/ziva/media/upload-direct - Server fallback upload when direct R2 CORS is restricted
  if (urlPath === '/api/ziva/media/upload-direct' && req.method === 'POST') {
    const auth = await verifyZivaAdminAuth(req);
    if (!auth.authorized) {
      res.writeHead(auth.status || 401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: auth.error }));
      return true;
    }

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

    const objectKey = buildZivaObjectKey({
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

        const accessToken = createZivaMediaAccessToken(objectKey);
        const fileUrl = `/api/ziva/media/file?key=${encodeURIComponent(objectKey)}&access_token=${accessToken}`;

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

  // POST /api/ziva/media/token - Issue Ziva HMAC media access tokens
  if (urlPath === '/api/ziva/media/token' && req.method === 'POST') {
    const auth = await verifyZivaUserAuth(req);
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
      const keyCheck = validateZivaKeyFormat(key);
      if (!keyCheck.valid) {
        continue;
      }

      const accessCheck = await verifyZivaAccessForObjectKey(auth.user, key);
      if (accessCheck.authorized) {
        const accessToken = createZivaMediaAccessToken(key);
        tokens[key] = accessToken;
        urls[key] = `/api/ziva/media/file?key=${encodeURIComponent(key)}&access_token=${accessToken}`;
      }
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, tokens, urls }));
    return true;
  }

  // GET /api/ziva/media/file?key=<objectKey>&access_token=<mediaToken>
  if (urlPath === '/api/ziva/media/file' && req.method === 'GET') {
    // Explicitly reject Supabase JWTs in query params
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

    // Validate key format and strict ziva/ prefix
    const keyValidation = validateZivaKeyFormat(key);
    if (!keyValidation.valid) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: keyValidation.error }));
      return true;
    }

    // Verify Ziva HMAC Media Access Token
    let isAuthorized = verifyZivaMediaAccessToken(key, accessToken);

    // Development mode fallback
    if (!isAuthorized && process.env.NODE_ENV === 'development') {
      const devAuth = await verifyZivaUserAuth(req);
      if (devAuth.authorized) {
        const accessCheck = await verifyZivaAccessForObjectKey(devAuth.user, key);
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
          error: 'Access denied: Invalid, expired, or mismatched Ziva media access token.',
        })
      );
      return true;
    }

    const rangeHeader = req.headers.range;
    const r2Result = await getR2Object(key, rangeHeader);
    if (r2Result.error || !r2Result.stream) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: false,
          error: r2Result.error || 'Ziva media object not found in Cloudflare R2.',
        })
      );
      return true;
    }

    const filename = path.basename(key);
    const isDownloadable =
      key.startsWith('ziva/resources/') ||
      key.startsWith('ziva/documents/') ||
      urlObj.searchParams.has('download');

    const contentDisposition = isDownloadable ? `attachment; filename="${filename}"` : 'inline';

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

  return false;
}
