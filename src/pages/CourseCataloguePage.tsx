import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { courseService } from '../services/courseService';
import { wishlistService } from '../services/wishlistService';
import { authService } from '../services/authService';
import { Course } from '../models/course';
import { CourseCard } from '../components/CourseCard';
import { CourseCardSkeleton } from '../components/CourseCardSkeleton';
import { FeaturedCourse } from '../components/FeaturedCourse';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ContactModal } from '../components/ContactModal';
import { EnrollmentModal } from '../components/EnrollmentModal';
import { SEO } from '../components/SEO';
import {
  Search,
  Sparkles,
  Filter,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Heart,
  SlidersHorizontal,
  RefreshCw,
  AlertTriangle,
  Award,
} from 'lucide-react';

const ITEMS_PER_PAGE = 6;

export const CourseCataloguePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const modalityQuery = searchParams.get('modality') || '';
  const searchUrlQuery = searchParams.get('q') || '';

  // State Management
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>(searchUrlQuery);
  const [selectedModality, setSelectedModality] = useState<string>(modalityQuery || 'All');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
  const [showWishlistOnly, setShowWishlistOnly] = useState<boolean>(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Wishlist State (Set of course IDs)
  const [wishlistSet, setWishlistSet] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);

  // Modals
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [enrollCourse, setEnrollCourse] = useState<Course | null>(null);

  const modalities = ['All', 'Reiki Healing', 'NLP', 'Timeline Therapy', 'Energy Healing', 'Certification'];
  const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  // Load User & Wishlist
  const loadWishlist = useCallback(async (uid: string | null) => {
    if (uid) {
      const res = await wishlistService.getWishlist(uid);
      if (res.data) {
        setWishlistSet(new Set(res.data.map((item) => item.course_id)));
      }
    } else {
      // LocalStorage fallback for guest users
      try {
        const local = localStorage.getItem('guest_wishlist');
        if (local) {
          setWishlistSet(new Set(JSON.parse(local)));
        }
      } catch (err) {
        console.warn('Failed to parse guest wishlist:', err);
      }
    }
  }, []);

  // Fetch Courses & Setup
  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await authService.getCurrentUser();
      const currentUid = user ? user.id : null;
      setUserId(currentUid);
      await loadWishlist(currentUid);

      const allCourses = await courseService.getPublishedCourses();
      setCourses(allCourses);
    } catch (err: any) {
      console.error('Error fetching course catalog:', err);
      setError('Unable to load course catalog. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [loadWishlist]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Wishlist Toggle Handler
  const handleToggleWishlist = async (course: Course) => {
    const isCurrentlyWishlisted = wishlistSet.has(course.id);
    
    // Optimistic Update
    const newSet = new Set(wishlistSet);
    if (isCurrentlyWishlisted) {
      newSet.delete(course.id);
    } else {
      newSet.add(course.id);
    }
    setWishlistSet(newSet);

    if (userId) {
      // Persist to Supabase Wishlist Table
      await wishlistService.toggleWishlist(userId, course.id);
    } else {
      // Persist guest state
      try {
        localStorage.setItem('guest_wishlist', JSON.stringify(Array.from(newSet)));
      } catch (e) {
        console.warn('Could not save guest wishlist:', e);
      }
    }
  };

  // Filtered & Sorted Courses List Computation
  const filteredCourses = useMemo(() => {
    let result = [...courses];

    // Category / Modality Filter
    if (selectedModality !== 'All') {
      const mod = selectedModality.toLowerCase();
      result = result.filter(
        (c) =>
          c.modality?.toLowerCase().includes(mod) ||
          c.category?.toLowerCase().includes(mod)
      );
    }

    // Level Filter
    if (selectedLevel !== 'All') {
      const lvl = selectedLevel.toLowerCase();
      result = result.filter(
        (c) =>
          c.level?.toLowerCase() === lvl ||
          c.difficulty?.toLowerCase() === lvl
      );
    }

    // Wishlist Filter Toggle
    if (showWishlistOnly) {
      result = result.filter((c) => wishlistSet.has(c.id));
    }

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.title?.toLowerCase().includes(q) ||
          c.name?.toLowerCase().includes(q) ||
          c.shortDescription?.toLowerCase().includes(q) ||
          c.modality?.toLowerCase().includes(q) ||
          c.category?.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      // Default: Featured
      result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }

    return result;
  }, [courses, selectedModality, selectedLevel, searchQuery, sortBy, showWishlistOnly, wishlistSet]);

  // Pagination Calculation
  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE) || 1;
  const paginatedCourses = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCourses.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCourses, currentPage]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedModality, selectedLevel, searchQuery, sortBy, showWishlistOnly]);

  // Pick top featured course for Featured Hero Section
  const primaryFeaturedCourse = useMemo(() => {
    return courses.find((c) => c.isFeatured) || courses[0] || null;
  }, [courses]);

  return (
    <div className="min-h-screen bg-[#EEF7F5] text-[#102A36] flex flex-col font-sans">
      
      {/* Dynamic SEO Meta & Schema */}
      <SEO
        title="Explore Course Catalogue | Heal With Heer LMS Academy"
        description="Browse accredited certification programs in Usui Reiki, Master NLP, Timeline Therapy®, and Subconscious Energy Healing. Enroll today."
      />

      <Header onOpenContact={() => setIsContactOpen(true)} />

      {/* Hero Header Banner */}
      <section className="bg-gradient-to-b from-[#102A36] to-[#0B232D] text-white py-14 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto text-center space-y-4 relative z-10">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#E5C158] flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#E5C158]" /> HEAL WITH HEER LMS ACADEMY
          </span>

          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white">
            Explore Course Catalogue
          </h1>

          <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto leading-relaxed font-normal">
            Discover accredited certification courses in Usui Reiki, Master NLP, Timeline Therapy®, and Chakra Alchemy guided by Master Heer.
          </p>

          {/* Search Input Bar */}
          <div className="max-w-xl mx-auto pt-4">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search courses by title, modality, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white text-[#102A36] text-sm focus:outline-none focus:ring-2 focus:ring-[#CBA258] shadow-md placeholder-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Course Highlight Panel */}
      {primaryFeaturedCourse && !loading && !error && (
        <FeaturedCourse
          course={primaryFeaturedCourse}
          onKnowMore={(c) => navigate(`/course/${c.slug || c.id}`)}
          onEnroll={(c) => setEnrollCourse(c)}
        />
      )}

      {/* Main Catalogue Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        
        {/* Controls Bar: Category Pills, Filters, Sort & Wishlist */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#C8E6E1] shadow-2xs space-y-4">
          
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            
            {/* Category / Modality Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
              {modalities.map((mod) => {
                const active = selectedModality === mod;
                return (
                  <button
                    key={mod}
                    onClick={() => {
                      setSelectedModality(mod);
                      setSearchParams(mod === 'All' ? {} : { modality: mod });
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-[#102A36] text-white shadow-xs'
                        : 'bg-[#EEF7F5] text-[#486D7A] hover:bg-[#C8E6E1]'
                    }`}
                  >
                    {mod}
                  </button>
                );
              })}
            </div>

            {/* Dropdowns & Wishlist Filter */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              
              {/* Level Filter */}
              <div className="flex items-center gap-2 bg-[#EEF7F5] px-3 py-1.5 rounded-xl border border-[#C8E6E1]">
                <Filter className="w-3.5 h-3.5 text-[#287687]" />
                <span className="text-[10px] font-bold text-[#102A36] uppercase tracking-wider">Level:</span>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-[#102A36] focus:outline-none cursor-pointer"
                >
                  {levels.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2 bg-[#EEF7F5] px-3 py-1.5 rounded-xl border border-[#C8E6E1]">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#287687]" />
                <span className="text-[10px] font-bold text-[#102A36] uppercase tracking-wider">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-xs font-semibold text-[#102A36] focus:outline-none cursor-pointer"
                >
                  <option value="featured">Featured First</option>
                  <option value="rating">Top Rated</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>

              {/* Saved Wishlist Toggle Button */}
              <button
                onClick={() => setShowWishlistOnly(!showWishlistOnly)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                  showWishlistOnly
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-[#EEF7F5] text-[#486D7A] hover:bg-[#C8E6E1]'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${showWishlistOnly ? 'fill-white' : 'text-rose-500'}`} />
                <span>Wishlist ({wishlistSet.size})</span>
              </button>

            </div>

          </div>

        </div>

        {/* Results Metadata Header */}
        <div className="flex items-center justify-between text-xs text-[#486D7A] font-medium px-1">
          <span>
            Showing <strong>{filteredCourses.length}</strong> {filteredCourses.length === 1 ? 'course' : 'courses'}
            {showWishlistOnly ? ' in your Wishlist' : ''}
          </span>

          {(selectedModality !== 'All' || selectedLevel !== 'All' || searchQuery || showWishlistOnly) && (
            <button
              onClick={() => {
                setSelectedModality('All');
                setSelectedLevel('All');
                setSearchQuery('');
                setShowWishlistOnly(false);
                setSearchParams({});
              }}
              className="text-[#287687] font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Reset Filters
            </button>
          )}
        </div>

        {/* Main Courses Grid / Loading / Error State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <CourseCardSkeleton count={6} />
          </div>
        ) : error ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-rose-200 p-8 max-w-md mx-auto space-y-4">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
            <h3 className="font-serif text-xl font-bold text-[#102A36]">Error Loading Catalog</h3>
            <p className="text-xs text-[#486D7A]">{error}</p>
            <button
              onClick={fetchCourses}
              className="px-5 py-2.5 rounded-xl bg-[#102A36] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#287687] transition-all cursor-pointer"
            >
              Retry Loading
            </button>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-[#C8E6E1] space-y-4 p-8 max-w-md mx-auto shadow-2xs">
            <BookOpen className="w-12 h-12 text-[#287687] mx-auto opacity-60" />
            <h3 className="font-serif text-xl font-bold text-[#102A36]">No Courses Found</h3>
            <p className="text-xs text-[#486D7A] leading-relaxed">
              {showWishlistOnly
                ? "You haven't added any courses to your wishlist yet. Click the heart icon on any course to save it here!"
                : "No courses match your current filter or search criteria. Try clearing your filters."}
            </p>
            <button
              onClick={() => {
                setSelectedModality('All');
                setSelectedLevel('All');
                setSearchQuery('');
                setShowWishlistOnly(false);
                setSearchParams({});
              }}
              className="px-5 py-2.5 rounded-xl bg-[#102A36] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#287687] transition-all cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedCourses.map((course, idx) => (
              <CourseCard
                key={course.id}
                course={course}
                index={idx}
                isWishlisted={wishlistSet.has(course.id)}
                onToggleWishlist={handleToggleWishlist}
                onEnroll={(c) => setEnrollCourse(c)}
              />
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && filteredCourses.length > ITEMS_PER_PAGE && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#C8E6E1]">
            <span className="text-xs text-[#486D7A] font-medium">
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-2.5 rounded-xl border border-[#C8E6E1] bg-white text-[#102A36] hover:bg-[#EEF7F5] disabled:opacity-40 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                const isActive = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#102A36] text-white shadow-xs'
                        : 'bg-white border border-[#C8E6E1] text-[#102A36] hover:bg-[#EEF7F5]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-2.5 rounded-xl border border-[#C8E6E1] bg-white text-[#102A36] hover:bg-[#EEF7F5] disabled:opacity-40 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </section>

      {/* Enrollment Form Modal */}
      {enrollCourse && (
        <EnrollmentModal
          course={enrollCourse}
          onClose={() => setEnrollCourse(null)}
        />
      )}

      {/* Contact Modal */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />

      <Footer onOpenContact={() => setIsContactOpen(true)} />

    </div>
  );
};

export default CourseCataloguePage;
