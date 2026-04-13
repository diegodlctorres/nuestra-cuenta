import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  householdId: string | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  householdId: null,
  isLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfileAndHousehold = async (userId: string) => {
    try {
      // 1. Obtener perfil
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      console.log(">> DEBUG profileData:", profileData, "profileErr:", profileErr);
        
      if (profileData) {
        setProfile(profileData as Profile);
      }

      // 2. Obtener la membresía activa del household
      const { data: memberData, error: memberErr } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('profile_id', userId)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();
      
      console.log(">> DEBUG memberData:", memberData, "memberErr:", memberErr);

      if (memberData) {
        setHouseholdId(memberData.household_id);
      } else {
        setHouseholdId(null);
      }
    } catch (error) {
      console.error('Error fetching profile or household:', error);
    }
  };

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfileAndHousehold(session.user.id).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsLoading(true);
        fetchProfileAndHousehold(session.user.id).finally(() => setIsLoading(false));
      } else {
        setProfile(null);
        setHouseholdId(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, householdId, isLoading, signOut, refreshProfile: async () => { if (user) await fetchProfileAndHousehold(user.id); } }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
