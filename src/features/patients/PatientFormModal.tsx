import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select, Textarea } from '../../components/ui/Field'
import { BLOOD_TYPES, BLOOD_TYPE_LABELS, GENDERS, GENDER_LABELS } from '../../lib/constants'
import { patientSchema, type PatientFormValues } from '../../lib/validation'
import { useCreatePatient, useUpdatePatient } from './usePatients'
import type { Patient } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  patient?: Patient | null
}

export function PatientFormModal({ open, onClose, patient }: Props) {
  const createPatient = useCreatePatient()
  const updatePatient = useUpdatePatient()

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      nik: '',
      full_name: '',
      date_of_birth: '',
      gender: 'P',
      blood_type: 'UNKNOWN',
      allergies: '',
      phone_number: '',
      address: '',
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      patient
        ? {
            nik: patient.nik,
            full_name: patient.full_name,
            date_of_birth: patient.date_of_birth,
            gender: patient.gender,
            blood_type: patient.blood_type,
            allergies: patient.allergies ?? '',
            phone_number: patient.phone_number ?? '',
            address: patient.address ?? '',
          }
        : {
            nik: '',
            full_name: '',
            date_of_birth: '',
            gender: 'P',
            blood_type: 'UNKNOWN',
            allergies: '',
            phone_number: '',
            address: '',
          },
    )
  }, [open, patient, form])

  async function submit(values: PatientFormValues) {
    const payload = {
      nik: values.nik,
      full_name: values.full_name,
      date_of_birth: values.date_of_birth,
      gender: values.gender,
      blood_type: values.blood_type,
      allergies: values.allergies || null,
      phone_number: values.phone_number || null,
      address: values.address || null,
    }
    try {
      if (patient) {
        await updatePatient.mutateAsync({ id: patient.id, patch: payload })
        toast.success('Data pasien diperbarui')
      } else {
        await createPatient.mutateAsync(payload)
        toast.success('Pasien didaftarkan', { description: 'Nomor rekam medis dibuat otomatis.' })
      }
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan data pasien.')
    }
  }

  const saving = createPatient.isPending || updatePatient.isPending

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={patient ? 'Ubah data pasien' : 'Daftarkan pasien'}
      description={
        patient
          ? `Nomor rekam medis ${patient.medical_record_number} tidak dapat diubah.`
          : 'Nomor rekam medis akan dibuat otomatis setelah disimpan.'
      }
      size="lg"
      footer={
        <>
          <Button type="button" onClick={onClose}>Batal</Button>
          <Button type="submit" variant="primary" loading={saving} form="patient-form">
            Simpan
          </Button>
        </>
      }
    >
      <form id="patient-form" onSubmit={form.handleSubmit(submit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
        <Field label="NIK" htmlFor="nik" required error={form.formState.errors.nik?.message} hint="16 digit angka">
          <Input id="nik" inputMode="numeric" maxLength={16} placeholder="3201015501230001" {...form.register('nik')} />
        </Field>
        <Field label="Nama lengkap" htmlFor="full_name" required error={form.formState.errors.full_name?.message}>
          <Input id="full_name" placeholder="Nama pasien" {...form.register('full_name')} />
        </Field>
        <Field label="Tanggal lahir" htmlFor="date_of_birth" required error={form.formState.errors.date_of_birth?.message}>
          <Input id="date_of_birth" type="date" {...form.register('date_of_birth')} />
        </Field>
        <Field label="Jenis kelamin" htmlFor="gender" required error={form.formState.errors.gender?.message}>
          <Select id="gender" {...form.register('gender')}>
            {GENDERS.map((gender) => (
              <option key={gender} value={gender}>{GENDER_LABELS[gender]}</option>
            ))}
          </Select>
        </Field>
        <Field label="Golongan darah" htmlFor="blood_type" error={form.formState.errors.blood_type?.message}>
          <Select id="blood_type" {...form.register('blood_type')}>
            {BLOOD_TYPES.map((type) => (
              <option key={type} value={type}>{BLOOD_TYPE_LABELS[type]}</option>
            ))}
          </Select>
        </Field>
        <Field label="Nomor telepon" htmlFor="phone_number" error={form.formState.errors.phone_number?.message}>
          <Input id="phone_number" placeholder="08xxxxxxxxxx" {...form.register('phone_number')} />
        </Field>
        <Field
          label="Alergi"
          htmlFor="allergies"
          className="sm:col-span-2"
          error={form.formState.errors.allergies?.message}
          hint="Tulis 'tidak ada' bila tidak ada alergi. Kolom ini dibaca oleh apoteker."
        >
          <Input id="allergies" placeholder="Contoh: Penisilin, lateks" {...form.register('allergies')} />
        </Field>
        <Field label="Alamat" htmlFor="address" className="sm:col-span-2" error={form.formState.errors.address?.message}>
          <Textarea id="address" rows={2} placeholder="Alamat lengkap" {...form.register('address')} />
        </Field>
      </form>
    </Modal>
  )
}
