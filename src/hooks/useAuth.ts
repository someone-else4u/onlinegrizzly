import { useState, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  clearAuthStorage,
  fetchProfileFor,
  fetchRoleFor,
  hardSignOut,
  verifySession,
} from '@/lib/authSession';

export type UserRole = 'admin' | 'student';

interface AuthState {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  profile: { name: string; email: string } | null;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    profile: null,
    loading: true,
  });

  // Track which user id we are currently resolving so a stale async
  // role/profile fetch can never overwrite state for a different user.
  const activeUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const applySession = async (session: Session | null) => {
      // Always verify against the auth API rather than trusting whatever
      // the listener handed us; this prevents stale tokens from being treated
      // as authenticated.
      const verified = session?.user?.id ? await verifySession() : null;

      if (cancelled) return;

      if (!verified) {
        activeUserIdRef.current = null;
        setAuthState({
          user: null,
          session: null,
          role: null,
          profile: null,
          loading: false,
        });
        return;
      }

      activeUserIdRef.current = verified.user.id;

      // While role/profile load, mark loading=true so guards wait.
      setAuthState({
        user: verified.user,
        session: verified,
        role: null,
        profile: null,
        loading: true,
      });

      const [role, profile] = await Promise.all([
        fetchRoleFor(verified.user.id),
        fetchProfileFor(verified.user.id),
      ]);

      // Drop the result if the active user changed in the meantime.
      if (cancelled || activeUserIdRef.current !== verified.user.id) return;

      setAuthState({
        user: verified.user,
        session: verified,
        role: role ?? 'student',
        profile: profile ?? null,
        loading: false,
      });
    };

    // Set up listener FIRST so we never miss an event.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // Defer the supabase call out of the listener callback to avoid
        // the documented deadlock when calling supabase APIs synchronously.
        setTimeout(() => {
          applySession(session);
        }, 0);
      }
    );

    // THEN trigger an initial verification.
    applySession(null /* will be replaced by verifySession() inside */);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { name },
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('This email is already registered. Please sign in instead.');
      } else {
        toast.error(error.message);
      }
      return { error };
    }

    toast.success('Account created successfully!');
    return { data, error: null };
  };

  const signIn = async (email: string, password: string) => {
    // Always start from a clean slate so we never inherit another user's session.
    await hardSignOut();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      return { error };
    }

    toast.success('Welcome back!');
    return { data, error: null };
  };

  const signOut = async () => {
    activeUserIdRef.current = null;
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    clearAuthStorage();

    setAuthState({
      user: null,
      session: null,
      role: null,
      profile: null,
      loading: false,
    });

    if (error) {
      toast.error(error.message);
      return { error };
    }
    toast.success('Signed out successfully');
    return { error: null };
  };

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!authState.user && !!authState.session,
    isAdmin: authState.role === 'admin',
    isStudent: authState.role === 'student',
  };
}
