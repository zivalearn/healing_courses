import React, { useState } from 'react';
import { Course } from '../../../models/course';
import { Lesson } from '../../../models/lesson';
import { LessonBlockEditor } from './LessonBlockEditor';
import { EmptyState } from './EmptyState';
import {
  BookOpen,
  Eye,
  Edit3,
  Layers,
  Sparkles,
  CheckCircle,
  Menu,
} from 'lucide-react';

interface CourseContentProps {
  course: Course | null;
  selectedLesson: Lesson | null;
  onRefreshLesson: () => void;
  onToggleMobileSidebar?: () => void;
}

export const CourseContent: React.FC<CourseContentProps> = ({
  course,
  selectedLesson,
  onRefreshLesson,
  onToggleMobileSidebar,
}) => {
  const [isStudentPreview, setIsStudentPreview] = useState(false);

  if (!course) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center bg-slate-50">
        <EmptyState
          icon={BookOpen}
          title="No Course Selected"
          description="Select an existing course from the sidebar or create a new course to launch Course Studio."
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/70">
      {/* Content Header Bar */}
      <header className="h-14 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-800 truncate max-w-[180px] sm:max-w-xs">
              {course.title || course.name}
            </span>
            {selectedLesson && (
              <>
                <span>/</span>
                <span className="font-medium text-indigo-600 truncate max-w-[180px]">
                  {selectedLesson.title}
                </span>
              </>
            )}
          </div>
        </div>

        {/* View Switcher: Editor Mode vs Student Preview */}
        {selectedLesson && (
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setIsStudentPreview(false)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                !isStudentPreview
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Studio Editor</span>
            </button>
            <button
              onClick={() => setIsStudentPreview(true)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                isStudentPreview
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Student Preview</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Body */}
      <main className="flex-1 overflow-y-auto p-6">
        {selectedLesson ? (
          <LessonBlockEditor
            lesson={selectedLesson}
            onRefreshLesson={onRefreshLesson}
            isStudentPreview={isStudentPreview}
          />
        ) : (
          <EmptyState
            icon={Layers}
            title="Select a Lesson to Edit"
            description="Choose a lesson from the curriculum sidebar on the left, or create a new lesson inside any section to start adding content blocks."
          />
        )}
      </main>
    </div>
  );
};

export default CourseContent;
