# Panduan Push Repo Lokal ke GitHub Lama dan Deploy ke Vercel / Netlify

Dokumen ini menjelaskan urutan kerja jika kamu ingin:
- tetap memakai akun GitHub yang lama sebagai tujuan repo,
- tidak perlu login/switch akun GitHub di VS Code,
- lalu lanjut deploy ke Vercel atau Netlify.

## Alur Singkat
1. Siapkan repo GitHub kosong di akun lama.
2. Arahkan `remote origin` lokal ke repo GitHub lama.
3. Commit dan push dari laptop ini.
4. Import repo GitHub ke Vercel atau Netlify.
5. Set environment variables.
6. Deploy.

---

## Bagian 1: Siapkan Repo GitHub di Akun Lama

### Langkah 1 - Buka GitHub akun lama di browser
- Login ke GitHub dengan akun lama lewat browser.
- Buat repository baru, misalnya `HabTracker`.
- Disarankan repo kosong:
  - jangan centang `Add a README`
  - jangan tambah `.gitignore` dari template
  - jangan tambah license dulu

### Langkah 2 - Salin URL repo
- Setelah repo dibuat, salin URL repo HTTPS.
- Contoh:
```text
https://github.com/USERNAME_LAMA/HabTracker.git
```

---

## Bagian 2: Hubungkan Repo Lokal ke Repo GitHub Lama

Buka terminal di folder project ini, lalu jalankan langkah berikut.

### Langkah 3 - Cek remote yang sedang aktif
```bash
git remote -v
```

Kalau masih mengarah ke repo lama yang salah, ganti dengan repo GitHub akun lama.

### Langkah 4 - Set remote ke repo GitHub akun lama
Jika `origin` sudah ada:
```bash
git remote set-url origin https://github.com/USERNAME_LAMA/HabTracker.git
```

Jika `origin` belum ada:
```bash
git remote add origin https://github.com/USERNAME_LAMA/HabTracker.git
```

### Langkah 5 - Pastikan branch utama bernama `main`
```bash
git branch -M main
```

### Langkah 6 - Lihat status file
```bash
git status
```

Kalau masih ada file yang belum masuk commit, lanjut commit.

### Langkah 7 - Commit perubahan
```bash
git add .
git commit -m "Siap deploy ke GitHub dan production"
```

### Langkah 8 - Push ke GitHub akun lama
```bash
git push -u origin main
```

Jika diminta login:
- pilih akun GitHub lama di browser,
- atau masukkan kredensial akun lama jika diminta,
- jangan login ulang di VS Code jika tidak perlu.

---

## Bagian 3: Kalau Push Gagal karena Akun Salah

Kalau `git push` masih pakai akun yang salah, biasanya karena credential tersimpan di Windows.

### Langkah 9 - Cek credential GitHub di Windows
- Buka `Credential Manager` di Windows.
- Cari credential yang terkait `github.com`.
- Hapus credential yang salah jika perlu.
- Coba `git push` ulang.

### Langkah 10 - Coba push ulang
```bash
git push -u origin main
```

---

## Bagian 4: Deploy ke Vercel

### Langkah 11 - Import repo ke Vercel
- Buka [Vercel](https://vercel.com).
- Login pakai akun Vercel kamu.
- Klik `Add New` atau `Import Project`.
- Pilih repo `HabTracker` dari GitHub akun lama.

### Langkah 12 - Isi environment variables
Tambahkan variable berikut di Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ENABLE_OFFLINE=false`
- `VITE_ENABLE_SYNC_TOOLS=false`
- `VITE_ALLOW_LOCAL_MIGRATION=false`

### Langkah 13 - Deploy
- Klik `Deploy`.
- Tunggu build selesai.
- Buka URL hasil deploy dan tes login / habit / analytics.

---

## Bagian 5: Deploy ke Netlify

### Langkah 11 - Import repo ke Netlify
- Buka [Netlify](https://www.netlify.com).
- Login.
- Klik `Add new site` → `Import an existing project`.
- Pilih GitHub.
- Pilih repo `HabTracker` dari akun lama.

### Langkah 12 - Setting build
Gunakan setting berikut:
- Build command: `npm run build`
- Publish directory: `dist`

### Langkah 13 - Isi environment variables
Tambahkan variable berikut di Netlify:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ENABLE_OFFLINE=false`
- `VITE_ENABLE_SYNC_TOOLS=false`
- `VITE_ALLOW_LOCAL_MIGRATION=false`

### Langkah 14 - Deploy
- Klik `Deploy site`.
- Tunggu selesai.
- Tes hasil deploy di URL yang diberikan.

---

## Bagian 6: Checklist Setelah Deploy

- [v] Repo lokal sudah push ke GitHub akun lama.
- [v] Repo GitHub yang dipakai benar.
- [v] Vercel / Netlify sudah connect ke repo itu.
- [v] Environment variables sudah diisi.
- [v] Build berhasil.
- [ ] Login berhasil.
- [ ] Create habit berhasil.
- [ ] Sync / analytics / streak tampil benar.

---

## Perintah Cepat yang Paling Sering Dipakai

```bash
git remote -v
git remote set-url origin https://github.com/USERNAME_LAMA/HabTracker.git
git branch -M main
git add .
git commit -m "Siap deploy"
git push -u origin main
```

---

## Catatan Penting

- Kamu tidak wajib switch akun GitHub di VS Code.
- Yang penting adalah `remote origin` mengarah ke repo GitHub akun lama.
- Deploy ke Vercel / Netlify akan lebih mudah kalau repo sudah ada di GitHub.
- Jangan commit isi `.env.production` yang berisi secret.

---

## Rekomendasi Urutan Paling Aman

1. Buat repo kosong di GitHub akun lama.
2. Set `remote origin` lokal ke repo itu.
3. Commit dan push.
4. Import repo ke Vercel atau Netlify.
5. Tambah environment variables.
6. Deploy dan test.
