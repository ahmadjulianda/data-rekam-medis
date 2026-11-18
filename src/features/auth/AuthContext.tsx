import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { isDemoMode, supabase } from '../../lib/supabase'
import { getProfileById, getProfiles } from '../../lib/repository'
import { demoEmailForRole } from '../../lib/demo-data'
import { USER_ROLES } from '../../lib/constants'
import type { AuthUser, Profile, UserRole } from '../../types'

const DEMO_SESSION_KEY = 'emr-demo:session'

interface DemoSession {
  email: string
  role: UserRole
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  isDemo: boolean
  signIn: (email: string, password: string, role?: UserRole) => Promise<void>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function toAuthUser(profile: Profile, email: string): AuthUser {
  return {
    id: profile.id,
    email,
    fullName: profile.full_name,
    role: profile.role,
    specialization: profile.specialization,
    sipNumber: profile.sip_number,
  }
}

function readDemoSession(): DemoSession | null {
  try {
    const raw = window.localStorage.getItem(DEMO_SESSION_KEY)
    return raw ? (JSON.parse(raw) as DemoSession) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const resolveUser = useCallback(
    async (email: string, role?: UserRole, userId?: string): Promise<AuthUser | null> => {
      // Di Supabase, identitas pengguna adalah auth.users.id — bukan nama/email.
      const profile = userId
        ? await getProfileById(userId)
        : (await getProfiles()).find((item) => item.role === role)
      if (!profile) return null
      return toAuthUser(profile, email)
    },
    [],
  )

  useEffect(() => {
    let active = true

    async function bootstrap() {
      if (isDemoMode) {
        let session = readDemoSession()
        // Pintasan pratinjau: /?demo=1 membuka dokter, /?demo=1&role=apoteker
        // membuka peran lain. Berguna untuk menguji RBAC tanpa Supabase.
        if (!session && new URLSearchParams(window.location.search).has('demo')) {
          const requested = new URLSearchParams(window.location.search).get('role')
          const role = USER_ROLES.find((item) => item === requested) ?? 'doctor'
          session = { email: demoEmailForRole(role), role }
          window.localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session))
        }
        if (session) {
          const resolved = await resolveUser(session.email, session.role)
          if (active) setUser(resolved)
        }
        if (active) setIsLoading(false)
        return
      }

      const { data } = await supabase.auth.getSession()
      const session: Session | null = data.session
      if (session?.user.id) {
        const resolved = await resolveUser(session.user.email ?? '', undefined, session.user.id)
        if (active) setUser(resolved)
      }
      if (active) setIsLoading(false)
    }

    void bootstrap()

    if (isDemoMode) return () => { active = false }

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        return
      }
      if (session?.user.id && event === 'SIGNED_IN') {
        void resolveUser(session.user.email ?? '', undefined, session.user.id).then((resolved) => setUser(resolved))
      }
    })
    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [resolveUser])

  const signIn = useCallback(
    async (email: string, password: string, role?: UserRole) => {
      if (isDemoMode) {
        const resolved = await resolveUser(email, role)
        if (!resolved) throw new Error('Akun demo tidak ditemukan.')
        window.localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify({ email, role: resolved.role }))
        setUser(resolved)
        return
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        if (error.message.toLowerCase().includes('invalid login')) {
          throw new Error('Email atau kata sandi salah.')
        }
        throw new Error(error.message)
      }
    },
    [resolveUser],
  )

  const signOut = useCallback(async () => {
    if (isDemoMode) {
      window.localStorage.removeItem(DEMO_SESSION_KEY)
      setUser(null)
      return
    }
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
    setUser(null)
  }, [])

  const refresh = useCallback(async () => {
    if (!user) return
    const resolved = await resolveUser(user.email, user.role, user.id)
    if (resolved) setUser(resolved)
  }, [user, resolveUser])

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, isDemo: isDemoMode, signIn, signOut, refresh }),
    [user, isLoading, signIn, signOut, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth harus dipakai di dalam AuthProvider.')
  return context
}
