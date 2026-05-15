# HabTracker Product Development Notes

Dokumen ini menjadi acuan roadmap pengembangan agar iterasi fitur tetap terstruktur.

## Product Goals

1. Meningkatkan retensi pengguna harian dan mingguan.
2. Menyediakan insight yang actionable, bukan hanya visual statistik.
3. Menyiapkan fondasi data untuk sinkronisasi lintas perangkat.

## Prioritas Tinggi

### 1) Streak System yang Lebih Manusiawi

Tujuan:
- Menurunkan efek "all-or-nothing" saat user terlewat 1 hari.

Implementasi awal (sudah diterapkan):
- Weekly grace day: 1 hari skip per minggu tidak langsung memutus streak.
- Current streak dan longest streak dihitung ulang dari completedDates.

Next steps:
- Tambahkan pengaturan per-user untuk jumlah grace day.
- Tampilkan indikator "grace used" di UI Analytics/Dashboard.
- Tambahkan milestone badge (7/21/66 hari).

### 2) Smart Reminder

Tujuan:
- Meningkatkan completion rate dengan notifikasi kontekstual.

Backlog:
- Per-habit reminder time.
- Snooze 15m/30m/60m.
- Reminder summary di jam malam jika habit belum selesai.

### 3) Habit Templates

Tujuan:
- Mempercepat onboarding dan mengurangi friction saat membuat habit baru.

Implementasi awal (sudah diterapkan):
- Menyediakan template habit siap pakai.
- Tombol "Use Template" di halaman Manage.

Next steps:
- Tambah template packs (Student, Professional, Health).
- Tampilkan preview manfaat template.
- Cegah duplikasi nama habit saat add dari template.

### 4) Weekly Review Otomatis

Tujuan:
- Memberi feedback mingguan yang bisa ditindaklanjuti.

Backlog:
- Ringkasan mingguan: strongest habit, weakest habit, completion trend.
- Auto-generated action plan minggu berikutnya.

## Prioritas Menengah

1. Goal layering (Habit -> Goal tahunan/bulanan).
2. Adaptive difficulty (naik/turun target sesuai konsistensi).
3. Anti-burnout mode (fokus maksimal 3 habit utama/hari).
4. Analytics korelatif (waktu terbaik, hari terbaik, pola gagal).

## Prioritas Lanjutan

1. Auth + cloud sync multi-device.
2. Integrasi eksternal (Calendar, Health, Notion/Todoist).
3. Accountability mode (buddy/challenge privat).
4. AI habit coach personal.

## Data & Database Plan

Kondisi saat ini:
- Data disimpan di localStorage (browser), belum ada backend database.
- Artinya data tidak otomatis sinkron antar device/browser.

Tahap berikutnya (disarankan):
1. Definisikan schema awal:
   - users
   - habits
   - habit_completions
   - daily_tasks
   - books
   - reminder_settings
2. Pilih backend cepat untuk MVP:
   - Supabase (PostgreSQL + Auth + Realtime) atau Firebase.
3. Migrasi bertahap:
   - Tetap pakai localStorage sebagai cache offline.
   - Tambah sync layer saat login tersedia.

## Delivery Plan (30-60-90)

30 hari:
- Stabilkan streak + template.
- Tambah weekly review v1.
- Tambah export/import data JSON.

60 hari:
- Tambah auth + cloud storage.
- Tambah reminder terjadwal.
- Tambah milestone badge.

90 hari:
- Sync multi-device penuh.
- Insight analytics lanjutan.
- Mulai AI coaching v1.