import type { PostgrestError } from '@supabase/supabase-js'
import { isDemoMode, supabase } from './supabase'
import { demoStore } from './demo-store'
import type {
  MedicalRecord,
  MedicalRecordInput,
  Patient,
  PatientInput,
  Prescription,
  PrescriptionInput,
  Profile,
} from '../types'

/** Ubah error Supabase menjadi pesan yang bisa dibaca pengguna. */
export function friendlyError(error: unknown): Error {
  if (error instanceof Error && !('code' in error)) return error
  const pg = error as PostgrestError
  if (pg.code === '23505') {
    const detail = pg.message.toLowerCase()
    if (detail.includes('nik')) return new Error('NIK sudah terdaftar pada pasien lain.')
    if (detail.includes('medical_record_number')) return new Error('Nomor rekam medis sudah digunakan.')
    return new Error('Data yang sama sudah terdaftar.')
  }
  if (pg.code === '23514') return new Error('Nilai yang dimasukkan tidak memenuhi aturan data.')
  if (pg.code === '42501' || pg.message?.toLowerCase().includes('row-level security')) {
    return new Error('Anda tidak memiliki izin untuk melakukan tindakan ini.')
  }
  return new Error(pg.message || 'Operasi gagal. Silakan coba lagi.')
}

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function nextDemoMrn(patients: Patient[]): string {
  const max = patients.reduce((acc, patient) => {
    const match = patient.medical_record_number.match(/-(\d+)$/)
    return match ? Math.max(acc, Number(match[1])) : acc
  }, 0)
  return `RM-${new Date().getFullYear()}-${String(max + 1).padStart(4, '0')}`
}

// ---------------------------------------------------------------------------
// Pasien
// ---------------------------------------------------------------------------
export async function getPatients(): Promise<Patient[]> {
  if (isDemoMode) {
    return [...demoStore.patients()].sort((a, b) => b.created_at.localeCompare(a.created_at))
  }
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw friendlyError(error)
  return data
}

export async function getPatient(id: string): Promise<Patient | null> {
  if (isDemoMode) return demoStore.patients().find((item) => item.id === id) ?? null
  const { data, error } = await supabase.from('patients').select('*').eq('id', id).maybeSingle()
  if (error) throw friendlyError(error)
  return data
}

export async function createPatient(input: PatientInput): Promise<Patient> {
  if (isDemoMode) {
    const patients = demoStore.patients()
    if (patients.some((item) => item.nik === input.nik)) {
      throw new Error('NIK sudah terdaftar pada pasien lain.')
    }
    const now = new Date().toISOString()
    const patient: Patient = {
      ...input,
      id: newId(),
      medical_record_number: nextDemoMrn(patients),
      created_at: now,
      updated_at: now,
    }
    demoStore.setPatients([patient, ...patients])
    return patient
  }

  const { data: mrn, error: mrnError } = await supabase.rpc('generate_medical_record_number')
  if (mrnError) throw friendlyError(mrnError)
  if (!mrn) throw new Error('Gagal membuat nomor rekam medis.')

  const { data, error } = await supabase
    .from('patients')
    .insert({ ...input, medical_record_number: mrn })
    .select('*')
    .single()
  if (error) throw friendlyError(error)
  return data
}

export async function updatePatient(id: string, patch: Partial<PatientInput>): Promise<Patient> {
  if (isDemoMode) {
    const patients = demoStore.patients()
    if (patients.some((item) => item.nik === patch.nik && item.id !== id)) {
      throw new Error('NIK sudah terdaftar pada pasien lain.')
    }
    const updated = patients.map((item) =>
      item.id === id ? { ...item, ...patch, updated_at: new Date().toISOString() } : item,
    )
    demoStore.setPatients(updated)
    const patient = updated.find((item) => item.id === id)
    if (!patient) throw new Error('Pasien tidak ditemukan.')
    return patient
  }
  const { data, error } = await supabase
    .from('patients')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw friendlyError(error)
  return data
}

export async function deletePatient(id: string): Promise<void> {
  if (isDemoMode) {
    demoStore.setPatients(demoStore.patients().filter((item) => item.id !== id))
    demoStore.setRecords(demoStore.records().filter((item) => item.patient_id !== id))
    return
  }
  const { error } = await supabase.from('patients').delete().eq('id', id)
  if (error) throw friendlyError(error)
}

// ---------------------------------------------------------------------------
// Rekam medis
// ---------------------------------------------------------------------------
export async function getMedicalRecords(): Promise<MedicalRecord[]> {
  if (isDemoMode) {
    return [...demoStore.records()].sort((a, b) => b.visit_date.localeCompare(a.visit_date))
  }
  const { data, error } = await supabase
    .from('medical_records')
    .select('*')
    .order('visit_date', { ascending: false })
  if (error) throw friendlyError(error)
  return data
}

export async function getMedicalRecord(id: string): Promise<MedicalRecord | null> {
  if (isDemoMode) return demoStore.records().find((item) => item.id === id) ?? null
  const { data, error } = await supabase.from('medical_records').select('*').eq('id', id).maybeSingle()
  if (error) throw friendlyError(error)
  return data
}

export async function createMedicalRecord(input: MedicalRecordInput): Promise<MedicalRecord> {
  if (isDemoMode) {
    const record: MedicalRecord = {
      ...input,
      id: newId(),
      created_at: new Date().toISOString(),
    }
    demoStore.setRecords([record, ...demoStore.records()])
    return record
  }
  const { data, error } = await supabase
    .from('medical_records')
    .insert(input)
    .select('*')
    .single()
  if (error) throw friendlyError(error)
  return data
}

