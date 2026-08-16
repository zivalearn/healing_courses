import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ZivaAuthProvider } from '../contexts/ZivaAuthContext';
import { ZivaProtectedRoute } from '../components/ZivaProtectedRoute';

import { ZivaLandingPage } from '../pages/ZivaLandingPage';
import { ZivaCataloguePage } from '../pages/ZivaCataloguePage';
import { ZivaCourseDetailPage } from '../pages/ZivaCourseDetailPage';
import { ZivaLoginPage } from '../pages/ZivaLoginPage';
import { ZivaSignUpPage } from '../pages/ZivaSignUpPage';
import { ZivaForgotPasswordPage } from '../pages/ZivaForgotPasswordPage';
import { ZivaStudentDashboard } from '../pages/ZivaStudentDashboard';
import { ZivaStudentPlayer } from '../pages/ZivaStudentPlayer';
import { ZivaAdminDashboard } from '../pages/ZivaAdminDashboard';
import { ZivaAdminCourseBuilder } from '../pages/ZivaAdminCourseBuilder';

export const ZivaRoutes: React.FC = () => {
  return (
    <ZivaAuthProvider>
      <Routes>
        <Route path="/" element={<ZivaLandingPage />} />
        <Route path="/catalogue" element={<ZivaCataloguePage />} />
        <Route path="/course/:slug" element={<ZivaCourseDetailPage />} />
        <Route path="/login" element={<ZivaLoginPage />} />
        <Route path="/signup" element={<ZivaSignUpPage />} />
        <Route path="/forgot-password" element={<ZivaForgotPasswordPage />} />
        
        <Route
          path="/student"
          element={
            <ZivaProtectedRoute>
              <ZivaStudentDashboard />
            </ZivaProtectedRoute>
          }
        />
        
        <Route
          path="/player/:courseId"
          element={
            <ZivaProtectedRoute>
              <ZivaStudentPlayer />
            </ZivaProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ZivaProtectedRoute requireAdmin>
              <ZivaAdminDashboard />
            </ZivaProtectedRoute>
          }
        />

        <Route
          path="/admin/course-builder/:courseId"
          element={
            <ZivaProtectedRoute requireAdmin>
              <ZivaAdminCourseBuilder />
            </ZivaProtectedRoute>
          }
        />
      </Routes>
    </ZivaAuthProvider>
  );
};
