import { supabase } from '../lib/supabase';

export interface MediaUploadResult {
  publicId: string;
  secureUrl: string;
  objectKey: string;
  resourceType: string;
  format: string;
  bytes: number;
  originalFilename: string;
  storageProvider: 'cloudflare_r2';
  mimeType: string;
}

export interface UploadOptions {
  folder?: string;
  courseId?: string;
  lessonId?: string;
  tags?: string[];
  context?: Record<string, string>;
}

export class MediaService {
  /**
   * Maps a file and optional hint to an approved R2 asset type
   */
  private resolveR2AssetType(
    file: File,
    requestedType?: 'image' | 'video' | 'audio' | 'document' | 'resource' | 'raw' | 'auto'
  ): 'image' | 'video' | 'audio' | 'document' | 'resource' {
    if (
      requestedType &&
      requestedType !== 'auto' &&
      requestedType !== 'raw' &&
      ['image', 'video', 'audio', 'document', 'resource'].includes(requestedType)
    ) {
      return requestedType as 'image' | 'video' | 'audio' | 'document' | 'resource';
    }

    const mime = (file.type || '').toLowerCase();
    const name = (file.name || '').toLowerCase();

    if (mime.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg|bmp|tiff|avif)$/i.test(name)) {
      return 'image';
    }
    if (mime.startsWith('video/') || /\.(mp4|webm|mov|m4v|avi|mkv)$/i.test(name)) {
      return 'video';
    }
    if (mime.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(name)) {
      return 'audio';
    }
    if (mime === 'application/pdf' || mime.startsWith('text/') || /\.(pdf|docx?|xlsx?|pptx?|txt|csv|rtf)$/i.test(name)) {
      return 'document';
    }

