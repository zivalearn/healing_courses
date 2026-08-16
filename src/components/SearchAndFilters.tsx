import React from 'react';
import { FilterState } from '../types';
import { Search, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

interface SearchAndFiltersProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  totalCoursesCount: number;
}

const FILTER_CHIPS = [
  'All Courses',
  'Certification',
  'Healing',
  'Personal Growth',
  'Energy Healing',
  'Beginner',
  'Advanced',
  'Online',
  'Offline'
];

export const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  filters,
  setFilters,
  totalCoursesCount
}) => {

  const handleChipClick = (chip: string) => {
    setFilters(prev => ({
      ...prev,
      chipFilter: chip
    }));
  };

  const clearSearch = () => {
    setFilters(prev => ({ ...prev, searchQuery: '' }));
  };

  const resetAllFilters = () => {
    setFilters({
      searchQuery: '',
      category: 'All Courses',
      level: 'All Levels',
      mode: 'All Modes',
      chipFilter: 'All Courses',
      sortBy: 'featured'
    });
  };

  const isFiltered = filters.searchQuery !== '' || filters.chipFilter !== 'All Courses' || filters.sortBy !== 'featured';

  return (
    <div className="space-y-6 bg-white p-6 sm:p-8 rounded-[2rem] border border-[#C8E6E1] shadow-xs">
      
      {/* Top Search Bar & Sort Dropdown */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-[#287687]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
            placeholder="Search courses by keyword or category..."
            className="w-full pl-12 pr-10 py-3 bg-white border border-[#C8E6E1] rounded-full text-sm text-[#102A36] placeholder-[#486D7A]/70 focus:outline-none focus:border-[#287687] shadow-xs transition-all"
          />
          {filters.searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#486D7A] hover:text-[#102A36]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort & Count Controls */}
        <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
          
          <div className="flex items-center gap-2 bg-[#E2F1EE] px-4 py-2.5 rounded-full border border-[#C8E6E1] text-xs font-semibold text-[#486D7A]">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#287687]" />
            <span className="uppercase tracking-wider font-bold">Sort:</span>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as FilterState['sortBy'] }))}
              className="bg-transparent text-[#102A36] font-bold focus:outline-none cursor-pointer"
            >
              <option value="featured">Featured First</option>
              <option value="popular">Most Popular</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>

          {isFiltered && (
            <button
              onClick={resetAllFilters}
              className="text-xs font-bold uppercase tracking-wider text-[#287687] hover:underline px-2 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

      </div>

      {/* Filter Chips Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-[#486D7A] flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#287687]" />
            Categories & Levels
          </span>
          <span className="text-xs font-semibold text-[#486D7A]">
            Showing <strong className="text-[#102A36] font-bold">{totalCoursesCount}</strong> courses
          </span>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none pt-1">
          {FILTER_CHIPS.map(chip => {
            const isActive = filters.chipFilter === chip;
            return (
              <button
                key={chip}
                onClick={() => handleChipClick(chip)}
                className={`px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#287687] text-white shadow-xs'
                    : 'bg-white border border-[#C8E6E1] text-[#486D7A] hover:border-[#287687] hover:text-[#102A36]'
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};
