import { S3Client, HeadBucketCommand, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID, createHmac, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { Readable } from 'node:stream';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

// Ensure ffmpeg binary has executable permissions on Linux environments (e.g. Hostinger/cPanel)
if (ffmpegStatic && typeof ffmpegStatic === 'string') {
  try {
    if (fs.existsSync(ffmpegStatic)) {
      fs.chmodSync(ffmpegStatic, 0o755);
    }
  } catch (err: any) {
    console.warn('[FFmpeg] Could not chmod ffmpeg binary:', err?.message);
  }
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

const HLS_SECRET = process.env.HLS_SIGNING_SECRET || 'healwithheer-lms-hls-secret-2026';

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}

export function getR2Config(): { config: R2Config | null; missingKeys: string[] } {
  const accountId = process.env.R2_ACCOUNT_ID || '';
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';
  const bucketName = process.env.R2_BUCKET_NAME || 'healwithheer-lms-videos';

  const missingKeys: string[] = [];
  if (!accountId) missingKeys.push('R2_ACCOUNT_ID');
  if (!accessKeyId) missingKeys.push('R2_ACCESS_KEY_ID');
  if (!secretAccessKey) missingKeys.push('R2_SECRET_ACCESS_KEY');

  if (missingKeys.length > 0) {
    return { config: null, missingKeys };
  }

  return {
    config: {
      accountId,
      accessKeyId,
      secretAccessKey,
      bucketName,
    },
    missingKeys: [],
  };
}

export function createR2Client(config: R2Config): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

// HMAC Token Security
export function generateHlsToken(courseId: string, lessonId: string, expiresInMinutes = 240): string {
  const exp = Math.floor(Date.now() / 1000) + expiresInMinutes * 60;
  const payload = `${courseId}:${lessonId}:${exp}`;
  const hmac = createHmac('sha256', HLS_SECRET).update(payload).digest('hex');
  return `${payload}:${hmac}`;
}

export function verifyHlsToken(token: string, courseId?: string, lessonId?: string): boolean {
  if (!token) return false;
  const parts = token.split(':');
  if (parts.length !== 4) return false;

  const [tokenCourseId, tokenLessonId, expStr, sig] = parts;
  const exp = parseInt(expStr, 10);

  if (isNaN(exp) || Math.floor(Date.now() / 1000) > exp) return false;
  if (courseId && tokenCourseId !== courseId) return false;
  if (lessonId && tokenLessonId !== lessonId) return false;

  const expectedPayload = `${tokenCourseId}:${tokenLessonId}:${expStr}`;
  const expectedHmac = createHmac('sha256', HLS_SECRET).update(expectedPayload).digest('hex');

  try {
    return timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expectedHmac, 'hex'));
  } catch {
    return false;
  }
}

export async function testR2Connectivity(): Promise<{
  ok: boolean;
  provider: string;
  bucketConfigured: boolean;
  bucketName?: string;
  connection?: string;
  error?: string;
  missingKeys?: string[];
}> {
  const { config, missingKeys } = getR2Config();

  if (!config) {
    return {
      ok: false,
      provider: 'cloudflare_r2',
      bucketConfigured: false,
      error: 'Server environment variables for Cloudflare R2 are not fully configured.',
      missingKeys,
    };
  }

  try {
    const s3Client = createR2Client(config);
    await s3Client.send(new HeadBucketCommand({ Bucket: config.bucketName }));

    return {
      ok: true,
      provider: 'cloudflare_r2',
      bucketConfigured: true,
      bucketName: config.bucketName,
      connection: 'successful',
    };
  } catch (err: any) {
    return {
      ok: false,
      provider: 'cloudflare_r2',
      bucketConfigured: true,
      bucketName: config.bucketName,
      connection: 'failed',
      error: err.message || 'Failed to authenticate or connect to Cloudflare R2 bucket.',
    };
  }
}

export interface PresignedUrlParams {
  courseId: string;
  lessonId: string;
  filename: string;
  mimeType: string;
}

export const ALLOWED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-matroska',
  'video/avi',
  'video/mpeg',
  'video/ogg',
];

