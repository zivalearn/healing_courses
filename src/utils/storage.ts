import { Course } from '../types';
import { INITIAL_COURSES } from '../data/initialCourses';
import { getImageOverrides, setImageOverride, removeImageOverride } from './imageUtils';
import { setDBItem, getDBItem, getSyncMemoryItem, deleteDBItem } from './idbStorage';

const STORAGE_KEY = 'heal_with_heer_courses_v2';
const DELETED_COURSES_KEY = 'heal_with_heer_deleted_course_ids';

let memoryCourses: Course[] | null = null;
let memoryDeletedIds: Set<string> | null = null;

// Pre-load courses and deleted IDs from IndexedDB into memory cache
getDBItem<Course[]>(STORAGE_KEY).then(dbData => {
  if (Array.isArray(dbData)) {
    memoryCourses = dbData;
  }
});

getDBItem<string[]>(DELETED_COURSES_KEY).then(dbData => {
  if (Array.isArray(dbData)) {
    memoryDeletedIds = new Set(dbData);
  }
});

/**
 * Get the set of deleted course IDs/slugs to prevent resurrection
 */
export function getDeletedCourseIds(): Set<string> {
  if (memoryDeletedIds !== null) {
    return memoryDeletedIds;
  }

  const syncItem = getSyncMemoryItem<string[]>(DELETED_COURSES_KEY);
  if (Array.isArray(syncItem)) {
    memoryDeletedIds = new Set(syncItem);
    return memoryDeletedIds;
  }

  try {
    const raw = localStorage.getItem(DELETED_COURSES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        memoryDeletedIds = new Set(parsed);
        return memoryDeletedIds;
      }
    }
  } catch (err) {
    // Ignore error
  }

  memoryDeletedIds = new Set();
  return memoryDeletedIds;
}

/**
 * Persistently mark course IDs/slugs as deleted
 */
export function markCourseAsDeleted(...ids: (string | undefined | null)[]): void {
  const deletedSet = getDeletedCourseIds();
  let changed = false;

  ids.forEach(id => {
    if (id && typeof id === 'string' && id.trim()) {
      const clean = id.trim();
      if (!deletedSet.has(clean)) {
        deletedSet.add(clean);
        changed = true;
      }
    }
  });

  if (changed) {
    const arr = Array.from(deletedSet);
    memoryDeletedIds = deletedSet;
    setDBItem(DELETED_COURSES_KEY, arr).catch(() => {});
    try {
      localStorage.setItem(DELETED_COURSES_KEY, JSON.stringify(arr));
    } catch (e) {
      // Ignore error
    }
  }
}

/**
 * Check if a course ID or slug has been deleted
 */
export function isCourseDeleted(id?: string, slug?: string): boolean {
  const deletedSet = getDeletedCourseIds();
  if (id && deletedSet.has(id.trim())) return true;
  if (slug && deletedSet.has(slug.trim())) return true;
  return false;
}

export function getStoredCourses(): Course[] {
  const deletedSet = getDeletedCourseIds();
  let baseList: Course[] = INITIAL_COURSES.filter(c => !deletedSet.has(c.id) && !deletedSet.has(c.slug));

  if (memoryCourses !== null) {
    baseList = memoryCourses.filter(c => !deletedSet.has(c.id) && !deletedSet.has(c.slug));
  } else {
    const syncItem = getSyncMemoryItem<Course[]>(STORAGE_KEY);
    if (syncItem) {
      baseList = syncItem.filter(c => !deletedSet.has(c.id) && !deletedSet.has(c.slug));
      memoryCourses = baseList;
    } else {
      try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            baseList = parsed.filter(c => !deletedSet.has(c.id) && !deletedSet.has(c.slug));
            memoryCourses = baseList;
          }
        }
      } catch (err) {
        // Ignore error
      }
    }
  }

  // Apply persistent image overrides to courses
  const overrides = getImageOverrides();
  const merged = baseList.map(course => {
    const overrideImage = overrides[course.id];
    if (overrideImage) {
      return { 
        ...course, 
        image: overrideImage, 
        bannerImage: overrideImage 
      };
    }
    return course;
  });

  return merged;
}

