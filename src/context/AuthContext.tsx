import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
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
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

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
      // Seed a minimal profile row so CompleteProfileScreen only needs an UPDATE.
      await supabase.from('profiles').upsert(
        {
          id: data.user.id,
          email: email.trim().toLowerCase(),
          role: 'customer',
          preferred_language: 'English',
          profile_complete: false,
        },
        { onConflict: 'id' }
      );
      await fetchProfile(data.user.id);
    }
    return { error: null, user: data.user };
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
