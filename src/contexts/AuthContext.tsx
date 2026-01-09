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

  // Process pending referral after user confirms their email
  const processPendingReferral = async (userId: string) => {
    const pendingReferralCode = localStorage.getItem('pending_referral_code');
    if (!pendingReferralCode) return;

    try {
      // Find the referrer by their referral code
      const { data: referrer, error: referrerError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('referral_code', pendingReferralCode.toUpperCase())
        .single();

      if (referrerError || !referrer || referrer.user_id === userId) {
        // Invalid code, self-referral, or referrer not found - clean up
        localStorage.removeItem('pending_referral_code');
        return;
      }

      // Update the new user's profile with the referral code
      await supabase
        .from('profiles')
        .update({ referred_by_code: pendingReferralCode.toUpperCase() })
        .eq('user_id', userId);

      // Create referral record
      const { error: referralError } = await supabase
        .from('referrals')
        .insert({
          referrer_id: referrer.user_id,
          referred_id: userId,
          bonus_earned: 1.00
        });

      if (!referralError) {
        // Update referrer's stats
        await supabase.rpc('update_referrer_stats', { 
          referrer_user_id: referrer.user_id,
          bonus_amount: 1.00
        });
      }

      // Clean up
      localStorage.removeItem('pending_referral_code');
    } catch (error) {
      console.error('Error processing referral:', error);
      localStorage.removeItem('pending_referral_code');
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
            // Process any pending referral
            processPendingReferral(session.user.id);
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
          // Process any pending referral
          processPendingReferral(session.user.id);
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