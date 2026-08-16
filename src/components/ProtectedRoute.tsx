import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { user, profile, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EEF7F5] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 bg-white p-8 rounded-3xl border border-[#C8E6E1] shadow-sm max-w-sm text-center">
          <Sparkles className="w-10 h-10 text-[#287687] animate-spin" />
          <p className="font-serif font-bold text-[#102A36] text-lg">Verifying Session...</p>
          <p className="text-xs text-[#486D7A]">Please wait while we verify your authentication status.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && (!isAdmin || profile?.role !== 'admin')) {
    return <Navigate to="/my-courses" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
