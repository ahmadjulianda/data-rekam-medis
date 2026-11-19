import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Mail } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Field'
import { Logo } from '../../components/layout/Logo'
import { useAuth } from './AuthContext'
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../../lib/validation'

export function ForgotPasswordPage() {
  const { isDemo, requestPasswordReset } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  async function submit(values: ForgotPasswordFormValues) {
    setSubmitting(true)
    try {
      await requestPasswordReset(values.email)
      setSentEmail(values.email)
      setSent(true)
      toast.success('Tautan reset kata sandi telah dikirim.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengirim tautan.')
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
          <h1 className="mt-8 text-title font-semibold text-ink lg:mt-0">Lupa kata sandi</h1>
          <p className="mt-1 text-body text-muted">
            Masukkan email akun Anda. Kami akan mengirim tautan untuk mengatur ulang kata sandi.
          </p>

          {isDemo ? (
            <div className="mt-8 rounded-card border border-line bg-raised px-4 py-3 text-small text-muted">
              Mode demo aktif. Reset kata sandi memerlukan Supabase. Isi VITE_SUPABASE_URL dan
              VITE_SUPABASE_ANON_KEY di .env.local untuk menggunakan fitur ini.
            </div>
          ) : sent ? (
            <div className="mt-8 flex flex-col gap-4">
              <div className="rounded-card border border-line bg-raised px-4 py-4 text-body text-ink">
                <p className="font-medium">Tautan terkirim</p>
                <p className="mt-1 text-small text-muted">
                  Kami telah mengirim tautan reset kata sandi ke <span className="font-medium text-ink">{sentEmail}</span>.
                  Periksa kotak masuk (dan folder spam) lalu ikuti instruksi di email.
                </p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-small font-medium text-accent hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke halaman masuk
              </Link>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(submit)} className="mt-8 flex flex-col gap-4" noValidate>
              <Field label="Email" htmlFor="email" error={form.formState.errors.email?.message} required>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nama@klinik.id"
                  {...form.register('email')}
                />
              </Field>
              <Button type="submit" variant="primary" loading={submitting} className="w-full">
                <Mail className="h-4 w-4" />
                Kirim tautan reset
              </Button>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-small font-medium text-muted hover:text-ink"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke halaman masuk
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}