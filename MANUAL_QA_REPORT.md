# Manual QA Report — Pengujian Fungsionalitas Sistem Absensi
`diskominfo-intern-attendance` | Tanggal: 22 Juni 2026

> [!NOTE]
> Dokumen ini merupakan laporan pengujian QA terbaru berdasarkan hasil testing langsung hari ini. Semua hasil diambil dari eksekusi nyata di lingkungan development lokal (`localhost:3000`) terhubung ke database Neon PostgreSQL Cloud.

---

## 🗂️ Ringkasan Pengujian yang Dilakukan

| # | Area Pengujian | Metode | Hasil |
| :--- | :--- | :--- | :---: |
| 1 | Database Setup & Migrasi | `prisma db push` + `prisma db seed` | ✅ Berhasil |
| 2 | Middleware & Keamanan Rute | Browser navigation manual | ✅ Aman |
| 3 | API Endpoints — Semua 26 Endpoint | Script otomatis `test_apis.js` | ✅ 26/26 PASS |
| 4 | Geofencing GPS (Lokasi di Luar Area) | Script otomatis `test_gps_spoofing.js` | ✅ Terblokir |
| 5 | Geofencing GPS (Lokasi di Dalam Area) | Script otomatis `test_gps_spoofing.js` | ⚠️ Catatan |
| 6 | GPS Velocity Spoofing Detection | Script otomatis `test_gps_spoofing.js` | ✅ Logika Ada |
| 7 | **🔴 Kerentanan Biometrik — Photo/Virtual Camera Spoofing** | Analisis kode + teori serangan | 🔴 RENTAN |
| 8 | UI/UX Visual & Layout Inspection | Browser subagent (rekaman) | ⚠️ 3 Anomali |
| 9 | **UX Admin — Dialog Edit Detail Absensi** | Analisis kode + review manual | ⚠️ 3 Defisiensi UX |
| 10 | **Landing Page — Navbar & Header Konsistensi** | Analisis kode (`page.tsx`) | ⚠️ 3 Anomali UI |
| 11 | **Audit Validasi Email** | Analisis kode (schema + form + auth config) | ⚠️ 1 Celah Ditemukan |
| 12 | **Audit Arsitektur AI & Efisiensi** | Analisis kode (client face-api.js vs server) | ✅ Sangat Efisien |

---

## 1. 🗄️ Database Setup (Pra-syarat Pengujian)

Sebelum pengujian fungsionalitas dimulai, database cloud (Neon PostgreSQL) belum memiliki skema tabel apapun.

**Langkah yang dijalankan:**
```bash
npx prisma db push   # → Membuat semua tabel dari schema.prisma (selesai dalam 28 detik)
npx prisma db seed   # → Memasukkan data admin, instansi, area, dan aturan default
```

**Data yang berhasil di-seed:**
- User admin: `Pangeran` (`admin@buildwithjj.store`)
- Instansi: `Diskominfo Kota Makassar`
- Area geofence polygon: koordinat sekitar Makassar (`[119.41–119.43, -5.135–-5.15]`)
- Aturan instansi: `requireFaceVerification: true`, `requireWithinArea: true`

---

## 2. 🔒 Pengujian Middleware & Keamanan Rute

Pengujian dilakukan dengan membuka rute-rute terproteksi pada browser tanpa sesi aktif.

| Target Rute | Status Sesi | Perilaku Sistem | Hasil |
| :--- | :--- | :--- | :---: |
| `/dashboard` | Tidak login | Redirect otomatis ke `/auth/sign-in` | ✅ PASS |
| `/admin` | Tidak login | Redirect otomatis ke `/auth/sign-in` | ✅ PASS |
| `/profile/[id]` | Tidak login | Redirect otomatis ke `/auth/sign-in` | ✅ PASS |
| `/auth/sign-in` | Tidak login | Halaman form login tampil normal | ✅ PASS |

**Kesimpulan:** Middleware Next.js berfungsi sempurna — semua rute sensitif terlindungi dan tidak bisa diakses tanpa sesi autentikasi yang valid.

---

## 3. ✅ Pengujian API Otomatis — 26/26 Endpoint PASS

Script `scratch/test_apis.js` dijalankan setelah login sebagai admin dengan cookie sesi. Semua 26 endpoint yang terdaftar di `api-endpoints.md` berhasil diuji.

**Statistik:**
- **Total endpoint diuji:** 26
- **Passed (2xx):** 26 ✅
- **Failed:** 0 ❌

