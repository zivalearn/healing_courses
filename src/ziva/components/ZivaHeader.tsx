import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useZivaAuth } from '../contexts/ZivaAuthContext';
import { User, LogOut, LayoutDashboard, Sparkles, BookOpen, Crown } from 'lucide-react';

export const ZivaHeader: React.FC = () => {
  const { user, isAdmin, logout } = useZivaAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/ziva');
  };

  return (
    <header className="sticky top-0 z-50 bg-black border-y-2 border-[#FF2E93] shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* BRAND LOGO */}
          <Link to="/ziva" className="flex flex-col items-center group cursor-pointer">
            <div className="flex items-center gap-1">
              <span className="text-amber-400 text-xs tracking-widest font-serif font-light">∞</span >
            </div>
            <span className="text-2xl sm:text-3xl font-serif tracking-wider text-amber-200 group-hover:text-amber-400 transition-colors">
              Ziva
            </span>
            <span className="text-[9px] uppercase tracking-[0.25em] text-gray-400 font-sans">
              Discover The Infinite Possibilities
            </span>
          </Link>

          {/* DESKTOP NAV LINKS */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8 text-xs font-semibold uppercase tracking-widest text-white">
            <Link to="/ziva/courses" className="hover:text-[#FF2E93] transition-colors py-1 text-amber-300">
              Programs
            </Link>
            
            {!user ? (
              <Link
                to="/ziva/signup"
                className="bg-[#FF2E93] hover:bg-pink-600 text-white px-4 py-2 rounded-sm font-bold tracking-widest transition-all transform hover:scale-105 shadow-md shadow-pink-900/40"
              >
                Join Ziva
              </Link>
            ) : (
              <Link
                to="/ziva/dashboard"
                className="hover:text-[#FF2E93] transition-colors py-1 text-pink-400 flex items-center gap-1"
              >
                <BookOpen className="w-3.5 h-3.5" />
                My LMS
              </Link>
            )}
          </nav>

          {/* USER / AUTH ACTIONS */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                {isAdmin && (
                  <Link
                    to="/ziva/admin"
                    className="hidden sm:flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300 bg-amber-950/40 border border-amber-500/40 px-3 py-1.5 rounded-sm"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    Admin Authoring
                  </Link>
                )}
                <div className="flex items-center space-x-2 text-white">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-[#FF2E93] flex items-center justify-center font-bold text-xs text-black border border-amber-300">
                    {user.fullName.charAt(0)}
                  </div>
                  <span className="hidden md:inline text-xs font-medium tracking-wide text-gray-200">
                    {user.fullName}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Log out"
                  className="p-1.5 text-gray-400 hover:text-pink-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/ziva/login"
                className="text-xs uppercase font-bold tracking-widest text-amber-300 hover:text-white border border-amber-500/50 hover:border-amber-400 px-3.5 py-1.5 rounded-sm transition-colors"
              >
                Login
              </Link>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};