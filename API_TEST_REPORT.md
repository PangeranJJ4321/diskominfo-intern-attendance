# Laporan Pengujian API Otomatis (API Automated Test Report)
Tanggal: 22/06/2026, 07.54.33
Aplikasi: diskominfo-intern-attendance

## 📊 Ringkasan Statistik
*   **Total Endpoint Diuji**: 26
*   **Passed (Sukses)**: 26 ✅
*   **Failed (Gagal)**: 0 ❌

---

## 📝 Detail Hasil Uji Coba

| Kategori | Method | Endpoint | HTTP Status | Hasil | Waktu (ms) | Detail Error |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| Agencies | `GET` | `/api/agencies` | 200 | ✅ PASS | 8507 | - |
| Agencies | `POST` | `/api/agencies` | 201 | ✅ PASS | 1527 | - |
| Agencies | `GET` | `/api/agencies/[id]` | 200 | ✅ PASS | 1776 | - |
| Agencies | `PATCH` | `/api/agencies/[id]` | 200 | ✅ PASS | 1913 | - |
| Agencies | `POST` | `/api/agencies/[id]/areas` | 201 | ✅ PASS | 2115 | - |
| Agencies | `GET` | `/api/agencies/[id]/areas` | 200 | ✅ PASS | 1718 | - |
| Agencies | `PATCH` | `/api/agencies/[id]/areas` | 200 | ✅ PASS | 1778 | - |
| Agencies | `POST` | `/api/agencies/[id]/rules` | 201 | ✅ PASS | 4239 | - |
| Agencies | `GET` | `/api/agencies/[id]/rules` | 200 | ✅ PASS | 2005 | - |
| Agencies | `PATCH` | `/api/agencies/[id]/rules` | 200 | ✅ PASS | 3425 | - |
| Agencies | `DELETE` | `/api/agencies/[id]` | 200 | ✅ PASS | 1733 | - |
| Users | `GET` | `/api/users` | 200 | ✅ PASS | 4564 | - |
| Users | `GET` | `/api/users/[id]` | 200 | ✅ PASS | 2506 | - |
| Users | `GET` | `/api/users/[id]/attendances` | 200 | ✅ PASS | 4085 | - |
| Users | `GET` | `/api/users/[id]/face-descriptors` | 200 | ✅ PASS | 2083 | - |
| Interns | `GET` | `/api/interns` | 200 | ✅ PASS | 4554 | - |
| Shifts | `GET` | `/api/shifts` | 200 | ✅ PASS | 1605 | - |
| Schedules | `GET` | `/api/schedules` | 200 | ✅ PASS | 1889 | - |
| Holidays | `GET` | `/api/holidays` | 200 | ✅ PASS | 1409 | - |
| Holidays | `GET` | `/api/holidays/[id]` | 200 | ✅ PASS | 1451 | - |
| Institutions | `GET` | `/api/institutions` | 200 | ✅ PASS | 1499 | - |
| Institutions | `GET` | `/api/institutions/[id]` | 200 | ✅ PASS | 1627 | - |
| Attendances | `GET` | `/api/attendances` | 200 | ✅ PASS | 2631 | - |
| Location Logs | `GET` | `/api/location-logs` | 200 | ✅ PASS | 2025 | - |
| Shift Assignments | `GET` | `/api/shift-assignments` | 200 | ✅ PASS | 2002 | - |
| Agency Accesses | `GET` | `/api/agency-accesses` | 200 | ✅ PASS | 1724 | - |

---
*Laporan ini dibuat secara otomatis oleh script pengujian API `scratch/test_apis.js`.*
