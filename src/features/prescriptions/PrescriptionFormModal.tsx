import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Field, Input, Textarea } from '../../components/ui/Field'
import { prescriptionSchema, type PrescriptionFormValues } from '../../lib/validation'
import { useCreatePrescription, useUpdatePrescription } from './usePrescriptions'
import type { Prescription } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  medicalRecordId: string
  prescription?: Prescription | null
}

export function PrescriptionFormModal({ open, onClose, medicalRecordId, prescription }: Props) {
  const createPrescription = useCreatePrescription()
  const updatePrescription = useUpdatePrescription()

  const form = useForm<PrescriptionFormValues>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      medical_record_id: medicalRecordId,
      medication_name: '',
      dosage: '',
      quantity: 1,
      notes: '',
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      prescription
        ? {
            medical_record_id: prescription.medical_record_id,
            medication_name: prescription.medication_name,
            dosage: prescription.dosage,
            quantity: prescription.quantity,
            notes: prescription.notes ?? '',
          }
        : {
            medical_record_id: medicalRecordId,
            medication_name: '',
            dosage: '',
            quantity: 1,
            notes: '',
          },
    )
  }, [open, prescription, medicalRecordId, form])

  async function submit(values: PrescriptionFormValues) {
    const payload = {
      medical_record_id: medicalRecordId,
      medication_name: values.medication_name,
      dosage: values.dosage,
      quantity: values.quantity,
      notes: values.notes || null,
    }
    try {
      if (prescription) {
        await updatePrescription.mutateAsync({ id: prescription.id, patch: payload })
        toast.success('Resep diperbarui')
      } else {
        await createPrescription.mutateAsync(payload)
        toast.success('Obat ditambahkan ke resep')
      }
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan resep.')
    }
  }

  const saving = createPrescription.isPending || updatePrescription.isPending

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={prescription ? 'Ubah resep' : 'Tambah obat'}
      description="Resep hanya dapat diubah oleh dokter dan saat kunjungan masih berstatus draft."
      footer={
        <>
          <Button type="button" onClick={onClose}>Batal</Button>
          <Button type="submit" variant="primary" loading={saving} form="prescription-form">Simpan</Button>
        </>
      }
    >
      <form id="prescription-form" onSubmit={form.handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
        <Field label="Nama obat" htmlFor="medication" required error={form.formState.errors.medication_name?.message}>
          <Input id="medication" placeholder="Contoh: Parasetamol 500 mg" {...form.register('medication_name')} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Dosis" htmlFor="dosage" required error={form.formState.errors.dosage?.message} hint="Contoh: 3x1 sesudah makan">
            <Input id="dosage" placeholder="3x1 sesudah makan" {...form.register('dosage')} />
          </Field>
          <Field label="Jumlah" htmlFor="quantity" required error={form.formState.errors.quantity?.message}>
            <Input id="quantity" type="number" min={1} {...form.register('quantity')} />
          </Field>
        </div>
        <Field label="Catatan" htmlFor="notes" error={form.formState.errors.notes?.message}>
          <Textarea id="notes" rows={2} placeholder="Opsional, misalnya pantau efek samping" {...form.register('notes')} />
        </Field>
      </form>
    </Modal>
  )
}
