import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ZivaLayout } from '../layouts/ZivaLayout';
import { zivaCourseService } from '../services/zivaCourseService';
import { storageService } from '../../services/storageService';
import {
  ZivaCourse,
  ZivaSection,
  ZivaLesson,
  ZivaLessonBlock,
  ZivaBlockType,
  ZivaCourseCategory,
  ZivaCourseLevel
} from '../types';
import { ZivaR2Uploader } from '../components/ZivaR2Uploader';
import { ZivaBlockPickerModal } from '../components/ZivaBlockPickerModal';
import { ZivaStudentPreviewModal } from '../components/ZivaStudentPreviewModal';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  Sparkles,
  Layers,
  FileText,
  Video,
  Music,
  HelpCircle,
  Download,
  Info,
  Code,
  CheckCircle,
  Clock,
  Copy,
  PlusCircle,
  Check,
  Tag,
  DollarSign,
  User,
  Award,
  Globe,
  CheckSquare,
  ChevronRight,
  FolderTree,
  Quote,
  Image as ImageIcon,
  AlertCircle,
  X
} from 'lucide-react';

const CATEGORIES: ZivaCourseCategory[] = [
  'Confidence',
  'Communication',
  'Public Speaking',
  'Personality Development',
  'Coaching & Mindset',
  'Executive Presence'
];

const LEVELS: ZivaCourseLevel[] = [
  'All Levels',
  'Beginner',
  'Intermediate',
  'Advanced',
  'Executive Mastery'
];

const MODES = [
  'Self-Paced Executive',
  'Live Cohort Masterclass',
  'Hybrid Mentorship'
];

const CURRENCIES = ['$', '₹', '€', '£'];