    return 'resource';
  }

  /**
   * Upload file directly to Cloudflare R2 using presigned PUT URL.
   * Preserves progress callback via XHR.
   */
  async uploadWithProgress(
    file: File,
    resourceType: 'image' | 'video' | 'audio' | 'document' | 'resource' | 'raw' | 'auto' = 'auto',
    options?: UploadOptions,
    onProgress?: (progressPercent: number) => void
  ): Promise<MediaUploadResult> {
    const assetType = this.resolveR2AssetType(file, resourceType);
    const mimeType = file.type || 'application/octet-stream';
    const extension = file.name.split('.').pop() || '';
    const courseId = options?.courseId || options?.folder || 'general';
    const lessonId = options?.lessonId;

    if (onProgress) onProgress(5);

    // Get Auth Session token if available
    let authToken = '';
    try {
      const { data } = await supabase.auth.getSession();
      authToken = data.session?.access_token || '';
    } catch {
      // Ignore auth fetch errors
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    // 1. Request presigned upload URL from R2 API
    const presignResponse = await fetch('/api/media/presign', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        assetType,
        courseId,
        lessonId,
        filename: file.name,
        mimeType,
      }),
    });

    if (!presignResponse.ok) {
      const errData = await presignResponse.json().catch(() => ({}));
      throw new Error(errData?.error || `Failed to request R2 presigned URL (HTTP ${presignResponse.status})`);
    }

    const presignData = await presignResponse.json();
    if (!presignData.ok || !presignData.uploadUrl || !presignData.objectKey) {
      throw new Error(presignData.error || 'Server did not return a valid Cloudflare R2 upload URL.');
    }

    if (onProgress) onProgress(15);

    // 2. Upload directly to Cloudflare R2 via presigned PUT (with server direct fallback)
    try {
      return await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', presignData.uploadUrl);
        xhr.setRequestHeader('Content-Type', mimeType);

        if (xhr.upload && onProgress) {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percent = 15 + Math.round((e.loaded / e.total) * 85);
              onProgress(percent);
            }
          };
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            if (onProgress) onProgress(100);
            const objKey = presignData.objectKey;
            // Pre-fetch token for immediate display
            this.getAuthorizedMediaUrls([objKey]).catch(() => {});
            resolve({
              publicId: objKey,
              secureUrl: objKey,
              objectKey: objKey,
              resourceType: presignData.assetType || assetType,
              format: extension,
              bytes: file.size,
              originalFilename: file.name,
              storageProvider: 'cloudflare_r2',
              mimeType,
            });
          } else {
            reject(new Error(`Direct upload to Cloudflare R2 failed with HTTP status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during file upload to Cloudflare R2 (CORS issue).'));
        xhr.ontimeout = () => reject(new Error('Upload to Cloudflare R2 timed out. Please try again.'));

        xhr.send(file);
      });
    } catch (directErr) {
      console.warn('[HWH Media] Direct R2 PUT failed (likely CORS), falling back to server direct upload:', directErr);
      if (onProgress) onProgress(30);

      const serverUploadHeaders: Record<string, string> = {
        'x-filename': encodeURIComponent(file.name),
        'x-asset-type': assetType,
        'x-course-id': courseId,
        'content-type': mimeType,
      };
      if (lessonId) {
        serverUploadHeaders['x-lesson-id'] = lessonId;
      }
      if (authToken) {
        serverUploadHeaders['Authorization'] = `Bearer ${authToken}`;
      }

      const serverUploadRes = await fetch('/api/media/upload-direct', {
        method: 'POST',
        headers: serverUploadHeaders,
        body: file,
      });

      if (!serverUploadRes.ok) {
        const errJson = await serverUploadRes.json().catch(() => ({}));
        throw new Error(errJson.error || `Server media upload failed (${serverUploadRes.status})`);
      }

      const serverUploadData = await serverUploadRes.json();
      const objKey = serverUploadData.objectKey;

      if (onProgress) onProgress(100);
      this.getAuthorizedMediaUrls([objKey]).catch(() => {});

      return {
        publicId: objKey,
        secureUrl: objKey,
        objectKey: objKey,
        resourceType: assetType,
        format: extension,
        bytes: file.size,
        originalFilename: file.name,
        storageProvider: 'cloudflare_r2',
        mimeType,
      };
    }
  }

  /**
   * Upload image file to R2
   */
  async uploadImage(file: File, options?: UploadOptions): Promise<MediaUploadResult> {
    return this.uploadWithProgress(file, 'image', options);
  }

  /**
   * Upload video file to R2
   */
  async uploadVideo(file: File, options?: UploadOptions): Promise<MediaUploadResult> {
    return this.uploadWithProgress(file, 'video', options);
  }

  /**
   * Upload raw / document file to R2
   */
  async uploadRaw(file: File, options?: UploadOptions): Promise<MediaUploadResult> {
    return this.uploadWithProgress(file, 'document', options);
  }

  // ==========================================
  // SHORT-LIVED HMAC MEDIA ACCESS TOKEN CACHE
  // ==========================================
  private tokenCache: Map<string, { token: string; expiresAt: number }> = new Map();

  /**
   * Request short-lived HMAC media access tokens for R2 object keys
   */
  async getAuthorizedMediaUrls(keys: string[]): Promise<Record<string, string>> {
    const uniqueKeys = Array.from(
      new Set(keys.filter(Boolean).map((k) => (k.startsWith('/') ? k.slice(1) : k)))
    );
    const result: Record<string, string> = {};
    const keysToFetch: string[] = [];

    for (const k of uniqueKeys) {
      if (
        k.startsWith('http://') ||
        k.startsWith('https://') ||
        k.startsWith('data:') ||
        k.includes('access_token=')
      ) {
        result[k] = k;
        continue;
      }
      const cached = this.tokenCache.get(k);
      if (cached && Date.now() < cached.expiresAt) {
        result[k] = `/api/media/file?key=${encodeURIComponent(k)}&access_token=${cached.token}`;
      } else {
        keysToFetch.push(k);
      }
    }

    if (keysToFetch.length === 0) {
      return result;
    }

    let authToken = '';
    try {
      const { data } = await supabase.auth.getSession();
      authToken = data.session?.access_token || '';
    } catch {
      //
    }

    try {
      const response = await fetch('/api/media/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ keys: keysToFetch }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.ok && data.tokens) {
          for (const [k, token] of Object.entries(data.tokens as Record<string, string>)) {
            // Cache token for 12 minutes (tokens live 15 mins on server)
            this.tokenCache.set(k, { token, expiresAt: Date.now() + 12 * 60 * 1000 });
            result[k] = `/api/media/file?key=${encodeURIComponent(k)}&access_token=${token}`;
          }
        }
      }
    } catch (err) {
      console.warn('[MediaService] Failed to fetch media access tokens:', err);
    }

    // Fallback for any key that wasn't fetched
    for (const k of keysToFetch) {
      if (!result[k]) {
        const cached = this.tokenCache.get(k);
        if (cached && Date.now() < cached.expiresAt) {
          result[k] = `/api/media/file?key=${encodeURIComponent(k)}&access_token=${cached.token}`;
        } else {
          result[k] = `/api/media/file?key=${encodeURIComponent(k)}`;
        }
      }
    }

    return result;
  }

  /**
   * Get authorized media URL for a single object key
   */
  async getAuthorizedMediaUrl(key: string): Promise<string> {
    if (!key) return '';
    if (
      key.startsWith('http://') ||
      key.startsWith('https://') ||
      key.startsWith('data:') ||
      key.includes('access_token=')
    ) {
      return key;
    }
    const normalizedKey = key.startsWith('/') ? key.slice(1) : key;
    const urls = await this.getAuthorizedMediaUrls([normalizedKey]);
    return urls[normalizedKey] || `/api/media/file?key=${encodeURIComponent(normalizedKey)}`;
  }

  /**
   * Synchronously return cached media URL with access token if available
   */
  getCachedMediaUrl(key: string): string {
    if (!key) return '';
    if (
      key.startsWith('http://') ||
      key.startsWith('https://') ||
      key.startsWith('data:') ||
      key.includes('access_token=')
    ) {
      return key;
    }
    const normalizedKey = key.startsWith('/') ? key.slice(1) : key;
    const cached = this.tokenCache.get(normalizedKey);
    if (cached && Date.now() < cached.expiresAt) {
      return `/api/media/file?key=${encodeURIComponent(normalizedKey)}&access_token=${cached.token}`;
    }
    return `/api/media/file?key=${encodeURIComponent(normalizedKey)}`;
  }
}

// Export singleton instance for app-wide media management
export const mediaService = new MediaService();
export default mediaService;



