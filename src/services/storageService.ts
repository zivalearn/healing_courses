/**
 * Storage Service Abstraction Layer
 * Resolves asset & media URLs across Cloudflare R2 or local fallback.
 * Configured via a single provider flag so components never reference hardcoded cloud URLs.
 */

import { mediaService } from './mediaService';

export type StorageProvider = 'local' | 'cloudflare_r2';

export interface StorageConfig {
  provider: StorageProvider;
  cloudflareR2PublicDomain?: string;
  fallbackImageUrl: string;
}

const DEFAULT_CONFIG: StorageConfig = {
  provider: 'cloudflare_r2',
  fallbackImageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop'
};

export class StorageService {
  private config: StorageConfig;

  constructor(config: StorageConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  /**
   * Update storage provider configuration
   */
  setConfig(newConfig: Partial<StorageConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Resolve any asset path or URL based on active storage provider
   */
  getStorageUrl(path: string | undefined): string {
    if (!path || !path.trim()) {
      return '';
    }

    const cleanPath = path.trim();

    // If it's already a full HTTP(S) URL, API route, or Data URI, return directly
    if (
      cleanPath.startsWith('http://') ||
      cleanPath.startsWith('https://') ||
      cleanPath.startsWith('data:') ||
      cleanPath.startsWith('/api/')
    ) {
      return cleanPath;
    }

    const normalizedKey = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath;

    if (normalizedKey.startsWith('ziva/')) {
      return `/api/ziva/media/file?key=${encodeURIComponent(normalizedKey)}`;
    }

    switch (this.config.provider) {
      case 'cloudflare_r2':
        if (this.config.cloudflareR2PublicDomain) {
          return `${this.config.cloudflareR2PublicDomain}/${normalizedKey}`;
        }
        return mediaService.getCachedMediaUrl(normalizedKey);

      case 'local':
      default:
        return cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    }
  }

  /**
   * Async helper to pre-fetch short-lived media access tokens for R2 keys
   */
  async getAuthorizedMediaUrl(path: string | undefined): Promise<string> {
    if (!path || !path.trim()) return '';
    const cleanPath = path.trim();
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://') || cleanPath.startsWith('data:') || cleanPath.startsWith('/api/')) {
      return cleanPath;
    }
    const normalizedKey = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath;
    return mediaService.getAuthorizedMediaUrl(normalizedKey);
  }

  /**
   * Async helper to batch pre-fetch short-lived media access tokens
   */
  async getAuthorizedMediaUrls(paths: string[]): Promise<Record<string, string>> {
    return mediaService.getAuthorizedMediaUrls(paths);
  }

  /**
   * Helper for course thumbnails
   */
  getCourseImageUrl(url: string | undefined): string {
    if (!url || !url.trim()) return this.config.fallbackImageUrl;
    return this.getStorageUrl(url) || this.config.fallbackImageUrl;
  }

  /**
   * Helper for instructor avatars
   */
  getInstructorAvatarUrl(url: string | undefined): string {
    const avatar = url && url.trim() ? url : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300&auto=format&fit=crop';
    return this.getStorageUrl(avatar);
  }

  /**
   * Upload a media file via Cloudflare R2 storage service abstraction layer
   */
  async uploadFile(file: File, folder: string = 'courses'): Promise<{
    url: string;
    objectKey: string;
    originalName: string;
    size: number;
    mimeType: string;
    folder: string;
    storageProvider: 'cloudflare_r2';
  }> {
    try {
      const result = await mediaService.uploadWithProgress(file, 'auto', { folder, courseId: folder });
      return {
        url: result.objectKey,
        objectKey: result.objectKey,
        originalName: result.originalFilename || file.name,
        size: result.bytes || file.size,
        mimeType: file.type,
        folder,
        storageProvider: 'cloudflare_r2',
      };
    } catch (err: any) {
      console.error('[StorageService] Cloudflare R2 upload failed:', err);
      throw err;
    }
  }

  /**
   * Shorthand to upload file and return R2 object key string directly
   */
  async uploadMedia(file: File, folder?: string): Promise<string> {
    const res = await this.uploadFile(file, folder);
    return res.objectKey;
  }
}

export const storageService = new StorageService();


