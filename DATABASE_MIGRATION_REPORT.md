# Laporan Migrasi Database (PostgreSQL ke MySQL)
`diskominfo-intern-attendance`

Dokumen ini berisi dokumentasi detail mengenai proses transisi database proyek **Diskominfo Intern Attendance** dari PostgreSQL (Serverless Neon DB) ke MySQL (on-premise / CWP Hosting), serta langkah-langkah migrasi data yang telah dilaksanakan.

---

## 🏛️ 1. Perubahan Konfigurasi Kode (Database Configuration)

Agar aplikasi dapat beroperasi menggunakan MySQL dengan benar di runtime Node.js/cPanel, beberapa berkas konfigurasi diubah sebagai berikut:

### A. Skema Database (`prisma/schema.prisma`)
*   **Mengubah Provider**: Mengganti provider datasource dari `"postgresql"` menjadi `"mysql"`.
*   **Mengubah Generator**: Mengganti generator provider ke standard `"prisma-client-js"`.
*   **Mencegah Truncation Token**: Menambahkan anotasi tipe data `@db.Text` pada field token OAuth di model `Account` agar token yang panjang (misalnya Google access token atau refresh token) tidak terpotong (MySQL default `VARCHAR(191)`).
    ```prisma
    model Account {
      id                    String    @id @default(cuid())
      accountId             String
      providerId            String
      userId                String
      accessToken           String?   @db.Text
      refreshToken          String?   @db.Text
      idToken               String?   @db.Text
      ...
    }
    ```

### B. Prisma Client Helper (`lib/prisma.ts`)
*   **Menghapus Adapter Postgres**: Menghapus dependensi `@prisma/adapter-pg` dan class `PrismaPg`.
*   **Driver Adapter MariaDB**: Menggunakan `@prisma/adapter-mariadb` dan driver `mariadb` untuk koneksi runtime MySQL.
*   **Helper Parsing URL**: Menambahkan fungsi `getAdapter()` untuk melakukan parsing koneksi URL MySQL secara dinamis ke parameter yang dibutuhkan oleh adapter (`host`, `port`, `user`, `password`, `database`).
    ```typescript
    import { PrismaClient } from "@/app/generated/prisma/client";
    import { PrismaMariaDb } from "@prisma/adapter-mariadb";

    function getAdapter(): PrismaMariaDb {
      const mysqlUrl = process.env.DATABASE_URL;
      if (!mysqlUrl) {
        throw new Error("DATABASE_URL is not defined");
      }
      const parsedUrl = new URL(mysqlUrl);
      const user = decodeURIComponent(parsedUrl.username);
      const password = decodeURIComponent(parsedUrl.password);
      const host = parsedUrl.hostname;
      const port = parsedUrl.port ? parseInt(parsedUrl.port) : 3306;
      const database = parsedUrl.pathname.replace(/^\//, '');

      return new PrismaMariaDb({
        host,
        port,
        user,
        password,
        database,
        connectionLimit: 10,
      });
    }
    ```

### C. Better-Auth Configuration (`lib/auth.ts`)
*   **Mengubah Provider Adapter**: Mengganti konfigurasi adapter database Better-Auth dari `"postgresql"` ke `"mysql"`.
*   **Menggunakan Client MariaDB**: Menghubungkan client Prisma yang diinisialisasi menggunakan `@prisma/adapter-mariadb` ke instance Better-Auth.

### D. Seeder Database (`prisma/seed.ts`)
*   **Migrasi Inisialisasi**: Menghapus adapter serverless PostgreSQL (`PrismaPg`) dan menggantinya dengan inisialisasi driver adapter MySQL/MariaDB (`PrismaMariaDb`).

---

## 💾 2. Migrasi Data (PostgreSQL Neon ke MySQL CWP)

Untuk memindahkan data yang sudah ada, dibuat sebuah script migrasi terpisah di **`prisma/migrate-data.ts`**.

