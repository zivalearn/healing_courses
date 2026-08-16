import React from 'react';
import { BuilderSection, BuilderLesson, StructureType } from '../../../models/builder';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Trash2, 
  ChevronUp, 
  BookOpen, 
  Clock, 
  Sparkles, 
  Eye, 
  Layers, 
  Calendar, 
  GripVertical,
  CheckCircle2
} from 'lucide-react';

interface VisualCourseTreeProps {
  sections: BuilderSection[];
  activeLessonId: string | null;
  structureType: StructureType;
  onSelectLesson: (lessonId: string) => void;
  onToggleCollapseSection: (sectionId: string) => void;
  onAddSection: () => void;
  onAddLesson: (sectionId: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onDeleteLesson: (sectionId: string, lessonId: string) => void;
  onMoveSection: (sectionId: string, direction: 'up' | 'down') => void;
  onMoveLesson: (sectionId: string, lessonId: string, direction: 'up' | 'down') => void;
  onChangeStructureType: (type: StructureType) => void;
}

export const VisualCourseTree: React.FC<VisualCourseTreeProps> = ({
  sections,
  activeLessonId,
  structureType,
  onSelectLesson,
  onToggleCollapseSection,
  onAddSection,
  onAddLesson,
  onDeleteSection,
  onDeleteLesson,
  onMoveSection,
  onMoveLesson,
  onChangeStructureType
}) => {
  return (
    <div className="bg-[#102A36] text-white rounded-3xl border border-[#1C3E4C] p-4 space-y-4 shadow-xl flex flex-col h-full">
      
      {/* Structure Selector (Week Based vs Module Based) */}
      <div className="p-3 rounded-2xl bg-[#0B3843] border border-[#1C3E4C] space-y-2">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#CBA258]">
          <span className="flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            Structure Mode
          </span>
          <span className="text-white/60">Phase 3</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#102A36] rounded-xl border border-[#1C3E4C]">
          <button
            type="button"
            onClick={() => onChangeStructureType('week-based')}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              structureType === 'week-based'
                ? 'bg-[#287687] text-white shadow-xs'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-[#CBA258]" />
            <span>Week Based</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeStructureType('module-based')}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              structureType === 'module-based'
                ? 'bg-[#287687] text-white shadow-xs'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#CBA258]" />
            <span>Module Based</span>
          </button>
        </div>
      </div>

      {/* Sections & Lessons Tree List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
        {sections.map((section, sIdx) => {
          const isCollapsed = section.isCollapsed ?? false;

          return (
            <div key={section.id} className="p-3 rounded-2xl bg-[#0B3843]/60 border border-[#1C3E4C] space-y-2">
              {/* Section Header */}
              <div className="flex items-center justify-between gap-1 group">
                <button
                  type="button"
                  onClick={() => onToggleCollapseSection(section.id)}
                  className="flex items-center gap-2 flex-1 text-left min-w-0 cursor-pointer"
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4 text-[#CBA258] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#CBA258] shrink-0" />
                  )}
                  <span className="font-bold text-xs text-white truncate hover:text-[#CBA258] transition-colors">
                    {section.title}
                  </span>
                </button>

                {/* Section Controls */}
                <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    disabled={sIdx === 0}
                    onClick={() => onMoveSection(section.id, 'up')}
                    className="p-1 rounded text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-20 cursor-pointer"
                    title="Move Section Up"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    disabled={sIdx === sections.length - 1}
                    onClick={() => onMoveSection(section.id, 'down')}
                    className="p-1 rounded text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-20 cursor-pointer"
                    title="Move Section Down"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteSection(section.id)}
                    className="p-1 rounded text-white/40 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                    title="Delete Section"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Lessons List inside Section */}
              {!isCollapsed && (
                <div className="pl-3 space-y-1.5 border-l-2 border-[#1C3E4C] pt-1">
                  {section.lessons.map((lesson, lIdx) => {
                    const isActive = activeLessonId === lesson.id;
                    const blockCount = lesson.blocks?.length || 0;

                    return (
                      <div
                        key={lesson.id}
                        onClick={() => onSelectLesson(lesson.id)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 group ${
                          isActive
                            ? 'bg-[#287687] text-white border-[#CBA258] shadow-md font-bold'
                            : 'bg-[#102A36]/60 text-white/80 hover:bg-[#102A36] border-[#1C3E4C] hover:text-white'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <BookOpen className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#CBA258]' : 'text-white/60'}`} />
                            <span className="text-xs truncate block">{lesson.title}</span>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-white/60 mt-1">
                            <span>{blockCount} block{blockCount !== 1 ? 's' : ''}</span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <Clock className="w-3 h-3 text-[#CBA258]" />
                              {lesson.estimatedTime || '15m'}
                            </span>
                            {lesson.isPreviewAllowed && (
                              <span className="px-1 rounded bg-[#CBA258] text-[#102A36] font-bold text-[8px] uppercase">
                                Free
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Lesson Reorder Buttons */}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            disabled={lIdx === 0}
                            onClick={(e) => { e.stopPropagation(); onMoveLesson(section.id, lesson.id, 'up'); }}
                            className="p-1 rounded text-white/60 hover:text-white disabled:opacity-20 cursor-pointer"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={lIdx === section.lessons.length - 1}
                            onClick={(e) => { e.stopPropagation(); onMoveLesson(section.id, lesson.id, 'down'); }}
                            className="p-1 rounded text-white/60 hover:text-white disabled:opacity-20 cursor-pointer"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onDeleteLesson(section.id, lesson.id); }}
                            className="p-1 rounded text-white/40 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add Lesson Button */}
                  <button
                    type="button"
                    onClick={() => onAddLesson(section.id)}
                    className="w-full py-2 px-3 rounded-xl border border-dashed border-[#287687] text-[#CBA258] hover:bg-[#287687]/20 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add {structureType === 'week-based' ? 'Day / Lesson' : 'Lesson'}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Section Button */}
      <button
        type="button"
        onClick={onAddSection}
        className="w-full py-2.5 px-4 rounded-2xl bg-[#CBA258] hover:bg-[#b08b47] text-[#102A36] font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
      >
        <Plus className="w-4 h-4" />
        <span>Add New {structureType === 'week-based' ? 'Week' : 'Module'}</span>
      </button>

    </div>
  );
};
