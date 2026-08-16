import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ZivaLayout } from '../layouts/ZivaLayout';
import { ZivaCourse } from '../types';
import { zivaCourseService } from '../services/zivaCourseService';
import { storageService } from '../../services/storageService';
import { Search, Filter, Sparkles, BookOpen, Clock, ArrowRight, ShieldCheck } from 'lucide-react';

export const ZivaCataloguePage: React.FC = () => {
  const [courses, setCourses] = useState<ZivaCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high'>('featured');

  useEffect(() => {
    async function load() {
      const data = await zivaCourseService.getAllCourses();
      setCourses(data);
      setLoading(false);
    }
    load();
  }, []);

  const categories = ['All', 'Confidence', 'Personality Development', 'Public Speaking', 'Coaching & Mindset'];
  const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  const filteredCourses = useMemo(() => {
    const safeCourses = Array.isArray(courses) ? courses : [];
    let list = safeCourses.filter((c) => {
      if (!c.isPublished) return false;
      if (selectedCategory !== 'All' && c.category !== selectedCategory) return false;
      if (selectedLevel !== 'All' && c.level !== selectedLevel) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        return (
          c.title.toLowerCase().includes(q) ||
          c.shortDescription.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
        );
      }
      return true;
    });

    if (sortBy === 'price-low') {
      list.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
    } else if (sortBy === 'price-high') {
      list.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
    }

    return list;
  }, [courses, selectedCategory, selectedLevel, searchQuery, sortBy]);

  return (
    <ZivaLayout>
      <div className="bg-black py-12 px-4 sm:px-6 lg:px-8 border-b border-gray-900">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <span className="text-pink-500 font-serif text-sm tracking-widest uppercase font-bold">
            Ziva Masterclasses
          </span>
          <h1 className="text-4xl sm:text-6xl font-serif text-amber-300 font-extrabold uppercase tracking-tight">
            Program Catalogue
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-sm sm:text-base">
            Discover transformative courses crafted by Meharr. Elevate your confidence, master executive presence, and command any room.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* FILTERS AND SEARCH BAR */}
        <div className="space-y-4 border-b border-gray-900 pb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* CATEGORIES CHIPS */}
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#FF2E93] text-white shadow-lg shadow-pink-900/40'
                      : 'bg-neutral-900 text-gray-400 hover:text-white border border-gray-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* SEARCH INPUT */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
              <input
                type="text"
                placeholder="Search programs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-900 border border-gray-800 text-white text-xs pl-9 pr-4 py-2.5 rounded-lg focus:ring-2 focus:ring-[#FF2E93] outline-none"
              />
            </div>
          </div>

          {/* SECONDARY FILTER BAR: LEVELS & SORT */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-gray-900/60">
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-gray-500 uppercase tracking-wider text-[10px] font-bold mr-1">Level:</span>
              {levels.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                    selectedLevel === lvl
                      ? 'bg-amber-950 text-amber-300 border border-amber-500/50'
                      : 'bg-black text-gray-400 border border-gray-800 hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-4 text-xs">
              <span className="text-pink-400 font-bold bg-pink-950/50 border border-pink-500/30 px-3 py-1 rounded-full text-[10px] uppercase">
                {filteredCourses.length} {filteredCourses.length === 1 ? 'Masterclass' : 'Masterclasses'} Available
              </span>

              <div className="flex items-center space-x-1.5">
                <span className="text-gray-500 uppercase tracking-wider text-[10px] font-bold">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-black border border-gray-800 text-white text-xs px-2.5 py-1.5 rounded-lg outline-none focus:ring-1 focus:ring-[#FF2E93]"
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* CATALOGUE GRID */}
        {loading ? (
          <div className="py-20 text-center text-amber-400">
            <div className="w-8 h-8 border-2 border-[#FF2E93] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading catalogue...
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="py-20 text-center text-gray-500 space-y-3">
            <p className="text-lg font-serif text-amber-200">No programs match your search criteria.</p>
            <button
              onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
              className="text-xs text-pink-400 underline uppercase tracking-widest font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="bg-neutral-950 border border-amber-500/30 rounded-2xl overflow-hidden hover:border-pink-500 transition-all flex flex-col justify-between shadow-xl group"
              >
                <div>
                  <div className="h-52 overflow-hidden relative">
                    <img
                      src={storageService.getCourseImageUrl(course.thumbnailUrl || (course as any).image)}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop';
                      }}
                    />
                    <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md border border-amber-400/40 text-amber-300 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
                      {course.category}
                    </div>
                  </div>

                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{course.duration}</span>
                      <span>•</span>
                      <span>{course.level}</span>
                    </div>

                    <h3 className="text-xl font-serif font-bold text-white group-hover:text-amber-300 transition-colors">
                      {course.title}
                    </h3>

                    <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">
                      {course.shortDescription}
                    </p>

                    <div className="pt-2 flex items-center gap-2 text-xs text-amber-300">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>By {course.instructorName}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0 border-t border-gray-900/80 mt-4 flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-amber-300">${course.salePrice || course.price}</span>
                    {course.salePrice && (
                      <span className="text-xs text-gray-500 line-through">${course.price}</span>
                    )}
                  </div>

                  <Link
                    to={`/ziva/course/${course.slug}`}
                    className="inline-flex items-center gap-1 bg-[#FF2E93] hover:bg-pink-600 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded shadow-md transition-colors"
                  >
                    View Details
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </ZivaLayout>
  );
};
