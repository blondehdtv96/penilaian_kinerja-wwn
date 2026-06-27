# SISTEM PENILAIAN KINERJA — VoO / IDE KAIZEN BERBASIS BLOCKCHAIN

<p>
  <img alt="Version" src="https://img.shields.io/badge/version-2.0.0-blue" />
  <img alt="Node" src="https://img.shields.io/badge/Node.js-%E2%89%A518-339933?logo=node.js&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" />
  <img alt="Vue" src="https://img.shields.io/badge/Vue-3.x-4FC08D?logo=vue.js&logoColor=white" />
  <img alt="Ionic" src="https://img.shields.io/badge/Ionic-7.x-3880FF?logo=ionic&logoColor=white" />
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-5.x-2D3748?logo=prisma&logoColor=white" />
  <img alt="Socket.IO" src="https://img.shields.io/badge/Socket.IO-4.x-010101?logo=socket.io&logoColor=white" />
  <img alt="License" src="https://img.shields.io/badge/license-MIT-green" />
</p>

## Studi Kasus: PT Bridgestone Tire Indonesia — Bekasi Plant

Sistem penilaian kinerja operator manufaktur berbasis **VoO (Voice of Operator) / Ide Kaizen** dengan
alur persetujuan berjenjang, pencatatan kedisiplinan (misconduct), dan jejak audit anti-manipulasi
menggunakan rantai hash blockchain (on-chain SHA-256). Mendukung pemindaian **QR area kerja** dan
**QR identitas operator**, notifikasi real-time, serta ekspor laporan PDF/Excel.

> Versi aplikasi: **2.0.0**

## 🚀 Teknologi

### Backend
- Node.js + Express.js (dijalankan via `tsx`)
- TypeScript
- Prisma ORM + SQLite (default; tersedia skrip migrasi PostgreSQL di `prisma/postgresql.sql`)
- Socket.IO (real-time notifications)
- JWT Authentication + RBAC
- SHA-256 hash chain (blockchain audit)
- `qrcode` (generate QR), `multer` (upload foto bukti), `exceljs` (ekspor Excel), `ethers`

### Frontend
- Vue.js 3 + Ionic Vue 7
- Pinia (state management)
- Vue Router
- Axios (HTTP client)
- Socket.IO Client (real-time)
- `html5-qrcode` + `@capacitor/camera` (pemindaian QR)
- Vite (build tool) + `@vitejs/plugin-basic-ssl` (dev HTTPS untuk kamera)

> Styling memakai design system berbasis CSS variables (tema gelap/terang), bukan utility framework.

## 📁 Struktur Proyek

```
penilaian_kinerja/
├── backend/                 # Backend API (Express + TypeScript)
│   ├── prisma/
│   │   ├── schema.prisma    # Skema database (SQLite)
│   │   ├── seed.ts          # Data awal (roles, users, QR, contoh VoO)
│   │   └── postgresql.sql   # Skrip skema PostgreSQL
│   ├── scripts/             # Utilitas: reset-db, clear-data, dll.
│   ├── src/
│   │   ├── auth/            # Autentikasi (login, me, refresh)
│   │   ├── users/          # Manajemen user
│   │   ├── roles/          # Manajemen role
│   │   ├── permissions/    # Manajemen permission
│   │   ├── operators/      # Data operator + scan QR
│   │   ├── voo/            # VoO / Ide Kaizen (submit + approval)
│   │   ├── misconduct/     # Misconduct, konseling, kartu kuning, SP
│   │   ├── qr-locations/   # QR area kerja
│   │   ├── blockchain/     # Hash chain & verifikasi integritas
│   │   ├── dashboard/      # KPI & ekspor (Excel)
│   │   ├── reports/        # Pelaporan
│   │   ├── notifications/  # Notifikasi
│   │   ├── superadmin/     # Fungsi super admin
│   │   ├── socket/         # Socket.IO (io singleton + handlers)
│   │   └── middleware/     # Auth, RBAC, audit
│   └── package.json
│
└── frontend/               # Frontend App (Vue 3 + Ionic)
    ├── src/
    │   ├── components/     # Komponen reusable (PageShell, dll.)
    │   ├── pages/
    │   │   ├── auth/       # Login
    │   │   ├── operator/   # Scan QR, submit VoO, riwayat, performa
    │   │   ├── foreman/    # Approve VoO, misconduct, konseling, SP
    │   │   ├── manager/    # VoO final, ranking, trend, blockchain, audit, reports
    │   │   ├── staff/      # Monitor VoO & misconduct (read-only)
    │   │   ├── admin/      # Users, roles, QR locations
    │   │   └── operators/  # Daftar & detail operator
    │   ├── router/         # Vue Router
    │   ├── services/       # API services (axios)
    │   └── stores/         # Pinia stores (auth, notifications)
    └── package.json
```

