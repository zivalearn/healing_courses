import React from 'react';
import { ZivaHeader } from '../components/ZivaHeader';
import { ZivaFooter } from '../components/ZivaFooter';

export const ZivaLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col selection:bg-[#FF2E93] selection:text-white">
      <ZivaHeader />
      <main className="flex-1">
        {children}
      </main>
      <ZivaFooter />
    </div>
  );
};
