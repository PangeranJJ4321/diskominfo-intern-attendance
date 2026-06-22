# Dokumentasi Arsitektur & Mapping Codebase
`diskominfo-intern-attendance`

Dokumen ini dirancang untuk memetakan arsitektur dan konvensi penulisan kode yang digunakan oleh developer sebelumnya pada proyek **Diskominfo Intern Attendance**. Tujuannya adalah agar penambahan fitur di kemudian hari tetap konsisten dengan pola yang sudah ada, tanpa merusak struktur dan integritas sistem.

---

## 🏛️ Pola Arsitektur Umum (High-Level Architecture)

Proyek ini menggunakan arsitektur **Modern Next.js Hybrid Layout** yang berbasis pada ekosistem React/Next.js App Router modern, bukan MVC (Model-View-Controller) tradisional atau Clean Architecture (seperti NestJS/Clean Architecture dengan pembagian layer Domain/Application/Infrastructure secara kaku).

Berikut adalah pemetaan pola proyek ini dibandingkan dengan MVC & Clean Architecture:

```mermaid
graph TD
    UI[UI Pages & Components<br>app/ & components/] -->|Menggunakan State / Aksi| Store[Zustand Stores<br>stores/]
    Store -->|Memanggil| ClientService[Client API Services<br>lib/services/]
    ClientService -->|Fetch HTTP Requests| RouteHandler[API Route Handlers / Controllers<br>app/api/]
    
    subgraph Server Side (Backend)
        RouteHandler -->|Validasi| Zod[Zod Schemas<br>lib/schemas/]
        RouteHandler -->|Otorisasi| CASL[CASL Ability Rules<br>lib/casl.ts]
        RouteHandler -->|Logika Bisnis Khusus| ServerService[Server Domain Services<br>lib/location-verifier, face-recognition, dll.]
        RouteHandler -->|Akses Database Langsung| Prisma[Prisma ORM<br>lib/prisma.ts & prisma/schema.prisma]
    end
```

### Pemetaan Komponen Arsitektur:
1. **Routing**: Next.js App Router (File-system based) di dalam folder `/app`.
2. **Controller (Backend API Handlers)**: Dilayani oleh file `route.ts` di dalam `/app/api/...`. Mereka menerima request, menangani otorisasi, validasi, dan mengembalikan response JSON.
3. **Services (Logika Bisnis & Komunikasi API)**:
   - **Client-side API Services** (`/lib/services/...`): Berfungsi membungkus pemanggilan `fetch` ke backend API agar komponen UI tidak melakukan request manual.
   - **Server-side Domain Services** (`/lib/...`): File utility khusus yang mengemas algoritma rumit (geofencing, face recognition, perhitungan waktu shift, dll.).
4. **Repository (Akses Database)**: **Tidak ada layer Repository terpisah**. Interaksi database langsung menggunakan **Prisma Client** (`/lib/prisma.ts`) di dalam file Controller (`route.ts`).
5. **View / UI Layer**: Halaman Next.js (`page.tsx`) dan komponen UI (`/components`) yang didekorasi menggunakan Tailwind CSS v4.
6. **State Management**: **Zustand** (`/stores/...`) yang mengelola state data secara global di frontend, bertindak sebagai mediator antara UI dan Client API Services.

---

## 📂 Struktur Direktori & Pemetaan Folder

Berikut adalah visualisasi struktur direktori proyek beserta peran masing-masing:

```
├── app/                      # Next.js App Router (Routing & Controller)
│   ├── admin/                # Halaman Dashboard Admin & Pengelolaan Data Instansi
│   ├── auth/                 # Halaman & Konfigurasi Autentikasi (Better-Auth)
│   ├── dashboard/            # Halaman Presensi & Absensi Intern
│   ├── profile/              # Pengelolaan Profil & Registrasi Wajah (Descriptor)
│   └── api/                  # API Route Handlers (Controller Backend)
│
├── components/               # Komponen UI Reusable
│   ├── ui/                   # Komponen Primitif Atomik (shadcn/ui style - Button, Dialog, dll.)
│   └── custom/               # Komponen Terkait Bisnis Proyek (Camera, Navbar, Map, dll.)
│
├── hooks/                    # Custom React Hooks (misal: Upload file)
│
├── interfaces/               # Definisi Tipe Data & Interface TypeScript
│
├── lib/                      # Utilitas, Konfigurasi & Server/Client Helper
│   ├── schemas/              # Validasi Input (Zod Schemas)
│   ├── services/             # Client-side API Client wrappers (Fetch)
│   ├── prisma.ts             # Inisialisasi Prisma Client (Database Connection)
│   └── *.ts                  # Server-side helper (waktu, lokasi, casl, biometric wajah)
│
├── prisma/                   # Skema Database & Seeding
│   ├── schema.prisma         # Definisi Struktur Tabel PostgreSQL
│   └── seed.ts               # Data Awal Database (Seeding)
│
└── stores/                   # State Management Global (Zustand Stores)
```

