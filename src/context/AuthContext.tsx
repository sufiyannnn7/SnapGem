import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { authService } from '../services/authService';

export interface Profile {
  id: string;
  email?: string;
  full_name?: string | null;
  avatar_url?: string | null;
  role: 'admin' | 'customer';
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
  refreshProfile: (explicitUserId?: string) => Promise<Profile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    console.log('[AuthContext] fetchProfile starting for Current User ID:', userId);
    try {
      const data = await authService.getProfile(userId);
      const userProfile = data as Profile;
      console.log('Current User ID:', userId);
      console.log('Fetched Role:', userProfile?.role);
      console.log('isAdmin:', userProfile?.role === 'admin');
      setProfile(userProfile);
      return userProfile;
    } catch (error) {
      console.error('[AuthContext] Error fetching profile:', error);
      setProfile(null);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      console.log('[AuthContext] Initializing authentication state...');
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchProfile(session.user.id);
          } else {
            setProfile(null);
          }
        }
      } catch (error) {
        console.error('[AuthContext] Error getting session during init:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
          console.log('[AuthContext] Initialization complete. isLoading set to false.');
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('[AuthContext] onAuthStateChange event:', event, 'User ID:', newSession?.user?.id);
      if (mounted) {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          await fetchProfile(newSession.user.id);
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    console.log('[AuthContext] Logging out user...');
    await authService.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async (explicitUserId?: string): Promise<Profile | null> => {
    const targetId = explicitUserId || user?.id || session?.user?.id;
    console.log('[AuthContext] refreshProfile requested for User ID:', targetId);
    if (targetId) {
      setIsLoading(true);
      const updatedProfile = await fetchProfile(targetId);
      setIsLoading(false);
      return updatedProfile;
    }
    return null;
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isLoading,
        isAuthenticated: !!user,
        isAdmin,
        logout: handleLogout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
