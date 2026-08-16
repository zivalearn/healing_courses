import { zivaSupabase } from '../lib/supabase';

export type ZivaR2AssetType = 'image' | 'video' | 'audio' | 'document' | 'resource';

export interface ZivaMediaUploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  objectKey?: string;
  format: string;
  resourceType: string;
  bytes: number;
  fileName?: string;
  fileSizeFormatted?: string;
  metadata?: Record<string, any>;
}

export interface ZivaVideoUploadResult {
  ok: boolean;
  objectKey: string;
  rawObjectKey?: string;
  hlsManifestKey?: string;
  playbackUrl?: string;
  durationSeconds?: number;
  resolutions?: string[];
  error?: string;
}

export async function getZivaAuthToken(): Promise<string | null> {
  try {
    if (zivaSupabase) {
      const { data } = await zivaSupabase.auth.getSession();
      if (data?.session?.access_token) {
        return data.session.access_token;
      }
    }
  } catch {}

  try {
    const rawUser = localStorage.getItem('ziva-user');
    if (rawUser) {
      const user = JSON.parse(rawUser);
      return user.token || 'ziva-local-admin-token';
    }
  } catch {}

  return 'ziva-local-admin-token';
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// In-memory token cache to prevent redundant network calls
// key -> { url: string, expiresAt: number }
const zivaMediaUrlCache = new Map<string, { url: string; expiresAt: number }>();
const zivaHlsStreamCache = new Map<string, { url: string; expiresAt: number }>();

export const zivaMediaService = {
  /**
   * Checks if a key or URL resides in the Ziva R2 namespace
   */
  isZivaR2Key(keyOrUrl: string): boolean {
    if (!keyOrUrl || typeof keyOrUrl !== 'string') return false;
    const clean = keyOrUrl.startsWith('/') ? keyOrUrl.slice(1) : keyOrUrl;
    return (
      clean.startsWith('ziva/') ||
      clean.startsWith('api/ziva/media') ||
      clean.startsWith('api/ziva/video')
    );
  },

  /**
   * Resolves an optimized, authorized media URL for Ziva images, audio, documents, and video
   */
  async getMediaUrl(objectKey: string): Promise<string> {
    if (!objectKey || typeof objectKey !== 'string') return '';
    const trimmed = objectKey.trim();

    // Direct HTTP/HTTPS or data URI (non-R2)
    if (
      (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) &&
      !trimmed.includes('/api/ziva/')
    ) {
      return trimmed;
    }

    // Check memory cache (valid for 10 minutes)
    const cached = zivaMediaUrlCache.get(trimmed);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.url;
    }

    // If it's already an authorized URL with access_token
    if (trimmed.includes('access_token=') || trimmed.includes('token=')) {
      return trimmed;
    }

    // Clean key format
    const cleanKey = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;

    try {
      const token = await getZivaAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/ziva/media/token', {
        method: 'POST',
        headers,
        body: JSON.stringify({ key: cleanKey }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.urls && data.urls[cleanKey]) {
          const resolvedUrl = data.urls[cleanKey];
          // Cache for 10 minutes (token is valid for 15 mins)
          zivaMediaUrlCache.set(trimmed, {
            url: resolvedUrl,
            expiresAt: Date.now() + 10 * 60 * 1000,
          });
          return resolvedUrl;
        }
      }
    } catch {}

    const fallbackUrl = `/api/ziva/media/file?key=${encodeURIComponent(cleanKey)}`;
    return fallbackUrl;
  },

  /**
   * Batch resolves media URLs for multiple Ziva object keys
   */
  async getMediaUrls(objectKeys: string[]): Promise<Record<string, string>> {
    const results: Record<string, string> = {};
    const keysToFetch: string[] = [];

    for (const key of objectKeys) {
      if (!key) continue;
      const trimmed = key.trim();
      if (
        (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) &&
        !trimmed.includes('/api/ziva/')
      ) {
        results[key] = trimmed;
        continue;
      }

      const cached = zivaMediaUrlCache.get(trimmed);
      if (cached && Date.now() < cached.expiresAt) {
        results[key] = cached.url;
      } else {
        const cleanKey = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
        keysToFetch.push(cleanKey);
      }
    }

    if (keysToFetch.length > 0) {
      try {
        const token = await getZivaAuthToken();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/ziva/media/token', {
          method: 'POST',
          headers,
          body: JSON.stringify({ keys: keysToFetch }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.urls) {
            for (const [k, url] of Object.entries(data.urls as Record<string, string>)) {
              results[k] = url;
              zivaMediaUrlCache.set(k, {
                url,
                expiresAt: Date.now() + 10 * 60 * 1000,
              });
            }
          }
        }
      } catch {}
    }

    // Fill missing with fallback
    for (const key of objectKeys) {
      if (!results[key]) {
        const cleanKey = key.startsWith('/') ? key.slice(1) : key;
        results[key] = `/api/ziva/media/file?key=${encodeURIComponent(cleanKey)}`;
      }
    }

    return results;
  },

  /**
   * Requests authorization and returns the signed HLS playback stream URL
   */
  async getAuthorizedHlsStreamUrl(options: {
    courseId: string;
    lessonId: string;
    manifestKey?: string;
  }): Promise<string> {
    const { courseId, lessonId, manifestKey } = options;
    const cacheKey = manifestKey || `ziva:${courseId}:${lessonId}`;

    const cached = zivaHlsStreamCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.url;
    }

    const token = await getZivaAuthToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/ziva/video/authorize-playback', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        courseId,
        lessonId,
        manifestKey,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'Playback authorization failed' }));
      throw new Error(errData.error || `Failed to authorize Ziva playback (${res.status})`);
    }

    const data = await res.json();
    if (!data.playbackUrl) {
      throw new Error('Playback authorization did not return a valid stream URL.');
    }

    // Cache for 3 hours (HLS tokens are valid for 4 hours)
    zivaHlsStreamCache.set(cacheKey, {
      url: data.playbackUrl,
      expiresAt: Date.now() + 3 * 60 * 60 * 1000,
    });

    return data.playbackUrl;
  },

  /**
   * Uploads any general asset (image, audio, document, resource) directly from browser to Cloudflare R2
   */
  async uploadZivaAsset(options: {
    file: File;
    assetType?: ZivaR2AssetType;
    courseId?: string;
    lessonId?: string;
    onProgress?: (percent: number) => void;
  }): Promise<ZivaMediaUploadResult> {
    const { file, courseId = 'general', lessonId, onProgress } = options;
    let assetType = options.assetType;

    if (!assetType) {
      if (file.type.startsWith('image/')) assetType = 'image';
      else if (file.type.startsWith('audio/')) assetType = 'audio';
      else if (file.type.startsWith('video/')) assetType = 'video';
      else if (file.type.includes('pdf') || file.type.includes('word') || file.type.includes('text')) assetType = 'document';
      else assetType = 'resource';
    }

    const token = await getZivaAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Step 1: Request Presigned Upload URL from Ziva backend
    const presignRes = await fetch('/api/ziva/media/presign-upload', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        assetType,
        courseId,
        lessonId,
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
      }),
    });

    if (!presignRes.ok) {
      const errData = await presignRes.json().catch(() => ({ error: 'Failed to request upload signature' }));
      throw new Error(errData.error || `Failed to generate R2 upload URL (${presignRes.status})`);
    }

    const { uploadUrl, objectKey } = await presignRes.json();
    if (!uploadUrl || !objectKey) {
      throw new Error('Server returned invalid upload configuration.');
    }

    // Step 2: Direct browser PUT to Cloudflare R2 with progress tracking (with server proxy fallback)
    let uploadSucceeded = false;
    let finalObjectKey = objectKey;

    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl, true);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            onProgress(percentComplete);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            uploadSucceeded = true;
            resolve();
          } else {
            reject(new Error(`Direct R2 upload failed with HTTP ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error during direct Cloudflare R2 upload (CORS or network issue)'));
        };

        xhr.send(file);
      });
    } catch (directErr) {
      console.warn('[Ziva Media] Direct R2 PUT failed (likely CORS), falling back to direct server upload:', directErr);
      if (onProgress) onProgress(30);

      // Seamless server-side direct proxy fallback
      const serverUploadHeaders: Record<string, string> = {
        'x-filename': encodeURIComponent(file.name),
        'x-asset-type': assetType,
        'x-course-id': courseId,
        'content-type': file.type || 'application/octet-stream',
      };
      if (options?.lessonId) {
        serverUploadHeaders['x-lesson-id'] = options.lessonId;
      }
      if (token) {
        serverUploadHeaders['Authorization'] = `Bearer ${token}`;
      }

      const serverUploadRes = await fetch('/api/ziva/media/upload-direct', {
        method: 'POST',
        headers: serverUploadHeaders,
        body: file,
      });

      if (!serverUploadRes.ok) {
        const errJson = await serverUploadRes.json().catch(() => ({}));
        throw new Error(errJson.error || `Server media upload failed (${serverUploadRes.status})`);
      }

      const serverUploadData = await serverUploadRes.json();
      finalObjectKey = serverUploadData.objectKey;
      uploadSucceeded = true;
      if (onProgress) onProgress(100);
    }

    // Step 3: Request short-lived HMAC media access token
    let mediaUrl = `/api/ziva/media/file?key=${encodeURIComponent(finalObjectKey)}`;
    try {
      const tokenRes = await fetch('/api/ziva/media/token', {
        method: 'POST',
        headers,
        body: JSON.stringify({ key: finalObjectKey }),
      });
      if (tokenRes.ok) {
        const tokenData = await tokenRes.json();
        if (tokenData.urls && tokenData.urls[finalObjectKey]) {
          mediaUrl = tokenData.urls[finalObjectKey];
        }
      }
    } catch {}

    const extension = file.name.split('.').pop() || '';
    const formattedSize = formatBytes(file.size);

    return {
      publicId: finalObjectKey,
      objectKey: finalObjectKey,
      url: mediaUrl,
      secureUrl: mediaUrl,
      format: extension,
      resourceType: assetType,
      bytes: file.size,
      fileName: file.name,
      fileSizeFormatted: formattedSize,
      metadata: {
        objectKey: finalObjectKey,
        originalName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        uploadedAt: new Date().toISOString(),
      },
    };
  },

  /**
   * Uploads a video file directly to Cloudflare R2 and triggers HLS transcoding
   */
  async uploadZivaVideo(options: {
    file: File;
    courseId: string;
    lessonId: string;
    onProgress?: (percent: number, status: string) => void;
  }): Promise<ZivaVideoUploadResult> {
    const { file, courseId, lessonId, onProgress } = options;

    if (!courseId || !lessonId) {
      throw new Error('courseId and lessonId are required to upload a Ziva lesson video.');
    }

    const token = await getZivaAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (onProgress) onProgress(0, 'Requesting direct upload URL...');

    // Step 1: Request presigned video upload URL
    const presignRes = await fetch('/api/ziva/video/presign-upload', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        courseId,
        lessonId,
        filename: file.name,
        mimeType: file.type || 'video/mp4',
      }),
    });

    if (!presignRes.ok) {
      const errData = await presignRes.json().catch(() => ({ error: 'Video presign failed' }));
      throw new Error(errData.error || `Failed to generate R2 video upload URL (${presignRes.status})`);
    }

    const { uploadUrl, objectKey: rawObjectKey } = await presignRes.json();
    if (!uploadUrl || !rawObjectKey) {
      throw new Error('Server returned invalid video upload configuration.');
    }

    // Step 2: Direct browser PUT to Cloudflare R2
    if (onProgress) onProgress(5, 'Uploading video directly to Cloudflare R2...');

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          // Scale upload progress from 5% to 75%
          const percent = Math.round(5 + (event.loaded / event.total) * 70);
          onProgress(percent, `Uploading video to R2 (${Math.round((event.loaded / event.total) * 100)}%)...`);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Direct R2 video upload failed with HTTP ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during video upload to Cloudflare R2'));
      };

      xhr.send(file);
    });

    // Step 3: Trigger HLS Transcoding
    if (onProgress) onProgress(80, 'Transcoding video to Adaptive HLS (FFmpeg)...');

    const transcodeRes = await fetch('/api/ziva/video/transcode-hls', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        courseId,
        lessonId,
        rawObjectKey,
      }),
    });

    if (!transcodeRes.ok) {
      const errData = await transcodeRes.json().catch(() => ({ error: 'HLS Transcoding failed' }));
      throw new Error(errData.error || `HLS Transcoding failed on server (${transcodeRes.status})`);
    }

    const transcodeData = await transcodeRes.json();
    if (!transcodeData.ok || !transcodeData.hlsManifestKey) {
      throw new Error(transcodeData.error || 'HLS Transcoding did not produce a manifest.');
    }

    const hlsManifestKey = transcodeData.hlsManifestKey;

    // Step 4: Authorize playback
    if (onProgress) onProgress(95, 'Authorizing playback stream...');
    let playbackUrl = `/api/ziva/video/stream?key=${encodeURIComponent(hlsManifestKey)}`;

    try {
      const authRes = await fetch('/api/ziva/video/authorize-playback', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          courseId,
          lessonId,
          manifestKey: hlsManifestKey,
        }),
      });
      if (authRes.ok) {
        const authData = await authRes.json();
        if (authData.playbackUrl) {
          playbackUrl = authData.playbackUrl;
        }
      }
    } catch {}

    if (onProgress) onProgress(100, 'Video ready!');

    return {
      ok: true,
      objectKey: hlsManifestKey,
      rawObjectKey,
      hlsManifestKey,
      playbackUrl,
      durationSeconds: transcodeData.durationSeconds,
      resolutions: transcodeData.resolutions,
    };
  },

  /**
   * Universal uploadFile function (now backed strictly by Cloudflare R2)
   */
  async uploadFile(file: File, courseId = 'general', lessonId?: string): Promise<ZivaMediaUploadResult> {
    return this.uploadZivaAsset({ file, courseId, lessonId });
  },
};
