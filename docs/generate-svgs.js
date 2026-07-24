const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ============================================================================
// Generator diagram SVG — Sistem Penilaian Kinerja (VoO / Ide Kaizen + Disiplin)
// ----------------------------------------------------------------------------
// Sumber kebenaran: kode backend (Express + Prisma) & frontend (Ionic Vue + Pinia)
// per branch `zhafran`. Diperbarui dari deep-dive kode: 5 peran (termasuk Staff
// Produksi), misconduct berbasis katalog ViolationType + escalation engine,
// konseling terikat 1:1 ke pelanggaran, notifikasi realtime Socket.IO by room.
//
// Render: kode Mermaid dikirim ke layanan publik mermaid.ink → hasil SVG.
// Kategori diagram: FLOWCHART, ACTIVITY, USE CASE, SEQUENCE, CLASS, (bonus) ARCH.
// ============================================================================

// SVG per-diagram individual disimpan di sub-folder `individual/`.
// Versi gabungan per-kategori (flowchart.svg, sequence.svg, dst.) dibuat oleh
// `combine-svgs.js` dan diletakkan di `diagrams/`.
const outputDir = path.join(__dirname, 'diagrams', 'individual');

const diagrams = {
  // ==========================================================================
  // USE CASE (2)
  // ==========================================================================
  'usecase-overall': `graph LR
    Operator([Operator])
    Foreman([Foreman])
    StaffProduksi([Staff Produksi])
    SectionManager([Section Manager])
    SuperAdmin([Super Admin])

    subgraph Sistem["Sistem Penilaian Kinerja VoO / Ide Kaizen"]
        UC1[Login]
        UC2[Pindai QR Area / Operator]
        UC3[Ajukan VoO / Ide Kaizen]
        UC4[Lihat Pengajuan & Merit Saya]
        UC5[Lihat Skor Kinerja & Riwayat Disiplin]
        UC6[Lihat Peringkat Operator]
        UC7[Setujui VoO - Foreman]
        UC8[Setujui Akhir VoO + Beri Poin]
        UC9[Catat Pelanggaran dari Katalog]
        UC10[Catat Konseling atas Pelanggaran]
        UC11[Terbitkan Kartu Kuning]
        UC12[Terbitkan Surat Peringatan SP1-3]
        UC13[Pantau Operator & Workspace Pembinaan]
        UC14[Acknowledge Konseling]
        UC15[Kelola Katalog Jenis Pelanggaran]
        UC16[Konfigurasi Ambang Eskalasi]
        UC17[Dashboard KPI & Tren]
        UC18[Ekspor Laporan PDF / Excel]
        UC19[Lihat Hash Blockchain]
        UC20[Lihat Log Audit]
        UC21[Monitor VoO & Pelanggaran - read only]
        UC22[Kelola Pengguna, Peran, Lokasi QR]
    end

    Operator --> UC1
    Operator --> UC2
    Operator --> UC3
    Operator --> UC4
    Operator --> UC5

    Foreman --> UC1
    Foreman --> UC7
    Foreman --> UC9
    Foreman --> UC10
    Foreman --> UC11
    Foreman --> UC12
    Foreman --> UC13

    StaffProduksi --> UC1
    StaffProduksi --> UC21

    SectionManager --> UC1
    SectionManager --> UC8
    SectionManager --> UC9
    SectionManager --> UC13
    SectionManager --> UC14
    SectionManager --> UC15
    SectionManager --> UC16
    SectionManager --> UC17
    SectionManager --> UC18
    SectionManager --> UC19
    SectionManager --> UC20
    SectionManager --> UC6

    SuperAdmin --> UC1
    SuperAdmin --> UC22`,

  'usecase-per-role': `graph TB
    subgraph Operator["Operator - mobile"]
        OP1[Login]
        OP2[Pindai QR Area Kerja]
        OP3[Ajukan VoO / Ide Kaizen + Foto]
        OP4[Lihat Status Pengajuan Saya]
        OP5[Lihat Skor Kinerja]
        OP6[Lihat Riwayat Merit & Pelanggaran]
        OP7[Lihat Kartu Kuning / SP Saya]
    end
    subgraph Foreman["Foreman"]
        FM1[Login]
        FM2[Persetujuan VoO Tingkat 1]
        FM3[Catat Pelanggaran dari Katalog]
        FM4[Catat Konseling atas Pelanggaran]
        FM5[Terbitkan Kartu Kuning]
        FM6[Terbitkan Surat Peringatan SP1/2/3]
        FM7[Workspace Pembinaan & Pantau Operator]
    end
    subgraph StaffProduksi["Staff Produksi - read only"]
        SP1[Login]
        SP2[Monitor Pengajuan VoO / Kaizen]
        SP3[Monitor Catatan Pelanggaran]
    end
    subgraph SectionManager["Section Manager"]
        SM1[Login]
        SM2[Persetujuan Akhir VoO + Beri Poin]
        SM3[Acknowledge Konseling]
        SM4[Kelola Katalog Jenis Pelanggaran]
        SM5[Konfigurasi Ambang Eskalasi]
        SM6[Dashboard KPI & Analisis Tren]
        SM7[Peringkat Operator]
        SM8[Ekspor PDF / Excel]
        SM9[Lihat Hash Blockchain & Log Audit]
    end
    subgraph SuperAdmin["Super Admin"]
        SA1[Login]
        SA2[Kelola Pengguna]
        SA3[Kelola Peran & Hak Akses]
        SA4[Kelola Lokasi QR]
        SA5[Bypass semua hak akses peran]
    end`,

  // ==========================================================================
  // FLOWCHART (5)
  // ==========================================================================
  'flowchart-auth': `graph TD
    A[Pengguna membuka aplikasi] --> B{Ada token di localStorage?}
    B -->|Ya| C[Set header Authorization + muat user dari store]
    B -->|Tidak| D[Tampilkan Halaman Login]
    C --> E{Token valid saat panggil API?}
    E -->|Ya| F[Baca peran dari Pinia auth store]
    E -->|Tidak / kedaluwarsa 401| D
    D --> G[Input username & password]
    G --> H[POST /api/auth/login]
    H --> I{Kredensial valid & akun aktif?}
    I -->|Tidak| J[Tampilkan error kredensial]
    J --> D
    I -->|Ya| K[bcrypt.compare + jwt.sign userId, role, permissions]
    K --> L[Simpan token & user + connect Socket.IO handshake JWT]
    L --> F
    F --> M{Peran pengguna?}
    M -->|Operator| N[Redirect /performance]
    M -->|Foreman| O[Redirect /voo/approve]
    M -->|Staff Produksi| P[Redirect /staff/voo-monitor]
    M -->|Section Manager / Super Admin| Q[Redirect /dashboard]`,

  'flowchart-voo': `graph TD
    A[Operator atau Foreman isi form VoO] --> B[Judul, deskripsi, tipe, Group/Shift, Sumber VoO, Kategori 4M, foto]
    B --> C[POST /api/voo]
    C --> D[VooService.create simpan status = pending]
    D --> E[notifyRole Foreman + emit voo:changed]
    E --> F[Controller simpan BlockchainHash SHA-256]
    F --> G[Foreman meninjau di /voo/approve]
    G --> H{Keputusan Foreman}
    H -->|Tolak| I[status = rejected + alasan]
    I --> J[Notif Operator: ditolak]
    H -->|Setujui| K[status = approved_foreman + catat Approval]
    K --> L[Notif Operator + notifyRole Section Manager]
    L --> M[Section Manager tinjau di /voo/final]
    M --> N{Keputusan Manager}
    N -->|Tolak| I
    N -->|Setujui + poin| O[status = approved_final + catat Approval]
    O --> P[Operator.totalMerit +1, performanceScore += poin x 0.5]
    P --> Q[Simpan BlockchainHash + Notif Operator: disetujui + poin]
    J --> R[emit voo:changed ke room terkait]
    Q --> R`,

  'flowchart-misconduct': `graph TD
    A[Foreman / Section Manager buka Workspace Pembinaan] --> B[Pilih operator + jenis pelanggaran dari katalog ViolationType]
    B --> C[POST /api/records/misconduct]
    C --> D[Mulai transaksi Prisma]
    D --> E{ViolationType ada?}
    E -->|Tidak| F[ValidationError - transaksi batal]
    E -->|Ya| G{Operator ada?}
    G -->|Tidak| H[NotFoundError - transaksi batal]
    G -->|Ya| I[Buat Misconduct + snapshot points dari katalog]
    I --> J[accumulatedPoints = jumlah poin misconduct aktif]
    J --> K["performanceScore = max(0, skor - poin)"]
    K --> L[totalMisconduct = count + commit transaksi]
    L --> M[Controller simpan BlockchainHash]
    M --> N[Notif Operator + notifyRole Section Manager]
    N --> O[Escalation engine: bandingkan requiredStep vs currentLevel]
    O --> P{requiredStep > currentLevel?}
    P -->|Ya| Q[Notif Foreman + SM: langkah eskalasi jatuh tempo]
    P -->|Tidak| R[Tidak ada notifikasi eskalasi - duplikat ditekan]`,

  'flowchart-disciplinary': `graph TD
    Start[Tindak lanjut disiplin di Workspace Pembinaan] --> Choose{Jenis tindakan}

    Choose -->|Konseling| C1[Wajib mengacu Misconduct yang sudah diinput]
    C1 --> C2{Pelanggaran sudah punya konseling?}
    C2 -->|Ya| C3[DuplicateError - 1 pelanggaran maks 1 konseling]
    C2 -->|Tidak| C4[Buat Counseling, operator diturunkan dari misconduct]
    C4 --> C5[Section Manager acknowledge / tanda tangan]

    Choose -->|Kartu Kuning| K1{accumulatedPoints < ambang kartuKuning?}
    K1 -->|Ya| K2[isManualOverride = true - lewati cek duplikat]
    K1 -->|Tidak| K3{currentLevel sudah di Kartu Kuning?}
    K3 -->|Ya| K4[DuplicateError]
    K3 -->|Tidak| K5[Terbitkan + link misconduct aktif + snapshot poin]
    K2 --> K5

    Choose -->|Surat Peringatan| S1{level termasuk 1, 2, atau 3?}
    S1 -->|Tidak| S2[ValidationError]
    S1 -->|Ya| S3{level ini sudah pernah terbit?}
    S3 -->|Ya| S4[DuplicateError]
    S3 -->|Tidak| S5{level 1..N-1 sudah terbit?}
    S5 -->|Tidak| S6[SequenceError - harus berurutan]
    S5 -->|Ya| S7[Terbitkan SP + snapshot poin + link misconduct aktif]`,

  'flowchart-qr-scan': `graph TD
    A[Operator buka halaman Scan] --> B[Kamera aktif - pindai QR]
    B --> C[Decode data QR JSON]
    C --> D[POST /api/operators/scan-qr]
    D --> E{Format data QR?}
    E -->|locationCode| F[Cari QrLocation berdasarkan code]
    F --> G{Lokasi ditemukan?}
    G -->|Tidak| H[Error: QR area tidak valid]
    G -->|Ya| I[Buat QrScanLog + timestamp]
    I --> J[Tampilkan konfirmasi: nama area + waktu]
    E -->|employeeId| K[Cari Operator berdasarkan employeeId]
    K --> L{Operator ditemukan?}
    L -->|Tidak| M[Error: operator tidak ditemukan]
    L -->|Ya| N[Tampilkan profil operator]
    E -->|Lainnya| O[Error: format QR tidak dikenali]`,

  // ==========================================================================
  // ACTIVITY (3)
  // ==========================================================================
  'activity-login': `graph TD
    Mulai([Mulai]) --> C1[Buka aplikasi]
    C1 --> C2{Token tersimpan?}
    C2 -->|Tidak| C3[Tampilkan Halaman Login]
    C2 -->|Ya| C4[Muat token & user ke Pinia]
    C4 --> C5{Token masih valid?}
    C5 -->|Tidak 401| C3
    C5 -->|Ya| C6[Baca data pengguna]
    C3 --> C7[Input kredensial]
    C7 --> C8[POST /api/auth/login]
    C8 --> C9{Terautentikasi?}
    C9 -->|Tidak| C10[Tampilkan pesan error]
    C10 --> C3
    C9 -->|Ya| C11[Terima JWT + connect Socket.IO]
    C11 --> C12[Simpan di store + localStorage]
    C12 --> C6
    C6 --> C13{Peran?}
    C13 -->|Operator| C14[Halaman Kinerja]
    C13 -->|Foreman| C15[Persetujuan VoO]
    C13 -->|Staff Produksi| C16[Monitor VoO]
    C13 -->|Section Manager / Super Admin| C17[Dashboard KPI]
    C14 --> Selesai([Selesai])
    C15 --> Selesai
    C16 --> Selesai
    C17 --> Selesai`,

  'activity-voo': `graph TD
    Mulai([Mulai]) --> A1[Operator login]
    A1 --> A2[Buka halaman Ajukan VoO]
    A2 --> A3[Isi form: judul, deskripsi, tipe, Group/Shift, Sumber VoO, Kategori 4M, foto]
    A3 --> A4{Form valid?}
    A4 -->|Tidak| A5[Tampilkan error validasi]
    A5 --> A3
    A4 -->|Ya| A6[Kirim VoO - POST /api/voo]
    A6 --> A7[Simpan pengajuan status = pending]
    A7 --> A8[Notif Foreman + simpan BlockchainHash]
    A8 --> A9[Foreman meninjau pengajuan]
    A9 --> A10{Setujui atau tolak?}
    A10 -->|Tolak| A11[status = rejected + alasan]
    A11 --> A12[Notif Operator: ditolak]
    A10 -->|Setujui| A13[status = approved_foreman]
    A13 --> A14[Notif Section Manager]
    A14 --> A15[Manager meninjau pengajuan]
    A15 --> A16{Setujui atau tolak?}
    A16 -->|Tolak| A11
    A16 -->|Setujui| A17[Beri poin merit + status = approved_final]
    A17 --> A18[totalMerit +1, performanceScore += poin x 0.5]
    A18 --> A19[Simpan BlockchainHash SHA-256]
    A19 --> A20[Notif Operator: disetujui]
    A12 --> Selesai([Selesai])
    A20 --> Selesai`,

  'activity-misconduct': `graph TD
    Mulai([Mulai]) --> B1[Foreman / Section Manager login]
    B1 --> B2[Buka Workspace Pembinaan, pilih operator]
    B2 --> B3[Pilih jenis pelanggaran dari katalog ViolationType]
    B3 --> B4[Kirim POST /api/records/misconduct]
    B4 --> B5{Transaksi: ViolationType & Operator valid?}
    B5 -->|Tidak| B6[Batalkan transaksi - error]
    B6 --> Selesai([Selesai])
    B5 -->|Ya| B7[Buat Misconduct + snapshot poin]
    B7 --> B8[Recompute accumulatedPoints, totalMisconduct, performanceScore]
    B8 --> B9[Commit transaksi + simpan BlockchainHash]
    B9 --> B10[Notif Operator & Section Manager]
    B10 --> B11{accumulatedPoints capai ambang berikutnya?}
    B11 -->|Tidak| B12[Selesai tanpa eskalasi]
    B11 -->|Ya| B13[Notif Foreman & SM: langkah disiplin jatuh tempo]
    B13 --> B14{Langkah menurut akumulasi poin}
    B14 -->|>= 5| B15[Konseling]
    B14 -->|>= 10| B16[Kartu Kuning]
    B14 -->|>= 20 / 30 / 40| B17[SP1 / SP2 / SP3]
    B15 --> Selesai
    B16 --> Selesai
    B17 --> Selesai
    B12 --> Selesai`,

  // ==========================================================================
  // SEQUENCE (6)
  // ==========================================================================
  'seq-login': `sequenceDiagram
    actor U as Pengguna
    participant FE as Frontend (Ionic Vue + Pinia)
    participant API as Backend (Express)
    participant DB as SQLite (Prisma)
    participant WS as Socket.IO
    U->>FE: Input username & password
    FE->>API: POST /api/auth/login
    API->>DB: findUnique user (+ role, operator)
    DB-->>API: data user
    API->>API: bcrypt.compare + jwt.sign
    API-->>FE: token + user (role, permissions)
    FE->>FE: Simpan di Pinia + localStorage
    FE->>WS: connect handshake auth token
    WS->>WS: verifikasi JWT, join room user & role
    WS-->>FE: connected -> fetch inbox notifikasi
    FE->>FE: router redirect landingFor(role)
    FE-->>U: Tampilkan halaman sesuai peran`,

  'seq-voo-approval': `sequenceDiagram
    actor OP as Operator
    participant FE as Frontend
    participant API as Backend API
    participant SVC as VooService
    participant NS as NotificationService
    participant DB as Database
    participant BC as BlockchainService
    actor FM as Foreman
    actor SM as Section Manager
    OP->>FE: Isi form VoO (judul, deskripsi, tipe, foto)
    FE->>API: POST /api/voo
    API->>SVC: create(data)
    SVC->>DB: create VooSubmission (status pending)
    SVC->>NS: notifyRole Foreman
    NS->>DB: insert Notification + emit ke room
    SVC-->>API: pengajuan
    API->>BC: storeHash VooSubmission
    BC->>DB: insert BlockchainHash SHA-256
    API-->>FE: sukses
    FE-->>OP: Tampilkan konfirmasi
    FM->>FE: Buka /voo/approve
    FM->>API: POST /api/voo/:id/approve-foreman
    API->>SVC: approveForeman(id, action)
    SVC->>DB: status approved_foreman + Approval
    SVC->>NS: notif Operator + notifyRole Section Manager
    SVC-->>API: updated
    API->>BC: storeHash
    API-->>FM: konfirmasi
    SM->>FE: Buka /voo/final
    SM->>API: POST /api/voo/:id/approve-manager (poin)
    API->>SVC: approveManager(id, action, poin)
    SVC->>DB: status approved_final + points + Approval
    SVC->>DB: Operator.totalMerit +1, performanceScore += poin x 0.5
    SVC->>NS: notif Operator (disetujui + poin)
    SVC-->>API: updated
    API->>BC: storeHash
    API-->>SM: konfirmasi
    NS-->>OP: notification:new (realtime)`,

  'seq-misconduct': `sequenceDiagram
    actor FM as Foreman
    participant FE as Frontend
    participant API as Backend API
    participant SVC as MisconductService
    participant DB as Database (Prisma)
    participant ESC as Escalation Engine
    participant NS as NotificationService
    participant BC as BlockchainService
    actor OP as Operator
    FM->>FE: Pilih operator + jenis pelanggaran dari katalog
    FE->>API: POST /api/records/misconduct
    API->>SVC: createMisconduct(input)
    SVC->>DB: BEGIN transaksi
    SVC->>DB: cek ViolationType & Operator
    SVC->>DB: create Misconduct + snapshot points
    SVC->>DB: recompute accumulatedPoints, totalMisconduct, performanceScore
    SVC->>DB: COMMIT
    SVC->>NS: notif Operator + notifyRole Section Manager
    SVC->>ESC: requiredStep(points) vs currentLevel
    ESC-->>SVC: perlu eskalasi?
    alt requiredStep > currentLevel
        SVC->>NS: notifyRole Foreman + Section Manager (langkah jatuh tempo)
    end
    SVC-->>API: record
    API->>BC: storeHash Misconduct
    BC->>DB: insert BlockchainHash
    API-->>FE: konfirmasi
    NS-->>OP: notification:new (realtime)`,

  'seq-realtime-notification': `sequenceDiagram
    participant SVC as Service (VoO / Misconduct)
    participant NS as NotificationService
    participant DB as Database
    participant IO as Socket.IO Server
    participant ST as Frontend socket store
    participant UI as Bell / Halaman
    SVC->>NS: notifyUser / notifyRole(input)
    NS->>DB: create Notification (per user)
    NS->>IO: emit notification:new ke room user
    SVC->>IO: emitToRooms(rooms, voo:changed / record:changed)
    IO-->>ST: notification:new
    ST->>UI: notifications.receive -> badge unread bertambah
    IO-->>ST: voo:changed / record:changed
    ST->>UI: useRealtime handler (throttle 400 ms)
    UI->>SVC: refetch data halaman`,

  'seq-qr-scan': `sequenceDiagram
    actor OP as Operator
    participant FE as Frontend
    participant API as Backend API
    participant DB as Database
    OP->>FE: Buka halaman Scan QR
    FE->>FE: Aktifkan kamera perangkat
    OP->>FE: Pindai QR code area
    FE->>FE: Decode data QR (JSON)
    FE->>API: POST /api/operators/scan-qr
    alt QR area (locationCode)
        API->>DB: cari QrLocation by code
        DB-->>API: data lokasi
        API->>DB: create QrScanLog + timestamp
        API-->>FE: lokasi + waktu pindai
        FE-->>OP: Konfirmasi area + waktu
    else QR operator (employeeId)
        API->>DB: cari Operator by employeeId
        DB-->>API: profil operator
        API-->>FE: info operator
        FE-->>OP: Tampilkan profil operator
    end`,

  'seq-dashboard': `sequenceDiagram
    actor SM as Section Manager
    participant FE as Frontend
    participant API as Backend API
    participant DB as Database
    SM->>FE: Buka Dashboard
    FE->>API: GET /api/dashboard/kpi
    API->>API: checkRole Section Manager
    API->>DB: count operator, VoO by status
    API->>DB: count misconduct, counseling, kartu kuning, SP
    API->>DB: tren bulanan + operator teratas by skor
    DB-->>API: data agregat
    API-->>FE: data KPI
    FE-->>SM: Render grafik, tabel, metrik
    SM->>FE: Klik Ekspor Excel
    FE->>API: GET /api/dashboard/export/excel
    API->>DB: query data kinerja
    API->>API: generate file Excel
    API-->>FE: stream file
    FE-->>SM: Unduh Excel
    SM->>FE: Klik Ekspor PDF
    FE->>API: GET /api/dashboard/export/pdf
    API-->>FE: stream file PDF
    FE-->>SM: Unduh PDF`,

  'seq-blockchain': `sequenceDiagram
    participant API as Controller (VoO / Misconduct)
    participant BC as BlockchainService
    participant ETH as Ethereum Ganache (opsional)
    participant DB as Database
    API->>BC: storeHash(entityType, entityId, data, userId)
    BC->>BC: hashData -> SHA-256 dari payload JSON
    alt Ganache tersedia (contract + wallet)
        BC->>ETH: contract.storeHash(hash)
        ETH-->>BC: txHash + blockNumber
    else Mode hash-only
        BC->>BC: txHash = null, blockNumber = null
    end
    BC->>DB: create BlockchainHash (data hash, txHash, blockNumber)
    DB-->>BC: tersimpan
    BC-->>API: hash, txHash, blockNumber, record`,

  // ==========================================================================
  // CLASS (2)
  // ==========================================================================
  'class-domain': `classDiagram
    direction LR
    class Role {
      +int id
      +string name
      +string permissions
    }
    class User {
      +int id
      +string username
      +string email
      +string password
      +string fullName
      +string nik
      +bool isActive
      +int roleId
    }
    class Operator {
      +int id
      +int userId
      +string employeeId
      +string section
      +string group
      +string position
      +string qrCode
      +float performanceScore
      +int totalMerit
      +int totalMisconduct
      +int accumulatedPoints
    }
    class VooSubmission {
      +int id
      +string title
      +string type
      +string sumberVoo
      +string kategori4m
      +string status
      +int points
    }
    class ViolationType {
      +int id
      +string name
      +string category
      +string severity
      +int points
      +bool isActive
    }
    class Misconduct {
      +int id
      +string type
      +string severity
      +int points
      +bool isActive
    }
    class Counseling {
      +int id
      +string category
      +string topic
      +datetime acknowledgedAt
    }
    class KartuKuning {
      +int id
      +string reason
      +int accumulatedPointsAtIssuance
      +bool isManualOverride
    }
    class SuratPeringatan {
      +int id
      +int level
      +string reason
      +bool isManualOverride
    }
    class EscalationConfig {
      +int counseling
      +int kartuKuning
      +int sp1
      +int sp2
      +int sp3
    }
    class Approval {
      +int id
      +string entityType
      +string action
    }
    class EventLog {
      +int id
      +string action
      +string module
    }
    class BlockchainHash {
      +int id
      +string entityType
      +string txHash
      +string data
    }
    class Notification {
      +int id
      +string category
      +string title
      +bool isRead
    }
    class QrLocation {
      +int id
      +string code
      +string area
    }
    class QrScanLog {
      +int id
      +datetime scannedAt
    }
    Role "1" --> "many" User : has
    User "1" --> "0..1" Operator
    Operator "1" --> "many" VooSubmission
    Operator "1" --> "many" Misconduct
    Operator "1" --> "many" Counseling
    Operator "1" --> "many" KartuKuning
    Operator "1" --> "many" SuratPeringatan
    ViolationType "1" --> "many" Misconduct
    Misconduct "1" --> "0..1" Counseling
    Misconduct "many" --> "many" KartuKuning : kontribusi
    Misconduct "many" --> "many" SuratPeringatan : kontribusi
    VooSubmission "1" --> "many" Approval
    VooSubmission "1" --> "many" BlockchainHash
    Misconduct "1" --> "many" BlockchainHash
    User "1" --> "many" Notification
    User "1" --> "many" EventLog
    QrLocation "1" --> "many" QrScanLog
    User "1" --> "many" QrScanLog`,

  'class-backend': `classDiagram
    direction LR
    class AuthController
    class VooController
    class MisconductController
    class OperatorController
    class NotificationController

    class AuthService {
      +login(username, password)
      +getUserById(id)
      +updateProfile(userId, data)
    }
    class VooService {
      +create(data)
      +approveForeman(id, userId, action)
      +approveManager(id, userId, action, points)
      +getAll(filters)
    }
    class MisconductService {
      +createMisconduct(input)
      +createCounseling(data)
      +acknowledgeCounseling(id, byId)
      +createKartuKuning(data)
      +createSuratPeringatan(data)
    }
    class OperatorService {
      +getAll(filters)
      +getById(id)
      +scanQR(qrData, userId)
      +getRanking(section)
    }
    class NotificationService {
      +notifyUser(userId, input)
      +notifyRole(role, input)
      +list(userId)
      +markRead(userId, id)
    }
    class BlockchainService {
      +hashData(type, id, data)
      +storeHash(type, id, data, userId)
      +verifyHash(hashId)
    }
    class EscalationConfigService {
      +getActiveThresholds()
      +setThresholds(raw, userId)
    }
    class EscalationEngine {
      <<pure functions>>
      +requiredStep(points, thresholds)
      +shouldNotify(points, thresholds, level)
      +validateThresholds(raw)
    }
    class PrismaClient
    class SocketIO {
      +to(room)
      +emit(event, payload)
    }

    AuthController --> AuthService
    VooController --> VooService
    VooController --> BlockchainService
    MisconductController --> MisconductService
    MisconductController --> BlockchainService
    OperatorController --> OperatorService
    NotificationController --> NotificationService
    VooService --> NotificationService
    MisconductService --> NotificationService
    MisconductService --> EscalationConfigService
    MisconductService --> EscalationEngine
    NotificationService --> SocketIO
    AuthService --> PrismaClient
    VooService --> PrismaClient
    MisconductService --> PrismaClient
    OperatorService --> PrismaClient
    NotificationService --> PrismaClient
    BlockchainService --> PrismaClient`,

  // ==========================================================================
  // ARSITEKTUR (bonus, 3)
  // ==========================================================================
  'arch-overview': `graph TB
    subgraph Klien["Lapisan Klien"]
        Browser[Peramban / PWA Mobile]
    end
    subgraph Frontend["Frontend - Ionic Vue 3"]
        Pages[Halaman per Peran]
        Components[Komponen & PageShell]
        Store[Pinia Store: auth, socket, notifications]
        APIClient[Klien API - Axios]
        SocketClient[Klien Socket.IO + useRealtime]
    end
    subgraph Backend["Backend - Express + TypeScript"]
        Router[Route API per modul]
        MW[Middleware: authMiddleware + checkRole]
        Controllers[Controllers]
        Services[Services + Escalation Engine]
        SocketServer[Socket.IO Server - room user & role]
    end
    subgraph Data["Lapisan Data"]
        Prisma[Prisma ORM]
        SQLite[(SQLite dev / PostgreSQL prod)]
        Blockchain[Ethereum Ganache - opsional]
    end
    Browser --> Frontend
    Frontend -->|HTTP REST + JWT| Backend
    Frontend -->|WebSocket + JWT| Backend
    Services --> Prisma
    Prisma --> SQLite
    Services --> Blockchain`,

  'arch-data-flow': `graph LR
    A[Aksi Pengguna] --> B[Komponen Ionic Vue]
    B --> C[Panggilan API Axios + Bearer JWT]
    C --> D[Route Express]
    D --> E[authMiddleware + checkRole]
    E --> F[Controller]
    F --> G[Service - logika bisnis]
    G --> H[Query Prisma]
    H --> I[(Database)]
    F --> J[BlockchainService]
    J --> K[Hash SHA-256 + Ganache opsional]
    G --> L[NotificationService]
    L --> M[Tabel Notification]
    L --> N[Socket.IO emit ke room]
    N --> O[Klien terhubung - refetch / badge]`,

  'arch-performance-score': `graph TD
    A[Operator.performanceScore] --> B{Peristiwa}
    B -->|VoO approved_final| C[totalMerit +1]
    C --> D[performanceScore += poin x 0.5]
    B -->|Misconduct dicatat| E[snapshot poin dari ViolationType]
    E --> F[accumulatedPoints = jumlah poin misconduct aktif]
    F --> G["performanceScore = max(0, skor - poin)"]
    G --> H[totalMisconduct = count misconduct]
    D --> I[Simpan Operator]
    H --> I
    I --> J[Ranking = urut performanceScore desc]
    F --> K{accumulatedPoints capai ambang?}
    K -->|Ya| L[Escalation engine tandai langkah disiplin]`
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
  const failures = [];

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
      failures.push(name);
      failed++;
    }
  }

  console.log(`\nDone: ${success} succeeded, ${failed} failed`);
  if (failures.length) console.log(`Failed: ${failures.join(', ')}`);
  console.log(`Output: ${outputDir}`);
}

generateAll();
