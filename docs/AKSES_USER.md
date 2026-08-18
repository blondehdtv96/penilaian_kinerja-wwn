# Akses & Kredensial User

Dokumen ini merangkum seluruh role, hak akses, dan kredensial login yang tersedia di sistem, sesuai data seed (`backend/prisma/seed.ts`).

> ⚠️ Kredensial di bawah adalah akun seed untuk **development/testing**. Wajib diganti sebelum deployment ke production.

## Ringkasan Role

| Role | Deskripsi Akses |
|------|------------------|
| Super Admin | Akses penuh: kelola semua role, user, data, pengaturan sistem, audit log, dan blockchain |
| Section Manager | Approval final VoO, dashboard KPI, ranking operator, analisis tren, export PDF/Excel |
| Foreman | Approval VoO tahap 1, input misconduct/konseling/kartu kuning/SP, upload evidence, monitor operator |
| Staff Produksi | Monitor VoO/Kaizen & misconduct (read-only), kelola akun user Operator |
| Operator | Scan QR area, ajukan VoO/Ide Kaizen, upload foto, lihat status & riwayat merit sendiri |

## Kredensial Login (Akun Seed)

Satu akun per role, tanpa data dummy tambahan (VoO/misconduct sample) — cukup untuk menguji alur aplikasi end-to-end.

| Role | Username | Password | Email |
|------|----------|----------|-------|
| Super Admin | `superadmin` | `superadmin123` | superadmin@bridgestone.com |
| Section Manager | `section_manager` | `manager123` | sectionmanager@bridgestone.com |
| Foreman | `foreman01` | `foreman123` | foreman01@bridgestone.com |
| Staff Produksi | `staff_produksi` | `staff123` | staffproduksi@bridgestone.com |
| Operator | `operator01` | `operator123` | operator01@bridgestone.com |

Selain 5 user di atas, seed juga membuat 1 area QR lokasi (`QR-CUR` — Area Curing) agar fitur scan QR area tetap bisa diuji.

## Detail Hak Akses (Permissions) per Role

### Super Admin
Seluruh permission `admin.*` dan `super_admin.*`, ditambah semua permission role lain: kelola VoO, QR, merit, misconduct, konseling, kartu kuning, surat peringatan, monitor operator, dashboard KPI, ranking, tren, export laporan, upload evidence, kelola user/role/pengaturan, audit log, dan blockchain.

### Section Manager
- `voo.approve_manager`, `voo.view`
- `dashboard.kpi`, `ranking.view`
- `trend.merit`, `trend.misconduct`
- `export.pdf`, `export.excel`
- `operator.view`
- `misconduct.view`, `counseling.view`, `kartu_kuning.view`, `surat_peringatan.view`

### Foreman
- `voo.approve_foreman`, `voo.view`
- `misconduct.create`, `misconduct.view`
- `counseling.create`, `counseling.view`
- `kartu_kuning.create`, `kartu_kuning.view`
- `surat_peringatan.create`, `surat_peringatan.view`
- `operator.view`, `operator.monitor`
- `qr.view`, `evidence.upload`

### Staff Produksi
- `voo.view`
- `misconduct.view`, `counseling.view`, `kartu_kuning.view`, `surat_peringatan.view`
- `profile.view`
- `operator.manage` (kelola akun user Operator)

### Operator
- `voo.create`, `voo.view_own`, `voo.upload`
- `qr.scan`
- `merit.view_own`
- `misconduct.view_own`
- `profile.view`

## Cara Reset / Membuat Ulang Akun Seed

```bash
cd backend
npx prisma db seed
```

Perintah ini bersifat idempotent — data lama (user, role, VoO, misconduct, dsb.) akan dikosongkan lalu dibuat ulang sesuai daftar di atas.
