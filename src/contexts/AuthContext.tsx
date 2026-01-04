import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: any;
  isAdmin: boolean | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  refreshProfile: (userOverride?: User | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // Safe fallback during hot reloads or non-wrapped renders
    return {
      user: null,
      session: null,
      profile: null,
      isAdmin: null,
      loading: true,
      signUp: async () => ({ error: new Error('Auth not initialized') }),
      signIn: async () => ({ error: new Error('Auth not initialized') }),
      signOut: async () => ({ error: new Error('Auth not initialized') }),
      refreshProfile: async (_userOverride?: User | null) => {},
    } as const as AuthContextType;
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async (userOverride?: User | null) => {
    const targetUser = userOverride ?? user;

    if (!targetUser) {
      setProfile(null);
      setIsAdmin(null);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', targetUser.id)
      .maybeSingle();

    if (!error && data) {
      setProfile(data);
    } else if (!data && !error) {
      // Profile doesn't exist, create it
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({
          user_id: targetUser.id,
          username: targetUser.email?.split('@')[0] || 'user',
          email: targetUser.email,
        })
        .select()
        .single();

      if (newProfile) {
        setProfile(newProfile);
      }
    }

    // Fetch admin role using RPC to secure against client-side tampering
    const { data: adminFlag, error: roleError } = await supabase.rpc('is_admin', { user_uuid: targetUser.id });
    if (!roleError) {
      setIsAdmin(Boolean(adminFlag));
    } else {
      setIsAdmin(null);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Pass the user explicitly to avoid stale-closure issues
          setTimeout(() => {
            refreshProfile(session.user);
          }, 0);
        } else {
          setProfile(null);
          setIsAdmin(null);
        }

        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setTimeout(() => {
          refreshProfile(session.user);
        }, 0);
      } else {
        setProfile(null);
        setIsAdmin(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username: username
        }
      }
    });
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const value = {
    user,
    session,
    profile,
    isAdmin,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};