import React, { useState, useEffect } from 'react';
import { CourseBuilderData, BuilderSection, BuilderLesson, LessonBlock, BlockType, createDefaultBlock, StructureType } from '../../models/builder';
import { builderService } from '../../services/builderService';
import { VisualCourseTree } from './builder/VisualCourseTree';
import { BlockEditorCard } from './builder/BlockEditorCard';
import { BlockPickerModal } from './builder/BlockPickerModal';
import { StudentPreviewModal } from './builder/StudentPreviewModal';
import { 
  ArrowLeft, 
  Sparkles, 
  Save, 
  Eye, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Calendar, 
  Lock, 
  CheckSquare, 
  Settings2,
  BookOpen
} from 'lucide-react';

interface CourseAuthoringStudioProps {
  courseId: string;
  courseTitle: string;
  onBack: () => void;
}

export const CourseAuthoringStudio: React.FC<CourseAuthoringStudioProps> = ({
  courseId,
  courseTitle,
  onBack
}) => {
  const [builderData, setBuilderData] = useState<CourseBuilderData>(() => 
    builderService.getCourseBuilderData(courseId, 'week-based')
  );
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [isBlockPickerOpen, setIsBlockPickerOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('Just now');
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  // Initialize active lesson
  useEffect(() => {
    if (builderData.sections.length > 0 && builderData.sections[0].lessons.length > 0) {
      if (!activeLessonId) {
        setActiveLessonId(builderData.sections[0].lessons[0].id);
      }
    }
  }, [builderData]);

  // Screen resize check for mobile authoring warning
  useEffect(() => {
    const checkWidth = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  // Autosave helper
  const handleSaveData = (newData: CourseBuilderData) => {
    setBuilderData(newData);
    builderService.saveCourseBuilderData(courseId, newData);
    const now = new Date();
    setLastSavedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  };

  // Find active lesson object
  let activeLesson: BuilderLesson | null = null;
  let activeSectionId: string | null = null;

  for (const sec of builderData.sections) {
    const found = sec.lessons.find(l => l.id === activeLessonId);
    if (found) {
      activeLesson = found;
      activeSectionId = sec.id;
      break;
    }
  }

  // Structure Switcher
  const handleStructureTypeChange = (targetType: StructureType) => {
    const converted = builderService.convertStructureType(builderData, targetType);
    handleSaveData(converted);
  };

  // Section Actions
  const handleAddSection = () => {
    const count = builderData.sections.length + 1;
    const isWeek = builderData.structureType === 'week-based';
    const newSec: BuilderSection = {
      id: 'sec_' + Date.now(),
      title: isWeek ? `Week ${count}: New Week Module` : `Module ${count}: New Module`,
      subtitle: 'Section description and core focus',
      isCollapsed: false,
      lessons: [
        {
          id: 'les_' + Date.now(),
          title: isWeek ? 'Day 1: Introductory Ritual' : 'Lesson 1: Introduction',
          estimatedTime: '15 mins',
          isRequired: true,
          isPreviewAllowed: false,
          blocks: [createDefaultBlock('heading'), createDefaultBlock('paragraph')]
        }
      ]
    };

    const updatedSections = [...builderData.sections, newSec];
    const updatedData = { ...builderData, sections: updatedSections };
    handleSaveData(updatedData);
    setActiveLessonId(newSec.lessons[0].id);
  };

  const handleToggleCollapseSection = (secId: string) => {
    const updatedSections = builderData.sections.map(s => 
      s.id === secId ? { ...s, isCollapsed: !s.isCollapsed } : s
    );
    handleSaveData({ ...builderData, sections: updatedSections });
  };

  const handleDeleteSection = (secId: string) => {
    if (builderData.sections.length <= 1) {
      alert('Course must contain at least one section/week.');
      return;
    }
    const updatedSections = builderData.sections.filter(s => s.id !== secId);
    const updatedData = { ...builderData, sections: updatedSections };
    handleSaveData(updatedData);

    if (activeSectionId === secId && updatedSections.length > 0) {
      setActiveLessonId(updatedSections[0].lessons[0]?.id || null);
    }
  };

  const handleMoveSection = (secId: string, direction: 'up' | 'down') => {
    const idx = builderData.sections.findIndex(s => s.id === secId);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= builderData.sections.length) return;

    const copy = [...builderData.sections];
    const temp = copy[idx];
    copy[idx] = copy[targetIdx];
    copy[targetIdx] = temp;

    handleSaveData({ ...builderData, sections: copy });
  };

  // Lesson Actions
  const handleAddLesson = (sectionId: string) => {
    const sec = builderData.sections.find(s => s.id === sectionId);
    if (!sec) return;

    const count = sec.lessons.length + 1;
    const isWeek = builderData.structureType === 'week-based';
    const newLesson: BuilderLesson = {
      id: 'les_' + Date.now(),
      title: isWeek ? `Day ${count}: New Daily Practice` : `Lesson ${count}: New Concept`,
      estimatedTime: '15 mins',
      isRequired: true,
      isPreviewAllowed: false,
      blocks: [createDefaultBlock('heading'), createDefaultBlock('paragraph')]
    };

    const updatedSections = builderData.sections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          isCollapsed: false,
          lessons: [...s.lessons, newLesson]
        };
      }
      return s;
    });

    handleSaveData({ ...builderData, sections: updatedSections });
    setActiveLessonId(newLesson.id);
  };

  const handleDeleteLesson = (sectionId: string, lessonId: string) => {
    const sec = builderData.sections.find(s => s.id === sectionId);
    if (!sec || sec.lessons.length <= 1) {
      alert('Section must contain at least one lesson.');
      return;
    }

    const updatedSections = builderData.sections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          lessons: s.lessons.filter(l => l.id !== lessonId)
        };
      }
      return s;
    });

    handleSaveData({ ...builderData, sections: updatedSections });
    if (activeLessonId === lessonId) {
      const remaining = sec.lessons.filter(l => l.id !== lessonId);
      setActiveLessonId(remaining[0]?.id || null);
    }
  };

  const handleMoveLesson = (sectionId: string, lessonId: string, direction: 'up' | 'down') => {
    const sec = builderData.sections.find(s => s.id === sectionId);
    if (!sec) return;

    const idx = sec.lessons.findIndex(l => l.id === lessonId);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sec.lessons.length) return;

    const newLessons = [...sec.lessons];
    const temp = newLessons[idx];
    newLessons[idx] = newLessons[targetIdx];
    newLessons[targetIdx] = temp;

    const updatedSections = builderData.sections.map(s => 
      s.id === sectionId ? { ...s, lessons: newLessons } : s
    );

    handleSaveData({ ...builderData, sections: updatedSections });
  };

  // Block Operations inside Active Lesson
  const handleAddBlockToActiveLesson = (type: BlockType) => {
    if (!activeLesson || !activeSectionId) return;
    const newBlock = createDefaultBlock(type);

    const updatedSections = builderData.sections.map(s => {
      if (s.id === activeSectionId) {
        return {
          ...s,
          lessons: s.lessons.map(l => {
            if (l.id === activeLesson!.id) {
              return {
                ...l,
                blocks: [...l.blocks, newBlock]
              };
            }
            return l;
          })
        };
      }
      return s;
    });

    handleSaveData({ ...builderData, sections: updatedSections });
  };

  const handleUpdateBlockInActiveLesson = (updatedBlock: LessonBlock) => {
    if (!activeLesson || !activeSectionId) return;

    const updatedSections = builderData.sections.map(s => {
      if (s.id === activeSectionId) {
        return {
          ...s,
          lessons: s.lessons.map(l => {
            if (l.id === activeLesson!.id) {
              return {
                ...l,
                blocks: l.blocks.map(b => b.id === updatedBlock.id ? updatedBlock : b)
              };
            }
            return l;
          })
        };
      }
      return s;
    });

    handleSaveData({ ...builderData, sections: updatedSections });
  };

  const handleMoveBlockInActiveLesson = (blockId: string, direction: 'up' | 'down') => {
    if (!activeLesson || !activeSectionId) return;

    const blocks = activeLesson.blocks;
    const idx = blocks.findIndex(b => b.id === blockId);
    if (idx < 0) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;

    const newBlocks = [...blocks];
    const temp = newBlocks[idx];
    newBlocks[idx] = newBlocks[targetIdx];
    newBlocks[targetIdx] = temp;

    const updatedSections = builderData.sections.map(s => {
      if (s.id === activeSectionId) {
        return {
          ...s,
          lessons: s.lessons.map(l => {
            if (l.id === activeLesson!.id) {
              return { ...l, blocks: newBlocks };
            }
            return l;
          })
        };
      }
      return s;
    });

    handleSaveData({ ...builderData, sections: updatedSections });
  };

  const handleDuplicateBlock = (blockId: string) => {
    if (!activeLesson || !activeSectionId) return;

    const targetBlock = activeLesson.blocks.find(b => b.id === blockId);
    if (!targetBlock) return;

    const duplicated: LessonBlock = {
      ...targetBlock,
      id: 'blk_' + Math.random().toString(36).substr(2, 9),
      content: JSON.parse(JSON.stringify(targetBlock.content))
    };

    const idx = activeLesson.blocks.findIndex(b => b.id === blockId);
    const newBlocks = [...activeLesson.blocks];
    newBlocks.splice(idx + 1, 0, duplicated);

    const updatedSections = builderData.sections.map(s => {
      if (s.id === activeSectionId) {
        return {
          ...s,
          lessons: s.lessons.map(l => {
            if (l.id === activeLesson!.id) {
              return { ...l, blocks: newBlocks };
            }
            return l;
          })
        };
      }
      return s;
    });

    handleSaveData({ ...builderData, sections: updatedSections });
  };

  const handleDeleteBlock = (blockId: string) => {
    if (!activeLesson || !activeSectionId) return;

    const updatedBlocks = activeLesson.blocks.filter(b => b.id !== blockId);

    const updatedSections = builderData.sections.map(s => {
      if (s.id === activeSectionId) {
        return {
          ...s,
          lessons: s.lessons.map(l => {
            if (l.id === activeLesson!.id) {
              return { ...l, blocks: updatedBlocks };
            }
            return l;
          })
        };
      }
      return s;
    });

    handleSaveData({ ...builderData, sections: updatedSections });
  };

  // Lesson Header Details Update (Title, estimated time, preview toggle)
  const handleUpdateActiveLessonMeta = (field: string, value: any) => {
    if (!activeLesson || !activeSectionId) return;

    const updatedSections = builderData.sections.map(s => {
      if (s.id === activeSectionId) {
        return {
          ...s,
          lessons: s.lessons.map(l => {
            if (l.id === activeLesson!.id) {
              return { ...l, [field]: value };
            }
            return l;
          })
        };
      }
      return s;
    });

    handleSaveData({ ...builderData, sections: updatedSections });
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Mobile Notice Banner */}
      {isMobileScreen && (
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Desktop Recommended:</strong> Course Authoring Studio is optimized for larger screens to edit block layouts easily.
          </span>
        </div>
      )}

      {/* Top Authoring Header */}
      <div className="bg-white rounded-3xl p-5 border border-[#C8E6E1] shadow-xs flex flex-wrap items-center justify-between gap-4">
        
        {/* Title & Back */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-[#EEF7F5] text-[#287687] hover:bg-[#287687] hover:text-white transition-colors cursor-pointer"
            title="Back to Course Management"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#287687]">
              <Sparkles className="w-3.5 h-3.5 text-[#CBA258]" />
              <span>Block-Based Course Authoring Studio</span>
            </div>
            <h1 className="text-lg sm:text-xl font-serif font-bold text-[#102A36]">
              {courseTitle}
            </h1>
          </div>
        </div>

        {/* Right Status & Preview Controls */}
        <div className="flex items-center gap-3">
          
          {/* Autosave Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#486D7A] bg-[#F7FCFA] px-3 py-1.5 rounded-xl border border-[#C8E6E1]">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Autosaved at {lastSavedTime}</span>
          </div>

          {/* Student LMS Preview Button */}
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="px-4 py-2 rounded-2xl bg-[#EEF7F5] hover:bg-[#287687] text-[#287687] hover:text-white border border-[#C8E6E1] font-bold text-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Eye className="w-4 h-4 text-[#CBA258]" />
            <span>Preview Student View</span>
          </button>

          {/* Save & Finish Button */}
          <button
            onClick={onBack}
            className="px-5 py-2.5 rounded-2xl bg-[#102A36] hover:bg-[#1C5B69] text-[#CBA258] font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Publish & Exit</span>
          </button>

        </div>
      </div>

      {/* Main Authoring Grid (Tree Sidebar + Lesson Canvas) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[650px]">
        
        {/* Left Column: Visual Course Tree Sidebar */}
        <div className="lg:col-span-4 h-full">
          <VisualCourseTree
            sections={builderData.sections}
            activeLessonId={activeLessonId}
            structureType={builderData.structureType}
            onSelectLesson={(id) => setActiveLessonId(id)}
            onToggleCollapseSection={handleToggleCollapseSection}
            onAddSection={handleAddSection}
            onAddLesson={handleAddLesson}
            onDeleteSection={handleDeleteSection}
            onDeleteLesson={handleDeleteLesson}
            onMoveSection={handleMoveSection}
            onMoveLesson={handleMoveLesson}
            onChangeStructureType={handleStructureTypeChange}
          />
        </div>

        {/* Right Column: Main Lesson Canvas Workspace */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-[#C8E6E1] p-6 sm:p-8 space-y-6 shadow-xs flex flex-col">
          {activeLesson ? (
            <>
              {/* Lesson Metadata Header Settings */}
              <div className="p-5 rounded-2xl bg-[#F7FCFA] border border-[#C8E6E1] space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2F1EE] pb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#287687]">
                    <Settings2 className="w-4 h-4 text-[#CBA258]" />
                    <span>Lesson Settings & Properties</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-[#102A36] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeLesson.isPreviewAllowed ?? false}
                        onChange={(e) => handleUpdateActiveLessonMeta('isPreviewAllowed', e.target.checked)}
                        className="rounded text-[#287687]"
                      />
                      <span className="text-emerald-700 font-bold">Free Preview</span>
                    </label>

                    <label className="flex items-center gap-1.5 text-xs font-bold text-[#102A36] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeLesson.isRequired ?? true}
                        onChange={(e) => handleUpdateActiveLessonMeta('isRequired', e.target.checked)}
                        className="rounded text-[#287687]"
                      />
                      <span>Required</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#287687] mb-1">
                      Lesson Title
                    </label>
                    <input
                      type="text"
                      value={activeLesson.title}
                      onChange={(e) => handleUpdateActiveLessonMeta('title', e.target.value)}
                      placeholder="e.g. Day 1: Mind Mechanics & Subconscious Beliefs"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#C8E6E1] bg-white font-serif font-bold text-base text-[#102A36]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#287687] mb-1">
                      Estimated Duration
                    </label>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-[#287687] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={activeLesson.estimatedTime || '15 mins'}
                        onChange={(e) => handleUpdateActiveLessonMeta('estimatedTime', e.target.value)}
                        placeholder="15 mins"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#C8E6E1] bg-white font-bold text-xs text-[#102A36]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#287687] mb-1">
                    Lesson Subtitle / Summary Focus
                  </label>
                  <input
                    type="text"
                    value={activeLesson.subtitle || ''}
                    onChange={(e) => handleUpdateActiveLessonMeta('subtitle', e.target.value)}
                    placeholder="Brief objective summary for students..."
                    className="w-full px-3 py-2 rounded-xl border border-[#C8E6E1] bg-white text-xs text-[#486D7A]"
                  />
                </div>
              </div>

              {/* Stacked Lesson Blocks Canvas */}
              <div className="space-y-4 flex-1">
                <div className="flex items-center justify-between border-b border-[#E2F1EE] pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#102A36]">
                    Lesson Blocks Canvas ({activeLesson.blocks.length})
                  </h3>
                  <span className="text-[10px] text-[#486D7A]">
                    Reorder, collapse, or customize block properties below
                  </span>
                </div>

                {activeLesson.blocks.length === 0 ? (
                  <div className="p-10 rounded-2xl border-2 border-dashed border-[#C8E6E1] text-center space-y-3 bg-[#F7FCFA]">
                    <BookOpen className="w-8 h-8 text-[#287687] mx-auto" />
                    <p className="text-xs font-bold text-[#102A36]">This lesson is currently empty.</p>
                    <p className="text-[11px] text-[#486D7A]">Click "+ Add Content Block" below to start composing.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeLesson.blocks.map((block, bIdx) => (
                      <BlockEditorCard
                        key={block.id}
                        block={block}
                        index={bIdx}
                        totalBlocks={activeLesson!.blocks.length}
                        onUpdateBlock={handleUpdateBlockInActiveLesson}
                        onMoveBlock={(dir) => handleMoveBlockInActiveLesson(block.id, dir)}
                        onDuplicateBlock={() => handleDuplicateBlock(block.id)}
                        onDeleteBlock={() => handleDeleteBlock(block.id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Add Block Button */}
              <div className="pt-4 border-t border-[#E2F1EE]">
                <button
                  type="button"
                  onClick={() => setIsBlockPickerOpen(true)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#EEF7F5] hover:bg-[#287687] text-[#287687] hover:text-white border-2 border-dashed border-[#287687] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Plus className="w-5 h-5 text-[#CBA258]" />
                  <span>Add Content Block</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-[#486D7A] space-y-3">
              <BookOpen className="w-10 h-10 text-[#287687]" />
              <h3 className="font-bold text-sm text-[#102A36]">No Lesson Selected</h3>
              <p className="text-xs">Select a lesson from the left course tree sidebar to start editing blocks.</p>
            </div>
          )}
        </div>

      </div>

      {/* Block Picker Modal */}
      <BlockPickerModal
        isOpen={isBlockPickerOpen}
        onClose={() => setIsBlockPickerOpen(false)}
        onSelectBlock={handleAddBlockToActiveLesson}
      />

      {/* Student LMS Preview Modal */}
      <StudentPreviewModal
        isOpen={isPreviewOpen}
        lesson={activeLesson}
        courseTitle={courseTitle}
        onClose={() => setIsPreviewOpen(false)}
      />

    </div>
  );
};
