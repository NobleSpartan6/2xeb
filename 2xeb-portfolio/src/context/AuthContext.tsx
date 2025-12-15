import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isLoading: boolean;
  signInWithMagicLink: (email: string) => Promise<{ error: AuthError | null }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is admin by looking up admin_users table
  // Using direct REST API to avoid Supabase client hanging issues
  const checkAdminStatus = useCallback(async (userId: string, accessToken?: string): Promise<boolean> => {
    try {
      console.log('[Auth] Checking admin status for:', userId);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Use the user's access token if available, otherwise fall back to anon key
      const authToken = accessToken || supabaseKey;

      const response = await fetch(
        `${supabaseUrl}/rest/v1/admin_users?id=eq.${userId}&select=id`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        console.error('[Auth] Admin check failed:', response.status, await response.text());
        return false;
      }

      const data = await response.json();
      const isAdmin = Array.isArray(data) && data.length > 0;
      console.log('[Auth] Admin status result:', isAdmin);
      return isAdmin;
    } catch (err) {
      console.error('[Auth] Error checking admin status:', err);
      return false;
    }
  }, []);

  // Update last_login timestamp for admin
  // Using direct REST API to avoid Supabase client hanging issues
  const updateLastLogin = useCallback(async (userId: string) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      await fetch(
        `${supabaseUrl}/rest/v1/admin_users?id=eq.${userId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({ last_login: new Date().toISOString() }),
        }
      );
    } catch {
      // Non-critical, don't throw
    }
  }, []);

  // Initialize auth state and listen for changes
  useEffect(() => {
    let isMounted = true;
    const storageKey = 'sb-zrawfgpjfkohjaqcfgrd-auth-token';

    const loadSession = async () => {
      const storedSession = localStorage.getItem(storageKey);
      console.log('[Auth] Loading session from localStorage:', !!storedSession);

      if (!storedSession) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const parsed = JSON.parse(storedSession);
        console.log('[Auth] Parsed session:', {
          hasAccessToken: !!parsed?.access_token,
          hasUser: !!parsed?.user,
          expiresAt: parsed?.expires_at,
        });

        // Check if session is expired
        if (parsed?.expires_at && parsed.expires_at * 1000 < Date.now()) {
          console.log('[Auth] Session expired, clearing');
          localStorage.removeItem(storageKey);
          if (isMounted) setIsLoading(false);
          return;
        }

        if (parsed?.access_token && parsed?.user) {
          setSession(parsed);
          setUser(parsed.user);

          const adminStatus = await checkAdminStatus(parsed.user.id, parsed.access_token);

          if (isMounted) {
            setIsAdmin(adminStatus);
            if (!adminStatus) {
              // Not admin - clear session
              localStorage.removeItem(storageKey);
              setUser(null);
              setSession(null);
            }
          }
        }
      } catch (err) {
        console.error('[Auth] Error parsing session:', err);
        localStorage.removeItem(storageKey);
      }

      if (isMounted) setIsLoading(false);
    };

    loadSession();

    // Listen for auth state changes from Supabase client
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('[Auth] Auth state changed:', event, !!newSession);

        if (!isMounted) return;

        if (event === 'SIGNED_IN' && newSession) {
          setSession(newSession);
          setUser(newSession.user);
          const adminStatus = await checkAdminStatus(newSession.user.id, newSession.access_token);
          setIsAdmin(adminStatus);
          setIsLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setIsAdmin(false);
          setIsLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && newSession) {
          console.log('[Auth] Token refreshed');
          setSession(newSession);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [checkAdminStatus]);

  // Sign in with magic link - CRITICAL: shouldCreateUser: false prevents new signups
  const signInWithMagicLink = useCallback(async (email: string) => {
    // Use non-hash URL for callback to avoid HashRouter conflicts
    // The callback page will redirect to /#/admin after success
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false, // SECURITY: Only existing users can sign in
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  }, []);

  // Sign in with email/password - for easier development
  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data.user) {
      // Check admin status
      const adminStatus = await checkAdminStatus(data.user.id, data.session?.access_token);
      if (!adminStatus) {
        // Not admin - sign out
        await supabase.auth.signOut();
        return { error: { message: 'Not authorized as admin' } as AuthError };
      }
      // Update last login
      updateLastLogin(data.user.id);
    }

    return { error };
  }, [checkAdminStatus, updateLastLogin]);

  // Sign out - clears localStorage directly
  const signOut = useCallback(async () => {
    const storageKey = 'sb-zrawfgpjfkohjaqcfgrd-auth-token';
    localStorage.removeItem(storageKey);
    setUser(null);
    setSession(null);
    setIsAdmin(false);
  }, []);

  // Debug: Log session state changes
  useEffect(() => {
    console.log('[AuthContext] State updated:', {
      hasUser: !!user,
      hasSession: !!session,
      hasAccessToken: !!session?.access_token,
      tokenPrefix: session?.access_token ? session.access_token.substring(0, 20) + '...' : 'none',
      isAdmin,
      isLoading,
    });
  }, [user, session, isAdmin, isLoading]);

  const value = useMemo(
    () => ({
      user,
      session,
      isAdmin,
      isLoading,
      signInWithMagicLink,
      signInWithPassword,
      signOut,
    }),
    [user, session, isAdmin, isLoading, signInWithMagicLink, signInWithPassword, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
