import React, { useState, useEffect, useRef } from 'react';
import { Lesson } from '../../../models/lesson';
import {
  LessonBlock,
  LessonBlockType,
  CreateLessonBlockInput,
  LessonBlockReorderItem,
} from '../../../models/lessonBlock';
import { lessonBlockService } from '../../../services/lessonBlockService';
import { lessonService } from '../../../services/lessonService';
import { storageService } from '../../../services/storageService';
import { QuizBlock } from '../../../components/QuizBlock';
import { MediaPicker, MediaType } from '../../../components/MediaPicker';
import {
  FileText,
  Video,
  Music,
  Image as ImageIcon,
  Images,
  Quote,
  AlertCircle,
  CheckSquare,
  HelpCircle,
  Code,
  Minus,
  Download,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Edit3,
  Save,
  Clock,
  Eye,
  EyeOff,
  Lock,
  LockOpen,
  Sparkles,
  ExternalLink,
  Check,
  X,
  Heading,
  AlignLeft,
  GripVertical,
  Copy,
  SquareChevronRight,
  MousePointer,
  Lightbulb,
  BookOpen,
  HeartHandshake,
  ClipboardList,
  Search,
  Loader2,
  Maximize2,
  Minimize2,
  Command,
  Send,
  Info,
} from 'lucide-react';

interface LessonBlockEditorProps {
  lesson: Lesson;
  onRefreshLesson: () => void;
  isStudentPreview?: boolean;
}

interface BlockTypeOption {
  type: LessonBlockType;
  label: string;
  category: 'Text' | 'Media' | 'Interactive' | 'Structure';
  icon: React.ElementType;
  description: string;
  defaultTitle: string;
  defaultContent: string;
  defaultMediaUrl: string;
  defaultMetadata: Record<string, any>;
}

