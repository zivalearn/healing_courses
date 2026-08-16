import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Course, FilterState } from './types';
import { courseService } from './services/courseService';
import { 
  getStoredCourses, 
  addCourse, 
  updateCourse, 
  setFeaturedCourse, 
  deleteCourse, 
  resetCoursesToDefault 
} from './utils/storage';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { SearchAndFilters } from './components/SearchAndFilters';
import { CourseCard } from './components/CourseCard';
import { CourseDetailsModal } from './components/CourseDetailsModal';
import { EnrollmentModal } from './components/EnrollmentModal';
import { AdminPanel } from './components/AdminPanel';
import { CTASection } from './components/CTASection';
import { ContactModal } from './components/ContactModal';
import { Footer } from './components/Footer';
import { CourseCataloguePage } from './pages/CourseCataloguePage';
import { CourseDetailsPage } from './pages/CourseDetailsPage';
import { StudentLMSPage } from './pages/StudentLMSPage';
import { AdminPage } from './pages/AdminPage';
import { Sparkles, SearchX } from 'lucide-react';

import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { CourseStudioPage } from './pages/dashboard/course-studio/CourseStudioPage';
import { StudentPlayerPage } from './pages/StudentPlayerPage';
import { DevR2DiagnosticPage } from './pages/DevR2DiagnosticPage';
import { ZivaRoutes } from './ziva/routes/ZivaRoutes';

// Ziva Auth Provider & Catalogue Page for robust domain/preview routing
import { ZivaAuthProvider } from './ziva/contexts/ZivaAuthContext';
import { ZivaCataloguePage } from './ziva/pages/ZivaCataloguePage';

