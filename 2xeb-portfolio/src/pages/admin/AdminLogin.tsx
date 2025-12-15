import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const { isAdmin, isLoading, signInWithPassword } = useAuth();
  const location = useLocation();

  // If already logged in as admin, redirect to admin dashboard
  if (isAdmin && !isLoading) {
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin';
    return <Navigate to={from} replace />;
  }

  // Check for error in URL state (e.g., unauthorized access attempt)
  const urlError = (location.state as { error?: string })?.error;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { error: authError } = await signInWithPassword(email, password);

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password.');
        } else if (authError.message.includes('Not authorized')) {
          setError('This account is not authorized for admin access.');
        } else {
          setError(authError.message);
        }
      }
      // Success will trigger redirect via isAdmin state change
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Use current origin for redirect (handles different dev ports)
      const redirectUrl = `${window.location.origin}${window.location.pathname}`;
      console.log('[AdminLogin] Sending reset to:', email, 'redirect:', redirectUrl);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        setError(error.message);
      } else {
        setResetSent(true);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-12 h-12 bg-[#0A0A0A] border border-[#262626] grid place-items-center">
            <span className="text-[#2563EB] font-bold text-lg font-space-grotesk">EB</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#0A0A0A] border border-[#262626] grid place-items-center">
              <span className="text-[#2563EB] font-bold text-xl font-space-grotesk">EB</span>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-[#525252] font-mono">
              ADMIN CONSOLE
            </span>
          </div>
          <h1 className="text-2xl font-space-grotesk font-bold text-white mb-2">
            Admin Access
          </h1>
          <p className="text-sm text-[#737373] font-mono">
            Sign in to manage portfolio content
          </p>
        </div>

        {/* Error messages */}
        {(error || urlError) && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded">
            <p className="text-sm text-red-400 font-mono">
              {urlError === 'unauthorized'
                ? 'You are not authorized to access the admin panel.'
                : error}
            </p>
          </div>
        )}

        {/* Reset sent success message */}
        {resetSent ? (
          <div className="p-6 bg-[#0A0A0A] border border-[#262626]">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#2563EB]/10 border border-[#2563EB]/30 grid place-items-center mx-auto mb-4 rounded">
                <svg className="w-6 h-6 text-[#2563EB]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-lg font-space-grotesk font-bold text-white mb-2">Check your email</h2>
              <p className="text-sm text-[#737373] font-mono mb-4">
                We sent a password reset link to {email}
              </p>
              <button
                onClick={() => { setResetSent(false); setForgotMode(false); }}
                className="text-[#2563EB] hover:text-[#3b82f6] font-mono text-sm"
              >
                Back to login
              </button>
            </div>
          </div>
        ) : forgotMode ? (
          /* Forgot password form */
          <form onSubmit={handleForgotPassword} className="p-6 bg-[#0A0A0A] border border-[#262626]">
            <div className="mb-6">
              <label
                htmlFor="email"
                className="block text-[10px] uppercase tracking-widest text-[#525252] font-mono mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="email"
                placeholder="admin@example.com"
                className="w-full px-4 py-3 bg-[#050505] border border-[#262626] text-white font-mono text-sm placeholder-[#525252] focus:outline-none focus:border-[#2563EB] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !email}
              className="w-full py-3 bg-[#2563EB] hover:bg-[#3b82f6] disabled:bg-[#2563EB]/50 disabled:cursor-not-allowed text-white font-space-grotesk font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Sending...</span>
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>

            <button
              type="button"
              onClick={() => setForgotMode(false)}
              className="w-full mt-3 py-2 text-[#737373] hover:text-white font-mono text-sm transition-colors"
            >
              Back to login
            </button>
          </form>
        ) : (
          /* Login form */
          <form onSubmit={handleSubmit} className="p-6 bg-[#0A0A0A] border border-[#262626]">
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-[10px] uppercase tracking-widest text-[#525252] font-mono mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="email"
                placeholder="admin@example.com"
                className="w-full px-4 py-3 bg-[#050505] border border-[#262626] text-white font-mono text-sm placeholder-[#525252] focus:outline-none focus:border-[#2563EB] transition-colors"
              />
            </div>

            <div className="mb-2">
              <label
                htmlFor="password"
                className="block text-[10px] uppercase tracking-widest text-[#525252] font-mono mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 bg-[#050505] border border-[#262626] text-white font-mono text-sm placeholder-[#525252] focus:outline-none focus:border-[#2563EB] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#525252] hover:text-[#737373] transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="mb-6 text-right">
              <button
                type="button"
                onClick={() => setForgotMode(true)}
                className="text-xs text-[#525252] hover:text-[#2563EB] font-mono transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !email || !password}
              className="w-full py-3 bg-[#2563EB] hover:bg-[#3b82f6] disabled:bg-[#2563EB]/50 disabled:cursor-not-allowed text-white font-space-grotesk font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>

            <p className="mt-4 text-xs text-[#525252] font-mono text-center">
              Only authorized administrators can access this area.
            </p>
          </form>
        )}

        {/* Back to site link */}
        <div className="mt-6 text-center">
          <a
            href="/#/"
            className="text-xs text-[#525252] hover:text-[#737373] font-mono transition-colors"
          >
            &larr; Back to portfolio
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