const BLOCK_TYPE_OPTIONS: BlockTypeOption[] = [
  {
    type: 'heading',
    label: 'Heading',
    category: 'Text',
    icon: Heading,
    description: 'Section heading or main topic title',
    defaultTitle: 'Module Key Concepts',
    defaultContent: 'Topic overview or summary context',
    defaultMediaUrl: '',
    defaultMetadata: { level: 2 },
  },
  {
    type: 'paragraph',
    label: 'Paragraph',
    category: 'Text',
    icon: AlignLeft,
    description: 'Plain body text and narrative content',
    defaultTitle: '',
    defaultContent:
      'Type your lesson content, instructions, or narrative here. Supports detailed explanations and step-by-step guidance.',
    defaultMediaUrl: '',
    defaultMetadata: {},
  },
  {
    type: 'image',
    label: 'Image',
    category: 'Media',
    icon: ImageIcon,
    description: 'Single image with optional title and caption',
    defaultTitle: 'Visual Illustration',
    defaultContent: 'Caption explaining the visual diagram above',
    defaultMediaUrl:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80',
    defaultMetadata: {},
  },
  {
    type: 'gallery',
    label: 'Image Gallery',
    category: 'Media',
    icon: Images,
    description: 'Grid layout of multiple images',
    defaultTitle: 'Course Gallery',
    defaultContent:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80\nhttps://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80\nhttps://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80',
    defaultMediaUrl: '',
    defaultMetadata: {},
  },
  {
    type: 'video',
    label: 'Video Player',
    category: 'Media',
    icon: Video,
    description: 'Embed video from YouTube, Vimeo, or direct MP4 URL',
    defaultTitle: 'Lesson Video Tutorial',
    defaultContent: 'Watch this tutorial carefully before proceeding.',
    defaultMediaUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    defaultMetadata: {},
  },
  {
    type: 'audio',
    label: 'Audio Clip',
    category: 'Media',
    icon: Music,
    description: 'Guided audio practice, lecture, or podcast stream',
    defaultTitle: 'Guided Audio Meditation',
    defaultContent: 'Listen to this 5-minute audio recording with headphones.',
    defaultMediaUrl:
      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    defaultMetadata: {},
  },
  {
    type: 'pdf',
    label: 'PDF Document',
    category: 'Media',
    icon: FileText,
    description: 'Embed PDF viewer or downloadable reference sheet',
    defaultTitle: 'Module Worksheet & PDF Guide',
    defaultContent: 'Download or view the official course worksheet.',
    defaultMediaUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    defaultMetadata: {},
  },
  {
    type: 'download',
    label: 'Resource Download',
    category: 'Media',
    icon: Download,
    description: 'Downloadable attachment or template file',
    defaultTitle: 'Starter Template Pack (.ZIP)',
    defaultContent: 'Includes source code, cheat sheets, and starter assets.',
    defaultMediaUrl: 'https://example.com/assets/starter-pack.zip',
    defaultMetadata: { fileSize: '14.2 MB' },
  },
  {
    type: 'quote',
    label: 'Quote',
    category: 'Text',
    icon: Quote,
    description: 'Inspirational quote or key highlight block',
    defaultTitle: 'Albert Einstein',
    defaultContent: '“Learning is experience. Everything else is just information.”',
    defaultMediaUrl: '',
    defaultMetadata: {},
  },
  {
    type: 'divider',
    label: 'Divider',
    category: 'Structure',
    icon: Minus,
    description: 'Visual separator rule between lesson topics',
    defaultTitle: '',
    defaultContent: '',
    defaultMediaUrl: '',
    defaultMetadata: {},
  },
  {
    type: 'callout',
    label: 'Callout Note',
    category: 'Text',
    icon: AlertCircle,
    description: 'Highlighted callout box for tips, warnings, or notes',
    defaultTitle: 'Important Pro Tip',
    defaultContent:
      'Always double-check your environment configuration before publishing your changes.',
    defaultMediaUrl: '',
    defaultMetadata: { variant: 'info' },
  },
  {
    type: 'accordion',
    label: 'Accordion',
    category: 'Structure',
    icon: SquareChevronRight,
    description: 'Collapsible Q&A or expandable deep-dive content',
    defaultTitle: 'Frequently Asked Questions',
    defaultContent:
      'Expand this block to read detailed troubleshooting steps and edge cases.',
    defaultMediaUrl: '',
    defaultMetadata: {},
  },
  {
    type: 'button',
    label: 'Action Button',
    category: 'Interactive',
    icon: MousePointer,
    description: 'Clickable call-to-action button or link',
    defaultTitle: 'Open External Workspace',
    defaultContent: 'Click to open the interactive sandbox environment.',
    defaultMediaUrl: 'https://github.com',
    defaultMetadata: { variant: 'indigo' },
  },
  {
    type: 'quiz',
    label: 'Interactive Quiz',
    category: 'Interactive',
    icon: HelpCircle,
    description: 'Knowledge check with multiple choice, true/false, or short answer',
    defaultTitle: 'What is the primary benefit of centralized state management?',
    defaultContent: 'Test your understanding before proceeding to the next topic.',
    defaultMediaUrl: '',
    defaultMetadata: {
      question_type: 'multiple_choice',
      options: [
        'Centralized data flow and predictable state updates',
        'Faster raw network download speeds',
        'Automatic server deployment',
        'Offline database auto-compilation',
      ],
      correct_index: 0,
      correct_indices: [0],
      correct_boolean: true,
      correct_short_answer: '',
      explanation: 'Centralized state management ensures a predictable, single source of truth across components.',
      passing_score: 80,
      shuffle_answers: false,
      points: 10,
    },
  },
  {
    type: 'reflection',
    label: 'Reflection Prompt',
    category: 'Interactive',
    icon: Lightbulb,
    description: 'Thought-provoking prompt with student response area',
    defaultTitle: 'Self-Reflection',
    defaultContent: 'How will you apply today’s lesson concepts to your current project?',
    defaultMediaUrl: '',
    defaultMetadata: {},
  },
  {
    type: 'journal',
    label: 'Journal Entry',
    category: 'Interactive',
    icon: BookOpen,
    description: 'Private writing prompt and response log for students',
    defaultTitle: 'Daily Learning Journal',
    defaultContent: 'Write down 3 key takeaways you discovered from this module.',
    defaultMediaUrl: '',
    defaultMetadata: {},
  },
  {
    type: 'affirmation',
    label: 'Affirmation Card',
    category: 'Interactive',
    icon: HeartHandshake,
    description: 'Empowering quote or daily growth mindset card',
    defaultTitle: 'Daily Growth Mindset',
    defaultContent: 'I am capable of mastering complex skills through persistent daily practice.',
    defaultMediaUrl: '',
    defaultMetadata: {},
  },
  {
    type: 'assignment',
    label: 'Assignment Task',
    category: 'Interactive',
    icon: ClipboardList,
    description: 'Hands-on assignment with submission guidelines',
    defaultTitle: 'Module Project Submission',
    defaultContent:
      'Submit your completed project repository URL or submission summary below.',
    defaultMediaUrl: '',
    defaultMetadata: { points: 100 },
  },
  {
    type: 'checklist',
    label: 'Checklist',
    category: 'Interactive',
    icon: CheckSquare,
    description: 'Interactive list of actionable tasks or steps',
    defaultTitle: 'Lesson Checklist',
    defaultContent:
      'Review lecture video\nDownload starter files\nComplete self-reflection prompt\nSubmit final assignment',
    defaultMediaUrl: '',
    defaultMetadata: {},
  },
  {
    type: 'embed',
    label: 'Embed / iFrame',
    category: 'Media',
    icon: Code,
    description: 'Embed external website, Figma prototype, or interactive tool',
    defaultTitle: 'Interactive iFrame Embed',
    defaultContent: '',
    defaultMediaUrl: 'https://wikipedia.org',
    defaultMetadata: {},
  },
];

