import React from 'react';
import { Sparkles, Construction, ArrowLeft, Clock } from 'lucide-react';

interface ComingSoonSectionProps {
  title: string;
  description: string;
  icon?: React.FC<{ className?: string }>;
  onGoToCourses: () => void;
}

export const ComingSoonSection: React.FC<ComingSoonSectionProps> = ({
  title,
  description,
  icon: Icon,
  onGoToCourses
}) => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-[#C8E6E1] text-center space-y-6 animate-fade-in my-4">
      <div className="w-16 h-16 rounded-3xl bg-[#EEF7F5] border border-[#C8E6E1] flex items-center justify-center text-[#287687] relative">
        <Sparkles className="w-8 h-8 text-[#CBA258]" />
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#102A36] text-white flex items-center justify-center text-[10px] font-bold">
          <Clock className="w-3 h-3 text-[#CBA258]" />
        </div>
      </div>

      <div className="max-w-md space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#CBA258] bg-[#102A36] px-3 py-1 rounded-full">
          Phase 2 Authoring Suite
        </span>
        <h2 className="font-serif font-bold text-2xl text-[#102A36]">{title}</h2>
        <p className="text-xs text-[#486D7A] leading-relaxed">
          {description} This module is scheduled for future deployment. In Phase 2, Course Management and Dashboard Authoring are fully operational.
        </p>
      </div>

      <div className="pt-2">
        <button
          onClick={onGoToCourses}
          className="px-6 py-3 rounded-full bg-[#287687] hover:bg-[#102A36] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#CBA258]" />
          <span>Return to Course Management</span>
        </button>
      </div>
    </div>
  );
};
