
import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => Promise<void>;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setLoading: (loading) => set({ loading }),
  
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },
  
  initialize: () => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        set({ session, user: session?.user ?? null, loading: false });
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, user: session?.user ?? null, loading: false });
    });

    return () => subscription.unsubscribe();
  }
}));
