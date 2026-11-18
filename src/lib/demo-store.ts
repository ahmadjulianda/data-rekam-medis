import { DEMO_PATIENTS, DEMO_PRESCRIPTIONS, DEMO_PROFILES, DEMO_RECORDS } from './demo-data'
import type { MedicalRecord, Patient, Prescription, Profile } from '../types'

const PREFIX = 'emr-demo:v1:'

function read<T>(key: string, seed: T): T {
  try {
    const stored = window.localStorage.getItem(PREFIX + key)
    if (stored) return JSON.parse(stored) as T
    window.localStorage.setItem(PREFIX + key, JSON.stringify(seed))
    return seed
  } catch {
    return seed
  }
}

function write<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // localStorage penuh atau diblokir — tetap lanjut dengan data di memori.
  }
}

export const demoStore = {
  patients: () => read<Patient[]>('patients', DEMO_PATIENTS),
  setPatients: (value: Patient[]) => write('patients', value),

  records: () => read<MedicalRecord[]>('records', DEMO_RECORDS),
  setRecords: (value: MedicalRecord[]) => write('records', value),

  prescriptions: () => read<Prescription[]>('prescriptions', DEMO_PRESCRIPTIONS),
  setPrescriptions: (value: Prescription[]) => write('prescriptions', value),

  profiles: () => read<Profile[]>('profiles', DEMO_PROFILES),
  setProfiles: (value: Profile[]) => write('profiles', value),

  reset(): void {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith(PREFIX))
      .forEach((key) => window.localStorage.removeItem(key))
  },
}
