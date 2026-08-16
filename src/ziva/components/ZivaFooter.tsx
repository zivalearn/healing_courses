import React from 'react';
import { Link } from 'react-router-dom';

export const ZivaFooter: React.FC = () => {
  return (
    <footer className="bg-black border-t border-[#FF2E93] text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* LOGO */}
        <div className="flex flex-col items-center md:items-start">
          <div className="flex items-center gap-1">
            <span className="text-amber-400 text-xs font-serif">∞</span>
          </div>
          <span className="text-2xl font-serif text-amber-200 tracking-wider">Ziva</span>
          <span className="text-[9px] uppercase tracking-[0.25em] text-gray-500 font-sans">
            Discover The Infinite Possibilities
          </span>
        </div>

        {/* LINKS */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-300 font-medium">
          <Link to="/ziva" className="hover:text-amber-300 transition-colors">Home</Link>
          <Link to="/ziva/catalogue" className="hover:text-amber-300 transition-colors">Course Catalogue</Link>
          <a href="/ziva#about" className="hover:text-amber-300 transition-colors">About Meharr</a>
          <a href="/ziva#coaching" className="hover:text-amber-300 transition-colors">1-on-1 Coaching</a>
          <Link to="/ziva/login" className="hover:text-amber-300 transition-colors">Student Login</Link>
        </div>

        {/* COPYRIGHT & LEGAL */}
        <div className="text-xs text-center md:text-right text-gray-500 space-y-1">
          <p>© {new Date().getFullYear()} Ziva. All rights reserved.</p>
          <div className="flex items-center justify-center md:justify-end space-x-3 text-[11px] text-gray-600">
            <span className="hover:text-gray-400 cursor-pointer">Privacy</span>
            <span>|</span>
            <span className="hover:text-gray-400 cursor-pointer">Terms of Use</span>
            <span>|</span>
            <span className="hover:text-gray-400 cursor-pointer">Accessibility</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
