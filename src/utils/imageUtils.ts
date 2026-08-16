import { setDBItem, getDBItem, getSyncMemoryItem, deleteDBItem } from './idbStorage';
import { storageService } from '../services/storageService';

export const DEFAULT_COURSE_IMAGE = 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80';
export const DEFAULT_BANNER_IMAGE = 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=1200&q=80';

export const IMAGE_OVERRIDES_KEY = 'hwh_image_overrides_v1';
export const CUSTOM_PRESETS_KEY = 'hwh_custom_image_presets';

// In-memory cache for ultra-fast synchronous access
let memoryOverrides: Record<string, string> | null = null;
let memoryCustomPresets: ImagePreset[] | null = null;

// Pre-load from IndexedDB into memory cache
getDBItem<Record<string, string>>(IMAGE_OVERRIDES_KEY).then(dbData => {
  if (dbData) {
    memoryOverrides = dbData;
  }
});

getDBItem<ImagePreset[]>(CUSTOM_PRESETS_KEY).then(dbData => {
  if (dbData) {
    memoryCustomPresets = dbData;
  }
});

/**
 * Gets all persistent image overrides stored in memory, IndexedDB, or localStorage.
 */
export function getImageOverrides(): Record<string, string> {
  if (memoryOverrides !== null) {
    return memoryOverrides;
  }

  const syncItem = getSyncMemoryItem<Record<string, string>>(IMAGE_OVERRIDES_KEY);
  if (syncItem) {
    memoryOverrides = syncItem;
    return syncItem;
  }

  try {
    const data = localStorage.getItem(IMAGE_OVERRIDES_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      memoryOverrides = parsed;
      return parsed;
    }
  } catch (err) {
    // Ignore error
  }

  memoryOverrides = {};
  return memoryOverrides;
}

/**
 * Sets a persistent image override for a given item ID (e.g. course ID or site asset ID).
 */
export function setImageOverride(id: string, url: string): void {
  const current = { ...getImageOverrides(), [id]: url };
  memoryOverrides = current;

  // 1. Save to IndexedDB (virtually unlimited quota)
  setDBItem(IMAGE_OVERRIDES_KEY, current).catch(() => {});

  // 2. Try saving to localStorage safely without throwing quota error
  try {
    localStorage.setItem(IMAGE_OVERRIDES_KEY, JSON.stringify(current));
  } catch (err) {
    // Quota exceeded in localStorage - data is safely stored in IndexedDB and memory!
    try {
      // Create lightweight version without massive data URIs for localStorage fallback
      const lightweight: Record<string, string> = {};
      Object.keys(current).slice(-10).forEach(key => {
        const val = current[key];
        if (!val.startsWith('data:image/') || val.length < 100000) {
          lightweight[key] = val;
        }
      });
      localStorage.setItem(IMAGE_OVERRIDES_KEY, JSON.stringify(lightweight));
    } catch (innerErr) {
      // Silent catch
    }
  }
}

/**
 * Removes a persistent image override for a given item ID.
 */
export function removeImageOverride(id: string): void {
  const current = { ...getImageOverrides() };
  delete current[id];
  memoryOverrides = current;

  setDBItem(IMAGE_OVERRIDES_KEY, current).catch(() => {});

  try {
    localStorage.setItem(IMAGE_OVERRIDES_KEY, JSON.stringify(current));
  } catch (err) {
    // Catch quota error
  }
}

/**
 * Clears all persistent image overrides.
 */
export function clearAllImageOverrides(): void {
  memoryOverrides = {};
  deleteDBItem(IMAGE_OVERRIDES_KEY).catch(() => {});
  try {
    localStorage.removeItem(IMAGE_OVERRIDES_KEY);
  } catch (err) {
    // Ignore error
  }
}

/**
 * Compresses an image data URI using HTML Canvas to prevent storage quota overflow.
 * Resizes large image files down to max dimensions (800x800) and compresses to ~20-50KB.
 */
