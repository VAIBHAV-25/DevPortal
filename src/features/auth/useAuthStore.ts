import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  isDemo: boolean // true when running without real Supabase
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  setSession: (session: Session | null) => void
  clearError: () => void
  initializeDemoMode: () => void
}

// Demo user for when Supabase is not configured
const DEMO_USER: User = {
  id: 'demo-user-id',
  email: 'demo@devportal.io',
  app_metadata: {},
  user_metadata: { full_name: 'Demo User' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  role: 'authenticated',
  updated_at: new Date().toISOString(),
  identities: [],
  factors: [],
}

// Hardcoded guest account — bypasses Supabase entirely
export const DEMO_CREDENTIALS = { email: 'demo@devportal.io', password: 'demo123' } as const

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      loading: false,
      error: null,
      isDemo: !isSupabaseConfigured,

      initializeDemoMode: () => {
        if (!isSupabaseConfigured) {
          set({ user: DEMO_USER, session: null, isDemo: true, loading: false })
        }
      },

      signIn: async (email: string, password: string) => {
        // 1. Guest/demo account — no Supabase call needed
        if (
          email.toLowerCase().trim() === DEMO_CREDENTIALS.email &&
          password === DEMO_CREDENTIALS.password
        ) {
          set({
            user: { ...DEMO_USER, email: DEMO_CREDENTIALS.email },
            session: null,
            error: null,
            loading: false,
            isDemo: true,
          })
          return
        }
        // 2. No Supabase configured — accept any credentials in demo mode
        if (!isSupabaseConfigured || !supabase) {
          set({
            user: { ...DEMO_USER, email },
            session: null,
            error: null,
            loading: false,
            isDemo: true,
          })
          return
        }
        // 3. Real Supabase auth
        set({ loading: true, error: null })
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          set({ loading: false, error: error.message })
          throw error
        }
        set({ user: data.user, session: data.session, loading: false, error: null })
      },

      signUp: async (email: string, password: string) => {
        if (!isSupabaseConfigured || !supabase) {
          set({
            user: { ...DEMO_USER, email },
            session: null,
            error: null,
            loading: false,
            isDemo: true,
          })
          return
        }
        set({ loading: true, error: null })
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) {
          set({ loading: false, error: error.message })
          throw error
        }
        set({ user: data.user, session: data.session, loading: false, error: null })
      },

      signOut: async () => {
        if (supabase && isSupabaseConfigured) {
          await supabase.auth.signOut()
        }
        set({ user: null, session: null, isDemo: !isSupabaseConfigured })
      },

      setSession: (session: Session | null) => {
        set({ session, user: session?.user ?? null })
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'devportal-auth',
      partialize: (state) => ({ user: state.user, session: state.session, isDemo: state.isDemo }),
    }
  )
)
