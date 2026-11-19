import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { ArrowLeft, UserPlus } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select } from '../../components/ui/Field'
import { Logo } from '../../components/layout/Logo'
import { useAuth } from './AuthContext'
import { ROLE_LABELS } from '../../lib/constants'
import { registerSchema, type RegisterFormValues } from '../../lib/validation'

export function RegisterPage() {
  const { isDemo, signUp } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [doneEmail, setDoneEmail] = useState('')

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: '', email: '', password: '', confirmPassword: '', role: 'nurse' },
  })

  async function submit(values: RegisterFormValues) {
    setSubmitting(true)
    try {
      await signUp(values.email, values.password, values.full_name, values.role)
      setDoneEmail(values.email)
      setDone(true)
      toast.success('Akun berhasil dibuat.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mendaftar.')
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
          <h1 className="mt-8 text-title font-semibold text-ink lg:mt-0">Daftar akun petugas</h1>
          <p className="mt-1 text-body text-muted">
            Buat akun baru untuk staf klinik. Peran admin hanya dapat diberikan oleh admin klinik.
          </p>

          {isDemo ? (
            <div className="mt-8 rounded-card border border-line bg-raised px-4 py-3 text-small text-muted">
              Mode demo aktif. Pendaftaran akun memerlukan Supabase. Isi VITE_SUPABASE_URL dan
              VITE_SUPABASE_ANON_KEY di .env.local untuk menggunakan fitur ini.
            </div>
          ) : done ? (
            <div className="mt-8 flex flex-col gap-4">
              <div className="rounded-card border border-line bg-raised px-4 py-4 text-body text-ink">
                <p className="font-medium">Pendaftaran berhasil</p>
                <p className="mt-1 text-small text-muted">
                  Akun untuk <span className="font-medium text-ink">{doneEmail}</span> telah dibuat.
                  Periksa email untuk konfirmasi (bila diwajibkan) lalu masuk. Admin klinik dapat
                  menyesuaikan peran Anda bila diperlukan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/login', { replace: true })}
                className="inline-flex items-center gap-1.5 text-small font-medium text-accent hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke halaman masuk
              </button>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(submit)} className="mt-8 flex flex-col gap-4" noValidate>
              <Field label="Nama lengkap" htmlFor="full_name" error={form.formState.errors.full_name?.message} required>
                <Input
                  id="full_name"
                  type="text"
                  autoComplete="name"
                  placeholder="dr. Nama Lengkap"
                  {...form.register('full_name')}
                />
              </Field>
              <Field label="Email" htmlFor="email" error={form.formState.errors.email?.message} required>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nama@klinik.id"
                  {...form.register('email')}
                />
              </Field>
              <Field label="Peran" htmlFor="role" error={form.formState.errors.role?.message} required>
                <Select id="role" {...form.register('role')}>
                  <option value="nurse">{ROLE_LABELS.nurse}</option>
                  <option value="doctor">{ROLE_LABELS.doctor}</option>
                  <option value="pharmacist">{ROLE_LABELS.pharmacist}</option>
                </Select>
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
                <UserPlus className="h-4 w-4" />
                Daftar
              </Button>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-small font-medium text-muted hover:text-ink"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Sudah punya akun? Masuk
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}