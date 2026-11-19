import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { LoaderCircle, LockKeyhole } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Field'
import { Logo } from '../../components/layout/Logo'
import { useAuth } from './AuthContext'
import { supabase, isDemoMode } from '../../lib/supabase'
import { resetPasswordSchema, type ResetPasswordFormValues } from '../../lib/validation'

export function ResetPasswordPage() {
  const { updatePassword, signOut } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [checking, setChecking] = useState(true)
  const [hasSession, setHasSession] = useState(false)

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  useEffect(() => {
    if (isDemoMode) {
      setChecking(false)
      return
    }
    let active = true
    let listenerUnsub: (() => void) | null = null
    let timer: number | null = null

    async function init() {
      const { data } = await supabase.auth.getSession()
      if (!active) return
      if (data.session) {
        setHasSession(true)
        setChecking(false)
        return
      }
      const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
        if (!active) return
        if (event === 'PASSWORD_RECOVERY' || (session && event === 'SIGNED_IN')) {
          setHasSession(true)
          setChecking(false)
        }
      })
      listenerUnsub = () => listener.subscription.unsubscribe()
      timer = window.setTimeout(() => {
        if (active) setChecking(false)
      }, 5000)
    }

    void init()

    return () => {
      active = false
      if (listenerUnsub) listenerUnsub()
      if (timer !== null) window.clearTimeout(timer)
    }
  }, [])

  async function submit(values: ResetPasswordFormValues) {
    setSubmitting(true)
    try {
      await updatePassword(values.password)
      toast.success('Kata sandi berhasil diubah. Silakan masuk kembali.')
      await signOut()
      navigate('/login', { replace: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengubah kata sandi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-frame">
      <div className="hidden w-[42%] flex-col justify-between bg-frame px-12 py-10 lg:flex">
        <Logo />
        <div>
          <p className="max-w-md text-[32px] font-semibold leading-tight tracking-[-0.02em] text-ink">
            Rekam medis yang rapi dan aman.
          </p>
          <p className="mt-4 max-w-md text-body leading-6 text-muted">
            Data pasien, kunjungan SOAP, diagnosis ICD-10, dan resep dalam satu sistem dengan hak
            akses per peran.
          </p>
        </div>
        <p className="text-small text-muted">Sistem Informasi Manajemen Rekam Medis</p>
      </div>

      <div className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden"><Logo /></div>
          <h1 className="mt-8 text-title font-semibold text-ink lg:mt-0">Atur ulang kata sandi</h1>
          <p className="mt-1 text-body text-muted">
            Masukkan kata sandi baru untuk akun Anda.
          </p>

          {isDemoMode ? (
            <div className="mt-8 rounded-card border border-line bg-raised px-4 py-3 text-small text-muted">
              Mode demo aktif. Reset kata sandi memerlukan Supabase.
            </div>
          ) : checking ? (
            <div className="mt-8 flex items-center gap-2 text-body text-muted">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Memverifikasi tautan…
            </div>
          ) : !hasSession ? (
            <div className="mt-8 flex flex-col gap-4">
              <div className="rounded-card border border-line bg-raised px-4 py-4 text-body text-ink">
                <p className="font-medium">Tautan tidak valid atau kedaluwarsa</p>
                <p className="mt-1 text-small text-muted">
                  Minta tautan reset baru dari halaman lupa kata sandi.
                </p>
              </div>
              <Link
                to="/forgot-password"
                className="inline-flex items-center gap-1.5 text-small font-medium text-accent hover:underline"
              >
                Minta tautan baru
              </Link>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(submit)} className="mt-8 flex flex-col gap-4" noValidate>
              <Field
                label="Kata sandi baru"
                htmlFor="password"
                error={form.formState.errors.password?.message}
                required
              >
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Minimal 6 karakter"
                  {...form.register('password')}
                />
              </Field>
              <Field
                label="Konfirmasi kata sandi"
                htmlFor="confirmPassword"
                error={form.formState.errors.confirmPassword?.message}
                required
              >
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Ulangi kata sandi"
                  {...form.register('confirmPassword')}
                />
              </Field>
              <Button type="submit" variant="primary" loading={submitting} className="w-full">
                <LockKeyhole className="h-4 w-4" />
                Simpan kata sandi baru
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}