import React from 'react';
import { Menu, Plus, Home, LogOut, ArrowLeft, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface AdminHeaderProps {
  activeTabTitle: string;
  onOpenMobileSidebar: () => void;
  onCreateCourse: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeTabTitle,
  onOpenMobileSidebar,
  onCreateCourse
}) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch {
      // Ignore errors during sign out
    }
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 sm:gap-4">
      {/* Left: Mobile Toggle, Back to Home & Page Title */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-1.5 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Prominent Back to Home Page Button */}
        <Link
          to="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 font-semibold text-xs transition-colors shadow-2xs shrink-0 cursor-pointer"
          title="Return to Main Home Page"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-teal-700 shrink-0" />
          <span>Home Page</span>
        </Link>

        <div className="hidden sm:block h-5 w-px bg-slate-200" />

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
            <span>Admin</span>
            <span>/</span>
            <span className="text-slate-900 font-semibold truncate">{activeTabTitle}</span>
          </div>
          <h2 className="font-semibold text-sm sm:text-base text-slate-900 truncate tracking-tight">
            {activeTabTitle}
          </h2>
        </div>
      </div>

      {/* Right: Quick Actions, Logout & Admin Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        <button
          onClick={onCreateCourse}
          className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-slate-300" />
          <span className="hidden sm:inline">New Course</span>
        </button>

        {/* Logout / Exit Admin Button */}
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 rounded-md border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          title="Exit Admin Dashboard & Logout"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span className="hidden sm:inline">Logout</span>
        </button>

        <div className="h-4 w-px bg-slate-200 hidden md:block" />

        {/* Admin Badge Profile */}
        <div className="hidden md:flex items-center gap-2 pl-1">
          <div className="w-7 h-7 rounded-full bg-slate-900 text-slate-100 font-semibold text-xs flex items-center justify-center border border-slate-700 shadow-2xs">
            A
          </div>
          <div className="text-left">
            <span className="text-xs font-semibold text-slate-900 block leading-tight">
              Administrator
            </span>
            <span className="text-[10px] text-slate-500 block leading-tight">
              Instructor Portal
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
