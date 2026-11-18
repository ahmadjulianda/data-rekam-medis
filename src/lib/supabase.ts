import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

/**
 * MODE DEMO aktif jika kedua environment variable belum diisi.
 * Mode ini memakai data lokal di browser agar tampilan dapat dievaluasi
 * sebelum Supabase dikonfigurasi. Setelah .env.local diisi, aplikasi
 * otomatis beralih ke Supabase dan RLS penuh berlaku.
 */
export const isDemoMode = url.length === 0 || anonKey.length === 0

export const supabase = createClient<Database>(
  url || 'https://demo.invalid.supabase.co',
  anonKey || 'demo-anon-key',
  {
    auth: {
      persistSession: !isDemoMode,
      autoRefreshToken: !isDemoMode,
      detectSessionInUrl: !isDemoMode,
    },
  },
)
