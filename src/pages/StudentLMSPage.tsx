import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ContactModal } from '../components/ContactModal';
import { useAuth } from '../contexts/AuthContext';
import { StudentDashboard } from './student/StudentDashboard';

export const StudentLMSPage: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isContactOpen, setIsContactOpen] = useState(false);

  const studentName = profile?.full_name || (user?.email ? user.email.split('@')[0] : 'Seeker');
  const userId = user?.id || 'demo-student-id';

  return (
    <div className="min-h-screen bg-[#EEF7F5] text-[#102A36] flex flex-col font-sans">
      <Header onOpenContact={() => setIsContactOpen(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <StudentDashboard
          userId={userId}
          studentName={studentName}
          onExploreCourses={() => navigate('/')}
        />
      </main>

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />

      <Footer onOpenContact={() => setIsContactOpen(true)} />
    </div>
  );
};
