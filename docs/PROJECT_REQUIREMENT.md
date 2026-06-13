# RANCANG BANGUN SISTEM MERIT-MISCONDUCT BERBASIS REAL-TIME EVENT DAN INTEGRITAS DATA BLOCKCHAIN (ON-CHAIN) UNTUK PENILAIAN KINERJA OPERATOR MANUFAKTUR

## Studi Kasus: PT Bridgestone Tire Indonesia Bekasi Plant

## Deskripsi Proyek
Sistem Merit-Misconduct adalah aplikasi Enterprise Human Resource Performance Management yang digunakan untuk melakukan penilaian kinerja operator manufaktur secara real-time berdasarkan aktivitas kerja, pencapaian (Merit), dan pelanggaran (Misconduct).

### Teknologi
- Backend: Next.js 15, TypeScript, Prisma ORM, SQLite
- Frontend: Vue.js 3, Ionic Vue, Pinia, TailwindCSS
- Real-Time: Socket.IO
- Security: JWT, RBAC, Audit Log
- Blockchain: SHA-256 Hash Chain
- QR Code Employee System

## Role Based Access Control (RBAC)

### Super Admin (manager)
- Kelola User
- Kelola Role
- Kelola Permission
- Monitoring Blockchain

### Manager
- Dashboard KPI
- Audit Blockchain

### Staff Produksi
- Monitoring Kinerja
- Dashboard KPI
- Approval Event
- Export Laporan

### Foreman
- Scan QR Operator
- Input Merit
- Input Misconduct

### Operator
- Melihat Nilai Pribadi
- Melihat Ranking
- QR Identity

## Modul Utama
1. Authentication
2. RBAC
3. Master Data
4. QR Code Employee
5. Merit Management
6. Misconduct Management
7. Real-Time Event
8. Blockchain Audit Trail
9. KPI Dashboard
10. Reporting
11. Audit Log

## Database
Tabel:
- users
- roles
- permissions
- role_permissions
- user_roles
- operators
- divisions
- departments
- shifts
- production_lines
- groups
- merit_events
- misconduct_events
- performance_logs
- blockchain_logs
- notifications
- audit_logs

## Struktur Folder Backend

```bash
backend/
├── prisma/
├── src/
│   ├── auth/
│   ├── users/
│   ├── roles/
│   ├── permissions/
│   ├── operators/
│   ├── merit/
│   ├── misconduct/
│   ├── blockchain/
│   ├── reports/
│   └── dashboard/
```

## Struktur Folder Frontend

```bash
frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── router/
│   ├── services/
│   ├── stores/
│   └── ionic/
```

## Target Pengembangan
- Human Resource Performance Management System
- Smart Factory Employee Evaluation Platform
- Blockchain-Based Employee Assessment System
