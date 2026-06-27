# E2E Testing & Analisis Skenario Edge Case

Dokumen ini mencatat temuan dari pengujian End-to-End (E2E) dan audit logika bisnis pada sistem absensi `diskominfo-intern-attendance`, khususnya mengenai skenario pengiriman ganda (double-click) dan kesalahan validasi tanggal.

---

## 1. ⚡ Skenario: Menekan Tombol Absen 2x Secara Cepat (Double Submission)

### 🔍 Hasil Analisis Kode & Alur Kerja

#### Sisi Client (Frontend)
* **File Referensi:** [`take-attendance-card.tsx`](file:///d:/Intern%20Pangeran/coding-absensi-bebas/diskominfo-intern-attendance/app/dashboard/%5BinternId%5D/components/take-attendance-card.tsx)
* **Kondisi:** Tombol absensi menggunakan atribut `disabled={!canSubmitAttendance}` di mana salah satu syarat `canSubmitAttendance` adalah `!isSubmitting`.
* **Analisis Celah:** Karena pembaruan state di React bersifat asinkronus (batched), jika pengguna melakukan klik ganda (double-click) yang sangat cepat (kurang dari 50ms), kedua event klik dapat diproses sebelum `isSubmitting` diubah menjadi `true` dan merender ulang tombol dalam keadaan *disabled*. Hal ini membuat browser mengirimkan dua request HTTP POST secara paralel ke backend.

#### Sisi Server (Backend)
* **File Referensi:** [`app/api/attendances/route.ts`](file:///d:/Intern%20Pangeran/coding-absensi-bebas/diskominfo-intern-attendance/app/api/attendances/route.ts)
* **Kondisi:** Skema database memiliki constraint unik `@@unique([internId, scheduleId, date])`.
* **Analisis Masalah:** 
  1. Constraint di database akan memblokir request kedua untuk mencegah adanya data absensi ganda (duplikat). Ini adalah jaminan integritas data yang baik.
  2. Namun, pada level kode API route, **tidak ada penanganan khusus (try-catch)** untuk kesalahan *Unique Constraint Violation* dari Prisma (Error code `P2002`).
  3. Ketika request ganda terjadi, error tersebut akan ditangkap oleh blok `catch (error)` umum dan server mengembalikan respons **HTTP 500 Internal Server Error** dengan JSON `{ "error": "Internal Server Error" }`.
* **Rekomendasi Pembenahan:** Ubah penanganan error di API untuk mendeteksi `PrismaClientKnownRequestError` dengan kode `P2002` dan kembalikan respons **HTTP 409 Conflict** (contoh: `{ "error": "Anda sudah mengisi presensi untuk jadwal ini hari ini." }`) agar lebih user-friendly.

---

## 2. 📅 Skenario: Format Tanggal Salah (Invalid Calendar Date)

### 🔍 Hasil Analisis Kode & Alur Kerja

#### Sisi Validasi (Zod Schema)
* **File Referensi:**
  * [`lib/schemas/attendance-schema.ts`](file:///d:/Intern%20Pangeran/coding-absensi-bebas/diskominfo-intern-attendance/lib/schemas/attendance-schema.ts)
  * [`lib/schemas/shift-assignment-schema.ts`](file:///d:/Intern%20Pangeran/coding-absensi-bebas/diskominfo-intern-attendance/lib/schemas/shift-assignment-schema.ts)
  * [`lib/schemas/holiday-schema.ts`](file:///d:/Intern%20Pangeran/coding-absensi-bebas/diskominfo-intern-attendance/lib/schemas/holiday-schema.ts)
* **Kondisi:** Zod memvalidasi tanggal menggunakan ekspresi reguler berikut:
  ```typescript
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  date: z.string().regex(dateRegex, "Format tanggal harus YYYY-MM-DD.")
  ```
* **Analisis Celah:** 
  * Ekspresi reguler `/^\d{4}-\d{2}-\d{2}$/` **hanya memvalidasi pola karakter** (harus angka 4-2-2 dipisah tanda hubung). Regex ini **tidak memeriksa validitas kalender**.
  * Input tanggal tidak valid seperti `"2026-02-31"` (31 Februari) atau `"2026-99-99"` akan **lolos** dari validasi Zod karena polanya cocok.
  * Karena kolom `date` di database bertipe `String` (bukan `DateTime`), database PostgreSQL akan menerima dan menyimpan nilai `"2026-09-99"` tersebut tanpa ada error.

#### Dampak Fatal saat Penarikan Laporan
Ketika admin mengekspor data ke Excel ([`export-attendance-dialog.tsx`](file:///d:/Intern%20Pangeran/coding-absensi-bebas/diskominfo-intern-attendance/app/admin/%5BagencyId%5D/components/export-attendance-dialog.tsx)) atau saat calendar rendering melakukan parsing tanggal tersebut menggunakan library JavaScript (`Date` atau `date-fns`):
1. Parsing `"2026-09-99"` akan menghasilkan nilai **`Invalid Date`**.
2. Hal ini dapat memicu crash aplikasi, tampilan kalender kosong, atau kolom Excel berisi data rusak/kosong.
* **Rekomendasi Pembenahan:** Gunakan metode `.refine()` pada Zod untuk memvalidasi bahwa string tersebut adalah tanggal kalender yang valid secara logis.
  ```typescript
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD.")
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Tanggal kalender tidak valid.",
    })
  ```

---

## 3. 🔄 Rekomendasi Efisiensi Kode: Refaktorisasi Boilerplate & Custom Exception

Saat menelusuri API routes, ditemukan duplikasi kode yang sangat masif pada bagian autentikasi dan otorisasi sesi.

### Contoh Duplikasi Kode (Boilerplate) di Setiap API Route
Kode di bawah ini diulang puluhan kali di hampir setiap method GET, POST, PATCH, DELETE:
```typescript
const session = await auth.api.getSession({
  headers: await headers(),
});
if (!session?.user?.id) {
  return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
}

const dbUser = await prisma.user.findUnique({
  where: { id: session.user.id },
  include: { agencyAccesses: true },
});
if (!dbUser) {
  return NextResponse.json({ error: "User account not found" }, { status: 404 });
}

const ability = defineAbilityFor(dbUser);
if (!ability.can("create", "Attendance")) {
  return NextResponse.json({ error: "Forbidden: Missing access credentials." }, { status: 403 });
}
```

### Usulan Solusi 1: Penggunaan Wrapper/Higher-Order Function (HOF)
Kita bisa membuat helper wrapper bernama `withAuth` untuk membungkus handler API, sehingga boilerplate di atas cukup ditulis satu kali di file utility.

**Contoh Implementasi Helper (`lib/api-middleware.ts`):**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { defineAbilityFor } from "@/lib/casl";

type AuthenticatedHandler = (
  request: NextRequest,
  context: { user: any; ability: any; params?: any }
) => Promise<NextResponse>;

export function withAuth(action: string, subject: string, handler: AuthenticatedHandler) {
  return async (request: NextRequest, segmentData?: any) => {
    try {
      const session = await auth.api.getSession({ headers: await headers() });
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { agencyAccesses: true },
      });
      if (!dbUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const ability = defineAbilityFor(dbUser);
      if (!ability.can(action, subject)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      return await handler(request, { user: dbUser, ability, params: segmentData?.params });
    } catch (error) {
      console.error("API Error:", error);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  };
}
```

**Penggunaan Baru di Route API (Sangat Bersih & Efisien):**
```typescript
// app/api/attendances/route.ts
export const POST = withAuth("create", "Attendance", async (request, { user, ability }) => {
  // Langsung ke logika bisnis tanpa boilerplate autentikasi/otorisasi!
  const body = await request.json();
  ...
});
```

---

### Usulan Solusi 2: Custom Exception Hierarchy & Error Handler
Sebagai alternatif, kita bisa mendefinisikan kelas error kustom untuk menyatukan standarisasi pesan error di seluruh aplikasi.

**Contoh Definisi Error (`lib/errors.ts`):**
```typescript
export class AppError extends Error {
  constructor(public message: string, public statusCode: number) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized access") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden: Access denied") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict") {
    super(message, 409);
  }
}
```

**Penggunaan di Route Handler:**
```typescript
try {
  if (!session) throw new UnauthorizedError();
  if (!hasPermission) throw new ForbiddenError("Tidak memiliki hak akses membuat jadwal.");
  if (isDuplicate) throw new ConflictError("Jadwal sudah terdaftar.");
} catch (error) {
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }
  // Fallback error lainnya...
}
```
Metode ini membuat penanganan kesalahan menjadi terstruktur, mudah dibaca, serta memangkas ratusan baris kode yang berulang di seluruh backend.

---

## 4. 🚨 Cacat Logika Bisnis: Kebocoran Kueri Global pada Filter Hari Libur (`AgencyHoliday`)

### 🔍 Hasil Analisis Kode & Alur Kerja
* **File Referensi:** [`app/api/attendances/route.ts`](file:///d:/Intern%20Pangeran/coding-absensi-bebas/diskominfo-intern-attendance/app/api/attendances/route.ts) baris 307–310.
* **Kondisi Saat Ini:**
  ```typescript
  // Check if target working date is a public holiday
  const holiday = await prisma.agencyHoliday.findFirst({
    where: { date: timeCheck.currentLocalDateStr },
  });
  ```
* **Masalah Cacat Logika:** 
  * Di dalam database, hari libur (`AgencyHoliday`) dikaitkan secara spesifik dengan instansi tertentu via field `agencyId` (karena hari libur bisa berbeda antar kantor instansi).
  * Namun, kueri di atas **tidak menyertakan filter `agencyId`**. Kueri tersebut mencari baris pertama di tabel `AgencyHoliday` yang memiliki kecocokan tanggal secara global di seluruh database.
  * **Dampak Fatal:** Jika Instansi A menetapkan hari libur internal pada tanggal `2026-06-22`, maka seluruh peserta magang dari Instansi B, C, dan lainnya yang **tidak libur** tetap akan terblokir untuk melakukan absensi karena sistem mendeteksi adanya hari libur pada tanggal tersebut.
* **Rekomendasi Pembenahan:** Tambahkan filter `agencyId` menggunakan instansi tempat peserta magang tersebut berada:
  ```diff
  -const holiday = await prisma.agencyHoliday.findFirst({
  -  where: { date: timeCheck.currentLocalDateStr },
  -});
  +const holiday = await prisma.agencyHoliday.findFirst({
  +  where: {
  +    agencyId: intern.agencyId,
  +    date: timeCheck.currentLocalDateStr,
  +  },
  +});
  ```

