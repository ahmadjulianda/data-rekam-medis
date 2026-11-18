# 🏥 Project Context & Development Standard: Sistem Informasi Rekam Medis (EMR)

Dokumen ini berfungsi sebagai **Single Source of Truth** dan panduan konteks bagi AI Assistant dalam membantu pengembangan aplikasi **Data Rekam Medis** menggunakan **React (Vite)** dan **Supabase**.

---

## 1. Ringkasan Proyek (Project Overview)
- **Nama Proyek:** Sistem Informasi Manajemen Rekam Medis (Electronic Medical Record / EMR)
- **Tujuan:** Mengelola data pasien, riwayat kunjungan, diagnosis (ICD-10), tindakan medis, resep obat, dan manajemen tenaga medis secara digital, aman, dan terstruktur.
- **Target Pengguna:** Admin Klinik/RS, Dokter, Perawat, dan Apoteker.

---

## 2. Tech Stack & Dependencies
AI **wajib** menggunakan teknologi dan pustaka standar berikut saat menghasilkan kode:

- **Frontend Framework:** React 18+ dengan Vite (`npm create vite@latest`)
- **Bahasa Pemrograman:** TypeScript (`.tsx` / `.ts`) - *Wajib untuk type-safety data medis.*
- **Styling:** Tailwind CSS
- **UI Components:** Lucide React (Icons), Shadcn/UI (atau komponen modular berbasis Tailwind)
- **State Management & Data Fetching:** TanStack Query (React Query) v5
- **Form & Validation:** React Hook Form + Zod
- **Routing:** React Router DOM v6+
- **Backend & Database:** Supabase (PostgreSQL, Auth, Row Level Security, Storage)

---

## 3. Struktur Direktori (Folder Structure)
Gunakan arsitektur berbasis fitur (*feature-based* atau *domain-driven*) agar mudah diskalakan:

```text
src/
├── components/          # Komponen UI reusable (Button, Input, Modal, DataTable)
│   └── layout/          # Sidebar, Navbar, ProtectedRoute
├── features/            # Modul spesifik berdasarkan domain bisnis
│   ├── auth/            # Login, Manajemen Sesi, Role Guard
│   ├── patients/        # CRUD Pasien, Pencarian Pasien
│   ├── medical-records/ # Form Pemeriksaan (SOAP), Riwayat Medis, Diagnosis
│   └── prescriptions/   # Resep Obat & Farmasi
├── hooks/               # Custom hooks global (useAuth, useDebounce)
├── lib/                 # Konfigurasi library eksternal (supabaseClient.ts, queryClient.ts)
├── types/               # Definisi TypeScript & Database Types (database.types.ts)
├── utils/               # Helper functions (formatTanggal, formatRupiah, generateNoRM)
└── pages/               # Halaman utama yang dipetakan ke Router
```

---

## 4. Desain Skema Database (Supabase / PostgreSQL)
Gunakan konvensi **snake_case** untuk nama tabel dan kolom di database.

### Tabel Utama:
1. **`profiles`** (Ekstensi dari `auth.users`)
   - `id` (uuid, PK, references `auth.users.id`)
   - `full_name` (text, not null)
   - `role` (enum: `'admin'`, `'doctor'`, `'nurse'`, `'pharmacist'`)
   - `specialization` (text, nullable - khusus dokter)
   - `sip_number` (text, nullable - Surat Izin Praktik)
   - `created_at` (timestamptz)

2. **`patients`** (Data Master Pasien)
   - `id` (uuid, PK, default `gen_random_uuid()`)
   - `medical_record_number` (text, unique, not null - contoh: `RM-2026-0001`)
   - `nik` (varchar(16), unique, not null)
   - `full_name` (text, not null)
   - `date_of_birth` (date, not null)
   - `gender` (enum: `'L'`, `'P'`)
   - `blood_type` (enum: `'A'`, `'B'`, `'AB'`, `'O'`, `'UNKNOWN'`)
   - `allergies` (text, nullable)
   - `phone_number` (text)
   - `address` (text)
   - `created_at` (timestamptz)
   - `updated_at` (timestamptz)

