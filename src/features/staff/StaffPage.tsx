import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Pencil } from 'lucide-react'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select } from '../../components/ui/Field'
import { Modal } from '../../components/ui/Modal'
import { ErrorState, LoadingState, PageHeader } from '../../components/ui/Feedback'
import { ROLE_LABELS, USER_ROLES } from '../../lib/constants'
import { formatTanggal } from '../../lib/format'
import { useProfiles, useUpdateProfile } from './useProfiles'
import type { Profile, UserRole } from '../../types'

const staffSchema = z.object({
  full_name: z.string().trim().min(3, 'Nama minimal 3 karakter'),
  role: z.enum(USER_ROLES),
  specialization: z.string().trim().nullable().optional(),
  sip_number: z.string().trim().nullable().optional(),
})

type StaffValues = z.infer<typeof staffSchema>

export function StaffPage() {
  const { data: profiles = [], isLoading, isError, refetch } = useProfiles()
  const updateProfile = useUpdateProfile()
  const [editing, setEditing] = useState<Profile | null>(null)
  const [open, setOpen] = useState(false)

  const form = useForm<StaffValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: { full_name: '', role: 'nurse', specialization: '', sip_number: '' },
  })

  useEffect(() => {
    if (!open || !editing) return
    form.reset({
      full_name: editing.full_name,
      role: editing.role,
      specialization: editing.specialization ?? '',
      sip_number: editing.sip_number ?? '',
    })
  }, [open, editing, form])

  function openEdit(profile: Profile) {
    setEditing(profile)
    setOpen(true)
  }

  async function submit(values: StaffValues) {
    if (!editing) return
    try {
      await updateProfile.mutateAsync({
        id: editing.id,
        patch: {
          full_name: values.full_name,
          role: values.role as UserRole,
          specialization: values.specialization || null,
          sip_number: values.sip_number || null,
        },
      })
      toast.success('Profil staf diperbarui')
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal memperbarui profil staf.')
    }
  }

  return (
    <>
      <PageHeader
        title="Tenaga medis"
        description={`${profiles.length} akun staf terdaftar. Peran menentukan hak akses data.`}
      />

      <div className="mb-5 rounded-card border border-line bg-raised px-4 py-3 text-small text-muted">
        Akun baru dibuat melalui <span className="font-medium text-ink">Supabase Authentication</span>{' '}
        (Undang user). Profil otomatis dibuat oleh trigger database; admin dapat mengubah peran dan
        detail praktik di sini.
      </div>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState message="Data staf gagal dimuat." onRetry={() => void refetch()} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="h-10 text-small text-muted">
                <th scope="col" className="w-[32%] pr-4 font-normal">Nama</th>
                <th scope="col" className="w-[18%] pr-4 font-normal">Peran</th>
                <th scope="col" className="w-[22%] pr-4 font-normal">Spesialisasi</th>
                <th scope="col" className="w-[20%] pr-4 font-normal">No. SIP</th>
                <th scope="col" className="w-[8%] text-right font-normal">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr key={profile.id} className="h-14 border-t border-rule text-body">
                  <td className="pr-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={profile.full_name} size="sm" />
                      <div className="min-w-0">
                        <span className="block truncate font-medium text-ink">{profile.full_name}</span>
                        <span className="block text-small text-muted">
                          Bergabung {formatTanggal(profile.created_at, 'MMM yyyy')}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="pr-4"><span className="rounded-full bg-active px-2.5 py-0.5 text-small text-ink">{ROLE_LABELS[profile.role]}</span></td>
                  <td className="pr-4 text-muted">{profile.specialization ?? '—'}</td>
                  <td className="pr-4 font-mono text-body text-muted">{profile.sip_number ?? '—'}</td>
                  <td className="text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(profile)}
                      aria-label={`Ubah profil ${profile.full_name}`}
                      className="rounded-control p-1.5 text-muted hover:bg-raised hover:text-ink"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="mt-8 border-t border-rule pt-5">
        <h2 className="mb-3 text-section font-medium text-ink">Hak akses per peran</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left">
            <thead>
              <tr className="h-10 text-small text-muted">
                <th scope="col" className="w-[18%] pr-4 font-normal">Peran</th>
                <th scope="col" className="w-[23%] pr-4 font-normal">Pasien</th>
                <th scope="col" className="w-[27%] pr-4 font-normal">Rekam medis</th>
                <th scope="col" className="w-[19%] pr-4 font-normal">Resep</th>
                <th scope="col" className="w-[13%] font-normal">Staf</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Admin klinik', 'Lihat & ubah', 'Lihat, arsipkan', 'Lihat', 'Kelola'],
                ['Dokter', 'Lihat & ubah', 'Buat, ubah, selesaikan', 'Buat & ubah', '—'],
                ['Perawat', 'Lihat & ubah', 'Isi TTV pada draft', 'Lihat', '—'],
                ['Apoteker', 'Alergi saja', '—', 'Lihat', '—'],
              ].map((row) => (
                <tr key={row[0]} className="h-12 border-t border-rule text-body">
                  <td className="pr-4 font-medium text-ink">{row[0]}</td>
                  <td className="pr-4 text-muted">{row[1]}</td>
                  <td className="pr-4 text-muted">{row[2]}</td>
                  <td className="pr-4 text-muted">{row[3]}</td>
                  <td className="text-muted">{row[4]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Ubah profil staf"
        description="Peran akan langsung mengubah hak akses pengguna."
        footer={
          <>
            <Button onClick={() => setOpen(false)}>Batal</Button>
            <Button variant="primary" loading={updateProfile.isPending} form="staff-form">Simpan</Button>
          </>
        }
      >
        <form id="staff-form" onSubmit={form.handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
          <Field label="Nama lengkap" htmlFor="staff-name" required error={form.formState.errors.full_name?.message}>
            <Input id="staff-name" {...form.register('full_name')} />
          </Field>
          <Field label="Peran" htmlFor="staff-role" required error={form.formState.errors.role?.message}>
            <Select id="staff-role" {...form.register('role')}>
              {USER_ROLES.map((role) => (
                <option key={role} value={role}>{ROLE_LABELS[role]}</option>
              ))}
            </Select>
          </Field>
          <Field label="Spesialisasi" htmlFor="staff-specialization">
            <Input id="staff-specialization" placeholder="Khusus dokter" {...form.register('specialization')} />
          </Field>
          <Field label="Nomor SIP / SIPA" htmlFor="staff-sip">
            <Input id="staff-sip" placeholder="Contoh: SIP-2026-00001" {...form.register('sip_number')} />
          </Field>
        </form>
      </Modal>
    </>
  )
}
