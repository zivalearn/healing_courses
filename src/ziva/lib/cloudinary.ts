/**
 * Ziva Legacy Cloudinary Utilities
 * Read-only helper for legacy courses containing existing Cloudinary URLs.
 * All new uploads are routed strictly to Cloudflare R2 under the ziva/ namespace.
 */

export const getZivaOptimizedCloudinaryUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (!url.includes('cloudinary.com') || url.includes('/f_auto,q_auto/')) {
    return url;
  }
  return url.replace('/upload/', '/upload/f_auto,q_auto/');
};
