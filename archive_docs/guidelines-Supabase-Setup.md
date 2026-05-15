# Supabase Setup (Beginner Friendly)

Dokumen ini menjelaskan urutan aman untuk menghubungkan project Anda ke Supabase.

## 1) Kapan Anda perlu buat akun Supabase?

Anda baru perlu buka browser dan buat akun saat **Step 3** di bawah.

Sebelum itu, project lokal tetap bisa jalan seperti biasa tanpa Supabase.

## 2) Kondisi project saat ini

- SDK Supabase sudah terpasang (`@supabase/supabase-js`).
- File env template sudah tersedia di `.env.example`.
- Client helper Supabase sudah ada di `src/lib/supabase.ts`.

Artinya fondasi teknis sudah siap, tinggal Anda isi kredensial dari dashboard Supabase.

## 3) Step di browser (yang perlu Anda lakukan)

1. Buka `https://supabase.com`.
2. Sign up / login.
3. Klik **New project**.
4. Isi:
   - Project name: misalnya `habtracker`
   - Database password: simpan baik-baik
   - Region: pilih yang terdekat
5. Tunggu provisioning selesai.
6. Buka **Project Settings -> API**.
7. Copy dua nilai ini:
   - `Project URL`
   - `anon public key`

## 4) Step di project lokal (setelah Anda punya URL + key)

1. Duplikasi file env:

```powershell
Copy-Item .env.example .env
```

2. Isi `.env`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_PUBLIC_KEY
```

3. Restart dev server.

## 5) Jalankan schema SQL MVP

1. Di dashboard Supabase, buka **SQL Editor**.
2. Copy isi file `db/schema_mvp.sql`.
3. Jalankan query.

## 6) Jalankan RLS policies

Setelah schema berhasil dibuat, buka SQL Editor lagi dan jalankan isi:

- `db/rls_policies.sql`

Saat file ini dijalankan:

- RLS diaktifkan untuk tabel user-owned.
- User hanya bisa baca/tulis datanya sendiri.
- Supabase Auth akan membuat row `users` otomatis saat signup.
- `habit_templates` tetap bisa dibaca semua user karena itu data global read-only.

## 7) Verifikasi cepat

Setelah schema berhasil dijalankan, Anda akan melihat tabel:

- `users`
- `habits`
- `habit_completions`
- `daily_tasks`
- `books`
- `habit_templates`
- `weekly_reviews` (opsional)

Kalau mau cek cepat di SQL Editor, jalankan:

```sql
select tablename, rowsecurity
from pg_tables
join pg_class on pg_class.relname = tablename
join pg_namespace on pg_namespace.oid = pg_class.relnamespace
where schemaname = 'public'
order by tablename;
```

## 8) Apa yang akan kita kerjakan setelah ini

Setelah Anda selesai Step 3-5, langkah saya berikutnya:

1. Implement auth dasar (magic link) dengan Supabase Auth.
2. Implement migrasi localStorage -> Supabase sekali klik.
3. Tambahkan sinkronisasi incremental (date-only completion tetap dipertahankan).
4. Tambahkan offline cache lokal dengan IndexedDB setelah auth stabil.