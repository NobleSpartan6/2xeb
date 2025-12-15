import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // This component is only shown after PASSWORD_RECOVERY event, so session is already ready

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        console.error('[ResetPassword] Update error:', error);
        setError(error.message);
      } else {
        console.log('[ResetPassword] Password updated successfully');
        setSuccess(true);
        // Sign out and redirect to login after 2 seconds
        setTimeout(async () => {
          console.log('[ResetPassword] Signing out and redirecting...');
          await supabase.auth.signOut();
          // Force redirect to login - use replace to clear history
          window.location.replace(window.location.origin + '/#/admin/login');
        }, 2000);
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 bg-[#2563EB]/10 border border-[#2563EB]/30 grid place-items-center mx-auto mb-4 rounded">
            <svg className="w-6 h-6 text-[#2563EB]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-space-grotesk font-bold text-white mb-2">Password Updated</h2>
          <p className="text-[#737373] font-mono text-sm">Redirecting to login...</p>
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
            Set New Password
          </h1>
          <p className="text-sm text-[#737373] font-mono">
            Enter your new password below
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded">
            <p className="text-sm text-red-400 font-mono">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 bg-[#0A0A0A] border border-[#262626]">
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-[10px] uppercase tracking-widest text-[#525252] font-mono mb-2"
            >
              New Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                minLength={6}
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

          <div className="mb-6">
            <label
              htmlFor="confirmPassword"
              className="block text-[10px] uppercase tracking-widest text-[#525252] font-mono mb-2"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-12 bg-[#050505] border border-[#262626] text-white font-mono text-sm placeholder-[#525252] focus:outline-none focus:border-[#2563EB] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#525252] hover:text-[#737373] transition-colors"
              >
                {showConfirmPassword ? (
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

          <button
            type="submit"
            disabled={isSubmitting || !password || !confirmPassword}
            className="w-full py-3 bg-[#2563EB] hover:bg-[#3b82f6] disabled:bg-[#2563EB]/50 disabled:cursor-not-allowed text-white font-space-grotesk font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Updating...</span>
              </>
            ) : (
              'Set Password'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
