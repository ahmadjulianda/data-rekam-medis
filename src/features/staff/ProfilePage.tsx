import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Field'
import { PageHeader } from '../../components/ui/Feedback'
import { useAuth } from '../auth/AuthContext'
import { ROLE_LABELS } from '../../lib/constants'
import { useUpdateProfile } from './useProfiles'

const profileSchema = z.object({
  full_name: z.string().trim().min(3, 'Nama minimal 3 karakter'),
  specialization: z.string().trim().nullable().optional(),
  sip_number: z.string().trim().nullable().optional(),
})

type ProfileValues = z.infer<typeof profileSchema>

export function ProfilePage() {
  const { user, refresh } = useAuth()
  const updateProfile = useUpdateProfile()
  const [editing, setEditing] = useState(false)

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: '', specialization: '', sip_number: '' },
  })

  useEffect(() => {
    if (!user) return
    form.reset({
      full_name: user.fullName,
      specialization: user.specialization ?? '',
      sip_number: user.sipNumber ?? '',
    })
  }, [user, form])

  async function submit(values: ProfileValues) {
    if (!user) return
    try {
      await updateProfile.mutateAsync({
        id: user.id,
        patch: {
          full_name: values.full_name,
          specialization: values.specialization || null,
          sip_number: values.sip_number || null,
        },
      })
      await refresh()
      toast.success('Profil diperbarui')
      setEditing(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal memperbarui profil.')
    }
  }

  if (!user) return null

  return (
    <>
      <PageHeader
        title="Profil saya"
        description="Identitas dan detail praktik yang tampil pada catatan kunjungan."
        actions={
          !editing && (
            <Button onClick={() => setEditing(true)}>Ubah profil</Button>
          )
        }
      />

      <div className="max-w-[640px]">
        <div className="flex items-center gap-4 border-b border-rule pb-5">
          <Avatar name={user.fullName} />
          <div>
            <p className="text-section font-medium text-ink">{user.fullName}</p>
            <p className="text-body text-muted">{user.email}</p>
          </div>
        </div>

        {editing ? (
          <form onSubmit={form.handleSubmit(submit)} className="mt-5 flex flex-col gap-4" noValidate>
            <Field label="Nama lengkap" htmlFor="profile-name" required error={form.formState.errors.full_name?.message}>
              <Input id="profile-name" {...form.register('full_name')} />
            </Field>
            <Field label="Spesialisasi" htmlFor="profile-specialization">
              <Input id="profile-specialization" placeholder="Contoh: Penyakit Dalam" {...form.register('specialization')} />
            </Field>
            <Field label="Nomor SIP / SIPA" htmlFor="profile-sip">
              <Input id="profile-sip" placeholder="Contoh: SIP-2026-00001" {...form.register('sip_number')} />
            </Field>
            <div className="flex gap-2">
              <Button type="button" onClick={() => setEditing(false)}>Batal</Button>
              <Button type="submit" variant="primary" loading={updateProfile.isPending}>Simpan</Button>
            </div>
          </form>
        ) : (
          <dl className="mt-5">
            {[
              ['Email', user.email],
              ['Peran', ROLE_LABELS[user.role]],
              ['Spesialisasi', user.specialization || '—'],
              ['Nomor SIP / SIPA', user.sipNumber || '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-6 border-b border-rule py-3">
                <dt className="text-body text-muted">{label}</dt>
                <dd className="text-right text-body text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        )}

        <p className="mt-6 text-small text-muted">
          Peran hanya dapat diubah oleh admin klinik dari halaman Tenaga medis.
        </p>
      </div>
    </>
  )
}
