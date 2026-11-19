import { z } from 'zod'
import { BLOOD_TYPES, GENDERS, RECORD_STATUSES } from './constants'

const tanggalSchema = z
  .string()
  .min(1, 'Tanggal wajib diisi')
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Format tanggal tidak valid')

export const patientSchema = z.object({
  nik: z
    .string()
    .trim()
    .regex(/^\d{16}$/, 'NIK harus terdiri dari 16 digit angka'),
  full_name: z
    .string()
    .trim()
    .min(3, 'Nama minimal 3 karakter')
    .max(120, 'Nama terlalu panjang'),
  date_of_birth: tanggalSchema.refine(
    (value) => new Date(value).getTime() <= Date.now(),
    'Tanggal lahir tidak boleh di masa depan',
  ),
  gender: z.enum(GENDERS, { errorMap: () => ({ message: 'Jenis kelamin wajib dipilih' }) }),
  blood_type: z.enum(BLOOD_TYPES),
  allergies: z.string().trim().nullable().optional(),
  phone_number: z
    .string()
    .trim()
    .regex(/^[0-9+\s-]{0,20}$/, 'Nomor telepon hanya boleh angka, +, spasi, atau tanda hubung')
    .nullable()
    .optional(),
  address: z.string().trim().max(300, 'Alamat terlalu panjang').nullable().optional(),
})

export const medicalRecordSchema = z.object({
  patient_id: z.string().uuid('Pasien wajib dipilih'),
  visit_date: z.string().min(1, 'Tanggal kunjungan wajib diisi'),
  subjective: z.string().trim().min(5, 'Keluhan utama minimal 5 karakter'),
  objective: z.string().trim().min(5, 'Pemeriksaan fisik / TTV minimal 5 karakter'),
  assessment: z.string().trim(),
  icd10_code: z.string().trim().nullable().optional(),
  plan: z.string().trim(),
  status: z.enum(RECORD_STATUSES),
})

export const prescriptionSchema = z.object({
  medical_record_id: z.string().uuid(),
  medication_name: z.string().trim().min(2, 'Nama obat minimal 2 karakter'),
  dosage: z.string().trim().min(2, 'Dosis wajib diisi, contoh: 3x1 sesudah makan'),
  quantity: z.coerce.number().int('Kuantitas harus bilangan bulat').positive('Kuantitas harus lebih dari 0'),
  notes: z.string().trim().nullable().optional(),
})

export const loginSchema = z.object({
  email: z.string().trim().email('Format email tidak valid'),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Format email tidak valid'),
})

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'Kata sandi minimal 6 karakter'),
    confirmPassword: z.string().min(6, 'Konfirmasi kata sandi minimal 6 karakter'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Konfirmasi kata sandi tidak sama',
    path: ['confirmPassword'],
  })

export const registerSchema = z
  .object({
    full_name: z.string().trim().min(3, 'Nama minimal 3 karakter').max(120, 'Nama terlalu panjang'),
    email: z.string().trim().email('Format email tidak valid'),
    password: z.string().min(6, 'Kata sandi minimal 6 karakter'),
    confirmPassword: z.string().min(6, 'Konfirmasi kata sandi minimal 6 karakter'),
    role: z.enum(['doctor', 'nurse', 'pharmacist']).default('nurse'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Konfirmasi kata sandi tidak sama',
    path: ['confirmPassword'],
  })

export type PatientFormValues = z.infer<typeof patientSchema>
export type MedicalRecordFormValues = z.infer<typeof medicalRecordSchema>
export type PrescriptionFormValues = z.infer<typeof prescriptionSchema>
export type LoginFormValues = z.infer<typeof loginSchema>
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>
