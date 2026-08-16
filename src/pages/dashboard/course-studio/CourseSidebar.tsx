import React, { useState, useEffect } from 'react';
import { Course, SupabaseCourse } from '../../../models/course';
import { Section, SectionReorderItem } from '../../../models/section';
import { Lesson } from '../../../models/lesson';
import { courseService } from '../../../services/courseService';
import { sectionService } from '../../../services/sectionService';
import { SectionTree } from './SectionTree';
import {
  BookOpen,
  Plus,
  Search,
  ChevronDown,
  Layers,
  Sparkles,
  Edit3,
  X,
  Check,
  FolderPlus,
} from 'lucide-react';

interface CourseSidebarProps {
  selectedCourse: Course | null;
  coursesList: Course[];
  onSelectCourse: (course: Course) => void;
  selectedLessonId: string | null;
  onSelectLesson: (lesson: Lesson) => void;
  onRefreshCourse: () => void;
  onOpenCreateCourseModal: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const CourseSidebar: React.FC<CourseSidebarProps> = ({
  selectedCourse,
  coursesList,
  onSelectCourse,
  selectedLessonId,
  onSelectLesson,
  onRefreshCourse,
  onOpenCreateCourseModal,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const [sections, setSections] = useState<Section[]>([]);
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [isSubmittingSection, setIsSubmittingSection] = useState(false);

  // Drag and drop state for section ordering
  const [draggedSectionIndex, setDraggedSectionIndex] = useState<number | null>(null);
  const [dragOverSectionIndex, setDragOverSectionIndex] = useState<number | null>(null);

  const loadSections = async () => {
    if (!selectedCourse?.id) return;
    const { data } = await sectionService.getSectionsByCourse(selectedCourse.id);
    setSections(data || []);
  };

  useEffect(() => {
    loadSections();
  }, [selectedCourse?.id]);

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionTitle.trim() || !selectedCourse?.id) return;
    setIsSubmittingSection(true);

    const nextOrder = sections.length > 0 ? Math.max(...sections.map((s) => s.display_order)) + 1 : 0;
    await sectionService.createSection({
      course_id: selectedCourse.id,
      title: newSectionTitle.trim(),
      display_order: nextOrder,
      is_locked: false,
    });

    setNewSectionTitle('');
    setIsAddingSection(false);
    setIsSubmittingSection(false);
    loadSections();
  };