3. **`medical_records`** (Catatan Kunjungan & Pemeriksaan SOAP)
   - `id` (uuid, PK, default `gen_random_uuid()`)
   - `patient_id` (uuid, FK -> `patients.id`, on delete restrict)
   - `doctor_id` (uuid, FK -> `profiles.id`)
   - `visit_date` (timestamptz, default `now()`)
   - `subjective` (text - Keluhan utama & anamnesis)
   - `objective` (text - Pemeriksaan fisik, TTV: TD, Nadi, Suhu, BB/TB)
   - `assessment` (text - Diagnosis klinis)
   - `icd10_code` (text, nullable - Kode standar penyakit)
   - `plan` (text - Rencana terapi, edukasi, tindak lanjut)
   - `status` (enum: `'draft'`, `'completed'`, `'archived'`)
   - `created_at` (timestamptz)

4. **`prescriptions`** (Resep Obat per Kunjungan)
   - `id` (uuid, PK, default `gen_random_uuid()`)
   - `medical_record_id` (uuid, FK -> `medical_records.id`, on delete cascade)
   - `medication_name` (text, not null)
   - `dosage` (text, not null - contoh: `3x1 sesudah makan`)
   - `quantity` (int, not null)
   - `notes` (text, nullable)

---

## 5. Aturan Keamanan & Privasi Data Medis (CRITICAL)
Data rekam medis bersifat **sangat rahasia**. AI harus selalu menerapkan aturan berikut:

1. **Row Level Security (RLS):**
   - Semua tabel di Supabase **wajib** mengaktifkan RLS (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
   - Tidak boleh ada akses publik (`anon`) untuk membaca atau menulis data medis.
2. **Role-Based Access Control (RBAC):**
   - `admin`: Akses penuh ke manajemen pasien dan profil staf, akses terbatas ke detail klinis jika diperlukan.
   - `doctor`: Dapat melihat semua pasien, membuat/mengubah `medical_records` dan `prescriptions`.
   - `nurse`: Dapat melihat pasien dan mengisi data awal (`objective` / Tanda-Tanda Vital).
   - `pharmacist`: Hanya dapat melihat `prescriptions` dan alergi pasien (`patients.allergies`).
3. **Soft Delete & Audit Trail:**
   - Data rekam medis (`medical_records`) yang sudah berstatus `'completed'` **tidak boleh dihapus permanen (`DELETE`)**. Gunakan perubahan status menjadi `'archived'` jika terjadi kesalahan input fatal.
4. **Environment Variables:**
   - Gunakan prefix `VITE_` hanya untuk `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`. Jangan pernah mengekspos `SERVICE_ROLE_KEY` di sisi frontend.

---

## 6. Standar Penulisan Kode (Coding Conventions)

- **Penamaan:**
  - Komponen React: `PascalCase` (contoh: `PatientFormModal.tsx`)
  - Hooks & Fungsi: `camelCase` (contoh: `usePatientRecords.ts`)
  - Konstanta: `UPPER_SNAKE_CASE` (contoh: `BLOOD_TYPES`)
  - Database Fields: `snake_case` (mapping ke `camelCase` di frontend jika perlu, atau gunakan langsung tipe dari Supabase CLI).
- **Penanganan Error & Loading:**
  - Setiap operasi asynchronous ke Supabase wajib menangani state `isLoading` dan `isError`.
  - Tampilkan notifikasi yang jelas (Toast) saat data berhasil disimpan atau gagal (misal: duplikasi NIK).
- **Validasi Form:**
  - Gunakan skema **Zod** sebelum mengirim payload ke Supabase (contoh: NIK wajib 16 digit angka, Nomor RM tidak boleh kosong).

---

## 7. Panduan Prompting untuk AI Assistant
*Saat meminta AI membuat fitur baru, gunakan referensi dokumen ini dengan format berikut:*

> "Berdasarkan aturan di `PROJECT_STANDARD.md`, buatkan komponen halaman detail pasien beserta riwayat rekam medisnya (SOAP) menggunakan React Query dan TypeScript."