## 🔑 Fitur Utama

### 1. Authentication & Authorization
- Autentikasi berbasis JWT
- Role-Based Access Control (RBAC) berbasis permission
- 5 level akses: **Super Admin, Section Manager, Foreman, Staff Produksi, Operator**

### 2. VoO / Ide Kaizen
- Operator mengajukan VoO/Ide Kaizen, lengkap dengan unggahan foto bukti (maks 5)
- Alur persetujuan berjenjang: **Operator → Foreman → Section Manager (final)**
- Sistem poin merit untuk VoO yang disetujui final
- Pemindaian QR area kerja yang langsung mengarahkan ke form pengajuan dengan info lokasi terisi

### 3. Pencatatan Kedisiplinan (Misconduct)
- Misconduct, Konseling, Kartu Kuning, dan Surat Peringatan
- Input oleh Foreman / Section Manager sesuai kewenangan
- Terhubung ke jejak audit & blockchain

### 4. Blockchain Audit Trail
- Rantai hash SHA-256 (tamper-proof)
- Verifikasi integritas rantai
- Pencatatan otomatis untuk entitas VoO & Misconduct

### 5. Dashboard & Analitik
- Monitoring KPI
- Ranking operator real-time
- Analisis tren merit & misconduct
- Ekspor laporan PDF / Excel

### 6. Real-time & Notifikasi
- Notifikasi via Socket.IO (room per role/operator)
- Pusat notifikasi di header aplikasi

## 🛠️ Instalasi

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Generate Prisma client
npm run prisma:generate

# Jalankan migrasi database
npm run prisma:migrate

# Isi data awal (roles, users, QR, contoh VoO)
npm run prisma:seed

# Start development server
npm run dev
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server (Vite)
npm run dev
```

> **Catatan kamera/QR:** akses kamera membutuhkan koneksi aman (HTTPS) di luar `localhost`.
> Dev server mendukung HTTPS via `@vitejs/plugin-basic-ssl` (mis. `https://192.168.x.x:5173`).
> Tersedia juga input manual untuk menempel isi QR (JSON) bila kamera tidak dapat digunakan.

## 🔐 Role & Hak Akses

### Super Admin
✅ Akses penuh seluruh sistem
✅ Manajemen user, role, permission
✅ Monitoring blockchain & audit log
✅ Konfigurasi sistem

### Section Manager
✅ Persetujuan final VoO
✅ Dashboard KPI & ranking operator
✅ Analisis tren merit/misconduct
✅ Ekspor laporan PDF/Excel
✅ Input misconduct, kartu kuning, surat peringatan

### Foreman
✅ Persetujuan VoO tahap pertama
✅ Input misconduct, konseling, kartu kuning, surat peringatan
✅ Unggah bukti (evidence)
✅ Monitor operator

### Staff Produksi
✅ Monitor pengajuan VoO/Kaizen (read-only)
✅ Monitor catatan misconduct (read-only)

### Operator
✅ Scan QR area kerja & identitas
✅ Ajukan VoO/Ide Kaizen + unggah foto
✅ Lihat status pengajuan & riwayat merit
✅ Lihat performa pribadi
✅ Pusat notifikasi

## 📊 Skema Database (Prisma)

**Model utama:**
- `Role`, `User`
- `Operator`
- `QrLocation`, `QrScanLog`
- `VooSubmission`
- `Misconduct`, `Counseling`, `KartuKuning`, `SuratPeringatan`
- `Approval`
- `EventLog`
- `BlockchainHash`
- `Notification`

## 🔗 API Endpoints

Base URL: `http://localhost:3001/api`

### Health
- GET `/health`

### Authentication
- POST `/auth/login`
- GET `/auth/me`
- POST `/auth/refresh`

### Operators
- GET `/operators`
- GET `/operators/ranking`
- POST `/operators/scan-qr`
- GET `/operators/:id`

### VoO / Ide Kaizen
- GET `/voo`
- GET `/voo/my`
- POST `/voo` *(multipart, upload foto)*
- GET `/voo/:id`
- POST `/voo/:id/approve-foreman`
- POST `/voo/:id/approve-manager`

### Records (Kedisiplinan)
- POST `/records/misconduct` · GET `/records/misconduct`
- POST `/records/counseling` · GET `/records/counseling`
- POST `/records/kartu-kuning` · GET `/records/kartu-kuning`
- POST `/records/surat-peringatan` · GET `/records/surat-peringatan`

### QR Locations
- GET `/qr-locations`
- GET `/qr-locations/:id`

### Blockchain
- GET `/blockchain/status`
- GET `/blockchain/verify`

### Dashboard & Admin
- GET `/dashboard/kpi`
- GET `/dashboard/export/excel`
- GET `/users`
- GET `/roles`
- GET `/notifications`
- GET `/audit-logs` *(Section Manager)*

