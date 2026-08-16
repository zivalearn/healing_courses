import React, { useState, useEffect } from 'react';
import { Course } from '../../models/course';
import { courseService } from '../../services/courseService';
import { AdminSidebar, AdminTab, NAV_ITEMS } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { DashboardHome } from './DashboardHome';
import { CourseManagement } from './CourseManagement';
import { FullPageCourseEditor } from './FullPageCourseEditor';
import { CourseAuthoringStudio } from './CourseAuthoringStudio';
import { StudentsManagement } from './StudentsManagement';
import { EnrollmentsManagement } from './EnrollmentsManagement';
import { CertificatesManagement } from './CertificatesManagement';
import { ReviewsManagement } from './ReviewsManagement';
import { AnnouncementsManagement } from './AnnouncementsManagement';
import { AnalyticsOverview } from './AnalyticsOverview';
import { ComingSoonSection } from './ComingSoonSection';
import { CourseDetailsModal } from '../CourseDetailsModal';
import { Trash2, AlertTriangle, Loader2, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface DeleteModalState {
  isOpen: boolean;
  courseId?: string;
  courseTitle?: string;
  isBulk?: boolean;
  bulkIds?: string[];
}

export const AdminLayout: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Editor states
  const [isEditing, setIsEditing] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Course Builder states (Phase 3)
  const [isBuilding, setIsBuilding] = useState(false);
  const [builderCourse, setBuilderCourse] = useState<Course | null>(null);

  // Preview modal state
  const [previewCourse, setPreviewCourse] = useState<Course | null>(null);

  // Delete modal & action states
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({ isOpen: false });
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, message });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Load courses from courseService abstraction
  const loadCourses = async () => {
    const list = await courseService.getAllCourses();
    setCourses(Array.isArray(list) ? list : []);
  };

  useEffect(() => {
    loadCourses();
  }, []);

  // Course Handlers
  const handleCreateCourse = () => {
    setEditingCourse(null);
    setIsEditing(true);
    setIsBuilding(false);
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setIsEditing(true);
    setIsBuilding(false);
  };

  const handleOpenBuilder = (course: Course) => {
    setBuilderCourse(course);
    setIsBuilding(true);
    setIsEditing(false);
  };

  const handleSaveCourse = async (courseData: Partial<Course>, publish: boolean) => {
    await courseService.saveCourse(courseData);
    await loadCourses();
    setIsEditing(false);
    setEditingCourse(null);
    setActiveTab('courses');
    showToast('Course saved successfully.');
  };

  const handleDuplicateCourse = async (id: string) => {
    await courseService.duplicateCourse(id);
    await loadCourses();
    showToast('Course duplicated successfully.');
  };

  const handleArchiveToggle = async (course: Course) => {
    if (course.status === 'archived') {
      await courseService.unarchiveCourse(course.id);
      showToast('Course restored to published state.');
    } else {
      await courseService.archiveCourse(course.id);
      showToast('Course archived.');
    }
    await loadCourses();
  };

  // Open deletion modal for single course
  const handleDeleteCourse = (id: string) => {
    const target = courses.find(c => c.id === id);
    const title = target ? (target.name || target.title || 'this course') : 'this course';
    setDeleteModal({
      isOpen: true,
      courseId: id,
      courseTitle: title,
      isBulk: false
    });
  };

  // Open deletion modal for bulk courses
  const handleBulkDelete = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    setDeleteModal({
      isOpen: true,
      isBulk: true,
      bulkIds: ids
    });
  };

  // Execute deletion confirmed by user in modal
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (deleteModal.isBulk && deleteModal.bulkIds && deleteModal.bulkIds.length > 0) {
        const idsToDelete = deleteModal.bulkIds;
        // Optimistic UI update
        setCourses(prev => prev.filter(c => !idsToDelete.includes(c.id)));
        await courseService.bulkDelete(idsToDelete);
        await loadCourses();
        showToast(`${idsToDelete.length} courses permanently deleted.`);
      } else if (deleteModal.courseId) {
        const idToDelete = deleteModal.courseId;
        // Optimistic UI update
        setCourses(prev => prev.filter(c => c.id !== idToDelete));
        const res = await courseService.deleteCourse(idToDelete);
        if (res.error) {
          showToast(res.error.message || 'Failed to delete course', 'error');
        } else {
          showToast('Course deleted successfully.');
        }
        await loadCourses();
      }
    } catch (err: any) {
      console.error('Error during course deletion:', err);
      showToast(err.message || 'An error occurred during deletion', 'error');
      await loadCourses();
    } finally {
      setIsDeleting(false);
      setDeleteModal({ isOpen: false });
    }
  };

  const handlePublishToggle = async (course: Course) => {
    await courseService.saveCourse({
      id: course.id,
      isPublished: !course.isPublished,
      status: !course.isPublished ? 'published' : 'draft'
    });
    await loadCourses();
  };

  const handleBulkPublish = async (ids: string[]) => {
    await courseService.bulkPublish(ids);
    await loadCourses();
    showToast(`${ids.length} courses published.`);
  };

  const handleBulkArchive = async (ids: string[]) => {
    await courseService.bulkArchive(ids);
    await loadCourses();
    showToast(`${ids.length} courses archived.`);
  };

  const handleBulkChangeCategory = async (ids: string[], category: any) => {
    await courseService.bulkChangeCategory(ids, category);
    await loadCourses();
    showToast(`Category updated for ${ids.length} courses.`);
  };

  // Find active nav item title
  const activeNavItem = NAV_ITEMS.find(i => i.id === activeTab);
  const activeTabTitle = activeNavItem ? activeNavItem.label : 'Dashboard';

  // Render Phase 3 Block-Based Course Authoring Studio
  if (isBuilding && builderCourse) {
    return (
      <div className="min-h-screen bg-[#F7FCFA] text-[#102A36] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <CourseAuthoringStudio
          courseId={builderCourse.id}
          courseTitle={builderCourse.name || builderCourse.title}
          onBack={() => {
            setIsBuilding(false);
            setBuilderCourse(null);
          }}
        />
      </div>
    );
  }

  // Render Full-page Course Editor when editing or creating
  if (isEditing) {
    return (
      <FullPageCourseEditor
        initialCourse={editingCourse}
        onSave={handleSaveCourse}
        onBack={() => setIsEditing(false)}
        onPreview={(c) => setPreviewCourse(c as Course)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F7FCFA] text-[#102A36] flex">
      {/* Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setIsEditing(false);
          setIsBuilding(false);
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          activeTabTitle={activeTabTitle}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onCreateCourse={handleCreateCourse}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardHome
              courses={courses}
              onCreateCourse={handleCreateCourse}
              onGoToCourses={() => setActiveTab('courses')}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'courses' && (
            <CourseManagement
              courses={courses}
              onCreateCourse={handleCreateCourse}
              onEditCourse={handleEditCourse}
              onOpenBuilderCourse={handleOpenBuilder}
              onDuplicateCourse={handleDuplicateCourse}
              onArchiveToggle={handleArchiveToggle}
              onDeleteCourse={handleDeleteCourse}
              onPreviewCourse={(c) => setPreviewCourse(c)}
              onPublishToggle={handlePublishToggle}
              onBulkPublish={handleBulkPublish}
              onBulkArchive={handleBulkArchive}
              onBulkDelete={handleBulkDelete}
              onBulkChangeCategory={handleBulkChangeCategory}
            />
          )}

          {activeTab === 'students' && <StudentsManagement />}
          {activeTab === 'enrollments' && <EnrollmentsManagement />}
          {activeTab === 'certificates' && <CertificatesManagement />}
          {activeTab === 'reviews' && <ReviewsManagement />}
          {activeTab === 'announcements' && <AnnouncementsManagement />}
          {activeTab === 'analytics' && <AnalyticsOverview />}

          {!['dashboard', 'courses', 'students', 'enrollments', 'certificates', 'reviews', 'announcements', 'analytics'].includes(activeTab) && (
            <ComingSoonSection
              title={activeTabTitle}
              description={`The ${activeTabTitle} authoring features are being prepared.`}
              onGoToCourses={() => setActiveTab('courses')}
            />
          )}
        </main>
      </div>

      {/* Preview Modal */}
      {previewCourse && (
        <CourseDetailsModal
          course={previewCourse as any}
          isOpen={Boolean(previewCourse)}
          onClose={() => setPreviewCourse(null)}
          onEnrollNow={() => setPreviewCourse(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div 
          id="course-delete-modal-overlay" 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#102A36]/60 backdrop-blur-sm animate-fade-in"
        >
          <div 
            id="course-delete-modal-dialog"
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 overflow-hidden relative"
          >
            <button
              onClick={() => !isDeleting && setDeleteModal({ isOpen: false })}
              disabled={isDeleting}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0 text-rose-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-[#102A36]">
                  {deleteModal.isBulk ? 'Delete Selected Courses?' : 'Delete Course?'}
                </h3>
                <p className="text-xs text-[#486D7A]">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="bg-[#F7FCFA] rounded-xl p-3.5 border border-[#486D7A]/10 text-xs text-[#102A36] space-y-2 mb-6">
              {deleteModal.isBulk ? (
                <p>
                  You are about to permanently delete <strong className="font-semibold text-rose-600">{deleteModal.bulkIds?.length || 0} courses</strong> and all associated modules, lessons, and cached drafts.
                </p>
              ) : (
                <p>
                  You are about to permanently delete <strong className="font-semibold text-[#102A36]">"{deleteModal.courseTitle}"</strong> and all of its curriculum modules, media blocks, and records.
                </p>
              )}
              <p className="text-gray-500 text-[11px]">
                The course will be immediately removed from the admin catalogue and student listings.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                id="cancel-delete-course-button"
                onClick={() => setDeleteModal({ isOpen: false })}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-[#486D7A] hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-delete-course-button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Feedback Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium bg-white text-[#102A36] border-gray-100 animate-slide-up">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toastMessage.message}</span>
        </div>
      )}
    </div>
  );
};
