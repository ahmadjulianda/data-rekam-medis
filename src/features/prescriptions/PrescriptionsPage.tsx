import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { PageHeader, EmptyState, ErrorState, LoadingState } from '../../components/ui/Feedback'
import { Input } from '../../components/ui/Field'
import { useDebounce } from '../../hooks/useDebounce'
import { useAuth } from '../auth/AuthContext'
import { can } from '../../lib/permissions'
import { atauDash, formatTanggalWaktu } from '../../lib/format'
import { useMedicalRecords } from '../medical-records/useMedicalRecords'
import { usePatients } from '../patients/usePatients'
import { usePrescriptions } from './usePrescriptions'
import { useAllergyDirectory, usePharmacistPrescriptions } from './usePharmacist'

interface Row {
  id: string
  recordId: string
  patientName: string
  mrn: string
  allergies: string | null
  medication: string
  dosage: string
  quantity: number
  visitDate: string
}

export function PrescriptionsPage() {
  const { user } = useAuth()
  const isPharmacist = user?.role === 'pharmacist'
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query)

  const pharmacistQuery = usePharmacistPrescriptions(isPharmacist)
  const allergyQuery = useAllergyDirectory(isPharmacist)
  const prescriptionsQuery = usePrescriptions(!isPharmacist)
  const recordsQuery = useMedicalRecords(!isPharmacist)
  const patientsQuery = usePatients(!isPharmacist)

  const rows = useMemo<Row[]>(() => {
    if (isPharmacist) {
      return (pharmacistQuery.data ?? []).map((item) => ({
        id: item.id,
        recordId: item.medical_record_id,
        patientName: item.patient_name,
        mrn: item.medical_record_number,
        allergies: item.allergies,
        medication: item.medication_name,
        dosage: item.dosage,
        quantity: item.quantity,
        visitDate: item.visit_date,
      }))
    }
    const records = recordsQuery.data ?? []
    const patients = patientsQuery.data ?? []
    return (prescriptionsQuery.data ?? []).flatMap((prescription) => {
      const record = records.find((item) => item.id === prescription.medical_record_id)
      const patient = patients.find((item) => item.id === record?.patient_id)
      if (!record) return []
      return [{
        id: prescription.id,
        recordId: prescription.medical_record_id,
        patientName: patient?.full_name ?? 'Pasien tidak ditemukan',
        mrn: patient?.medical_record_number ?? '—',
        allergies: patient?.allergies ?? null,
        medication: prescription.medication_name,
        dosage: prescription.dosage,
        quantity: prescription.quantity,
        visitDate: record.visit_date,
      }]
    })
  }, [isPharmacist, pharmacistQuery.data, prescriptionsQuery.data, recordsQuery.data, patientsQuery.data])

  const filtered = useMemo(() => {
    const needle = debouncedQuery.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((row) =>
      `${row.patientName} ${row.mrn} ${row.medication} ${row.allergies ?? ''}`
        .toLowerCase()
        .includes(needle),
    )
  }, [rows, debouncedQuery])

  const isLoading = isPharmacist
    ? pharmacistQuery.isLoading || allergyQuery.isLoading
    : prescriptionsQuery.isLoading || recordsQuery.isLoading || patientsQuery.isLoading
  const isError = isPharmacist
    ? pharmacistQuery.isError || allergyQuery.isError
    : prescriptionsQuery.isError || recordsQuery.isError || patientsQuery.isError

  const flagged = (isPharmacist ? allergyQuery.data ?? [] : (patientsQuery.data ?? []).map((p) => ({
    id: p.id, full_name: p.full_name, medical_record_number: p.medical_record_number, allergies: p.allergies,
  }))).filter((item) => item.allergies && item.allergies.trim() !== '' && item.allergies.toLowerCase() !== 'tidak ada')

  return (
    <>
      <PageHeader
        title="Resep"
        description={
          isPharmacist
            ? 'Daftar obat yang perlu disiapkan beserta informasi alergi pasien.'
            : 'Resep obat dari seluruh kunjungan yang tercatat.'
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-[320px]">
          <Search aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari pasien, No. RM, atau obat"
            aria-label="Cari resep"
            className="pl-9"
          />
        </div>
        <span className="text-small text-muted tabular-nums">{filtered.length} resep</span>
      </div>

      {isPharmacist && flagged.length > 0 && (
        <section className="mb-6 rounded-card border border-line bg-raised px-4 py-3">
          <h2 className="text-small font-medium text-ink">
            Perlu perhatian: {flagged.length} pasien memiliki alergi tercatat
          </h2>
          <p className="mt-1 text-small text-muted">
            {flagged.slice(0, 4).map((item) => item.full_name).join(' · ')}
            {flagged.length > 4 ? ` · +${flagged.length - 4} lainnya` : ''}
          </p>
        </section>
      )}

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState message="Data resep gagal dimuat." />
      ) : filtered.length === 0 ? (
        <EmptyState title="Belum ada resep" description="Tidak ada resep yang cocok dengan pencarian." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left">
            <thead>
              <tr className="h-10 text-small text-muted">
                <th scope="col" className="w-[24%] pr-4 font-normal">Pasien</th>
                <th scope="col" className="w-[23%] pr-4 font-normal">Obat</th>
                <th scope="col" className="w-[20%] pr-4 font-normal">Dosis</th>
                <th scope="col" className="w-[10%] pr-4 text-right font-normal">Jumlah</th>
                <th scope="col" className="w-[23%] pr-4 font-normal">Tanggal kunjungan</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="h-[64px] border-t border-rule align-middle">
                  <td className="pr-4">
                    {can('records.view', user?.role) ? (
                      <Link
                        to={`/rekam-medis/${row.recordId}`}
                        className="block truncate text-body font-medium text-ink hover:text-accent"
                      >
                        {row.patientName}
                      </Link>
                    ) : (
                      <span className="block truncate text-body font-medium text-ink">{row.patientName}</span>
                    )}
                    <span className="block truncate font-mono text-small text-muted">{row.mrn}</span>
                    <span className="block truncate text-small text-muted">
                      Alergi: {atauDash(row.allergies)}
                    </span>
                  </td>
                  <td className="pr-4 text-body font-medium text-ink">{row.medication}</td>
                  <td className="pr-4 text-body text-muted">{row.dosage}</td>
                  <td className="pr-4 text-right text-body text-ink tabular-nums">{row.quantity}</td>
                  <td className="pr-4 text-body text-muted tabular-nums">
                    {formatTanggalWaktu(row.visitDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
