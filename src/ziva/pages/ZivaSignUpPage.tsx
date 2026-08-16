import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ZivaLayout } from '../layouts/ZivaLayout';
import { useZivaAuth } from '../contexts/ZivaAuthContext';
import { Lock, Mail, User, ArrowRight, AlertCircle } from 'lucide-react';

export const ZivaSignUpPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { signup } = useZivaAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await signup(email, password, fullName);
      navigate('/ziva/student');
    } catch (err: any) {
      setError(err.message || 'Signup failed.');
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
              Join Ziva
            </span>
            <h2 className="text-3xl font-serif font-bold text-white uppercase">
              Create Account
            </h2>
            <p className="text-xs text-gray-400">
              Unlock life-transforming confidence and communication masterclasses.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-950/80 border border-red-500 text-red-200 text-xs rounded-md flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3.5 text-gray-500" />
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-black border border-gray-800 text-white text-xs pl-9 pr-4 py-3 rounded-md focus:ring-2 focus:ring-[#FF2E93] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3.5 text-gray-500" />
                <input
                  type="email"
                  required
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black border border-gray-800 text-white text-xs pl-9 pr-4 py-3 rounded-md focus:ring-2 focus:ring-[#FF2E93] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3.5 text-gray-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black border border-gray-800 text-white text-xs pl-9 pr-4 py-3 rounded-md focus:ring-2 focus:ring-[#FF2E93] outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#FF2E93] hover:bg-pink-600 text-white font-bold text-xs uppercase tracking-widest py-3.5 rounded-md shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
            >
              {submitting ? 'Creating Account...' : 'Register & Start'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-gray-900 text-center text-xs text-gray-400">
            Already have a Ziva account?{' '}
            <Link to="/ziva/login" className="text-pink-400 font-bold hover:underline">
              Sign In
            </Link>
          </div>

        </div>
      </div>
    </ZivaLayout>
  );
};
