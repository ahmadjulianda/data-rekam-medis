import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Pencil, Search, UserPlus } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Avatar } from '../../components/ui/Avatar'
import { PageHeader, EmptyState, ErrorState, LoadingState } from '../../components/ui/Feedback'
import { Input, Select } from '../../components/ui/Field'
import { useDebounce } from '../../hooks/useDebounce'
import { useAuth } from '../auth/AuthContext'
import { can } from '../../lib/permissions'
import { BLOOD_TYPES, BLOOD_TYPE_LABELS, GENDER_LABELS } from '../../lib/constants'
import { formatTanggal, hitungUmur, atauDash } from '../../lib/format'
import { PatientFormModal } from './PatientFormModal'
import { usePatients } from './usePatients'
import type { Patient } from '../../types'

export function PatientsPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [bloodType, setBloodType] = useState('ALL')
  const [editing, setEditing] = useState<Patient | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const debouncedQuery = useDebounce(query)

  const { data: patients = [], isLoading, isError, refetch } = usePatients()

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditing(null)
      setModalOpen(true)
      const next = new URLSearchParams(searchParams)
      next.delete('new')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const filtered = useMemo(() => {
    const needle = debouncedQuery.trim().toLowerCase()
    return patients.filter((patient) => {
      const matchText =
        !needle ||
        patient.full_name.toLowerCase().includes(needle) ||
        patient.nik.includes(needle) ||
        patient.medical_record_number.toLowerCase().includes(needle)
      const matchBlood = bloodType === 'ALL' || patient.blood_type === bloodType
      return matchText && matchBlood
    })
  }, [patients, debouncedQuery, bloodType])

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(patient: Patient) {
    setEditing(patient)
    setModalOpen(true)
  }

  return (
    <>
      <PageHeader
        title="Pasien"
        description={`${patients.length} pasien terdaftar di sistem ini.`}
        actions={
          can('patients.manage', user?.role) && (
            <Button variant="primary" onClick={openCreate}>
              <UserPlus className="h-4 w-4" />
              Tambah pasien
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
            placeholder="Cari nama, NIK, atau No. RM"
            aria-label="Cari pasien"
            className="pl-9"
          />
        </div>
        <div className="w-full max-w-[200px]">
          <Select
            value={bloodType}
            onChange={(event) => setBloodType(event.target.value)}
            aria-label="Filter golongan darah"
          >
            <option value="ALL">Semua golongan darah</option>
            {BLOOD_TYPES.map((type) => (
              <option key={type} value={type}>{BLOOD_TYPE_LABELS[type]}</option>
            ))}
          </Select>
        </div>
        <span className="text-small text-muted tabular-nums">{filtered.length} ditampilkan</span>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState message="Data pasien gagal dimuat." onRetry={() => void refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={patients.length === 0 ? 'Belum ada pasien' : 'Tidak ada hasil'}
          description={
            patients.length === 0
              ? 'Daftarkan pasien pertama untuk mulai mencatat kunjungan.'
              : 'Coba kata kunci atau filter lain.'
          }
          action={
            patients.length === 0 && can('patients.manage', user?.role) ? (
              <Button variant="primary" onClick={openCreate}>Tambah pasien</Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="h-10 text-small text-muted">
                <th scope="col" className="w-[28%] pr-4 font-normal">Pasien</th>
                <th scope="col" className="w-[16%] pr-4 text-right font-normal">No. rekam medis</th>
                <th scope="col" className="w-[19%] pr-4 text-right font-normal">NIK</th>
                <th scope="col" className="w-[16%] pr-4 font-normal">Umur / JK</th>
                <th scope="col" className="w-[11%] pr-4 font-normal">Gol. darah</th>
                <th scope="col" className="w-[10%] text-right font-normal">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((patient) => (
                <tr key={patient.id} className="h-[60px] border-t border-rule align-middle">
                  <td className="pr-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={patient.full_name} />
                      <div className="min-w-0">
                        <Link
                          to={`/pasien/${patient.id}`}
                          className="block truncate text-body font-medium text-ink hover:text-accent"
                        >
                          {patient.full_name}
                        </Link>
                        <span className="block truncate text-small text-muted">
                          Alergi: {atauDash(patient.allergies)}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="pr-4 text-right font-mono text-body text-ink">{patient.medical_record_number}</td>
                  <td className="pr-4 text-right font-mono text-body text-muted">{patient.nik}</td>
                  <td className="pr-4 text-body text-ink tabular-nums">
                    {hitungUmur(patient.date_of_birth)} tahun
                    <span className="ml-1 text-small text-muted">/ {GENDER_LABELS[patient.gender]}</span>
                  </td>
                  <td className="pr-4 text-body text-muted">
                    {BLOOD_TYPE_LABELS[patient.blood_type]}
                  </td>
                  <td className="text-right">
                    {can('patients.manage', user?.role) ? (
                      <button
                        type="button"
                        onClick={() => openEdit(patient)}
                        aria-label={`Ubah data ${patient.full_name}`}
                        className="inline-flex items-center gap-1.5 rounded-control px-2 py-1 text-small text-ink hover:bg-raised"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Ubah
                      </button>
                    ) : (
                      <Link
                        to={`/pasien/${patient.id}`}
                        className="text-small font-medium text-ink hover:text-accent"
                      >
                        Lihat
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="mt-6 flex flex-wrap gap-x-10 gap-y-4 border-t border-rule pt-4">
        <div>
          <p className="text-small text-muted">Total pasien</p>
          <p className="mt-0.5 text-section text-ink tabular-nums">{patients.length}</p>
        </div>
        <div>
          <p className="text-small text-muted">Laki-laki</p>
          <p className="mt-0.5 text-section text-ink tabular-nums">
            {patients.filter((item) => item.gender === 'L').length}
          </p>
        </div>
        <div>
          <p className="text-small text-muted">Perempuan</p>
          <p className="mt-0.5 text-section text-ink tabular-nums">
            {patients.filter((item) => item.gender === 'P').length}
          </p>
        </div>
        <div>
          <p className="text-small text-muted">Alergi tercatat</p>
          <p className="mt-0.5 text-section text-ink tabular-nums">
            {patients.filter((item) => item.allergies && item.allergies.trim() !== '').length}
          </p>
        </div>
        <div className="ml-auto self-end text-small text-muted">
          Terakhir diperbarui {formatTanggal(patients[0]?.updated_at ?? new Date().toISOString())}
        </div>
      </section>

      <PatientFormModal open={modalOpen} onClose={() => setModalOpen(false)} patient={editing} />
    </>
  )
}
