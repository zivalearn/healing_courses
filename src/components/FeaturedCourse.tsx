import React from 'react';
import { motion } from 'motion/react';
import { Course } from '../types';
import { Sparkles, Clock, Award, Star, CheckCircle2, User, ArrowRight, ShieldCheck, Heart, Compass, Globe, Leaf } from 'lucide-react';

interface FeaturedCourseProps {
  course: Course | null;
  onKnowMore: (course: Course) => void;
  onEnroll: (course: Course) => void;
  onSelectAnotherFeatured?: () => void;
}

export const FeaturedCourse: React.FC<FeaturedCourseProps> = ({
  course,
  onKnowMore,
  onEnroll,
  onSelectAnotherFeatured
}) => {
  return (
    <section id="featured" className="py-10 md:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      
      {/* 1. Image 2 Layout Grid: Dark Quote Card + Signature Journeys & Why Work with Heer Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Dark Ocean Navy Card (as seen in Image 2) */}
        <div className="lg:col-span-3 bg-[#133240] text-white p-8 rounded-[2rem] flex flex-col justify-between relative overflow-hidden shadow-xl min-h-[340px] border border-[#287687]/30">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#287687]/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-4 relative z-10 my-auto">
            <span className="text-[#CBA258] text-[10px] font-bold uppercase tracking-widest block">Daily Affirmation</span>
            <h3 className="font-serif text-3xl sm:text-4xl leading-snug font-normal text-white">
              "You are not too much.
              <span className="block font-serif italic text-[#CBA258] font-light mt-1">You are healing."</span>
            </h3>
          </div>

          <div className="pt-6 border-t border-white/10 relative z-10 text-xs text-white/70 italic">
            Awareness is the first step of healing.
          </div>
        </div>

        {/* Center/Main Featured Program or Signature Journeys Overview */}
        <div className="lg:col-span-6 bg-white rounded-[2rem] p-6 sm:p-8 border border-[#C8E6E1] shadow-sm flex flex-col justify-between space-y-6">
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-full bg-[#E2F1EE] text-[#287687] text-[10px] font-bold uppercase tracking-widest border border-[#C8E6E1]">
                Signature Healing Journeys
              </span>
              <span className="text-xs text-[#287687] font-semibold flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-[#CBA258] text-[#CBA258]" /> 4.98 Rating
              </span>
            </div>

            <h3 className="font-serif text-2xl sm:text-4xl font-bold text-[#102A36] leading-tight">
              {course ? course.name : 'Master Subconscious & Energy Healing'}
            </h3>

            <p className="text-xs sm:text-sm text-[#486D7A] leading-relaxed mt-3">
              {course ? course.shortDescription : 'Transform deep-seated emotional patterns, activate innate energy systems, and step into practitioner mastery with personalized 1-on-1 and live cohort sessions.'}
            </p>
          </div>

          {/* Quick Key Outcome Highlights */}
          {course && course.keyOutcomes && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#102A36] pt-2 border-t border-[#C8E6E1]/60">
              {course.keyOutcomes.slice(0, 4).map((outcome, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#287687] shrink-0 mt-0.5" />
                  <span>{outcome}</span>
                </div>
              ))}
            </div>
          )}

          {/* Pricing & CTA */}
          <div className="pt-4 border-t border-[#C8E6E1] flex flex-col sm:flex-row items-center justify-between gap-4">
            {course ? (
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#486D7A] font-bold block">Tuition Fee</span>
                <span className="text-2xl font-serif font-bold text-[#102A36]">
                  {course.currency}{course.price.toLocaleString()}
                </span>
              </div>
            ) : (
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#486D7A] font-bold block">Certification</span>
                <span className="text-sm font-serif font-bold text-[#102A36]">Accredited Programs</span>
              </div>
            )}

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {course && (
                <button
                  onClick={() => onKnowMore(course)}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-full border border-[#287687] text-[#287687] hover:bg-[#E2F1EE] text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Details
                </button>
              )}
              {course ? (
                <button
                  onClick={() => onEnroll(course)}
                  className="flex-1 sm:flex-initial px-6 py-2.5 rounded-full bg-[#102A36] hover:bg-[#287687] text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Enroll Now</span>
                  <ArrowRight className="w-4 h-4 text-[#CBA258]" />
                </button>
              ) : (
                <a
                  href="#courses"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#102A36] text-white text-xs font-bold uppercase tracking-widest text-center"
                >
                  Browse Catalog
                </a>
              )}
            </div>
          </div>

        </div>

        {/* Right Mint Card ("Why Work With Heer?" panel as seen in Image 2) */}
        <div className="lg:col-span-3 bg-[#E2F1EE] p-6 sm:p-8 rounded-[2rem] border border-[#C8E6E1] flex flex-col justify-between space-y-6">
          <div>
            <span className="text-[#287687] text-[11px] font-serif italic block mb-1">Divine Intention</span>
            <h3 className="font-serif text-2xl font-bold text-[#102A36]">
              Why work with Heer?
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#287687] shrink-0 border border-[#C8E6E1]">
                <Leaf className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#102A36]">Ancient wisdom</h4>
                <p className="text-[11px] text-[#486D7A]">Modern psychological approach</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#287687] shrink-0 border border-[#C8E6E1]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#102A36]">Safe, sacred space</h4>
                <p className="text-[11px] text-[#486D7A]">Judgement-free healing</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#287687] shrink-0 border border-[#C8E6E1]">
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#102A36]">Personalized</h4>
                <p className="text-[11px] text-[#486D7A]">Tailored transformation</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#287687] shrink-0 border border-[#C8E6E1]">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#102A36]">Online sessions</h4>
                <p className="text-[11px] text-[#486D7A]">Available worldwide</p>
              </div>
            </div>
          </div>

          <div className="pt-2 text-center border-t border-[#C8E6E1]">
            <span className="text-[10px] uppercase tracking-widest text-[#287687] font-bold">
              100% Accredited Programs
            </span>
          </div>
        </div>

      </div>

    </section>
  );
};
