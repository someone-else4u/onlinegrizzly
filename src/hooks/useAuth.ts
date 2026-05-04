import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type UserRole = 'admin' | 'student';

interface AuthState {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  profile: { name: string; email: string } | null;
  loading: boolean;
}

/**
 * Wipe every Supabase auth artifact from this browser (sessionStorage,
 * localStorage and cookies). Called on sign-in (to discard inherited state)
 * and on sign-out so the next user on the same machine starts clean.
 */
function clearAuthStorage() {
  if (typeof window === 'undefined') return;
  try {
    const wipe = (store: Storage) => {
      const toRemove: string[] = [];
      for (let i = 0; i < store.length; i++) {
        const key = store.key(i);
        if (!key) continue;
        if (
          key === 'grizzly-auth-session' ||
          key.startsWith('sb-') ||
          key.startsWith('supabase.auth.')
        ) {
          toRemove.push(key);
        }
      }
      toRemove.forEach((k) => store.removeItem(k));
    };
    wipe(window.sessionStorage);
    wipe(window.localStorage);
    // Remove any auth cookies that may have been set
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0]?.trim();
      if (name && (name.startsWith('sb-') || name.startsWith('supabase'))) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
    });
  } catch {
    /* best-effort cleanup */
  }
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    profile: null,
    loading: true,
  });

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
        }));

        // Defer fetching role and profile
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setAuthState(prev => ({
            ...prev,
            role: null,
            profile: null,
            loading: false,
          }));
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
      }));

      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleError) throw roleError;

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) throw profileError;

      setAuthState(prev => ({
        ...prev,
        role: roleData?.role as UserRole ?? 'student',
        profile: profileData ?? null,
        loading: false,
      }));
    } catch (error) {
      console.error('Error fetching user data:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };

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
    // Always start from a clean slate so we never inherit another user's session
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      /* ignore — we're about to sign in fresh */
    }
    clearAuthStorage();

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
    const { error } = await supabase.auth.signOut({ scope: 'local' });

    // Wipe every trace of the session from this device, regardless of API result
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
    isAuthenticated: !!authState.user,
    isAdmin: authState.role === 'admin',
    isStudent: authState.role === 'student',
  };
}
