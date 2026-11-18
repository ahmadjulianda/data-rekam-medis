import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Archive, ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { EmptyState, ErrorState, LoadingState, SectionTitle, StatusPill } from '../../components/ui/Feedback'
import { useAuth } from '../auth/AuthContext'
import { can, canEditRecord } from '../../lib/permissions'
import { atauDash, formatTanggalWaktu } from '../../lib/format'
import { usePatient } from '../patients/usePatients'
import { useProfiles } from '../staff/useProfiles'
import { usePrescriptions, useDeletePrescription } from '../prescriptions/usePrescriptions'
import { PrescriptionFormModal } from '../prescriptions/PrescriptionFormModal'
import { useArchiveMedicalRecord, useMedicalRecord } from './useMedicalRecords'
import { MedicalRecordFormModal } from './MedicalRecordFormModal'
import { usePatients } from '../patients/usePatients'

function SoapBlock({ label, title, value }: { label: string; title: string; value: string }) {
  return (
    <section className="rounded-card border border-line px-4 py-3">
      <p className="text-small text-muted">
        <span className="font-medium text-ink">{label}</span> · {title}
      </p>
      <p className="mt-2 whitespace-pre-wrap text-body text-ink">{atauDash(value)}</p>
    </section>
  )
}

export function MedicalRecordDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [editOpen, setEditOpen] = useState(false)
  const [prescriptionOpen, setPrescriptionOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [prescriptionToDelete, setPrescriptionToDelete] = useState<string | null>(null)

  const recordQuery = useMedicalRecord(id)
  const patientQuery = usePatient(recordQuery.data?.patient_id)
  const patientsQuery = usePatients()
  const profilesQuery = useProfiles()
  const prescriptionsQuery = usePrescriptions()
  const archiveRecord = useArchiveMedicalRecord()
  const deletePrescription = useDeletePrescription()

  const record = recordQuery.data
  const patient = patientQuery.data
  const prescriptions = (prescriptionsQuery.data ?? []).filter(
    (item) => item.medical_record_id === id,
  )

  if (recordQuery.isLoading) return <LoadingState />
  if (recordQuery.isError || !record) {
    return <ErrorState message="Rekam medis tidak ditemukan atau tidak dapat diakses." onRetry={() => navigate('/rekam-medis')} />
  }

  const editable = canEditRecord(user?.role, record)
  const doctorName = (profilesQuery.data ?? []).find((item) => item.id === record.doctor_id)?.full_name

  async function confirmArchive() {
    if (!record) return
    try {
      await archiveRecord.mutateAsync(record.id)
      toast.success('Rekam medis diarsipkan')
      setArchiveOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengarsipkan rekam medis.')
    }
  }

  async function removePrescription() {
    if (!prescriptionToDelete) return
    try {
      await deletePrescription.mutateAsync(prescriptionToDelete)
      toast.success('Resep dihapus')
      setPrescriptionToDelete(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus resep.')
    }
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <nav aria-label="Breadcrumb" className="mb-2 text-small text-muted">
            <Link to="/rekam-medis" className="hover:text-ink">Rekam medis</Link>
            <span className="mx-2">/</span>
            <span>Detail kunjungan</span>
          </nav>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-title font-semibold text-ink">{patient?.full_name ?? 'Pasien'}</h1>
            <StatusPill status={record.status} />
          </div>
          <p className="mt-1 text-body text-muted">
            <span className="font-mono text-small">{patient?.medical_record_number ?? '—'}</span>
            <span className="mx-2">·</span>
            {formatTanggalWaktu(record.visit_date)}
            <span className="mx-2">·</span>
            {doctorName ?? 'Dokter belum ditentukan'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Button>
          {editable && (
            <Button size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" /> Ubah
            </Button>
          )}
          {can('records.archive', user?.role) && record.status !== 'archived' && (
            <Button size="sm" onClick={() => setArchiveOpen(true)}>
              <Archive className="h-4 w-4" /> Arsipkan
            </Button>
          )}
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 md:grid md:grid-cols-2">
        <SoapBlock label="S" title="Keluhan utama & anamnesis" value={record.subjective} />
        <SoapBlock label="O" title="Pemeriksaan fisik & TTV" value={record.objective} />
        <SoapBlock label="A" title="Diagnosis klinis" value={record.assessment} />
        <SoapBlock label="P" title="Rencana terapi & tindak lanjut" value={record.plan} />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SectionTitle title={`Resep obat (${prescriptions.length})`} />
        <div className="flex items-center gap-2">
          {can('records.view', user?.role) && record.icd10_code && (
            <span className="text-small text-muted">
              ICD-10 <span className="font-mono text-ink">{record.icd10_code}</span>
            </span>
          )}
          {can('prescriptions.manage', user?.role) && record.status !== 'archived' && (
            <Button size="sm" variant="primary" onClick={() => setPrescriptionOpen(true)}>
              <Plus className="h-4 w-4" /> Tambah obat
            </Button>
          )}
        </div>
      </div>

      {prescriptions.length === 0 ? (
        <EmptyState title="Belum ada resep" description="Tambahkan obat bila diperlukan untuk kunjungan ini." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-left">
            <thead>
              <tr className="h-10 text-small text-muted">
                <th scope="col" className="w-[30%] pr-4 font-normal">Obat</th>
                <th scope="col" className="w-[28%] pr-4 font-normal">Dosis</th>
                <th scope="col" className="w-[14%] pr-4 text-right font-normal">Jumlah</th>
                <th scope="col" className="w-[20%] pr-4 font-normal">Catatan</th>
                <th scope="col" className="w-[8%] text-right font-normal">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.map((item) => (
                <tr key={item.id} className="h-12 border-t border-rule text-body">
                  <td className="pr-4 font-medium text-ink">{item.medication_name}</td>
                  <td className="pr-4 text-muted">{item.dosage}</td>
                  <td className="pr-4 text-right text-ink tabular-nums">{item.quantity}</td>
                  <td className="pr-4 text-small text-muted">{atauDash(item.notes)}</td>
                  <td className="text-right">
                    {can('prescriptions.manage', user?.role) && record.status === 'draft' && (
                      <button
                        type="button"
                        aria-label={`Hapus resep ${item.medication_name}`}
                        onClick={() => setPrescriptionToDelete(item.id)}
                        className="rounded-control p-1.5 text-muted hover:bg-raised hover:text-negative"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 text-small text-muted">
        Rekam medis berstatus selesai tidak dapat dihapus permanen. Gunakan tombol arsipkan bila ada
        kesalahan input fatal; tindakan tercatat sebagai perubahan status.
      </p>

      <MedicalRecordFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        patients={patientsQuery.data ?? []}
        record={record}
      />
      <PrescriptionFormModal
        open={prescriptionOpen}
        onClose={() => setPrescriptionOpen(false)}
        medicalRecordId={record.id}
      />
      <Modal
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        title="Arsipkan rekam medis"
        description="Tindakan ini mengubah status menjadi diarsipkan dan tidak dapat dibatalkan dari aplikasi."
        footer={
          <>
            <Button onClick={() => setArchiveOpen(false)}>Batal</Button>
            <Button variant="danger" loading={archiveRecord.isPending} onClick={confirmArchive}>
              Arsipkan
            </Button>
          </>
        }
      >
        <p className="text-body text-muted">
          Rekam medis tetap tersimpan untuk keperluan audit, tetapi tidak lagi tampil sebagai
          kunjungan aktif.
        </p>
      </Modal>
      <Modal
        open={Boolean(prescriptionToDelete)}
        onClose={() => setPrescriptionToDelete(null)}
        title="Hapus resep"
        description="Resep hanya dapat dihapus saat kunjungan masih berstatus draft."
        footer={
          <>
            <Button onClick={() => setPrescriptionToDelete(null)}>Batal</Button>
            <Button variant="danger" loading={deletePrescription.isPending} onClick={removePrescription}>
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-body text-muted">Resep yang dipilih akan dihapus permanen.</p>
      </Modal>
    </>
  )
}
