import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, UserPlus } from 'lucide-react'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { ErrorState, LoadingState, SectionTitle, StatusPill } from '../../components/ui/Feedback'
import { useAuth } from '../auth/AuthContext'
import { can } from '../../lib/permissions'
import { formatTanggal, formatWaktu, formatRelatif, hitungUmur, atauDash } from '../../lib/format'
import { usePatients } from '../patients/usePatients'
import { useMedicalRecords } from '../medical-records/useMedicalRecords'
import { usePrescriptions } from '../prescriptions/usePrescriptions'
import { useAllergyDirectory, usePharmacistPrescriptions } from '../prescriptions/usePharmacist'
import type { MedicalRecord, Patient } from '../../types'

type Range = 7 | 30

function isToday(value: string): boolean {
  const date = new Date(value)
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

function buildDailySeries(records: { visit_date: string }[], days: number) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (days - 1 - index))
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    const value = records.filter((record) => {
      const visit = new Date(record.visit_date)
      return `${visit.getFullYear()}-${visit.getMonth()}-${visit.getDate()}` === key
    }).length
    return {
      label: formatTanggal(date, days === 7 ? 'EEE' : 'd MMM'),
      value,
    }
  })
}

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const maxValue = Math.max(...data.map((item) => item.value), 0)
  // Kelipatan 4 membuat semua label grid berupa bilangan bulat (count).
  const top = Math.max(Math.ceil(maxValue / 4) * 4, 4)
  const gridValues = [top, (top * 3) / 4, top / 2, top / 4, 0]
  const labelEvery = data.length > 10 ? 5 : 1

  return (
    <div
      role="img"
      aria-label={`Grafik kunjungan per hari, ${data.map((d) => `${d.label} ${d.value}`).join(', ')}`}
    >
      <div className="relative h-[180px]">
        {gridValues.map((value) => (
          <div
            key={value}
            className="absolute inset-x-0 flex items-center"
            style={{ bottom: `${(value / top) * 100}%` }}
          >
            <span className="w-8 shrink-0 pr-2 text-right text-small leading-none text-muted tabular-nums">
              {value}
            </span>
            <span className="h-px flex-1 bg-rule" />
          </div>
        ))}
        <div className="absolute inset-y-0 left-8 right-0 flex items-end">
          {data.map((item, index) => (
            <div key={index} className="flex h-full flex-1 items-end justify-center px-0.5">
              {item.value > 0 && (
                <div
                  className="w-full max-w-7 rounded-t-[2px] bg-accent"
                  style={{ height: `${(item.value / top) * 100}%` }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex pl-8">
        {data.map((item, index) => (
          <div
            key={index}
            className="min-w-0 flex-1 truncate text-center text-small text-muted"
          >
            {index % labelEvery === 0 || index === data.length - 1 ? item.label : ''}
          </div>
        ))}
      </div>
    </div>
  )
}

function Kpi({ label, value, caption, lead = false }: { label: string; value: number; caption: string; lead?: boolean }) {
  return (
    <div className="min-w-[140px] flex-1 px-4 py-1 first:pl-0">
      <p className="text-body font-medium text-muted">{label}</p>
      <p className={`mt-1 font-normal text-ink tabular-nums ${lead ? 'text-[32px] leading-none' : 'text-kpi'}`}>
        {value}
      </p>
      <p className="mt-1 text-small text-muted">{caption}</p>
    </div>
  )
}

function QueueStrip({
  records,
  patients,
}: {
  records: MedicalRecord[]
  patients: Patient[]
}) {
  const today = records.filter((record) => isToday(record.visit_date)).slice(0, 6)
  if (today.length === 0) {
    return (
      <section className="mt-6 rounded-card border border-line bg-raised px-4 py-5">
        <h2 className="text-section font-medium text-ink">Antrean hari ini</h2>
        <p className="mt-2 text-body text-muted">Belum ada kunjungan yang dicatat hari ini.</p>
      </section>
    )
  }
  return (
    <section className="mt-6 rounded-card border border-line bg-raised px-4 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-section font-medium text-ink">Antrean hari ini</h2>
        <Link to="/rekam-medis" className="inline-flex items-center gap-1 text-small font-medium text-ink hover:text-accent">
          Lihat semua <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {today.map((record) => {
          const patient = patients.find((item) => item.id === record.patient_id)
          return (
            <li key={record.id} className="flex items-center gap-2.5 rounded-card bg-surface px-3 py-2.5">
              <Avatar name={patient?.full_name ?? 'Pasien'} size="sm" />
              <div className="min-w-0 flex-1">
                <Link to={`/rekam-medis/${record.id}`} className="block truncate text-body font-medium text-ink hover:text-accent">
                  {patient?.full_name ?? 'Pasien tidak ditemukan'}
                </Link>
                <p className="text-small text-muted tabular-nums">{formatWaktu(record.visit_date)} · {hitungUmur(patient?.date_of_birth ?? new Date().toISOString())} tahun</p>
              </div>
              <StatusPill status={record.status} />
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const [range, setRange] = useState<Range>(7)
  const pharmacist = user?.role === 'pharmacist'

  const patientsQuery = usePatients(!pharmacist)
  const recordsQuery = useMedicalRecords(!pharmacist)
  const prescriptionsQuery = usePrescriptions(!pharmacist)
  const pharmacistRx = usePharmacistPrescriptions(pharmacist)
  const allergies = useAllergyDirectory()

  const isLoading = pharmacist ? pharmacistRx.isLoading : patientsQuery.isLoading || recordsQuery.isLoading
  const isError = pharmacist ? pharmacistRx.isError : patientsQuery.isError || recordsQuery.isError

  const records = recordsQuery.data ?? []
  const todayRecords = useMemo(() => records.filter((record) => isToday(record.visit_date)), [records])
  const drafts = records.filter((record) => record.status === 'draft')
  const series = useMemo(() => buildDailySeries(records, range), [records, range])

  const rxRows = pharmacistRx.data ?? []
  const rxToday = rxRows.filter((row) => isToday(row.visit_date))
  const allergyRows = (allergies.data ?? []).filter(
    (item) => item.allergies && item.allergies.trim() !== '' && item.allergies.toLowerCase() !== 'tidak ada',
  )

  const finding = pharmacist
    ? `${rxToday.length} resep dicatat hari ini${allergyRows.length > 0 ? ` · ${allergyRows.length} pasien memiliki alergi` : ''}.`
    : `${drafts.length} rekam medis berstatus draft menunggu pelengkapan dokter.`

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState message="Data ringkasan gagal dimuat." />

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-title font-semibold text-ink">Ringkasan klinik</h1>
          <p className="mt-1 text-body text-muted">
            {formatTanggal(new Date(), 'EEEE, d MMMM yyyy')} · {finding}
          </p>
        </div>
        {can('patients.manage', user?.role) && (
          <Link to="/pasien?new=1">
            <Button variant="primary">
              <UserPlus className="h-4 w-4" /> Daftarkan pasien
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <section className="flex flex-wrap divide-rule rounded-card border border-line md:divide-x">
            {pharmacist ? (
              <>
                <Kpi label="Resep hari ini" value={rxToday.length} caption="Dicatat hari ini" lead />
                <Kpi label="Total resep" value={rxRows.length} caption="Seluruh kunjungan" />
                <Kpi label="Pasien alergi" value={allergyRows.length} caption="Perlu diperhatikan" />
                <Kpi label="Obat berbeda" value={new Set(rxRows.map((row) => row.medication_name)).size} caption="Seluruh resep" />
              </>
            ) : (
              <>
                <Kpi label="Pasien terdaftar" value={patientsQuery.data?.length ?? 0} caption="Seluruh pasien" lead />
                <Kpi label="Kunjungan hari ini" value={todayRecords.length} caption={formatTanggal(new Date(), 'd MMM yyyy')} />
                <Kpi label="Rekam medis draft" value={drafts.length} caption="Menunggu pelengkapan" />
                <Kpi label="Resep tercatat" value={prescriptionsQuery.data?.length ?? 0} caption="Seluruh kunjungan" />
              </>
            )}
          </section>

          <section className="mt-4 rounded-card border border-line px-4 py-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-section font-medium text-ink">
                {pharmacist ? 'Resep per hari' : 'Kunjungan per hari'}
              </h2>
              <div className="inline-flex h-8 items-center rounded-control bg-raised p-0.5" role="group" aria-label="Rentang grafik">
                {([7, 30] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setRange(option)}
                    aria-pressed={range === option}
                    className={`h-7 rounded-[4px] px-3 text-small transition-colors ${
                      range === option ? 'bg-surface font-medium text-ink' : 'text-muted hover:text-ink'
                    }`}
                  >
                    {option} hari
                  </button>
                ))}
              </div>
            </div>
            <BarChart
              data={
                pharmacist
                  ? buildDailySeries(rxRows.map((row) => ({ visit_date: row.visit_date })), range)
                  : series
              }
            />
            <p className="mt-2 text-small text-muted">
              {pharmacist
                ? 'Jumlah resep yang dibuat pada tiap tanggal kunjungan.'
                : 'Jumlah kunjungan yang tercatat pada tiap tanggal.'}
            </p>
          </section>

          {pharmacist ? (
            <section className="mt-6 rounded-card border border-line bg-raised px-4 py-4">
              <h2 className="text-section font-medium text-ink">Resep hari ini</h2>
              {rxToday.length === 0 ? (
                <p className="mt-2 text-body text-muted">Belum ada resep yang dicatat hari ini.</p>
              ) : (
                <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {rxToday.slice(0, 6).map((row) => (
                    <li key={row.id} className="rounded-card bg-surface px-3 py-2.5">
                      <p className="text-body font-medium text-ink">{row.patient_name}</p>
                      <p className="text-small text-muted">{row.medication_name} · {row.dosage}</p>
                      <p className="mt-1 text-small text-muted">Alergi: {atauDash(row.allergies)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : (
            <QueueStrip records={records} patients={patientsQuery.data ?? []} />
          )}
        </div>

        <aside className="min-w-0">
          <div className="mb-3">
            <SectionTitle title={pharmacist ? 'Alergi pasien' : 'Kunjungan terbaru'} />
          </div>
          <section className="rounded-card border border-line px-4 py-2">
            {pharmacist ? (
              allergyRows.length === 0 ? (
                <p className="py-4 text-body text-muted">Tidak ada alergi yang tercatat.</p>
              ) : (
                <ul>
                  {allergyRows.slice(0, 5).map((item) => (
                    <li key={item.id} className="flex h-11 items-center justify-between gap-3 border-t border-rule first:border-0">
                      <span className="truncate text-body text-ink">{item.full_name}</span>
                      <span className="truncate text-small text-muted">{item.allergies}</span>
                    </li>
                  ))}
                </ul>
              )
            ) : records.length === 0 ? (
              <p className="py-4 text-body text-muted">Belum ada kunjungan.</p>
            ) : (
              <ul>
                {[...records]
                  .sort((a, b) => b.visit_date.localeCompare(a.visit_date))
                  .slice(0, 4)
                  .map((record) => {
                    const patient = (patientsQuery.data ?? []).find((item) => item.id === record.patient_id)
                    return (
                      <li key={record.id} className="flex h-11 items-center gap-2.5 border-t border-rule first:border-0">
                        <Avatar name={patient?.full_name ?? 'Pasien'} size="sm" />
                        <span className="min-w-0 flex-1 truncate text-body text-ink">{patient?.full_name ?? '—'}</span>
                        <span className="shrink-0 text-small text-muted">{formatRelatif(record.visit_date)}</span>
                      </li>
                    )
                  })}
              </ul>
            )}
          </section>
          <Link
            to={pharmacist ? '/resep' : '/rekam-medis'}
            className="mt-3 inline-flex h-8 items-center justify-center gap-1.5 rounded-control border border-control px-3 text-small font-medium text-ink hover:bg-raised"
          >
            Lihat semua <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </aside>
      </div>
    </>
  )
}