export async function generateR2PresignedUploadUrl(params: PresignedUrlParams): Promise<{
  ok: boolean;
  uploadUrl?: string;
  objectKey?: string;
  expiresInSeconds?: number;
  error?: string;
}> {
  const { config, missingKeys } = getR2Config();

  if (!config) {
    return {
      ok: false,
      error: `R2 is not configured on the server. Missing environment variables: ${missingKeys.join(', ')}`,
    };
  }

  const { courseId, lessonId, mimeType } = params;

  if (!courseId || !lessonId) {
    return { ok: false, error: 'courseId and lessonId are required parameters.' };
  }

  if (!mimeType || !ALLOWED_VIDEO_MIME_TYPES.includes(mimeType.toLowerCase())) {
    return {
      ok: false,
      error: `Unsupported video MIME type: '${mimeType}'. Allowed types: ${ALLOWED_VIDEO_MIME_TYPES.join(', ')}`,
    };
  }

  const sanitizedCourseId = courseId.replace(/[^a-zA-Z0-9_-]/g, '');
  const sanitizedLessonId = lessonId.replace(/[^a-zA-Z0-9_-]/g, '');
  const fileUuid = randomUUID();
  const objectKey = `raw/courses/${sanitizedCourseId}/lessons/${sanitizedLessonId}/${fileUuid}.mp4`;

  try {
    const s3Client = createR2Client(config);
    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: objectKey,
      ContentType: mimeType,
    });

    const expiresInSeconds = 900; // 15 minutes
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });

    return {
      ok: true,
      uploadUrl,
      objectKey,
      expiresInSeconds,
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err.message || 'Failed to generate presigned upload URL for Cloudflare R2.',
    };
  }
}

// Generic Media Presigned Upload URL Generator for Heal With Heer LMS
export type R2AssetType = 'image' | 'video' | 'audio' | 'document' | 'resource';

export interface GenericPresignedUrlParams {
  assetType: R2AssetType;
  courseId: string;
  lessonId?: string;
  filename: string;
  mimeType: string;
}

export const ALLOWED_ASSET_TYPES: R2AssetType[] = ['image', 'video', 'audio', 'document', 'resource'];

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif', 'image/tiff', 'image/bmp'
];

export const ALLOWED_AUDIO_MIME_TYPES = [
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a', 'audio/flac', 'audio/webm', 'audio/mp4'
];

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'text/markdown',
  'text/html',
  'application/rtf'
];

export const ALLOWED_RESOURCE_MIME_TYPES = [
  'application/zip',
  'application/x-zip-compressed',
  'application/x-7z-compressed',
  'application/x-rar-compressed',
  'application/x-tar',
  'application/gzip',
  'application/octet-stream',
  ...ALLOWED_DOCUMENT_MIME_TYPES
];

export function validateMimeTypeForAssetType(assetType: R2AssetType, mimeType: string): boolean {
  if (!mimeType) return false;
  const lowerMime = mimeType.toLowerCase();

  switch (assetType) {
    case 'image':
      return lowerMime.startsWith('image/') || ALLOWED_IMAGE_MIME_TYPES.includes(lowerMime);
    case 'video':
      return lowerMime.startsWith('video/') || ALLOWED_VIDEO_MIME_TYPES.includes(lowerMime);
    case 'audio':
      return lowerMime.startsWith('audio/') || ALLOWED_AUDIO_MIME_TYPES.includes(lowerMime);
    case 'document':
      return lowerMime.startsWith('text/') || ALLOWED_DOCUMENT_MIME_TYPES.includes(lowerMime);
    case 'resource':
      return (
        lowerMime.startsWith('image/') ||
        lowerMime.startsWith('video/') ||
        lowerMime.startsWith('audio/') ||
        lowerMime.startsWith('text/') ||
        ALLOWED_RESOURCE_MIME_TYPES.includes(lowerMime)
      );
    default:
      return false;
  }
}

export function getSafeFileExtension(filename: string, mimeType: string): string {
  let ext = path.extname(filename || '').toLowerCase().replace('.', '');
  if (ext && /^[a-zA-Z0-9]+$/.test(ext) && ext.length <= 10) {
    return ext;
  }

  const lowerMime = (mimeType || '').toLowerCase();
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
    'image/avif': 'avif',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/aac': 'aac',
    'audio/m4a': 'm4a',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/zip': 'zip',
    'application/x-zip-compressed': 'zip',
  };

  if (mimeToExt[lowerMime]) {
    return mimeToExt[lowerMime];
  }

  if (lowerMime.startsWith('image/')) return 'jpg';
  if (lowerMime.startsWith('video/')) return 'mp4';
  if (lowerMime.startsWith('audio/')) return 'mp3';
  if (lowerMime.startsWith('text/')) return 'txt';

  return 'bin';
}

