import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/supabase'
import type { UserRole } from '@/types/database.types'

export interface SignUpData {
  email: string
  password: string
  nombre: string
  apellidos: string
  role: Exclude<UserRole, 'admin'>
}

interface AuthState {
  user: User | null
  session: Session | null
  profile: Tables<'profiles'> | null
  loading: boolean
  initialized: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (data: SignUpData) => Promise<{ error: string | null; needsConfirmation: boolean }>
  signOut: () => Promise<void>
  initialize: () => () => void
}

// Guard de módulo: evita suscribir onAuthStateChange más de una vez
let _authSubscription: { unsubscribe: () => void } | null = null

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  session: null,
  profile: null,
  loading: false,
  initialized: false,

  signIn: async (email, password) => {
    set({ loading: true })
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    set({ loading: false })
    return { error: error?.message ?? null }
  },

  signUp: async ({ email, password, nombre, apellidos, role }) => {
    set({ loading: true })
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre, apellidos, role },
      },
    })
    set({ loading: false })
    if (error) return { error: error.message, needsConfirmation: false }
    // Si session es null pero no hay error, Supabase requiere confirmación de email
    const needsConfirmation = !data.session
    return { error: null, needsConfirmation }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut()
    } finally {
      set({ user: null, session: null, profile: null })
    }
  },

  initialize: () => {
    if (_authSubscription) return () => {}

    const loadProfile = async (session: import('@supabase/supabase-js').Session | null) => {
      set({ user: session?.user ?? null, session: session ?? null })
      if (session?.user) {
        const { data } = await (supabase
          .from('profiles')
          .select('*')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .eq('id' as any, session.user.id)
          .single() as any) as { data: import('@/lib/supabase').Tables<'profiles'> | null }
        set({ profile: data, initialized: true })
      } else {
        set({ profile: null, initialized: true })
      }
    }

    // Carga el estado inicial inmediatamente, sin depender de onAuthStateChange
    supabase.auth.getSession().then(({ data: { session } }) => loadProfile(session))

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => { loadProfile(session) },
    )

    _authSubscription = subscription
    return () => {
      _authSubscription = null
      subscription.unsubscribe()
    }
  },
}))