export const LessonBlockEditor: React.FC<LessonBlockEditorProps> = ({
  lesson,
  onRefreshLesson,
  isStudentPreview = false,
}) => {
  const [blocks, setBlocks] = useState<LessonBlock[]>([]);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(true);

  // Lesson Header Editing State
  const [isEditingLessonHeader, setIsEditingLessonHeader] = useState(false);
  const [lessonTitle, setLessonTitle] = useState(lesson.title);
  const [lessonDuration, setLessonDuration] = useState(lesson.estimated_duration || 10);
  const [lessonIsPreview, setLessonIsPreview] = useState(lesson.is_preview || false);
  const [lessonIsLocked, setLessonIsLocked] = useState(lesson.is_locked || false);

  // Active Block Edit State
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editBlockTitle, setEditBlockTitle] = useState('');
  const [editBlockContent, setEditBlockContent] = useState('');
  const [editBlockMediaUrl, setEditBlockMediaUrl] = useState('');
  const [editBlockIsRequired, setEditBlockIsRequired] = useState(false);
  const [editBlockMetadata, setEditBlockMetadata] = useState<Record<string, any>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Collapse / Expand State
  const [collapsedBlockIds, setCollapsedBlockIds] = useState<Set<string>>(new Set());

  // Add Block Menu / Slash Palette
  const [showAddBlockMenu, setShowAddBlockMenu] = useState(false);
  const [blockSearchQuery, setBlockSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isSavingBlock, setIsSavingBlock] = useState(false);

  // Drag and drop state
  const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null);
  const [dragOverBlockIndex, setDragOverBlockIndex] = useState<number | null>(null);

  // Student Responses state (for Interactive blocks)
  const [studentResponses, setStudentResponses] = useState<Record<string, string>>({});
  const [quizSelection, setQuizSelection] = useState<Record<string, number>>({});
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadBlocks = async () => {
    setIsLoadingBlocks(true);
    const { data } = await lessonBlockService.getBlocksByLesson(lesson.id);
    setBlocks(data || []);
    setIsLoadingBlocks(false);
  };

  useEffect(() => {
    setLessonTitle(lesson.title);
    setLessonDuration(lesson.estimated_duration || 10);
    setLessonIsPreview(lesson.is_preview || false);
    setLessonIsLocked(lesson.is_locked || false);
    loadBlocks();
  }, [lesson.id]);

  // Keyboard Shortcuts (Cmd+S, Esc, Alt+Up/Down, Cmd+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+S or Ctrl+S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (editingBlockId) {
          handleSaveBlock(editingBlockId);
        } else if (isEditingLessonHeader) {
          handleSaveLessonHeader();
        }
      }
      // Escape to close edit mode or add menu
      if (e.key === 'Escape') {
        if (showAddBlockMenu) setShowAddBlockMenu(false);
        if (editingBlockId) setEditingBlockId(null);
        if (isEditingLessonHeader) setIsEditingLessonHeader(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingBlockId, isEditingLessonHeader, showAddBlockMenu, editBlockTitle, editBlockContent, editBlockMediaUrl, editBlockIsRequired, editBlockMetadata]);

  // Save Lesson Header Details
  const handleSaveLessonHeader = async () => {
    await lessonService.updateLesson(lesson.id, {
      title: lessonTitle.trim(),
      estimated_duration: lessonDuration,
      is_preview: lessonIsPreview,
      is_locked: lessonIsLocked,
    });
    setIsEditingLessonHeader(false);
    onRefreshLesson();
  };

  // Create Block
  const handleCreateBlock = async (type: LessonBlockType) => {
    setIsSavingBlock(true);
    const option = BLOCK_TYPE_OPTIONS.find((opt) => opt.type === type);

    const nextOrder =
      blocks.length > 0 ? Math.max(...blocks.map((b) => b.display_order)) + 1 : 0;

    const newBlock: CreateLessonBlockInput = {
      lesson_id: lesson.id,
      type,
      title: option?.defaultTitle || 'New Content Block',
      content: option?.defaultContent || '',
      media_url: option?.defaultMediaUrl || '',
      display_order: nextOrder,
      is_required: false,
      metadata: option?.defaultMetadata || {},
    };

    const { data } = await lessonBlockService.createBlock(newBlock);
    setIsSavingBlock(false);
    setShowAddBlockMenu(false);
    setBlockSearchQuery('');
    loadBlocks();

    if (data) {
      handleStartEditBlock(data);
    }
  };

  // Duplicate Block
  const handleDuplicateBlock = async (block: LessonBlock) => {
    setIsSavingBlock(true);
    const nextOrder = block.display_order + 1;

    // Shift display orders of subsequent blocks
    const itemsToShift: LessonBlockReorderItem[] = blocks.map((b) => ({
      id: b.id,
      display_order: b.display_order >= nextOrder ? b.display_order + 1 : b.display_order,
    }));
    await lessonBlockService.reorderBlocks(lesson.id, itemsToShift);

    const duplicatedInput: CreateLessonBlockInput = {
      lesson_id: lesson.id,
      type: block.type,
      title: block.title ? `${block.title} (Copy)` : 'Copied Block',
      content: block.content || '',
      media_url: block.media_url || '',
      display_order: nextOrder,
      is_required: block.is_required || false,
      metadata: block.metadata ? { ...block.metadata } : {},
    };

    await lessonBlockService.createBlock(duplicatedInput);
    setIsSavingBlock(false);
    loadBlocks();
  };

  // Start Editing Block
  const handleStartEditBlock = (block: LessonBlock) => {
    setEditingBlockId(block.id);
    setEditBlockTitle(block.title || '');
    setEditBlockContent(block.content || '');
    setEditBlockMediaUrl(block.media_url || '');
    setEditBlockIsRequired(block.is_required || false);
    setEditBlockMetadata(block.metadata || {});
    setSaveStatus('idle');
  };

  // Auto-Save Block Changes
  const autoSaveBlock = async (
    id: string,
    title: string,
    content: string,
    mediaUrl: string,
    isRequired: boolean,
    metadata: Record<string, any>
  ) => {
    setSaveStatus('saving');
    await lessonBlockService.updateBlock(id, {
      title,
      content,
      media_url: mediaUrl,
      is_required: isRequired,
      metadata,
    });
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
    loadBlocks();
  };

  const handleTitleChange = (newTitle: string) => {
    setEditBlockTitle(newTitle);
    setSaveStatus('idle');
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      if (editingBlockId) {
        autoSaveBlock(
          editingBlockId,
          newTitle,
          editBlockContent,
          editBlockMediaUrl,
          editBlockIsRequired,
          editBlockMetadata
        );
      }
    }, 600);
  };

  const handleContentChange = (newContent: string) => {
    setEditBlockContent(newContent);
    setSaveStatus('idle');
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      if (editingBlockId) {
        autoSaveBlock(
          editingBlockId,
          editBlockTitle,
          newContent,
          editBlockMediaUrl,
          editBlockIsRequired,
          editBlockMetadata
        );
      }
    }, 600);
  };

  const handleMediaUrlChange = (newMediaUrl: string) => {
    setEditBlockMediaUrl(newMediaUrl);
    setSaveStatus('idle');
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      if (editingBlockId) {
        autoSaveBlock(
          editingBlockId,
          editBlockTitle,
          editBlockContent,
          newMediaUrl,
          editBlockIsRequired,
          editBlockMetadata
        );
      }
    }, 600);
  };

  // Manual Save Block
  const handleSaveBlock = async (id: string) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setIsSavingBlock(true);
    await lessonBlockService.updateBlock(id, {
      title: editBlockTitle,
      content: editBlockContent,
      media_url: editBlockMediaUrl,
      is_required: editBlockIsRequired,
      metadata: editBlockMetadata,
    });
    setIsSavingBlock(false);
    setEditingBlockId(null);
    loadBlocks();
  };

  // Delete Block
  const handleDeleteBlock = async (id: string) => {
    if (confirm('Are you sure you want to delete this block?')) {
      await lessonBlockService.deleteBlock(id);
      if (editingBlockId === id) setEditingBlockId(null);
      loadBlocks();
    }
  };

  // Collapse / Expand Toggles
  const toggleCollapseBlock = (id: string) => {
    setCollapsedBlockIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAllBlocks = () => setCollapsedBlockIds(new Set());
  const collapseAllBlocks = () =>
    setCollapsedBlockIds(new Set(blocks.map((b) => b.id)));

  // Move Block Up or Down
  const handleMoveBlock = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;

    const items: LessonBlockReorderItem[] = blocks.map((b, i) => {
      if (i === index) return { id: b.id, display_order: targetIdx };
      if (i === targetIdx) return { id: b.id, display_order: index };
      return { id: b.id, display_order: i };
    });

    await lessonBlockService.reorderBlocks(lesson.id, items);
    loadBlocks();
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedBlockIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverBlockIndex !== index) {
      setDragOverBlockIndex(index);
    }
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedBlockIndex === null || draggedBlockIndex === dropIndex) {
      setDraggedBlockIndex(null);
      setDragOverBlockIndex(null);
      return;
    }

    const updatedBlocks = [...blocks];
    const [movedBlock] = updatedBlocks.splice(draggedBlockIndex, 1);
    updatedBlocks.splice(dropIndex, 0, movedBlock);

    setDraggedBlockIndex(null);
    setDragOverBlockIndex(null);

    const itemsToReorder: LessonBlockReorderItem[] = updatedBlocks.map((b, i) => ({
      id: b.id,
      display_order: i,
    }));

    await lessonBlockService.reorderBlocks(lesson.id, itemsToReorder);
    loadBlocks();
  };

  const handleDragEnd = () => {
    setDraggedBlockIndex(null);
    setDragOverBlockIndex(null);
  };

  // Filtered block options for insertion drawer
  const filteredBlockOptions = BLOCK_TYPE_OPTIONS.filter((opt) => {
    const matchesSearch =
      opt.label.toLowerCase().includes(blockSearchQuery.toLowerCase()) ||
      opt.description.toLowerCase().includes(blockSearchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || opt.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* Lesson Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs relative">
        {isEditingLessonHeader ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Lesson Title
              </label>
              <input
                type="text"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                className="w-full text-lg font-bold px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  min={1}
                  value={lessonDuration}
                  onChange={(e) => setLessonDuration(Number(e.target.value))}
                  className="w-28 px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-mono text-slate-900"
                />
              </div>

              <div className="pt-5 flex items-center gap-6">
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={lessonIsPreview}
                    onChange={(e) => setLessonIsPreview(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Enable Free Preview</span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={lessonIsLocked}
                    onChange={(e) => setLessonIsLocked(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <span>Locked Lesson</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsEditingLessonHeader(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLessonHeader}
                className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 shadow-2xs"
              >
                Save Details
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Lesson Module
                </span>
                {lesson.is_preview && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <Eye className="w-3 h-3" /> Free Preview
                  </span>
                )}
                {lesson.is_locked && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Locked
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {lesson.title}
              </h1>
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {lesson.estimated_duration || 10} Minutes
                </span>
                <span className="flex items-center gap-1 font-semibold text-slate-600">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  {blocks.length} Content Blocks
                </span>
              </div>
            </div>

            {!isStudentPreview && (
              <div className="flex items-center gap-2 self-start">
                {blocks.length > 0 && (
                  <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                    <button
                      onClick={expandAllBlocks}
                      title="Expand All Blocks"
                      className="p-1 hover:bg-white rounded text-slate-600 text-xs flex items-center gap-1 px-2 font-medium"
                    >
                      <Maximize2 className="w-3 h-3" /> Expand
                    </button>
                    <button
                      onClick={collapseAllBlocks}
                      title="Collapse All Blocks"
                      className="p-1 hover:bg-white rounded text-slate-600 text-xs flex items-center gap-1 px-2 font-medium"
                    >
                      <Minimize2 className="w-3 h-3" /> Collapse
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setIsEditingLessonHeader(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Lesson</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content Blocks Area */}
      {isLoadingBlocks ? (
        <div className="py-12 text-center space-y-2">
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading content blocks...</p>
        </div>
      ) : blocks.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Content Blocks Added Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Start building your lesson curriculum by choosing from 20+ rich interactive block types including text, video, audio, quizzes, reflection prompts, and assignments.
          </p>
          {!isStudentPreview && (
            <button
              onClick={() => setShowAddBlockMenu(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 shadow-2xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Block</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {blocks.map((block, idx) => {
            const isEditing = editingBlockId === block.id;
            const isCollapsed = collapsedBlockIds.has(block.id);
            const isDragging = draggedBlockIndex === idx;
            const isDragOver = dragOverBlockIndex === idx;

            const blockConfig = BLOCK_TYPE_OPTIONS.find((opt) => opt.type === block.type);
            const IconComponent = blockConfig ? blockConfig.icon : FileText;

            // In Editing Mode
            if (isEditing && !isStudentPreview) {
              return (
                <div
                  key={block.id}
                  className="bg-white rounded-2xl border-2 border-indigo-500 shadow-lg p-5 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                        <IconComponent className="w-4 h-4" />
                      </span>
                      <div>
                        <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                          Edit {blockConfig?.label || block.type} Block
                        </span>
                        <p className="text-[10px] text-slate-400">
                          {blockConfig?.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {saveStatus === 'saving' && (
                        <span className="text-[11px] text-amber-600 font-medium flex items-center gap-1">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                        </span>
                      )}
                      {saveStatus === 'saved' && (
                        <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Auto-saved
                        </span>
                      )}
                      <button
                        onClick={() => handleSaveBlock(block.id)}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Done
                      </button>
                    </div>
                  </div>

                  {block.type === 'quiz' ? (
                    <QuizBlock
                      block={block}
                      onUpdateBlock={loadBlocks}
                      isStudentView={false}
                    />
                  ) : (
                    <div className="space-y-3">
                      {/* Title Input (not needed for plain divider or paragraph) */}
                      {block.type !== 'divider' && block.type !== 'paragraph' && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Block Title / Heading
                          </label>
                          <input
                            type="text"
                            value={editBlockTitle}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            placeholder="Block title..."
                            className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900"
                          />
                        </div>
                      )}

                      {/* Media Upload & URL for Media/Embed/Button types */}
                      {(block.type === 'video' ||
                        block.type === 'audio' ||
                        block.type === 'image' ||
                        block.type === 'pdf' ||
                        block.type === 'download' ||
                        block.type === 'button' ||
                        block.type === 'embed') && (
                        <div className="space-y-3">
                          {['video', 'audio', 'image', 'pdf', 'download'].includes(block.type) && (
                            <MediaPicker
                              value={editBlockMediaUrl}
                              onChange={(media) => {
                                handleMediaUrlChange(media?.url || '');
                              }}
                              acceptTypes={
                                block.type === 'video'
                                  ? ['video']
                                  : block.type === 'audio'
                                  ? ['audio']
                                  : block.type === 'image'
                                  ? ['image']
                                  : ['pdf', 'raw']
                              }
                              title={`Upload ${block.type.toUpperCase()} File`}
                              description={`Upload your ${block.type} file to secure LMS storage or enter a direct URL.`}
                            />
                          )}

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Direct Media / External Link URL
                            </label>
                            <input
                              type="text"
                              value={editBlockMediaUrl}
                              onChange={(e) => handleMediaUrlChange(e.target.value)}
                              placeholder="https://..."
                              className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-800"
                            />
                          </div>
                        </div>
                      )}

                      {/* Main Content Body */}
                      {block.type !== 'divider' && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            {block.type === 'checklist'
                              ? 'Checklist Items (One item per line)'
                              : block.type === 'gallery'
                              ? 'Image URLs (One URL per line)'
                              : 'Block Content / Body Text'}
                          </label>
                          <textarea
                            rows={4}
                            value={editBlockContent}
                            onChange={(e) => handleContentChange(e.target.value)}
                            placeholder="Enter content..."
                            className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-800 font-sans leading-relaxed"
                          />
                        </div>
                      )}

                      {/* Block Settings: Required toggle */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={editBlockIsRequired}
                            onChange={(e) => {
                              setEditBlockIsRequired(e.target.checked);
                              autoSaveBlock(
                                block.id,
                                editBlockTitle,
                                editBlockContent,
                                editBlockMediaUrl,
                                e.target.checked,
                                editBlockMetadata
                              );
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                          />
                          <span>Required Step (Students must complete)</span>
                        </label>

                        <span className="text-[10px] text-slate-400 font-mono">
                          Shortcuts: Cmd+S to save, Esc to exit
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            // Standard Rendered Block View
            return (
              <div
                key={block.id}
                draggable={!isStudentPreview}
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={handleDragEnd}
                className={`group relative bg-white rounded-2xl border transition-all ${
                  isDragging
                    ? 'opacity-30 border-dashed border-indigo-400'
                    : 'border-slate-200/90 hover:border-slate-300 shadow-2xs'
                } ${isDragOver ? 'ring-2 ring-indigo-500 bg-indigo-50/20' : ''}`}
              >
                {/* Block Header Toolbar (Notion Style) */}
                {!isStudentPreview && (
                  <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-50/60 rounded-t-2xl">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Drag Handle */}
                      <span
                        className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 shrink-0"
                        title="Drag block to reorder"
                      >
                        <GripVertical className="w-3.5 h-3.5" />
                      </span>

                      {/* Collapse Toggle */}
                      <button
                        onClick={() => toggleCollapseBlock(block.id)}
                        className="p-1 hover:bg-slate-200/80 rounded text-slate-500 shrink-0"
                        title={isCollapsed ? 'Expand Block' : 'Collapse Block'}
                      >
                        {isCollapsed ? (
                          <ChevronRight className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Icon & Type Badge */}
                      <span className="p-1 rounded bg-white border border-slate-200 text-indigo-600 shrink-0">
                        <IconComponent className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {block.title || blockConfig?.label || block.type}
                      </span>

                      {block.is_required && (
                        <span className="px-1.5 py-0.2 text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-200 rounded uppercase tracking-wider shrink-0">
                          Required
                        </span>
                      )}
                    </div>

                    {/* Quick Action Tools */}
                    <div className="flex items-center gap-1 shrink-0">
                      {idx > 0 && (
                        <button
                          onClick={() => handleMoveBlock(idx, 'up')}
                          title="Move Up"
                          className="p-1 hover:bg-slate-200/80 rounded text-slate-500"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {idx < blocks.length - 1 && (
                        <button
                          onClick={() => handleMoveBlock(idx, 'down')}
                          title="Move Down"
                          className="p-1 hover:bg-slate-200/80 rounded text-slate-500"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDuplicateBlock(block)}
                        title="Duplicate Block"
                        className="p-1 hover:bg-slate-200/80 rounded text-slate-500"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleStartEditBlock(block)}
                        title="Edit Block"
                        className="p-1 hover:bg-indigo-100 hover:text-indigo-700 rounded text-slate-600"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBlock(block.id)}
                        title="Delete Block"
                        className="p-1 hover:bg-rose-100 hover:text-rose-600 rounded text-slate-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Block Content (Hidden if Collapsed) */}
                {!isCollapsed && (
                  <div className="p-5">
                    {/* 1. HEADING */}
                    {block.type === 'heading' && (
                      <div className="space-y-1">
                        <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">
                          {block.title || 'Heading'}
                        </h2>
                        {block.content && (
                          <p className="text-xs text-slate-600 pt-1 leading-relaxed">
                            {block.content}
                          </p>
                        )}
                      </div>
                    )}

                    {/* 2. PARAGRAPH */}
                    {block.type === 'paragraph' && (
                      <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line font-sans">
                        {block.content}
                      </div>
                    )}

                    {/* 3. IMAGE */}
                    {block.type === 'image' && (
                      <div className="space-y-2">
                        {block.title && (
                          <h3 className="text-sm font-bold text-slate-800">
                            {block.title}
                          </h3>
                        )}
                        {block.media_url ? (
                          <img
                            src={storageService.getStorageUrl(block.media_url)}
                            alt={block.title || 'Lesson Image'}
                            className="w-full max-h-96 object-cover rounded-xl border border-slate-200"
                          />
                        ) : (
                          <div className="h-48 bg-slate-100 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs">
                            No Image URL provided
                          </div>
                        )}
                        {block.content && (
                          <p className="text-xs text-slate-500 italic text-center">
                            {block.content}
                          </p>
                        )}
                      </div>
                    )}

                    {/* 4. GALLERY */}
                    {block.type === 'gallery' && (
                      <div className="space-y-3">
                        {block.title && (
                          <h3 className="text-sm font-bold text-slate-800">
                            {block.title}
                          </h3>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {(block.content || '')
                            .split('\n')
                            .filter((url) => url.trim().length > 0)
                            .map((url, i) => (
                              <img
                                key={i}
                                src={storageService.getStorageUrl(url.trim())}
                                alt={`Gallery item ${i + 1}`}
                                className="w-full h-40 object-cover rounded-xl border border-slate-200 hover:scale-102 transition-transform cursor-pointer"
                              />
                            ))}
                        </div>
                      </div>
                    )}

                    {/* 5. VIDEO */}
                    {block.type === 'video' && (
                      <div className="space-y-2">
                        {block.title && (
                          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <Video className="w-4 h-4 text-indigo-600" />
                            {block.title}
                          </h3>
                        )}
                        {block.media_url && block.media_url.trim() ? (
                          <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden shadow-2xs flex items-center justify-center">
                            {block.media_url.includes('youtube') ||
                            block.media_url.includes('vimeo') ||
                            block.media_url.includes('youtu.be') ? (
                              <iframe
                                src={
                                  block.media_url.includes('watch?v=')
                                    ? block.media_url.replace('watch?v=', 'embed/')
                                    : block.media_url
                                }
                                className="w-full h-full border-0"
                                title={block.title || 'Video Player'}
                                allowFullScreen
                              />
                            ) : (
                              <video
                                src={storageService.getStorageUrl(block.media_url)}
                                controls
                                preload="metadata"
                                className="w-full h-full object-contain"
                              >
                                Your browser does not support HTML video playback.
                              </video>
                            )}
                          </div>
                        ) : (
                          <div className="aspect-video bg-slate-100 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs">
                            No Video URL provided
                          </div>
                        )}
                        {block.content && (
                          <p className="text-xs text-slate-600">{block.content}</p>
                        )}
                      </div>
                    )}

                    {/* 6. AUDIO */}
                    {block.type === 'audio' && (
                      <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-3">
                        <div className="flex items-center gap-2">
                          <Music className="w-5 h-5 text-indigo-600" />
                          <h3 className="text-sm font-bold text-slate-800">
                            {block.title || 'Audio Recording'}
                          </h3>
                        </div>
                        {block.media_url && block.media_url.trim() && (
                          <audio controls className="w-full h-9" src={storageService.getStorageUrl(block.media_url)}>
                            Audio playback not supported.
                          </audio>
                        )}
                        {block.content && (
                          <p className="text-xs text-slate-600">{block.content}</p>
                        )}
                      </div>
                    )}

                    {/* 7. PDF */}
                    {block.type === 'pdf' && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-rose-500" />
                            <h3 className="text-sm font-bold text-slate-800">
                              {block.title || 'PDF Document'}
                            </h3>
                          </div>
                          {block.media_url && (
                            <a
                              href={storageService.getStorageUrl(block.media_url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Open PDF
                            </a>
                          )}
                        </div>
                        {block.content && (
                          <p className="text-xs text-slate-600">{block.content}</p>
                        )}
                      </div>
                    )}

                    {/* 8. DOWNLOAD */}
                    {block.type === 'download' && (
                      <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                            <Download className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">
                              {block.title || 'Download Resource'}
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              {block.content || 'Click button to download starter files'}
                            </p>
                          </div>
                        </div>
                        {block.media_url && (
                          <a
                            href={storageService.getStorageUrl(block.media_url)}
                            download
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-all shrink-0"
                          >
                            Download
                          </a>
                        )}
                      </div>
                    )}

                    {/* 9. QUOTE */}
                    {block.type === 'quote' && (
                      <div className="p-5 italic bg-slate-50 border-l-4 border-indigo-600 rounded-r-xl text-slate-700 font-serif space-y-2">
                        <Quote className="w-6 h-6 text-indigo-300" />
                        <p className="text-base leading-relaxed">{block.content}</p>
                        {block.title && (
                          <span className="block text-right text-xs font-sans not-italic text-slate-500 font-semibold">
                            — {block.title}
                          </span>
                        )}
                      </div>
                    )}

                    {/* 10. DIVIDER */}
                    {block.type === 'divider' && (
                      <div className="py-2">
                        <hr className="border-t-2 border-slate-200" />
                      </div>
                    )}

                    {/* 11. CALLOUT */}
                    {block.type === 'callout' && (
                      <div className="p-4 bg-amber-50/80 border-l-4 border-amber-500 rounded-r-xl space-y-1">
                        {block.title && (
                          <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                            {block.title}
                          </h4>
                        )}
                        <p className="text-xs text-amber-900 leading-relaxed font-medium">
                          {block.content}
                        </p>
                      </div>
                    )}

                    {/* 12. ACCORDION */}
                    {block.type === 'accordion' && (
                      <details className="group border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                        <summary className="p-3 text-xs font-bold text-slate-800 cursor-pointer select-none flex items-center justify-between hover:bg-slate-100/80">
                          <span>{block.title || 'Accordion Section'}</span>
                          <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
                        </summary>
                        <div className="p-3 text-xs text-slate-600 border-t border-slate-200 bg-white leading-relaxed">
                          {block.content}
                        </div>
                      </details>
                    )}

                    {/* 13. BUTTON */}
                    {block.type === 'button' && (
                      <div className="text-center py-2">
                        <a
                          href={block.media_url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all hover:scale-102"
                        >
                          <MousePointer className="w-4 h-4" />
                          <span>{block.title || 'Click Here'}</span>
                        </a>
                      </div>
                    )}

                    {/* 14. QUIZ */}
                    {block.type === 'quiz' && (
                      <QuizBlock
                        block={block}
                        onUpdateBlock={loadBlocks}
                        isStudentView={isStudentPreview}
                      />
                    )}

                    {/* 15. REFLECTION */}
                    {block.type === 'reflection' && (
                      <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="w-5 h-5 text-amber-600" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                            {block.title || 'Reflection Prompt'}
                          </h4>
                        </div>
                        <p className="text-xs text-amber-900 font-semibold">{block.content}</p>
                        <textarea
                          rows={3}
                          value={studentResponses[block.id] || ''}
                          onChange={(e) =>
                            setStudentResponses((prev) => ({
                              ...prev,
                              [block.id]: e.target.value,
                            }))
                          }
                          placeholder="Type your reflection here..."
                          className="w-full text-xs p-2.5 bg-white border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 text-slate-800"
                        />
                      </div>
                    )}

                    {/* 16. JOURNAL */}
                    {block.type === 'journal' && (
                      <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-3">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-indigo-600" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                            {block.title || 'Private Journal Entry'}
                          </h4>
                        </div>
                        <p className="text-xs text-indigo-900 font-medium">{block.content}</p>
                        <textarea
                          rows={4}
                          value={studentResponses[block.id] || ''}
                          onChange={(e) =>
                            setStudentResponses((prev) => ({
                              ...prev,
                              [block.id]: e.target.value,
                            }))
                          }
                          placeholder="Write your journal entry..."
                          className="w-full text-xs p-2.5 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-800 leading-relaxed"
                        />
                      </div>
                    )}

                    {/* 17. AFFIRMATION */}
                    {block.type === 'affirmation' && (
                      <div className="p-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-2xl shadow-md text-center space-y-2">
                        <HeartHandshake className="w-8 h-8 text-pink-200 mx-auto" />
                        <h4 className="text-xs font-bold uppercase tracking-widest text-pink-200">
                          {block.title || 'Daily Affirmation'}
                        </h4>
                        <p className="text-lg font-bold italic font-serif leading-snug">
                          “{block.content}”
                        </p>
                      </div>
                    )}

                    {/* 18. ASSIGNMENT */}
                    {block.type === 'assignment' && (
                      <div className="p-5 bg-white border-2 border-slate-200 rounded-xl space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2">
                            <ClipboardList className="w-5 h-5 text-indigo-600" />
                            <h4 className="text-sm font-bold text-slate-900">
                              {block.title || 'Assignment Task'}
                            </h4>
                          </div>
                          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                            {block.metadata?.points || 100} Points
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">{block.content}</p>
                        <div className="pt-2">
                          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                            Your Submission URL or Summary
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="https://github.com/my-submission..."
                              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-slate-50"
                            />
                            <button className="px-3.5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg shrink-0 hover:bg-indigo-700">
                              Submit
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 19. CHECKLIST */}
                    {block.type === 'checklist' && (
                      <div className="space-y-2">
                        {block.title && (
                          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                            {block.title}
                          </h4>
                        )}
                        <div className="space-y-1.5 pl-1">
                          {(block.content || '')
                            .split('\n')
                            .filter((item) => item.trim().length > 0)
                            .map((item, itemIdx) => {
                              const key = `${block.id}-${itemIdx}`;
                              const isChecked = checklistState[key] || false;

                              return (
                                <label
                                  key={itemIdx}
                                  className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer select-none"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) =>
                                      setChecklistState((prev) => ({
                                        ...prev,
                                        [key]: e.target.checked,
                                      }))
                                    }
                                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                                  />
                                  <span className={isChecked ? 'line-through text-slate-400' : ''}>
                                    {item}
                                  </span>
                                </label>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* 20. EMBED */}
                    {block.type === 'embed' && (
                      <div className="space-y-2">
                        {block.title && (
                          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <Code className="w-4 h-4 text-indigo-600" />
                            {block.title}
                          </h3>
                        )}
                        {block.media_url ? (
                          <div className="h-96 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                            <iframe
                              src={block.media_url}
                              className="w-full h-full"
                              title={block.title || 'Embed Viewer'}
                            />
                          </div>
                        ) : (
                          <div className="h-40 bg-slate-100 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs">
                            No Embed URL provided
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Content Block Menu / Slash Palette */}
      {!isStudentPreview && (
        <div className="pt-4 border-t border-slate-200">
          {showAddBlockMenu ? (
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom-2 border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                    <Plus className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Insert Content Block
                    </h3>
                    <p className="text-xs text-slate-400">
                      Select from 20 block types to build your lesson
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddBlockMenu(false)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search & Categories Bar */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative w-full sm:flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={blockSearchQuery}
                    onChange={(e) => setBlockSearchQuery(e.target.value)}
                    placeholder="Search block types..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                  {['All', 'Text', 'Media', 'Interactive', 'Structure'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                        selectedCategory === cat
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Block Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 max-h-80 overflow-y-auto pr-1">
                {filteredBlockOptions.map((opt) => {
                  const ItemIcon = opt.icon;
                  return (
                    <button
                      key={opt.type}
                      onClick={() => handleCreateBlock(opt.type)}
                      disabled={isSavingBlock}
                      className="flex items-start gap-3 p-3 bg-slate-800/80 hover:bg-slate-800 hover:border-indigo-500/60 border border-slate-700/80 rounded-xl text-left transition-all group"
                    >
                      <span className="p-2 rounded-lg bg-slate-900 group-hover:bg-indigo-600/20 text-indigo-400 shrink-0 mt-0.5">
                        <ItemIcon className="w-4 h-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="block text-xs font-bold text-slate-200 group-hover:text-white truncate">
                          {opt.label}
                        </span>
                        <span className="block text-[10px] text-slate-400 line-clamp-2 leading-tight mt-0.5">
                          {opt.description}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddBlockMenu(true)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-indigo-50/50 border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-2xl text-indigo-700 text-xs font-bold transition-all shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Content Block to Lesson</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default LessonBlockEditor;
