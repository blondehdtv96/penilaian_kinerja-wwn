const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const outputDir = path.join(__dirname, 'diagrams');

const diagrams = {
  'usecase-overall': `graph LR
    subgraph Sistem["Sistem Manajemen Kinerja VoO / Ide Kaizen"]
        UC1[Login]
        UC2[Pindai QR Area]
        UC3[Ajukan VoO / Ide Kaizen]
        UC4[Lihat Pengajuan Saya]
        UC5[Lihat Skor Kinerja]
        UC6[Lihat Peringkat]
        UC7[Setujui VoO - Foreman]
        UC8[Setujui Akhir VoO - Manager]
        UC9[Catat Pelanggaran]
        UC10[Catat Konseling]
        UC11[Terbitkan Kartu Kuning]
        UC12[Terbitkan Surat Peringatan]
        UC13[Pantau Operator]
        UC14[Dashboard KPI]
        UC15[Analisis Tren]
        UC16[Ekspor Laporan PDF/Excel]
        UC17[Lihat Hash Blockchain]
        UC18[Lihat Log Audit]
        UC19[Kelola Pengguna]
        UC20[Kelola Peran & Hak Akses]
        UC21[Kelola Lokasi QR]
    end
    Operator --> UC1
    Operator --> UC2
    Operator --> UC3
    Operator --> UC4
    Operator --> UC5
    Operator --> UC6
    Foreman --> UC1
    Foreman --> UC7
    Foreman --> UC9
    Foreman --> UC10
    Foreman --> UC11
    Foreman --> UC12
    Foreman --> UC13
    Foreman --> UC6
    SectionManager --> UC1
    SectionManager --> UC8
    SectionManager --> UC14
    SectionManager --> UC15
    SectionManager --> UC16
    SectionManager --> UC17
    SectionManager --> UC18
    SectionManager --> UC6
    SuperAdmin --> UC1
    SuperAdmin --> UC19
    SuperAdmin --> UC20
    SuperAdmin --> UC21`,

  'usecase-per-role': `graph TB
    subgraph Operator["Operator"]
        OP1[Login]
        OP2[Pindai QR Area Kerja]
        OP3[Ajukan VoO / Ide Kaizen]
        OP4[Unggah Foto Bukti]
        OP5[Lihat Status Pengajuan]
        OP6[Riwayat Merit & Pelanggaran]
        OP7[Lihat Skor Kinerja]
        OP8[Lihat Peringkat]
    end
    subgraph Foreman["Foreman"]
        FM1[Login]
        FM2[Persetujuan VoO Tingkat 1]
        FM3[Catat Pelanggaran]
        FM4[Catat Konseling]
        FM5[Terbitkan Kartu Kuning]
        FM6[Terbitkan Surat Peringatan SP1/2/3]
        FM7[Unggah Foto Bukti]
        FM8[Pantau Operator]
    end
    subgraph SectionManager["Section Manager"]
        SM1[Login]
        SM2[Persetujuan Akhir VoO + Beri Poin]
        SM3[Dashboard KPI]
        SM4[Peringkat Operator]
        SM5[Analisis Tren]
        SM6[Ekspor PDF / Excel]
        SM7[Lihat Hash Blockchain]
        SM8[Lihat Log Audit]
    end
    subgraph SuperAdmin["Super Admin"]
        SA1[Login]
        SA2[Kelola Pengguna]
        SA3[Kelola Peran & Hak Akses]
        SA4[Kelola Lokasi QR]
    end`,

  'flowchart-auth': `graph TD
    A[Pengguna Membuka Aplikasi] --> B{Punya Token JWT?}
    B -->|Ya| C[Validasi Token]
    B -->|Tidak| D[Tampilkan Halaman Login]
    C -->|Valid| E[Dekode Peran Pengguna]
    C -->|Tidak Valid/Kedaluwarsa| D
    D --> F[Masukkan Username & Password]
    F --> G[POST /api/auth/login]
    G --> H{Kredensial Valid?}
    H -->|Ya| I[Buat JWT Token]
    H -->|Tidak| J[Tampilkan Error: Kredensial Tidak Valid]
    J --> D
    I --> K[Simpan Token di Zustand]
    K --> E
    E --> L{Peran Pengguna?}
    L -->|Operator| M[Arahkan ke /operator]
    L -->|Foreman| N[Arahkan ke /foreman]
    L -->|Section Manager| O[Arahkan ke /dashboard]
    L -->|Super Admin| P[Arahkan ke /superadmin]`,

  'flowchart-voo': `graph TD
    A[Operator Membuat VoO] --> B[Isi Form: Judul, Deskripsi, Tipe, Foto]
    B --> C[POST /api/voo]
    C --> D[Simpan ke DB dengan status: pending]
    D --> E[Notifikasi Foreman via Socket.IO]
    E --> F[Foreman Meninjau VoO]
    F --> G{Keputusan Foreman}
    G -->|Setujui| H[POST /api/voo/:id/approve-foreman]
    G -->|Tolak| I[Set status: rejected + alasan penolakan]
    H --> J[Status: approved_foreman]
    J --> K[Notifikasi Section Manager via Socket.IO]
    K --> L[Section Manager Meninjau]
    L --> M{Keputusan Manager}
    M -->|Setujui| N[POST /api/voo/:id/approve-manager]
    M -->|Tolak| I
    N --> O[Status: approved_final]
    O --> P[Berikan Poin Merit ke Operator]
    P --> Q[Generate Hash SHA-256]
    Q --> R[Simpan Hash ke Blockchain]
    R --> S[Perbarui Skor Kinerja Operator]
    S --> T[Catat ke EventLog - Jejak Audit]
    I --> U[Notifikasi Operator: Ditolak]
    T --> V[Notifikasi Operator: Disetujui]`,

  'flowchart-misconduct': `graph TD
    A[Foreman Mengidentifikasi Pelanggaran] --> B[Pilih Operator]
    B --> C[Pilih Jenis Pencatatan]
    C --> D{Jenis Catatan}
    D -->|Pelanggaran| E[Isi: Tipe, Tingkat Keparahan, Deskripsi, Foto]
    D -->|Konseling| F[Isi: Topik, Catatan, Tanggal]
    D -->|Kartu Kuning| G[Isi: Alasan]
    D -->|Surat Peringatan| H[Isi: Level SP1/2/3, Alasan]
    E --> I[POST /api/records/misconduct]
    F --> J[POST /api/records/counseling]
    G --> K[POST /api/records/kartu-kuning]
    H --> L[POST /api/records/surat-peringatan]
    I --> M[Kurangi Poin Operator]
    J --> M
    K --> M
    L --> M
    M --> N[Generate Hash Blockchain]
    N --> O[Simpan Hash ke Blockchain]
    O --> P[Perbarui Skor Kinerja Operator]
    P --> Q[Catat ke EventLog]
    Q --> R[Notifikasi Operator]`,

  'flowchart-qr-scan': `graph TD
    A[Operator Membuka Pemindai] --> B[Kamera Diaktifkan]
    B --> C[Pindai QR Code]
    C --> D[Dekode Data QR]
    D --> E[POST /api/operators/scan-qr]
    E --> F{Jenis QR?}
    F -->|QR Area| G[Cocokkan dengan Lokasi QR]
    F -->|QR Operator| H[Identifikasi Operator]
    G --> I[Buat Catatan QrScanLog]
    H --> J[Tampilkan Profil Operator]
    I --> K[Catat Kehadiran dengan Timestamp]
    K --> L[Tampilkan Konfirmasi: Area + Waktu]
    J --> M[Foreman Dapat Catat Merit/Pelanggaran]`,

  'activity-voo': `graph TD
    Mulai([Mulai]) --> A1[Operator Login]
    A1 --> A2[Buka Halaman VoO]
    A2 --> A3[Isi Form Pengajuan]
    A3 --> A4{Form Valid?}
    A4 -->|Tidak| A5[Tampilkan Error Validasi]
    A5 --> A3
    A4 -->|Ya| A6[Kirim VoO]
    A6 --> A7[Sistem Menyimpan Pengajuan]
    A7 --> A8[Status = pending]
    A8 --> A9[Sistem Notifikasi Foreman]
    A9 --> A10[Foreman Meninjau Pengajuan]
    A10 --> A11{Setujui atau Tolak?}
    A11 -->|Tolak| A12[Tetapkan Alasan Penolakan]
    A12 --> A13[Status = rejected]
    A13 --> A14[Sistem Notifikasi Operator]
    A11 -->|Setujui| A15[Status = approved_foreman]
    A15 --> A16[Sistem Notifikasi Section Manager]
    A16 --> A17[Manager Meninjau Pengajuan]
    A17 --> A18{Setujui atau Tolak?}
    A18 -->|Tolak| A12
    A18 -->|Setujui| A19[Berikan Poin Merit]
    A19 --> A20[Status = approved_final]
    A20 --> A21[Generate Hash SHA-256]
    A21 --> A22[Neo Hash ke Blockchain]
    A22 --> A23[Perbarui Skor Kinerja Operator]
    A23 --> A24[Buat Catatan Log Audit]
    A24 --> A25[Sistem Notifikasi Operator]
    A14 --> Selesai([Selesai])
    A25 --> Selesai`,

  'activity-misconduct': `graph TD
    Mulai([Mulai]) --> B1[Foreman Login]
    B1 --> B2[Pindai QR Operator atau Pilih Operator]
    B2 --> B3[Pilih Jenis Catatan]
    B3 --> B4{Jenis Catatan?}
    B4 -->|Pelanggaran| B5[Pilih Tingkat Keparahan: Rendah/Sedang/Tinggi/Kritis]
    B5 --> B6[Isi Deskripsi & Unggah Bukti]
    B4 -->|Konseling| B7[Isi Topik & Catatan]
    B7 --> B8[Tetapkan Tanggal Konseling]
    B4 -->|Kartu Kuning| B9[Isi Alasan Kartu Kuning]
    B4 -->|Surat Peringatan| B10[Pilih Level: SP1/SP2/SP3]
    B10 --> B11[Isi Alasan]
    B6 --> B12[Kirim Catatan]
    B8 --> B12
    B9 --> B12
    B11 --> B12
    B12 --> B13[Sistem Memvalidasi Input]
    B13 --> B14{Valid?}
    B14 -->|Tidak| B15[Tampilkan Error]
    B15 --> B3
    B14 -->|Ya| B16[Simpan Catatan ke Database]
    B16 --> B17[Kurangi Poin Kinerja]
    B17 --> B18[Generate Hash Blockchain]
    B18 --> B19[Simpan Hash ke Ethereum]
    B19 --> B20[Perbarui Skor Operator]
    B20 --> B21[Buat Log Audit]
    B21 --> B22[Notifikasi Operator]
    B22 --> Selesai([Selesai])`,

  'activity-login': `graph TD
    Mulai([Mulai]) --> C1[Buka Aplikasi]
    C1 --> C2{Token Tersedia?}
    C2 -->|Tidak| C3[Tampilkan Halaman Login]
    C2 -->|Ya| C4[Validasi JWT Token]
    C4 --> C5{Token Valid?}
    C5 -->|Tidak| C3
    C5 -->|Ya| C6[Dekode Data Pengguna]
    C3 --> C7[Masukkan Kredensial]
    C7 --> C8[Kirim Permintaan Login]
    C8 --> C9{Terautentikasi?}
    C9 -->|Tidak| C10[Tampilkan Pesan Error]
    C10 --> C3
    C9 -->|Ya| C11[Terima JWT Token]
    C11 --> C12[Simpan di Zustand Store]
    C12 --> C6
    C6 --> C13{Peran?}
    C13 -->|Operator| C14[Dashboard Operator]
    C13 -->|Foreman| C15[Dashboard Foreman]
    C13 -->|Section Manager| C16[Dashboard KPI Manager]
    C13 -->|Super Admin| C17[Panel Admin]
    C14 --> Selesai([Selesai])
    C15 --> Selesai
    C16 --> Selesai
    C17 --> Selesai`,

  'seq-login': `sequenceDiagram
    actor Pengguna
    participant FE as Frontend (Next.js)
    participant API as Backend (Express.js)
    participant DB as Database (SQLite)
    Pengguna->>FE: Masukkan username & password
    FE->>FE: Validasi input form
    FE->>API: POST /api/auth/login {username, password}
    API->>DB: Cari pengguna berdasarkan username
    DB-->>API: Kembalikan data pengguna
    API->>API: Verifikasi password dengan bcrypt
    API->>API: Buat JWT token
    API-->>FE: Kembalikan {token, user}
    FE->>FE: Simpan token & user di Zustand
    FE->>FE: Arahkan berdasarkan peran
    FE-->>Pengguna: Tampilkan dashboard`,

  'seq-voo-approval': `sequenceDiagram
    actor OP as Operator
    participant FE as Frontend
    participant API as Backend API
    participant DB as Database
    participant BC as Layanan Blockchain
    participant FM as Foreman
    participant SM as Section Manager
    OP->>FE: Isi form VoO (judul, deskripsi, tipe, foto)
    FE->>API: POST /api/voo {operatorId, judul, deskripsi, tipe, foto}
    API->>DB: Buat VooSubmission (status: pending)
    API->>DB: Buat catatan EventLog
    API-->>FE: Kembalikan data pengajuan
    FE-->>OP: Tampilkan pesan berhasil
    API-->>FM: Notifikasi Socket.IO: VoO baru menunggu persetujuan
    FM->>FE: Buka daftar VoO pending
    FE->>API: GET /api/voo?status=pending
    API->>DB: Query pengajuan pending
    DB-->>API: Kembalikan daftar
    API-->>FE: Kembalikan daftar VoO
    FE-->>FM: Tampilkan VoO pending
    FM->>FE: Klik Setujui pada VoO
    FE->>API: POST /api/voo/:id/approve-foreman
    API->>DB: Perbarui status = approved_foreman
    API->>DB: Buat catatan Approval
    API->>DB: Buat catatan EventLog
    API-->>FE: Kembalikan VoO yang diperbarui
    FE-->>FM: Tampilkan konfirmasi persetujuan
    API-->>SM: Notifikasi Socket.IO: VoO menunggu persetujuan akhir
    SM->>FE: Buka VoO untuk tinjauan akhir
    FE->>API: GET /api/voo?status=approved_foreman
    API->>DB: Query pengajuan yang disetujui foreman
    DB-->>API: Kembalikan daftar
    API-->>FE: Kembalikan daftar VoO
    FE-->>SM: Tampilkan VoO untuk persetujuan akhir
    SM->>FE: Klik Setujui Akhir + tetapkan poin
    FE->>API: POST /api/voo/:id/approve-manager {poin}
    API->>DB: Perbarui status = approved_final, tetapkan poin
    API->>DB: Buat catatan Approval
    API->>DB: Perbarui totalMerit & performanceScore Operator
    API->>BC: Generate hash SHA-256 dari data pengajuan
    BC->>BC: Neo hash ke blockchain Ethereum
    BC-->>API: Kembalikan {txHash, blockNumber}
    API->>DB: Simpan catatan BlockchainHash
    API->>DB: Buat catatan EventLog
    API-->>FE: Kembalikan hasil persetujuan akhir
    FE-->>SM: Tampilkan konfirmasi dengan tx blockchain
    API-->>OP: Notifikasi Socket.IO: VoO disetujui`,

  'seq-misconduct': `sequenceDiagram
    actor FM as Foreman
    participant FE as Frontend
    participant API as Backend API
    participant DB as Database
    participant BC as Layanan Blockchain
    actor OP as Operator
    FM->>FE: Pindai QR Code Operator
    FE->>API: POST /api/operators/scan-qr {dataQR}
    API->>DB: Cari operator berdasarkan data QR
    DB-->>API: Kembalikan profil operator
    API-->>FE: Kembalikan info operator
    FE-->>FM: Tampilkan detail operator
    FM->>FE: Pilih Catat Pelanggaran
    FM->>FE: Isi form pelanggaran (tipe, keparahan, deskripsi, foto)
    FE->>API: POST /api/records/misconduct {operatorId, tipe, keparahan, deskripsi, foto}
    API->>API: Validasi input & cek hak akses
    API->>DB: Buat catatan Misconduct
    API->>DB: Perbarui totalMisconduct Operator
    API->>DB: Hitung ulang performanceScore
    API->>BC: Generate hash SHA-256
    BC->>BC: Neo ke blockchain
    BC-->>API: Kembalikan {txHash, blockNumber}
    API->>DB: Simpan catatan BlockchainHash
    API->>DB: Buat catatan EventLog
    API-->>FE: Kembalikan catatan pelanggaran
    FE-->>FM: Tampilkan konfirmasi
    API-->>OP: Notifikasi Socket.IO: Pelanggaran baru dicatat`,

  'seq-qr-scan': `sequenceDiagram
    actor OP as Operator
    participant FE as Frontend
    participant API as Backend API
    participant DB as Database
    OP->>FE: Buka halaman Pemindai QR
    FE->>FE: Aktifkan kamera perangkat
    OP->>FE: Pindai QR code area
    FE->>FE: Dekode data QR
    FE->>API: POST /api/operators/scan-qr {kodeQR, tipe: area}
    API->>DB: Cari QrLocation berdasarkan kode
    DB-->>API: Kembalikan data lokasi
    API->>DB: Buat catatan QrScanLog
    API-->>FE: Kembalikan {lokasi, waktuPindai}
    FE-->>OP: Tampilkan konfirmasi: Nama area + waktu`,

  'seq-dashboard': `sequenceDiagram
    actor SM as Section Manager
    participant FE as Frontend
    participant API as Backend API
    participant DB as Database
    SM->>FE: Buka Dashboard
    FE->>API: GET /api/dashboard/kpi
    API->>API: Verifikasi peran Section Manager
    API->>DB: Hitung total operator
    API->>DB: Hitung pengajuan VoO (berdasarkan status)
    API->>DB: Hitung pelanggaran (berdasarkan keparahan)
    API->>DB: Hitung konseling
    API->>DB: Hitung kartu kuning & surat peringatan
    API->>DB: Hitung tren bulanan
    API->>DB: Dapatkan operator teratas berdasarkan skor
    DB-->>API: Kembalikan data agregat
    API-->>FE: Kembalikan data dashboard KPI
    FE-->>SM: Render grafik, tabel, dan metrik
    SM->>FE: Klik Ekspor Excel
    FE->>API: GET /api/dashboard/export/excel
    API->>DB: Query semua data kinerja
    DB-->>API: Kembalikan data mentah
    API->>API: Generate file Excel
    API-->>FE: Kembalikan stream file Excel
    FE-->>SM: Unduh file Excel
    SM->>FE: Klik Ekspor PDF
    FE->>API: GET /api/dashboard/export/pdf
    API->>DB: Query semua data kinerja
    DB-->>API: Kembalikan data mentah
    API->>API: Generate dokumen PDF
    API-->>FE: Kembalikan stream file PDF
    FE-->>SM: Unduh file PDF`,

  'seq-blockchain': `sequenceDiagram
    participant API as Backend API
    participant BC as Layanan Blockchain
    participant ETH as Ethereum (Ganache)
    participant DB as Database
    API->>BC: hashData(tipeEntitas, idEntitas, data)
    BC->>BC: Buat payload JSON
    BC->>BC: Hash SHA-256 dari payload
    BC-->>API: Kembalikan string hash
    API->>BC: simpanHash(hash, tipeEntitas, idEntitas)
    BC->>ETH: Deploy/Panggil smart contract
    ETH-->>BC: Kembalikan {txHash, blockNumber, contractAddress}
    BC-->>API: Kembalikan bukti blockchain
    API->>DB: Buat catatan BlockchainHash
    Note over DB: tipeEntitas, idEntitas, txHash, blockNumber, contractAddress, data
    DB-->>API: Konfirmasi penyimpanan`,

  'arch-overview': `graph TB
    subgraph Klien["Lapisan Klien"]
        Browser[Peramban Web]
    end
    subgraph Frontend["Frontend - Next.js 14"]
        Pages[Halaman App Router]
        Components[Komponen Bersama]
        Store[Zustand Store]
        APIClient[Klien API - Axios]
        SocketClient[Klien Socket.IO]
    end
    subgraph Backend["Backend - Express.js"]
        Router[Route API]
        MW[Middleware: Auth + Audit]
        Controllers[Kontroler]
        Services[Layanan Bisnis]
        SocketServer[Server Socket.IO]
    end
    subgraph Data["Lapisan Data"]
        Prisma[Prisma ORM]
        SQLite[(Database SQLite)]
        Blockchain[Ethereum Ganache]
    end
    Browser --> Frontend
    Frontend -->|HTTP REST| Backend
    Frontend -->|WebSocket| Backend
    Backend --> Data
    Services --> Blockchain`,

  'arch-data-flow': `graph LR
    A[Aksi Pengguna] --> B[Komponen Frontend]
    B --> C[Panggilan API Axios]
    C --> D[Route Express]
    D --> E[Middleware Auth]
    E --> F[Kontroler]
    F --> G[Lapisan Service]
    G --> H[Query Prisma]
    H --> I[(Database)]
    G --> J[Layanan Blockchain]
    J --> K[Jaringan Ethereum]
    F --> L[Middleware Audit]
    L --> M[Tabel EventLog]
    G --> N[Socket.IO Emit]
    N --> O[Klien Terhubung]`,

  'arch-performance-score': `graph TD
    A[Skor Kinerja] --> B[Skor Dasar: 100]
    B --> C{Peristiwa}
    C --> D[+VoO Disetujui]
    C --> E[-Pelanggaran]
    C --> F[-Kartu Kuning]
    C --> G[-Surat Peringatan]
    D --> H[Tambah poin merit dari VoO yang disetujui]
    E --> I[Kurangi poin berdasarkan keparahan]
    F --> J[Kurangi poin tetap kartu kuning]
    G --> K[Kurangi poin berdasarkan level SP]
    H --> L[Skor Kinerja Akhir]
    I --> L
    J --> L
    K --> L
    L --> M[Perbarui Operator.performanceScore]
    M --> N[Hitung Ulang Peringkat]`
};

function encodeMermaid(code) {
  const json = JSON.stringify({ code, mermaid: { theme: 'default' } });
  const deflated = zlib.deflateSync(json, { level: 9 });
  return deflated.toString('base64url');
}

function fetchSVG(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchSVG(res.headers.location).then(resolve).catch(reject);
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) resolve(data);
        else reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`));
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function generateAll() {
  const names = Object.keys(diagrams);
  console.log(`Generating ${names.length} SVG diagrams...\n`);

  let success = 0;
  let failed = 0;

  for (const name of names) {
    const code = diagrams[name];
    const encoded = encodeMermaid(code);
    const url = `https://mermaid.ink/svg/pako:${encoded}`;
    const outFile = path.join(outputDir, `${name}.svg`);

    try {
      process.stdout.write(`  [${success + failed + 1}/${names.length}] ${name}...`);
      const svg = await fetchSVG(url);
      fs.writeFileSync(outFile, svg, 'utf8');
      console.log(' OK');
      success++;
    } catch (err) {
      console.log(` FAILED: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone: ${success} succeeded, ${failed} failed`);
  console.log(`Output: ${outputDir}`);
}

generateAll();
