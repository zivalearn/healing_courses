import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  FolderKanban, 
  Users, 
  CreditCard, 
  Award, 
  Star,
  Megaphone,
  BarChart2, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink,
  Home,
  LogOut,
  ArrowLeft,
  X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export type AdminTab = 
  | 'dashboard' 
  | 'courses' 
  | 'students' 
  | 'enrollments' 
  | 'certificates' 
  | 'reviews'
  | 'announcements'
  | 'analytics' 
  | 'media'
  | 'settings';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export const NAV_ITEMS: { id: AdminTab; label: string; icon: React.FC<{ className?: string }>; isFunctional: boolean }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, isFunctional: true },
  { id: 'courses', label: 'Courses', icon: BookOpen, isFunctional: true },
  { id: 'students', label: 'Students', icon: Users, isFunctional: true },
  { id: 'enrollments', label: 'Enrollments & Revenue', icon: CreditCard, isFunctional: true },
  { id: 'certificates', label: 'Certificates', icon: Award, isFunctional: true },
  { id: 'reviews', label: 'Reviews', icon: Star, isFunctional: true },
  { id: 'announcements', label: 'Announcements', icon: Megaphone, isFunctional: true },
  { id: 'analytics', label: 'Analytics', icon: BarChart2, isFunctional: true },
  { id: 'media', label: 'Media Library', icon: FolderKanban, isFunctional: false },
  { id: 'settings', label: 'Settings', icon: Settings, isFunctional: false },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose
}) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch {
      // Ignore
    }
    navigate('/');
  };
  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-slate-900 text-slate-200 flex flex-col justify-between transition-all duration-200 border-r border-slate-800 ${
          collapsed ? 'w-16' : 'w-60'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Branding Header */}
        <div>
          <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
            <div className={`flex items-center gap-2.5 overflow-hidden ${collapsed ? 'justify-center w-full' : ''}`}>
              <div className="w-7 h-7 rounded-md bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-100 font-semibold text-xs shrink-0 shadow-xs">
                LMS
              </div>
              {!collapsed && (
                <div className="overflow-hidden">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block truncate">
                    Admin Console
                  </span>
                  <h1 className="font-semibold text-xs text-slate-100 truncate">
                    Control Center
                  </h1>
                </div>
              )}
            </div>

            {/* Mobile close button */}
            <button
              onClick={onMobileClose}
              className="lg:hidden p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-2 space-y-0.5 mt-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    onMobileClose();
                  }}
                  title={collapsed ? `${item.label}${!item.isFunctional ? ' (Soon)' : ''}` : undefined}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors relative group cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-slate-100 font-semibold shadow-2xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  } ${collapsed ? 'justify-center' : ''}`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'}`} />

                  {!collapsed && (
                    <div className="flex items-center justify-between flex-1 min-w-0">
                      <span className="truncate">{item.label}</span>
                      {!item.isFunctional && (
                        <span className="text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 shrink-0 ml-1.5 border border-slate-700/50">
                          Soon
                        </span>
                      )}
                    </div>
                  )}

                  {/* Tooltip for collapsed mode */}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2.5 py-1 rounded-md bg-slate-900 text-slate-100 text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-md border border-slate-800">
                      {item.label} {!item.isFunctional && '(Soon)'}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer & Navigation Controls */}
        <div className="p-2 border-t border-slate-800 space-y-1">
          {/* Back to Home Page Link */}
          <Link
            to="/"
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-teal-900/40 hover:bg-teal-900/80 text-xs text-teal-200 border border-teal-800/50 transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Return to Main Home Page"
          >
            <Home className="w-3.5 h-3.5 text-teal-300 shrink-0" />
            {!collapsed && <span className="font-semibold text-xs truncate">Back to Home</span>}
          </Link>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-rose-950/40 hover:bg-rose-900/60 text-xs text-rose-300 border border-rose-900/40 transition-colors cursor-pointer ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Exit Admin & Logout"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            {!collapsed && <span className="font-semibold text-xs truncate">Exit & Logout</span>}
          </button>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={onToggleCollapse}
            className={`hidden lg:flex w-full items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            {collapsed ? (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <>
                <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-medium">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
