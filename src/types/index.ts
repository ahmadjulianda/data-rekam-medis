import type {
  BloodType,
  Gender,
  RecordStatus,
  UserRole,
} from './database.types'

export type { BloodType, Gender, RecordStatus, UserRole }

export type Profile = DatabaseRow<'profiles'>
export type Patient = DatabaseRow<'patients'>
export type MedicalRecord = DatabaseRow<'medical_records'>
export type Prescription = DatabaseRow<'prescriptions'>

type DatabaseRow<T extends 'profiles' | 'patients' | 'medical_records' | 'prescriptions'> =
  import('./database.types').Database['public']['Tables'][T]['Row']

/** Data yang dibutuhkan untuk membuat/update pasien (nomor RM dibuat otomatis). */
export interface PatientInput {
  nik: string
  full_name: string
  date_of_birth: string
  gender: Gender
  blood_type: BloodType
  allergies: string | null
  phone_number: string | null
  address: string | null
}

export interface MedicalRecordInput {
  patient_id: string
  doctor_id: string | null
  visit_date: string
  subjective: string
  objective: string
  assessment: string
  icd10_code: string | null
  plan: string
  status: RecordStatus
}

export interface PrescriptionInput {
  medical_record_id: string
  medication_name: string
  dosage: string
  quantity: number
  notes: string | null
}

export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: UserRole
  specialization: string | null
  sipNumber: string | null
}

/** Rekam medis yang sudah digabung dengan data pasien dan dokter untuk ditampilkan. */
export interface MedicalRecordView extends MedicalRecord {
  patient: Pick<Patient, 'id' | 'full_name' | 'medical_record_number' | 'allergies'> | null
  doctor: Pick<Profile, 'id' | 'full_name'> | null
}

/** Resep yang sudah digabung dengan konteks kunjungan dan pasien. */
export interface PrescriptionView extends Prescription {
  patient: Pick<Patient, 'id' | 'full_name' | 'medical_record_number' | 'allergies'> | null
  visitDate: string
  recordStatus: RecordStatus
}