export function saveCourses(courses: Course[]): void {
  const deletedSet = getDeletedCourseIds();
  const cleaned = courses.filter(c => !deletedSet.has(c.id) && !deletedSet.has(c.slug));
  memoryCourses = cleaned;

  // 1. Save to IndexedDB (unlimited quota)
  setDBItem(STORAGE_KEY, cleaned).catch(() => {});

  // 2. Try saving to localStorage safely without throwing quota errors
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
  } catch (err) {
    // If localStorage quota is exceeded, strip heavy base64 strings for localStorage fallback
    try {
      const lightweightCourses = cleaned.map(c => {
        const isDataImage = c.image && c.image.startsWith('data:image/');
        return {
          ...c,
          image: isDataImage ? (getImageOverrides()[c.id] || c.image.slice(0, 50)) : c.image,
          bannerImage: isDataImage ? (getImageOverrides()[c.id] || c.bannerImage?.slice(0, 50)) : c.bannerImage
        };
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lightweightCourses));
    } catch (innerErr) {
      // Silent catch - data is safely in IndexedDB
    }
  }
}

export function resetCoursesToDefault(): Course[] {
  memoryDeletedIds = new Set();
  setDBItem(DELETED_COURSES_KEY, []).catch(() => {});
  try {
    localStorage.removeItem(DELETED_COURSES_KEY);
  } catch (e) {}

  memoryCourses = INITIAL_COURSES;
  deleteDBItem(STORAGE_KEY).catch(() => {});
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_COURSES));
  } catch (err) {
    // Silent catch
  }
  return INITIAL_COURSES;
}

export function addCourse(courseData: Partial<Course>): Course[] {
  const current = getStoredCourses();
  const id = 'course-' + Date.now();
  const newCourse: Course = {
    id,
    name: courseData.name || 'New Healing Program',
    slug: (courseData.name || 'new-course').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    category: courseData.category || 'Healing',
    shortDescription: courseData.shortDescription || 'Transformative healing program designed by Heer.',
    fullDescription: courseData.fullDescription || 'Join this transformative course to unlock your subconscious healing potential.',
    image: courseData.image || 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop',
    bannerImage: courseData.bannerImage || 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?q=80&w=1200&auto=format&fit=crop',
    duration: courseData.duration || '4 Weeks',
    level: courseData.level || 'Beginner',
    mode: courseData.mode || 'Online',
    price: courseData.price ?? 299,
    originalPrice: courseData.originalPrice ?? 399,
    currency: courseData.currency || '$',
    instructor: 'Heer',
    instructorRole: courseData.instructorRole || 'Master Healer & Mind Coach',
    instructorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300&auto=format&fit=crop',
    isFeatured: courseData.isFeatured ?? false,
    isPublished: courseData.isPublished ?? true,
    enrolmentOpen: courseData.enrolmentOpen ?? true,
    rating: 5.0,
    reviewsCount: 1,
    badge: courseData.badge || 'New Program',
    certificationName: courseData.certificationName || 'Certified Practitioner',
    keyOutcomes: courseData.keyOutcomes || ['Subconscious transformation', 'Certified practitioner techniques', 'Self-healing & client practice'],
    curriculum: courseData.curriculum || [
      {
        id: 'm1',
        title: 'Module 1: Foundations & Mind Mechanics',
        duration: '1 Week',
        lessons: ['Introduction & Setup', 'Core Mind Principles']
      }
    ],
    prerequisites: courseData.prerequisites || 'Open to all seekers.',
    upcomingBatchDate: courseData.upcomingBatchDate || 'Enrollment Open',
    createdAt: new Date().toISOString()
  };

  // Save image override for guaranteed persistence
  if (newCourse.image) {
    setImageOverride(newCourse.id, newCourse.image);
  }

  // If new course is featured, unfeature others
  let updated = [...current];
  if (newCourse.isFeatured) {
    updated = updated.map(c => ({ ...c, isFeatured: false }));
  }

  updated.unshift(newCourse);
  saveCourses(updated);
  return updated;
}

export function updateCourse(id: string, updates: Partial<Course>): Course[] {
  const current = getStoredCourses();
  
  // If image is updated, store in image overrides immediately
  if (updates.image) {
    setImageOverride(id, updates.image);
  }

  let updated = current.map(c => {
    if (c.id === id) {
      return { ...c, ...updates };
    }
    // If setting this course as featured, unfeature all others
    if (updates.isFeatured) {
      return { ...c, isFeatured: false };
    }
    return c;
  });

  saveCourses(updated);
  return updated;
}

export function setFeaturedCourse(id: string): Course[] {
  const current = getStoredCourses();
  const updated = current.map(c => ({
    ...c,
    isFeatured: c.id === id
  }));
  saveCourses(updated);
  return updated;
}

export function deleteCourse(id: string): Course[] {
  const current = getStoredCourses();
  const courseToDelete = current.find(c => c.id === id);
  markCourseAsDeleted(id, courseToDelete?.slug);
  removeImageOverride(id);

  const updated = current.filter(c => c.id !== id);
  saveCourses(updated);
  return updated;
}
