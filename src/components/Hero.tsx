import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowDown, Award, Users, Star, HeartHandshake } from 'lucide-react';

interface HeroProps {
  onExploreClick: () => void;
  onContactClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreClick, onContactClick }) => {
  return (
    <section id="about" className="relative overflow-hidden pt-10 pb-16 md:pt-16 md:pb-24 bg-gradient-to-b from-[#EEF7F5] via-[#E4F3F0] to-[#EEF7F5]">
      {/* Soft Ambient Radiance in Sea Green, Ice Blue & Subtle Golden Light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-[#287687]/10 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-[#388B8C]/15 rounded-full blur-3xl" />
        <div className="absolute top-10 left-1/3 w-64 h-64 bg-[#F2D06B]/15 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Top Eyebrow Tag */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-[#E8D49E] text-[#287687] text-[11px] sm:text-xs font-bold uppercase tracking-widest mb-6 shadow-xs italic"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#D4A017] animate-pulse" />
          <span>HEAL , TRANSFORM, <span className="text-[#B8860B] font-extrabold">CREATE A LEGACY</span></span>
        </motion.div>

        {/* Main Heading */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-serif text-5xl sm:text-7xl md:text-8xl leading-[1.08] text-[#102A36] tracking-tight"
        >
          Healing is <br className="hidden sm:inline" />
          <span className="font-serif italic text-[#287687] font-normal">
            coming home to <span className="bg-gradient-to-r from-[#B8860B] via-[#D4A017] to-[#CBA258] bg-clip-text text-transparent font-medium not-italic">you.</span>
          </span>
        </motion.h1>

        {/* Slogan Subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-6 text-sm sm:text-base md:text-lg text-[#486D7A] max-w-2xl mx-auto leading-relaxed font-semibold italic uppercase tracking-wider"
        >
          CHANGE YOUR OLD IDENTITY AND <span className="font-bold bg-gradient-to-r from-[#B8860B] via-[#D4A017] to-[#102A36] bg-clip-text text-transparent">BECOME A NEW AVATAR</span>
        </motion.p>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={onExploreClick}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#102A36] text-white text-xs font-bold uppercase tracking-widest shadow-md hover:bg-[#287687] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>Explore All Courses</span>
            <ArrowDown className="w-4 h-4 text-[#CBA258] group-hover:translate-y-0.5 transition-transform" />
          </button>

          <button
            onClick={onContactClick}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-[#102A36] text-xs font-bold uppercase tracking-widest border border-[#C8E6E1] hover:border-[#287687] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <HeartHandshake className="w-4 h-4 text-[#287687]" />
            <span>Book Discovery Call</span>
          </button>
        </motion.div>

        {/* Image 1 exact 4 Stats Pillars */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-16 pt-10 border-t border-[#C8E6E1]/80 grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-x-0 md:divide-x divide-[#C8E6E1]/60"
        >
          <div className="flex flex-col items-center px-2">
            <span className="text-3xl sm:text-4xl font-serif font-bold text-[#102A36]">
              5000+
            </span>
            <span className="text-[11px] text-[#486D7A] font-bold uppercase tracking-widest mt-1">
              HEALED INDIVIDUALS
            </span>
          </div>

          <div className="flex flex-col items-center px-2">
            <span className="text-3xl sm:text-4xl font-serif font-bold text-[#102A36]">
              100+
            </span>
            <span className="text-[11px] text-[#486D7A] font-bold uppercase tracking-widest mt-1">
              WORKSHOPS & EVENTS
            </span>
          </div>

          <div className="flex flex-col items-center px-2">
            <span className="text-3xl sm:text-4xl font-serif font-bold text-[#102A36]">
              75+
            </span>
            <span className="text-[11px] text-[#486D7A] font-bold uppercase tracking-widest mt-1">
              AWARDS
            </span>
          </div>

          <div className="flex flex-col items-center px-2">
            <span className="text-3xl sm:text-4xl font-serif font-bold text-[#102A36]">
              5+
            </span>
            <span className="text-[11px] text-[#486D7A] font-bold uppercase tracking-widest mt-1">
              YEARS OF EXPERIENCE
            </span>
          </div>
        </motion.div>

      </div>
    </section>
  );
};
