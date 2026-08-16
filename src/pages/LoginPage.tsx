import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ContactModal } from '../components/ContactModal';
import { Sparkles, Mail, Lock, LogIn, AlertCircle, UserCheck } from 'lucide-react';
import { profileService } from '../services/profileService';
import { enrollmentService } from '../services/enrollmentService';

export const LoginPage: React.FC = () => {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/my-courses';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activationNotice, setActivationNotice] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setError(null);
      setActivationNotice(false);
      setSubmitting(true);
      const { error: authError } = await signIn(email, password);

      if (authError) {
        // Check if an enrollment exists for this email
        const { data: allProfiles } = await profileService.getAllProfiles();
        const { data: allEnrollments } = await enrollmentService.getAllEnrollments();

        const matchProfile = allProfiles?.find(p => p.email && p.email.toLowerCase() === email.toLowerCase());
        const matchEnrollment = allEnrollments?.find(e => matchProfile && e.user_id === matchProfile.id);

        if (matchProfile || matchEnrollment) {
          setActivationNotice(true);
          setError(null);
        } else {
          setError(authError.message || 'Failed to sign in. Please verify your credentials.');
        }
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      const { error: googleError } = await signInWithGoogle();
      if (googleError) {
        setError(googleError.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize Google Sign In.');
    }
  };

  return (
    <div className="min-h-screen bg-[#EEF7F5] text-[#102A36] flex flex-col font-sans">
      <Header onOpenContact={() => setIsContactOpen(true)} />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-[#C8E6E1] shadow-sm">
          
          <div className="text-center space-y-2">
            <span className="font-serif italic text-[11px] tracking-widest text-[#287687] font-semibold uppercase flex items-center justify-center gap-1">
              HEAL WITH HEER <Sparkles className="w-3 h-3 text-[#E5C158] animate-pulse" />
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#102A36]">
              Student Portal Sign In
            </h1>
            <p className="text-xs text-[#486D7A]">
              Enter your credentials to access your enrolled courses and dashboard.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-xs">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {activationNotice && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3 text-amber-900 text-xs">
              <div className="flex items-start gap-3">
                <UserCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-sm">Course Enrollment Found!</p>
                  <p>
                    An active course enrollment was found for <strong>{email}</strong>. If you haven't created a password yet, click below to set up your account password and access your Student Portal.
                  </p>
                </div>
              </div>
              <Link
                to={`/signup?email=${encodeURIComponent(email)}`}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                <span>Create Password / Activate Portal</span>
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#102A36]">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#486D7A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#EEF7F5] border border-[#C8E6E1] text-xs font-medium text-[#102A36] focus:outline-none focus:border-[#287687]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#102A36]">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-bold text-[#287687] hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#486D7A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#EEF7F5] border border-[#C8E6E1] text-xs font-medium text-[#102A36] focus:outline-none focus:border-[#287687]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#102A36] hover:bg-[#287687] text-white text-xs font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{submitting ? 'Signing In...' : 'Sign In'}</span>
            </button>
          </form>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-[#C8E6E1]"></div>
            <span className="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-widest text-[#486D7A]">
              Or continue with
            </span>
            <div className="flex-grow border-t border-[#C8E6E1]"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full py-3 px-4 rounded-2xl bg-white border border-[#C8E6E1] hover:bg-[#EEF7F5] text-[#102A36] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google Account</span>
          </button>

          <div className="text-center pt-2 text-xs text-[#486D7A]">
            Don't have a student account yet?{' '}
            <Link to="/signup" className="font-bold text-[#287687] hover:underline">
              Sign Up
            </Link>
          </div>

        </div>
      </main>

      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
      <Footer onOpenContact={() => setIsContactOpen(true)} />
    </div>
  );
};

export default LoginPage;
