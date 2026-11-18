import { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select, Textarea } from '../../components/ui/Field'
import { ICD10_COMMON } from '../../lib/constants'
import { medicalRecordSchema, type MedicalRecordFormValues } from '../../lib/validation'
import { useCreateMedicalRecord, useUpdateMedicalRecord } from './useMedicalRecords'
import { useAuth } from '../auth/AuthContext'
import { can } from '../../lib/permissions'
import { isoHariIni } from '../../lib/format'
import type { MedicalRecord, Patient } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  patients: Patient[]
  patientId?: string
  record?: MedicalRecord | null
}

export function MedicalRecordFormModal({ open, onClose, patients, patientId, record }: Props) {
  const { user } = useAuth()
  const createRecord = useCreateMedicalRecord()
  const updateRecord = useUpdateMedicalRecord()
  const isDoctor = can('records.editAll', user?.role)
  const isNurse = can('records.editDraftObjective', user?.role)

  const schema = useMemo(
    () =>
      medicalRecordSchema.superRefine((values, ctx) => {
        if (values.status === 'completed') {
          if (!values.assessment.trim()) {
            ctx.addIssue({ code: 'custom', path: ['assessment'], message: 'Diagnosis wajib diisi sebelum menyelesaikan.' })
          }
          if (!values.plan.trim()) {
            ctx.addIssue({ code: 'custom', path: ['plan'], message: 'Rencana terapi wajib diisi sebelum menyelesaikan.' })
          }
        }
      }),
    [],
  )

  const form = useForm<MedicalRecordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      patient_id: patientId ?? patients[0]?.id ?? '',
      visit_date: isoHariIni(),
      subjective: '',
      objective: '',
      assessment: '',
      icd10_code: null,
      plan: '',
      status: 'draft',
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      record
        ? {
            patient_id: record.patient_id,
            visit_date: record.visit_date.slice(0, 16),
            subjective: record.subjective,
            objective: record.objective,
            assessment: record.assessment,
            icd10_code: record.icd10_code,
            plan: record.plan,
            status: record.status,
          }
        : {
            patient_id: patientId ?? patients[0]?.id ?? '',
            visit_date: isoHariIni(),
            subjective: '',
            objective: '',
            assessment: '',
            icd10_code: null,
            plan: '',
            status: 'draft',
          },
    )
  }, [open, record, patientId, patients, form])

  async function submit(values: MedicalRecordFormValues) {
    const status = isNurse ? 'draft' : values.status
    const payload = {
      patient_id: values.patient_id,
      doctor_id: user?.id ?? null,
      visit_date: new Date(values.visit_date).toISOString(),
      subjective: values.subjective,
      objective: values.objective,
      assessment: isDoctor ? values.assessment : (record?.assessment ?? ''),
      icd10_code: isDoctor ? values.icd10_code || null : (record?.icd10_code ?? null),
      plan: isDoctor ? values.plan : (record?.plan ?? ''),
      status: isNurse ? 'draft' : values.status,
    }
    try {
      if (record) {
        await updateRecord.mutateAsync({ id: record.id, patch: payload })
        toast.success('Rekam medis diperbarui')
      } else {
        await createRecord.mutateAsync(payload)
        toast.success(status === 'completed' ? 'Kunjungan selesai dicatat' : 'Draft kunjungan disimpan')
      }
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan rekam medis.')
    }
  }

  const saving = createRecord.isPending || updateRecord.isPending

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={record ? 'Ubah rekam medis' : 'Catat kunjungan baru'}
      description={
        isNurse
          ? 'Perawat mengisi keluhan dan tanda-tanda vital. Diagnosis dan rencana diisi dokter.'
          : 'Lengkapi catatan SOAP kunjungan pasien.'
      }
      size="lg"
      footer={
        <>
          <Button type="button" onClick={onClose}>Batal</Button>
          <Button type="submit" variant="primary" loading={saving} form="record-form">
            Simpan
          </Button>
        </>
      }
    >
      <form id="record-form" onSubmit={form.handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Pasien" htmlFor="record-patient" required error={form.formState.errors.patient_id?.message}>
            <Select id="record-patient" disabled={Boolean(record)} {...form.register('patient_id')}>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.full_name} — {patient.medical_record_number}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Waktu kunjungan" htmlFor="visit-date" required error={form.formState.errors.visit_date?.message}>
            <Input id="visit-date" type="datetime-local" {...form.register('visit_date')} />
          </Field>
        </div>

        <Field label="S — Keluhan utama & anamnesis" htmlFor="subjective" required error={form.formState.errors.subjective?.message}>
          <Textarea id="subjective" rows={3} placeholder="Contoh: Demam dan nyeri tenggorokan sejak 2 hari lalu." {...form.register('subjective')} />
        </Field>

        <Field
          label="O — Pemeriksaan fisik & tanda-tanda vital"
          htmlFor="objective"
          required
          error={form.formState.errors.objective?.message}
          hint="Cantikan TD, nadi, suhu, BB/TB dan temuan pemeriksaan."
        >
          <Textarea
            id="objective"
            rows={4}
            placeholder="TD 120/80 mmHg, Nadi 82x/menit, Suhu 37,2°C, BB 58 kg, TB 162 cm. ..."
            {...form.register('objective')}
          />
        </Field>

        {isDoctor && (
          <>
            <Field label="A — Diagnosis klinis" htmlFor="assessment" error={form.formState.errors.assessment?.message}>
              <Textarea id="assessment" rows={2} placeholder="Contoh: Faringitis akut" {...form.register('assessment')} />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Kode ICD-10" htmlFor="icd10" hint="Opsional, gunakan kode standar.">
                <Input id="icd10" list="icd10-options" placeholder="J02.9" {...form.register('icd10_code')} />
                <datalist id="icd10-options">
                  {ICD10_COMMON.map((item) => (
                    <option key={item.code} value={item.code}>{item.label}</option>
                  ))}
                </datalist>
              </Field>
              <Field label="Status" htmlFor="record-status">
                <Select id="record-status" {...form.register('status')}>
                  <option value="draft">Draft</option>
                  <option value="completed">Selesai</option>
                </Select>
              </Field>
            </div>
            <Field label="P — Rencana terapi, edukasi & tindak lanjut" htmlFor="plan" error={form.formState.errors.plan?.message}>
              <Textarea id="plan" rows={3} placeholder="Obat, dosis, edukasi, dan jadwal kontrol." {...form.register('plan')} />
            </Field>
          </>
        )}

        {isNurse && (
          <div className="rounded-card bg-raised px-4 py-3 text-small text-muted">
            Kunjungan akan disimpan sebagai draft. Dokter akan melengkapi assessment, kode ICD-10,
            dan rencana terapi.
          </div>
        )}
      </form>
    </Modal>
  )
}