export async function updateMedicalRecord(
  id: string,
  patch: Partial<MedicalRecordInput>,
): Promise<MedicalRecord> {
  if (isDemoMode) {
    const updated = demoStore.records().map((item) => (item.id === id ? { ...item, ...patch } : item))
    demoStore.setRecords(updated)
    const record = updated.find((item) => item.id === id)
    if (!record) throw new Error('Rekam medis tidak ditemukan.')
    return record
  }
  const { data, error } = await supabase
    .from('medical_records')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw friendlyError(error)
  return data
}

export async function archiveMedicalRecord(id: string): Promise<void> {
  await updateMedicalRecord(id, { status: 'archived' })
}

// ---------------------------------------------------------------------------
// Resep
// ---------------------------------------------------------------------------
export async function getPrescriptions(): Promise<Prescription[]> {
  if (isDemoMode) return [...demoStore.prescriptions()]
  const { data, error } = await supabase.from('prescriptions').select('*')
  if (error) throw friendlyError(error)
  return data
}

export async function createPrescription(input: PrescriptionInput): Promise<Prescription> {
  if (isDemoMode) {
    const prescription: Prescription = { ...input, id: newId() }
    demoStore.setPrescriptions([...demoStore.prescriptions(), prescription])
    return prescription
  }
  const { data, error } = await supabase
    .from('prescriptions')
    .insert(input)
    .select('*')
    .single()
  if (error) throw friendlyError(error)
  return data
}

export async function updatePrescription(
  id: string,
  patch: Partial<PrescriptionInput>,
): Promise<Prescription> {
  if (isDemoMode) {
    const updated = demoStore.prescriptions().map((item) =>
      item.id === id ? { ...item, ...patch } : item,
    )
    demoStore.setPrescriptions(updated)
    const prescription = updated.find((item) => item.id === id)
    if (!prescription) throw new Error('Resep tidak ditemukan.')
    return prescription
  }
  const { data, error } = await supabase
    .from('prescriptions')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw friendlyError(error)
  return data
}

export async function deletePrescription(id: string): Promise<void> {
  if (isDemoMode) {
    demoStore.setPrescriptions(demoStore.prescriptions().filter((item) => item.id !== id))
    return
  }
  const { error } = await supabase.from('prescriptions').delete().eq('id', id)
  if (error) throw friendlyError(error)
}

// ---------------------------------------------------------------------------
// Profil staf & direktori alergi (apoteker)
// ---------------------------------------------------------------------------
export async function getProfiles(): Promise<Profile[]> {
  if (isDemoMode) {
    return [...demoStore.profiles()].sort((a, b) => a.full_name.localeCompare(b.full_name))
  }
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name', { ascending: true })
  if (error) throw friendlyError(error)
  return data
}

export async function getProfileById(id: string): Promise<Profile | null> {
  if (isDemoMode) return demoStore.profiles().find((item) => item.id === id) ?? null
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
  if (error) throw friendlyError(error)
  return data
}

export async function updateProfile(
  id: string,
  patch: Partial<Pick<Profile, 'full_name' | 'role' | 'specialization' | 'sip_number'>>,
): Promise<Profile> {
  if (isDemoMode) {
    const updated = demoStore.profiles().map((item) => (item.id === id ? { ...item, ...patch } : item))
    demoStore.setProfiles(updated)
    const profile = updated.find((item) => item.id === id)
    if (!profile) throw new Error('Profil tidak ditemukan.')
    return profile
  }
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw friendlyError(error)
  return data
}

export interface AllergyEntry {
  id: string
  medical_record_number: string
  full_name: string
  allergies: string | null
}

export async function getAllergyDirectory(): Promise<AllergyEntry[]> {
  if (isDemoMode) {
    return demoStore.patients().map(({ id, medical_record_number, full_name, allergies }) => ({
      id,
      medical_record_number,
      full_name,
      allergies,
    }))
  }
  const { data, error } = await supabase.rpc('pharmacist_patient_allergies')
  if (error) throw friendlyError(error)
  return data ?? []
}

export interface PharmacistPrescription {
  id: string
  medical_record_id: string
  medication_name: string
  dosage: string
  quantity: number
  notes: string | null
  patient_id: string
  patient_name: string
  medical_record_number: string
  allergies: string | null
  visit_date: string
}

export async function getPharmacistPrescriptions(): Promise<PharmacistPrescription[]> {
  if (isDemoMode) {
    const patients = demoStore.patients()
    const records = demoStore.records()
    return demoStore.prescriptions().flatMap((prescription) => {
      const record = records.find((item) => item.id === prescription.medical_record_id)
      const patient = patients.find((item) => item.id === record?.patient_id)
      if (!record || !patient) return []
      return [{
        id: prescription.id,
        medical_record_id: prescription.medical_record_id,
        medication_name: prescription.medication_name,
        dosage: prescription.dosage,
        quantity: prescription.quantity,
        notes: prescription.notes,
        patient_id: patient.id,
        patient_name: patient.full_name,
        medical_record_number: patient.medical_record_number,
        allergies: patient.allergies,
        visit_date: record.visit_date,
      }]
    })
  }
  const { data, error } = await supabase.rpc('pharmacist_prescriptions')
  if (error) throw friendlyError(error)
  return data ?? []
}
