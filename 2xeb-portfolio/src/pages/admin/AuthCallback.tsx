import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Verifying authentication...');
  const hasProcessed = useRef(false);

  useEffect(() => {
    console.log('[AuthCallback] Setting up auth listener');
    console.log('[AuthCallback] Full URL:', window.location.href);

    // Listen for auth state changes - Supabase will handle the PKCE exchange
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthCallback] Auth event:', event, session ? 'has session' : 'no session');

        // Only process SIGNED_IN event once
        if (event === 'SIGNED_IN' && session?.user && !hasProcessed.current) {
          hasProcessed.current = true;

          try {
            setStatus('Verifying admin status...');
            console.log('[AuthCallback] Session established for:', session.user.email);

            // Check admin_users table
            const { data: adminData, error: adminError } = await supabase
              .from('admin_users')
              .select('id')
              .eq('id', session.user.id)
              .single();

            console.log('[AuthCallback] Admin check result:', { adminData, adminError });

            if (adminError || !adminData) {
              // Not an admin - sign out and redirect with error
              console.warn('[AuthCallback] User is not an admin');
              await supabase.auth.signOut();
              navigate('/admin/login', {
                state: { error: 'unauthorized' },
                replace: true
              });
              return;
            }

            // Update last login (non-blocking)
            supabase
              .from('admin_users')
              .update({ last_login: new Date().toISOString() })
              .eq('id', session.user.id)
              .catch(() => {});

            setStatus('Success! Redirecting...');

            // Clean up URL and redirect to admin dashboard
            window.history.replaceState({}, '', '/#/admin');
            navigate('/admin', { replace: true });

          } catch (err) {
            console.error('[AuthCallback] Error:', err);
            setError(err instanceof Error ? err.message : 'Authentication failed');
          }
        }
      }
    );

    // Timeout fallback - if no auth event in 20 seconds, show error
    const timeout = setTimeout(() => {
      if (!hasProcessed.current) {
        console.error('[AuthCallback] Timeout waiting for auth');
        setError('Authentication timed out. The link may have expired or already been used.');
        setTimeout(() => {
          navigate('/admin/login', {
            state: { error: 'auth_failed' },
            replace: true
          });
        }, 3000);
      }
    }, 20000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-500/10 border border-red-500/30 grid place-items-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-space-grotesk font-bold text-white mb-2">
            Authentication Failed
          </h1>
          <p className="text-sm text-[#737373] font-mono mb-4">
            {error}
          </p>
          <p className="text-xs text-[#525252] font-mono">
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-pulse mb-4">
          <div className="w-12 h-12 bg-[#0A0A0A] border border-[#262626] grid place-items-center mx-auto">
            <span className="text-[#2563EB] font-bold text-lg font-space-grotesk">EB</span>
          </div>
        </div>
        <p className="text-sm text-[#737373] font-mono">
          {status}
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