export function compressBase64Image(dataUrl: string, maxWidth = 800, maxHeight = 800, quality = 0.75): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
      return resolve(dataUrl);
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return resolve(dataUrl);
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      try {
        const compressed = canvas.toDataURL('image/jpeg', quality);
        if (compressed && compressed.length < dataUrl.length) {
          resolve(compressed);
        } else {
          resolve(dataUrl);
        }
      } catch (err) {
        resolve(dataUrl);
      }
    };

    img.onerror = () => {
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}

export interface ImagePreset {
  id: string;
  label: string;
  category: string;
  url: string;
  isCustom?: boolean;
}

export const BUILTIN_IMAGE_PRESETS: ImagePreset[] = [
  // Meditation & Mindfulness
  { id: 'm1', label: 'Sunset Lotus Meditation', category: 'Meditation', url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80' },
  { id: 'm2', label: 'Zen Garden Stones', category: 'Meditation', url: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=800&q=80' },
  { id: 'm3', label: 'Peaceful Mountain Yoga', category: 'Meditation', url: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=800&q=80' },
  { id: 'm4', label: 'Golden Hour Serenity', category: 'Meditation', url: 'https://images.unsplash.com/photo-1508672019048-805479767c3f?auto=format&fit=crop&w=800&q=80' },

  // Energy & Reiki Healing
  { id: 'e1', label: 'Hands Energy Transmission', category: 'Energy & Reiki', url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80' },
  { id: 'e2', label: 'Aura Light Rays', category: 'Energy & Reiki', url: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=800&q=80' },
  { id: 'e3', label: 'Ethereal Healing Glow', category: 'Energy & Reiki', url: 'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?auto=format&fit=crop&w=800&q=80' },

  // Crystals & Chakras
  { id: 'c1', label: 'Amethyst Crystal Cluster', category: 'Crystals & Chakras', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80' },
  { id: 'c2', label: 'Chakra Stones Alignment', category: 'Crystals & Chakras', url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80' },

  // Sound Bath & Sacred Instruments
  { id: 's1', label: 'Singing Bowls & Incense', category: 'Sound & Vibration', url: 'https://images.unsplash.com/photo-1514533450685-4493e01d1fdc?auto=format&fit=crop&w=800&q=80' },

  // Mindset, Hypnosis & Subconscious
  { id: 'b1', label: 'Mind Clarity & Reflection', category: 'Subconscious & NLP', url: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=800&q=80' },
  { id: 'b3', label: 'Cosmic Human Silhouette', category: 'Subconscious & NLP', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80' },

  // Akashic Records & Ancient Wisdom
  { id: 'a1', label: 'Ancient Sacred Journal', category: 'Akashic Records', url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80' },

  // Tarot, Celestial & Manifestation
  { id: 't1', label: 'Tarot & Mystic Cards', category: 'Spiritual & Celestial', url: 'https://images.unsplash.com/photo-1635863138275-d9b33299680b?auto=format&fit=crop&w=800&q=80' },

  // Nature, Water & Somatic
  { id: 'n1', label: 'Tranquil Waterfall Stream', category: 'Nature & Somatic', url: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=800&q=80' }
];

/**
 * Gets custom image presets stored in memory, IndexedDB, or localStorage.
 */
export function getCustomPresets(): ImagePreset[] {
  if (memoryCustomPresets !== null) {
    return memoryCustomPresets;
  }

  const syncItem = getSyncMemoryItem<ImagePreset[]>(CUSTOM_PRESETS_KEY);
  if (syncItem) {
    memoryCustomPresets = syncItem;
    return syncItem;
  }

  try {
    const saved = localStorage.getItem(CUSTOM_PRESETS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      memoryCustomPresets = parsed;
      return parsed;
    }
  } catch (err) {
    // Ignore error
  }

  memoryCustomPresets = [];
  return memoryCustomPresets;
}

/**
 * Saves a new custom preset image to IndexedDB and memory, with safe localStorage sync.
 */
export function saveCustomPreset(preset: Omit<ImagePreset, 'id' | 'isCustom'>): ImagePreset {
  const customList = getCustomPresets();
  const newPreset: ImagePreset = {
    ...preset,
    id: `custom_${Date.now()}`,
    isCustom: true
  };

  // Limit max custom presets to 10 to keep storage efficient
  const updated = [newPreset, ...customList].slice(0, 10);
  memoryCustomPresets = updated;

  setDBItem(CUSTOM_PRESETS_KEY, updated).catch(() => {});

  try {
    localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(updated));
  } catch (err) {
    // Quota error caught silently - safely preserved in IndexedDB
  }

  return newPreset;
}

/**
 * Removes a custom preset image from storage.
 */
export function deleteCustomPreset(id: string): void {
  const customList = getCustomPresets();
  const updated = customList.filter(p => p.id !== id);
  memoryCustomPresets = updated;

  setDBItem(CUSTOM_PRESETS_KEY, updated).catch(() => {});

  try {
    localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(updated));
  } catch (err) {
    // Silent catch
  }
}

/**
 * Sanitizes and converts any image URL (including base64 data URIs and Unsplash webpage links)
 * into a direct image URL that displays reliably.
 */
export function sanitizeImageUrl(url: string | undefined | null, fallback = DEFAULT_COURSE_IMAGE): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return fallback;
  }

  let cleaned = url.trim();

  // Handle data URIs (uploaded files from file picker)
  if (cleaned.startsWith('data:image/')) {
    return cleaned;
  }

  // Handle Unsplash web links & CDN links
  if (cleaned.includes('unsplash.com')) {
    try {
      // Direct CDN images (e.g. images.unsplash.com/... or plus.unsplash.com/...)
      if (cleaned.includes('images.unsplash.com/') || cleaned.includes('plus.unsplash.com/')) {
        if (!cleaned.includes('auto=format')) {
          const joiner = cleaned.includes('?') ? '&' : '?';
          return `${cleaned}${joiner}auto=format&fit=crop&w=1000&q=80`;
        }
        return cleaned;
      }

      // Unsplash web page URLs (e.g. https://unsplash.com/photos/a-woman-meditating-0vS7v07oWpE or https://unsplash.com/photos/0vS7v07oWpE)
      const urlObj = new URL(cleaned);
      const pathSegments = urlObj.pathname.split('/').filter(Boolean);
      const lastSegment = pathSegments[pathSegments.length - 1];

      if (lastSegment) {
        if (lastSegment.startsWith('photo-') || lastSegment.startsWith('premium_photo-')) {
          return `https://images.unsplash.com/${lastSegment}?auto=format&fit=crop&w=1000&q=80`;
        }

        const slugParts = lastSegment.split('-');
        const potentialId = slugParts[slugParts.length - 1];

        // If the ID is a numeric timestamp like photo-1506126613408-eca07ce68773
        if (potentialId && /^\d{10,}/.test(potentialId)) {
          return `https://images.unsplash.com/photo-${potentialId}?auto=format&fit=crop&w=1000&q=80`;
        }

        // For alphanumeric Unsplash photo key (e.g. "0vS7v07oWpE" or "M4Mc2I4qXN0"), use Unsplash direct download redirect URL
        const photoKey = (potentialId && potentialId.length >= 4) ? potentialId : lastSegment;
        return `https://unsplash.com/photos/${photoKey}/download?w=1000`;
      }
    } catch (err) {
      console.warn('Could not parse Unsplash URL, returning cleaned:', err);
    }
  }

  // Handle Google Drive links
  if (cleaned.includes('drive.google.com/file/d/')) {
    const matches = cleaned.match(/\/file\/d\/([^\/]+)/);
    if (matches && matches[1]) {
      return `https://lh3.googleusercontent.com/d/${matches[1]}`;
    }
  }

  // Handle missing protocol
  if (cleaned.startsWith('//')) {
    cleaned = 'https:' + cleaned;
  }

  // Handle direct HTTP/HTTPS URLs
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    return cleaned;
  }

  // Handle R2 object keys or relative storage paths
  const resolved = storageService.getStorageUrl(cleaned);
  return resolved || fallback;
}