## 🌐 Socket.IO

- Koneksi diautentikasi via handshake token JWT.
- Klien otomatis di-join ke room berdasarkan role/operator dari token.
- Dipakai untuk notifikasi real-time (pengajuan & persetujuan VoO, misconduct, dll.).

## 🔑 Kredensial Default (setelah seeding)

| Role            | Username          | Password        |
|-----------------|-------------------|-----------------|
| Super Admin     | `superadmin`      | `superadmin123` |
| Section Manager | `section_manager` | `manager123`    |
| Foreman         | `foreman01`       | `foreman123`    |
| Foreman         | `foreman02`       | `foreman123`    |
| Staff Produksi  | `staff_produksi`  | `staff123`      |
| Operator        | `operator01`–`05` | `operator123`   |

## 📱 Dukungan Mobile

Frontend memakai Ionic Vue + Capacitor untuk mendukung:
- Progressive Web App (PWA)
- Aplikasi native iOS & Android
- Desain responsif
- Akses kamera perangkat untuk pemindaian QR

## 🔒 Fitur Keamanan

- Autentikasi token JWT
- Hashing password (bcrypt)
- Otorisasi RBAC berbasis permission
- Pencegahan SQL injection (Prisma)
- Konfigurasi CORS
- Audit logging
- Deteksi manipulasi data via blockchain (hash chain)

## 📝 Skrip Pengembangan

```bash
# Backend
npm run dev               # Development (tsx watch)
npm run build             # Build TypeScript (tsc)
npm run start             # Jalankan hasil build
npm run prisma:generate   # Generate Prisma client
npm run prisma:migrate    # Migrasi database (dev)
npm run prisma:seed       # Seed data awal
npm run prisma:studio     # GUI database
npm run db:reset          # Reset database
npm run db:clear          # Hapus data

# Frontend
npm run dev               # Development (Vite)
npm run build             # Type-check + build produksi
npm run preview           # Preview hasil build
npm run type-check        # Pemeriksaan tipe (vue-tsc)
```

## 📸 Screenshot

> Letakkan tangkapan layar pada folder `docs/screenshots/` lalu sesuaikan path di bawah.

| Login | Dashboard KPI |
|-------|---------------|
| ![Login](docs/screenshots/login.png) | ![Dashboard](docs/screenshots/dashboard.png) |

| Scan QR | Ajukan VoO / Ide Kaizen |
|---------|--------------------------|
| ![Scan QR](docs/screenshots/scan-qr.png) | ![Submit VoO](docs/screenshots/voo-submit.png) |

## 🚢 Deployment

### 1. Variabel Lingkungan (Backend `.env`)

```env
DATABASE_URL="file:./prisma/dev.db"     # SQLite (default) atau URL PostgreSQL untuk produksi
JWT_SECRET="ganti-dengan-secret-kuat"
PORT=3001
CORS_ORIGIN="https://domain-frontend-anda"
```

### 2. Build & Jalankan Backend (produksi)

```bash
cd backend
npm ci
npm run prisma:generate
npm run prisma:migrate:deploy   # terapkan migrasi tanpa prompt (produksi)
npm run prisma:seed             # opsional, untuk data awal
npm run build                   # compile TypeScript -> dist/
npm run start                   # node dist/index.js
```

> Untuk produksi disarankan menjalankan proses dengan process manager (mis. **PM2** atau **systemd**)
> dan menempatkannya di belakang reverse proxy (mis. **Nginx**) dengan TLS/HTTPS.

### 3. Build Frontend

```bash
cd frontend
npm ci
npm run build       # menghasilkan folder dist/ (static)
```

Sajikan folder `dist/` melalui web server statis (Nginx/Apache) atau hosting static
(Netlify, Vercel, dll.). Pastikan `CORS_ORIGIN` di backend mengarah ke origin frontend,
dan frontend menunjuk ke base URL API backend.

### 4. Migrasi ke PostgreSQL (opsional)

1. Ubah `provider` pada `prisma/schema.prisma` dari `sqlite` menjadi `postgresql`.
2. Set `DATABASE_URL` ke koneksi PostgreSQL.
3. Jalankan `npm run prisma:migrate:deploy` atau gunakan skrip `prisma/postgresql.sql`.

### 5. Catatan HTTPS untuk Kamera/QR

Akses kamera (pemindaian QR) memerlukan **secure context (HTTPS)** di luar `localhost`.
Pastikan frontend disajikan melalui HTTPS di lingkungan produksi/LAN.

## 📄 License

MIT License — PT Bridgestone Tire Indonesia

## 👥 Developer

Dikembangkan untuk PT Bridgestone Tire Indonesia — Bekasi Plant
