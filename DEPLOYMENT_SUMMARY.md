# Dokumentasi & Panduan Deployment Next.js Standalone ke cPanel

Dokumen ini merangkum hasil diskusi, kendala yang dihadapi selama persiapan deployment proyek **Diskominfo Intern Attendance**, serta langkah-langkah solusinya.

---

## 🔍 Ringkasan Masalah & Solusi

### 1. Masalah Inode Limit & Ukuran File di Shared Hosting
* **Kendala**: Folder `node_modules` default berisi puluhan ribu file kecil yang dapat menghabiskan kuota **Inode** pada shared hosting cPanel, serta memperlambat proses upload.
* **Solusi**: Mengaktifkan fitur **Standalone Build** di Next.js dengan menambahkan `output: "standalone"` di [next.config.ts](file:///d:/Intern%20Pangeran/coding-absensi-no-bebas/diskominfo-intern-attendance/next.config.ts). Fitur ini membuat Next.js hanya mengemas file produksi penting dan memangkas ukuran `node_modules` secara signifikan.

### 2. Masalah Permission UNIX pada ZIP Windows
* **Kendala**: Mengompresi file ke format `.zip` di Windows dan mengekstraknya di cPanel (Linux) sering kali merusak format permission file/folder Linux.
* **Solusi**: Menggunakan format `.tar.gz` (tarball) yang mempertahankan permission UNIX secara asli. Kompresi dilakukan menggunakan perintah `tar` bawaan Windows:
  ```bash
  tar -czvf project.tar.gz -C .next/standalone .
  ```

### 3. Masalah Gagal Fetch Google Fonts saat Build (Offline Build)
* **Kendala**: Saat menjalankan `npm run build` secara lokal, build gagal dengan error `Failed to fetch Geist from Google Fonts`. Ini terjadi karena modul `next/font/google` mencoba mengunduh font dari server Google, sementara lingkungan build tidak memiliki akses internet langsung.
* **Solusi**:
  * Menghapus import `next/font/google` di [layout.tsx](file:///d:/Intern%20Pangeran/coding-absensi-no-bebas/diskominfo-intern-attendance/app/layout.tsx).
  * Menambahkan definisi variabel font-family fallback langsung pada `:root` di [globals.css](file:///d:/Intern%20Pangeran/coding-absensi-no-bebas/diskominfo-intern-attendance/app/globals.css) agar menggunakan font sistem lokal secara otomatis:
    ```css
    --font-geist-sans: "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --font-geist-mono: "Geist Mono", SFMono-Regular, Consolas, monospace;
    ```
  * Setelah perubahan ini, proses build lokal berhasil diselesaikan secara offline.

---

## 🛠️ Langkah Persiapan Aplikasi (Lokal)

Semua langkah di bawah ini **sudah selesai dilakukan** di komputer lokal Anda:
1. Konfigurasi `output: "standalone"` di [next.config.ts](file:///d:/Intern%20Pangeran/coding-absensi-no-bebas/diskominfo-intern-attendance/next.config.ts).
2. Jalankan perintah kompilasi produksi:
   ```bash
   npm run build
   ```
3. Salin aset statis ke folder standalone (Next.js tidak menyalin ini secara otomatis):
   * Menyalin folder `public/` ke `.next/standalone/public/`
   * Menyalin folder `.next/static/` ke `.next/standalone/.next/static/`
4. Kompresi seluruh isi folder `.next/standalone/` menjadi satu file [project.tar.gz](file:///d:/Intern%20Pangeran/coding-absensi-no-bebas/diskominfo-intern-attendance/project.tar.gz).

### ⚡ Perintah Cepat Salin & Kompres (Langkah 3 & 4)
Setelah menjalankan `npm run build`, Anda bisa menyalin aset dan membuat file `project.tar.gz` secara otomatis dengan menjalankan satu perintah berikut di terminal lokal Anda (pilih sesuai terminal):

* **Terminal PowerShell (VS Code Default Windows)**:
  ```powershell
  Copy-Item -Path "public" -Destination ".next/standalone/public" -Recurse -Force; Copy-Item -Path ".next/static" -Destination ".next/standalone/.next/static" -Recurse -Force; Copy-Item -Path "server-cpanel.js" -Destination ".next/standalone/server-cpanel.js" -Force; tar -czhvf project.tar.gz -C .next/standalone .
  ```

* **Terminal Git Bash / Linux / macOS**:
  ```bash
  cp -r public .next/standalone/public && cp -r .next/static .next/standalone/.next/static && cp -r prisma .next/standalone/prisma && cp server-cpanel.js .next/standalone/server-cpanel.js && tar -czhvf project.tar.gz -C .next/standalone .

  ```

* **Terminal Command Prompt (CMD)**:
  ```cmd
  xcopy /s /e /y public .next\standalone\public\ && xcopy /s /e /y .next\static .next\standalone\.next\static\ && copy server-cpanel.js .next\standalone\server-cpanel.js && tar -czhvf project.tar.gz -C .next/standalone .
  ```

---

## 4. Persistensi Data (Penyimpanan Foto)

Aplikasi kini menggunakan **penyimpanan file lokal (On-Premise)**, bukan lagi Cloudinary. 
Karena Next.js *standalone* selalu menghapus dan menimpa isi *root directory* saat _redeploy_, diperlukan langkah agar **foto profil pengguna tidak hilang**.

Script `server-cpanel.js` dan API upload dirancang agar menyimpan gambar secara persisten di folder luar aplikasi.

- Secara default, aplikasi versi produksi akan membaca/menulis dari folder: `../storage_absensi` (satu level di atas folder `.next/standalone`).
- Anda bisa menimpa letak folder ini dengan menambahkan *Environment Variable* `UPLOAD_DIR` di panel konfigurasi Node.js aplikasi cPanel Anda (contoh: `/home/username/storage_rahasia`).

**Yang harus dilakukan saat deploy:**
Pastikan folder aplikasi cPanel Anda memiliki struktur seperti ini:
```text
/home/user/storage_absensi/     <-- Foto disimpan di sini secara aman (Tidak ikut terhapus saat redeploy)
/home/user/public_html/
 ├── .env
 ├── server-cpanel.js
 ├── package.json
 └── ... (File-file hasil ekstrak project.tar.gz)
```
Tidak perlu melakukan apa-apa lagi! Script wrapper `server-cpanel.js` akan cerdas mencegat rute `/uploads/*` dan otomatis memanggil isi dari direktori eksternal (`storage_absensi`) tersebut.


---

## 🚀 Panduan Detail Setup di cPanel

Ikuti langkah-langkah berikut untuk menjalankan aplikasi di cPanel Anda:

### Langkah 1: Ekstrak File di File Manager cPanel
1. Masuk ke **File Manager** cPanel dan buka folder tujuan aplikasi Anda (misal: `/home/intrntst/diskominfo-intern-attendance-8/`).
2. Aktifkan tampilan file tersembunyi dengan mengklik tombol **Settings** (pojok kanan atas) -> centang **Show Hidden Files (dotfiles)** -> klik **Save**.
3. Cari file `project.tar.gz` yang sudah Anda unggah.
4. Klik kanan file `project.tar.gz` tersebut, pilih **Extract**, dan konfirmasi lokasi ekstraksi di folder aplikasi tersebut.
5. Setelah ekstraksi selesai, pastikan Anda melihat struktur folder berikut:
   * `.next/`
   * `node_modules/`
   * `public/`
   * `package.json`
   * `server.js`
   * `.env`
6. **Hapus file `project.tar.gz`** untuk menghemat ruang penyimpanan hosting. **Biarkan file `.env` tetap ada** karena aman berada di luar folder `public_html`.

### Langkah 2: Setup di Node JS Applications Manager
Buka menu **Setup Node.js App** di cPanel Anda dan sesuaikan konfigurasinya:
* **NodeJS Version**: Pilih versi **`20.3.0`** (atau versi `20.x` yang tersedia).
* **Application mode**: Pilih **`Production`**.
* **Application root (Path)**: Isi dengan path tempat aplikasi diekstrak (contoh: `diskominfo-intern-attendance-8`).
* **Application startup file**: Ketik **`server.js`** (ini adalah file server bawaan dari output standalone Next.js Anda).
* **URL**: Hubungkan dengan subdomain Anda (misal: `testing-intern-attendance.diskominfo.makassarkota.go.id`).

### Langkah 3: Konfigurasi Environment Variables
Di bagian bawah halaman Node JS Applications Manager, tambahkan variabel lingkungan berikut:
1. `NODE_ENV` = `production`
2. `DATABASE_URL` = *(isi dengan URL database PostgreSQL/MySQL produksi Anda)*
3. `BETTER_AUTH_SECRET` = *(isi dengan secret key auth Anda)*
4. `BETTER_AUTH_URL` = `https://testing-intern-attendance.diskominfo.makassarkota.go.id` *(sesuaikan dengan URL subdomain aplikasi)*
5. Tambahkan variabel lainnya dari file `.env` Anda jika diperlukan.

### Langkah 4: Migrasi Database (Prisma)
Jika database di cPanel Anda masih kosong atau belum memiliki tabel:
Hubungkan database cPanel Anda ke komputer lokal untuk sementara (atau buka port akses database cPanel ke IP publik Anda), lalu jalankan perintah ini di terminal lokal Anda:
```bash
npx prisma db push
```

### Langkah 5: Start/Restart Aplikasi
* Kembali ke halaman **Setup Node.js App** cPanel.
* Klik tombol **Save** untuk menyimpan perubahan.
* Klik tombol **Start** (atau **Restart** jika sudah menyala) untuk menjalankan aplikasi.
* Buka subdomain Anda di browser untuk memastikan aplikasi berjalan dengan normal.
