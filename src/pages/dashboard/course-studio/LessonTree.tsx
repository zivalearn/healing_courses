import React, { useState, useRef, useEffect } from 'react';
import { Lesson, CreateLessonInput, LessonReorderItem } from '../../../models/lesson';
import { Section } from '../../../models/section';
import { lessonService } from '../../../services/lessonService';
import {
  FileText,
  Clock,
  Eye,
  EyeOff,
  Lock,
  LockOpen,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
  Plus,
  Check,
  X,
  Copy,
  GripVertical,
  Move,
  Loader2,
  FolderInput,
} from 'lucide-react';

interface LessonTreeProps {
  sectionId: string;
  lessons: Lesson[];
  selectedLessonId: string | null;
  onSelectLesson: (lesson: Lesson) => void;
  onRefreshSection: () => void;
  allSections?: Section[];
  onRefreshCourse?: () => void;
}

export const LessonTree: React.FC<LessonTreeProps> = ({
  sectionId,
  lessons,
  selectedLessonId,
  onSelectLesson,
  onRefreshSection,
  allSections = [],
  onRefreshCourse,
}) => {
  // Inline Edit State
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDuration, setEditDuration] = useState<number>(10);
  const [editIsPreview, setEditIsPreview] = useState(false);
  const [editIsLocked, setEditIsLocked] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Move Lesson to Section Modal
  const [moveLessonModal, setMoveLessonModal] = useState<Lesson | null>(null);
  const [targetSectionId, setTargetSectionId] = useState<string>('');
  const [isMoving, setIsMoving] = useState(false);

  // Add Lesson State
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonDuration, setNewLessonDuration] = useState(10);
  const [newIsPreview, setNewIsPreview] = useState(false);
  const [newIsLocked, setNewIsLocked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Drag and Drop state
  const [draggedLessonIndex, setDraggedLessonIndex] = useState<number | null>(null);
  const [dragOverLessonIndex, setDragOverLessonIndex] = useState<number | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Start editing a lesson
  const handleStartEdit = (e: React.MouseEvent, lesson: Lesson) => {
    e.stopPropagation();
    setEditingLessonId(lesson.id);
    setEditTitle(lesson.title);
    setEditDuration(lesson.estimated_duration || 10);
    setEditIsPreview(lesson.is_preview || false);
    setEditIsLocked(lesson.is_locked || false);
  };

  // Auto-save lesson updates
  const autoSaveLesson = async (
    lessonId: string,
    titleToSave: string,
    durationToSave: number,
    isPreviewToSave: boolean,
    isLockedToSave: boolean
  ) => {
    if (!titleToSave.trim()) return;
    setSaveStatus('saving');
    await lessonService.updateLesson(lessonId, {
      title: titleToSave.trim(),
      estimated_duration: durationToSave,
      is_preview: isPreviewToSave,
      is_locked: isLockedToSave,
    });
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
    onRefreshSection();
  };

  const handleTitleChange = (lessonId: string, newTitle: string) => {
    setEditTitle(newTitle);
    setSaveStatus('idle');
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      autoSaveLesson(lessonId, newTitle, editDuration, editIsPreview, editIsLocked);
    }, 800);
  };

  const handleDurationChange = (lessonId: string, newDuration: number) => {
    setEditDuration(newDuration);
    setSaveStatus('idle');
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      autoSaveLesson(lessonId, editTitle, newDuration, editIsPreview, editIsLocked);
    }, 800);
  };

  // Toggle Free Preview on the fly
  const handleTogglePreview = async (e: React.MouseEvent, lesson: Lesson) => {
    e.stopPropagation();
    const nextPreview = !lesson.is_preview;
    await lessonService.updateLesson(lesson.id, { is_preview: nextPreview });
    if (editingLessonId === lesson.id) {
      setEditIsPreview(nextPreview);
    }
    onRefreshSection();
  };

  // Toggle Locked Status on the fly
  const handleToggleLocked = async (e: React.MouseEvent, lesson: Lesson) => {
    e.stopPropagation();
    const nextLocked = !lesson.is_locked;
    await lessonService.updateLesson(lesson.id, { is_locked: nextLocked });
    if (editingLessonId === lesson.id) {
      setEditIsLocked(nextLocked);
    }
    onRefreshSection();
  };

  // Duplicate Lesson
  const handleDuplicateLesson = async (e: React.MouseEvent, lesson: Lesson) => {
    e.stopPropagation();
    setIsSubmitting(true);
    const nextOrder = lessons.length > 0 ? Math.max(...lessons.map((l) => l.display_order)) + 1 : 0;
    const { data } = await lessonService.createLesson({
      section_id: sectionId,
      title: `${lesson.title} (Copy)`,
      estimated_duration: lesson.estimated_duration || 10,
      is_preview: lesson.is_preview || false,
      is_locked: lesson.is_locked || false,
      display_order: nextOrder,
    });
    setIsSubmitting(false);
    onRefreshSection();
    if (data) {
      onSelectLesson(data);
    }
  };

  // Delete Lesson
  const handleDeleteLesson = async (e: React.MouseEvent, lessonId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this lesson?')) {
      await lessonService.deleteLesson(lessonId);
      onRefreshSection();
    }
  };

  // Move Lesson Up or Down within section
  const handleMoveUpDown = async (
    e: React.MouseEvent,
    index: number,
    direction: 'up' | 'down'
  ) => {
    e.stopPropagation();
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= lessons.length) return;

    const itemsToReorder: LessonReorderItem[] = lessons.map((l, i) => {
      if (i === index) return { id: l.id, display_order: targetIndex };
      if (i === targetIndex) return { id: l.id, display_order: index };
      return { id: l.id, display_order: i };
    });

    await lessonService.reorderLessons(sectionId, itemsToReorder);
    onRefreshSection();
  };

  // Move Lesson to a Different Section
  const handleConfirmMoveToSection = async () => {
    if (!moveLessonModal || !targetSectionId) return;
    setIsMoving(true);
    await lessonService.updateLesson(moveLessonModal.id, {
      section_id: targetSectionId,
    } as any);
    setIsMoving(false);
    setMoveLessonModal(null);
    onRefreshSection();
    if (onRefreshCourse) onRefreshCourse();
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedLessonIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverLessonIndex !== index) {
      setDragOverLessonIndex(index);
    }
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (
      draggedLessonIndex === null ||
      draggedLessonIndex === dropIndex
    ) {
      setDraggedLessonIndex(null);
      setDragOverLessonIndex(null);
      return;
    }

    const updatedLessons = [...lessons];
    const [movedLesson] = updatedLessons.splice(draggedLessonIndex, 1);
    updatedLessons.splice(dropIndex, 0, movedLesson);

    setDraggedLessonIndex(null);
    setDragOverLessonIndex(null);

    const itemsToReorder: LessonReorderItem[] = updatedLessons.map((l, i) => ({
      id: l.id,
      display_order: i,
    }));

    await lessonService.reorderLessons(sectionId, itemsToReorder);
    onRefreshSection();
  };

  const handleDragEnd = () => {
    setDraggedLessonIndex(null);
    setDragOverLessonIndex(null);
  };

  // Create Lesson
  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLessonTitle.trim()) return;
    setIsSubmitting(true);

    const nextOrder = lessons.length > 0 ? Math.max(...lessons.map((l) => l.display_order)) + 1 : 0;
    const input: CreateLessonInput = {
      section_id: sectionId,
      title: newLessonTitle.trim(),
      estimated_duration: newLessonDuration,
      is_preview: newIsPreview,
      is_locked: newIsLocked,
      display_order: nextOrder,
    };

    const { data } = await lessonService.createLesson(input);
    setIsSubmitting(false);
    setIsAddingLesson(false);
    setNewLessonTitle('');
    setNewLessonDuration(10);
    setNewIsPreview(false);
    setNewIsLocked(false);
    onRefreshSection();
    if (data) {
      onSelectLesson(data);
    }
  };

  return (
    <div className="pl-3 pr-1 py-1 space-y-1 border-l-2 border-slate-100 ml-2 my-1">
      {lessons.map((lesson, idx) => {
        const isSelected = selectedLessonId === lesson.id;
        const isEditing = editingLessonId === lesson.id;
        const isDragging = draggedLessonIndex === idx;
        const isDragOver = dragOverLessonIndex === idx;

        if (isEditing) {
          return (
            <div
              key={lesson.id}
              className="p-2.5 bg-white rounded-lg border-2 border-indigo-500 shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                  Editing Lesson
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

              {/* Lesson Title Input */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                  Lesson Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => handleTitleChange(lesson.id, e.target.value)}
                  placeholder="Lesson title..."
                  className="w-full text-xs font-semibold px-2 py-1 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  autoFocus
                />
              </div>

              {/* Duration & Toggles */}
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  <input
                    type="number"
                    min={1}
                    value={editDuration}
                    onChange={(e) => handleDurationChange(lesson.id, Number(e.target.value))}
                    className="w-14 px-1.5 py-0.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded"
                  />
                  <span className="text-[11px] font-medium text-slate-500">mins</span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1 cursor-pointer text-[11px] font-medium select-none">
                    <input
                      type="checkbox"
                      checked={editIsPreview}
                      onChange={(e) => {
                        setEditIsPreview(e.target.checked);
                        autoSaveLesson(
                          lesson.id,
                          editTitle,
                          editDuration,
                          e.target.checked,
                          editIsLocked
                        );
                      }}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span>Free Preview</span>
                  </label>

                  <label className="flex items-center gap-1 cursor-pointer text-[11px] font-medium select-none">
                    <input
                      type="checkbox"
                      checked={editIsLocked}
                      onChange={(e) => {
                        setEditIsLocked(e.target.checked);
                        autoSaveLesson(
                          lesson.id,
                          editTitle,
                          editDuration,
                          editIsPreview,
                          e.target.checked
                        );
                      }}
                      className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                    />
                    <span>Locked</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingLessonId(null)}
                  className="px-2.5 py-1 hover:bg-slate-100 rounded text-xs text-slate-600 font-medium"
                >
                  Done
                </button>
              </div>
            </div>
          );
        }

        return (
          <div
            key={lesson.id}
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={(e) => handleDrop(e, idx)}
            onDragEnd={handleDragEnd}
            onClick={() => onSelectLesson(lesson)}
            className={`group relative flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
              isDragging ? 'opacity-30 border-dashed border-indigo-400' : ''
            } ${
              isDragOver ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''
            } ${
              isSelected
                ? 'bg-indigo-50/90 text-indigo-900 font-semibold shadow-2xs border border-indigo-200'
                : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              {/* Drag Handle */}
              <span
                className="cursor-grab active:cursor-grabbing p-0.5 text-slate-400 hover:text-slate-600 shrink-0"
                title="Drag to reorder lesson"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="w-3.5 h-3.5" />
              </span>

              <FileText
                className={`w-3.5 h-3.5 shrink-0 ${
                  isSelected ? 'text-indigo-600' : 'text-slate-400'
                }`}
              />

              <span className="truncate">{lesson.title}</span>

              {/* Badges: Preview / Locked / Duration */}
              <div className="flex items-center gap-1 shrink-0 ml-1">
                {lesson.is_preview && (
                  <span className="px-1.5 py-0.2 text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-medium">
                    Preview
                  </span>
                )}
                {lesson.is_locked && (
                  <span className="px-1.5 py-0.2 text-[9px] bg-amber-50 text-amber-700 border border-amber-200 rounded font-medium flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Locked
                  </span>
                )}
                <span className="text-[10px] text-slate-400 font-mono">
                  {lesson.estimated_duration || 10}m
                </span>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0">
              {/* Toggle Free Preview */}
              <button
                onClick={(e) => handleTogglePreview(e, lesson)}
                title={lesson.is_preview ? 'Disable Free Preview' : 'Enable Free Preview'}
                className={`p-1 rounded transition-colors ${
                  lesson.is_preview
                    ? 'text-emerald-600 hover:bg-emerald-100'
                    : 'text-slate-400 hover:bg-slate-200 hover:text-slate-700'
                }`}
              >
                {lesson.is_preview ? (
                  <Eye className="w-3.5 h-3.5" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Toggle Locked */}
              <button
                onClick={(e) => handleToggleLocked(e, lesson)}
                title={lesson.is_locked ? 'Unlock Lesson' : 'Lock Lesson'}
                className={`p-1 rounded transition-colors ${
                  lesson.is_locked
                    ? 'text-amber-600 hover:bg-amber-100'
                    : 'text-slate-400 hover:bg-slate-200 hover:text-slate-700'
                }`}
              >
                {lesson.is_locked ? (
                  <Lock className="w-3.5 h-3.5" />
                ) : (
                  <LockOpen className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Duplicate Lesson */}
              <button
                onClick={(e) => handleDuplicateLesson(e, lesson)}
                title="Duplicate Lesson"
                className="p-1 hover:bg-slate-200 rounded text-slate-500"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>

              {/* Move to another section */}
              {allSections.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMoveLessonModal(lesson);
                    const otherSection = allSections.find((s) => s.id !== sectionId);
                    setTargetSectionId(otherSection ? otherSection.id : '');
                  }}
                  title="Move to Another Section"
                  className="p-1 hover:bg-slate-200 rounded text-slate-500"
                >
                  <FolderInput className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Move Up / Down inside section */}
              {idx > 0 && (
                <button
                  onClick={(e) => handleMoveUpDown(e, idx, 'up')}
                  title="Move Lesson Up"
                  className="p-0.5 hover:bg-slate-200 rounded text-slate-500"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              )}
              {idx < lessons.length - 1 && (
                <button
                  onClick={(e) => handleMoveUpDown(e, idx, 'down')}
                  title="Move Lesson Down"
                  className="p-0.5 hover:bg-slate-200 rounded text-slate-500"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Edit / Rename */}
              <button
                onClick={(e) => handleStartEdit(e, lesson)}
                title="Rename & Edit Details"
                className="p-1 hover:bg-slate-200 rounded text-slate-600"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>

              {/* Delete */}
              <button
                onClick={(e) => handleDeleteLesson(e, lesson.id)}
                title="Delete Lesson"
                className="p-1 hover:bg-rose-100 hover:text-rose-600 rounded text-slate-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}

      {/* Add Lesson Form / Button */}
      {isAddingLesson ? (
        <form
          onSubmit={handleCreateLesson}
          className="p-2.5 bg-white rounded-lg border border-indigo-200 shadow-2xs space-y-2 mt-2"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
              New Lesson
            </span>
            <button
              type="button"
              onClick={() => setIsAddingLesson(false)}
              className="p-0.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <input
            type="text"
            value={newLessonTitle}
            onChange={(e) => setNewLessonTitle(e.target.value)}
            placeholder="e.g. Lesson 1: Getting Started"
            className="w-full text-xs px-2 py-1 bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 text-slate-900 font-medium"
            autoFocus
          />

          <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="number"
                min={1}
                value={newLessonDuration}
                onChange={(e) => setNewLessonDuration(Number(e.target.value))}
                className="w-12 px-1 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded font-mono"
              />
              <span className="text-[11px] text-slate-500">min</span>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1 text-[11px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={newIsPreview}
                  onChange={(e) => setNewIsPreview(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
                Preview
              </label>

              <label className="flex items-center gap-1 text-[11px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={newIsLocked}
                  onChange={(e) => setNewIsLocked(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                />
                Locked
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddingLesson(false)}
              className="px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !newLessonTitle.trim()}
              className="px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded hover:bg-indigo-700 disabled:opacity-50 shadow-2xs"
            >
              Create Lesson
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsAddingLesson(true)}
          className="flex items-center gap-1.5 w-full text-left px-2 py-1.5 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/60 rounded-md transition-colors mt-1 font-semibold"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Lesson</span>
        </button>
      )}

      {/* Modal: Move Lesson to another Section */}
      {moveLessonModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-xs w-full p-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <FolderInput className="w-4 h-4 text-indigo-600" />
                Move Lesson
              </h4>
              <button
                onClick={() => setMoveLessonModal(null)}
                className="p-0.5 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-3 truncate">
              Move <span className="font-semibold text-slate-900">"{moveLessonModal.title}"</span> to:
            </p>

            <select
              value={targetSectionId}
              onChange={(e) => setTargetSectionId(e.target.value)}
              className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg bg-white mb-4 text-slate-800 font-medium"
            >
              {allSections
                .filter((s) => s.id !== sectionId)
                .map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.title}
                  </option>
                ))}
            </select>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setMoveLessonModal(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMoveToSection}
                disabled={isMoving || !targetSectionId}
                className="px-3.5 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {isMoving ? 'Moving...' : 'Move Lesson'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonTree;
