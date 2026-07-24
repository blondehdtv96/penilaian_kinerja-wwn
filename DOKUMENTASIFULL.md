# Dokumentasi Diagram — Sistem Penilaian Kinerja VoO / Ide Kaizen + Disiplin Terintegrasi

> Dokumen ini merangkum **seluruh diagram** yang tersedia di `docs/diagrams/` dan
> `docs/diagram.md`, menjelaskan **isi, tujuan, dan cara membacanya** masing-masing.
> Sumber diagram digenerate dari deep-dive kode aktual (backend Express + Prisma +
> Socket.IO, frontend Ionic Vue 3 + Pinia) sehingga merefleksikan implementasi nyata,
> bukan rancangan awal saja.

## Daftar Isi

1. [Ringkasan Sistem](#1-ringkasan-sistem)
2. [Struktur File Diagram](#2-struktur-file-diagram)
3. [Use Case Diagram](#3-use-case-diagram)
4. [Flowchart](#4-flowchart)
5. [Activity Diagram](#5-activity-diagram)
6. [Sequence Diagram](#6-sequence-diagram)
7. [Class Diagram](#7-class-diagram)
8. [Diagram Arsitektur](#8-diagram-arsitektur-tambahan)
9. [Peta Keterkaitan Antar Diagram](#9-peta-keterkaitan-antar-diagram)
10. [Cara Meregenerasi Diagram](#10-cara-meregenerasi-diagram)

---

## 1. Ringkasan Sistem

Platform manajemen kinerja operator produksi dengan dua pilar utama:

| Pilar | Deskripsi |
|---|---|
| **Merit (VoO / Ide Kaizen)** | Operator mengajukan usulan perbaikan/ide kaizen → disetujui berjenjang (Foreman → Section Manager) → poin merit ditambahkan ke skor kinerja. |
| **Disiplin (Misconduct)** | Foreman/Section Manager mencatat pelanggaran dari katalog jenis pelanggaran → poin akumulasi dihitung → mesin eskalasi menandai kebutuhan tindak lanjut (Konseling → Kartu Kuning → SP1 → SP2 → SP3). |

**Peran pengguna (5):** Super Admin, Section Manager, Foreman, Staff Produksi (read‑only monitor), Operator.

**Stack teknis yang direfleksikan di diagram:**
- Backend: Express.js + TypeScript + Prisma ORM (SQLite dev / PostgreSQL prod) + Socket.IO
- Frontend: Ionic Vue 3 + Pinia + Axios
- Integritas data: hashing SHA-256 per transaksi penting (VoO & Misconduct), opsional dianchor ke smart contract Ethereum (Ganache)

---

## 2. Struktur File Diagram

```
docs/
├── diagram.md                      # indeks diagram gabungan (versi ringkas)
├── DOKUMENTASIFULL.md              # dokumen ini — penjelasan lengkap
├── generate-svgs.js                # source Mermaid tiap diagram individual
├── combine-svgs.js                 # penggabung SVG individual → per kategori
└── diagrams/
    ├── usecase.svg                 # gabungan: use case
    ├── flowchart.svg               # gabungan: flowchart
    ├── activity.svg                # gabungan: activity
    ├── sequence.svg                # gabungan: sequence
    ├── class.svg                   # gabungan: class
    ├── arch.svg                    # gabungan: arsitektur (bonus)
    └── individual/
        ├── usecase-overall.svg, usecase-per-role.svg
        ├── flowchart-auth.svg, flowchart-voo.svg, flowchart-misconduct.svg,
        │   flowchart-disciplinary.svg, flowchart-qr-scan.svg
        ├── activity-login.svg, activity-voo.svg, activity-misconduct.svg
        ├── seq-login.svg, seq-voo-approval.svg, seq-misconduct.svg,
        │   seq-realtime-notification.svg, seq-qr-scan.svg, seq-dashboard.svg,
        │   seq-blockchain.svg
        ├── class-domain.svg, class-backend.svg
        └── arch-overview.svg, arch-data-flow.svg, arch-performance-score.svg
```

- **`diagrams/<kategori>.svg`** — satu file SVG gabungan per tipe diagram (semua sub-diagram kategori tersebut disusun vertikal dalam satu kanvas, dengan judul & label). Cocok untuk dilihat sekilas satu kategori penuh.
- **`diagrams/individual/*.svg`** — versi per-diagram terpisah, dipakai bila butuh detail satu alur spesifik tanpa scroll panjang.

Total: **6 kategori, 22 diagram individual.**

---

## 3. Use Case Diagram

📁 Gabungan: `diagrams/usecase.svg` · Individual: `usecase-overall.svg`, `usecase-per-role.svg`

### 3.1 Keseluruhan Sistem (`usecase-overall`)
Menunjukkan seluruh aktor (5 peran) dan 22 use case sistem dalam satu diagram, mengelompokkan use case ke dalam boundary "Sistem Penilaian Kinerja VoO / Ide Kaizen". Contoh pemetaan aktor → use case:

| Aktor | Use case utama |
|---|---|
| Operator | Login, Pindai QR, Ajukan VoO/Ide Kaizen, Lihat Pengajuan & Merit Saya, Lihat Skor Kinerja & Riwayat Disiplin |
| Foreman | Login, Setujui VoO (tahap 1), Catat Pelanggaran, Catat Konseling, Terbitkan Kartu Kuning/SP, Pantau Operator |
| Staff Produksi | Login, Monitor VoO & Pelanggaran (read-only) |
| Section Manager | Login, Setujui Akhir VoO + Beri Poin, Acknowledge Konseling, Kelola Katalog Pelanggaran, Konfigurasi Ambang Eskalasi, Dashboard KPI, Ekspor Laporan, Lihat Hash Blockchain, Lihat Log Audit, Lihat Peringkat Operator |
| Super Admin | Login, Kelola Pengguna/Peran/Lokasi QR (mengelola akses seluruh sistem) |

**Tujuan:** memberi gambaran cepat tentang batas tanggung jawab tiap peran dan fitur mana yang eksklusif untuk peran tertentu (misal, hanya Section Manager yang bisa mengubah ambang eskalasi).

### 3.2 Per Peran (`usecase-per-role`)
Versi rinci per peran, masing-masing sebagai subgraph terpisah (Operator, Foreman, Staff Produksi, Section Manager, Super Admin) berisi daftar use case spesifik peran tersebut — cocok dijadikan referensi saat menulis kebutuhan fungsional (SRS) per role atau saat menyusun hak akses (permission) di backend.

---

## 4. Flowchart

📁 Gabungan: `diagrams/flowchart.svg` · Individual: `flowchart-auth.svg`, `flowchart-voo.svg`, `flowchart-misconduct.svg`, `flowchart-disciplinary.svg`, `flowchart-qr-scan.svg`

Flowchart menjelaskan **logika keputusan (branching)** dari sudut pandang proses backend/frontend, berbeda dengan Activity Diagram yang lebih menyoroti alur kerja pengguna.

### 4.1 Autentikasi & Navigasi Peran (`flowchart-auth`)
Alur mulai dari cek token di `localStorage`, validasi token saat panggil API (401 → logout paksa), proses login (`bcrypt.compare` + `jwt.sign`), hingga redirect sesuai peran:
- Operator → `/performance`
- Foreman → `/voo/approve`
- Staff Produksi → `/staff/voo-monitor`
- Section Manager / Super Admin → `/dashboard`

### 4.2 Pengajuan & Persetujuan VoO (`flowchart-voo`)
Alur penuh dari pengisian form (judul, deskripsi, tipe, Group/Shift, Sumber VoO, Kategori 4M, klasifikasi, foto) → `POST /api/voo` → status `pending` → notifikasi Foreman → keputusan Foreman (`approved_foreman`/`rejected`) → keputusan Section Manager (`approved_final` + poin/`rejected`) → pembaruan `totalMerit` & `performanceScore` operator → penyimpanan hash blockchain di setiap tahap penting.

### 4.3 Pencatatan Pelanggaran (`flowchart-misconduct`)
Menyorot **transaksi Prisma** saat mencatat pelanggaran: validasi `ViolationType` & `Operator` harus ada (jika tidak → rollback dengan `ValidationError`/`NotFoundError`), snapshot poin dari katalog, rekalkulasi `accumulatedPoints`/`performanceScore`/`totalMisconduct`, lalu evaluasi mesin eskalasi (`requiredStep` vs `currentLevel`) untuk memicu notifikasi tindak lanjut bila perlu — dengan penekanan **duplikat notifikasi ditekan** jika langkah belum berubah.

### 4.4 Tindakan Disiplin — Konseling / Kartu Kuning / Surat Peringatan (`flowchart-disciplinary`)
Percabangan 3 jalur sesuai jenis tindakan:
- **Konseling** — wajib mengacu ke `Misconduct` yang sudah ada; 1 pelanggaran maksimal 1 sesi konseling (`DuplicateError` jika sudah ada); diakhiri dengan acknowledge oleh Section Manager.
- **Kartu Kuning** — cek apakah `accumulatedPoints` masih di bawah ambang (boleh diterbitkan manual via `isManualOverride = true`) atau sudah capai level Kartu Kuning tapi belum pernah diterbitkan (jika sudah → `DuplicateError`).
- **Surat Peringatan** — validasi level harus 1/2/3, tidak boleh duplikat pada level yang sama, dan **harus berurutan** (SP2 tidak bisa diterbitkan sebelum SP1 ada → `SequenceError`).

### 4.5 Pemindaian QR (`flowchart-qr-scan`)
Dua mode data QR yang didukung: `locationCode` (area kerja → simpan `QrScanLog`) atau `employeeId` (profil operator). Cabang error untuk lokasi/operator tidak ditemukan, atau format QR tidak dikenali.

---

## 5. Activity Diagram

📁 Gabungan: `diagrams/activity.svg` · Individual: `activity-login.svg`, `activity-voo.svg`, `activity-misconduct.svg`

Activity Diagram berfokus pada **alur aktivitas pengguna** dari awal (`Mulai`) hingga akhir (`Selesai`), termasuk swimlane keputusan (decision) di setiap tahap.

### 5.1 Login & Navigasi Berdasarkan Peran (`activity-login`)
Mengikuti pengguna dari membuka aplikasi → cek token tersimpan → (jika tidak ada/kedaluwarsa) isi kredensial → autentikasi → terima JWT + koneksi Socket.IO → simpan sesi → baca peran → landing page sesuai peran (4 percabangan akhir: Operator/Foreman/Staff Produksi/Manager-Admin).

### 5.2 Pengajuan VoO / Ide Kaizen (`activity-voo`)
Alur operator dari login hingga pengajuan disetujui final, mencakup validasi form (dengan loop kembali ke pengisian jika tidak valid), dua tahap persetujuan berjenjang, dan pembagian hasil akhir: **ditolak** (notif alasan) atau **disetujui** (poin merit + `totalMerit +1` + `performanceScore += poin × 0.5` + hash blockchain).

### 5.3 Pencatatan Pelanggaran & Eskalasi Disiplin (`activity-misconduct`)
Alur dari pemilihan operator & jenis pelanggaran, validasi transaksi, rekalkulasi skor, hingga evaluasi ambang eskalasi dengan percabangan 4 arah berdasarkan `accumulatedPoints`:
- ≥ 5 poin → Konseling
- ≥ 10 poin → Kartu Kuning
- ≥ 20 / 30 / 40 poin → SP1 / SP2 / SP3

> Ambang di atas adalah **nilai default** (`DEFAULT_THRESHOLDS` pada `escalation.ts`); Section Manager dapat mengganti nilai ini melalui use case "Konfigurasi Ambang Eskalasi", asal tetap menaik secara ketat (`counseling < kartuKuning < sp1 < sp2 < sp3`).

---

## 6. Sequence Diagram

📁 Gabungan: `diagrams/sequence.svg` · Individual: `seq-login.svg`, `seq-voo-approval.svg`, `seq-misconduct.svg`, `seq-realtime-notification.svg`, `seq-qr-scan.svg`, `seq-dashboard.svg`, `seq-blockchain.svg`

Sequence Diagram menunjukkan **interaksi antar komponen dari waktu ke waktu** (aktor, Frontend, Backend API, Service, Database, Socket.IO), paling detail dibanding diagram lain — cocok untuk memahami kontrak antar-layer.

| Diagram | Partisipan Kunci | Poin Penting |
|---|---|---|
| `seq-login` | Pengguna, Frontend, Backend, SQLite, Socket.IO | Setelah token diterima, klien langsung membuka koneksi Socket.IO dengan JWT di handshake, lalu join room `user:<id>` dan `role:<nama>` sebelum fetch notifikasi awal. |
| `seq-voo-approval` | Operator, Frontend, API, `VooService`, `NotificationService`, DB, `BlockchainService`, Foreman, Section Manager | Menunjukkan **3 tahap** (submit → approve Foreman → approve Manager), masing-masing diikuti `storeHash` ke `BlockchainHash` dan notifikasi realtime. |
| `seq-misconduct` | Foreman, Frontend, API, `MisconductService`, DB, Escalation Engine, `NotificationService`, `BlockchainService`, Operator | Menonjolkan blok transaksi (`BEGIN`...`COMMIT`) dan blok `alt` untuk kondisi eskalasi (`requiredStep > currentLevel`). |
| `seq-realtime-notification` | Service pemicu, `NotificationService`, DB, Socket.IO Server, Frontend socket store, UI | Menjelaskan **dua jalur event** — `notification:new` (badge unread) dan `voo:changed`/`record:changed` (trigger refetch data halaman, di-throttle 400ms via `useRealtime`). |
| `seq-qr-scan` | Operator, Frontend, API, DB | Blok `alt` untuk 2 mode QR: `locationCode` (catat `QrScanLog`) vs `employeeId` (tampilkan profil). |
| `seq-dashboard` | Section Manager, Frontend, API, DB | Agregasi KPI (jumlah operator, VoO per status, pelanggaran, konseling, kartu kuning, SP, tren bulanan, top performer) + dua alur ekspor terpisah (Excel & PDF). |
| `seq-blockchain` | Controller, `BlockchainService`, Ethereum Ganache (opsional), DB | Blok `alt` untuk mode dengan/-tanpa smart contract — jika Ganache tidak tersedia, sistem tetap berjalan dalam **mode hash-only** (`txHash = null`). |

---

## 7. Class Diagram

📁 Gabungan: `diagrams/class.svg` · Individual: `class-domain.svg`, `class-backend.svg`

### 7.1 Model Domain (`class-domain`)
Merepresentasikan entitas Prisma inti dan relasinya:

- `Role 1→N User`, `User 1→0..1 Operator`
- `Operator 1→N` (`VooSubmission`, `Misconduct`, `Counseling`, `KartuKuning`, `SuratPeringatan`)
- `ViolationType 1→N Misconduct` (katalog jenis pelanggaran dengan poin terkonfigurasi)
- `Misconduct 1→0..1 Counseling` (relasi 1:1 unik — 1 pelanggaran maksimal 1 konseling)
- `Misconduct N↔N KartuKuning` dan `Misconduct N↔N SuratPeringatan` (via tabel penghubung `KartuKuningMisconduct`/`SuratPeringatanMisconduct`, menyimpan pelanggaran aktif mana saja yang berkontribusi pada penerbitan)
- `VooSubmission 1→N Approval`, `VooSubmission/Misconduct 1→N BlockchainHash` (jejak persetujuan & integritas data)
- `User 1→N Notification`, `User 1→N EventLog` (inbox & audit trail)
- `QrLocation 1→N QrScanLog`, `User 1→N QrScanLog` (log pemindaian QR)

> Catatan: diagram ini disederhanakan (atribut utama saja) dibanding `schema.prisma` sesungguhnya yang juga memiliki `EscalationConfig` (ambang eskalasi override) dan field snapshot tambahan (`accumulatedPointsAtIssuance`, `escalationLevelAtIssuance`, `isManualOverride`) pada `KartuKuning`/`SuratPeringatan`.

### 7.2 Lapisan Backend (`class-backend`)
Menunjukkan pola **Controller → Service → Prisma/Socket.IO** yang dipakai di seluruh modul backend:

- Controller (`AuthController`, `VooController`, `MisconductController`, `OperatorController`, `NotificationController`) hanya memanggil Service terkait, tidak mengakses Prisma langsung.
- `VooController` & `MisconductController` juga memanggil `BlockchainService` untuk `storeHash` setelah operasi berhasil.
- `MisconductService` bergantung pada dua komponen eskalasi terpisah: `EscalationConfigService` (ambil/atur ambang aktif dari DB) dan `EscalationEngine` (fungsi murni tanpa side-effect: `requiredStep`, `shouldNotify`, `validateThresholds`) — pemisahan ini memudahkan pengujian unit terhadap logika eskalasi tanpa mock database.
- Semua Service bermuara ke `PrismaClient`, dan `NotificationService` terhubung ke `SocketIO` untuk push realtime.

---

## 8. Diagram Arsitektur (Tambahan)

📁 Gabungan: `diagrams/arch.svg` · Individual: `arch-overview.svg`, `arch-data-flow.svg`, `arch-performance-score.svg`

### 8.1 Gambaran Umum Arsitektur (`arch-overview`)
Empat lapisan sistem:
1. **Klien** — Peramban / PWA mobile.
2. **Frontend (Ionic Vue 3)** — Halaman per peran, Komponen & `PageShell`, Pinia store (`auth`, `socket`, `notifications`), klien API (Axios), klien Socket.IO (`useRealtime`).
3. **Backend (Express + TypeScript)** — Router per modul, middleware (`authMiddleware` + `checkRole`), Controller, Service + Escalation Engine, Socket.IO Server (room per user & per role).
4. **Data** — Prisma ORM → SQLite (dev)/PostgreSQL (prod), dan opsional Ethereum Ganache untuk anchoring hash.

Komunikasi Frontend↔Backend berjalan lewat **dua kanal**: HTTP REST (dengan JWT di header `Authorization`) dan WebSocket (JWT di handshake).

### 8.2 Alur Data (`arch-data-flow`)
Jalur end-to-end satu aksi pengguna: Komponen Vue → Axios (Bearer JWT) → Route Express → `authMiddleware`+`checkRole` → Controller → Service (logika bisnis) → Query Prisma → Database. Dua cabang tambahan dari Service/Controller: ke `BlockchainService` (hash SHA-256 + Ganache opsional) dan ke `NotificationService` (simpan ke tabel `Notification` + emit Socket.IO ke room terkait, diterima klien lalu memicu refetch/badge).

### 8.3 Perhitungan Skor Kinerja Operator (`arch-performance-score`)
Menjelaskan dua peristiwa yang memengaruhi `Operator.performanceScore`:
- **VoO disetujui final** → `totalMerit += 1`, `performanceScore += poin × 0.5`.
- **Pelanggaran dicatat** → snapshot poin dari `ViolationType`, `accumulatedPoints` = total poin pelanggaran aktif, `performanceScore = max(0, skor − poin)`, `totalMisconduct` = jumlah pelanggaran.

Kedua jalur bermuara ke penyimpanan `Operator` yang diperbarui, dipakai untuk **ranking** (urut `performanceScore` menurun) dan sebagai input **mesin eskalasi** (apakah `accumulatedPoints` sudah mencapai ambang langkah disiplin berikutnya).

---

## 9. Peta Keterkaitan Antar Diagram

Diagram-diagram di atas saling melengkapi dan menjelaskan sistem dari sudut pandang berbeda:

```
Use Case (apa yang bisa dilakukan tiap peran)
        │
        ▼
Activity (alur langkah pengguna end-to-end)
        │
        ▼
Flowchart (logika percabangan & validasi di setiap langkah)
        │
        ▼
Sequence (interaksi antar komponen teknis: FE ↔ API ↔ Service ↔ DB ↔ Socket.IO)
        │
        ▼
Class (struktur data & lapisan kode yang mewujudkan interaksi tersebut)
        │
        ▼
Arsitektur (bagaimana semua lapisan di atas disusun & berkomunikasi secara sistem)
```

Contoh penerapan: fitur **"Ajukan VoO"** dapat ditelusuri lewat rangkaian —
`usecase-overall` (UC3: Ajukan VoO) → `activity-voo` (alur pengguna) →
`flowchart-voo` (logika status & validasi) → `seq-voo-approval` (kontrak API/Service/DB) →
`class-backend`/`class-domain` (kode & entitas yang terlibat: `VooController`, `VooService`, `VooSubmission`) →
`arch-data-flow` (posisi dalam arsitektur sistem secara umum).

---

## 10. Cara Meregenerasi Diagram

Semua diagram di atas berasal dari kode Mermaid yang didefinisikan langsung di `docs/generate-svgs.js` (bukan file `.mmd` terpisah). Untuk memperbarui setelah ada perubahan kode/fitur:

```bash
# 1. Render setiap diagram individual via layanan mermaid.ink (butuh koneksi internet)
node docs/generate-svgs.js

# 2. Gabungkan hasil per kategori menjadi diagrams/<kategori>.svg
node docs/combine-svgs.js
```

- Untuk **menambah diagram baru**: tambahkan entri baru pada objek `diagrams` di `generate-svgs.js` (kode Mermaid), lalu daftarkan pada kategori terkait di `categories` pada `combine-svgs.js` agar ikut digabung.
- Untuk **mengubah tampilan gabungan** (warna aksen, layout, urutan): ubah konstanta `ACCENT`/`INK`/`SUBTLE` atau layout (`PAD`, `GAP`, `MAX_TILE_W`) di `combine-svgs.js`.
- File arsip `diagram individual.rar` dan `diagrams global.rar` di `docs/diagrams/` adalah cadangan/arsip hasil render sebelumnya — tidak perlu diregenerasi kecuali untuk backup.

---
