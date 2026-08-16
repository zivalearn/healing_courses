import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ContactModal } from '../components/ContactModal';
import { Sparkles, Mail, Send, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    try {
      setError(null);
      setSuccessMsg(null);
      setSubmitting(true);

      const { error: resetError } = await resetPassword(email);

      if (resetError) {
        setError(resetError.message || 'Failed to send password reset email.');
      } else {
        setSuccessMsg('Password reset link sent! Please check your inbox and follow the instructions.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
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
              Reset Your Password
            </h1>
            <p className="text-xs text-[#486D7A]">
              Enter your registered student email address to receive a password reset link.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-xs">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-800 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
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

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#102A36] hover:bg-[#287687] text-white text-xs font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Sending Link...' : 'Send Reset Link'}</span>
            </button>
          </form>

          <div className="text-center pt-2">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#287687] hover:underline">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>

        </div>
      </main>

      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
      <Footer onOpenContact={() => setIsContactOpen(true)} />
    </div>
  );
};

export default ForgotPasswordPage;