function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    category: 'All Courses',
    level: 'All Levels',
    mode: 'All Modes',
    chipFilter: 'All Courses',
    sortBy: 'featured'
  });

  const [selectedDetailsCourse, setSelectedDetailsCourse] = useState<Course | null>(null);
  const [selectedEnrollCourse, setSelectedEnrollCourse] = useState<Course | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminInitialTab, setAdminInitialTab] = useState<'list' | 'create' | 'edit' | 'image-studio'>('list');
  const [isContactOpen, setIsContactOpen] = useState(false);

  const handleOpenAdmin = (tab: 'list' | 'create' | 'edit' | 'image-studio' = 'list') => {
    setAdminInitialTab(tab);
    setIsAdminOpen(true);
  };

  // Load persistent courses on mount and when closing admin
  const refreshCourses = useCallback(async () => {
    try {
      const loaded = await courseService.getAllCourses();
      setCourses(Array.isArray(loaded) ? loaded : []);
    } catch {
      const fallback = getStoredCourses();
      setCourses(Array.isArray(fallback) ? fallback : []);
    }
  }, []);

  useEffect(() => {
    refreshCourses();
  }, [refreshCourses]);

  // CRUD Handler Wrappers
  const handleAddCourse = (data: Partial<Course>) => {
    const updated = addCourse(data);
    setCourses(Array.isArray(updated) ? updated : []);
  };

  const handleUpdateCourse = (id: string, updates: Partial<Course>) => {
    const updated = updateCourse(id, updates);
    setCourses(Array.isArray(updated) ? updated : []);
  };

  const handleSetFeatured = (id: string) => {
    const updated = setFeaturedCourse(id);
    setCourses(Array.isArray(updated) ? updated : []);
  };

  const handleDeleteCourse = (id: string) => {
    const updated = deleteCourse(id);
    setCourses(Array.isArray(updated) ? updated : []);
  };

  const handleResetDefault = () => {
    const reset = resetCoursesToDefault();
    setCourses(Array.isArray(reset) ? reset : []);
  };

  // Filter & Sort Catalogue Courses
  const filteredCourses = useMemo(() => {
    const safeCourses = Array.isArray(courses) ? courses : [];
    return safeCourses.filter(course => {
      if (!course.isPublished) return false;

      if (filters.searchQuery.trim() !== '') {
        const query = filters.searchQuery.toLowerCase();
        const matchName = course.name.toLowerCase().includes(query);
        const matchDesc = course.shortDescription.toLowerCase().includes(query) || course.fullDescription.toLowerCase().includes(query);
        const matchCat = course.category.toLowerCase().includes(query);
        const matchOutcomes = course.keyOutcomes.some(k => k.toLowerCase().includes(query));
        
        if (!matchName && !matchDesc && !matchCat && !matchOutcomes) {
          return false;
        }
      }

      if (filters.chipFilter !== 'All Courses') {
        const chip = filters.chipFilter;
        if (['Certification', 'Healing', 'Personal Growth', 'Energy Healing'].includes(chip)) {
          if (course.category !== chip) return false;
        } else if (['Beginner', 'Advanced', 'Intermediate', 'Mastery'].includes(chip)) {
          if (course.level !== chip) return false;
        } else if (['Online', 'Offline', 'Hybrid'].includes(chip)) {
          if (course.mode !== chip) return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'featured') {
        if (a.isFeatured) return -1;
        if (b.isFeatured) return 1;
        return 0;
      }
      if (filters.sortBy === 'popular') {
        return b.reviewsCount - a.reviewsCount;
      }
      if (filters.sortBy === 'price-low') {
        return a.price - b.price;
      }
      if (filters.sortBy === 'price-high') {
        return b.price - a.price;
      }
      if (filters.sortBy === 'rating') {
        return b.rating - a.rating;
      }
      return 0;
    });
  }, [courses, filters]);

  const scrollToCatalogue = () => {
    const el = document.getElementById('courses');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#EEF7F5] text-[#102A36] flex flex-col font-sans selection:bg-[#C8E6E1] selection:text-[#102A36]">
      <Header
        isAdminOpen={isAdminOpen}
        setIsAdminOpen={setIsAdminOpen}
        onOpenContact={() => setIsContactOpen(true)}
      />

      <main className="flex-1">
        <Hero
          onExploreClick={scrollToCatalogue}
          onContactClick={() => setIsContactOpen(true)}
        />

        <section id="courses" className="pt-6 pb-12 md:pt-10 md:pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#102A36] mb-5 sm:mb-6 leading-tight">
              Heal With <span className="bg-gradient-to-r from-[#B8860B] via-[#D4A017] to-[#CBA258] bg-clip-text text-transparent inline-flex items-center gap-1">Heer <Sparkles className="w-5 h-5 text-[#E5C158] inline animate-pulse" /></span> Course Catalogue
            </h2>
            <p className="text-sm sm:text-base text-black leading-relaxed font-medium">
              Explore certified practitioner training, subconscious reprogramming, energy alchemy, and transformational life-coaching courses.
            </p>
          </div>

          <SearchAndFilters
            filters={filters}
            setFilters={setFilters}
            totalCoursesCount={filteredCourses.length}
          />

          {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
              {filteredCourses.map((course, idx) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onKnowMore={(c) => setSelectedDetailsCourse(c)}
                  onEnroll={(c) => setSelectedEnrollCourse(c)}
                  index={idx}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4 bg-white rounded-3xl border border-[#C8E6E1] max-w-md mx-auto space-y-4">
              <SearchX className="w-10 h-10 text-[#287687] mx-auto" />
              <h3 className="font-serif text-xl font-bold text-[#102A36]">
                No Healing Courses Found
              </h3>
              <p className="text-xs text-[#486D7A]">
                No courses match your active search or filter selection. Try clearing filters or searching for something else.
              </p>
              <button
                onClick={() => setFilters({
                  searchQuery: '',
                  category: 'All Courses',
                  level: 'All Levels',
                  mode: 'All Modes',
                  chipFilter: 'All Courses',
                  sortBy: 'featured'
                })}
                className="px-5 py-2.5 rounded-full bg-[#287687] text-white text-xs font-semibold cursor-pointer"
              >
                Clear Search & Filters
              </button>
            </div>
          )}
        </section>

        <CTASection
          onExploreClick={scrollToCatalogue}
          onContactClick={() => setIsContactOpen(true)}
        />
      </main>

      <Footer
        onOpenContact={() => setIsContactOpen(true)}
        onOpenAdmin={handleOpenAdmin}
      />

      <CourseDetailsModal
        course={selectedDetailsCourse}
        onClose={() => setSelectedDetailsCourse(null)}
        onEnroll={(c) => setSelectedEnrollCourse(c)}
      />

      <EnrollmentModal
        course={selectedEnrollCourse}
        onClose={() => setSelectedEnrollCourse(null)}
      />

      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        courses={courses}
        initialTab={adminInitialTab}
        onAddCourse={handleAddCourse}
        onUpdateCourse={handleUpdateCourse}
        onSetFeatured={handleSetFeatured}
        onDeleteCourse={handleDeleteCourse}
        onResetDefault={handleResetDefault}
      />

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </div>
  );
}

// Heal With Heer App Routing
function HWHApp() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/courses" element={<Navigate to="/" replace />} />
          <Route path="/course/:slug" element={<CourseDetailsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/dev-r2-diagnostic" element={<DevR2DiagnosticPage />} />
          <Route 
            path="/my-courses" 
            element={
              <ProtectedRoute>
                <StudentLMSPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/learn/:courseId" 
            element={
              <ProtectedRoute>
                <StudentPlayerPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/learn/:courseId/lesson/:lessonId" 
            element={
              <ProtectedRoute>
                <StudentPlayerPage />
              </ProtectedRoute>
            } 
          />
          <Route path="/dashboard/course-studio" element={<CourseStudioPage />} />
          <Route path="/course-studio" element={<CourseStudioPage />} />
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminPage />
              </ProtectedRoute>
            } 
          />
          <Route path="/ziva/*" element={<ZivaRoutes />} />
        </Routes>

        {import.meta.env.DEV && (
          <a
            href="/dev-r2-diagnostic"
            className="fixed bottom-4 right-4 z-50 px-3 py-2 rounded-full bg-purple-900/90 hover:bg-purple-800 text-purple-200 border border-purple-500/50 shadow-2xl text-xs font-bold flex items-center gap-1.5 transition-all hover:scale-105"
            title="Open R2 / HLS Development Diagnostic Tool"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>🛠️ Dev R2/HLS Test</span>
          </a>
        )}
      </BrowserRouter>
    </AuthProvider>
  );
}

// Domain detection helper
function isZivaHost(): boolean {
  if (typeof window === 'undefined' || !window.location) return false;
  const host = window.location.hostname.toLowerCase();
  return (
    host.includes('ziva') ||
    host.includes('zivalearn') ||
    window.location.pathname.startsWith('/ziva') ||
    window.location.hash.includes('ziva') ||
    window.location.search.includes('brand=ziva')
  );
}

// Master App Component with robust subdomain and preview route support
export default function App() {
  const isZiva = isZivaHost();

  if (isZiva) {
    return (
      <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
        <ZivaAuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<ZivaCataloguePage />} />
              <Route path="/ziva" element={<ZivaCataloguePage />} />
              <Route path="/courses" element={<ZivaCataloguePage />} />
              <Route path="/ziva/courses" element={<ZivaCataloguePage />} />
              <Route path="/ziva/*" element={<ZivaRoutes />} />
              <Route path="/*" element={<ZivaRoutes />} />
            </Routes>
          </BrowserRouter>
        </ZivaAuthProvider>
      </div>
    );
  }

  return <HWHApp />;
}