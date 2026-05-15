# HabTracker - Habits & Productivity Tracker

HabTracker adalah aplikasi pelacak kebiasaan (*habit tracker*) dan produktivitas yang dirancang dengan antarmuka modern, minimalis, serta mendukung mode gelap/terang (*dark/light mode*). Aplikasi ini memiliki beberapa fitur utama seperti Dashboard, Analytics & Progress, Reading Tracker, dan halaman Manajemen Kebiasaan.

## Tech Stack (Teknologi yang Digunakan)

Berikut adalah daftar teknologi utama yang digunakan dalam pengembangan HabTracker beserta kegunaan dan alasan pemilihannya:

### 1. React (Frontend Framework/Library)
- **Kegunaan**: Sebagai fondasi utama untuk membangun antarmuka pengguna (UI) berbasis komponen (*component-based*). React juga dimanfaatkan untuk mengelola *state* aplikasi global secara mandiri menggunakan `Context API` (dalam hal ini `HabitContext`).
- **Alasan**: React memungkinkan pembuatan antarmuka yang dinamis dan modular. Dengan memecah UI menjadi komponen-komponen kecil yang saling lepas (seperti *Sidebar*, *Progress Widget*, dll), kode menjadi lebih rapi, mudah dibaca, serta bisa digunakan kembali (*reusable*). Selain itu, React mempercepat *rendering* dengan menggunakan Virtual DOM.

### 2. TypeScript
- **Kegunaan**: Digunakan sebagai bahasa pemrograman utama. TypeScript adalah *superset* dari JavaScript yang menambahkan fitur *static typing* (pengetikan statis).
- **Alasan**: TypeScript sangat efektif untuk mendeteksi potensi *bug* atau *error* lebih awal (pada saat penulisan kode). Dengan adanya tipe data yang jelas (seperti bentuk struktur data kebiasaan, rutinitas harian, dll.), proses pengembangan menjadi jauh lebih aman, sistematis, dan terprediksi.

### 3. Tailwind CSS (Styling Framework)
- **Kegunaan**: Mengatur seluruh tampilan visual aplikasi (warna, tipografi, ukuran), merancang tata letak responsif (untuk HP hingga Desktop), serta mengendalikan fitur fitur mode gelap dan terang (*dark mode*).
- **Alasan**: Tailwind CSS adalah *utility-first framework* yang sangat mempercepat alur kerja (*workflow*) desain karena kita tidak perlu lagi membuat file CSS terpisah yang rentan membesar tanpa kendali. Pembuatan desain responsif (seperti kelas `md:` atau `lg:`) maupun pengaturan *dark mode* (seperti kelas `dark:bg-white`) dapat dilakukan dengan ringkas langsung di dalam satu file komponen.

### 4. React Router
- **Kegunaan**: Bertugas sebagai sistem navigasi (pengatur rute/URL) pada bagian klien (*client-side routing*), sehingga pengguna bisa berpindah antarmenu (Dashboard, Analytics, Reading Tracker, Manage).
- **Alasan**: Dengan `react-router`, aplikasi beroperasi layaknya *Single Page Application* (SPA). Pengguna bisa berpindah dari satu halaman ke halaman lain dengan instan, tanpa ada jeda atau layar memutih karena tidak memuat ulang (*refresh*) halaman *browser* sama sekali.

### 5. Lucide React (Icon Library)
- **Kegunaan**: Menyediakan set ikon SVG yang digunakan di berbagai bagian antarmuka aplikasi, seperti menu navigasi, ikon tombol persetujuan, ikon kalender, hingga ikon *toggle* bulan dan matahari.
- **Alasan**: Lucide dirancang dengan arsitektur yang modern, memiliki tampilan grafis yang konsisten dan minimalis. Ikon ini juga dirancang sedemikian rupa agar sangat mudah diubah ukuran, warna, maupun ketebalannya (*stroke*) hanya dengan menyuntikkan kelas Tailwind CSS.

---

*Catatan: Struktur teknis pada aplikasi ini disusun untuk bisa diskalakan dan dirawat secara modular ke depannya.*

## Product Development Notes

Catatan roadmap dan rencana pengembangan terstruktur tersedia di:

- [guidelines/Product-Development-Notes.md](guidelines/Product-Development-Notes.md)
- [guidelines/Supabase-Setup.md](guidelines/Supabase-Setup.md)