export function buildR2ObjectKey(params: {
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
        return `images/instructors/${uuid}.${extension}`;
      }
      if (sanitizedLessonId) {
        return `images/lessons/${sanitizedLessonId}/${uuid}.${extension}`;
      }
      return `images/courses/${sanitizedCourseId}/${uuid}.${extension}`;

    case 'video':
      if (sanitizedLessonId) {
        return `videos/raw/courses/${sanitizedCourseId}/lessons/${sanitizedLessonId}/${uuid}.${extension}`;
      }
      return `videos/raw/courses/${sanitizedCourseId}/${uuid}.${extension}`;

    case 'audio':
      if (sanitizedLessonId) {
        return `audio/lessons/${sanitizedLessonId}/${uuid}.${extension}`;
      }
      return `audio/courses/${sanitizedCourseId}/${uuid}.${extension}`;

    case 'document':
      if (sanitizedLessonId) {
        return `documents/lessons/${sanitizedLessonId}/${uuid}.${extension}`;
      }
      return `documents/courses/${sanitizedCourseId}/${uuid}.${extension}`;

    case 'resource':
      if (sanitizedLessonId) {
        return `resources/lessons/${sanitizedLessonId}/${uuid}.${extension}`;
      }
      return `resources/courses/${sanitizedCourseId}/${uuid}.${extension}`;

    default:
      return `media/${sanitizedCourseId}/${uuid}.${extension}`;
  }
}

export async function generateGenericR2PresignedUrl(params: GenericPresignedUrlParams): Promise<{
  ok: boolean;
  uploadUrl?: string;
  objectKey?: string;
  assetType?: string;
  mimeType?: string;
  expiresInSeconds?: number;
  error?: string;
}> {
  const { config, missingKeys } = getR2Config();

  if (!config) {
    return {
      ok: false,
      error: `R2 is not configured on the server. Missing environment variables: ${missingKeys.join(', ')}`,
    };
  }

  const { assetType, courseId, lessonId, filename, mimeType } = params;

  if (!assetType || !ALLOWED_ASSET_TYPES.includes(assetType)) {
    return {
      ok: false,
      error: `Invalid or missing assetType '${assetType}'. Allowed types: ${ALLOWED_ASSET_TYPES.join(', ')}`,
    };
  }

  if (!courseId || typeof courseId !== 'string' || !courseId.trim()) {
    return {
      ok: false,
      error: 'courseId is required.',
    };
  }

  if (!filename || typeof filename !== 'string' || !filename.trim()) {
    return {
      ok: false,
      error: 'filename is required.',
    };
  }

  if (!mimeType || typeof mimeType !== 'string' || !mimeType.trim()) {
    return {
      ok: false,
      error: 'mimeType is required.',
    };
  }

  if (!validateMimeTypeForAssetType(assetType, mimeType)) {
    return {
      ok: false,
      error: `Unsupported MIME type '${mimeType}' for assetType '${assetType}'.`,
    };
  }

  const sanitizedCourseId = courseId.trim().replace(/[^a-zA-Z0-9_-]/g, '');
  if (!sanitizedCourseId) {
    return {
      ok: false,
      error: 'Invalid courseId after sanitization.',
    };
  }

  const sanitizedLessonId = lessonId ? lessonId.trim().replace(/[^a-zA-Z0-9_-]/g, '') : undefined;
  const fileUuid = randomUUID();
  const extension = getSafeFileExtension(filename, mimeType);

  const objectKey = buildR2ObjectKey({
    assetType,
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
      ContentType: mimeType,
    });

    const expiresInSeconds = 900; // 15 minutes
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });

    return {
      ok: true,
      uploadUrl,
      objectKey,
      assetType,
      mimeType,
      expiresInSeconds,
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err.message || 'Failed to generate presigned upload URL for Cloudflare R2.',
    };
  }
}

// Fetch Object from R2 (with optional Range support)
export async function getR2Object(
  objectKey: string,
  range?: string
): Promise<{
  stream?: Readable;
  contentType?: string;
  contentLength?: number;
  contentRange?: string;
  acceptRanges?: string;
  error?: string;
  status?: number;
}> {
  const { config } = getR2Config();
  if (!config) return { error: 'R2 not configured' };

  try {
    const s3Client = createR2Client(config);
    const command = new GetObjectCommand({
      Bucket: config.bucketName,
      Key: objectKey,
      ...(range ? { Range: range } : {}),
    });
    const response = await s3Client.send(command);

    return {
      stream: response.Body as Readable,
      contentType: response.ContentType,
      contentLength: response.ContentLength,
      contentRange: response.ContentRange,
      acceptRanges: response.AcceptRanges || 'bytes',
      status: response.$metadata.httpStatusCode,
    };
  } catch (err: any) {
    return { error: err.message || 'Object not found in R2' };
  }
}

