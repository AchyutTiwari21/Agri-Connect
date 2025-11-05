'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile } from '@/lib/supabase';
import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react';

type AuthContextType = {
  user: { id: string; email?: string | null } | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    name: string,
    role: 'consumer' | 'farmer'
  ) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<{ id: string; email?: string | null } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const res = await fetch(`/api/profiles/${userId}`);
    if (res.ok) {
      const data = await res.json();
      setProfile(data);
    }
  };

  useEffect(() => {
    const sUser = session?.user as any;
    if (sUser?.id) {
      setUser({ id: sUser.id, email: sUser.email });
      fetchProfile(sUser.id);
    } else {
      setUser(null);
      setProfile(null);
    }
    setLoading(status === 'loading');
  }, [session, status]);

  const signUp = async (
    email: string,
    password: string,
    name: string,
    role: 'consumer' | 'farmer'
  ) => {
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });
    if (!res.ok) return { error: await res.json() };
    const { id } = await res.json();
    await nextAuthSignIn('credentials', { email, password, redirect: false });
    await fetchProfile(id);
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const res = await nextAuthSignIn('credentials', { email, password, redirect: false });
    return { error: res?.error ? { message: res.error } : null };
  };

  const signOut = async () => {
    await nextAuthSignOut({ redirect: false });
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
