import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ZivaLayout } from '../layouts/ZivaLayout';
import { useZivaAuth } from '../contexts/ZivaAuthContext';
import { Mail, Send, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

export const ZivaForgotPasswordPage: React.FC = () => {
  const { resetPassword } = useZivaAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
        setSuccessMsg('Password reset link sent! Please check your inbox and follow instructions.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ZivaLayout>
      <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-neutral-950 border-2 border-amber-500/40 p-8 rounded-2xl shadow-2xl space-y-6">
          
          <div className="text-center space-y-2">
            <span className="text-xs font-serif font-bold text-amber-400 tracking-widest uppercase">
              Ziva LMS Portal
            </span>
            <h1 className="text-3xl font-serif font-bold text-white uppercase">
              Reset Password
            </h1>
            <p className="text-xs text-gray-400">
              Enter your registered student email address to receive a password reset link.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-950/80 border border-red-500 text-red-200 text-xs rounded-md flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs rounded-md flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3.5 text-gray-500" />
                <input
                  type="email"
                  required
                  placeholder="student@ziva.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black border border-gray-800 text-white text-xs pl-9 pr-4 py-3 rounded-md focus:ring-2 focus:ring-[#FF2E93] outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#FF2E93] hover:bg-pink-600 text-white font-bold text-xs uppercase tracking-widest py-3.5 rounded-md shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Sending Link...' : 'Send Reset Link'}</span>
            </button>
          </form>

          <div className="pt-4 border-t border-gray-900 text-center text-xs text-gray-400">
            <Link to="/ziva/login" className="inline-flex items-center gap-1.5 text-pink-400 font-bold hover:underline">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>

        </div>
      </div>
    </ZivaLayout>
  );
};