export const ZivaAdminCourseBuilder: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<ZivaCourse | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'curriculum' | 'metadata'>('curriculum');
  const [metadataSubTab, setMetadataSubTab] = useState<'basic' | 'pricing' | 'media' | 'instructor' | 'outcomes' | 'seo'>('basic');
  const [lastSaved, setLastSaved] = useState<string>('Saved');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'section' | 'lesson' | 'block'; id: string; title: string } | null>(null);
  const [isBlockPickerOpen, setIsBlockPickerOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Helper inputs for array lists
  const [newOutcome, setNewOutcome] = useState('');
  const [newRequirement, setNewRequirement] = useState('');
  const [newTag, setNewTag] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    async function load() {
      if (!courseId) return;
      const data = await zivaCourseService.getCourseByIdOrSlug(courseId);
      if (data) {
        setCourse(data);
        if (data.sections?.[0]) {
          setActiveSectionId(data.sections[0].id);
          if (data.sections[0].lessons?.[0]) {
            setActiveLessonId(data.sections[0].lessons[0].id);
          }
        }
      }
    }
    load();
  }, [courseId]);

  // Keyboard shortcut Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (course) {
          handleSaveCourse(course);
          showToast('Masterclass changes saved (Ctrl+S)');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [course]);

  if (!course) {
    return (
      <ZivaLayout>
        <div className="py-24 text-center text-amber-400 font-serif">
          Loading Ziva Masterclass Builder & Studio...
        </div>
      </ZivaLayout>
    );
  }

  // Find active section & lesson
  let activeSection: ZivaSection | null = null;
  let activeLesson: ZivaLesson | null = null;

  for (const sec of course.sections || []) {
    const found = sec.lessons?.find((l) => l.id === activeLessonId);
    if (found) {
      activeLesson = found;
      activeSection = sec;
      break;
    }
    if (sec.id === activeSectionId) {
      activeSection = sec;
    }
  }

  const handleSaveCourse = async (updatedCourse: ZivaCourse) => {
    setCourse(updatedCourse);
    setIsSaving(true);
    await zivaCourseService.saveCourse(updatedCourse);
    setIsSaving(false);
    const now = new Date();
    setLastSaved(`Saved at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`);
  };

  // Section / Module Handlers
  const handleAddSection = () => {
    const secCount = (course.sections?.length || 0) + 1;
    const newSec: ZivaSection = {
      id: 'sec_' + Date.now(),
      title: `Module ${secCount}: Executive Foundations`,
      subtitle: 'Core principles and executive breakthroughs',
      lessons: [
        {
          id: 'les_' + Date.now(),
          title: `Lesson 1: Introduction & Executive Alignment`,
          estimated_duration: 15,
          blocks: [
            {
              id: 'blk_' + Date.now(),
              type: 'paragraph',
              title: 'Mastery Overview',
              content: 'Welcome to this executive module. Follow each practice step carefully.',
              order: 0,
            },
          ],
        },
      ],
    };

    const updatedSections = [...(course.sections || []), newSec];
    handleSaveCourse({ ...course, sections: updatedSections });
    setActiveSectionId(newSec.id);
    setActiveLessonId(newSec.lessons[0].id);
    showToast('New Module Added');
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    if (!course.sections) return;
    const sections = [...course.sections];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;

    const temp = sections[index];
    sections[index] = sections[targetIdx];
    sections[targetIdx] = temp;

    handleSaveCourse({ ...course, sections });
    showToast('Module reordered');
  };

  const handleToggleCollapseSection = (secId: string) => {
    const updated = course.sections?.map((s) =>
      s.id === secId ? { ...s, is_collapsed: !s.is_collapsed } : s
    );
    if (updated) handleSaveCourse({ ...course, sections: updated });
  };

  // Lesson Handlers
  const handleAddLesson = (sectionId: string) => {
    const updatedSections = course.sections?.map((sec) => {
      if (sec.id === sectionId) {
        const newLes: ZivaLesson = {
          id: 'les_' + Date.now(),
          title: `Lesson ${(sec.lessons?.length || 0) + 1}: Executive Practice`,
          estimated_duration: 15,
          blocks: [
            {
              id: 'blk_' + Date.now(),
              type: 'paragraph',
              title: 'Executive Instruction',
              content: 'Enter lesson instruction and executive framework details...',
              order: 0,
            },
          ],
        };
        setActiveLessonId(newLes.id);
        return {
          ...sec,
          lessons: [...(sec.lessons || []), newLes],
        };
      }
      return sec;
    });

    if (updatedSections) {
      handleSaveCourse({ ...course, sections: updatedSections });
      showToast('New Lesson Added');
    }
  };

  const handleDuplicateLesson = (sectionId: string, lesson: ZivaLesson) => {
    const duplicatedLesson: ZivaLesson = {
      ...JSON.parse(JSON.stringify(lesson)),
      id: 'les_' + Date.now(),
      title: `${lesson.title} (Copy)`,
      blocks: (lesson.blocks || []).map((b) => ({
        ...b,
        id: 'blk_' + Date.now() + Math.random().toString(36).substring(2, 6),
      })),
    };

    const updatedSections = course.sections?.map((sec) => {
      if (sec.id === sectionId) {
        return {
          ...sec,
          lessons: [...(sec.lessons || []), duplicatedLesson],
        };
      }
      return sec;
    });

    if (updatedSections) {
      handleSaveCourse({ ...course, sections: updatedSections });
      setActiveLessonId(duplicatedLesson.id);
      showToast('Lesson duplicated successfully');
    }
  };

  const handleMoveLesson = (sectionId: string, lessonIdx: number, direction: 'up' | 'down') => {
    const updatedSections = course.sections?.map((sec) => {
      if (sec.id === sectionId && sec.lessons) {
        const lessons = [...sec.lessons];
        const targetIdx = direction === 'up' ? lessonIdx - 1 : lessonIdx + 1;
        if (targetIdx < 0 || targetIdx >= lessons.length) return sec;

        const temp = lessons[lessonIdx];
        lessons[lessonIdx] = lessons[targetIdx];
        lessons[targetIdx] = temp;

        return { ...sec, lessons };
      }
      return sec;
    });

    if (updatedSections) {
      handleSaveCourse({ ...course, sections: updatedSections });
      showToast('Lesson reordered');
    }
  };

  // Block Handlers
  const handleAddBlock = (type: ZivaBlockType) => {
    if (!activeLesson || !activeSection) return;

    const newBlk: ZivaLessonBlock = {
      id: 'blk_' + Date.now(),
      type,
      title: `New ${type.toUpperCase()} Block`,
      content: type === 'paragraph' ? 'Enter detailed instruction text...' : '',
      order: activeLesson.blocks?.length || 0,
    };

    if (type === 'quiz') {
      newBlk.questions = [
        {
          id: 'q1',
          question: 'What is the primary core of authentic communication?',
          options: ['Vocal clarity', 'Subconscious grounding', 'Rapid speech', 'Over-preparedness'],
          correctAnswer: 1,
          explanation: 'Subconscious grounding provides steady vocal delivery and authentic confidence.',
        },
      ];
    } else if (type === 'callout') {
      newBlk.callout_type = 'info';
      newBlk.content = 'Remember to ground your breath into the diaphragm before beginning.';
    } else if (type === 'code') {
      newBlk.code_language = 'typescript';
      newBlk.content = '// Executive Communication Framework\nconst presence = "Grounded";';
    } else if (type === 'accordion') {
      newBlk.accordion_items = [
        { title: 'Executive Technique Breakdown', content: 'Detailed breakdown of core technique and practical cues.' },
      ];
    } else if (type === 'gallery') {
      newBlk.gallery_images = [];
    } else if (type === 'checklist') {
      newBlk.checklist_items = [
        { id: 'c1', text: '5-minute vocal resonance warmup', is_checked: false },
        { id: 'c2', text: 'Posture & eye-contact alignment', is_checked: false },
      ];
    } else if (type === 'worksheet') {
      newBlk.worksheet_data = {
        instructions: 'Download the template, complete the 3 exercises, and record your reflections.',
        template_name: 'Executive_Action_Worksheet.pdf',
      };
    } else if (type === 'quote') {
      newBlk.content = 'Presence is not something you fabricate; it is what remains when self-doubt is dissolved.';
      newBlk.quote_author = 'Meharr';
    }

    const updatedSections = course.sections?.map((sec) => {
      if (sec.id === activeSection?.id) {
        return {
          ...sec,
          lessons: sec.lessons?.map((les) => {
            if (les.id === activeLesson?.id) {
              return {
                ...les,
                blocks: [...(les.blocks || []), newBlk],
              };
            }
            return les;
          }),
        };
      }
      return sec;
    });

    if (updatedSections) {
      handleSaveCourse({ ...course, sections: updatedSections });
      showToast(`Added ${type.toUpperCase()} block`);
    }
  };

  const handleMoveBlock = (blockIdx: number, direction: 'up' | 'down') => {
    if (!activeLesson || !activeSection || !activeLesson.blocks) return;
    const blocks = [...activeLesson.blocks];
    const targetIdx = direction === 'up' ? blockIdx - 1 : blockIdx + 1;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;

    const temp = blocks[blockIdx];
    blocks[blockIdx] = blocks[targetIdx];
    blocks[targetIdx] = temp;

    const updatedSections = course.sections?.map((sec) => {
      if (sec.id === activeSection?.id) {
        return {
          ...sec,
          lessons: sec.lessons?.map((les) => {
            if (les.id === activeLesson?.id) {
              return { ...les, blocks };
            }
            return les;
          }),
        };
      }
      return sec;
    });

    if (updatedSections) {
      handleSaveCourse({ ...course, sections: updatedSections });
      showToast('Block reordered');
    }
  };

  const handleDuplicateBlock = (block: ZivaLessonBlock) => {
    if (!activeLesson || !activeSection) return;
    const duplicated: ZivaLessonBlock = {
      ...JSON.parse(JSON.stringify(block)),
      id: 'blk_' + Date.now(),
      title: `${block.title || 'Block'} (Copy)`,
    };

    const updatedSections = course.sections?.map((sec) => {
      if (sec.id === activeSection?.id) {
        return {
          ...sec,
          lessons: sec.lessons?.map((les) => {
            if (les.id === activeLesson?.id) {
              return {
                ...les,
                blocks: [...(les.blocks || []), duplicated],
              };
            }
            return les;
          }),
        };
      }
      return sec;
    });

    if (updatedSections) {
      handleSaveCourse({ ...course, sections: updatedSections });
      showToast('Block duplicated');
    }
  };

  const handleUpdateBlock = (blockId: string, updatedBlock: ZivaLessonBlock) => {
    const updatedSections = course.sections?.map((sec) => {
      if (sec.id === activeSection?.id) {
        return {
          ...sec,
          lessons: sec.lessons?.map((les) => {
            if (les.id === activeLesson?.id) {
              return {
                ...les,
                blocks: les.blocks?.map((b) => (b.id === blockId ? updatedBlock : b)),
              };
            }
            return les;
          }),
        };
      }
      return sec;
    });

    if (updatedSections) {
      handleSaveCourse({ ...course, sections: updatedSections });
    }
  };

  const handleDeleteBlock = (blockId: string) => {
    const updatedSections = course.sections?.map((sec) => {
      if (sec.id === activeSection?.id) {
        return {
          ...sec,
          lessons: sec.lessons?.map((les) => {
            if (les.id === activeLesson?.id) {
              return {
                ...les,
                blocks: les.blocks?.filter((b) => b.id !== blockId),
              };
            }
            return les;
          }),
        };
      }
      return sec;
    });

    if (updatedSections) {
      handleSaveCourse({ ...course, sections: updatedSections });
    }
  };

  const handleConfirmDeleteTarget = () => {
    if (!deleteTarget || !course) return;

    if (deleteTarget.type === 'section') {
      const updated = course.sections?.filter((s) => s.id !== deleteTarget.id);
      handleSaveCourse({ ...course, sections: updated });
      if (activeSectionId === deleteTarget.id) {
        setActiveSectionId(updated?.[0]?.id || null);
        setActiveLessonId(updated?.[0]?.lessons?.[0]?.id || null);
      }
      showToast('Module deleted');
    } else if (deleteTarget.type === 'lesson') {
      const updated = course.sections?.map((s) => ({
        ...s,
        lessons: s.lessons?.filter((l) => l.id !== deleteTarget.id),
      }));
      handleSaveCourse({ ...course, sections: updated });
      if (activeLessonId === deleteTarget.id) {
        setActiveLessonId(null);
      }
      showToast('Lesson deleted');
    } else if (deleteTarget.type === 'block') {
      handleDeleteBlock(deleteTarget.id);
      showToast('Block deleted');
    }

    setDeleteTarget(null);
  };

  // Outcome & Requirement helpers
  const handleAddOutcome = () => {
    if (!newOutcome.trim()) return;
    const outcomes = [...(course.keyOutcomes || []), newOutcome.trim()];
    handleSaveCourse({ ...course, keyOutcomes: outcomes });
    setNewOutcome('');
    showToast('Outcome added');
  };

  const handleDeleteOutcome = (idx: number) => {
    const outcomes = course.keyOutcomes.filter((_, i) => i !== idx);
    handleSaveCourse({ ...course, keyOutcomes: outcomes });
  };

  const handleAddRequirement = () => {
    if (!newRequirement.trim()) return;
    const reqs = [...(course.requirements || []), newRequirement.trim()];
    handleSaveCourse({ ...course, requirements: reqs });
    setNewRequirement('');
    showToast('Requirement added');
  };

  const handleDeleteRequirement = (idx: number) => {
    const reqs = (course.requirements || []).filter((_, i) => i !== idx);
    handleSaveCourse({ ...course, requirements: reqs });
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    const currentTags = course.tags || [];
    if (!currentTags.includes(newTag.trim())) {
      handleSaveCourse({ ...course, tags: [...currentTags, newTag.trim()] });
    }
    setNewTag('');
  };

  const handleDeleteTag = (tagToDelete: string) => {
    const currentTags = (course.tags || []).filter((t) => t !== tagToDelete);
    handleSaveCourse({ ...course, tags: currentTags });
  };

  return (
    <ZivaLayout>
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-[#FF2E93] text-white font-bold text-xs px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-pink-400/30 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-white shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-red-500/40 rounded-2xl p-6 max-w-md w-full space-y-4 text-white shadow-2xl">
            <h3 className="text-lg font-serif font-bold text-red-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Confirm Delete {deleteTarget.type.toUpperCase()}
            </h3>
            <p className="text-xs text-gray-300">
              Are you sure you want to delete <span className="font-bold text-amber-300">"{deleteTarget.title}"</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-gray-300 rounded-lg text-xs font-bold uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteTarget}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold uppercase cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BLOCK PICKER MODAL */}
      <ZivaBlockPickerModal
        isOpen={isBlockPickerOpen}
        onClose={() => setIsBlockPickerOpen(false)}
        onSelectBlock={handleAddBlock}
      />

      {/* STUDENT LIVE PREVIEW MODAL */}
      <ZivaStudentPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        course={course}
        lesson={activeLesson}
        moduleTitle={activeSection?.title}
      />

      {/* TOP HEADER CONTROLS */}
      <div className="bg-black border-b border-gray-900 py-4 px-4 sm:px-6 lg:px-8 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Link to="/ziva/admin" className="p-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <span className="text-[10px] font-serif text-[#FF2E93] font-bold uppercase tracking-widest">
                Executive Masterclass Authoring Studio
              </span>
              <h1 className="text-lg font-serif font-bold text-amber-300 line-clamp-1">{course.title}</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] text-gray-400 italic font-mono hidden sm:inline">{lastSaved}</span>

            {/* QUICK STUDENT PREVIEW SIMULATOR */}
            <button
              onClick={() => setIsPreviewModalOpen(true)}
              className="bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer shadow"
              title="Test current lesson in student mode"
            >
              <Eye className="w-4 h-4 text-amber-400" />
              <span>Simulate Student</span>
            </button>

            {/* PUBLISH TOGGLE */}
            <button
              onClick={() => {
                handleSaveCourse({ ...course, isPublished: !course.isPublished });
                showToast(course.isPublished ? 'Unpublished masterclass' : 'Published masterclass!');
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors ${
                course.isPublished
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900'
                  : 'bg-neutral-900 text-gray-400 border border-gray-800 hover:text-white'
              }`}
            >
              {course.isPublished ? <Check className="w-4 h-4 text-emerald-400" /> : <Eye className="w-4 h-4" />}
              {course.isPublished ? 'Published' : 'Draft Mode'}
            </button>

            {/* MANUAL SAVE */}
            <button
              onClick={() => {
                handleSaveCourse(course);
                showToast('Masterclass saved successfully');
              }}
              disabled={isSaving}
              className="bg-[#FF2E93] hover:bg-pink-600 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-widest px-5 py-2 rounded-lg shadow-lg flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>

            <Link
              to={`/ziva/course/${course.id}`}
              className="bg-neutral-900 hover:bg-neutral-800 text-white border border-gray-800 font-bold text-xs uppercase tracking-wider px-3.5 py-2 rounded-lg flex items-center gap-1 cursor-pointer"
              title="Open public course catalog view"
            >
              <Globe className="w-4 h-4 text-pink-400" />
            </Link>
          </div>
        </div>
      </div>

      {/* TOP LEVEL NAVIGATION TABS: CURRICULUM VS METADATA */}
      <div className="bg-neutral-950 border-b border-gray-900 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex space-x-8 text-xs font-bold uppercase tracking-widest">
          <button
            onClick={() => setActiveTab('curriculum')}
            className={`py-3.5 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'curriculum' ? 'border-[#FF2E93] text-[#FF2E93]' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Layers className="w-4 h-4" /> Curriculum & Lesson Blocks
          </button>
          <button
            onClick={() => setActiveTab('metadata')}
            className={`py-3.5 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'metadata' ? 'border-[#FF2E93] text-[#FF2E93]' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <FileText className="w-4 h-4" /> Program Metadata, Media & Pricing
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ========================================================================= */}
        {/* METADATA, PRICING & MEDIA TAB */}
        {/* ========================================================================= */}
        {activeTab === 'metadata' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* SUBTAB SIDEBAR */}
            <div className="lg:col-span-3 space-y-1 bg-neutral-950 border border-gray-900 rounded-3xl p-4 h-fit">
              <button
                onClick={() => setMetadataSubTab('basic')}
                className={`w-full text-left p-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-colors cursor-pointer ${
                  metadataSubTab === 'basic' ? 'bg-[#FF2E93] text-white' : 'text-gray-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span>Basic Information</span>
              </button>

              <button
                onClick={() => setMetadataSubTab('pricing')}
                className={`w-full text-left p-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-colors cursor-pointer ${
                  metadataSubTab === 'pricing' ? 'bg-[#FF2E93] text-white' : 'text-gray-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <DollarSign className="w-4 h-4 shrink-0" />
                <span>Pricing & Enrolment</span>
              </button>

              <button
                onClick={() => setMetadataSubTab('media')}
                className={`w-full text-left p-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-colors cursor-pointer ${
                  metadataSubTab === 'media' ? 'bg-[#FF2E93] text-white' : 'text-gray-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Video className="w-4 h-4 shrink-0" />
                <span>Media, Banners & Trailer</span>
              </button>

              <button
                onClick={() => setMetadataSubTab('instructor')}
                className={`w-full text-left p-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-colors cursor-pointer ${
                  metadataSubTab === 'instructor' ? 'bg-[#FF2E93] text-white' : 'text-gray-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <User className="w-4 h-4 shrink-0" />
                <span>Instructor & Certificate</span>
              </button>

              <button
                onClick={() => setMetadataSubTab('outcomes')}
                className={`w-full text-left p-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-colors cursor-pointer ${
                  metadataSubTab === 'outcomes' ? 'bg-[#FF2E93] text-white' : 'text-gray-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Award className="w-4 h-4 shrink-0" />
                <span>Outcomes & Tags</span>
              </button>

              <button
                onClick={() => setMetadataSubTab('seo')}
                className={`w-full text-left p-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-colors cursor-pointer ${
                  metadataSubTab === 'seo' ? 'bg-[#FF2E93] text-white' : 'text-gray-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Globe className="w-4 h-4 shrink-0" />
                <span>SEO & Visibility</span>
              </button>
            </div>

            {/* SUBTAB CONTENT PANEL */}
            <div className="lg:col-span-9 bg-neutral-950 border border-gray-900 rounded-3xl p-6 sm:p-8 space-y-6 text-white">
              
              {/* 1. BASIC INFORMATION */}
              {metadataSubTab === 'basic' && (
                <div className="space-y-6">
                  <div className="border-b border-gray-900 pb-3">
                    <h2 className="text-lg font-serif font-bold text-amber-300">Basic Masterclass Information</h2>
                    <p className="text-xs text-gray-400">Configure program title, category, level, duration, and overview.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-amber-300 uppercase mb-1">Masterclass Title</label>
                      <input
                        type="text"
                        value={course.title}
                        onChange={(e) => handleSaveCourse({ ...course, title: e.target.value, name: e.target.value })}
                        className="w-full bg-black border border-gray-800 text-white text-sm p-3 rounded-xl outline-none focus:ring-1 focus:ring-[#FF2E93]"
                        placeholder="e.g. Master The Stage: Elite Executive Presence"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-amber-300 uppercase mb-1">Subtitle / Tagline</label>
                      <input
                        type="text"
                        value={course.tagline || ''}
                        onChange={(e) => handleSaveCourse({ ...course, tagline: e.target.value })}
                        className="w-full bg-black border border-gray-800 text-white text-sm p-3 rounded-xl outline-none focus:ring-1 focus:ring-[#FF2E93]"
                        placeholder="e.g. Unshakeable vocal confidence and high-stakes communication"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-amber-300 uppercase mb-1">Category</label>
                        <select
                          value={course.category}
                          onChange={(e) => handleSaveCourse({ ...course, category: e.target.value as ZivaCourseCategory })}
                          className="w-full bg-black border border-gray-800 text-white text-xs p-3 rounded-xl outline-none focus:ring-1 focus:ring-[#FF2E93]"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-amber-300 uppercase mb-1">Level</label>
                        <select
                          value={course.level}
                          onChange={(e) => handleSaveCourse({ ...course, level: e.target.value as ZivaCourseLevel })}
                          className="w-full bg-black border border-gray-800 text-white text-xs p-3 rounded-xl outline-none focus:ring-1 focus:ring-[#FF2E93]"
                        >
                          {LEVELS.map((lvl) => (
                            <option key={lvl} value={lvl}>{lvl}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-amber-300 uppercase mb-1">Delivery Mode</label>
                        <select
                          value={course.mode || 'Executive Masterclass'}
                          onChange={(e) => handleSaveCourse({ ...course, mode: e.target.value })}
                          className="w-full bg-black border border-gray-800 text-white text-xs p-3 rounded-xl outline-none focus:ring-1 focus:ring-[#FF2E93]"
                        >
                          {MODES.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-amber-300 uppercase mb-1">Duration</label>
                        <input
                          type="text"
                          value={course.duration}
                          onChange={(e) => handleSaveCourse({ ...course, duration: e.target.value })}
                          className="w-full bg-black border border-gray-800 text-white text-xs p-3 rounded-xl outline-none focus:ring-1 focus:ring-[#FF2E93]"
                          placeholder="e.g. 6 Weeks (Live + Recorded)"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-amber-300 uppercase mb-1">Primary Language</label>
                        <input
                          type="text"
                          value={course.language || 'English & Hindi'}
                          onChange={(e) => handleSaveCourse({ ...course, language: e.target.value })}
                          className="w-full bg-black border border-gray-800 text-white text-xs p-3 rounded-xl outline-none focus:ring-1 focus:ring-[#FF2E93]"
                          placeholder="e.g. English & Hindi"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-amber-300 uppercase mb-1">Short Description</label>
                      <textarea
                        rows={2}
                        value={course.shortDescription}
                        onChange={(e) => handleSaveCourse({ ...course, shortDescription: e.target.value })}
                        className="w-full bg-black border border-gray-800 text-white text-xs p-3 rounded-xl outline-none focus:ring-1 focus:ring-[#FF2E93]"
                        placeholder="Brief 2-sentence hook for catalog cards and previews..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-amber-300 uppercase mb-1">Full Masterclass Description</label>
                      <textarea
                        rows={5}
                        value={course.fullDescription}
                        onChange={(e) => handleSaveCourse({ ...course, fullDescription: e.target.value })}
                        className="w-full bg-black border border-gray-800 text-white text-xs p-3 rounded-xl outline-none focus:ring-1 focus:ring-[#FF2E93]"
                        placeholder="Comprehensive overview of syllabus, subconscious mindset shift, and executive breakthroughs..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 2. PRICING & ENROLMENT */}
              {metadataSubTab === 'pricing' && (
                <div className="space-y-6">
                  <div className="border-b border-gray-900 pb-3">
                    <h2 className="text-lg font-serif font-bold text-amber-300">Pricing & Cohort Enrolment</h2>
                    <p className="text-xs text-gray-400">Configure tuition fees, sale discounts, and enrollment availability.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-amber-300 uppercase mb-1">Standard Price</label>
                      <input
                        type="number"
                        value={course.price}
                        onChange={(e) => handleSaveCourse({ ...course, price: Number(e.target.value) })}
                        className="w-full bg-black border border-gray-800 text-white text-sm p-3 rounded-xl outline-none focus:ring-1 focus:ring-[#FF2E93]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-amber-300 uppercase mb-1">Sale / Discount Price</label>
                      <input
                        type="number"
                        value={course.salePrice || ''}
                        onChange={(e) => handleSaveCourse({ ...course, salePrice: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-full bg-black border border-gray-800 text-white text-sm p-3 rounded-xl outline-none focus:ring-1 focus:ring-[#FF2E93]"
                        placeholder="Optional sale price"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-amber-300 uppercase mb-1">Currency</label>
                      <select
                        value={course.currency || '$'}
                        onChange={(e) => handleSaveCourse({ ...course, currency: e.target.value })}
                        className="w-full bg-black border border-gray-800 text-white text-xs p-3 rounded-xl outline-none focus:ring-1 focus:ring-[#FF2E93]"
                      >
                        {CURRENCIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-amber-300 uppercase mb-1">Upcoming Batch Date</label>
                      <input
                        type="text"
                        value={course.upcomingBatchDate || '1st of Next Month'}
                        onChange={(e) => handleSaveCourse({ ...course, upcomingBatchDate: e.target.value })}
                        className="w-full bg-black border border-gray-800 text-white text-xs p-3 rounded-xl outline-none focus:ring-1 focus:ring-[#FF2E93]"
                        placeholder="e.g. 1st of Next Month"
                      />
                    </div>

                    <div className="flex flex-col justify-end">
                      <label className="flex items-center gap-3 p-3 bg-black border border-gray-800 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={course.enrolmentOpen ?? true}
                          onChange={(e) => handleSaveCourse({ ...course, enrolmentOpen: e.target.checked })}
                          className="accent-[#FF2E93] w-4 h-4 rounded"
                        />
                        <div>
                          <span className="text-xs font-bold text-white block">Enrolment Is Currently Open</span>
                          <span className="text-[10px] text-gray-400">Accepting new student registrations</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. MEDIA & BANNERS & TRAILER */}
              {metadataSubTab === 'media' && (
                <div className="space-y-6">
                  <div className="border-b border-gray-900 pb-3">
                    <h2 className="text-lg font-serif font-bold text-amber-300">Media, Cover Images & Trailer Video</h2>
                    <p className="text-xs text-gray-400">All media uploaded directly to Cloudflare R2 under ziva/ namespace.</p>
                  </div>

                  {/* THUMBNAIL */}
                  <div className="bg-black p-5 rounded-2xl border border-gray-900 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-amber-300 uppercase flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-pink-500" />
                        <span>Masterclass Thumbnail Image</span>
                      </label>
                      {course.thumbnailUrl && (
                        <button
                          onClick={() => handleSaveCourse({ ...course, thumbnailUrl: '' })}
                          className="text-[10px] text-red-400 hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {course.thumbnailUrl && (
                      <div className="relative rounded-xl overflow-hidden border border-gray-800">
                        <img
                          src={storageService.getCourseImageUrl(course.thumbnailUrl)}
                          alt="Thumbnail"
                          className="w-full h-44 object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop';
                          }}
                        />
                        <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-1 rounded text-[10px] font-mono text-gray-300">
                          {course.thumbnailUrl}
                        </div>
                      </div>
                    )}

                    <ZivaR2Uploader
                      assetType="image"
                      courseId={course.id || 'general'}
                      currentUrl={course.thumbnailUrl}
                      onUploadSuccess={(res) => {
                        const url = typeof res === 'string' ? res : res.url;
                        handleSaveCourse({ ...course, thumbnailUrl: url });
                        showToast('Thumbnail updated via Cloudflare R2!');
                      }}
                      buttonText="Upload Thumbnail to Cloudflare R2"
                    />
                  </div>

                  {/* HERO BANNER COVER */}
                  <div className="bg-black p-5 rounded-2xl border border-gray-900 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-amber-300 uppercase flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span>Hero Banner Cover Image</span>
                      </label>
                      {course.bannerUrl && (
                        <button
                          onClick={() => handleSaveCourse({ ...course, bannerUrl: '' })}
                          className="text-[10px] text-red-400 hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {course.bannerUrl && (
                      <div className="relative rounded-xl overflow-hidden border border-gray-800">
                        <img
                          src={storageService.getCourseImageUrl(course.bannerUrl)}
                          alt="Hero Banner"
                          className="w-full h-44 object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?q=80&w=1200&auto=format&fit=crop';
                          }}
                        />
                        <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-1 rounded text-[10px] font-mono text-gray-300">
                          {course.bannerUrl}
                        </div>
                      </div>
                    )}

                    <ZivaR2Uploader
                      assetType="image"
                      courseId={course.id || 'general'}
                      currentUrl={course.bannerUrl}
                      onUploadSuccess={(res) => {
                        const url = typeof res === 'string' ? res : res.url;
                        handleSaveCourse({ ...course, bannerUrl: url });
                        showToast('Banner cover updated via Cloudflare R2!');
                      }}
                      buttonText="Upload Banner Cover to Cloudflare R2"
                    />
                  </div>

                  {/* COURSE PREVIEW / TRAILER VIDEO */}
                  <div className="bg-black p-5 rounded-2xl border border-gray-900 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-amber-300 uppercase flex items-center gap-1.5">
                        <Video className="w-4 h-4 text-pink-500" />
                        <span>Course Preview / Trailer Video</span>
                      </label>
                      {course.promoVideoUrl && (
                        <button
                          onClick={() => handleSaveCourse({ ...course, promoVideoUrl: '' })}
                          className="text-[10px] text-red-400 hover:underline cursor-pointer"
                        >
                          Remove Trailer
                        </button>
                      )}
                    </div>

                    {course.promoVideoUrl && (
                      <div className="space-y-2">
                        <video
                          src={course.promoVideoUrl}
                          poster={course.promoVideoPoster}
                          controls
                          className="w-full max-h-56 rounded-xl bg-neutral-950 border border-gray-800"
                        />
                        <p className="text-[10px] font-mono text-amber-400 line-clamp-1">
                          Key: {course.promoVideoUrl}
                        </p>
                      </div>
                    )}

                    <ZivaR2Uploader
                      assetType="video"
                      courseId={course.id || 'general'}
                      currentUrl={course.promoVideoUrl}
                      onUploadSuccess={(res) => {
                        const url = typeof res === 'string' ? res : res.url;
                        handleSaveCourse({ ...course, promoVideoUrl: url });
                        showToast('Trailer video updated via Cloudflare R2!');
                      }}
                      buttonText="Upload Trailer Video to Cloudflare R2"
                    />

                    {/* TRAILER POSTER */}
                    <div className="pt-2 border-t border-gray-900 space-y-2">
                      <label className="block text-[11px] font-bold text-gray-400 uppercase">
                        Trailer Video Poster Image
                      </label>
                      {course.promoVideoPoster && (
                        <img
                          src={course.promoVideoPoster}
                          alt="Poster"
                          className="w-32 h-20 object-cover rounded-lg border border-gray-800"
                        />
                      )}
                      <ZivaR2Uploader
                        assetType="image"
                        courseId={course.id || 'general'}
                        currentUrl={course.promoVideoPoster}
                        onUploadSuccess={(res) => {
                          const url = typeof res === 'string' ? res : res.url;
                          handleSaveCourse({ ...course, promoVideoPoster: url });
                          showToast('Trailer poster updated!');
                        }}
                        buttonText="Upload Trailer Video Poster"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 4. INSTRUCTOR & CERTIFICATE */}
              {metadataSubTab === 'instructor' && (
                <div className="space-y-6">
                  <div className="border-b border-gray-900 pb-3">
                    <h2 className="text-lg font-serif font-bold text-amber-300">Instructor Profile & Accreditation</h2>
                    <p className="text-xs text-gray-400">Configure instructor identity, executive credentials, and certificate title.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-amber-300 uppercase mb-1">Instructor Name</label>
                      <input
                        type="text"
                        value={course.instructorName || ''}
                        onChange={(e) => handleSaveCourse({ ...course, instructorName: e.target.value })}
                        className="w-full bg-black border border-gray-800 text-white text-xs p-3 rounded-xl outline-none focus:ring-1 focus:ring-[#FF2E93]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-amber-300 uppercase mb-1">Instructor Title / Role</label>
                      <input
                        type="text"
                        value={course.instructorTitle || ''}
                        onChange={(e) => handleSaveCourse({ ...course, instructorTitle: e.target.value })}
                        className="w-full bg-black border border-gray-800 text-white text-xs p-3 rounded-xl outline-none focus:ring-1 focus:ring-[#FF2E93]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-300 uppercase mb-1">Instructor Bio</label>
                    <textarea
                      rows={3}
                      value={course.instructorBio || ''}
                      onChange={(e) => handleSaveCourse({ ...course, instructorBio: e.target.value })}
                      className="w-full bg-black border border-gray-800 text-white text-xs p-3 rounded-xl outline-none focus:ring-1 focus:ring-[#FF2E93]"
                    />
                  </div>

                  {/* INSTRUCTOR AVATAR UPLOAD */}
                  <div className="bg-black p-4 rounded-2xl border border-gray-900 space-y-3">
                    <label className="block text-xs font-bold text-amber-300 uppercase">Instructor Avatar</label>
                    <div className="flex items-center gap-4">
                      {course.instructorAvatar && (
                        <img
                          src={course.instructorAvatar}
                          alt="Instructor"
                          className="w-16 h-16 rounded-full object-cover border-2 border-amber-500/40 shrink-0"
                        />
                      )}
                      <div className="flex-1">
                        <ZivaR2Uploader
                          assetType="image"
                          courseId="instructor"
                          currentUrl={course.instructorAvatar}
                          onUploadSuccess={(res) => {
                            const url = typeof res === 'string' ? res : res.url;
                            handleSaveCourse({ ...course, instructorAvatar: url });
                            showToast('Instructor avatar updated via Cloudflare R2!');
                          }}
                          buttonText="Upload Instructor Avatar to R2"
                        />
                      </div>
                    </div>
                  </div>

                  {/* CERTIFICATE ACCREDITATION */}
                  <div className="bg-black p-4 rounded-2xl border border-gray-900 space-y-3">
                    <label className="block text-xs font-bold text-amber-300 uppercase">Accredited Certificate Name</label>
                    <input
                      type="text"
                      value={course.certificationName || 'Accredited Ziva Executive Leadership Certificate'}
                      onChange={(e) => handleSaveCourse({ ...course, certificationName: e.target.value })}
                      className="w-full bg-neutral-950 border border-gray-800 text-white text-xs p-3 rounded-xl outline-none focus:ring-1 focus:ring-[#FF2E93]"
                      placeholder="e.g. Accredited Ziva Executive Leadership Certificate"
                    />
                  </div>
                </div>
              )}

              {/* 5. OUTCOMES, REQUIREMENTS & TAGS */}
              {metadataSubTab === 'outcomes' && (
                <div className="space-y-6">
                  <div className="border-b border-gray-900 pb-3">
                    <h2 className="text-lg font-serif font-bold text-amber-300">Outcomes, Prerequisites & Tags</h2>
                    <p className="text-xs text-gray-400">Define bullet learning objectives, student requirements, and discoverability tags.</p>
                  </div>

                  {/* KEY OUTCOMES */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-amber-300 uppercase">Key Learning Outcomes</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newOutcome}
                        onChange={(e) => setNewOutcome(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddOutcome()}
                        placeholder="e.g. Master unshakeable vocal presence under high pressure..."
                        className="flex-1 bg-black border border-gray-800 text-white text-xs p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-[#FF2E93]"
                      />
                      <button
                        onClick={handleAddOutcome}
                        className="bg-[#FF2E93] hover:bg-pink-600 text-white font-bold text-xs px-4 rounded-xl cursor-pointer"
                      >
                        Add
                      </button>
                    </div>

                    <div className="space-y-2 pt-1">
                      {course.keyOutcomes?.map((outcome, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 bg-black border border-gray-800 rounded-xl text-xs">
                          <span className="text-gray-200">{outcome}</span>
                          <button
                            onClick={() => handleDeleteOutcome(idx)}
                            className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* REQUIREMENTS */}
                  <div className="space-y-3 pt-4 border-t border-gray-900">
                    <label className="block text-xs font-bold text-amber-300 uppercase">Prerequisites & Requirements</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newRequirement}
                        onChange={(e) => setNewRequirement(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddRequirement()}
                        placeholder="e.g. Open to ambitious executives with a commitment to daily practice..."
                        className="flex-1 bg-black border border-gray-800 text-white text-xs p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-[#FF2E93]"
                      />
                      <button
                        onClick={handleAddRequirement}
                        className="bg-[#FF2E93] hover:bg-pink-600 text-white font-bold text-xs px-4 rounded-xl cursor-pointer"
                      >
                        Add
                      </button>
                    </div>

                    <div className="space-y-2 pt-1">
                      {course.requirements?.map((req, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 bg-black border border-gray-800 rounded-xl text-xs">
                          <span className="text-gray-200">{req}</span>
                          <button
                            onClick={() => handleDeleteRequirement(idx)}
                            className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* TAGS */}
                  <div className="space-y-3 pt-4 border-t border-gray-900">
                    <label className="block text-xs font-bold text-amber-300 uppercase">Discoverability Tags</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                        placeholder="e.g. Leadership, Voice Coaching, Executive Pitch"
                        className="flex-1 bg-black border border-gray-800 text-white text-xs p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-[#FF2E93]"
                      />
                      <button
                        onClick={handleAddTag}
                        className="bg-neutral-900 hover:bg-neutral-800 border border-gray-800 text-white font-bold text-xs px-4 rounded-xl cursor-pointer"
                      >
                        Add Tag
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {course.tags?.map((tag) => (
                        <span key={tag} className="bg-black border border-amber-500/30 text-amber-300 text-xs px-3 py-1 rounded-full flex items-center gap-1.5">
                          <span>{tag}</span>
                          <button onClick={() => handleDeleteTag(tag)} className="hover:text-red-400 cursor-pointer">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 6. SEO & VISIBILITY */}
              {metadataSubTab === 'seo' && (
                <div className="space-y-6">
                  <div className="border-b border-gray-900 pb-3">
                    <h2 className="text-lg font-serif font-bold text-amber-300">SEO, Custom URL & Visibility</h2>
                    <p className="text-xs text-gray-400">Configure unique slug URL, meta tags, and catalog badges.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-amber-300 uppercase mb-1">Custom URL Slug</label>
                      <div className="flex items-center bg-black border border-gray-800 rounded-xl overflow-hidden">
                        <span className="px-3 text-xs text-gray-500 border-r border-gray-800 font-mono">/ziva/course/</span>
                        <input
                          type="text"
                          value={course.slug}
                          onChange={(e) => handleSaveCourse({ ...course, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-') })}
                          className="flex-1 bg-transparent text-white text-xs p-3 outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <label className="flex items-center gap-3 p-4 bg-black border border-gray-800 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={course.isPublished}
                          onChange={(e) => handleSaveCourse({ ...course, isPublished: e.target.checked })}
                          className="accent-[#FF2E93] w-4 h-4 rounded"
                        />
                        <div>
                          <span className="text-xs font-bold text-white block">Published Live</span>
                          <span className="text-[10px] text-gray-400">Visible in catalogue and student enrollment</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-4 bg-black border border-gray-800 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={course.isFeatured}
                          onChange={(e) => handleSaveCourse({ ...course, isFeatured: e.target.checked })}
                          className="accent-[#FF2E93] w-4 h-4 rounded"
                        />
                        <div>
                          <span className="text-xs font-bold text-white block">Featured Program</span>
                          <span className="text-[10px] text-gray-400">Highlighted on top hero catalog slots</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CURRICULUM & LESSON BLOCKS TAB */}
        {/* ========================================================================= */}
        {activeTab === 'curriculum' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT: SECTIONS & LESSONS VISUAL TREE */}
            <div className="lg:col-span-4 bg-neutral-950 border border-gray-900 rounded-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-gray-900 pb-3">
                <div>
                  <h3 className="text-xs font-serif font-bold text-amber-300 uppercase tracking-wider">
                    Executive Modules ({course.sections?.length || 0})
                  </h3>
                  <span className="text-[10px] text-gray-400">
                    {(course.sections || []).reduce((acc, s) => acc + (s.lessons?.length || 0), 0)} Total Lessons
                  </span>
                </div>
                <button
                  onClick={handleAddSection}
                  className="bg-[#FF2E93] hover:bg-pink-600 text-white font-bold text-[10px] uppercase px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Module
                </button>
              </div>

              <div className="space-y-4">
                {course.sections?.map((sec, sIdx) => (
                  <div key={sec.id} className="border border-gray-900 rounded-2xl bg-black overflow-hidden space-y-1 p-3">
                    
                    {/* MODULE HEADER */}
                    <div className="flex items-center justify-between text-xs font-bold text-amber-200 border-b border-gray-900 pb-2">
                      <div className="flex items-center gap-1.5 truncate pr-2">
                        <button
                          onClick={() => handleToggleCollapseSection(sec.id)}
                          className="p-1 hover:text-white text-gray-400 cursor-pointer"
                        >
                          {sec.is_collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                        <input
                          type="text"
                          value={sec.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = course.sections?.map((s) => (s.id === sec.id ? { ...s, title: val } : s));
                            if (updated) handleSaveCourse({ ...course, sections: updated });
                          }}
                          className="bg-transparent text-amber-300 font-serif font-bold text-xs truncate outline-none focus:ring-1 focus:ring-[#FF2E93] rounded px-1"
                        />
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={() => handleMoveSection(sIdx, 'up')}
                          disabled={sIdx === 0}
                          className="p-1 hover:text-white disabled:opacity-20 text-gray-400 cursor-pointer"
                          title="Move Module Up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveSection(sIdx, 'down')}
                          disabled={sIdx === (course.sections?.length || 0) - 1}
                          className="p-1 hover:text-white disabled:opacity-20 text-gray-400 cursor-pointer"
                          title="Move Module Down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ type: 'section', id: sec.id, title: sec.title })}
                          className="p-1 text-red-400 hover:text-red-300 cursor-pointer"
                          title="Delete Module"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleAddLesson(sec.id)}
                          className="text-[10px] text-pink-400 hover:underline flex items-center gap-0.5 ml-1 cursor-pointer font-bold"
                        >
                          <Plus className="w-3 h-3" /> Lesson
                        </button>
                      </div>
                    </div>

                    {/* LESSONS LIST */}
                    {!sec.is_collapsed && (
                      <div className="space-y-1 pt-1">
                        {sec.lessons?.map((les, lIdx) => (
                          <div key={les.id} className="flex items-center justify-between group">
                            <button
                              onClick={() => {
                                setActiveSectionId(sec.id);
                                setActiveLessonId(les.id);
                              }}
                              className={`flex-1 p-2 text-left text-xs rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                                activeLessonId === les.id
                                  ? 'bg-[#FF2E93] text-white font-bold shadow-md'
                                  : 'hover:bg-neutral-900 text-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                {les.is_preview && (
                                  <span className="text-[8px] bg-emerald-950 border border-emerald-500/40 text-emerald-300 px-1 py-0.2 rounded font-mono">
                                    FREE
                                  </span>
                                )}
                                <span className="truncate">{les.title}</span>
                              </div>
                              <span className="text-[10px] opacity-70 shrink-0 ml-2 font-mono">
                                {les.estimated_duration || 15}m
                              </span>
                            </button>

                            <div className="hidden group-hover:flex items-center space-x-0.5 pl-1 shrink-0">
                              <button
                                onClick={() => handleDuplicateLesson(sec.id, les)}
                                className="p-1 text-gray-400 hover:text-amber-300"
                                title="Duplicate Lesson"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleMoveLesson(sec.id, lIdx, 'up')}
                                disabled={lIdx === 0}
                                className="p-1 text-gray-400 hover:text-white disabled:opacity-20"
                                title="Move Up"
                              >
                                <ChevronUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleMoveLesson(sec.id, lIdx, 'down')}
                                disabled={lIdx === (sec.lessons?.length || 0) - 1}
                                className="p-1 text-gray-400 hover:text-white disabled:opacity-20"
                                title="Move Down"
                              >
                                <ChevronDown className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget({ type: 'lesson', id: les.id, title: les.title })}
                                className="p-1 text-red-400 hover:text-red-300"
                                title="Delete Lesson"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: BLOCK EDITOR FOR ACTIVE LESSON */}
            <div className="lg:col-span-8 bg-neutral-950 border border-gray-900 rounded-3xl p-6 sm:p-8 space-y-6 max-h-[85vh] overflow-y-auto text-white">
              {activeLesson ? (
                <div className="space-y-6">
                  
                  {/* LESSON TITLE & SETTINGS */}
                  <div className="border-b border-gray-900 pb-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#FF2E93] uppercase tracking-widest">
                        Editing Lesson Configuration
                      </span>
                      <button
                        onClick={() => setIsPreviewModalOpen(true)}
                        className="text-xs font-bold text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> Preview This Lesson
                      </button>
                    </div>

                    <input
                      type="text"
                      value={activeLesson.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = course.sections?.map((s) =>
                          s.id === activeSection?.id
                            ? {
                                ...s,
                                lessons: s.lessons?.map((l) => (l.id === activeLesson?.id ? { ...l, title: val } : l)),
                              }
                            : s
                        );
                        if (updated) handleSaveCourse({ ...course, sections: updated });
                      }}
                      className="w-full bg-black border border-gray-800 text-xl font-serif font-bold text-white p-3.5 rounded-xl outline-none focus:ring-1 focus:ring-[#FF2E93]"
                      placeholder="Lesson Title"
                    />

                    <input
                      type="text"
                      value={activeLesson.subtitle || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = course.sections?.map((s) =>
                          s.id === activeSection?.id
                            ? {
                                ...s,
                                lessons: s.lessons?.map((l) => (l.id === activeLesson?.id ? { ...l, subtitle: val } : l)),
                              }
                            : s
                        );
                        if (updated) handleSaveCourse({ ...course, sections: updated });
                      }}
                      className="w-full bg-black border border-gray-800 text-xs text-gray-300 p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-[#FF2E93]"
                      placeholder="Lesson Subtitle / Brief Cues (optional)"
                    />

                    <div className="flex flex-wrap items-center gap-4 text-xs">
                      <div className="flex items-center space-x-2 bg-black border border-gray-800 px-3 py-1.5 rounded-xl">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-gray-400">Duration (min):</span>
                        <input
                          type="number"
                          value={activeLesson.estimated_duration || 15}
                          onChange={(e) => {
                            const num = Number(e.target.value);
                            const updated = course.sections?.map((s) =>
                              s.id === activeSection?.id
                                ? {
                                    ...s,
                                    lessons: s.lessons?.map((l) =>
                                      l.id === activeLesson?.id ? { ...l, estimated_duration: num } : l
                                    ),
                                  }
                                : s
                            );
                            if (updated) handleSaveCourse({ ...course, sections: updated });
                          }}
                          className="w-14 bg-neutral-900 border border-gray-700 text-white p-1 rounded text-xs text-center outline-none"
                        />
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer text-gray-300 bg-black border border-gray-800 px-3 py-1.5 rounded-xl">
                        <input
                          type="checkbox"
                          checked={activeLesson.is_preview || false}
                          onChange={(e) => {
                            const val = e.target.checked;
                            const updated = course.sections?.map((s) =>
                              s.id === activeSection?.id
                                ? {
                                    ...s,
                                    lessons: s.lessons?.map((l) => (l.id === activeLesson?.id ? { ...l, is_preview: val } : l)),
                                  }
                                : s
                            );
                            if (updated) handleSaveCourse({ ...course, sections: updated });
                          }}
                          className="accent-[#FF2E93]"
                        />
                        <span>Free Preview Lesson</span>
                      </label>
                    </div>
                  </div>

                  {/* FAST ADD BLOCK TOOLBAR */}
                  <div className="bg-black p-4 rounded-2xl border border-gray-900 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                        Add Content Block to Lesson
                      </span>
                      <button
                        onClick={() => setIsBlockPickerOpen(true)}
                        className="text-[11px] text-[#FF2E93] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> Browse All Block Types
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button onClick={() => handleAddBlock('video')} className="bg-neutral-900 hover:bg-neutral-800 border border-gray-800 text-white text-[11px] font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer">
                        <Video className="w-3.5 h-3.5 text-pink-400" /> Video (R2)
                      </button>
                      <button onClick={() => handleAddBlock('paragraph')} className="bg-neutral-900 hover:bg-neutral-800 border border-gray-800 text-white text-[11px] font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer">
                        <FileText className="w-3.5 h-3.5 text-blue-400" /> Text Block
                      </button>
                      <button onClick={() => handleAddBlock('audio')} className="bg-neutral-900 hover:bg-neutral-800 border border-gray-800 text-white text-[11px] font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer">
                        <Music className="w-3.5 h-3.5 text-amber-400" /> Audio Stream
                      </button>
                      <button onClick={() => handleAddBlock('image')} className="bg-neutral-900 hover:bg-neutral-800 border border-gray-800 text-white text-[11px] font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer">
                        <ImageIcon className="w-3.5 h-3.5 text-indigo-400" /> Image
                      </button>
                      <button onClick={() => handleAddBlock('gallery')} className="bg-neutral-900 hover:bg-neutral-800 border border-gray-800 text-white text-[11px] font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Gallery Grid
                      </button>
                      <button onClick={() => handleAddBlock('quiz')} className="bg-neutral-900 hover:bg-neutral-800 border border-gray-800 text-white text-[11px] font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer">
                        <HelpCircle className="w-3.5 h-3.5 text-amber-400" /> Assessment Quiz
                      </button>
                      <button onClick={() => handleAddBlock('worksheet')} className="bg-neutral-900 hover:bg-neutral-800 border border-gray-800 text-white text-[11px] font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer">
                        <CheckSquare className="w-3.5 h-3.5 text-pink-400" /> Practical Task
                      </button>
                      <button onClick={() => handleAddBlock('checklist')} className="bg-neutral-900 hover:bg-neutral-800 border border-gray-800 text-white text-[11px] font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer">
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> Action Checklist
                      </button>
                      <button onClick={() => handleAddBlock('attachment')} className="bg-neutral-900 hover:bg-neutral-800 border border-gray-800 text-white text-[11px] font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer">
                        <Download className="w-3.5 h-3.5 text-blue-400" /> Download PDF
                      </button>
                      <button onClick={() => handleAddBlock('callout')} className="bg-neutral-900 hover:bg-neutral-800 border border-gray-800 text-white text-[11px] font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer">
                        <Info className="w-3.5 h-3.5 text-yellow-400" /> Callout Box
                      </button>
                      <button onClick={() => handleAddBlock('quote')} className="bg-neutral-900 hover:bg-neutral-800 border border-gray-800 text-white text-[11px] font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer">
                        <Quote className="w-3.5 h-3.5 text-amber-300" /> Quote
                      </button>
                      <button onClick={() => handleAddBlock('accordion')} className="bg-neutral-900 hover:bg-neutral-800 border border-gray-800 text-white text-[11px] font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer">
                        <FolderTree className="w-3.5 h-3.5 text-cyan-400" /> Accordion FAQ
                      </button>
                      <button onClick={() => handleAddBlock('code')} className="bg-neutral-900 hover:bg-neutral-800 border border-gray-800 text-white text-[11px] font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer">
                        <Code className="w-3.5 h-3.5 text-emerald-400" /> Script / Code
                      </button>
                    </div>
                  </div>

                  {/* ACTIVE LESSON CONTENT BLOCKS LIST */}
                  <div className="space-y-5">
                    {activeLesson.blocks && activeLesson.blocks.length > 0 ? (
                      activeLesson.blocks.map((block, bIdx) => (
                        <div
                          key={block.id}
                          className="bg-black border border-gray-900 p-5 rounded-2xl space-y-4 shadow-md transition-all"
                        >
                          {/* BLOCK CARD HEADER CONTROLS */}
                          <div className="flex items-center justify-between border-b border-gray-900 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold uppercase text-amber-400 bg-neutral-900 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                                #{bIdx + 1} {block.type}
                              </span>
                            </div>

                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleMoveBlock(bIdx, 'up')}
                                disabled={bIdx === 0}
                                className="p-1 hover:text-white disabled:opacity-20 text-gray-400 cursor-pointer"
                                title="Move Block Up"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleMoveBlock(bIdx, 'down')}
                                disabled={bIdx === (activeLesson?.blocks?.length || 0) - 1}
                                className="p-1 hover:text-white disabled:opacity-20 text-gray-400 cursor-pointer"
                                title="Move Block Down"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDuplicateBlock(block)}
                                className="p-1 hover:text-amber-300 text-gray-400 cursor-pointer"
                                title="Duplicate Block"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteTarget({
                                    type: 'block',
                                    id: block.id,
                                    title: block.title || block.type,
                                  })
                                }
                                className="p-1 text-red-400 hover:text-red-300 cursor-pointer"
                                title="Delete Block"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* BLOCK TITLE */}
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                              Block Title / Header
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Core Principle / Vocal Alignment"
                              value={block.title || ''}
                              onChange={(e) => handleUpdateBlock(block.id, { ...block, title: e.target.value })}
                              className="w-full bg-neutral-950 border border-gray-800 text-white text-xs p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-[#FF2E93]"
                            />
                          </div>

                          {/* 1. PARAGRAPH BLOCK */}
                          {block.type === 'paragraph' && (
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                                Text Narrative Content
                              </label>
                              <textarea
                                rows={4}
                                placeholder="Enter detailed text narrative, frameworks or concepts..."
                                value={block.content || ''}
                                onChange={(e) => handleUpdateBlock(block.id, { ...block, content: e.target.value })}
                                className="w-full bg-neutral-950 border border-gray-800 text-white text-xs p-3 rounded-xl outline-none focus:ring-1 focus:ring-[#FF2E93]"
                              />
                            </div>
                          )}

                          {/* 2. VIDEO BLOCK (WITH POSTER UPLOAD) */}
                          {block.type === 'video' && (
                            <div className="space-y-4 bg-neutral-950 p-4 rounded-xl border border-gray-800">
                              <label className="block text-[11px] font-bold text-amber-300 uppercase">
                                Video Stream & Poster (Cloudflare R2 Direct)
                              </label>

                              {/* LIVE VIDEO PREVIEW */}
                              {block.media_url && (
                                <div className="space-y-2">
                                  <video
                                    src={block.media_url}
                                    poster={block.poster_url || undefined}
                                    controls
                                    className="w-full max-h-56 rounded-xl bg-black border border-gray-800"
                                  />
                                  <p className="text-[10px] font-mono text-gray-400 line-clamp-1">
                                    Video URL/Key: {block.media_url}
                                  </p>
                                </div>
                              )}

                              {/* VIDEO UPLOADER */}
                              <ZivaR2Uploader
                                assetType="video"
                                courseId={course.id || 'general'}
                                lessonId={activeLesson.id}
                                currentUrl={block.media_url || undefined}
                                onUploadSuccess={(res) => {
                                  if (typeof res === 'string') {
                                    handleUpdateBlock(block.id, { ...block, media_url: res });
                                  } else {
                                    handleUpdateBlock(block.id, {
                                      ...block,
                                      media_url: res.url,
                                      metadata: { ...(block.metadata || {}), ...(res.metadata || {}) },
                                    });
                                  }
                                  showToast('Video uploaded via Cloudflare R2!');
                                }}
                                buttonText="Upload Lesson Video to Cloudflare R2"
                              />

                              {/* POSTER / THUMBNAIL UPLOADER */}
                              <div className="pt-2 border-t border-gray-900 space-y-2">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase">
                                  Custom Video Poster / Cover Thumbnail Image
                                </label>
                                {block.poster_url && (
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={block.poster_url}
                                      alt="Poster"
                                      className="w-24 h-14 object-cover rounded-lg border border-gray-800"
                                    />
                                    <button
                                      onClick={() => handleUpdateBlock(block.id, { ...block, poster_url: null })}
                                      className="text-xs text-red-400 hover:underline cursor-pointer"
                                    >
                                      Remove Poster
                                    </button>
                                  </div>
                                )}
                                <ZivaR2Uploader
                                  assetType="image"
                                  courseId={course.id || 'general'}
                                  lessonId={activeLesson.id}
                                  currentUrl={block.poster_url || undefined}
                                  onUploadSuccess={(res) => {
                                    const url = typeof res === 'string' ? res : res.url;
                                    handleUpdateBlock(block.id, { ...block, poster_url: url });
                                    showToast('Video poster updated!');
                                  }}
                                  buttonText="Upload Video Poster Image to R2"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                                  Video Caption / Cue Notes
                                </label>
                                <input
                                  type="text"
                                  value={block.content || ''}
                                  onChange={(e) => handleUpdateBlock(block.id, { ...block, content: e.target.value })}
                                  placeholder="e.g. Watch the vocal posture alignment demonstration"
                                  className="w-full bg-black border border-gray-800 text-white text-xs p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-[#FF2E93]"
                                />
                              </div>
                            </div>
                          )}

                          {/* 3. AUDIO BLOCK */}
                          {block.type === 'audio' && (
                            <div className="space-y-4 bg-neutral-950 p-4 rounded-xl border border-gray-800">
                              <label className="block text-[11px] font-bold text-amber-300 uppercase">
                                Audio Practice Stream (Cloudflare R2)
                              </label>

                              {block.media_url && (
                                <audio controls src={block.media_url} className="w-full" />
                              )}

                              <ZivaR2Uploader
                                assetType="audio"
                                courseId={course.id || 'general'}
                                lessonId={activeLesson.id}
                                currentUrl={block.media_url || undefined}
                                onUploadSuccess={(res) => {
                                  const url = typeof res === 'string' ? res : res.url;
                                  handleUpdateBlock(block.id, { ...block, media_url: url });
                                  showToast('Audio uploaded via Cloudflare R2!');
                                }}
                                buttonText="Upload Audio Track to Cloudflare R2"
                              />

                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                                  Audio Guidance / Transcript
                                </label>
                                <textarea
                                  rows={2}
                                  value={block.content || ''}
                                  onChange={(e) => handleUpdateBlock(block.id, { ...block, content: e.target.value })}
                                  placeholder="Instructions or transcript for this audio session..."
                                  className="w-full bg-black border border-gray-800 text-white text-xs p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-[#FF2E93]"
                                />
                              </div>
                            </div>
                          )}

                          {/* 4. SINGLE IMAGE BLOCK */}
                          {block.type === 'image' && (
                            <div className="space-y-4 bg-neutral-950 p-4 rounded-xl border border-gray-800">
                              <label className="block text-[11px] font-bold text-amber-300 uppercase">
                                Diagram & Visual Resource (Cloudflare R2)
                              </label>

                              {block.media_url && (
                                <img
                                  src={block.media_url}
                                  alt={block.title || 'Diagram'}
                                  className="max-h-56 w-auto rounded-xl object-cover border border-gray-800"
                                />
                              )}

                              <ZivaR2Uploader
                                assetType="image"
                                courseId={course.id || 'general'}
                                lessonId={activeLesson.id}
                                currentUrl={block.media_url || undefined}
                                onUploadSuccess={(res) => {
                                  const url = typeof res === 'string' ? res : res.url;
                                  handleUpdateBlock(block.id, { ...block, media_url: url });
                                  showToast('Image uploaded via Cloudflare R2!');
                                }}
                                buttonText="Upload Diagram / Image to Cloudflare R2"
                              />

                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                                  Image Caption
                                </label>
                                <input
                                  type="text"
                                  value={block.content || ''}
                                  onChange={(e) => handleUpdateBlock(block.id, { ...block, content: e.target.value })}
                                  placeholder="e.g. Diaphragmatic breathing mechanics diagram"
                                  className="w-full bg-black border border-gray-800 text-white text-xs p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-[#FF2E93]"
                                />
                              </div>
                            </div>
                          )}

                          {/* 5. MULTI-IMAGE GALLERY BLOCK */}
                          {block.type === 'gallery' && (
                            <div className="space-y-4 bg-neutral-950 p-4 rounded-xl border border-gray-800">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-bold text-amber-300 uppercase">
                                  Gallery Images Grid
                                </label>
                                <span className="text-[10px] text-gray-400">
                                  {(block.gallery_images || []).length} images
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {(block.gallery_images || []).map((img, imgIdx) => (
                                  <div key={imgIdx} className="bg-black p-2.5 rounded-xl border border-gray-800 space-y-2">
                                    <img
                                      src={img.url}
                                      alt="Gallery item"
                                      className="w-full h-28 object-cover rounded-lg"
                                    />
                                    <input
                                      type="text"
                                      value={img.caption || ''}
                                      onChange={(e) => {
                                        const newImgs = [...(block.gallery_images || [])];
                                        newImgs[imgIdx] = { ...newImgs[imgIdx], caption: e.target.value };
                                        handleUpdateBlock(block.id, { ...block, gallery_images: newImgs });
                                      }}
                                      placeholder="Caption..."
                                      className="w-full bg-neutral-900 border border-gray-700 text-[11px] text-white p-1.5 rounded outline-none"
                                    />
                                    <button
                                      onClick={() => {
                                        const newImgs = (block.gallery_images || []).filter((_, i) => i !== imgIdx);
                                        handleUpdateBlock(block.id, { ...block, gallery_images: newImgs });
                                      }}
                                      className="text-[10px] text-red-400 hover:underline"
                                    >
                                      Remove Image
                                    </button>
                                  </div>
                                ))}
                              </div>

                              <ZivaR2Uploader
                                assetType="image"
                                courseId={course.id || 'general'}
                                lessonId={activeLesson.id}
                                onUploadSuccess={(res) => {
                                  const url = typeof res === 'string' ? res : res.url;
                                  const newImgs = [...(block.gallery_images || []), { url, caption: '' }];
                                  handleUpdateBlock(block.id, { ...block, gallery_images: newImgs });
                                  showToast('Added image to gallery!');
                                }}
                                buttonText="Upload New Image to Gallery (R2)"
                              />
                            </div>
                          )}

                          {/* 6. QUIZ BLOCK */}
                          {block.type === 'quiz' && (
                            <div className="space-y-4 bg-neutral-950 p-4 rounded-xl border border-amber-500/30">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-bold text-amber-300 uppercase flex items-center gap-1.5">
                                  <HelpCircle className="w-4 h-4 text-amber-400" />
                                  <span>Assessment Questions ({block.questions?.length || 0})</span>
                                </label>
                                <button
                                  onClick={() => {
                                    const newQ = {
                                      id: 'q_' + Date.now(),
                                      question: 'New question prompt...',
                                      options: ['Option A', 'Option B', 'Option C', 'Option D'],
                                      correctAnswer: 0,
                                      explanation: 'Explanation for correct answer...',
                                    };
                                    handleUpdateBlock(block.id, {
                                      ...block,
                                      questions: [...(block.questions || []), newQ],
                                    });
                                  }}
                                  className="text-[11px] text-[#FF2E93] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Add Question
                                </button>
                              </div>

                              <div className="space-y-4">
                                {block.questions?.map((q, qIdx) => (
                                  <div key={q.id || qIdx} className="bg-black p-4 rounded-xl border border-gray-800 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] font-bold text-amber-300">Question #{qIdx + 1}</span>
                                      <button
                                        onClick={() => {
                                          const updatedQs = block.questions?.filter((_, i) => i !== qIdx);
                                          handleUpdateBlock(block.id, { ...block, questions: updatedQs });
                                        }}
                                        className="text-[10px] text-red-400 hover:underline cursor-pointer"
                                      >
                                        Delete Question
                                      </button>
                                    </div>

                                    <input
                                      type="text"
                                      value={q.question}
                                      onChange={(e) => {
                                        const updatedQs = [...(block.questions || [])];
                                        updatedQs[qIdx] = { ...updatedQs[qIdx], question: e.target.value };
                                        handleUpdateBlock(block.id, { ...block, questions: updatedQs });
                                      }}
                                      placeholder="Question prompt..."
                                      className="w-full bg-neutral-900 border border-gray-700 text-white text-xs p-2 rounded-lg outline-none"
                                    />

                                    <div className="space-y-2">
                                      <label className="block text-[10px] font-bold text-gray-400 uppercase">
                                        Answer Options (Select the radio for correct answer)
                                      </label>
                                      {q.options.map((opt, oIdx) => (
                                        <div key={oIdx} className="flex items-center gap-2">
                                          <input
                                            type="radio"
                                            name={`correct_${block.id}_${qIdx}`}
                                            checked={q.correctAnswer === oIdx}
                                            onChange={() => {
                                              const updatedQs = [...(block.questions || [])];
                                              updatedQs[qIdx] = { ...updatedQs[qIdx], correctAnswer: oIdx };
                                              handleUpdateBlock(block.id, { ...block, questions: updatedQs });
                                            }}
                                            className="accent-[#FF2E93] w-3.5 h-3.5"
                                          />
                                          <input
                                            type="text"
                                            value={opt}
                                            onChange={(e) => {
                                              const updatedQs = [...(block.questions || [])];
                                              const opts = [...updatedQs[qIdx].options];
                                              opts[oIdx] = e.target.value;
                                              updatedQs[qIdx] = { ...updatedQs[qIdx], options: opts };
                                              handleUpdateBlock(block.id, { ...block, questions: updatedQs });
                                            }}
                                            className="flex-1 bg-neutral-900 border border-gray-700 text-white text-xs p-1.5 rounded-lg outline-none"
                                          />
                                        </div>
                                      ))}
                                    </div>

                                    <input
                                      type="text"
                                      value={q.explanation || ''}
                                      onChange={(e) => {
                                        const updatedQs = [...(block.questions || [])];
                                        updatedQs[qIdx] = { ...updatedQs[qIdx], explanation: e.target.value };
                                        handleUpdateBlock(block.id, { ...block, questions: updatedQs });
                                      }}
                                      placeholder="Explanation of correct answer..."
                                      className="w-full bg-neutral-900 border border-gray-700 text-gray-300 text-[11px] p-2 rounded-lg outline-none"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 7. PRACTICAL WORKSHEET / TASK BLOCK */}
                          {block.type === 'worksheet' && (
                            <div className="space-y-4 bg-neutral-950 p-4 rounded-xl border border-pink-500/30">
                              <label className="block text-[11px] font-bold text-pink-400 uppercase">
                                Practical Action Task & Worksheet
                              </label>

                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                                  Task Objective & Prompt
                                </label>
                                <textarea
                                  rows={2}
                                  value={block.content || ''}
                                  onChange={(e) => handleUpdateBlock(block.id, { ...block, content: e.target.value })}
                                  placeholder="What must the student execute in this practice session?"
                                  className="w-full bg-black border border-gray-800 text-white text-xs p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-[#FF2E93]"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                                  Step-by-Step Instructions
                                </label>
                                <textarea
                                  rows={3}
                                  value={block.worksheet_data?.instructions || ''}
                                  onChange={(e) => {
                                    handleUpdateBlock(block.id, {
                                      ...block,
                                      worksheet_data: {
                                        ...(block.worksheet_data || {}),
                                        instructions: e.target.value,
                                      },
                                    });
                                  }}
                                  placeholder="1. Record a 60-second video\n2. Note your vocal pacing..."
                                  className="w-full bg-black border border-gray-800 text-white text-xs p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-[#FF2E93]"
                                />
                              </div>

                              {/* DOWNLOADABLE TEMPLATE FILE */}
                              <div className="space-y-2 pt-2 border-t border-gray-900">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase">
                                  Optional Worksheet Template File (R2)
                                </label>
                                {block.worksheet_data?.template_url && (
                                  <div className="flex items-center justify-between p-2 bg-black rounded-lg border border-gray-800 text-xs text-amber-300">
                                    <span className="truncate">{block.worksheet_data.template_name || block.worksheet_data.template_url}</span>
                                    <button
                                      onClick={() => {
                                        handleUpdateBlock(block.id, {
                                          ...block,
                                          worksheet_data: {
                                            ...(block.worksheet_data || {}),
                                            template_url: undefined,
                                            template_name: undefined,
                                          },
                                        });
                                      }}
                                      className="text-red-400 hover:underline ml-2 shrink-0"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                )}
                                <ZivaR2Uploader
                                  assetType="document"
                                  courseId={course.id || 'general'}
                                  lessonId={activeLesson.id}
                                  onUploadSuccess={(res) => {
                                    const url = typeof res === 'string' ? res : res.url;
                                    const name = typeof res === 'object' ? res.fileName : 'Worksheet_Template.pdf';
                                    handleUpdateBlock(block.id, {
                                      ...block,
                                      worksheet_data: {
                                        ...(block.worksheet_data || {}),
                                        template_url: url,
                                        template_name: name,
                                      },
                                    });
                                    showToast('Worksheet template uploaded!');
                                  }}
                                  buttonText="Upload Worksheet Template (R2 PDF/Doc)"
                                />
                              </div>
                            </div>
                          )}

                          {/* 8. CHECKLIST BLOCK */}
                          {block.type === 'checklist' && (
                            <div className="space-y-4 bg-neutral-950 p-4 rounded-xl border border-gray-800">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-bold text-emerald-400 uppercase">
                                  Action Checklist Items
                                </label>
                                <button
                                  onClick={() => {
                                    const newItems = [
                                      ...(block.checklist_items || []),
                                      { id: 'c_' + Date.now(), text: 'New habit / action item', is_checked: false },
                                    ];
                                    handleUpdateBlock(block.id, { ...block, checklist_items: newItems });
                                  }}
                                  className="text-[11px] text-[#FF2E93] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Add Item
                                </button>
                              </div>

                              <div className="space-y-2">
                                {(block.checklist_items || []).map((item, cIdx) => (
                                  <div key={item.id || cIdx} className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={item.text}
                                      onChange={(e) => {
                                        const newItems = [...(block.checklist_items || [])];
                                        newItems[cIdx] = { ...newItems[cIdx], text: e.target.value };
                                        handleUpdateBlock(block.id, { ...block, checklist_items: newItems });
                                      }}
                                      className="flex-1 bg-black border border-gray-700 text-white text-xs p-2 rounded-lg outline-none"
                                    />
                                    <button
                                      onClick={() => {
                                        const newItems = (block.checklist_items || []).filter((_, i) => i !== cIdx);
                                        handleUpdateBlock(block.id, { ...block, checklist_items: newItems });
                                      }}
                                      className="text-red-400 hover:text-red-300 p-1"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 9. ATTACHMENT / DOWNLOAD BLOCK */}
                          {block.type === 'attachment' && (
                            <div className="space-y-4 bg-neutral-950 p-4 rounded-xl border border-gray-800">
                              <label className="block text-[11px] font-bold text-blue-400 uppercase">
                                Downloadable Resource / PDF File (Cloudflare R2)
                              </label>

                              {block.media_url && (
                                <div className="p-3 bg-black rounded-lg border border-gray-800 flex items-center justify-between text-xs text-blue-300">
                                  <div className="flex items-center gap-2 truncate">
                                    <Download className="w-4 h-4 text-pink-500 shrink-0" />
                                    <span className="truncate">{block.file_name || block.media_url}</span>
                                  </div>
                                  {block.file_size && (
                                    <span className="text-[10px] bg-neutral-900 px-2 py-0.5 rounded text-gray-400 shrink-0 ml-2">
                                      {block.file_size}
                                    </span>
                                  )}
                                </div>
                              )}

                              <ZivaR2Uploader
                                assetType="document"
                                courseId={course.id || 'general'}
                                lessonId={activeLesson.id}
                                currentUrl={block.media_url || undefined}
                                onUploadSuccess={(res) => {
                                  if (typeof res === 'string') {
                                    handleUpdateBlock(block.id, { ...block, media_url: res });
                                  } else {
                                    handleUpdateBlock(block.id, {
                                      ...block,
                                      media_url: res.url,
                                      file_name: res.fileName || block.file_name,
                                      file_size: res.fileSize || block.file_size,
                                    });
                                  }
                                  showToast('Resource file uploaded via Cloudflare R2!');
                                }}
                                buttonText="Upload Document / PDF to Cloudflare R2"
                              />
                            </div>
                          )}

                          {/* 10. CALLOUT BLOCK */}
                          {block.type === 'callout' && (
                            <div className="space-y-3 bg-neutral-950 p-4 rounded-xl border border-gray-800">
                              <div className="flex items-center gap-4">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Callout Type:</label>
                                <select
                                  value={block.callout_type || 'info'}
                                  onChange={(e) => handleUpdateBlock(block.id, { ...block, callout_type: e.target.value as any })}
                                  className="bg-black border border-gray-700 text-white text-xs p-1.5 rounded-lg outline-none"
                                >
                                  <option value="info">Info</option>
                                  <option value="tip">Tip</option>
                                  <option value="warning">Warning</option>
                                  <option value="success">Success</option>
                                  <option value="principle">Executive Principle</option>
                                </select>
                              </div>

                              <textarea
                                rows={2}
                                value={block.content || ''}
                                onChange={(e) => handleUpdateBlock(block.id, { ...block, content: e.target.value })}
                                placeholder="Callout message text..."
                                className="w-full bg-black border border-gray-800 text-white text-xs p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-[#FF2E93]"
                              />
                            </div>
                          )}

                          {/* 11. QUOTE BLOCK */}
                          {block.type === 'quote' && (
                            <div className="space-y-3 bg-neutral-950 p-4 rounded-xl border border-amber-500/30">
                              <div>
                                <label className="block text-[10px] font-bold text-amber-300 uppercase mb-1">Quote Text</label>
                                <textarea
                                  rows={2}
                                  value={block.content || ''}
                                  onChange={(e) => handleUpdateBlock(block.id, { ...block, content: e.target.value })}
                                  placeholder="Enter inspiring executive quote..."
                                  className="w-full bg-black border border-gray-800 text-amber-200 font-serif italic text-xs p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-[#FF2E93]"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Quote Attribution / Author</label>
                                <input
                                  type="text"
                                  value={block.quote_author || ''}
                                  onChange={(e) => handleUpdateBlock(block.id, { ...block, quote_author: e.target.value })}
                                  placeholder="e.g. Meharr"
                                  className="w-full bg-black border border-gray-800 text-white text-xs p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-[#FF2E93]"
                                />
                              </div>
                            </div>
                          )}

                          {/* 12. ACCORDION / FAQ BLOCK */}
                          {block.type === 'accordion' && (
                            <div className="space-y-4 bg-neutral-950 p-4 rounded-xl border border-gray-800">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-bold text-cyan-400 uppercase">
                                  Accordion & FAQ Items
                                </label>
                                <button
                                  onClick={() => {
                                    const newItems = [
                                      ...(block.accordion_items || []),
                                      { title: 'New Question / Insight', content: 'Detailed explanation...' },
                                    ];
                                    handleUpdateBlock(block.id, { ...block, accordion_items: newItems });
                                  }}
                                  className="text-[11px] text-[#FF2E93] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Add Item
                                </button>
                              </div>

                              <div className="space-y-3">
                                {(block.accordion_items || []).map((item, aIdx) => (
                                  <div key={aIdx} className="bg-black p-3 rounded-xl border border-gray-800 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <input
                                        type="text"
                                        value={item.title}
                                        onChange={(e) => {
                                          const newItems = [...(block.accordion_items || [])];
                                          newItems[aIdx] = { ...newItems[aIdx], title: e.target.value };
                                          handleUpdateBlock(block.id, { ...block, accordion_items: newItems });
                                        }}
                                        placeholder="Item Title / Question..."
                                        className="flex-1 bg-neutral-900 border border-gray-700 text-white text-xs p-2 rounded-lg outline-none"
                                      />
                                      <button
                                        onClick={() => {
                                          const newItems = (block.accordion_items || []).filter((_, i) => i !== aIdx);
                                          handleUpdateBlock(block.id, { ...block, accordion_items: newItems });
                                        }}
                                        className="text-red-400 hover:text-red-300 ml-2"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    <textarea
                                      rows={2}
                                      value={item.content}
                                      onChange={(e) => {
                                        const newItems = [...(block.accordion_items || [])];
                                        newItems[aIdx] = { ...newItems[aIdx], content: e.target.value };
                                        handleUpdateBlock(block.id, { ...block, accordion_items: newItems });
                                      }}
                                      placeholder="Item Content..."
                                      className="w-full bg-neutral-900 border border-gray-700 text-gray-300 text-xs p-2 rounded-lg outline-none"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 13. CODE BLOCK */}
                          {block.type === 'code' && (
                            <div className="space-y-3 bg-neutral-950 p-4 rounded-xl border border-gray-800">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Code / Scripting Language</label>
                                <input
                                  type="text"
                                  value={block.code_language || 'typescript'}
                                  onChange={(e) => handleUpdateBlock(block.id, { ...block, code_language: e.target.value })}
                                  placeholder="e.g. typescript, python, json"
                                  className="bg-black border border-gray-700 text-xs text-white p-1 rounded font-mono"
                                />
                              </div>

                              <textarea
                                rows={4}
                                value={block.content || ''}
                                onChange={(e) => handleUpdateBlock(block.id, { ...block, content: e.target.value })}
                                placeholder="// Code or script snippet..."
                                className="w-full bg-black border border-gray-800 text-emerald-400 text-xs p-3 rounded-xl font-mono outline-none focus:ring-1 focus:ring-[#FF2E93]"
                              />
                            </div>
                          )}

                        </div>
                      ))
                    ) : (
                      <div className="py-14 text-center text-gray-500 bg-black rounded-2xl border border-gray-900 space-y-2">
                        <p className="text-xs">No content blocks in this lesson yet.</p>
                        <button
                          onClick={() => setIsBlockPickerOpen(true)}
                          className="text-xs font-bold text-[#FF2E93] hover:underline cursor-pointer"
                        >
                          + Add your first content block
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                <div className="py-24 text-center text-gray-500 space-y-2">
                  <p className="text-sm">Select a lesson from the left curriculum tree to edit content blocks.</p>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </ZivaLayout>
  );
};
