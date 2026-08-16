import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Heart, ArrowUp, PhoneCall, HeartHandshake } from 'lucide-react';

interface CTASectionProps {
  onExploreClick: () => void;
  onContactClick: () => void;
}

export const CTASection: React.FC<CTASectionProps> = ({ onExploreClick, onContactClick }) => {
  return (
    <section className="relative my-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="relative rounded-[2rem] overflow-hidden p-8 sm:p-12 md:p-14 bg-[#102A36] text-white shadow-2xl border border-[#287687]/30 text-center"
      >
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-[#CBA258] text-[11px] font-bold uppercase tracking-widest border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-[#CBA258]" />
            <span>Begin Your Transformation</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl font-normal tracking-wide text-white leading-tight">
            Ready to Awaken Your Inner Mastery & Healing Purpose?
          </h2>

          <p className="text-base sm:text-lg text-white/80 leading-relaxed max-w-2xl mx-auto font-normal">
            Whether you seek personal emotional freedom, certified practitioner status, or a global healing career — Heer is here to guide every step of your journey.
          </p>

          {/* Action CTAs */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onExploreClick}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#287687] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#1C5B69] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Sparkles className="w-4 h-4 text-[#CBA258]" />
              <span>Explore All Courses</span>
            </button>

            <button
              onClick={onContactClick}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-transparent text-white font-bold text-xs uppercase tracking-widest border border-white/30 hover:bg-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <PhoneCall className="w-4 h-4 text-[#CBA258]" />
              <span>Book Discovery Call</span>
            </button>
          </div>

          <div className="pt-6 flex items-center justify-center gap-2 text-xs text-white/60">
            <Heart className="w-3.5 h-3.5 text-[#CBA258] fill-[#CBA258]" />
            <span>Over 15,000+ Students & Clients Guided Globally</span>
          </div>

        </div>
      </motion.div>
    </section>
  );
};
