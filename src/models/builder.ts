export type StructureType = 'week-based' | 'module-based';

export type BlockType = 
  | 'heading'
  | 'paragraph'
  | 'rich-text'
  | 'quote'
  | 'divider'
  | 'image'
  | 'gallery'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'download'
  | 'checklist'
  | 'callout'
  | 'accordion'
  | 'tabs'
  | 'button'
  | 'embed'
  | 'reflection'
  | 'journal'
  | 'meditation'
  | 'affirmation'
  | 'exercise'
  | 'worksheet'
  | 'assignment'
  | 'quiz'
  | 'completion'
  | 'certificate';

export interface BlockCategoryInfo {
  id: string;
  name: string;
  description: string;
  blocks: {
    type: BlockType;
    label: string;
    description: string;
    icon: string;
    badge?: string;
  }[];
}

export interface LessonBlock {
  id: string;
  type: BlockType;
  title?: string;
  isCollapsed?: boolean;
  content: {
    title?: string;
    text?: string;
    level?: 'h1' | 'h2' | 'h3' | 'h4';
    alignment?: 'left' | 'center' | 'right' | 'justify';
    formatting?: {
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      highlight?: string;
      color?: string;
    };
    // Media & Files
    url?: string;
    thumbnailUrl?: string;
    caption?: string;
    altText?: string;
    duration?: string;
    fileSize?: string;
    downloadable?: boolean;
    roundedCorners?: boolean;
    openFullScreen?: boolean;
    captionsPlaceholder?: string;
    transcriptPlaceholder?: string;
    images?: { id: string; url: string; caption?: string }[];
    // Interactive & Lists
    items?: { id: string; text: string; completed?: boolean }[];
    accordionItems?: { id: string; title: string; content: string }[];
    tabItems?: { id: string; title: string; content: string }[];
    buttonText?: string;
    buttonUrl?: string;
    buttonStyle?: 'primary' | 'secondary' | 'gold' | 'outline';
    embedUrl?: string;
    // Healing & Mindfulness specials
    prompt?: string;
    meditationAudioUrl?: string;
    meditationDuration?: string;
    meditationInstructions?: string;
    meditationBgImage?: string;
    affirmationText?: string;
    affirmationStyle?: 'twilight' | 'golden' | 'emerald' | 'lotus';
    affirmationAccentColor?: string;
    affirmationIllustration?: string;
    // Callouts & Exercises
    calloutVariant?: 'info' | 'warning' | 'success' | 'healing';
    exerciseInstructions?: string;
    worksheetFileUrl?: string;
    assignmentInstructions?: string;
    quizTitle?: string;
    quizQuestionsCount?: number;
    completionMessage?: string;
    certificateTitle?: string;
  };
}

export interface BuilderLesson {
  id: string;
  title: string;
  subtitle?: string;
  estimatedTime?: string; // e.g. "15 mins"
  prerequisites?: string;
  isPreviewAllowed?: boolean;
  isLocked?: boolean;
  isRequired?: boolean;
  blocks: LessonBlock[];
}

export interface BuilderSection {
  id: string;
  title: string; // e.g. "Week 1: Subconscious Awakening" or "Module 1: Foundations"
  subtitle?: string;
  isCollapsed?: boolean;
  lessons: BuilderLesson[];
}

export interface CourseBuilderData {
  courseId: string;
  structureType: StructureType; // 'week-based' | 'module-based'
  sections: BuilderSection[];
  lastSavedAt?: string;
}