  // Reorder Handler (Move Up/Down or Drag & Drop)
  const handleMoveSection = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sections.length || !selectedCourse?.id) return;

    const updatedSections = [...sections];
    const temp = updatedSections[index];
    updatedSections[index] = updatedSections[targetIdx];
    updatedSections[targetIdx] = temp;

    setSections(updatedSections);

    const items: SectionReorderItem[] = updatedSections.map((sec, i) => ({
      id: sec.id,
      display_order: i,
    }));
    await sectionService.reorderSections(selectedCourse.id, items);
  };

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedSectionIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverSectionIndex !== index) {
      setDragOverSectionIndex(index);
    }
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (
      draggedSectionIndex === null ||
      draggedSectionIndex === dropIndex ||
      !selectedCourse?.id
    ) {
      setDraggedSectionIndex(null);
      setDragOverSectionIndex(null);
      return;
    }

    const updatedSections = [...sections];
    const [movedSection] = updatedSections.splice(draggedSectionIndex, 1);
    updatedSections.splice(dropIndex, 0, movedSection);

    setSections(updatedSections);
    setDraggedSectionIndex(null);
    setDragOverSectionIndex(null);

    const items: SectionReorderItem[] = updatedSections.map((sec, i) => ({
      id: sec.id,
      display_order: i,
    }));
    await sectionService.reorderSections(selectedCourse.id, items);
  };

  const handleDragEnd = () => {
    setDraggedSectionIndex(null);
    setDragOverSectionIndex(null);
  };

  const filteredSections = sections.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside
      className={`fixed lg:relative inset-y-0 left-0 z-30 w-80 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-transform duration-300 transform ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Mobile close button header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-800">
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Course Navigation
        </span>
        <button
          onClick={onCloseMobile}
          className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Course Selector Dropdown */}
      <div className="p-3 border-b border-slate-800/80 bg-slate-900/80">
        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
          Active Course
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsCourseDropdownOpen(!isCourseDropdownOpen)}
            className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700/80 text-white rounded-md border border-slate-700/80 text-xs font-medium transition-colors shadow-2xs cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 rounded bg-slate-700 text-slate-200 flex items-center justify-center shrink-0 border border-slate-600/60">
                <BookOpen className="w-3 h-3" />
              </div>
              <span className="truncate text-left font-semibold text-xs">
                {selectedCourse ? selectedCourse.title || selectedCourse.name : 'Select course...'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {isCourseDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-md shadow-xl z-50 overflow-hidden py-1 max-h-60 overflow-y-auto">
              <div className="px-2.5 py-1 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                Your Courses
              </div>
              {coursesList.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onSelectCourse(c);
                    setIsCourseDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-left transition-colors ${
                    selectedCourse?.id === c.id
                      ? 'bg-slate-700 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-700/50'
                  }`}
                >
                  <span className="truncate">{c.title || c.name}</span>
                  {selectedCourse?.id === c.id && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                </button>
              ))}

              <div className="border-t border-slate-700/80 my-1" />
              <button
                type="button"
                onClick={() => {
                  setIsCourseDropdownOpen(false);
                  onOpenCreateCourseModal();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-700/50 font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-slate-400" />
                <span>New Course</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="p-2.5 border-b border-slate-800/80">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter sections..."
            className="w-full pl-7 pr-2.5 py-1 bg-slate-800/70 border border-slate-700/60 rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600"
          />
        </div>
      </div>

      {/* Sections and Lessons Tree */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            Curriculum Architecture
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {sections.length} Sections
          </span>
        </div>

        {filteredSections.map((sec, idx) => (
          <SectionTree
            key={sec.id}
            section={sec}
            courseId={selectedCourse?.id || ''}
            selectedLessonId={selectedLessonId}
            onSelectLesson={(lesson) => {
              onSelectLesson(lesson);
              if (onCloseMobile) onCloseMobile();
            }}
            onRefreshCourse={loadSections}
            index={idx}
            totalSections={filteredSections.length}
            onMoveSection={handleMoveSection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            isDragging={draggedSectionIndex === idx}
            isDragOver={dragOverSectionIndex === idx}
            allSections={sections}
          />
        ))}

        {filteredSections.length === 0 && (
          <div className="text-center py-8 px-4 bg-slate-800/30 rounded-xl border border-dashed border-slate-800 text-slate-400 text-xs">
            <FolderPlus className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-60" />
            <p className="font-medium">No sections found</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Create your first section below to organize lessons.
            </p>
          </div>
        )}

        {/* Add Section Form / Button */}
        {isAddingSection ? (
          <form
            onSubmit={handleCreateSection}
            className="p-3 bg-slate-800/90 rounded-xl border border-indigo-500/40 space-y-2 mt-2 shadow-sm"
          >
            <input
              type="text"
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              placeholder="Section title (e.g. Module 1: Introduction)"
              className="w-full text-xs px-2.5 py-1.5 bg-slate-900 border border-slate-700 text-white rounded-md focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              autoFocus
            />
            <div className="flex items-center justify-end gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingSection(false)}
                className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingSection || !newSectionTitle.trim()}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-md disabled:opacity-50 transition-colors"
              >
                Add Section
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAddingSection(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 border border-dashed border-slate-700/80 hover:border-indigo-500/60 bg-slate-800/40 hover:bg-indigo-950/30 text-indigo-300 rounded-xl text-xs font-medium transition-all"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>Add New Section</span>
          </button>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Kajabi Studio Mode
        </span>
        <span className="text-[10px] text-emerald-400 font-mono">Synced</span>
      </div>
    </aside>
  );
};

export default CourseSidebar;

