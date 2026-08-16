import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ZivaLayout } from '../layouts/ZivaLayout';
import { Play, Sparkles, Award, Star, BookOpen, CheckCircle, ArrowRight, Video, ChevronRight, HelpCircle } from 'lucide-react';

export const ZivaLandingPage: React.FC = () => {
  const navigate = useNavigate();

  // Lead Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submittedLead, setSubmittedLead] = useState(false);

  // Spin Wheel State
  const [spinning, setSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [selectedResult, setSelectedResult] = useState<string | null>(null);

  const wheelSegments = [
    { label: 'Fear', advice: 'Fear is just false evidence appearing real. Reframe physiological excitement as fuel for your voice.' },
    { label: 'Rejection', advice: 'Rejection is redirection. Every "no" clarifies your authentic message and strengthens your resolve.' },
    { label: 'Failure', advice: 'Failure is data. Top speakers iterate through 100 iterations to craft a single masterwork talk.' },
    { label: 'Anxiety', advice: 'Anxiety dissolves when you switch focus from performance to serving the hearts in the room.' },
  ];

  const handleSpin = () => {
    if (spinning) return;
    setSpinning(true);
    setSelectedResult(null);

    const extraRounds = 3 + Math.floor(Math.random() * 3);
    const randomIdx = Math.floor(Math.random() * wheelSegments.length);
    const segmentAngle = 360 / wheelSegments.length;
    const targetDegrees = wheelRotation + (extraRounds * 360) + (randomIdx * segmentAngle) + 45;

    setWheelRotation(targetDegrees);

    setTimeout(() => {
      setSpinning(false);
      setSelectedResult(wheelSegments[randomIdx].advice);
    }, 3000);
  };

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;
    setSubmittedLead(true);
  };

  return (
    <ZivaLayout>
      {/* 1. HERO SECTION */}
      <section className="relative bg-black overflow-hidden pt-12 pb-20 border-b border-gray-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-950/20 via-black to-black pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-extrabold uppercase tracking-tight text-white mb-2">
            Amplify
          </h2>

          <div className="inline-block relative my-2">
            <span className="text-5xl sm:text-7xl md:text-8xl font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-300 to-indigo-300 drop-shadow-[0_5px_15px_rgba(255,46,147,0.4)]">
              CONFIDENCE
            </span>
          </div>

          <p className="mt-6 text-xl sm:text-3xl font-serif text-amber-200 max-w-4xl mx-auto tracking-wide font-light">
            MAXIMIZE <span className="font-bold underline decoration-amber-500">POTENTIAL</span> & <span className="font-bold text-amber-400">INCOME</span>
          </p>

          <p className="mt-2 text-base sm:text-lg text-gray-300 font-sans tracking-wide">
            Become A Better You Everyday. Be part of the world's most powerful life transformational platform.
          </p>

          <div className="mt-8 flex justify-center">
            <a
              href="#programs"
              className="inline-flex items-center gap-2 bg-[#FF2E93] hover:bg-pink-600 text-white font-bold text-sm uppercase tracking-widest px-8 py-4 rounded-sm shadow-xl shadow-pink-900/50 transform hover:scale-105 transition-all"
            >
              Work With Meharr
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* PRESENTER IMAGE / HERO GRAPHIC */}
          <div className="mt-12 max-w-2xl mx-auto relative rounded-2xl overflow-hidden border border-amber-500/20 shadow-2xl bg-gradient-to-b from-gray-900/50 to-black p-2">
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1200"
              alt="Meharr - National Level Speaker"
              className="w-full h-80 sm:h-96 object-cover object-top rounded-xl opacity-90 hover:opacity-100 transition-opacity"
            />
            <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-md border border-amber-400/40 p-4 rounded-lg text-left flex items-center justify-between">
              <div>
                <p className="text-amber-300 font-serif text-lg font-bold">Meharr</p>
                <p className="text-xs text-gray-300">National Level Speaker | Recognized by Chief Justice of India</p>
              </div>
              <div className="flex items-center gap-1 text-amber-400 text-xs font-bold bg-amber-950/80 px-3 py-1.5 rounded border border-amber-500/30">
                <Award className="w-4 h-4 text-amber-400" />
                75+ Awards
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. MEDIA PRESS BANNER */}
      <div className="bg-black py-6 border-b border-gray-900 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between min-w-[600px] text-gray-400 font-serif text-lg tracking-wider opacity-80">
          <span className="text-amber-200/90 font-bold">Divya Drishti</span>
          <span className="text-red-500 font-extrabold tracking-widest">AAJ TAK</span>
          <span className="text-white font-extrabold tracking-widest">ZEE NEWS</span>
          <span className="italic text-amber-100">Times of India</span>
          <span className="text-amber-200/90 font-bold">Divya Bhaskar</span>
        </div>
      </div>

      {/* 3. FREE GUIDE & VIDEO SERIES SECTION */}
      <section className="py-20 bg-black border-b border-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* LEFT BOOK / POSTER ART */}
            <div className="lg:col-span-5 relative">
              <div className="bg-gradient-to-br from-amber-950/60 via-black to-black border-2 border-amber-500/50 p-6 rounded-2xl shadow-2xl text-center space-y-6">
                <div className="text-amber-400 font-serif text-3xl font-extrabold tracking-widest uppercase">
                  SPEAK
                </div>
                <div className="text-white font-serif text-xl tracking-wide">
                  WITH
                </div>
                <div className="text-amber-300 font-serif text-4xl font-extrabold tracking-wider bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent uppercase">
                  CONFIDENCE
                </div>
                
                <div className="inline-flex items-center gap-2 bg-amber-500 text-black px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest">
                  <Play className="w-4 h-4 fill-black" />
                  Video Series + Free Guide
                </div>

                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-amber-500/30 text-[11px] text-amber-200/80">
                  <div className="p-2 border border-amber-500/20 rounded bg-amber-950/30">
                    <p className="font-bold text-amber-400">Awarded By</p>
                    <p className="text-[9px]">Chief Justice of India</p>
                  </div>
                  <div className="p-2 border border-amber-500/20 rounded bg-amber-950/30">
                    <p className="font-bold text-amber-400">75+</p>
                    <p className="text-[9px]">Awards Won</p>
                  </div>
                  <div className="p-2 border border-amber-500/20 rounded bg-amber-950/30">
                    <p className="font-bold text-amber-400">250+</p>
                    <p className="text-[9px]">Stage Appearances</p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT FORM */}
            <div className="lg:col-span-7 space-y-6">
              <span className="text-pink-500 font-serif text-xl italic font-bold tracking-widest uppercase">
                DOWNLOAD
              </span>
              <h3 className="text-3xl sm:text-5xl font-serif text-amber-300 font-bold leading-tight">
                Speak With Confidence
              </h3>
              <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
                Transformational guide and video series to overcome fear, express yourself clearly, and communicate with unshakeable conviction in any room.
              </p>

              {submittedLead ? (
                <div className="p-6 bg-emerald-950/60 border border-emerald-500 rounded-xl text-emerald-200 text-center space-y-3">
                  <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-xl font-bold font-serif">Instant Access Granted!</p>
                  <p className="text-sm text-gray-300">Check your email for your free video series download link, or explore our flagship LMS programs below.</p>
                  <Link to="/ziva/catalogue" className="inline-block mt-3 bg-[#FF2E93] text-white font-bold text-xs uppercase px-6 py-2.5 rounded">
                    Browse Ziva Programs
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleLeadSubmit} className="space-y-4 pt-4 max-w-md">
                  <input
                    type="text"
                    required
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-white text-black px-4 py-3 rounded-md text-sm font-medium focus:ring-2 focus:ring-[#FF2E93] outline-none"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white text-black px-4 py-3 rounded-md text-sm font-medium focus:ring-2 focus:ring-[#FF2E93] outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="Phone number (optional)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white text-black px-4 py-3 rounded-md text-sm font-medium focus:ring-2 focus:ring-[#FF2E93] outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full bg-[#FF2E93] hover:bg-pink-600 text-white font-bold text-sm uppercase tracking-widest py-3.5 rounded-md transition-all shadow-lg shadow-pink-900/50"
                  >
                    Get Free Access Now
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* 4. WHO IS MEHARR? */}
      <section id="about" className="py-20 bg-neutral-950 border-b border-gray-900">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-8">
          <h2 className="text-4xl sm:text-6xl font-serif text-white uppercase tracking-tight">
            Who Is <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-300 to-cyan-300 italic">Meharr?</span>
          </h2>

          <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-3xl mx-auto font-light">
            A National Level Speaker recognized by the Chief Justice of India, Meharr is a powerhouse of communication and creative expression. With a legacy of 75+ awards and over 250 stage appearances as a speaker and anchor, she doesn't just teach confidence—she embodies it. As an author and Creative Expression Coach, Meharr specializes in transforming individuals into their most effective, confident, and successful selves through proven expertise and elite-level skill development.
          </p>

          {/* VIDEO CONTAINER */}
          <div className="mt-8 max-w-3xl mx-auto rounded-2xl overflow-hidden border-2 border-amber-500/40 bg-black aspect-video relative shadow-2xl">
            <video
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
              controls
              preload="metadata"
              className="w-full h-full object-cover"
              poster="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1200"
            />
          </div>
        </div>
      </section>

      {/* 5. BEYOND THE WORDS BOOK SHOWCASE */}
      <section className="py-20 bg-black border-b border-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6">
              <h2 className="text-4xl sm:text-6xl font-serif text-amber-300 font-extrabold uppercase tracking-tight">
                Beyond The Words
              </h2>
              <p className="text-xl font-serif text-white leading-snug">
                Introducing the world's leading confidence mastery book that will help transform your craft and business.
              </p>
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                Great communicators don't just talk, they transform rooms. This signature book will unlock all the secrets to powerful communication that makes you extraordinary in business, relationships, and life.
              </p>

              <div>
                <a
                  href="https://amazon.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-[#FF2E93] hover:bg-pink-600 text-white font-bold text-xs uppercase tracking-widest px-8 py-3.5 rounded-sm shadow-xl shadow-pink-900/40"
                >
                  Order On Amazon
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* 3D BOOK DISPLAY */}
            <div className="flex justify-center">
              <div className="relative w-72 h-96 bg-gradient-to-tr from-purple-950 via-indigo-950 to-purple-900 rounded-r-2xl rounded-l-sm border-l-8 border-amber-600/80 shadow-[20px_20px_50px_rgba(0,0,0,0.9)] p-6 text-amber-200 flex flex-col justify-between border border-amber-500/40 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="text-center space-y-2 pt-6">
                  <p className="text-2xl font-serif font-bold text-amber-300 uppercase tracking-wider">Beyond</p>
                  <p className="text-xs text-amber-100 tracking-widest">THE</p>
                  <p className="text-3xl font-serif font-extrabold text-amber-400 uppercase tracking-widest">Words</p>
                </div>
                <div className="text-center border-t border-amber-500/40 pt-4 pb-2">
                  <p className="text-xs tracking-widest text-amber-300 uppercase">Meharr</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. INTERACTIVE SPIN WHEEL SECTION */}
      <section className="py-20 bg-neutral-950 border-b border-gray-900 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6">
              <p className="text-gray-300 text-base leading-relaxed">
                When you transform your mindset, your communication, and your confidence, you don't just change your life—you inspire others to believe in theirs.
              </p>
              
              <div className="bg-black/80 border-l-4 border-pink-500 p-6 rounded-r-xl shadow-xl">
                <p className="font-serif italic text-amber-300 text-2xl font-bold">
                  "Build your empire, discover your infinite possibilities."
                </p>
              </div>

              {selectedResult && (
                <div className="p-4 bg-amber-950/60 border border-amber-500/50 rounded-lg text-amber-200 text-sm animate-fadeIn">
                  <p className="font-bold text-amber-400 mb-1">Meharr's Advice for You:</p>
                  <p>{selectedResult}</p>
                </div>
              )}
            </div>

            {/* INTERACTIVE WHEEL */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-full border-8 border-black shadow-[0_0_40px_rgba(255,46,147,0.3)] overflow-hidden">
                <div
                  className="w-full h-full rounded-full transition-transform duration-3000 ease-out flex items-center justify-center"
                  style={{ transform: `rotate(${wheelRotation}deg)` }}
                >
                  {/* WHEEL SECTIONS */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-yellow-100 to-amber-200 text-black flex items-center justify-center font-bold font-serif text-sm p-4 rotate-0 origin-center" style={{ clipPath: 'polygon(50% 50%, 0 0, 100% 0)' }}>
                    Rejection
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-200 to-indigo-300 text-black flex items-center justify-center font-bold font-serif text-sm p-4 rotate-90 origin-center" style={{ clipPath: 'polygon(50% 50%, 0 0, 100% 0)' }}>
                    Fear
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-emerald-200 to-teal-300 text-black flex items-center justify-center font-bold font-serif text-sm p-4 rotate-180 origin-center" style={{ clipPath: 'polygon(50% 50%, 0 0, 100% 0)' }}>
                    Anxiety
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-purple-200 to-pink-300 text-black flex items-center justify-center font-bold font-serif text-sm p-4 rotate-270 origin-center" style={{ clipPath: 'polygon(50% 50%, 0 0, 100% 0)' }}>
                    Failure
                  </div>
                </div>

                {/* SPIN CENTER BUTTON */}
                <button
                  onClick={handleSpin}
                  disabled={spinning}
                  className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-black border-4 border-white text-white font-serif font-extrabold text-sm tracking-wider flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-transform cursor-pointer z-10"
                >
                  {spinning ? '...' : 'SPIN'}
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 7. RESULTS YOU CAN MEASURE (HEXAGON GRID) */}
      <section className="py-20 bg-black border-b border-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          
          <h2 className="text-4xl sm:text-6xl font-serif font-bold text-white uppercase tracking-tight">
            Results <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-300 to-cyan-300 italic">You Can Measure</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              'Craft a compelling signature talk',
              'Captivate audience',
              'Structure your talk',
              'Weave powerful stories',
              'Make an irresistible offer',
              'Own the stage',
              'Earn income through confident speaking',
              'Master executive presence'
            ].map((outcome, idx) => (
              <div
                key={idx}
                className="bg-neutral-900 border-2 border-amber-500/40 p-6 rounded-xl text-center space-y-3 hover:border-pink-500 transition-colors shadow-lg group"
              >
                <div className="w-10 h-10 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:bg-pink-500/20 group-hover:text-pink-400 transition-colors">
                  <Sparkles className="w-5 h-5" />
                </div>
                <p className="text-amber-200 font-serif font-bold text-lg leading-snug">
                  {outcome}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 8. ZIVA'S WALL OF GROWTH (COURSE CARDS) */}
      <section id="programs" className="py-20 bg-black border-b border-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          
          <h2 className="text-4xl sm:text-6xl font-serif text-white uppercase tracking-tight">
            Ziva's <span className="text-emerald-400 italic">Wall of Growth</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* BOOK COURSE 1 */}
            <div className="bg-gradient-to-b from-blue-950/80 via-black to-black border-2 border-blue-500/40 rounded-2xl p-6 text-left flex flex-col justify-between hover:border-pink-500 transition-all shadow-2xl group">
              <div className="space-y-4">
                <div className="h-48 rounded-xl overflow-hidden relative">
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800"
                    alt="Confident You"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 right-2 bg-pink-600 text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded">
                    Flagship
                  </div>
                </div>
                <h3 className="text-2xl font-serif font-bold text-amber-300">
                  Confident You
                </h3>
                <p className="text-xs text-gray-300 uppercase tracking-widest font-semibold text-pink-400">
                  Confidence and Communication Course
                </p>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Master social presence, dissolve performance anxiety, and speak with authentic magnetism.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-800 flex items-center justify-between">
                <span className="text-amber-400 font-bold text-xl">$149</span>
                <Link
                  to="/ziva/course/confident-you"
                  className="bg-[#FF2E93] hover:bg-pink-600 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded transition-colors"
                >
                  Explore Program
                </Link>
              </div>
            </div>

            {/* BOOK COURSE 2 */}
            <div className="bg-gradient-to-b from-purple-950/80 via-black to-black border-2 border-purple-500/40 rounded-2xl p-6 text-left flex flex-col justify-between hover:border-pink-500 transition-all shadow-2xl group">
              <div className="space-y-4">
                <div className="h-48 rounded-xl overflow-hidden relative">
                  <img
                    src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800"
                    alt="Karizmatic You"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h3 className="text-2xl font-serif font-bold text-amber-300">
                  Karizmatic You
                </h3>
                <p className="text-xs text-gray-300 uppercase tracking-widest font-semibold text-purple-400">
                  Personality Development Course
                </p>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Develop executive presence, non-verbal authority, and high-impact interpersonal skills.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-800 flex items-center justify-between">
                <span className="text-amber-400 font-bold text-xl">$189</span>
                <Link
                  to="/ziva/course/karizmatic-you"
                  className="bg-[#FF2E93] hover:bg-pink-600 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded transition-colors"
                >
                  Explore Program
                </Link>
              </div>
            </div>

            {/* BOOK COURSE 3 */}
            <div className="bg-gradient-to-b from-emerald-950/80 via-black to-black border-2 border-emerald-500/40 rounded-2xl p-6 text-left flex flex-col justify-between hover:border-pink-500 transition-all shadow-2xl group">
              <div className="space-y-4">
                <div className="h-48 rounded-xl overflow-hidden relative">
                  <img
                    src="https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=800"
                    alt="Expressive You"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h3 className="text-2xl font-serif font-bold text-amber-300">
                  Expressive You
                </h3>
                <p className="text-xs text-gray-300 uppercase tracking-widest font-semibold text-emerald-400">
                  Public Speaking Course
                </p>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Craft keynotes, command stages, and turn public speaking into a lucrative professional asset.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-800 flex items-center justify-between">
                <span className="text-amber-400 font-bold text-xl">$229</span>
                <Link
                  to="/ziva/course/expressive-you"
                  className="bg-[#FF2E93] hover:bg-pink-600 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded transition-colors"
                >
                  Explore Program
                </Link>
              </div>
            </div>

          </div>

          <div className="pt-6">
            <Link
              to="/ziva/catalogue"
              className="inline-flex items-center gap-2 border border-amber-400 text-amber-300 hover:bg-amber-400 hover:text-black font-bold text-xs uppercase tracking-widest px-8 py-3 rounded transition-all"
            >
              View Full Ziva Catalogue
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </section>

      {/* 9. TESTIMONIALS - LOVE FROM AROUND THE WORLD */}
      <section className="py-20 bg-neutral-950 border-b border-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          
          <h2 className="text-3xl sm:text-5xl font-serif font-bold text-white uppercase tracking-tight">
            Love From <span className="text-amber-300 italic">Around The World</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              "Before this course my hands would literally shake whenever I had to speak in front of a group but now I know how to manage it and keep going.",
              "This wasn't just a course. It was a journey of self discovery. Thank you for helping me become the person I always knew I could be.",
              "Honestly I joined because I used to get nervous even introducing myself in front of people. After the course I gave a presentation at work and didn't panic once."
            ].map((text, i) => (
              <div key={i} className="bg-black border border-amber-500/30 p-6 rounded-xl text-left space-y-4 shadow-xl">
                <div className="flex items-center text-amber-400 space-x-1">
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm italic leading-relaxed">"{text}"</p>
                <div className="border-t border-gray-800 pt-3 text-xs text-amber-200/80 font-medium">
                  Verified Ziva Student
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 10. NOW YOU HAVE A CHOICE (FOOTER CTA) */}
      <section className="py-24 bg-black text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 space-y-6 relative z-10">
          <h2 className="text-4xl sm:text-6xl font-serif font-extrabold text-white uppercase tracking-tight">
            Now You Have A <span className="text-amber-400 italic">Choice</span>
          </h2>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
            You can continue letting hesitation dictate your voice, or you can step into the infinite possibilities of your authentic confidence today.
          </p>
          <div className="pt-4">
            <Link
              to="/ziva/catalogue"
              className="inline-flex items-center gap-2 bg-[#FF2E93] hover:bg-pink-600 text-white font-bold text-sm uppercase tracking-widest px-10 py-4 rounded-sm shadow-2xl shadow-pink-900/60 transform hover:scale-105 transition-all"
            >
              Start Your Ziva Journey
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

    </ZivaLayout>
  );
};