---

## 🔍 Detail Setiap Lapisan (Layers Breakdown)

### 1. Routing (`/app`)
Menggunakan **App Router** dari Next.js.
- **Routing Halaman (Frontend)**: Setiap subfolder di `/app` yang memiliki file `page.tsx` akan menjadi halaman (URL).
- **Dynamic Routing**: Menggunakan bracket `[param]` untuk parameter dinamis.
  - `/app/admin/[agencyId]/page.tsx` -> URL halaman admin instansi tertentu.
  - `/app/dashboard/[internId]/page.tsx` -> URL dashboard presensi anak magang tertentu.
- **Local Components**: Jika sebuah halaman memiliki komponen UI kompleks yang hanya digunakan khusus di halaman tersebut, developer lama meletakkannya di subfolder `components` dalam folder halaman tersebut (misalnya di `/app/admin/[agencyId]/components/`). Ini membantu menjaga `/components` utama tetap bersih dari kode yang tidak reusable secara global.

### 2. Controllers / API Routes (`/app/api`)
Setiap file `route.ts` di dalam `/app/api` bertindak sebagai Controller backend.
Pola penulisan route handler yang standar meliputi:
- Memeriksa sesi user (`auth.api.getSession`).
- Mengecek hak akses (authorization) menggunakan **CASL Ability** (`defineAbilityFor`).
- Melakukan parsing & validasi query param atau request payload menggunakan **Zod Schema** (`safeParse`).
- Berinteraksi langsung dengan database melalui `prisma`.
- Mengembalikan response JSON yang konsisten dengan HTTP status code yang sesuai.

*Contoh Pola API Route (`app/api/agencies/route.ts`):*
```typescript
export async function GET(request: NextRequest) {
  try {
    // 1. Otorisasi Sesi
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 2. Hak Akses (CASL)
    const dbUser = await prisma.user.findUnique({ where: { id: session.user.id }, include: { agencyAccesses: true } });
    const ability = defineAbilityFor(dbUser);
    if (!ability.can("read", "Agency")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // 3. Parsing & Validasi Query
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parsed.success) return NextResponse.json({ error: "Invalid params" }, { status: 400 });

    // 4. Query Database via Prisma
    const agencies = await prisma.agency.findMany({ ... });
    
    // 5. Response
    return NextResponse.json({ data: agencies });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
```

### 3. Services Layer
#### A. Client-side API Services (`/lib/services`)
Setiap entity database memiliki satu file service client di `/lib/services`. Isinya adalah kumpulan fungsi asynchronous yang membungkus panggilan `fetch` HTTP ke API backend.
- Fungsi-fungsi ini memiliki anotasi **JSDoc** yang sangat lengkap (wajib diikuti).
- Mengembalikan Promise data murni hasil request.
- Menggunakan `handleError` dari `./utils` untuk menangani kegagalan request.

*Contoh Service Client (`lib/services/agencies.ts`):*
```typescript
/**
 * Creates a new agency.
 *
 * @param {string} name - The agency name.
 * @returns {Promise<Agency>} The created agency.
 */
export async function createAgency(name: string): Promise<Agency> {
  const res = await fetch("/api/agencies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) await handleError(res, "Gagal menambahkan instansi");
  return res.json();
}
```

#### B. Server-side Domain Services / Helpers (`/lib`)
Digunakan untuk menampung algoritma / logika bisnis yang kompleks agar API Route Handler tetap ringkas. Contoh:
- `attendance-time-verifier.ts`: Memvalidasi kecocokan waktu absen anak magang terhadap jendela jadwal shift kerja (termasuk penanganan shift malam/overnight).
- `location-verifier.ts`: Memvalidasi koordinat lokasi GPS anak magang terhadap polygon geofence instansi (`location-within-area.ts`).
- `face-recognition.ts`: Mengelola komparasi 68-point face descriptor dengan data wajah terdaftar untuk mencegah fraud presensi.

### 4. Database & Repository Layer (`/prisma` & `/lib/prisma.ts`)
Proyek ini tidak membungkus Prisma dengan pattern repository terpisah (seperti `AgencyRepository`). Interaksi langsung ke DB menggunakan `prisma` client dari `@/lib/prisma`.
- Model didefinisikan di `prisma/schema.prisma`.
- Gunakan penamaan tabel plural di mapping `@map("tabel_nama")`.
- Terdapat data awal yang dikonfigurasi melalui `prisma/seed.ts`.