// Transcode raw video file or stream to HLS directory and upload to R2
export async function transcodeToHlsAndUpload(params: {
  courseId: string;
  lessonId: string;
  rawObjectKey?: string;
  fileBuffer?: Buffer;
  filePath?: string;
}): Promise<{
  ok: boolean;
  hlsManifestKey?: string;
  durationSeconds?: number;
  resolutions?: string[];
  error?: string;
}> {
  const { config } = getR2Config();
  if (!config) {
    return { ok: false, error: 'R2 environment variables are missing on the server.' };
  }

  const sanitizedCourseId = params.courseId.replace(/[^a-zA-Z0-9_-]/g, '');
  const sanitizedLessonId = params.lessonId.replace(/[^a-zA-Z0-9_-]/g, '');

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hls_transcode_'));
  const inputPath = path.join(tempDir, 'input.mp4');
  const hlsOutputDir = path.join(tempDir, 'hls');
  fs.mkdirSync(hlsOutputDir, { recursive: true });

  try {
    const s3Client = createR2Client(config);

    // Prepare input file
    if (params.filePath && fs.existsSync(params.filePath)) {
      fs.copyFileSync(params.filePath, inputPath);
    } else if (params.fileBuffer) {
      fs.writeFileSync(inputPath, params.fileBuffer);
    } else if (params.rawObjectKey) {
      const getResult = await getR2Object(params.rawObjectKey);
      if (!getResult.stream) {
        throw new Error(`Failed to fetch raw object from R2: ${getResult.error}`);
      }
      const writeStream = fs.createWriteStream(inputPath);
      await new Promise((resolve, reject) => {
        getResult.stream!.pipe(writeStream);
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });
    } else {
      throw new Error('No input video source provided (fileBuffer, filePath, or rawObjectKey required)');
    }

    // Get Video Duration
    let durationSeconds = 0;
    await new Promise<void>((resolve) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (!err && metadata?.format?.duration) {
          durationSeconds = Math.round(metadata.format.duration);
        }
        resolve();
      });
    });

    // Run FFmpeg HLS Transcoding (720p & 480p Adaptive HLS)
    const masterManifestPath = path.join(hlsOutputDir, 'master.m3u8');

    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          '-preset ultrafast',
          '-g 48',
          '-sc_threshold 0',
          '-map 0:v:0', '-map 0:a:0?',
          '-s:v:0 1280x720', '-c:v:0 libx264', '-b:v:0 2000k',
          '-master_pl_name master.m3u8',
          '-f hls',
          '-hls_time 4',
          '-hls_playlist_type vod',
          '-hls_segment_filename', path.join(hlsOutputDir, '720p_%03d.ts'),
        ])
        .output(path.join(hlsOutputDir, '720p.m3u8'))
        .on('end', () => resolve(true))
        .on('error', (err) => reject(err))
        .run();
    });

    // Upload generated HLS files to R2
    const files = fs.readdirSync(hlsOutputDir);
    const r2HlsPrefix = `hls/courses/${sanitizedCourseId}/lessons/${sanitizedLessonId}`;

    for (const fileName of files) {
      const filePath = path.join(hlsOutputDir, fileName);
      if (fs.statSync(filePath).isFile()) {
        const fileContent = fs.readFileSync(filePath);
        const r2Key = `${r2HlsPrefix}/${fileName}`;

        let contentType = 'application/octet-stream';
        if (fileName.endsWith('.m3u8')) contentType = 'application/x-mpegURL';
        if (fileName.endsWith('.ts')) contentType = 'video/MP2T';

        await s3Client.send(
          new PutObjectCommand({
            Bucket: config.bucketName,
            Key: r2Key,
            Body: fileContent,
            ContentType: contentType,
          })
        );
      }
    }

    const masterHlsKey = `${r2HlsPrefix}/master.m3u8`;

    return {
      ok: true,
      hlsManifestKey: masterHlsKey,
      durationSeconds,
      resolutions: ['720p'],
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err.message || 'Transcoding to HLS failed',
    };
  } finally {
    // Cleanup temporary files
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }
}

