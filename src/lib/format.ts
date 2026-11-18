import { format, formatDistanceToNowStrict, isValid, parseISO } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

export function formatTanggal(value: string | Date, pattern = 'dd MMM yyyy'): string {
  const date = typeof value === 'string' ? parseISO(value) : value
  if (!isValid(date)) return '—'
  return format(date, pattern, { locale: idLocale })
}

export function formatWaktu(value: string | Date): string {
  const date = typeof value === 'string' ? parseISO(value) : value
  if (!isValid(date)) return '—'
  return format(date, 'HH:mm', { locale: idLocale })
}

export function formatTanggalWaktu(value: string | Date): string {
  return `${formatTanggal(value, 'dd MMM yyyy • HH:mm')}`
}

export function hitungUmur(dateOfBirth: string): number {
  const lahir = parseISO(dateOfBirth)
  if (!isValid(lahir)) return 0
  const today = new Date()
  let umur = today.getFullYear() - lahir.getFullYear()
  const bulan = today.getMonth() - lahir.getMonth()
  if (bulan < 0 || (bulan === 0 && today.getDate() < lahir.getDate())) umur--
  return umur
}

export function formatRelatif(value: string | Date): string {
  const date = typeof value === 'string' ? parseISO(value) : value
  if (!isValid(date)) return '—'
  return formatDistanceToNowStrict(date, { addSuffix: true, locale: idLocale })
}

export function inisial(nama: string): string {
  return nama
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((bagian) => bagian[0]?.toUpperCase() ?? '')
    .join('')
}

/** Nilai kosong ditampilkan sebagai dash, bukan celah kosong atau "null". */
export function atauDash(value: string | null | undefined): string {
  return value && value.trim() !== '' ? value : '—'
}

export function tanggalHariIniInput(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function isoHariIni(): string {
  return new Date().toISOString()
}
