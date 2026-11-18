import type { BloodType, Gender, RecordStatus, UserRole } from '../types'

export const BLOOD_TYPES = ['A', 'B', 'AB', 'O', 'UNKNOWN'] as const

export const GENDERS = ['L', 'P'] as const

export const RECORD_STATUSES = ['draft', 'completed', 'archived'] as const

export const USER_ROLES = ['admin', 'doctor', 'nurse', 'pharmacist'] as const

export const BLOOD_TYPE_LABELS: Record<BloodType, string> = {
  A: 'A',
  B: 'B',
  AB: 'AB',
  O: 'O',
  UNKNOWN: 'Belum diketahui',
}

export const GENDER_LABELS: Record<Gender, string> = {
  L: 'Laki-laki',
  P: 'Perempuan',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin klinik',
  doctor: 'Dokter',
  nurse: 'Perawat',
  pharmacist: 'Apoteker',
}

export const STATUS_LABELS: Record<RecordStatus, string> = {
  draft: 'Draft',
  completed: 'Selesai',
  archived: 'Diarsipkan',
}

export const ICD10_COMMON: { code: string; label: string }[] = [
  { code: 'J06.9', label: 'Infeksi saluran napas atas, tidak spesifik' },
  { code: 'J02.9', label: 'Faringitis akut, tidak spesifik' },
  { code: 'I10', label: 'Hipertensi esensial' },
  { code: 'E11.9', label: 'Diabetes melitus tipe 2 tanpa komplikasi' },
  { code: 'E78.5', label: 'Hiperlipidemia, tidak spesifik' },
  { code: 'K29.5', label: 'Gastritis kronis, tidak spesifik' },
  { code: 'J45.9', label: 'Asma, tidak spesifik' },
  { code: 'A09', label: 'Diare dan gastroenteritis infektif' },
  { code: 'M79.7', label: 'Fibromyalgia' },
  { code: 'R51', label: 'Nyeri kepala' },
]

/** Warna identitas pale untuk inisial orang — identitas, bukan data chart. */
export const PERSON_TINTS = [
  { bg: '#e0eff1', ink: '#155564' },
  { bg: '#e7edf7', ink: '#2f4d78' },
  { bg: '#e6f2e9', ink: '#1e613c' },
  { bg: '#f4ebdd', ink: '#7c5520' },
  { bg: '#eee8f4', ink: '#5b4479' },
  { bg: '#f7e9e7', ink: '#8a4038' },
]