// Helper to create default block content by type
export function createDefaultBlock(type: BlockType): LessonBlock {
  const id = 'blk_' + Math.random().toString(36).substr(2, 9);
  
  switch (type) {
    case 'heading':
      return {
        id,
        type,
        content: {
          text: 'New Heading',
          level: 'h2',
          alignment: 'left'
        }
      };
    case 'paragraph':
      return {
        id,
        type,
        content: {
          text: 'Enter your paragraph text here. Describe concepts clearly for your healing students.',
          alignment: 'left'
        }
      };
    case 'rich-text':
      return {
        id,
        type,
        content: {
          text: '<strong>Rich Text Content:</strong> Combine <em>formatted typography</em>, lists, and clear structured guidance.',
          alignment: 'left'
        }
      };
    case 'quote':
      return {
        id,
        type,
        content: {
          text: '"The body remembers what the mind forgets. True healing starts in subconscious stillness."',
          caption: '— Master Heer'
        }
      };
    case 'divider':
      return {
        id,
        type,
        content: {}
      };
    case 'image':
      return {
        id,
        type,
        content: {
          url: '',
          caption: 'Subconscious Alignment Sanctuary',
          altText: 'Meditation and Energy Alignment',
          alignment: 'center',
          roundedCorners: true
        }
      };
    case 'gallery':
      return {
        id,
        type,
        content: {
          images: []
        }
      };
    case 'video':
      return {
        id,
        type,
        content: {
          url: '',
          thumbnailUrl: '',
          duration: '',
          caption: 'Lesson Video',
          captionsPlaceholder: 'English (Auto-generated)',
          transcriptPlaceholder: 'Full video transcript available for reading below.'
        }
      };
    case 'audio':
      return {
        id,
        type,
        content: {
          url: '',
          title: 'Guided Subconscious Audio Stream',
          duration: ''
        }
      };
    case 'pdf':
      return {
        id,
        type,
        content: {
          url: '',
          caption: 'Practitioner Handbook.pdf',
          downloadable: true,
          openFullScreen: true
        }
      };
    case 'download':
      return {
        id,
        type,
        content: {
          title: 'Subconscious Repatterning Worksheet.pdf',
          text: 'Download the printable 7-day daily reflection template for your morning ritual.',
          url: '#',
          fileSize: '2.4 MB'
        }
      };
    case 'checklist':
      return {
        id,
        type,
        content: {
          items: [
            { id: 'c1', text: 'Prepare a quiet space with water and a notebook', completed: false },
            { id: 'c2', text: 'Listen to the 10-minute centering meditation audio', completed: false },
            { id: 'c3', text: 'Complete the daily reflection journal prompt', completed: false }
          ]
        }
      };
    case 'callout':
      return {
        id,
        type,
        content: {
          text: 'Pro Tip: Drink plenty of water after energetic breathwork to facilitate nervous system integration.',
          calloutVariant: 'healing'
        }
      };
    case 'accordion':
      return {
        id,
        type,
        content: {
          accordionItems: [
            { id: 'a1', title: 'Why is subconscious grounding essential?', content: 'Grounding stabilizes the nervous system before deep energetic clearing exercises.' },
            { id: 'a2', title: 'How often should I practice this exercise?', content: 'We recommend practicing once daily for 21 consecutive days for optimal subconscious habit formation.' }
          ]
        }
      };
    case 'tabs':
      return {
        id,
        type,
        content: {
          tabItems: [
            { id: 't1', title: 'Overview', content: 'In this section, you will learn the fundamental mechanics of energetic alignment.' },
            { id: 't2', title: 'Practice Ritual', content: 'Set aside 15 minutes each morning in a comfortable seated position.' },
            { id: 't3', title: 'Troubleshooting', content: 'If you feel lightheaded during breathwork, slow down your pace and return to normal nasal breathing.' }
          ]
        }
      };
    case 'button':
      return {
        id,
        type,
        content: {
          buttonText: 'Join Live Practice Session',
          buttonUrl: 'https://zoom.us',
          buttonStyle: 'gold'
        }
      };
    case 'embed':
      return {
        id,
        type,
        content: {
          embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          caption: 'Interactive Healing Practice Embed'
        }
      };
    case 'meditation':
      return {
        id,
        type,
        content: {
          title: 'Subconscious Serenity Meditation',
          meditationAudioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
          meditationDuration: '10:00',
          meditationInstructions: 'Close your eyes, relax your shoulders, and follow the rhythm of your natural breath as Master Heer guides your energetic release.',
          meditationBgImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1000&auto=format&fit=crop'
        }
      };
    case 'affirmation':
      return {
        id,
        type,
        content: {
          affirmationText: 'I am safe, anchored, and deeply receptive to my highest healing potential.',
          affirmationStyle: 'golden',
          affirmationAccentColor: '#CBA258'
        }
      };
    case 'reflection':
      return {
        id,
        type,
        content: {
          prompt: 'Reflect on a emotion or sensation you experienced during today\'s session. What is your body communicating to you?',
          text: '' // Student write-in space
        }
      };
    case 'journal':
      return {
        id,
        type,
        content: {
          prompt: 'Daily Subconscious Journal: List 3 beliefs you are ready to surrender today.',
          text: ''
        }
      };
    case 'exercise':
      return {
        id,
        type,
        content: {
          title: 'Subconscious Repatterning Practical Exercise',
          exerciseInstructions: 'Complete 3 rounds of 4-7-8 rhythmic breathing. Record your pulse before and after.'
        }
      };
    case 'worksheet':
      return {
        id,
        type,
        content: {
          title: 'Module 1 Integration Worksheet',
          worksheetFileUrl: '#',
          caption: 'Interactive digital worksheet for student self-reflection.'
        }
      };
    case 'assignment':
      return {
        id,
        type,
        content: {
          title: 'Case Study Submission: Energy Scan Practice',
          assignmentInstructions: 'Submit a 200-word summary detailing your experience performing an aura scan on a volunteer or self-practice.'
        }
      };
    case 'quiz':
      return {
        id,
        type,
        content: {
          quizTitle: 'Knowledge Check: Subconscious Mind Mechanics',
          quizQuestionsCount: 5
        }
      };
    case 'completion':
      return {
        id,
        type,
        content: {
          completionMessage: 'Congratulations! You have completed this lesson. Take a moment to integrate your insights.'
        }
      };
    case 'certificate':
      return {
        id,
        type,
        content: {
          certificateTitle: 'Accredited Heal With Heer Practitioner Certificate'
        }
      };
    default:
      return {
        id,
        type: 'paragraph',
        content: { text: 'Default block content' }
      };
  }
}
