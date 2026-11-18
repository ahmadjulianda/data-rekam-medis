import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FilePlus2, Search } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { PageHeader, EmptyState, ErrorState, LoadingState, StatusPill } from '../../components/ui/Feedback'
import { Input, Select } from '../../components/ui/Field'
import { useDebounce } from '../../hooks/useDebounce'
import { useAuth } from '../auth/AuthContext'
import { can } from '../../lib/permissions'
import { formatTanggalWaktu } from '../../lib/format'
import { RECORD_STATUSES, STATUS_LABELS } from '../../lib/constants'
import { usePatients } from '../patients/usePatients'
import { useProfiles } from '../staff/useProfiles'
import { useMedicalRecords } from './useMedicalRecords'
import { MedicalRecordFormModal } from './MedicalRecordFormModal'
import type { MedicalRecordView } from '../../types'

export function MedicalRecordsPage() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('ALL')
  const [formOpen, setFormOpen] = useState(false)
  const debouncedQuery = useDebounce(query)

  const recordsQuery = useMedicalRecords()
  const patientsQuery = usePatients()
  const profilesQuery = useProfiles()

  const isLoading = recordsQuery.isLoading || patientsQuery.isLoading || profilesQuery.isLoading
  const isError = recordsQuery.isError || patientsQuery.isError || profilesQuery.isError

  const views = useMemo<MedicalRecordView[]>(() => {
    return (recordsQuery.data ?? []).map((record) => ({
      ...record,
      patient: (patientsQuery.data ?? []).find((item) => item.id === record.patient_id) ?? null,
      doctor: (profilesQuery.data ?? []).find((item) => item.id === record.doctor_id) ?? null,
    }))
  }, [recordsQuery.data, patientsQuery.data, profilesQuery.data])

  const filtered = useMemo(() => {
    const needle = debouncedQuery.trim().toLowerCase()
    return views.filter((record) => {
      const text = `${record.patient?.full_name ?? ''} ${record.icd10_code ?? ''} ${record.assessment ?? ''}`.toLowerCase()
      return (!needle || text.includes(needle)) && (status === 'ALL' || record.status === status)
    })
  }, [views, debouncedQuery, status])

  return (
    <>
      <PageHeader
        title="Rekam medis"
        description="Catatan kunjungan dan pemeriksaan pasien berbasis SOAP."
        actions={
          can('records.create', user?.role) && (
            <Button variant="primary" onClick={() => setFormOpen(true)}>
              <FilePlus2 className="h-4 w-4" />
              Catat kunjungan
            </Button>
          )
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-[320px]">
          <Search aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari pasien atau diagnosis"
            aria-label="Cari rekam medis"
            className="pl-9"
          />
        </div>
        <div className="w-full max-w-[190px]">
          <Select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter status">
            <option value="ALL">Semua status</option>
            {RECORD_STATUSES.map((item) => (
              <option key={item} value={item}>{STATUS_LABELS[item]}</option>
            ))}
          </Select>
        </div>
        <span className="text-small text-muted tabular-nums">{filtered.length} kunjungan</span>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState message="Data rekam medis gagal dimuat." onRetry={() => void recordsQuery.refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Tidak ada rekam medis"
          description="Belum ada kunjungan yang cocok dengan filter ini."
          action={
            can('records.create', user?.role) ? (
              <Button variant="primary" onClick={() => setFormOpen(true)}>Catat kunjungan</Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead>
              <tr className="h-10 text-small text-muted">
                <th scope="col" className="w-[19%] pr-4 font-normal">Waktu kunjungan</th>
                <th scope="col" className="w-[25%] pr-4 font-normal">Pasien</th>
                <th scope="col" className="w-[24%] pr-4 font-normal">Diagnosis</th>
                <th scope="col" className="w-[13%] pr-4 font-normal">Status</th>
                <th scope="col" className="w-[13%] pr-4 font-normal">Dokter</th>
                <th scope="col" className="w-[6%] text-right font-normal">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => (
                <tr key={record.id} className="h-[64px] border-t border-rule align-middle">
                  <td className="pr-4 text-body text-ink tabular-nums">
                    {formatTanggalWaktu(record.visit_date)}
                  </td>
                  <td className="pr-4">
                    <Link
                      to={`/rekam-medis/${record.id}`}
                      className="text-body font-medium text-ink hover:text-accent"
                    >
                      {record.patient?.full_name ?? 'Pasien tidak ditemukan'}
                    </Link>
                    <span className="block font-mono text-small text-muted">
                      {record.patient?.medical_record_number ?? '—'}
                    </span>
                  </td>
                  <td className="pr-4">
                    <span className="block truncate text-body text-ink">{record.assessment || 'Belum diisi'}</span>
                    <span className="block font-mono text-small text-muted">{record.icd10_code ?? '—'}</span>
                  </td>
                  <td className="pr-4"><StatusPill status={record.status} /></td>
                  <td className="pr-4 text-body text-muted">{record.doctor?.full_name ?? '—'}</td>
                  <td className="text-right">
                    <Link
                      to={`/rekam-medis/${record.id}`}
                      className="text-small font-medium text-ink hover:text-accent"
                    >
                      Lihat
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <MedicalRecordFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        patients={patientsQuery.data ?? []}
      />
    </>
  )
}
