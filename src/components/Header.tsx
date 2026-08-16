import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, BookOpen, GraduationCap, ShieldCheck, User as UserIcon, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  isAdminOpen?: boolean;
  setIsAdminOpen?: (open: boolean) => void;
  onOpenContact: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenContact }) => {
  const { user, profile, signOut } = useAuth();

  const displayName = profile?.full_name || user?.email?.split('@')[0] || user?.email || 'Student';

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#E8D49E]/40 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo & Title */}
        <Link to="/" className="flex items-center gap-3 group">
          <img 
            src="/logo(2).png" 
            alt="Heal With Heer Logo" 
            className="h-11 sm:h-13 w-auto object-contain transition-transform duration-300 group-hover:scale-102"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
          <div className="flex flex-col leading-tight">
            <span className="font-serif italic text-[11px] tracking-widest text-[#287687] font-semibold uppercase flex items-center gap-1">
              HEAL WITH
            </span>
            <span className="font-serif text-sm tracking-[0.2em] bg-gradient-to-r from-[#B8860B] via-[#D4A017] to-[#CBA258] bg-clip-text text-transparent font-bold uppercase -mt-0.5 flex items-center gap-1">
              HEER <Sparkles className="w-3 h-3 text-[#E5C158] inline animate-pulse" />
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-xs lg:text-sm font-semibold text-[#0B3843]">
          <Link to="/" className="hover:text-[#287687] transition-colors">
            Home
          </Link>
          <Link to="/my-courses" className="hover:text-[#287687] transition-colors flex items-center gap-1">
            <GraduationCap className="w-4 h-4 text-[#287687]" />
            <span>My Student LMS</span>
          </Link>
          <Link to="/admin" className="hover:text-[#287687] transition-colors flex items-center gap-1 text-[#287687] font-bold bg-[#EEF7F5] px-2.5 py-1 rounded-full border border-[#C8E6E1]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#CBA258]" />
            <span>Admin Authoring</span>
          </Link>
        </nav>

        {/* Right CTA & Auth */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-[#102A36] bg-[#EEF7F5] px-3 py-1.5 rounded-xl border border-[#C8E6E1]">
                <UserIcon className="w-3.5 h-3.5 text-[#287687]" />
                <span className="max-w-[120px] truncate">{displayName}</span>
              </span>
              <button
                onClick={() => signOut()}
                className="p-2 sm:px-3 sm:py-2 text-xs font-bold text-[#287687] hover:text-red-600 bg-white hover:bg-red-50 rounded-xl border border-[#C8E6E1] transition-all flex items-center gap-1 cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-3.5 py-2 text-xs font-bold text-[#102A36] hover:text-[#287687] bg-[#EEF7F5] hover:bg-[#e2f1ee] rounded-xl border border-[#C8E6E1] transition-all flex items-center gap-1.5"
            >
              <LogIn className="w-4 h-4 text-[#287687]" />
              <span>Sign In</span>
            </Link>
          )}

          {/* Main CTA Button with golden touch */}
          <button
            onClick={onOpenContact}
            className="px-4 sm:px-5 py-2 sm:py-2.5 text-[11px] sm:text-xs font-bold uppercase tracking-widest text-white bg-[#0B3843] hover:bg-[#102A36] rounded-xl transition-all shadow-sm cursor-pointer border-b-2 border-[#D4A017] hover:border-[#F2D06B]"
          >
            BOOK A SESSION
          </button>
        </div>
      </div>
    </header>
  );
};



