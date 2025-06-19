
import React, { createContext, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useAuthStore } from '@/stores/authStore';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { user, session, loading, signOut, initialize } = useAuthStore();

  useEffect(() => {
    const cleanup = initialize();
    return cleanup;
  }, [initialize]);

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
