# Project Requirements - VoO / Ide Kaizen Performance Management v2.0

## Overview
Sistem manajemen kinerja operator untuk pabrik Bridgestone dengan fitur VoO (Voice of Operator) / Ide Kaizen, monitoring misconduct, konseling, kartu kuning, surat peringatan, QR scanning, blockchain hash anchoring, dan export laporan.

## Roles & Permissions

### 1. Operator
- Login
- Scan QR Code area kerja (attendance)
- Input VoO / Ide Kaizen submission
- Upload foto bukti
- Lihat status pengajuan (pending, approved_foreman, approved_final, rejected)
- Riwayat merit & misconduct
- Lihat performance score & ranking

### 2. Foreman
- Login
- Approval VoO (first level)
- Input Misconduct (Late Arrival, Safety Violation, etc.)
- Input Konseling
- Input Kartu Kuning (Yellow Card)
- Input Surat Peringatan (Warning Letter SP1/SP2/SP3)
- Upload bukti foto
- Monitoring operator performance

### 3. Section Manager
- Login
- Final approval VoO + assign merit points
- Dashboard KPI (total operators, VoO, misconduct, counseling, etc.)
- Operator ranking by performance score
- Trend analysis (merit & misconduct monthly trends)
- Export PDF dan Excel
- View blockchain hash records
- View append-only audit logs

## System Features
- **RBAC** (Role-Based Access Control) with 3 roles
- **JWT Authentication** with token-based sessions
- **Append-Only Audit Trail** (EventLog table, never deleted)
- **Blockchain Hash Anchoring** using Ethereum Ganache + Ethers.js
- **QR Code Scanning** for area attendance and operator identification
- **PDF & Excel Export** for performance reports
- **Real-time Notifications** via Socket.IO

## Database Schema (13 Tables)
1. roles - Role definitions with permissions JSON
2. users - User accounts with RBAC
3. operators - Operator profiles (employee ID, section, line, group, QR)
4. qr_locations - QR codes for work areas
5. qr_scan_logs - Scan attendance records
6. voo_submissions - VoO / Ide Kaizen submissions
7. misconducts - Misconduct records
8. counselings - Counseling sessions
9. kartu_kunings - Yellow card records
10. surat_peringatans - Warning letter records (SP1/2/3)
11. approvals - Approval history (append-only)
12. event_logs - System event audit trail (append-only)
13. blockchain_hashes - Hash anchoring records

## Project Structure
```
penilaian_kinerja/
├── backend/                    # Express.js API
│   ├── prisma/
│   │   ├── schema.prisma      # Prisma schema (SQLite)
│   │   ├── postgresql.sql     # PostgreSQL reference DDL
│   │   └── seed.ts            # Seed data (3 roles, operators, QR areas)
│   └── src/
│       ├── index.ts           # Server entry point
│       ├── auth/              # Authentication
│       ├── operators/         # Operator management + QR scanning
│       ├── voo/               # VoO / Ide Kaizen submissions
│       ├── misconduct/        # Misconduct, counseling, kartu kuning, SP
│       ├── blockchain/        # Ethereum hash anchoring
│       ├── dashboard/         # KPI dashboard + export
│       ├── qr-locations/      # QR area management
│       └── middleware/
│           ├── auth.middleware.ts   # JWT + RBAC
│           └── audit.middleware.ts  # Append-only event log
│
├── frontend-next/              # Next.js 14 Frontend
│   └── src/
│       ├── app/
│       │   ├── login/          # Login page
│       │   ├── dashboard/      # Section Manager KPI dashboard
│       │   ├── operator/       # Operator pages
│       │   │   ├── scan/       # QR area scanning
│       │   │   ├── voo/        # Submit VoO
│       │   │   ├── submissions/ # My submissions
│       │   │   └── performance/ # My performance
│       │   ├── foreman/        # Foreman pages
│       │   │   ├── approve/    # Approve VoO
│       │   │   ├── misconduct/ # Input misconduct
│       │   │   ├── counseling/ # Input counseling
│       │   │   ├── kartu-kuning/    # Issue yellow card
│       │   │   ├── surat-peringatan/ # Issue warning letter
│       │   │   └── operators/  # Monitor operators
│       │   └── manager/        # Section Manager pages
│       │       ├── final-approve/ # Final VoO approval
│       │       ├── ranking/    # Operator ranking
│       │       ├── trends/     # Trend analysis
│       │       ├── export/     # Export PDF/Excel
│       │       ├── blockchain/ # Hash records
│       │       └── audit/      # Audit logs
│       ├── components/         # Shared components (Sidebar)
│       ├── lib/                # API client (axios)
│       └── store/              # Zustand state (auth)
│
└── frontend/                   # Legacy Vue.js frontend (deprecated)
```

## Running the System
```bash
# 1. Start Backend
cd backend
npm install
npx prisma db push --force-reset
npx tsx prisma/seed.ts
npx tsx src/index.ts

# 2. Start Frontend
cd frontend-next
npm install
npm run dev
```

## Access URLs
- Backend API: http://localhost:3001
- Frontend: http://localhost:3000
- API Health: http://localhost:3001/api/health
