import { CourseBuilderData, BuilderSection, BuilderLesson, LessonBlock, StructureType, createDefaultBlock } from '../models/builder';

const STORAGE_PREFIX = 'hwh_builder_course_';

export const builderService = {
  // Get builder data for a given course ID
  getCourseBuilderData(courseId: string, preferredStructure: StructureType = 'week-based'): CourseBuilderData {
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + courseId);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load builder data from localStorage:', e);
    }

    // Default structure generator
    const defaultData = this.generateDefaultStructure(courseId, preferredStructure);
    this.saveCourseBuilderData(courseId, defaultData);
    return defaultData;
  },

  // Save builder data
  saveCourseBuilderData(courseId: string, data: CourseBuilderData): void {
    try {
      const updatedData = {
        ...data,
        lastSavedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_PREFIX + courseId, JSON.stringify(updatedData));
    } catch (e) {
      console.error('Failed to save builder data to localStorage:', e);
    }
  },

  // Switch structure between week-based and module-based
  convertStructureType(data: CourseBuilderData, targetStructure: StructureType): CourseBuilderData {
    if (data.structureType === targetStructure) return data;

    const newSections = data.sections.map((sec, idx) => {
      const num = idx + 1;
      const title = targetStructure === 'week-based' 
        ? `Week ${num}: ${sec.title.replace(/^(Week \d+:|Module \d+:)\s*/i, '')}`
        : `Module ${num}: ${sec.title.replace(/^(Week \d+:|Module \d+:)\s*/i, '')}`;

      const newLessons = sec.lessons.map((les, lIdx) => {
        const lNum = lIdx + 1;
        const lTitle = targetStructure === 'week-based'
          ? `Day ${lNum}: ${les.title.replace(/^(Day \d+:|Lesson \d+:)\s*/i, '')}`
          : `Lesson ${lNum}: ${les.title.replace(/^(Day \d+:|Lesson \d+:)\s*/i, '')}`;
        return { ...les, title: lTitle };
      });

      return {
        ...sec,
        title,
        lessons: newLessons
      };
    });

    const updated = {
      ...data,
      structureType: targetStructure,
      sections: newSections
    };

    this.saveCourseBuilderData(data.courseId, updated);
    return updated;
  },

  // Default initial generator
  generateDefaultStructure(courseId: string, structureType: StructureType): CourseBuilderData {
    if (structureType === 'week-based') {
      return {
        courseId,
        structureType: 'week-based',
        sections: [
          {
            id: 'sec_w1',
            title: 'Week 1: Subconscious Awakening & Grounding',
            subtitle: 'Foundation of energy mechanics & somatic presence',
            isCollapsed: false,
            lessons: [
              {
                id: 'les_w1d1',
                title: 'Day 1: Understanding Mind Mechanics',
                subtitle: 'How subconscious beliefs dictate emotional response',
                estimatedTime: '20 mins',
                isRequired: true,
                isPreviewAllowed: true,
                blocks: [
                  createDefaultBlock('heading'),
                  createDefaultBlock('paragraph'),
                  createDefaultBlock('callout'),
                  createDefaultBlock('video'),
                  createDefaultBlock('meditation'),
                  createDefaultBlock('reflection')
                ]
              },
              {
                id: 'les_w1d2',
                title: 'Day 2: Somatic Grounding Ritual',
                subtitle: 'Techniques for anchoring nervous system calmness',
                estimatedTime: '15 mins',
                isRequired: true,
                isPreviewAllowed: false,
                blocks: [
                  createDefaultBlock('heading'),
                  createDefaultBlock('paragraph'),
                  createDefaultBlock('audio'),
                  createDefaultBlock('affirmation'),
                  createDefaultBlock('checklist')
                ]
              },
              {
                id: 'les_w1d3',
                title: 'Day 3: Energy Clearing & Journaling',
                subtitle: 'Clearing stagnant energetic blockages',
                estimatedTime: '25 mins',
                isRequired: false,
                isPreviewAllowed: false,
                blocks: [
                  createDefaultBlock('heading'),
                  createDefaultBlock('journal'),
                  createDefaultBlock('download')
                ]
              }
            ]
          },
          {
            id: 'sec_w2',
            title: 'Week 2: Somatic Release & Breathwork Mastery',
            subtitle: 'Unlocking deep tension through rhythmic diaphragmatic breathing',
            isCollapsed: false,
            lessons: [
              {
                id: 'les_w2d1',
                title: 'Day 1: Breathwork Protocol & Setup',
                subtitle: 'Safety, posture, and rhythm guidance',
                estimatedTime: '18 mins',
                isRequired: true,
                isPreviewAllowed: false,
                blocks: [
                  createDefaultBlock('heading'),
                  createDefaultBlock('video'),
                  createDefaultBlock('pdf')
                ]
              },
              {
                id: 'les_w2d2',
                title: 'Day 2: Guided Energetic Release Session',
                subtitle: 'Full 30-minute breathwork journey',
                estimatedTime: '30 mins',
                isRequired: true,
                isPreviewAllowed: false,
                blocks: [
                  createDefaultBlock('heading'),
                  createDefaultBlock('meditation'),
                  createDefaultBlock('reflection')
                ]
              }
            ]
          }
        ]
      };
    } else {
      return {
        courseId,
        structureType: 'module-based',
        sections: [
          {
            id: 'sec_m1',
            title: 'Module 1: Foundations of Energy Healing',
            subtitle: 'Core principles of energetic alignment',
            isCollapsed: false,
            lessons: [
              {
                id: 'les_m1l1',
                title: 'Lesson 1: Introduction to Energy Fields',
                estimatedTime: '15 mins',
                isRequired: true,
                isPreviewAllowed: true,
                blocks: [
                  createDefaultBlock('heading'),
                  createDefaultBlock('paragraph'),
                  createDefaultBlock('video'),
                  createDefaultBlock('callout')
                ]
              },
              {
                id: 'les_m1l2',
                title: 'Lesson 2: Aura Scanning & Sensing',
                estimatedTime: '22 mins',
                isRequired: true,
                isPreviewAllowed: false,
                blocks: [
                  createDefaultBlock('heading'),
                  createDefaultBlock('gallery'),
                  createDefaultBlock('exercise')
                ]
              }
            ]
          },
          {
            id: 'sec_m2',
            title: 'Module 2: Advanced Subconscious Repatterning',
            subtitle: 'Rewiring limiting beliefs at the root level',
            isCollapsed: false,
            lessons: [
              {
                id: 'les_m2l1',
                title: 'Lesson 1: Root Cause Analysis',
                estimatedTime: '25 mins',
                isRequired: true,
                isPreviewAllowed: false,
                blocks: [
                  createDefaultBlock('heading'),
                  createDefaultBlock('affirmation'),
                  createDefaultBlock('journal'),
                  createDefaultBlock('download')
                ]
              }
            ]
          }
        ]
      };
    }
  }
};
