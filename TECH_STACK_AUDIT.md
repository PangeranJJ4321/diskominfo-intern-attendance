# Laporan Audit Keamanan & Teknis Dependensi
`diskominfo-intern-attendance`

Dokumen ini berisi hasil audit keamanan dependensi proyek **Diskominfo Intern Attendance** berdasarkan data audit real-time dari terminal (`npm audit`).

> [!WARNING]
> Dokumen ini hanya bersifat **auditing dan penasehat (advisory)**. Tidak ada perubahan kode atau instalasi paket yang dilakukan secara otomatis pada proyek ini sesuai permintaan pengguna.

---

## 📊 1. Inventarisasi Teknologi (Tech Stack Inventory)

*   **Framework**: Next.js `16.2.7` / React `19.2.4`
*   **State Management**: Zustand `^5.0.14`
*   **Database ORM**: Prisma `^7.8.0` / Kysely `^0.28.17`
*   **Autentikasi**: Better-Auth `^1.6.13`
*   **GIS / Map**: Leaflet `^1.9.4` / React-Leaflet `^5.0.0`
*   **Biometrik (Wajah)**: Face-api.js `^0.22.2`

---

## 🛡️ 2. Ringkasan Audit Keamanan (`npm audit`)

Berdasarkan hasil pemindaian terminal, ditemukan **11 celah keamanan (vulnerabilities)** yang terbagi menjadi:
*   **3 Low**
*   **5 Moderate**
*   **3 High**

Berikut rincian celah keamanan beserta analisis dampaknya:

### 1. `xlsx` (SheetJS)
*   **Tingkat Kerawanan**: High (Tinggi)
*   **Jenis Celah Keamanan**: Prototype Pollution (GHSA-4r6h-8v6p-xvw6) & Regular Expression Denial of Service (ReDoS) (GHSA-5pgg-2g8v-p4x9).
*   **Lokasi Dependensi**: Direct dependency (`node_modules/xlsx`).
*   **Analisis Dampak**: Penyerang dapat menyuntikkan properti khusus ke dalam prototype objek global JavaScript, berpotensi memicu kegagalan sistem (Denial of Service) atau eksekusi kode tidak terduga pada server/client saat memproses file Excel yang dimodifikasi secara jahat.
*   **Status Perbaikan**: Tidak tersedia melalui `npm audit fix` biasa karena SheetJS tidak lagi meng-update paket bernama `xlsx` di NPM publik.

### 2. `node-fetch` (Dependensi Transitif `face-api.js`)
*   **Tingkat Kerawanan**: High (Tinggi)
*   **Jenis Celah Keamanan**: Header leak ke situs eksternal saat redirect (GHSA-r683-j2x4-v87g) & Pengabaian opsi limit ukuran file setelah redirect (GHSA-w7rc-rwvf-8q5r).
*   **Lokasi Dependensi**: `face-api.js` -> `@tensorflow/tfjs-core` -> `node-fetch`.
*   **Analisis Dampak**: Karena `face-api.js` menggunakan TensorFlow.js Core yang mengandalkan `node-fetch` versi lama (`<=2.6.6`), terdapat risiko kebocoran header otorisasi sensitif jika fungsi deteksi wajah memanggil URL eksternal yang dialihkan (redirect) ke host jahat.
*   **Bahaya `npm audit fix --force`**: Jika Anda memaksa fix otomatis, npm akan mendowngrade `face-api.js` ke `0.20.0` (breaking change), yang kemungkinan besar akan merusak fitur pencocokan wajah absensi.

### 3. `hono` & `@hono/node-server` (Dependensi Transitif `prisma`)
*   **Tingkat Kerawanan**: High & Moderate
*   **Jenis Celah Keamanan**: Path traversal pada Windows lewat encoded backslash `%5C` (GHSA-wwfh-h76j-fc44), CORS Reflections, Body Limit Bypass, dan bypass statis.
*   **Lokasi Dependensi**: `prisma` -> `@prisma/dev` -> `@hono/node-server` / `hono`.
*   **Analisis Dampak**: Kerentanan ini memengaruhi server pengembangan lokal Prisma CLI (`@prisma/dev`). Celah ini memungkinkan pembacaan berkas secara ilegal pada mesin Windows jika penyerang dapat berinteraksi dengan server lokal Prisma saat berjalan.
*   **Status Perbaikan**: Hanya berpengaruh di lingkungan development (bukan production). Perbaikan membutuhkan upgrade versi Prisma CLI.

### 4. `postcss` (Dependensi Transitif `next`)
*   **Tingkat Kerawanan**: Moderate (Sedang)
*   **Jenis Celah Keamanan**: XSS via Unescaped `</style>` dalam output stringify CSS (GHSA-qx2v-qp2m-jg93).
*   **Lokasi Dependensi**: `next` -> `postcss`.
*   **Analisis Dampak**: Kerentanan ini berpotensi memicu serangan Cross-Site Scripting (XSS) melalui injeksi tag `<style>` yang tidak difilter dengan baik oleh optimizer CSS bawaan Next.js.
*   **Bahaya `npm audit fix --force`**: Memaksa fix otomatis akan mendowngrade Next.js ke versi `9.3.3`, yang sepenuhnya merusak aplikasi Next.js v16.

### 5. `esbuild` (Dependensi Transitif Perkakas Build)
*   **Tingkat Kerawanan**: Moderate (Sedang)
*   **Jenis Celah Keamanan**: Arbitrary file read pada server dev di Windows (GHSA-g7r4-m6w7-qqqr).
*   **Lokasi Dependensi**: `node_modules/esbuild`.
*   **Analisis Dampak**: Hanya memengaruhi server development esbuild lokal di lingkungan Windows.

---

## 🎯 3. Rekomendasi Mitigasi Teknis (Saran Perbaikan Mandiri)

Sebagai pengembang, berikut langkah aman yang direkomendasikan untuk menambal celah tersebut secara manual tanpa merusak dependensi utama:

### 1. Mengatasi Masalah `xlsx` (SheetJS)
*   **Rekomendasi**: Jangan gunakan `npm install xlsx`.
*   **Opsi A (Ganti Library)**: Ganti dengan `exceljs` yang aktif dipelihara dan bebas dari celah keamanan tersebut.
*   **Opsi B (Gunakan Registry SheetJS)**: Ganti dependensi di `package.json` Anda menggunakan registry resmi SheetJS:
    ```bash
    npm uninstall xlsx
    npm install https://cdn.sheetjs.com/xlsx-0.20.1/xlsx-0.20.1.tgz
    ```

### 2. Mengatasi Masalah `node-fetch` pada `face-api.js`
*   **Rekomendasi**: Karena repositori `face-api.js` asli sudah mati, ganti library biometrik wajah ke fork komunitas yang aktif dipelihara:
    ```bash
    npm uninstall face-api.js
    npm install @vladmandic/face-api
    ```
    *Fork ini menggunakan versi TensorFlow.js terbaru yang sudah menambal celah keamanan `node-fetch`.*

### 3. Mengatasi Masalah `postcss` & `hono`
*   **Rekomendasi**: Celah keamanan ini tersimpan di dalam sub-dependensi `next` dan `prisma`. Hindari melakukan `npm audit fix --force`. Anda dapat memaksa versi sub-dependensi tertentu menggunakan fitur **overrides** di `package.json`:
    ```json
    "overrides": {
      "postcss": "^8.5.10",
      "hono": "^4.12.25",
      "@hono/node-server": "^1.19.13"
    }
    ```
    Kemudian jalankan `npm install` kembali untuk menerapkan override sub-dependensi tersebut tanpa melakukan downgrade pada Next.js atau Prisma.
