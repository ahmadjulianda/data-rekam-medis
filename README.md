# Sistem Informasi Manajemen Rekam Medis (EMR)

Aplikasi EMR berbasis **React 18 + Vite + TypeScript**, **Tailwind CSS**, **TanStack Query v5**,
**React Hook Form + Zod**, **React Router v6**, dan **Supabase** (Postgres, Auth, RLS, Storage).
Hasil build berupa file statis yang siap di-upload ke **cPanel**.

---

## Status lingkungan saat ini

Project Supabase sudah dibuat dan migrasi sudah diterapkan:

- **Project:** `data-rekam-medis` (`mhetpydidthwthjwpzgz`), region `ap-southeast-1` (Singapore)
- **URL:** `https://mhetpydidthwthjwpzgz.supabase.co`
- `.env.local` sudah berisi URL dan **publishable key** (bukan service role key)
- Tabel, RLS, policy RBAC, fungsi, dan bucket Storage sudah terverifikasi aktif

Belum ada akun staf — buat akun pertama lewat **Authentication → Invite user** di Supabase Dashboard,
lalu set perannya menjadi `admin` (lihat bagian 2).

## 1. Menjalankan proyek

```bash
npm install
cp .env.example .env.local    # Windows: Copy-Item .env.example .env.local
npm run dev
```

Buka `http://localhost:5173`.

### Mode demo (tanpa Supabase)

Jika `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` kosong, aplikasi otomatis berjalan dalam
**mode demo**: data pasien, kunjungan, dan resep disimpan di `localStorage` browser. Tidak ada
data yang dikirim ke server.

- Halaman login menyediakan empat akun peran: admin, dokter, perawat, apoteker.
- Pintasan pratinjau: `?demo=1` langsung masuk sebagai dokter;
  `?demo=1&role=pharmacist` (atau `admin`, `nurse`, `doctor`) masuk sebagai peran tersebut.
- Untuk mengembalikan data contoh, jalankan di konsol browser:
  `Object.keys(localStorage).filter(k => k.startsWith('emr-demo:')).forEach(k => localStorage.removeItem(k))`.

Mode demo **hanya untuk evaluasi tampilan**. Semua aturan keamanan nyata berlaku setelah Supabase
dikonfigurasi.

---

## 2. Menyiapkan Supabase

1. Buat project di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, jalankan seluruh isi
   [`supabase/migrations/20261118000000_initial_schema.sql`](supabase/migrations/20261118000000_initial_schema.sql).
   Migration ini membuat:
   - enum `user_role`, `gender`, `blood_type`, `medical_record_status`;
   - tabel `profiles`, `patients`, `medical_records`, `prescriptions` + index;
   - fungsi `current_role()`, `generate_medical_record_number()`, `pharmacist_patient_allergies()`,
     `pharmacist_prescriptions()`, trigger profile otomatis dan `updated_at`;
   - **RLS aktif pada semua tabel** dengan kebijakan RBAC;
   - bucket Storage privat `medical-documents`.
3. Ambil **Project URL** dan **anon / publishable key** dari *Project Settings → API*, lalu isi
   `.env.local`:

   ```env
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

4. Buat akun staf melalui **Authentication → Invite user**. Profil akan dibuat otomatis oleh
   trigger dengan peran default `nurse`; ubah perannya lewat halaman *Tenaga medis* (admin) atau
   lewat SQL:

   ```sql
   update public.profiles set role = 'doctor', full_name = 'dr. Nama', specialization = 'Penyakit Dalam'
   where id = 'uuid-pengguna';
   ```

> **Jangan pernah** menaruh `service_role` key di kode frontend atau di file yang di-upload ke
> cPanel. Hanya dua variabel `VITE_` di atas yang boleh diekspos ke browser.

### Ringkasan hak akses (RLS)

| Tabel / fungsi | admin | doctor | nurse | pharmacist |
| --- | --- | --- | --- | --- |
| `patients` | penuh | lihat & ubah | lihat & ubah | hanya alergi via RPC |
| `medical_records` | lihat, arsipkan | buat, ubah, selesaikan | isi draft (S/O) | tidak ada akses |
| `prescriptions` | lihat | buat, ubah, hapus saat draft | lihat | lihat via RPC |
| `profiles` | kelola | lihat | lihat | lihat |

Rekam medis **tidak memiliki kebijakan DELETE** — yang sudah `completed` hanya dapat diarsipkan,
sesuai persyaratan audit.

---

## 3. Build & upload ke cPanel

```bash
npm run build
```

Hasil build ada di folder `dist/`. Isi folder tersebut (bukan folder `dist`-nya) di-upload ke
`public_html` melalui **File Manager** atau FTP.

Sertakan juga file `.htaccess` dari root proyek ke `public_html`. File ini:

- mengarahkan semua rute React Router ke `index.html` (SPA fallback), sehingga refresh pada
  `/pasien` tidak 404;
- mengaktifkan kompresi dan cache untuk aset hasil build;
- mematikan directory indexing.

### Jika aplikasi dipasang di subfolder

Misalnya `public_html/emr/`:

1. Di `vite.config.ts`, ubah `base: '/'` menjadi `base: '/emr/'`.
2. Di `.env.local`, isi `VITE_BASE_PATH=/emr/`.
3. Di `.htaccess`, ubah `RewriteBase /` menjadi `RewriteBase /emr/`.
4. Build ulang dan upload isi `dist/` ke `public_html/emr/`.

### Pratinjau hasil build lokal

```bash
npm run preview:cpanel
```

Server ini meniru perilaku SPA fallback cPanel di `http://localhost:4173`.

> Pastikan cPanel menggunakan HTTPS agar Supabase Auth menyimpan sesi dengan aman. Jika
> domain Anda `www.example.com`, daftarkan URL tersebut di *Supabase → Authentication → URL
> Configuration → Site URL / Redirect URLs*.

---

## 4. Struktur proyek

```text
src/
├── components/
│   ├── layout/       # Sidebar, Topbar, AppLayout, ProtectedRoute, RoleGuard
│   └── ui/           # Button, Field, Modal, Tabs, Avatar, Feedback
├── features/
│   ├── auth/         # AuthContext, LoginPage
│   ├── dashboard/    # Ringkasan klinik
│   ├── patients/     # Daftar, detail, form pasien
│   ├── medical-records/ # SOAP, daftar, detail, arsip
│   ├── prescriptions/   # Resep & tampilan apoteker
│   └── staff/        # Manajemen profil staf, profil sendiri
├── hooks/            # useDebounce
├── lib/              # supabase, repository, demo-store, validasi, format, RBAC
├── types/            # database.types.ts + tipe domain
└── pages/            # (halaman dirangkai di src/App.tsx)
supabase/migrations/  # SQL skema + RLS
scripts/serve-dist.mjs
.htaccess             # disalin ke public_html (root hosting)
```

---

## 5. Perintah

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Development server |
| `npm run typecheck` | Cek TypeScript |
| `npm run build` | Typecheck + build produksi ke `dist/` |
| `npm run preview:cpanel` | Pratinjau build dengan SPA fallback |