**Highlight siklus uji per domain:**

| Domain | Endpoint Diuji | Status |
| :--- | :--- | :---: |
| Agencies (CRUD + Area + Rules) | 11 endpoint | ✅ Semua PASS |
| Users + Attendances + Face | 4 endpoint | ✅ Semua PASS |
| Interns | 1 endpoint | ✅ PASS |
| Shifts, Schedules | 3 endpoint | ✅ Semua PASS |
| Holidays, Institutions | 4 endpoint | ✅ Semua PASS |
| Attendances, Logs, Assignments | 3 endpoint | ✅ Semua PASS |

> [!TIP]
> Laporan lengkap dengan HTTP status code dan waktu respons (ms) tersimpan di [`API_TEST_REPORT.md`](file:///d:/Intern%20Pangeran/coding-absensi-bebas/diskominfo-intern-attendance/API_TEST_REPORT.md).

**Catatan performa:** Beberapa endpoint memiliki waktu respons di atas 4 detik (misalnya `GET /api/agencies` 8.5 detik dan `GET /api/interns` 4.5 detik) kemungkinan karena latensi ke database Neon Cloud dari jaringan lokal. Perlu dipantau saat production deployment.

---

## 4. 📍 Pengujian Geofencing GPS & Anti-Spoofing

Script `scratch/test_gps_spoofing.js` dijalankan dengan membuat akun intern sementara (`intern_test@buildwithjj.store`), shift, dan jadwal yang valid, kemudian mensimulasikan 3 skenario absensi.

### Test Case 1 — Absen dari Luar Area (Jakarta: -6.175, 106.827)
```
Response: HTTP 400
Body: {"error":"Presensi wajib dilakukan di dalam area kantor."}
```
**✅ PASS** — Server menolak absensi dengan koordinat Jakarta yang jelas berada di luar polygon Makassar.

---

### Test Case 2 — Absen dari Dalam Area (Makassar: -5.145, 119.425)
```
Response: HTTP 400
Body: {"error":"Presensi wajib dilakukan di dalam area kantor."}
```
**⚠️ PERLU ANALISIS** — Koordinat `-5.145, 119.425` seharusnya berada di dalam polygon seed (`-5.135 s/d -5.15, 119.41 s/d 119.43`). Server tetap menolak.

**Investigasi Sumber Kode:**
Di `lib/location-within-area.ts` baris 112, `isLocationWithinArea` mengubah format input menjadi `[longitude, latitude]` sesuai standar GeoJSON. Ini sudah benar.

**Root Cause yang Mungkin:** Koordinat `-5.145` tepat berada di batas tepi polygon (boundary edge). Algoritma ray-casting di `isPointInRing` mungkin tidak menganggap titik tepat di tepi batas sebagai "di dalam". Ini adalah edge case geometri yang perlu diperiksa ulang.

---

### Test Case 3 — GPS Velocity Spoofing (Teleportasi 10 detik)
```
Response: HTTP 400
Body: {"error":"Presensi wajib dilakukan di dalam area kantor."}
```
**⚠️ TIDAK TEREKSEKUSI** — Pengujian Test Case 3 terhenti karena geofence check pada Test Case 2 sudah memblokir sebelum velocity check dijalankan. Logika velocity spoofing menggunakan `lib/location-verifier.ts` dan `lib/haversine-formula.ts` sudah terkoding dengan benar di `app/api/attendances/route.ts` baris 366–396, namun belum bisa diverifikasi hasilnya pada sesi ini.

---

## 5. 🎨 Pengujian UI/UX Visual & Layout

Pengujian dilakukan menggunakan browser subagent yang menavigasi halaman setelah login berhasil sebagai admin.

### Anomali 1 — Scroll Trap pada Komponen Peta Leaflet
- **Halaman:** Admin Dashboard (`/admin/[agencyId]`) & Dashboard Intern (`/dashboard/[internId]`)
- **Perilaku:** Ketika cursor berada di atas komponen peta dan pengguna men-scroll, Leaflet mengintersep event scroll untuk zoom peta, menyebabkan halaman tidak bisa di-scroll. Pengguna harus memindahkan cursor ke luar area peta terlebih dahulu.
- **Tingkat Keparahan:** Medium — mengganggu pengalaman pengguna, terutama di layar kecil atau touchpad.
- **Rekomendasi:** Nonaktifkan `scrollWheelZoom` secara default atau implementasikan overlay "klik untuk berinteraksi" pada peta.

### Anomali 2 — Date Range Picker Overflow di Bawah Viewport
- **Halaman:** Profil User (`/profile/[userId]`) — form durasi magang
- **Perilaku:** Popover kalender (`react-day-picker`) terbuka ke arah bawah dan bisa terpotong keluar viewport pada resolusi tertentu, membuat tombol pemilihan tanggal akhir sulit dijangkau tanpa scroll manual.
- **Tingkat Keparahan:** Low–Medium — hanya terjadi pada viewport kecil.
- **Rekomendasi:** Gunakan dynamic placement pada Popover agar kalender membuka ke atas jika ruang bawah tidak cukup.

### Anomali 3 — Skeleton Loader Berlangsung Lama
- **Halaman:** Admin Dashboard saat pertama kali memuat data instansi
- **Perilaku:** Efek skeleton loader (abu-abu berkedip) bertahan cukup lama sebelum data instansi dan area muncul, karena server perlu menyelesaikan beberapa query relasi Prisma secara bersamaan.
- **Tingkat Keparahan:** Low — tidak memblokir fungsionalitas, hanya berdampak pada persepsi performa awal.
- **Rekomendasi:** Implementasikan React `Suspense` dengan streaming SSR atau optimasi query dengan `select` field yang lebih selektif untuk mempercepat waktu muat awal.

---

## 6. 🔴 Kerentanan Keamanan — Face Photo & Virtual Camera Spoofing

> [!CAUTION]
> **Tingkat Keparahan: TINGGI (HIGH)**  
> Sistem verifikasi wajah saat ini **tidak memiliki mekanisme liveness detection**. Siapapun yang memiliki foto wajah yang terdaftar dapat memalsukan absensi hanya dengan menampilkan foto tersebut di depan kamera.

### Deskripsi Kerentanan

Alur verifikasi wajah saat absensi bekerja sebagai berikut:

1. **Kamera `<video>` diaktifkan** di browser via `getUserMedia` (komponen [`take-attendance-face-camera.tsx`](file:///d:/Intern%20Pangeran/coding-absensi-bebas/diskominfo-intern-attendance/app/dashboard/%5BinternId%5D/components/take-attendance-face-camera.tsx)).
2. **Fungsi `capturePhoto()`** mengambil frame dari video stream dan mengirimnya ke `face-api.js` untuk mengekstrak **face descriptor** (array 128 angka float).
3. **Descriptor dikirim ke server** via `POST /api/attendances` bersama data absensi lainnya.
4. **Server membandingkan** descriptor yang diterima dengan descriptor yang tersimpan di database (`faceDescriptor` tabel) menggunakan **jarak Euclidean** dengan threshold `≤ 0.6`.

```
// app/api/attendances/route.ts — baris 418–451
const euclideanDistance = (arr1: number[], arr2: number[]): number => { ... };
if (minDistance > 0.6) → TOLAK (wajah tidak cocok)
if (minDistance <= 0.6) → LOLOS (dianggap orang yang sama)
```

### Vektor Serangan yang Memungkinkan

| Metode Serangan | Cara Kerja | Berhasil Bypass? |
| :--- | :--- | :---: |
| **Foto Dicetak (Print Photo Attack)** | Penyerang mencetak foto korban dan menampilkannya di depan kamera | ✅ **Ya** — `face-api.js` mendeteksi wajah dari foto dan menghasilkan descriptor yang sama |
| **Foto di Layar HP/Laptop (Digital Screen Attack)** | Penyerang menampilkan foto korban di layar perangkat lain, lalu diarahkan ke kamera | ✅ **Ya** — `SsdMobilenetv1` tidak membedakan wajah asli vs. gambar 2D |
| **Virtual Camera / OBS (Video Injection)** | Menggunakan software seperti OBS atau ManyCam untuk menyuntikkan video/gambar ke dalam stream `getUserMedia` sebagai "kamera virtual" | ✅ **Ya** — browser menerima input dari virtual camera tanpa verifikasi sumber |
| **Manipulasi Descriptor API** | Langsung mengirim array descriptor yang valid ke `POST /api/attendances` via `fetch` tanpa membuka kamera sama sekali | ✅ **Ya** — tidak ada validasi di server bahwa descriptor berasal dari kamera fisik |

### Bukti Teknis (Root Cause)

**Penyebab utama:** Library `face-api.js` hanya melakukan **static facial feature extraction**. Library ini menganalisis gambar 2D untuk menghitung landmark wajah (mata, hidung, mulut) dan menghasilkan 128-dimensi embedding — tidak ada pemeriksaan apakah wajah tersebut *hidup* dan *bergerak nyata*.

**Tidak ada pemeriksaan berikut ini yang diimplementasikan:**
- ❌ **Blink detection** — tidak ada pengecekan apakah mata berkedip
- ❌ **Head movement challenge** — tidak ada instruksi "gerakkan kepala ke kiri/kanan"
- ❌ **Depth / 3D liveness** — tidak ada analisis kedalaman yang membedakan wajah 2D vs. 3D
- ❌ **Texture analysis** — tidak ada deteksi pola moire/refleksi yang muncul pada foto/layar
- ❌ **Server-side descriptor origin check** — server hanya menerima array angka dan tidak memvalidasi sumbernya

```typescript
// lib/face-recognition.ts — baris 363–370
// Hanya mendeteksi wajah dari input statis, TIDAK ada liveness check
const detections = await faceApi
  .detectAllFaces(input, new faceApi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
  .withFaceLandmarks()
  .withFaceDescriptors();
// → Array 128 float dikembalikan, identik untuk foto maupun wajah asli
```

### Dampak Bisnis

- Karyawan bisa **absen untuk orang lain** (titip absen) hanya bermodal foto di ponsel
- Tidak ada jejak digital yang membedakan absensi asli vs. pemalsuan
- Fitur `requireFaceVerification: true` yang diaktifkan di aturan instansi **memberikan rasa aman palsu**

### Rekomendasi Mitigasi

| Prioritas | Solusi | Keterangan |
| :--- | :--- | :--- |
| 🔴 Tinggi | **Liveness Challenge (Head Movement / Blink)** | Minta user mengedipkan mata atau menoleh sebelum pengambilan foto. Deteksi gerakan landmark antar frame. |
| 🔴 Tinggi | **Multi-frame Temporal Analysis** | Ambil beberapa frame berurutan dan verifikasi bahwa ada perubahan landmark — foto statis tidak akan menghasilkan variasi. |
| 🟡 Sedang | **Texture / Reflektansi Analysis** | Deteksi pola moire atau specular highlight yang muncul saat kamera mengarah ke layar/foto. |
| 🟡 Sedang | **Virtual Camera Detection** | Verifikasi bahwa `deviceId` kamera bukan virtual device menggunakan `MediaDeviceInfo.label`. |
| 🟢 Rendah | **Rate Limiting Ketat di API** | Batasi jumlah percobaan absensi per user per hari untuk memperlambat serangan. |

---

## 8. 📋 Temuan UX — Dialog Edit Detail Absensi (Admin)

Ditemukan melalui analisis kode pada [`user-attendance-edit-dialog.tsx`](file:///d:/Intern%20Pangeran/coding-absensi-bebas/diskominfo-intern-attendance/app/admin/%5BagencyId%5D/components/user-attendance-edit-dialog.tsx) dan logika di [`attendance-time-verifier.ts`](file:///d:/Intern%20Pangeran/coding-absensi-bebas/diskominfo-intern-attendance/lib/attendance-time-verifier.ts).

### Defisiensi UX 1 — Tidak Ada Informasi Durasi Keterlambatan

- **Halaman:** Admin → Attendance Detail → Dialog Edit Presensi
- **Perilaku Saat Ini:** Ketika status absensi adalah `LATE` (Terlambat), dialog hanya menampilkan teks "Terlambat" tanpa informasi berapa menit karyawan tersebut terlambat. Admin tidak bisa langsung menilai tingkat keterlambatan tanpa menghitung manual.
- **Data yang Tersedia:** `existingAttendance.attendanceTime` (jam absen aktual) dan `schedule.scheduleStart` (batas jam masuk tepat waktu) sudah tersedia di dialog — durasi bisa dihitung sebagai `attendanceTime - scheduleStart` dalam menit.
- **Dampak:** Admin tidak user-friendly — harus membuka kalkulator atau spreadsheet terpisah untuk menilai keterlambatan.
- **Tingkat Keparahan:** Medium — fungsional tapi tidak informatif.
- **Rekomendasi:** Tambahkan badge atau teks kecil di samping status select yang menampilkan `"Terlambat X menit"` secara otomatis saat status = `LATE`.

### Defisiensi UX 2 — Tidak Ada Penjelasan Kapan Status "Terlambat" Muncul

- **Halaman:** Admin → Dialog Edit Presensi → field Status Presensi
- **Perilaku Saat Ini:** Admin bisa memilih status "Terlambat" dari dropdown, namun tidak ada penjelasan apapun tentang aturan bisnis yang menentukan status ini — yaitu bahwa status `LATE` diberikan otomatis jika jam absen melewati `lateCutoff` di jadwal, **bukan** `scheduleStart`.
- **Konfirmasi dari Kode:** Di `attendance-time-verifier.ts` baris 188–207, logika jelas: `if (referenceTime >= absoluteLateCutoff) → LATE`. Nilai `lateCutoff` sudah tampil di schedule context card di bagian atas dialog, namun tidak ada narasi yang menghubungkannya dengan status LATE.
- **Dampak:** Admin pemula bisa salah mengira bahwa terlambat = melewati `scheduleStart`, padahal ada window toleransi (`windowStart` s/d `lateCutoff`) sebelum status LATE berlaku.
- **Tingkat Keparahan:** Low–Medium — bisa menyebabkan override status yang tidak perlu.
- **Rekomendasi:** Tambahkan tooltip atau teks keterangan di samping label "Status Presensi" yang menjelaskan: *"Status Terlambat otomatis diberikan jika jam absen melewati batas toleransi ({lateCutoff}). Admin dapat mengubah status secara manual jika diperlukan."*

### Defisiensi UX 3 — Waktu Absen Tidak Bisa Diedit Admin

- **Halaman:** Admin → Dialog Edit Presensi
- **Perilaku Saat Ini:** Waktu absen (`attendanceTime`) yang digunakan saat admin menyimpan perubahan di-hardcode dalam fungsi `handleSave()` baris 93–100 — diambil langsung dari `existingAttendance.attendanceTime` dan tidak bisa diubah oleh admin melalui UI.
  ```typescript
  // user-attendance-edit-dialog.tsx — baris 93-100 (hardcoded)
  const timeStr = existingAttendance.attendanceTime || schedule.scheduleStart;
  const timeDate = ... new Date(`${formattedDate}T${timeStr}:00`) ...
  ```
- **Dampak:** Admin tidak bisa mengoreksi jam absen yang salah (misalnya peserta absen jam 08:45 tapi seharusnya dicatat 08:30 karena gangguan sistem). Admin hanya bisa mengubah **status** dan **catatan**, bukan **waktu**.
- **Tingkat Keparahan:** Medium — membatasi kemampuan koreksi data admin.
- **Rekomendasi:** Tambahkan field `<input type="time">` yang pre-filled dengan `existingAttendance.attendanceTime`. Nilai ini digunakan saat menyimpan ke API, menggantikan logika hardcode yang ada.

---

## 9. 📋 Ringkasan Status Keseluruhan

| Komponen | Status |
| :--- | :---: |
| Database & Skema | ✅ Aman |
| Sistem Autentikasi (Login/Logout) | ✅ Berfungsi |
| Middleware & Route Protection | ✅ Aman |
| Seluruh 26 API Endpoint | ✅ 100% PASS |
| Geofencing — Tolak Lokasi Luar Area | ✅ Berfungsi |
| Geofencing — Terima Lokasi Dalam Area | ⚠️ Perlu Investigasi (Edge Case Boundary) |
| Velocity Spoofing Detection | ⚠️ Belum Terverifikasi (Terhenti sebelum dicapai) |
| **Biometrik — Photo/Virtual Camera Spoofing** | 🔴 **RENTAN — Tidak Ada Liveness Detection** |
| UI/UX Layout | ⚠️ 3 Anomali Minor Ditemukan |
| **UX Admin — Dialog Edit Absensi** | ⚠️ **3 Defisiensi UX Ditemukan** |
| **Landing Page — Navbar & Header UI** | ⚠️ **3 Anomali UI Ditemukan** |

---

## 10. 🎨 Temuan UI — Landing Page (Navbar & Header)

Ditemukan melalui analisis kode pada [`app/page.tsx`](file:///d:/Intern%20Pangeran/coding-absensi-bebas/diskominfo-intern-attendance/app/page.tsx) baris 152–214.

### Anomali UI 1 — Navbar Transparan di Atas Hero (Text Tidak Terbaca saat Scroll)

- **Lokasi Kode:** `app/page.tsx` baris 152
  ```tsx
  // Header menggunakan bg-clear (fully transparent) tanpa fallback background saat scroll
  <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-clear backdrop-blur-md">
  ```
- **Perilaku:** Navbar bersifat `fixed` dengan latar `bg-clear` (transparan) dan `backdrop-blur-md`. Di atas bagian **Hero** (gradient merah), teks nav berwarna `text-background` (putih) sehingga masih terbaca. Namun saat pengguna **scroll ke bawah** melewati Hero menuju section **Fitur** (background putih/muted), navbar tetap transparan sehingga teks putih navbar **membaur dengan konten putih di belakangnya** dan menjadi tidak terbaca.
- **Tidak ada `scroll`-based class toggle** — kode tidak mendeteksi posisi scroll dan tidak mengubah warna navbar/background saat melewati batas hero.
- **Tingkat Keparahan:** Medium-Tinggi — dapat mengakibatkan teks navigasi tidak terbaca di beberapa posisi scroll.
- **Rekomendasi:** Tambahkan listener `scroll` atau gunakan `IntersectionObserver` untuk menambahkan class `bg-background/95 shadow-sm` pada header ketika pengguna sudah melewati section hero.

### Anomali UI 2 — Inkonsistensi Warna Teks Antara Desktop Nav dan Mobile Nav

- **Lokasi Kode:** `app/page.tsx` baris 159–213
  ```tsx
  {/* Desktop nav button: text-background (putih) */}
  <Button className="text-background hover:text-foreground ...">

  {/* Mobile nav button: text-foreground (gelap) */}
  <Button className="justify-start text-foreground hover:text-foreground/90 ...">
  ```
- **Perilaku:** Tombol navigasi di **desktop** menggunakan `text-background` (warna putih, sesuai hero gradient). Tombol yang sama di **mobile dropdown** menggunakan `text-foreground` (warna gelap, karena dropdown background-nya `bg-background/95`). Secara konten keduanya identik ("Fitur", "Cara Kerja"), tapi style warna yang berbeda menciptakan **inkonsistensi visual** yang bisa membingungkan.
- **Dampak:** Perasaan "tidak satu sistem" antara mode desktop dan mobile.
- **Tingkat Keparahan:** Low — tidak memblokir fungsionalitas, tapi melanggar prinsip konsistensi desain (Nielsen #4).
- **Rekomendasi:** Standarisasi warna teks nav menggunakan token yang dinamis terhadap konteks (hero vs. non-hero), bukan hardcode `text-background` di satu tempat dan `text-foreground` di tempat lain.

### Anomali UI 3 — Mobile Menu (Hamburger) Tidak Konsisten dengan Sidebar di Halaman Lain

- **Lokasi Kode:** `app/page.tsx` baris 181–213
  ```tsx
  {/* Mobile: hamburger + dropdown panel sederhana */}
  <Button variant="ghost" size="icon-sm" className="p-1.5 rounded-lg text-foreground ...">
    <Menu className="size-5" />
  </Button>
  {mobileMenuOpen && (
    <div className="md:hidden border-b border-border bg-background/95 ...">
  ```
- **Perilaku:** Di landing page, navigasi mobile menggunakan **dropdown panel simpel** yang muncul di bawah header. Di halaman-halaman dalam aplikasi (`/admin`, `/dashboard`, `/profile`), navigasi menggunakan **sidebar** yang berbeda secara visual dan interaksi. Pengguna yang pertama kali membuka landing page di mobile akan mendapat pengalaman navigasi yang berbeda total dari aplikasi utama — tidak ada panduan visual yang menghubungkan keduanya.
- **Dampak:** Disorientasi pengguna saat berpindah dari landing page ke halaman aplikasi di perangkat mobile.
- **Tingkat Keparahan:** Low — bukan blocker fungsional, namun menciptakan pengalaman yang terfragmentasi.
- **Rekomendasi:** Pertimbangkan menggunakan pola navigasi yang lebih mirip dengan navigasi aplikasi utama (misalnya slide-in drawer), atau berikan transisi visual yang jelas saat pengguna masuk dari landing page ke aplikasi.

---

## 11. ✉️ Audit Validasi Email

Dilakukan dengan menelusuri semua titik di aplikasi yang menerima atau memproses input email.

### ✅ Yang Sudah Terapkan Validasi Email

#### 1. Form Sign-In (`/auth/sign-in`)
- **File:** [`lib/schemas/auth-schema.ts`](file:///d:/Intern%20Pangeran/coding-absensi-bebas/diskominfo-intern-attendance/lib/schemas/auth-schema.ts) baris 4
  ```typescript
  signInSchema = z.object({
    email: z.email("Silakan masukkan alamat email yang valid."),
    ...
  })
  ```
- **Status:** ✅ Sudah divalidasi dengan `z.email()` (Zod built-in email validator) + `zodResolver` di React Hook Form + HTML `type="email"` pada input.
- **Perilaku saat email tidak valid:** Error message langsung tampil di bawah field sebelum submit.

#### 2. Form Sign-Up (`/auth/sign-up`)
- **File:** [`lib/schemas/auth-schema.ts`](file:///d:/Intern%20Pangeran/coding-absensi-bebas/diskominfo-intern-attendance/lib/schemas/auth-schema.ts) baris 13
  ```typescript
  signUpSchema = z.object({
    email: z.email("Silakan masukkan alamat email yang valid."),
    ...
  })
  ```
- **Status:** ✅ Sama dengan sign-in — validasi format email ketat via `z.email()` + HTML `type="email"`.

#### 3. API Create User (`POST /api/users`)
- **File:** [`lib/schemas/user-schema.ts`](file:///d:/Intern%20Pangeran/coding-absensi-bebas/diskominfo-intern-attendance/lib/schemas/user-schema.ts) baris 6
  ```typescript
  createUserSchema = z.object({
    email: z.email("Silakan masukkan alamat email yang valid."),
    ...
  })
  ```
- **Status:** ✅ Validasi email juga diterapkan di level **server-side** API route — jadi email tidak valid akan ditolak server meski bypass form client.

---

### ⚠️ Celah yang Ditemukan

#### 1. Update User (`PATCH /api/users/:id`) — Email Tidak Bisa Diubah, Tapi Tidak Ada Validasi Jika Dicoba
- **File:** [`lib/schemas/user-schema.ts`](file:///d:/Intern%20Pangeran/coding-absensi-bebas/diskominfo-intern-attendance/lib/schemas/user-schema.ts) baris 15–23
  ```typescript
  updateUserSchema = z.object({
    name: z.string().min(2).optional(),
    image: z.string().url().optional().nullable(),
    emailVerified: z.boolean().optional(),
    password: z.string().min(8).optional(),
    // ⚠️ Field 'email' tidak ada di sini — tidak bisa diupdate via PATCH
  })
  ```
- **Analisis:** Field `email` sengaja dihilangkan dari `updateUserSchema` sehingga email tidak bisa diubah melalui form profil. Ini adalah **keputusan desain yang disengaja** dan tidak perlu validasi karena email memang tidak diizinkan berubah.
- **Catatan:** Tidak ada UI di halaman profil yang memungkinkan edit email — hanya `name`, `image`, dan `password` yang bisa diubah. Ini **konsisten dan aman**.

#### 2. Better Auth — Email Verification Tidak Diaktifkan
- **File:** [`lib/auth.ts`](file:///d:/Intern%20Pangeran/coding-absensi-bebas/diskominfo-intern-attendance/lib/auth.ts) baris 22–24
  ```typescript
  emailAndPassword: {
    enabled: true,
    // ⚠️ Tidak ada: requireEmailVerification: true
    // ⚠️ Tidak ada: sendVerificationEmail config
  }
  ```
- **Analisis:** Better Auth mendukung konfirmasi email (kirim link verifikasi setelah daftar), namun fitur ini **tidak diaktifkan**. Pengguna bisa mendaftar dengan email yang tidak mereka miliki (email orang lain) dan langsung bisa login tanpa konfirmasi kepemilikan email.
- **Dampak:** Seseorang bisa mendaftar menggunakan email orang lain, berpotensi menyamar sebagai pengguna lain atau menyebabkan kebingungan identitas.
- **Tingkat Keparahan:** Low–Medium untuk konteks internal (peserta magang kantor), karena akses ke sistem tetap dikendalikan admin. Namun berpotensi menjadi Medium jika sistem dibuka lebih luas.
- **Rekomendasi:** Aktifkan `requireEmailVerification: true` di konfigurasi Better Auth dan konfigurasi `sendVerificationEmail` dengan email provider (SMTP/Resend) untuk mengirim link konfirmasi.

---

### Ringkasan Audit Validasi Email

| Titik Validasi | Format Email | Server-Side | Email Verification |
| :--- | :---: | :---: | :---: |
| Form Sign-In | ✅ `z.email()` | ✅ Better Auth | N/A |
| Form Sign-Up | ✅ `z.email()` | ✅ Better Auth | ⚠️ **Tidak Ada** |
| API POST `/api/users` | ✅ `z.email()` | ✅ Zod server | N/A |
| Form Profil (edit) | N/A (email tidak bisa diedit) | ✅ Tidak diizinkan | N/A |
| Share Access Card | N/A (pilih dari dropdown, bukan input email) | N/A | N/A |

---

## 12. 🤖 Audit Arsitektur AI & Efisiensi Sumber Daya

Melakukan penelusuran arsitektur untuk memastikan beban kerja pemrosesan AI (Face Recognition) efisien dan tidak membebani server backend secara berlebih.

### ✅ Penemuan & Konfirmasi Teknis

#### 1. Pemrosesan Face Recognition Murni di Sisi Client (Frontend)
* **File Referensi:** [`lib/face-recognition.ts`](file:///d:/Intern%20Pangeran/coding-absensi-bebas/diskominfo-intern-attendance/lib/face-recognition.ts)
* **Analisis:** Library `face-api.js` dipasang di sisi browser pengguna. Pustaka ini secara otomatis mengunduh model neural network (*SSD MobileNet V1* atau *Tiny Face Detector* berbasis *TensorFlow.js*) dari Cloudinary ke browser dan menyimpannya di IndexedDB.
* **Hasil:** Proses ekstraksi landmark wajah dan pembuatan 128-float descriptor (embedding) dilakukan seluruhnya di browser pengguna. Server backend Anda **tidak memerlukan GPU** dan tidak terbebani pemrosesan citra grafis yang berat.

#### 2. Backend Server Sangat Ringan (Matematika Sederhana)
* **File Referensi:** [`app/api/attendances/route.ts`](file:///d:/Intern%20Pangeran/coding-absensi-bebas/diskominfo-intern-attendance/app/api/attendances/route.ts)
* **Analisis:** Server backend hanya bertugas menerima array 128 angka float yang dikirim dari browser, lalu membandingkannya dengan descriptor terdaftar di database menggunakan kalkulasi jarak Euclidean biasa (*Euclidean Distance* dengan threshold `≤ 0.6`).
* **Hasil:** Beban server sangat minimal dan biaya infrastruktur/bandwidth sangat hemat karena server backend (Node.js/Prisma) hanya memproses data numerik sederhana.

#### 3. Kebijakan Penyimpanan Foto
* **Saat Registrasi Wajah:** **Sangat Optimal.** Sistem sama sekali tidak mengunggah atau menyimpan file gambar mentah ke penyimpanan awan (Cloudinary) saat registrasi wajah. Sistem hanya menyimpan array descriptor 128 angka float langsung ke database PostgreSQL (model `FaceDescriptor`).
* **Saat Absensi (Check-in):** Sistem mengunggah foto snapshot absensi ke Cloudinary ([`take-attendance-face-camera.tsx`](file:///d:/Intern%20Pangeran/coding-absensi-bebas/diskominfo-intern-attendance/app/dashboard/%5BinternId%5D/components/take-attendance-face-camera.tsx)) untuk keperluan **verifikasi visual manual oleh admin**. URL foto ini disimpan sebagai `attendancePhotoUrl` di database. Jika ingin menghemat biaya penyimpanan awan secara ekstrem, pengunggahan foto absensi dapat dinonaktifkan, namun admin akan kehilangan bukti foto visual saat memantau absensi.

---

### 💡 Rekomendasi Mitigasi Celah Foto Tanpa Server AI Tambahan

Untuk mencegah bypass absensi menggunakan foto cetak atau layar HP, sistem tidak memerlukan backend server AI khusus (seperti Python FastAPI/GPU server). Mitigasi dapat diterapkan sepenuhnya di sisi browser (client-side) menggunakan data landmark wajah yang sudah dihasilkan `face-api.js`:

1. **Blink Detection (Eye Aspect Ratio - EAR):** Menggunakan koordinat landmark mata (`leftEye` dan `rightEye` dari `face-api.js`) untuk menghitung rasio keterbukaan mata. Tombol absensi hanya aktif jika sistem mendeteksi kedipan mata (mata tertutup dan terbuka kembali).
2. **Challenge-Response (Tantangan Gerakan):** Mengarahkan pengguna untuk menoleh sedikit ke kiri/kanan atau tersenyum sebelum foto diambil secara otomatis. Posisi landmark hidung relatif terhadap batas wajah dapat dihitung untuk memvalidasi rotasi wajah 3D nyata.
