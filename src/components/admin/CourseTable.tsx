import React, { useState } from 'react';
import { Course } from '../../models/course';
import { storageService } from '../../services/storageService';
import { 
  MoreVertical, 
  Edit3, 
  Copy, 
  Archive, 
  ArchiveRestore, 
  Trash2, 
  Eye, 
  Check, 
  Star, 
  Image as ImageIcon,
  Clock,
  Sparkles,
  Layers
} from 'lucide-react';

interface CourseTableProps {
  courses: Course[];
  selectedIds: string[];
  onToggleSelectAll: () => void;
  onToggleSelectOne: (id: string) => void;
  onEdit: (course: Course) => void;
  onOpenBuilder: (course: Course) => void;
  onDuplicate: (id: string) => void;
  onArchiveToggle: (course: Course) => void;
  onDelete: (id: string) => void;
  onPreview: (course: Course) => void;
  onPublishToggle: (course: Course) => void;
}

export const CourseTable: React.FC<CourseTableProps> = ({
  courses,
  selectedIds,
  onToggleSelectAll,
  onToggleSelectOne,
  onEdit,
  onOpenBuilder,
  onDuplicate,
  onArchiveToggle,
  onDelete,
  onPreview,
  onPublishToggle
}) => {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const isAllSelected = courses.length > 0 && selectedIds.length === courses.length;

  return (
    <div className="bg-white rounded-2xl border border-[#C8E6E1] shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#EEF7F5] border-b border-[#C8E6E1] text-[10px] font-bold uppercase tracking-wider text-[#287687]">
              <th className="p-4 w-12 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onToggleSelectAll}
                  className="w-4 h-4 rounded text-[#287687] cursor-pointer"
                />
              </th>
              <th className="p-4 min-w-[280px]">Course</th>
              <th className="p-4 min-w-[140px]">Instructor</th>
              <th className="p-4 min-w-[140px]">Modality</th>
              <th className="p-4 min-w-[100px]">Price</th>
              <th className="p-4 min-w-[120px]">Status</th>
              <th className="p-4 min-w-[130px]">Created Date</th>
              <th className="p-4 w-20 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E2F1EE] text-xs">
            {courses.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-[#486D7A]">
                  No courses found matching your criteria.
                </td>
              </tr>
            ) : (
              courses.map((course) => {
                const isSelected = selectedIds.includes(course.id);
                const isArchived = course.status === 'archived';
                const isPublished = course.isPublished ?? (course.status === 'published');
                const isDraft = !isPublished && !isArchived;

                const instructorName = typeof course.instructor === 'object' ? course.instructor?.name : course.instructor || 'Heer';

                return (
                  <tr
                    key={course.id}
                    className={`hover:bg-[#F7FCFA] transition-colors ${
                      isSelected ? 'bg-[#E2F1EE]/60' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelectOne(course.id)}
                        className="w-4 h-4 rounded text-[#287687] cursor-pointer"
                      />
                    </td>

                    {/* Thumbnail + Name */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-[#C8E6E1] relative">
                          <img
                            src={storageService.getCourseImageUrl(course.thumbnail || course.image)}
                            alt={course.name || course.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop';
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-[#287687] bg-[#EEF7F5] px-2 py-0.5 rounded-md">
                              {course.category}
                            </span>
                            {course.isFeatured && (
                              <span className="text-[9px] font-bold text-[#102A36] bg-[#CBA258] px-1.5 py-0.5 rounded flex items-center gap-1">
                                <Star className="w-2.5 h-2.5 fill-[#102A36]" />
                                FEATURED
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-[#102A36] mt-1 line-clamp-1 hover:text-[#287687] transition-colors">
                            {course.name || course.title}
                          </h4>
                        </div>
                      </div>
                    </td>

                    {/* Instructor */}
                    <td className="p-4 font-semibold text-[#102A36]">
                      {instructorName}
                    </td>

                    {/* Modality */}
                    <td className="p-4 text-[#486D7A] font-medium">
                      {course.modality || course.mode}
                    </td>

                    {/* Price */}
                    <td className="p-4 font-bold text-[#102A36]">
                      {course.currency || '$'}{course.price}
                      {course.originalPrice && course.originalPrice > course.price && (
                        <span className="text-[10px] text-gray-400 line-through block font-normal">
                          {course.currency || '$'}{course.originalPrice}
                        </span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="p-4">
                      {isArchived ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-300">
                          Archived
                        </span>
                      ) : isPublished ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Published
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          Draft
                        </span>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="p-4 text-[#486D7A] text-[11px] font-medium">
                      {course.createdAt ? new Date(course.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                    </td>

                    {/* Actions Menu */}
                    <td className="p-4 text-right relative">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onOpenBuilder(course)}
                          className="px-2 py-1 rounded-lg bg-[#EEF7F5] hover:bg-[#287687] text-[#287687] hover:text-white font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                          title="Open Course Builder Studio"
                        >
                          <Layers className="w-3.5 h-3.5 text-[#CBA258]" />
                          <span className="hidden sm:inline">Builder</span>
                        </button>

                        <button
                          onClick={() => onEdit(course)}
                          className="p-1.5 rounded-lg hover:bg-[#EEF7F5] text-[#287687] transition-colors cursor-pointer"
                          title="Edit Course Settings"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onPreview(course)}
                          className="p-1.5 rounded-lg hover:bg-[#EEF7F5] text-[#287687] transition-colors cursor-pointer"
                          title="Preview Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* More Menu Dropdown Toggle */}
                        <div className="relative">
                          <button
                            onClick={() => setOpenDropdownId(openDropdownId === course.id ? null : course.id)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {openDropdownId === course.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenDropdownId(null)}
                              />
                              <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-[#C8E6E1] py-1.5 z-20 text-left text-xs font-semibold animate-fade-in">
                                <button
                                  onClick={() => { onDuplicate(course.id); setOpenDropdownId(null); }}
                                  className="w-full px-3 py-2 hover:bg-[#EEF7F5] text-[#102A36] flex items-center gap-2 cursor-pointer"
                                >
                                  <Copy className="w-3.5 h-3.5 text-[#287687]" />
                                  <span>Duplicate</span>
                                </button>

                                <button
                                  onClick={() => { onPublishToggle(course); setOpenDropdownId(null); }}
                                  className="w-full px-3 py-2 hover:bg-[#EEF7F5] text-[#102A36] flex items-center gap-2 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-[#287687]" />
                                  <span>{isPublished ? 'Unpublish' : 'Publish'}</span>
                                </button>

                                <button
                                  onClick={() => { onArchiveToggle(course); setOpenDropdownId(null); }}
                                  className="w-full px-3 py-2 hover:bg-[#EEF7F5] text-[#102A36] flex items-center gap-2 cursor-pointer"
                                >
                                  {isArchived ? (
                                    <>
                                      <ArchiveRestore className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Unarchive</span>
                                    </>
                                  ) : (
                                    <>
                                      <Archive className="w-3.5 h-3.5 text-amber-600" />
                                      <span>Archive</span>
                                    </>
                                  )}
                                </button>

                                <div className="my-1 border-t border-gray-100" />

                                <button
                                  onClick={() => { onDelete(course.id); setOpenDropdownId(null); }}
                                  className="w-full px-3 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
