-- =============================================================================
-- Sistem Informasi Manajemen Rekam Medis (EMR)
-- Schema awal: tabel, enum, trigger, Row Level Security dan kebijakan RBAC.
-- Jalankan melalui Supabase SQL Editor (atau `supabase db push`).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Enum (dibuat sekali saja)
-- -----------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('admin', 'doctor', 'nurse', 'pharmacist');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.gender as enum ('L', 'P');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.blood_type as enum ('A', 'B', 'AB', 'O', 'UNKNOWN');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.medical_record_status as enum ('draft', 'completed', 'archived');
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- 1. Tabel
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  full_name      text not null,
  role           public.user_role not null default 'nurse',
  specialization text,
  sip_number     text,
  created_at     timestamptz not null default now()
);

create table if not exists public.patients (
  id                      uuid primary key default gen_random_uuid(),
  medical_record_number   text not null unique,
  nik                     varchar(16) not null unique,
  full_name               text not null,
  date_of_birth           date not null,
  gender                  public.gender not null,
  blood_type              public.blood_type not null default 'UNKNOWN',
  allergies               text,
  phone_number            text,
  address                 text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create table if not exists public.medical_records (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references public.patients (id) on delete restrict,
  doctor_id   uuid references public.profiles (id) on delete set null,
  visit_date  timestamptz not null default now(),
  subjective  text not null default '',
  objective   text not null default '',
  assessment  text not null default '',
  icd10_code  text,
  plan        text not null default '',
  status      public.medical_record_status not null default 'draft',
  created_at  timestamptz not null default now()
);

create table if not exists public.prescriptions (
  id                uuid primary key default gen_random_uuid(),
  medical_record_id uuid not null references public.medical_records (id) on delete cascade,
  medication_name   text not null,
  dosage            text not null,
  quantity          integer not null check (quantity > 0),
  notes             text
);

create index if not exists medical_records_patient_idx on public.medical_records (patient_id, visit_date desc);
create index if not exists medical_records_doctor_idx  on public.medical_records (doctor_id);
create index if not exists prescriptions_record_idx    on public.prescriptions (medical_record_id);

-- -----------------------------------------------------------------------------
-- 2. Fungsi pembantu & trigger
-- -----------------------------------------------------------------------------

-- Peran pengguna yang sedang login. SECURITY DEFINER + search_path kosong
-- mencegah eskalasi hak melalui pencarian fungsi/skema buatan pengguna.
create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid();
$$;

revoke all on function public.current_role() from public, anon;
grant execute on function public.current_role() to authenticated;

-- Nomor rekam medis: RM-<tahun>-<4 digit>, dibuat atomik oleh database.
create sequence if not exists public.medical_record_number_seq start with 1;

create or replace function public.generate_medical_record_number()
returns text
language sql
volatile
set search_path = ''
as $$
  select format('RM-%s-%s', extract(year from now())::text,
                lpad(nextval('public.medical_record_number_seq')::text, 4, '0'));
$$;

revoke all on function public.generate_medical_record_number() from public, anon;
grant execute on function public.generate_medical_record_number() to authenticated;

-- Data alergi pasien untuk apoteker (hanya kolom yang dibutuhkan).
create or replace function public.pharmacist_patient_allergies()
returns table (id uuid, medical_record_number text, full_name text, allergies text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.medical_record_number, p.full_name, p.allergies
  from public.patients p
  where public.current_role() in ('pharmacist', 'doctor', 'admin', 'nurse');
$$;

revoke all on function public.pharmacist_patient_allergies() from public, anon;
grant execute on function public.pharmacist_patient_allergies() to authenticated;

-- Resep beserta konteks minimum yang dibutuhkan apoteker (tanpa akses ke SOAP).
create or replace function public.pharmacist_prescriptions()
returns table (
  id uuid,
  medical_record_id uuid,
  medication_name text,
  dosage text,
  quantity integer,
  notes text,
  patient_id uuid,
  patient_name text,
  medical_record_number text,
  allergies text,
  visit_date timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select pr.id, pr.medical_record_id, pr.medication_name, pr.dosage, pr.quantity, pr.notes,
         p.id, p.full_name, p.medical_record_number, p.allergies, mr.visit_date
  from public.prescriptions pr
  join public.medical_records mr on mr.id = pr.medical_record_id
  join public.patients p on p.id = mr.patient_id
  where public.current_role() in ('pharmacist', 'doctor', 'admin', 'nurse');
$$;

revoke all on function public.pharmacist_prescriptions() from public, anon;
grant execute on function public.pharmacist_prescriptions() to authenticated;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists patients_touch_updated_at on public.patients;
create trigger patients_touch_updated_at
before update on public.patients
for each row execute function public.touch_updated_at();

-- Profile otomatis dibuat saat pengguna baru mendaftar via Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'nurse')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Fungsi trigger hanya dipanggil oleh database, bukan lewat API /rpc.
revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 3. Row Level Security — WAJIB aktif pada semua tabel
-- -----------------------------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.patients       enable row level security;
alter table public.medical_records enable row level security;
alter table public.prescriptions  enable row level security;

-- Catatan: FORCE sengaja tidak dipakai pada `profiles` karena trigger
-- `handle_new_user` perlu menyisipkan profile sebelum pengguna memiliki role.

-- Hak dasar (RLS tetap membatasi baris yang boleh diakses).
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.patients to authenticated;
grant select, insert, update, delete on public.medical_records to authenticated;
grant select, insert, update, delete on public.prescriptions to authenticated;

-- -----------------------------------------------------------------------------
-- 3a. profiles
-- -----------------------------------------------------------------------------
drop policy if exists "profiles_read" on public.profiles;
create policy "profiles_read" on public.profiles
for select to authenticated using (auth.uid() is not null);

drop policy if exists "profiles_insert_admin" on public.profiles;
create policy "profiles_insert_admin" on public.profiles
for insert to authenticated with check (public.current_role() = 'admin');

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
for update to authenticated
using (public.current_role() = 'admin')
with check (public.current_role() = 'admin');

drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin" on public.profiles
for delete to authenticated using (public.current_role() = 'admin');

-- -----------------------------------------------------------------------------
-- 3b. patients
-- admin/doctor/nurse melihat & mengelola; apoteker hanya melalui RPC alergi.
-- -----------------------------------------------------------------------------
drop policy if exists "patients_read_staff" on public.patients;
create policy "patients_read_staff" on public.patients
for select to authenticated
using (public.current_role() in ('admin', 'doctor', 'nurse'));

drop policy if exists "patients_insert_staff" on public.patients;
create policy "patients_insert_staff" on public.patients
for insert to authenticated
with check (public.current_role() in ('admin', 'doctor', 'nurse'));

drop policy if exists "patients_update_staff" on public.patients;
create policy "patients_update_staff" on public.patients
for update to authenticated
using (public.current_role() in ('admin', 'doctor', 'nurse'))
with check (public.current_role() in ('admin', 'doctor', 'nurse'));

drop policy if exists "patients_delete_admin" on public.patients;
create policy "patients_delete_admin" on public.patients
for delete to authenticated using (public.current_role() = 'admin');

-- -----------------------------------------------------------------------------
-- 3c. medical_records
-- Aturan penting: rekam medis 'completed' tidak boleh dihapus; cukup diarsipkan.
-- Tidak ada policy DELETE sama sekali, jadi penghapusan selalu ditolak RLS.
-- -----------------------------------------------------------------------------
drop policy if exists "records_read_staff" on public.medical_records;
create policy "records_read_staff" on public.medical_records
for select to authenticated
using (public.current_role() in ('admin', 'doctor', 'nurse'));

drop policy if exists "records_insert_doctor_nurse" on public.medical_records;
create policy "records_insert_doctor_nurse" on public.medical_records
for insert to authenticated
with check (public.current_role() in ('doctor', 'nurse'));

drop policy if exists "records_update_role_aware" on public.medical_records;
create policy "records_update_role_aware" on public.medical_records
for update to authenticated
using (
  public.current_role() = 'doctor'
  or public.current_role() = 'admin'
  or (public.current_role() = 'nurse' and status = 'draft')
)
with check (
  public.current_role() = 'doctor'
  or (public.current_role() = 'nurse' and status = 'draft')
  or (public.current_role() = 'admin' and status = 'archived')
);

-- -----------------------------------------------------------------------------
-- 3d. prescriptions
-- Apoteker hanya membaca; doctor menulis; hapus hanya saat kunjungan masih draft.
-- -----------------------------------------------------------------------------
drop policy if exists "prescriptions_read" on public.prescriptions;
create policy "prescriptions_read" on public.prescriptions
for select to authenticated
using (public.current_role() in ('admin', 'doctor', 'nurse', 'pharmacist'));

drop policy if exists "prescriptions_insert_doctor" on public.prescriptions;
create policy "prescriptions_insert_doctor" on public.prescriptions
for insert to authenticated
with check (
  public.current_role() = 'doctor'
  and exists (
    select 1 from public.medical_records mr
    where mr.id = medical_record_id and mr.status <> 'archived'
  )
);

drop policy if exists "prescriptions_update_doctor" on public.prescriptions;
create policy "prescriptions_update_doctor" on public.prescriptions
for update to authenticated
using (
  public.current_role() = 'doctor'
  and exists (
    select 1 from public.medical_records mr
    where mr.id = medical_record_id and mr.status = 'draft'
  )
)
with check (
  public.current_role() = 'doctor'
  and exists (
    select 1 from public.medical_records mr
    where mr.id = medical_record_id and mr.status = 'draft'
  )
);

drop policy if exists "prescriptions_delete_draft_doctor" on public.prescriptions;
create policy "prescriptions_delete_draft_doctor" on public.prescriptions
for delete to authenticated
using (
  public.current_role() = 'doctor'
  and exists (
    select 1 from public.medical_records mr
    where mr.id = medical_record_id and mr.status = 'draft'
  )
);

-- -----------------------------------------------------------------------------
-- 4. Storage privat untuk lampiran rekam medis (opsional)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('medical-documents', 'medical-documents', false)
on conflict (id) do nothing;

drop policy if exists "medical_documents_read" on storage.objects;
create policy "medical_documents_read" on storage.objects
for select to authenticated
using (
  bucket_id = 'medical-documents'
  and public.current_role() in ('admin', 'doctor', 'nurse')
);

drop policy if exists "medical_documents_write" on storage.objects;
create policy "medical_documents_write" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'medical-documents'
  and public.current_role() in ('admin', 'doctor', 'nurse')
);

drop policy if exists "medical_documents_update" on storage.objects;
create policy "medical_documents_update" on storage.objects
for update to authenticated
using (
  bucket_id = 'medical-documents'
  and public.current_role() in ('admin', 'doctor', 'nurse')
);

drop policy if exists "medical_documents_delete" on storage.objects;
create policy "medical_documents_delete" on storage.objects
for delete to authenticated
using (
  bucket_id = 'medical-documents'
  and public.current_role() in ('admin', 'doctor', 'nurse')
);
