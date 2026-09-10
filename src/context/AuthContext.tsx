import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  preferred_language: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  profile_complete: boolean;
  role: string | null;
  referral_code: string | null;
  points_balance?: number | null;
  preferred_payment_method: string | null;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isGuest: boolean;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
  sendOtp: (email: string) => Promise<{ error: string | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: string | null; user: User | null }>;
  signInWithApple: () => Promise<{ error: string | null; cancelled?: boolean }>;
  /** Finishes a Google sign-in once LoginScreen's expo-auth-session flow has an id_token. */
  completeGoogleSignIn: (idToken: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Seeds a profile row for a brand-new user, or quietly touches only the
 * fields passed in for a returning one. Never resets `profile_complete`
 * on an existing row — a prior version of this (ported from the web app)
 * upserted `profile_complete: false` unconditionally, which meant every
 * returning login sent the user back through profile setup.
 */
async function ensureProfile(userId: string, email: string | null, seedName?: string | null) {
  const { data: existing } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle();

  if (existing) {
    if (email) await supabase.from('profiles').update({ email }).eq('id', userId);
    return;
  }

  await supabase.from('profiles').insert({
    id: userId,
    email,
    full_name: seedName ?? null,
    role: 'customer',
    preferred_language: 'English',
    profile_complete: false,
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const wasAuthenticated = useRef(false);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile((data as unknown as Profile) ?? null);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        wasAuthenticated.current = true;
        setIsGuest(false);
        fetchProfile(s.user.id);
      }
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        wasAuthenticated.current = true;
        setIsGuest(false);
        fetchProfile(s.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [fetchProfile]);

  const enterGuestMode = useCallback(() => setIsGuest(true), []);
  const exitGuestMode = useCallback(() => setIsGuest(false), []);

  const sendOtp = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    });
    return { error: error?.message ?? null };
  }, []);

  const verifyOtp = useCallback(async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token,
      type: 'email',
    });
    if (error) return { error: error.message, user: null };

    if (data.user) {
      await ensureProfile(data.user.id, email.trim().toLowerCase());
      await fetchProfile(data.user.id);
    }
    return { error: null, user: data.user };
  }, [fetchProfile]);

  const signInWithApple = useCallback(async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) {
        return { error: 'Apple did not return a sign-in token. Please try again.' };
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });
      if (error) return { error: error.message };

      if (data.user) {
        // Apple only shares the name on the very first authorization ever —
        // it's null on every sign-in after that.
        const seedName = credential.fullName
          ? [credential.fullName.givenName, credential.fullName.familyName].filter(Boolean).join(' ')
          : null;
        await ensureProfile(data.user.id, data.user.email ?? credential.email ?? null, seedName || undefined);
        await fetchProfile(data.user.id);
      }
      return { error: null };
    } catch (err: any) {
      if (err?.code === 'ERR_REQUEST_CANCELED') return { error: null, cancelled: true };
      return { error: err?.message ?? 'Apple sign-in failed. Please try again.' };
    }
  }, [fetchProfile]);

  const completeGoogleSignIn = useCallback(async (idToken: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });
      if (error) return { error: error.message };

      if (data.user) {
        // Supabase maps standard OIDC claims (name, email) from the Google
        // id_token into user_metadata automatically.
        const seedName = (data.user.user_metadata?.full_name ?? data.user.user_metadata?.name) as
          | string
          | undefined;
        await ensureProfile(data.user.id, data.user.email ?? null, seedName);
        await fetchProfile(data.user.id);
      }
      return { error: null };
    } catch (err) {
      return { error: (err as Error)?.message ?? 'Google sign-in failed. Please try again.' };
    }
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await fetchProfile(session.user.id);
  }, [session, fetchProfile]);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        isGuest,
        enterGuestMode,
        exitGuestMode,
        sendOtp,
        verifyOtp,
        signInWithApple,
        completeGoogleSignIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
