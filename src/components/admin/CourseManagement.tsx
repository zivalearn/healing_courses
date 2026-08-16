import React, { useState, useMemo } from 'react';
import { Course, CourseCategory, CourseMode } from '../../models/course';
import { CourseTable } from './CourseTable';
import { 
  Search, 
  Filter, 
  Plus, 
  LayoutGrid, 
  List, 
  CheckSquare, 
  Archive, 
  Trash2, 
  CheckCircle2, 
  Layers, 
  RotateCcw,
  Sparkles,
  ChevronDown
} from 'lucide-react';

interface CourseManagementProps {
  courses: Course[];
  onCreateCourse: () => void;
  onEditCourse: (course: Course) => void;
  onOpenBuilderCourse?: (course: Course) => void;
  onDuplicateCourse: (id: string) => void;
  onArchiveToggle: (course: Course) => void;
  onDeleteCourse: (id: string) => void;
  onPreviewCourse: (course: Course) => void;
  onPublishToggle: (course: Course) => void;
  onBulkPublish: (ids: string[]) => void;
  onBulkArchive: (ids: string[]) => void;
  onBulkDelete: (ids: string[]) => void;
  onBulkChangeCategory: (ids: string[], category: CourseCategory) => void;
}

const CATEGORIES: CourseCategory[] = ['Certification', 'Healing', 'Personal Growth', 'Energy Healing'];
const MODALITIES = ['All Modalities', 'Reiki', 'NLP', 'Sound Healing', 'Subconscious', 'Crystal'];

export const CourseManagement: React.FC<CourseManagementProps> = ({
  courses,
  onCreateCourse,
  onEditCourse,
  onOpenBuilderCourse,
  onDuplicateCourse,
  onArchiveToggle,
  onDeleteCourse,
  onPreviewCourse,
  onPublishToggle,
  onBulkPublish,
  onBulkArchive,
  onBulkDelete,
  onBulkChangeCategory
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [modalityFilter, setModalityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'title' | 'price-low' | 'price-high'>('newest');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkCategory, setBulkCategory] = useState<CourseCategory>('Healing');
  const [showBulkCategoryDropdown, setShowBulkCategoryDropdown] = useState(false);

  // Filtered & Sorted Courses
  const filteredCourses = useMemo(() => {
    const safeCourses = Array.isArray(courses) ? courses : [];
    return safeCourses.filter(course => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (course.name || course.title || '').toLowerCase().includes(q);
        const matchDesc = (course.shortDescription || '').toLowerCase().includes(q);
        const matchCategory = (course.category || '').toLowerCase().includes(q);
        const matchModality = (course.modality || '').toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchCategory && !matchModality) return false;
      }

      // Status filter
      if (statusFilter === 'published') {
        if (!course.isPublished || course.status === 'archived') return false;
      } else if (statusFilter === 'draft') {
        if (course.isPublished || course.status === 'archived') return false;
      } else if (statusFilter === 'archived') {
        if (course.status !== 'archived') return false;
      }

      // Category filter
      if (categoryFilter !== 'all') {
        if (course.category !== categoryFilter) return false;
      }

      // Modality filter
      if (modalityFilter !== 'all') {
        const mod = (course.modality || course.mode || '').toLowerCase();
        if (!mod.includes(modalityFilter.toLowerCase())) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'title') {
        return (a.name || a.title || '').localeCompare(b.name || b.title || '');
      } else if (sortBy === 'price-low') {
        return (a.price || 0) - (b.price || 0);
      } else if (sortBy === 'price-high') {
        return (b.price || 0) - (a.price || 0);
      }
      // Newest
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [courses, searchQuery, statusFilter, categoryFilter, modalityFilter, sortBy]);

  // Bulk selections
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredCourses.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCourses.map(c => c.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Title & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif font-bold text-2xl text-[#102A36]">Course Management</h1>
          <p className="text-xs text-[#486D7A]">
            Author, publish, edit, duplicate, and archive Heal With Heer courses
          </p>
        </div>

        <button
          onClick={onCreateCourse}
          className="px-5 py-2.5 rounded-xl bg-[#287687] hover:bg-[#102A36] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 text-[#CBA258]" />
          <span>Create New Course</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#C8E6E1] shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="md:col-span-2 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#287687]">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses by title, category, modality, instructor..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F7FCFA] border border-[#C8E6E1] text-xs font-semibold text-[#102A36] focus:outline-none focus:border-[#287687]"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#F7FCFA] border border-[#C8E6E1] text-xs font-bold text-[#102A36] focus:outline-none focus:border-[#287687]"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#F7FCFA] border border-[#C8E6E1] text-xs font-bold text-[#102A36] focus:outline-none focus:border-[#287687]"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="title">Sort: Title A-Z</option>
              <option value="price-low">Sort: Price Low to High</option>
              <option value="price-high">Sort: Price High to Low</option>
            </select>
          </div>
        </div>

        {/* Category & Modality Filter Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#EEF7F5]">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#287687] shrink-0">Category:</span>
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-[#287687] text-white'
                  : 'bg-[#EEF7F5] text-[#486D7A] hover:bg-[#E2F1EE]'
              }`}
            >
              All Categories
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-[#287687] text-white'
                    : 'bg-[#EEF7F5] text-[#486D7A] hover:bg-[#E2F1EE]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="text-xs text-[#486D7A] font-semibold">
            Showing <strong>{filteredCourses.length}</strong> of {courses.length} courses
          </div>
        </div>
      </div>

      {/* Bulk Action Bar (Visible when items are selected) */}
      {selectedIds.length > 0 && (
        <div className="p-4 rounded-2xl bg-[#102A36] text-white shadow-lg flex flex-wrap items-center justify-between gap-4 animate-fade-in border border-[#CBA258]/40">
          <div className="flex items-center gap-2 text-xs font-bold">
            <CheckSquare className="w-4 h-4 text-[#CBA258]" />
            <span>{selectedIds.length} course(s) selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => { onBulkPublish(selectedIds); setSelectedIds([]); }}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Bulk Publish</span>
            </button>

            <button
              onClick={() => { onBulkArchive(selectedIds); setSelectedIds([]); }}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Bulk Archive</span>
            </button>

            {/* Bulk Change Category Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowBulkCategoryDropdown(!showBulkCategoryDropdown)}
                className="px-3 py-1.5 rounded-xl bg-[#287687] hover:bg-[#1C5B69] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-[#CBA258]" />
                <span>Change Category</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showBulkCategoryDropdown && (
                <div className="absolute right-0 mt-1 w-44 bg-white text-[#102A36] rounded-xl shadow-xl border border-[#C8E6E1] py-1 z-30 font-semibold">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => {
                        onBulkChangeCategory(selectedIds, cat);
                        setSelectedIds([]);
                        setShowBulkCategoryDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-[#EEF7F5] cursor-pointer"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => { onBulkDelete(selectedIds); setSelectedIds([]); }}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bulk Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Course Table Component */}
      <CourseTable
        courses={filteredCourses}
        selectedIds={selectedIds}
        onToggleSelectAll={handleToggleSelectAll}
        onToggleSelectOne={handleToggleSelectOne}
        onEdit={onEditCourse}
        onOpenBuilder={(c) => onOpenBuilderCourse ? onOpenBuilderCourse(c) : onEditCourse(c)}
        onDuplicate={onDuplicateCourse}
        onArchiveToggle={onArchiveToggle}
        onDelete={onDeleteCourse}
        onPreview={onPreviewCourse}
        onPublishToggle={onPublishToggle}
      />
    </div>
  );
};