### Mekanisme Script Migrasi:
1.  **Koneksi Ganda**: Membuka koneksi pembacaan ke PostgreSQL Neon (via driver `pg`) dan koneksi penulisan ke MySQL target (via `PrismaClient` dengan adapter MariaDB).
2.  **Pembersihan Awal**: Menghapus data target di MySQL dengan menonaktifkan pemeriksaan foreign key sementara (`SET FOREIGN_KEY_CHECKS = 0;`) untuk memastikan data bersih tanpa konflik indeks.
3.  **Topological Sort Migration**: Memigrasikan tabel sesuai urutan relasi foreign key agar tidak melanggar batasan integritas referensial:
    *   `User` & `Institution`
    *   `Session`, `Account`, `FaceDescriptor`
    *   `Agency` *(di-insert dengan `defaultShiftId: null` terlebih dahulu)*
    *   `Shift`
    *   *Restore link* `defaultShiftId` pada tabel `Agency`
    *   `AgencyAccess`, `AgencyHoliday`, `AgencyArea`, `AgencyRule`
    *   `Intern`
    *   `ShiftAssignment`, `Schedule`, `LocationLog`
    *   `Attendance`

---

## 📈 3. Hasil Verifikasi Sistem

Proses migrasi dan transisi ini telah divalidasi dan diuji secara menyeluruh dengan hasil sebagai berikut:

### A. Sinkronisasi Skema Database
Menjalankan perintah `npx prisma db push` berhasil membuat seluruh tabel relasional absensi di database MySQL CWP hosting Anda (`103.151.20.177:3306`):
```bash
Your database is now in sync with your Prisma schema. Done in 2.84s
```

### B. Output Eksekusi Migrasi Data
Eksekusi script `npx tsx prisma/migrate-data.ts` berhasil menyalin data dari Neon PG ke target MySQL:
*   **User**: 3 record dipindahkan.
*   **Institution**: 1 record dipindahkan.
*   **Session**: 3 record dipindahkan.
*   **Account**: 3 record dipindahkan.
*   **Agency**: 1 record dipindahkan.
*   **Shift**: 1 record dipindahkan.
*   **AgencyArea**: 1 record dipindahkan.
*   **AgencyRule**: 1 record dipindahkan.
*   **AgencyAccess**: 1 record dipindahkan.
*   **AgencyHoliday**: 16 record dipindahkan.
*   **Intern**: 1 record dipindahkan.
*   **ShiftAssignment**: 1 record dipindahkan.
*   **Schedule**: 2 record dipindahkan.
*   **LocationLog**: 4 record dipindahkan.

### C. Pengujian Seeder (`npx prisma db seed`)
Seeder dijalankan dan berhasil mengenali data yang sudah termigrasi tanpa membuat record duplikat:
```text
User with email admin@buildwithjj.store already exists. ID: cb9y06kkzzbuczufc0d7plzwi
Credential account already exists.
Institution "Universitas Hasanuddin" already exists. ID: cviyxrq05bnw2540kx1th3ae5
Agency "Diskominfo Kota Makassar" already exists. ID: c6rib4p93a0067m45qylefn0z
Seeding finished successfully!
```

### D. Production Build Test (`npm run build`)
Aplikasi berhasil dicompile secara utuh tanpa ada error TypeScript atau error Turbopack:
```bash
✓ Compiled successfully in 5.2s
  Running TypeScript ...
  Finished TypeScript in 5.7s ...
  Collecting page data using 19 workers ...
  Generating static pages using 19 workers (23/23)
  Finalizing page optimization ...
```

---

## 🚀 4. Langkah Pengaturan di cPanel (Production)

Saat mengunggah proyek ini ke cPanel File Manager:
1.  **Buat Database & User**: Buat database (`intrntst_absensi`) dan user (`intrntst_user1`) di cPanel MySQL Databases. Hubungkan user ke database dengan mencentang **semua privileges** (baik kelompok **Data** maupun **Structure**).
2.  **Konfigurasi File `.env`**:
    Tuliskan URL koneksi menggunakan database lokal (karena NextJS & MySQL berada di server yang sama):
    ```env
    DATABASE_URL="mysql://intrntst_user1:absen@127.0.0.1:3306/intrntst_absensi"
    ```
3.  **Jalankan Build**: Jalankan build Next.js di server cPanel untuk menghasilkan folder `.next` yang siap dijalankan.
