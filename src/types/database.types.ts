/**
 * Tipe database yang mengikuti bentuk hasil `supabase gen types typescript`.
 * Dijaga manual agar aplikasi tetap type-safe sebelum CLI Supabase dijalankan.
 * Saat skema berubah, regenerate dengan:
 *   npx supabase gen types typescript --project-id <id> > src/types/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'doctor' | 'nurse' | 'pharmacist'
export type Gender = 'L' | 'P'
export type BloodType = 'A' | 'B' | 'AB' | 'O' | 'UNKNOWN'
export type RecordStatus = 'draft' | 'completed' | 'archived'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          role: UserRole
          specialization: string | null
          sip_number: string | null
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          role?: UserRole
          specialization?: string | null
          sip_number?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: UserRole
          specialization?: string | null
          sip_number?: string | null
          created_at?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          id: string
          medical_record_number: string
          nik: string
          full_name: string
          date_of_birth: string
          gender: Gender
          blood_type: BloodType
          allergies: string | null
          phone_number: string | null
          address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          medical_record_number: string
          nik: string
          full_name: string
          date_of_birth: string
          gender: Gender
          blood_type?: BloodType
          allergies?: string | null
          phone_number?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          medical_record_number?: string
          nik?: string
          full_name?: string
          date_of_birth?: string
          gender?: Gender
          blood_type?: BloodType
          allergies?: string | null
          phone_number?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      medical_records: {
        Row: {
          id: string
          patient_id: string
          doctor_id: string | null
          visit_date: string
          subjective: string
          objective: string
          assessment: string
          icd10_code: string | null
          plan: string
          status: RecordStatus
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          doctor_id?: string | null
          visit_date?: string
          subjective?: string
          objective?: string
          assessment?: string
          icd10_code?: string | null
          plan?: string
          status?: RecordStatus
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          doctor_id?: string | null
          visit_date?: string
          subjective?: string
          objective?: string
          assessment?: string
          icd10_code?: string | null
          plan?: string
          status?: RecordStatus
          created_at?: string
        }
        Relationships: []
      }
      prescriptions: {
        Row: {
          id: string
          medical_record_id: string
          medication_name: string
          dosage: string
          quantity: number
          notes: string | null
        }
        Insert: {
          id?: string
          medical_record_id: string
          medication_name: string
          dosage: string
          quantity: number
          notes?: string | null
        }
        Update: {
          id?: string
          medical_record_id?: string
          medication_name?: string
          dosage?: string
          quantity?: number
          notes?: string | null
        }
        Relationships: []
      }
    }
    Views: Record<PropertyKey, never>
    Functions: {
      current_role: {
        Args: Record<PropertyKey, never>
        Returns: UserRole
      }
      generate_medical_record_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      pharmacist_patient_allergies: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          medical_record_number: string
          full_name: string
          allergies: string | null
        }[]
      }
      pharmacist_prescriptions: {
        Args: Record<PropertyKey, never>
        Returns: {
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
        }[]
      }
    }
    Enums: {
      user_role: UserRole
      gender: Gender
      blood_type: BloodType
      medical_record_status: RecordStatus
    }
    CompositeTypes: Record<PropertyKey, never>
  }
}
