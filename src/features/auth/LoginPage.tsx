import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowRight, LockKeyhole } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Field'
import { Logo } from '../../components/layout/Logo'
import { useAuth } from './AuthContext'
import { DEMO_ACCOUNTS } from '../../lib/demo-data'
import { loginSchema, type LoginFormValues } from '../../lib/validation'
import type { UserRole } from '../../types'

export function LoginPage() {
  const { user, isLoading, isDemo, signIn, resendConfirmation } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [demoEmail, setDemoEmail] = useState(DEMO_ACCOUNTS[1].email)
  const [submitting, setSubmitting] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const [resendDone, setResendDone] = useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const from = (location.state as { from?: string } | null)?.from ?? '/'

  if (isLoading) return null
  if (user) return <Navigate to={from} replace />

  async function submit(values: LoginFormValues) {
    setSubmitting(true)
    setLoginError(null)
    setResendDone(false)
    try {
      if (isDemo) {
        const account = DEMO_ACCOUNTS.find((item) => item.email === values.email)
        await signIn(values.email, values.password, account?.role)
      } else {
        await signIn(values.email, values.password)
      }
      toast.success('Berhasil masuk')
      navigate(from, { replace: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal masuk.'
      setLoginError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResend() {
    const email = form.getValues('email')
    if (!email) {
      toast.error('Masukkan email terlebih dahulu.')
      return
    }
    setResending(true)
    try {
      await resendConfirmation(email)
      setResendDone(true)
      toast.success('Email konfirmasi telah dikirim ulang.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengirim ulang konfirmasi.')
    } finally {
      setResending(false)
    }
  }

  async function submitDemo(event: FormEvent) {
    event.preventDefault()
    const account = DEMO_ACCOUNTS.find((item) => item.email === demoEmail)
    if (!account) return
    setSubmitting(true)
    try {
      await signIn(account.email, 'demo1234', account.role as UserRole)
      toast.success(`Masuk sebagai ${account.label}`)
      navigate(from, { replace: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal masuk.')
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
          <h1 className="mt-8 text-title font-semibold text-ink lg:mt-0">Masuk ke Rekam Medis</h1>
          <p className="mt-1 text-body text-muted">
            Gunakan akun yang telah dibuat admin klinik.
          </p>

          {isDemo ? (
            <form onSubmit={submitDemo} className="mt-8 flex flex-col gap-4">
              <div className="rounded-card border border-line bg-raised px-4 py-3 text-small text-muted">
                Mode demo aktif. Pilih peran untuk mencoba hak akses yang berbeda. Data disimpan
                lokal di browser ini.
              </div>
              <Field label="Akun demo" htmlFor="demo-account">
                <select
                  id="demo-account"
                  value={demoEmail}
                  onChange={(event) => setDemoEmail(event.target.value)}
                  className="h-10 w-full rounded-control border border-control bg-surface px-3 text-body focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
                >
                  {DEMO_ACCOUNTS.map((account) => (
                    <option key={account.email} value={account.email}>
                      {account.label} — {account.email}
                    </option>
                  ))}
                </select>
              </Field>
              <Button type="submit" variant="primary" loading={submitting} className="w-full">
                Masuk sebagai {DEMO_ACCOUNTS.find((a) => a.email === demoEmail)?.label}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <form onSubmit={form.handleSubmit(submit)} className="mt-8 flex flex-col gap-4" noValidate>
              <Field
                label="Email"
                htmlFor="email"
                error={form.formState.errors.email?.message}
                required
              >
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nama@klinik.id"
                  {...form.register('email')}
                />
              </Field>
              <Field
                label="Kata sandi"
                htmlFor="password"
                error={form.formState.errors.password?.message}
                required
              >
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Minimal 6 karakter"
                  {...form.register('password')}
                />
              </Field>
              <Button type="submit" variant="primary" loading={submitting} className="w-full">
                <LockKeyhole className="h-4 w-4" />
                Masuk
              </Button>
            </form>
          )}

          {!isDemo && loginError && loginError.toLowerCase().includes('konfirmasi') && (
            <div className="mt-4 rounded-card border border-line bg-raised px-4 py-3 text-small text-muted">
              {resendDone ? (
                <p className="text-ink">Email konfirmasi telah dikirim ulang. Periksa kotak masuk (dan folder spam) Anda.</p>
              ) : (
                <>
                  <p>Belum menerima email konfirmasi?</p>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="mt-1 font-medium text-accent hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {resending ? 'Mengirim...' : 'Kirim ulang email konfirmasi'}
                  </button>
                </>
              )}
            </div>
          )}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-small">
            <Link to="/forgot-password" className="font-medium text-accent hover:underline">
              Lupa kata sandi?
            </Link>
            <Link to="/register" className="font-medium text-muted hover:text-ink hover:underline">
              Daftar akun baru
            </Link>
          </div>
          <p className="mt-4 text-small text-muted">
            Akses aplikasi dibatasi oleh Row Level Security. Jangan bagikan akun Anda.
          </p>
        </div>
      </div>
    </div>
  )
}
