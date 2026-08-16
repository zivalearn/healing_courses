import React, { useState, useEffect, useRef } from 'react';
import { Section } from '../../../models/section';
import { Lesson } from '../../../models/lesson';
import { sectionService } from '../../../services/sectionService';
import { lessonService } from '../../../services/lessonService';
import { LessonTree } from './LessonTree';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Edit2,
  Trash2,
  ChevronUp,
  X,
  Check,
  GripVertical,
  Loader2,
  Copy,
} from 'lucide-react';
import { lessonBlockService } from '../../../services/lessonBlockService';

interface SectionTreeProps {
  section: Section;
  courseId: string;
  selectedLessonId: string | null;
  onSelectLesson: (lesson: Lesson) => void;
  onRefreshCourse: () => void;
  index: number;
  totalSections: number;
  onMoveSection: (index: number, direction: 'up' | 'down') => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: (e: React.DragEvent) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  allSections?: Section[];
}

export const SectionTree: React.FC<SectionTreeProps> = ({
  section,
  courseId,
  selectedLessonId,
  onSelectLesson,
  onRefreshCourse,
  index,
  totalSections,
  onMoveSection,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging = false,
  isDragOver = false,
  allSections = [],
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);

  const [isEditingSection, setIsEditingSection] = useState(false);
  const [sectionTitle, setSectionTitle] = useState(section.title);
  const [sectionDesc, setSectionDesc] = useState(section.description || '');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadLessons = async () => {
    setIsLoadingLessons(true);
    const { data } = await lessonService.getLessonsBySection(section.id);
    setLessons(data || []);
    setIsLoadingLessons(false);
  };

  useEffect(() => {
    loadLessons();
  }, [section.id]);

  useEffect(() => {
    setSectionTitle(section.title);
    setSectionDesc(section.description || '');
  }, [section.title, section.description]);

  // Auto-save logic for section renaming / details
  const autoSaveSection = async (titleToSave: string, descToSave: string) => {
    if (!titleToSave.trim()) return;
    setSaveStatus('saving');
    await sectionService.updateSection(section.id, {
      title: titleToSave.trim(),
      description: descToSave.trim() || null,
    });
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
    onRefreshCourse();
  };

  const handleTitleChange = (newTitle: string) => {
    setSectionTitle(newTitle);
    setSaveStatus('idle');
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      autoSaveSection(newTitle, sectionDesc);
    }, 800);
  };

  const handleDescChange = (newDesc: string) => {
    setSectionDesc(newDesc);
    setSaveStatus('idle');
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      autoSaveSection(sectionTitle, newDesc);
    }, 800);
  };

  const handleBlurSave = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (
      sectionTitle.trim() !== section.title ||
      sectionDesc.trim() !== (section.description || '')
    ) {
      autoSaveSection(sectionTitle, sectionDesc);
    }
  };

  const handleSubmitSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    autoSaveSection(sectionTitle, sectionDesc);
    setIsEditingSection(false);
  };

  const [isDuplicating, setIsDuplicating] = useState(false);

  const handleDeleteSection = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete section "${section.title}" and all its lessons?`)) {
      await sectionService.deleteSection(section.id);
      onRefreshCourse();
    }
  };

  const handleDuplicateSection = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDuplicating(true);
    try {
      const nextOrder = allSections.length > 0 ? Math.max(...allSections.map((s) => s.display_order)) + 1 : index + 1;
      const { data: newSection } = await sectionService.createSection({
        course_id: courseId,
        title: `${section.title} (Copy)`,
        description: section.description,
        display_order: nextOrder,
        is_locked: section.is_locked,
      });

      if (newSection) {
        const { data: sourceLessons } = await lessonService.getLessonsBySection(section.id);
        if (sourceLessons && sourceLessons.length > 0) {
          for (const l of sourceLessons) {
            const { data: newLesson } = await lessonService.createLesson({
              section_id: newSection.id,
              title: l.title,
              estimated_duration: l.estimated_duration,
              is_preview: l.is_preview,
              is_locked: l.is_locked,
              display_order: l.display_order,
            });

            if (newLesson) {
              const { data: sourceBlocks } = await lessonBlockService.getBlocksByLesson(l.id);
              if (sourceBlocks && sourceBlocks.length > 0) {
                for (const b of sourceBlocks) {
                  await lessonBlockService.createBlock({
                    lesson_id: newLesson.id,
                    type: b.type,
                    title: b.title,
                    content: b.content,
                    media_url: b.media_url,
                    metadata: b.metadata,
                    display_order: b.display_order,
                    is_required: b.is_required,
                  });
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to duplicate section:', err);
    } finally {
      setIsDuplicating(false);
      onRefreshCourse();
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      className={`border rounded-xl overflow-hidden bg-white/70 shadow-2xs mb-2 transition-all ${
        isDragging ? 'opacity-40 border-dashed border-indigo-400' : 'border-slate-200/80'
      } ${isDragOver ? 'ring-2 ring-indigo-500 bg-indigo-50/30' : ''}`}
    >
      {/* Section Header Bar */}
      {isEditingSection ? (
        <form
          onSubmit={handleSubmitSave}
          className="p-2.5 bg-indigo-50/60 space-y-2 border-b border-indigo-100"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
              Editing Section
            </span>
            <div className="flex items-center gap-1">
              {saveStatus === 'saving' && (
                <span className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" /> Auto-saved
                </span>
              )}
            </div>
          </div>

          <input
            type="text"
            value={sectionTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            onBlur={handleBlurSave}
            className="w-full text-xs font-semibold px-2 py-1 bg-white border border-slate-200 rounded focus:ring-2 focus:ring-indigo-500 text-slate-900"
            placeholder="Section title"
            autoFocus
          />
          <input
            type="text"
            value={sectionDesc}
            onChange={(e) => handleDescChange(e.target.value)}
            onBlur={handleBlurSave}
            className="w-full text-xs px-2 py-1 bg-white border border-slate-200 rounded text-slate-600"
            placeholder="Short description (optional)"
          />
          <div className="flex justify-end gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsEditingSection(false);
                setSectionTitle(section.title);
                setSectionDesc(section.description || '');
              }}
              className="p-1 hover:bg-slate-200 rounded text-slate-500"
              title="Close editor"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              type="submit"
              className="px-2.5 py-1 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 shadow-2xs"
            >
              Done
            </button>
          </div>
        </form>
      ) : (
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="group flex items-center justify-between px-2.5 py-2.5 bg-slate-50/80 hover:bg-slate-100/80 cursor-pointer select-none border-b border-slate-100"
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {/* Drag Handle */}
            <span
              className="cursor-grab active:cursor-grabbing p-0.5 text-slate-400 hover:text-slate-600 shrink-0"
              title="Drag to reorder section"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="w-3.5 h-3.5" />
            </span>

            {/* Collapse / Expand Toggle Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded hover:bg-slate-200/60 shrink-0"
              title={isOpen ? 'Collapse section' : 'Expand section'}
            >
              {isOpen ? (
                <ChevronDown className="w-4 h-4 text-indigo-600" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {isOpen ? (
              <FolderOpen className="w-4 h-4 text-indigo-600 shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-slate-400 shrink-0" />
            )}

            <span className="text-xs font-semibold text-slate-800 truncate">
              {section.title}
            </span>

            {/* Display Lesson Count Badge */}
            <span
              className="text-[10px] px-2 py-0.5 bg-indigo-100/80 text-indigo-700 border border-indigo-200/60 rounded-full font-medium shrink-0 ml-auto mr-1"
              title={`${lessons.length} lessons in section`}
            >
              {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
            </span>
          </div>

          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Reorder Up / Down */}
            {index > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveSection(index, 'up');
                }}
                title="Move Section Up"
                className="p-1 hover:bg-slate-200 rounded text-slate-500"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            )}
            {index < totalSections - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveSection(index, 'down');
                }}
                title="Move Section Down"
                className="p-1 hover:bg-slate-200 rounded text-slate-500"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Rename / Edit */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingSection(true);
              }}
              title="Rename Section"
              className="p-1 hover:bg-slate-200 rounded text-slate-500"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            {/* Duplicate Section */}
            <button
              onClick={handleDuplicateSection}
              disabled={isDuplicating}
              title="Duplicate Section"
              className="p-1 hover:bg-slate-200 rounded text-slate-500 disabled:opacity-50"
            >
              {isDuplicating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Delete */}
            <button
              onClick={handleDeleteSection}
              title="Delete Section"
              className="p-1 hover:bg-rose-100 hover:text-rose-600 rounded text-slate-400"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Section Lessons List (Collapsible) */}
      {isOpen && (
        <div className="p-1 bg-white">
          <LessonTree
            sectionId={section.id}
            lessons={lessons}
            selectedLessonId={selectedLessonId}
            onSelectLesson={onSelectLesson}
            onRefreshSection={loadLessons}
            allSections={allSections}
            onRefreshCourse={onRefreshCourse}
          />
        </div>
      )}
    </div>
  );
};

export default SectionTree;

