import React, { useState } from 'react';
import { signIn, SessionError } from '../../lib/session';

/**
 * The Desk's front door. Password sign-in against Supabase Auth; only
 * accounts in admin_users get through (checked in signIn). The terminal's
 * `login` command is the other way in and lands in the same session.
 */
const SignIn: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
      // useSession picks up the new session; nothing to navigate.
    } catch (err) {
      setError(err instanceof SessionError ? err.message : 'Something went wrong. Try again.');
      setBusy(false);
    }
  };

  const field =
    'desk-input w-full px-4 py-3 bg-[#050505] border border-[#262626] text-white font-mono placeholder-[#525252] focus:outline-none focus:border-[#2563EB] transition-colors';

  return (
    <div className="min-h-[100dvh] bg-[#050505] flex items-center justify-center px-5">
      <form onSubmit={submit} className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 bg-[#0A0A0A] border border-[#262626] grid place-items-center">
            <span className="text-[#2563EB] font-bold text-base font-space-grotesk">EB</span>
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#525252] font-mono">
            Desk
          </span>
        </div>

        <label className="block mb-4">
          <span className="block text-[10px] uppercase tracking-widest text-[#525252] font-mono mb-2">
            Email
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
            autoCapitalize="off"
            autoFocus
            className={field}
          />
        </label>

        <label className="block mb-6">
          <span className="block text-[10px] uppercase tracking-widest text-[#525252] font-mono mb-2">
            Password
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className={field}
          />
        </label>

        {error && (
          <p className="mb-5 text-xs font-mono text-red-400" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || !email || !password}
          className="w-full py-3 bg-[#2563EB] text-white font-space-grotesk font-bold text-sm uppercase tracking-widest pressable disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white hover:text-black"
        >
          {busy ? 'Opening…' : 'Sit down'}
        </button>

        <p className="mt-8 text-[10px] font-mono text-[#525252] leading-relaxed">
          Or type <span className="text-[#737373]">login</span> in the terminal.
        </p>
      </form>
    </div>
  );
};

export default SignIn;