### 5. State Management (`/stores`)
Menggunakan **Zustand** untuk mengelola state global di sisi client.
- Setiap store mendefinisikan `State` (data seperti loading, error, array data) dan `Actions` (fungsi aksi untuk memanipulasi data).
- Action di dalam store memanggil fungsi dari `lib/services/...` (Client-side API Service).
- Store menangani update local state secara optimis/responsif dan mencatat error jika pemanggilan API gagal.

*Contoh Zustand Store (`stores/useAgencyStore.ts`):*
```typescript
export const useAgencyStore = create<AgencyState & AgencyActions>((set) => ({
  agencies: [],
  loading: false,
  error: null,
  fetchAgencies: async () => {
    set({ loading: true, error: null });
    try {
      const agencies = await agencyService.getAgencies();
      set({ agencies, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },
  // ... action lainnya
}));
```

---

## 🛠️ Panduan Penambahan Fitur Baru (Step-by-Step)

Untuk memastikan penambahan fitur baru tidak merusak pola arsitektur yang sudah berjalan, ikuti alur pengembangan (workflow) berikut:

### Langkah 1: Modifikasi Skema Database (Jika Diperlukan)
1. Buka file `prisma/schema.prisma` dan tambahkan model atau field baru.
2. Jalankan perintah untuk menghasilkan client Prisma yang baru:
   ```bash
   npx prisma generate
   ```
3. Buat dan jalankan migrasi database di postgresql jika di lingkungan development/production.

### Langkah 2: Buat Skema Validasi Zod
Buat atau edit file schema di `/lib/schemas/` (misalnya `agency-schema.ts` atau `attendance-schema.ts`) untuk memvalidasi input payload POST/PATCH sebelum diproses di database.

### Langkah 3: Buat API Route Handler (Controller)
1. Buat folder baru di `/app/api/nama-fitur/route.ts`.
2. Implementasikan function handler (`GET`, `POST`, dll.).
3. Pastikan memasukkan validasi sesi pengguna, otorisasi CASL, validasi Zod, dan query database langsung dengan `prisma`.

### Langkah 4: Buat Client-side API Service Wrapper
1. Buat file baru di `/lib/services/nama-fitur.ts`.
2. Implementasikan fungsi-fungsi fetch API yang memanggil endpoint yang dibuat pada Langkah 3.
3. Tambahkan dokumentasi **JSDoc** yang jelas untuk fungsi tersebut.

### Langkah 5: Hubungkan ke Zustand Store (State Management)
1. Buat store baru di `/stores/useNamaFiturStore.ts`.
2. Hubungkan fungsi dari Client API Service yang dibuat pada Langkah 4 ke dalam action store.
3. Kelola status `loading`, `error`, dan data utama di dalam store tersebut.

### Langkah 6: Implementasikan UI & Hubungkan ke Store
1. Buat komponen baru di `/components/custom` (jika reusable) atau di dalam folder komponen lokal halaman `/app/.../components` jika hanya digunakan di satu tempat.
2. Hubungkan UI dengan store menggunakan React hook dari Zustand (misal: `const { data, loading, fetch } = useNamaFiturStore()`).
3. Selesai! Fitur baru terintegrasi secara modular dan bersih.

---

## 🚦 Aturan Penulisan Kode yang Sangat Ketat

Workspace ini memiliki konfigurasi ESLint & TypeScript yang ketat. Pelanggaran aturan berikut akan menyebabkan kegagalan proses kompilasi (build):

1. **Dilarang Ada Unused Variables**:
   Semua variabel, parameter fungsi, dan import yang dideklarasikan wajib digunakan.
2. **Dilarang Menggunakan Tipe `any`**:
   Wajib mendefinisikan interface atau tipe data secara eksplisit di `/interfaces/`. Jangan pernah menggunakan `any`.
3. **Dilarang Menggunakan Tipe `unknown` secara Eksplisit**:
   Gunakan interface spesifik. Untuk blok `catch (err)` di mana tipe default JavaScript adalah `unknown`, hindari menulis anotasi tipe secara eksplisit (gunakan `catch (err)` saja tanpa `: unknown` atau `: any`).
4. **Wajib Menggunakan JSDoc**:
   Setiap mendeklarasikan fungsi baru, wajib menulis dokumentasi JSDoc di atasnya untuk menjelaskan:
   - Deskripsi fungsi.
   - Penjelasan parameter (`@param`).
   - Penjelasan nilai kembalian (`@returns`).
5. **Konfigurasi Styling Tailwind CSS v4**:
   - Proyek ini menggunakan Tailwind CSS v4. Kustomisasi tema (warna, font, dll.) dilakukan secara deklaratif di CSS global `/app/globals.css` menggunakan aturan `@theme`, bukan melalui file JavaScript configuration `tailwind.config.js` lama.
