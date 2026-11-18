import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FilePlus2 } from 'lucide-react'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Tabs } from '../../components/ui/Tabs'
import { EmptyState, ErrorState, LoadingState, StatusPill } from '../../components/ui/Feedback'
import { useAuth } from '../auth/AuthContext'
import { can } from '../../lib/permissions'
import { BLOOD_TYPE_LABELS, GENDER_LABELS } from '../../lib/constants'
import { formatTanggal, formatTanggalWaktu, hitungUmur, atauDash } from '../../lib/format'
import { usePatient } from './usePatients'
import { useMedicalRecords } from '../medical-records/useMedicalRecords'
import { usePrescriptions } from '../prescriptions/usePrescriptions'
import { useProfiles } from '../staff/useProfiles'
import { MedicalRecordFormModal } from '../medical-records/MedicalRecordFormModal'

type TabId = 'ringkasan' | 'kunjungan' | 'resep'

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-6 border-t border-rule py-2.5">
      <span className="text-body text-muted">{label}</span>
      <span className={`text-right text-body text-ink ${mono ? 'font-mono text-small' : ''}`}>
        {value}
      </span>
    </div>
  )
}

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tab, setTab] = useState<TabId>('ringkasan')
  const [formOpen, setFormOpen] = useState(false)

  const patientQuery = usePatient(id)
  const recordsQuery = useMedicalRecords()
  const prescriptionsQuery = usePrescriptions()
  const profilesQuery = useProfiles()

  const patient = patientQuery.data
  const records = useMemo(
    () => (recordsQuery.data ?? []).filter((item) => item.patient_id === id),
    [recordsQuery.data, id],
  )
  const recordIds = useMemo(() => new Set(records.map((item) => item.id)), [records])
  const prescriptions = useMemo(
    () => (prescriptionsQuery.data ?? []).filter((item) => recordIds.has(item.medical_record_id)),
    [prescriptionsQuery.data, recordIds],
  )

  if (patientQuery.isLoading) return <LoadingState />
  if (patientQuery.isError || !patient) {
    return <ErrorState message="Pasien tidak ditemukan atau tidak dapat diakses." onRetry={() => navigate('/pasien')} />
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'ringkasan', label: 'Ringkasan' },
    { id: 'kunjungan', label: `Rekam medis (${records.length})` },
    { id: 'resep', label: `Resep (${prescriptions.length})` },
  ]

  return (
    <>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="mb-2 text-small text-muted">
            <Link to="/pasien" className="hover:text-ink">Pasien</Link>
            <span className="mx-2">/</span>
            <span>{patient.medical_record_number}</span>
          </nav>
          <div className="flex items-center gap-3">
            <Avatar name={patient.full_name} />
            <h1 className="text-title font-semibold text-ink">{patient.full_name}</h1>
          </div>
          <p className="mt-2 font-mono text-small text-muted">
            {patient.medical_record_number} · NIK {patient.nik}
          </p>
        </div>
        {can('records.create', user?.role) && (
          <Button variant="primary" onClick={() => setFormOpen(true)}>
            <FilePlus2 className="h-4 w-4" /> Catat kunjungan
          </Button>
        )}
      </div>

      <Tabs items={tabs} active={tab} onChange={setTab} className="mb-6" />

      {tab === 'ringkasan' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section>
            <h2 className="mb-1 text-section font-medium text-ink">Data pasien</h2>
            <InfoRow label="Nama lengkap" value={patient.full_name} />
            <InfoRow label="NIK" value={patient.nik} mono />
            <InfoRow label="Nomor rekam medis" value={patient.medical_record_number} mono />
            <InfoRow label="Tanggal lahir" value={`${formatTanggal(patient.date_of_birth, 'dd MMMM yyyy')} (${hitungUmur(patient.date_of_birth)} tahun)`} />
            <InfoRow label="Jenis kelamin" value={GENDER_LABELS[patient.gender]} />
            <InfoRow label="Golongan darah" value={BLOOD_TYPE_LABELS[patient.blood_type]} />
            <InfoRow label="Nomor telepon" value={atauDash(patient.phone_number)} mono />
            <InfoRow label="Alamat" value={atauDash(patient.address)} />
            <InfoRow label="Terdaftar" value={formatTanggal(patient.created_at, 'dd MMM yyyy')} />
          </section>
          <section>
            <h2 className="mb-3 text-section font-medium text-ink">Informasi klinis</h2>
            <div className="rounded-card border border-line px-4 py-4">
              <p className="text-small text-muted">Alergi</p>
              <p className="mt-1 text-body font-medium text-ink">
                {atauDash(patient.allergies)}
              </p>
              {patient.allergies && (
                <p className="mt-2 text-small text-muted">
                  Informasi ini ditampilkan kepada apoteker sebelum obat disiapkan.
                </p>
              )}
            </div>
            <div className="mt-4 flex gap-6 border-t border-rule pt-4 text-body">
              <div>
                <p className="text-small text-muted">Total kunjungan</p>
                <p className="mt-1 text-ink tabular-nums">{records.length}</p>
              </div>
              <div>
                <p className="text-small text-muted">Resep tercatat</p>
                <p className="mt-1 text-ink tabular-nums">{prescriptions.length}</p>
              </div>
              <div>
                <p className="text-small text-muted">Kunjungan terakhir</p>
                <p className="mt-1 text-ink">
                  {records.length ? formatTanggal(records[0].visit_date, 'dd MMM yyyy') : '—'}
                </p>
              </div>
            </div>
          </section>
        </div>
      )}

      {tab === 'kunjungan' && (
        can('records.view', user?.role) ? (
          records.length === 0 ? (
            <EmptyState title="Belum ada kunjungan" description="Catat kunjungan pertama pasien ini." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-left">
                <thead>
                  <tr className="h-10 text-small text-muted">
                    <th scope="col" className="w-[25%] pr-4 font-normal">Waktu</th>
                    <th scope="col" className="w-[32%] pr-4 font-normal">Diagnosis</th>
                    <th scope="col" className="w-[18%] pr-4 font-normal">Status</th>
                    <th scope="col" className="w-[25%] pr-4 font-normal">Dokter</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} className="h-14 border-t border-rule text-body">
                      <td className="pr-4">
                        <Link to={`/rekam-medis/${record.id}`} className="text-ink hover:text-accent">
                          {formatTanggalWaktu(record.visit_date)}
                        </Link>
                      </td>
                      <td className="pr-4">
                        <span className="block truncate text-ink">{record.assessment || 'Belum diisi'}</span>
                        <span className="font-mono text-small text-muted">{record.icd10_code ?? '—'}</span>
                      </td>
                      <td className="pr-4"><StatusPill status={record.status} /></td>
                      <td className="pr-4 text-muted">
                        {profilesQuery.data?.find((item) => item.id === record.doctor_id)?.full_name ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <EmptyState title="Akses terbatas" description="Peran Anda tidak dapat melihat detail klinis." />
        )
      )}

      {tab === 'resep' && (
        prescriptions.length === 0 ? (
          <EmptyState title="Belum ada resep" description="Resep akan muncul setelah dokter menambahkan obat." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-left">
              <thead>
                <tr className="h-10 text-small text-muted">
                  <th scope="col" className="w-[30%] pr-4 font-normal">Obat</th>
                  <th scope="col" className="w-[27%] pr-4 font-normal">Dosis</th>
                  <th scope="col" className="w-[13%] pr-4 text-right font-normal">Jumlah</th>
                  <th scope="col" className="w-[30%] pr-4 font-normal">Tanggal resep</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map((item) => (
                  <tr key={item.id} className="h-12 border-t border-rule text-body">
                    <td className="pr-4 font-medium text-ink">{item.medication_name}</td>
                    <td className="pr-4 text-muted">{item.dosage}</td>
                    <td className="pr-4 text-right text-ink tabular-nums">{item.quantity}</td>
                    <td className="pr-4 text-muted">
                      {formatTanggalWaktu(records.find((r) => r.id === item.medical_record_id)?.visit_date ?? new Date().toISOString())}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      <MedicalRecordFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        patients={[patient]}
        patientId={patient.id}
      />
    </>
  )
}
