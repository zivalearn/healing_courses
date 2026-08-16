import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useZivaAuth } from '../contexts/ZivaAuthContext';

interface ZivaProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ZivaProtectedRoute: React.FC<ZivaProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { user, loading, isAdmin } = useZivaAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-amber-400 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#FF2E93] border-t-transparent rounded-full animate-spin"></div>
          <span className="tracking-widest uppercase text-xs font-semibold">Loading Ziva LMS...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/ziva/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/ziva/student" replace />;
  }

  return <>{children}</>;
};
