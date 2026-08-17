# 4.2 Hasil Pengujian Sistem

## Identitas Pengujian

| Atribut | Keterangan |
|---|---|
| Nama aplikasi | Sistem Penilaian Kinerja VoO / Ide Kaizen dan Disiplin Terintegrasi |
| Metode | Black-box testing berbasis input, keluaran, status HTTP, perubahan status, dan respons antarmuka |
| Tanggal penyusunan | 2 Agustus 2026 |
| Lingkungan acuan | Frontend Ionic Vue 3, Backend Express + TypeScript, Prisma + SQLite, Socket.IO |
| Peran yang dianalisis | Operator, Foreman, Section Manager, Staff Produksi, Super Admin |
| Bukti otomatis tersedia | Pengujian ulang `npm test`: 19 test files dan 45 tests lulus |
| Bukti runtime API | Smoke test HTTP terhadap server aktif di `localhost:3001` |
| Bukti build | Frontend berhasil; backend gagal dengan 52 error TypeScript pada 6 file/modul |
| Bukti visual tersedia | Antrean persetujuan Foreman dan persetujuan final Section Manager dari gambar yang diberikan |

### Arti Status

- **Lulus**: tersedia bukti keluaran visual atau hasil otomatis tersimpan yang sesuai harapan.
- **Lulus bersyarat**: perilaku utama sesuai, tetapi jaminannya terbatas pada permukaan API/aplikasi.
- **Perlu uji runtime**: skenario dan keluaran sudah terdefinisi, tetapi belum ada bukti eksekusi end-to-end pada lingkungan aktif.
- **Temuan**: ditemukan ketidaksesuaian atau risiko yang perlu ditindaklanjuti.

### Catatan Validitas

Dokumen ini tidak menganggap pembacaan kode sebagai bukti eksekusi. Pada 2 Agustus 2026 dilakukan pengujian ulang berupa `npm test`, build backend/frontend, serta smoke test HTTP nonmutasi terhadap server aktif. Lima akun peran berhasil login; health check, akses tanpa token, RBAC, QR invalid, blockchain, dan audit diuji langsung. Area QR valid end-to-end, transaksi VoO penuh, kontrak Ethereum/Ganache, popup browser terbaru, dan multi-client Socket.IO tetap ditandai **Perlu uji runtime** karena belum direkam lengkap. Gambar approval membuktikan antrean dan kontrol persetujuan versi saat gambar diambil.

---

## 4.2.1 Pengujian Black Box

Pengujian umum memastikan aplikasi memberikan keluaran yang benar terhadap input valid, input tidak valid, sesi pengguna, dan navigasi utama tanpa menilai struktur internal program.
### Tabel 4.1 Pengujian Fungsi Umum

| ID | Skenario | Data/Uji | Hasil yang Diharapkan | Hasil Aktual/Bukti | Status |
|---|---|---|---|---|---|
| BB-01 | Health check API | `GET /api/health` | HTTP 200, `success: true`, versi API ditampilkan | Runtime: HTTP 200 pada `localhost:3001` | **Lulus** |
| BB-02 | Login dengan akun valid | Akun 5 peran | Token dan role dikembalikan | Operator, Foreman, Section Manager, Staff Produksi, dan Super Admin masing-masing HTTP 200 dengan role benar | **Lulus** |
| BB-03 | Login dengan kredensial salah | Username tidak ada/password salah | Login ditolak | Runtime: HTTP 401 | **Lulus** |
| BB-04 | Login tanpa mengisi field wajib | Username/password kosong | Browser menahan submit karena kedua field `required` | Belum diuji melalui browser aktif | Perlu uji runtime |
| BB-05 | Mengakses API privat tanpa sesi | `GET /api/records/violation-types` tanpa token | Request ditolak | Runtime: HTTP 401 | **Lulus** |
| BB-06 | Logout | Klik logout dari sesi aktif | Token/data user dihapus dan socket terputus | Belum ada bukti visual browser | Perlu uji runtime |
| BB-07 | Antrean persetujuan Foreman | Login Foreman, buka `/voo/approve` | Daftar VoO `pending` dan aksi approval tampil | Gambar memperlihatkan 3 pengajuan dan tombol Setujui/Tolak | **Lulus** |
| BB-08 | Antrean persetujuan final | Login Section Manager, buka `/voo/final` | Daftar VoO tahap final dan pilihan poin tampil | Gambar memperlihatkan 4 pengajuan dan preset 5/10/20 poin | **Lulus** |
| BB-09 | Popup detail persetujuan terbaru | Klik Detail/Setujui | Popup menampilkan data lengkap dan konfirmasi | Komponen lolos build frontend; belum ada bukti interaksi browser | Lulus bersyarat |
| BB-10 | Responsif popup approval | Lebar layar ≤480 px | Grid satu kolom dan tombol full-width | CSS lolos build; belum diuji pada perangkat nyata | Lulus bersyarat |

### Tabel 4.1A Validasi Build dan Regression Test

| Pemeriksaan | Perintah | Hasil Aktual | Status |
|---|---|---|---|
| Regression test backend | `npm test` | 19/19 test files dan 45/45 tests lulus; durasi 323,88 detik | **Lulus** |
| Build frontend | `npm run build` | Type-check dan Vite build berhasil; 410 modul ditransformasi; 20,04 detik | **Lulus** |
| Build backend | `npm run build` | Gagal: 52 error TypeScript pada 6 file/modul | **Temuan** |

Error build backend terutama berasal dari modul legacy `merit`, `permissions`, `reports`, `roles`, dan `users` yang masih mengacu pada model/relasi Prisma lama (`meritEvent`, `permission`, `userRoles`, `department`, dan lain-lain), ditambah type error pada satu file test route.

**Kesimpulan 4.2.1:** API aktif dan autentikasi lima peran lulus smoke test. Regression test dan frontend build lulus. Sistem belum siap dinyatakan lolos build produksi penuh karena backend gagal dikompilasi, walaupun proses runtime melalui `tsx` tetap aktif.

---

## 4.2.2 Pengujian Hak Akses Pengguna

Pengujian hak akses memeriksa bahwa setiap peran hanya dapat menggunakan fungsi yang diizinkan. Respons yang diharapkan untuk akses tanpa token adalah **401**, sedangkan token valid dengan peran yang tidak sesuai adalah **403**.

### Tabel 4.2 Matriks Hak Akses

| Fungsi | Operator | Foreman | Section Manager | Staff Produksi | Super Admin |
|---|:---:|:---:|:---:|:---:|:---:|
| Ajukan VoO | ✓ | ✓ (API) | – | – | ✓ (bypass) |
| Lihat pengajuan sendiri | ✓ | – | – | – | ✓ (bypass) |
| Persetujuan VoO tahap Foreman | – | ✓ | – | – | ✓ (bypass) |
| Persetujuan final & poin | – | – | ✓ | – | ✓ (bypass) |
| Catat misconduct | – | ✓ | ✓ | – | ✓ (bypass) |
| Buat counseling/Kartu Kuning/SP | – | ✓ | ✓ | – | ✓ (bypass) |
| Acknowledge counseling | – | – | ✓ | – | ✓ (bypass) |
| Monitor records | Data sendiri | ✓ | ✓ | Read-only | ✓ (bypass) |
| Kelola katalog/ambang eskalasi | – | Baca | ✓ | – | ✓ (bypass) |
| Kelola user/role/lokasi QR | – | – | – | – | ✓ |

### Tabel 4.3 Hasil Uji Otorisasi

| ID | Skenario | Hasil yang Diharapkan | Bukti/Hasil Aktual | Status |
|---|---|---|---|---|
| HA-01 | Request katalog tanpa token | HTTP 401 | Runtime: HTTP 401 | **Lulus** |
| HA-02 | Foreman mencoba menulis katalog | HTTP 403 | Runtime: HTTP 403 | **Lulus** |
| HA-03 | Operator mencoba membuat misconduct | HTTP 403 | Runtime: HTTP 403 | **Lulus** |
| HA-04 | Operator melihat riwayat operator lain | Akses ditolak | Regression test route/service lulus | **Lulus** |
| HA-05 | Foreman membaca katalog | HTTP 200 | Runtime: HTTP 200 | **Lulus** |
| HA-06 | Section Manager membaca katalog | HTTP 200 | Runtime: HTTP 200 | **Lulus** |
| HA-07 | Staff Produksi membaca daftar misconduct | HTTP 200 | Runtime: HTTP 200 | **Lulus** |
| HA-08 | Staff Produksi membuat misconduct | HTTP 403 | Runtime: HTTP 403 | **Lulus** |
| HA-09 | Super Admin membuka dashboard Manager | HTTP 200 melalui bypass | Runtime: HTTP 200 | **Lulus** |
| HA-10 | Operator melihat daftar hash | HTTP 403 | Runtime: HTTP 403 | **Lulus** |
| HA-11 | Manager melihat daftar hash | HTTP 200 | Runtime: HTTP 200 | **Lulus** |
| HA-12 | Operator melihat audit log | HTTP 403 | Runtime: HTTP 403 | **Lulus** |
| HA-13 | Manager melihat audit log | HTTP 200 | Runtime: HTTP 200 | **Lulus** |
| HA-14 | Super Admin membuka daftar pengguna | HTTP 200 dan daftar user | Runtime: HTTP 500, `Unknown field userRoles` | **Temuan** |
| HA-15 | Super Admin membuka report legacy | Endpoint laporan tersedia | Runtime: HTTP 404 karena router report tidak di-mount | **Temuan** |
| HA-16 | Token invalid/kedaluwarsa | HTTP 401 | Belum diuji dengan JWT rusak/kedaluwarsa | Perlu uji runtime |

**Kesimpulan 4.2.2:** 12 skenario autentikasi/otorisasi utama memberikan status 200/401/403 sesuai peran. Dua fungsi Super Admin bermasalah: daftar user menghasilkan 500 akibat query Prisma lama, dan report legacy menghasilkan 404 karena route belum didaftarkan pada server.

---

## 4.2.3 Pengujian Pencatatan Merit melalui QR Code

Pada implementasi saat ini, QR Code mencatat lokasi pemindaian dan dapat membawa informasi lokasi ke form VoO. Merit tidak langsung diberikan saat QR dipindai; merit baru diberikan setelah VoO disetujui final oleh Section Manager.
### Tabel 4.4 Hasil Uji QR dan Merit VoO

| ID | Skenario | Data/Uji | Hasil yang Diharapkan | Hasil Aktual/Bukti | Status |
|---|---|---|---|---|---|
| QR-01 | Scan QR lokasi valid | QR berisi `locationCode` terdaftar | Lokasi ditemukan, `QrScanLog` tersimpan, nama area dan waktu tampil | Belum ada bukti scan runtime | Perlu uji runtime |
| QR-02 | Scan QR lokasi tidak dikenal | `locationCode` tidak terdaftar | HTTP 400 dan pesan QR area tidak valid | Belum ada bukti runtime | Perlu uji runtime |
| QR-03 | Scan QR operator valid | QR berisi `employeeId` valid | Profil operator ditampilkan | Belum ada bukti runtime | Perlu uji runtime |
| QR-04 | Scan QR dengan format tidak valid | `qrData: "tidak-valid"` | HTTP 400 dan scan ditolak | Runtime: HTTP 400, `Invalid QR code` | **Lulus** |
| QR-05 | Lokasi scan dibawa ke form VoO | Selesai scan lalu lanjut pengajuan | Banner lokasi muncul dan deskripsi diprefill | Belum ada bukti visual | Perlu uji runtime |
| QR-06 | Form VoO tanpa judul/deskripsi | Field wajib kosong | Submit ditahan dan pesan validasi tampil | Mekanisme tersedia; belum direkam | Perlu uji runtime |
| QR-07 | Pilih klasifikasi | Pilih Safety lalu mencoba memilih Quality | Hanya satu checkbox aktif; pilihan lain nonaktif | Implementasi mendukung mutual-exclusive; belum direkam | Perlu uji runtime |
| QR-08 | Upload foto melebihi batas | Pilih >5 foto | Hanya maksimal 5 foto diterima | UI dan upload membatasi 5; belum diuji file nyata | Perlu uji runtime |
| QR-09 | Konfirmasi pengajuan VoO | Isi form valid, klik Kirim | Popup ringkasan tampil sebelum API dipanggil | Popup tersedia; belum ada screenshot runtime | Perlu uji runtime |
| QR-10 | Foreman menyetujui VoO | Klik Setujui pada antrean pending | Status berubah menjadi `approved_foreman` dan masuk antrean Manager | Antrean Foreman dan Manager terlihat pada gambar | **Lulus** |
| QR-11 | Manager menetapkan poin | Pilih 5/10/20 atau input poin, lalu setujui | Status `approved_final`; `totalMerit +1`; skor bertambah `poin × 0,5` | Kontrol poin tampak pada gambar; perubahan database belum direkam | Lulus bersyarat |
| QR-12 | Pengajuan ditolak | Foreman/Manager isi alasan lalu konfirmasi | Status `rejected`, alasan tersimpan, Operator menerima notifikasi | Belum ada bukti runtime | Perlu uji runtime |

**Temuan:** klasifikasi ditampilkan sebagai “pilih salah satu”, tetapi saat ini tidak wajib. Form tetap dapat dikirim dengan `classification = []`. Jika klasifikasi diwajibkan oleh kebutuhan bisnis, validasi wajib harus ditambahkan di frontend dan backend.

---

## 4.2.4 Pengujian Pencatatan Misconduct

Bagian ini diuji ulang langsung pada 2 Agustus 2026 menggunakan `npm test`. Hasil terbaru: **19/19 file pengujian dan 45/45 test lulus** dengan durasi **323,88 detik**. Hasil ini menggantikan durasi artefak historis 363,41 detik.

### Tabel 4.5 Hasil Uji Misconduct dan Eskalasi

| ID | Skenario | Hasil yang Diharapkan | Hasil Aktual/Bukti | Status |
|---|---|---|---|---|
| MC-01 | Membuat jenis pelanggaran valid | Nama, kategori, severity, dan poin tersimpan sesuai input | Property 1 lulus | **Lulus** |
| MC-02 | Nama katalog duplikat beda kapital/spasi | Ditolak tanpa membuat data baru | Property 2 lulus | **Lulus** |
| MC-03 | Nama atau poin katalog tidak valid | Create/update ditolak dan data lama tidak berubah | Property 3 lulus | **Lulus** |
| MC-04 | Mengubah poin katalog setelah misconduct tercatat | Poin misconduct lama tetap memakai snapshot awal | Property 4 lulus | **Lulus** |
| MC-05 | Menonaktifkan jenis pelanggaran | Hilang dari daftar default tetapi referensi historis tetap ada | Property 5 lulus | **Lulus** |
| MC-06 | Operator atau jenis pelanggaran tidak ditemukan | Operasi ditolak dan tidak ada misconduct tercipta | Property 6 lulus | **Lulus** |
| MC-07 | Poin pelanggaran melebihi skor operator | Skor akhir tidak negatif: `max(0, skor-poin)` | Property 7 lulus | **Lulus** |
| MC-08 | Menambah beberapa misconduct aktif | `accumulatedPoints` sama dengan total poin aktif | Property 8 lulus | **Lulus** |
| MC-09 | Menambah misconduct | `totalMisconduct` sama dengan jumlah record | Property 9 lulus | **Lulus** |
| MC-10 | Transaksi pembuatan gagal | Tidak ada record parsial; skor/poin/counter tidak berubah | Property 10 lulus | **Lulus** |
| MC-11 | Counseling tanpa misconduct valid/duplikat | Hanya diterima jika misconduct ada dan belum punya counseling | Property 11 lulus | **Lulus** |
| MC-12 | Acknowledge counseling dua kali | Pertama tersimpan, kedua ditolak tanpa mengubah data pertama | Property 12 lulus | **Lulus** |
| MC-13 | Konfigurasi ambang tidak valid | Nilai noninteger, <1, atau tidak meningkat ditolak | Property 13 dan R4.7 lulus | **Lulus** |
| MC-14 | Evaluasi langkah disiplin | Sistem memilih level tertinggi yang ambangnya telah tercapai | Property 14 lulus | **Lulus** |
| MC-15 | Notifikasi ambang terulang | Notifikasi hanya ketika level yang dibutuhkan lebih tinggi | Property 15 dan suppression test lulus | **Lulus** |
| MC-16 | Terbitkan Kartu Kuning | Snapshot poin dan semua misconduct aktif tertaut | Property 16/17 lulus | **Lulus** |
| MC-17 | Kartu Kuning duplikat tanpa override | Operasi ditolak tanpa record baru | Property 18 lulus | **Lulus** |
| MC-18 | Terbitkan SP level ilegal/tidak berurutan/duplikat | Operasi ditolak tanpa mutasi | Property 19 lulus | **Lulus** |
| MC-19 | Daftar SP operator | Record diurutkan berdasarkan level menaik | Property 20 lulus | **Lulus** |
| MC-20 | Riwayat disiplin | Urutan kronologis, linkage, dan status eskalasi benar | Property 22/23 lulus | **Lulus** |
| MC-21 | Operator tidak ditemukan pada riwayat | Error not-found dan tidak mengembalikan record | Property 24 lulus | **Lulus** |
| MC-22 | Notifikasi saat misconduct tercipta | Operator dan Section Manager menerima dispatch notifikasi | Uji dispatch lulus; push browser belum diuji | Lulus bersyarat |

**Kesimpulan 4.2.4:** fungsi inti misconduct, konseling, Kartu Kuning, Surat Peringatan, histori, perhitungan skor, rollback, dan mesin eskalasi memiliki bukti otomatis yang seluruhnya lulus. Push notifikasi hingga tampil pada browser masih memerlukan uji multi-client.

---

## 4.2.5 Pengujian Append-only

Append-only berarti kejadian historis tidak diedit atau dihapus melalui API setelah tercatat; perubahan dilakukan dengan menambah record baru atau menonaktifkan master data tanpa memutus referensi lama.
### Tabel 4.6 Hasil Uji Append-only

| ID | Skenario | Hasil yang Diharapkan | Hasil Aktual/Bukti | Status |
|---|---|---|---|---|
| AO-01 | Mencari endpoint update/delete misconduct | Tidak tersedia endpoint perubahan/penghapusan record kejadian | Surface API hanya menyediakan create dan read | Lulus bersyarat |
| AO-02 | Mencari endpoint update/delete counseling | Tidak tersedia; hanya acknowledge satu kali | Acknowledge pertama tersimpan dan kedua ditolak | **Lulus** |
| AO-03 | Menonaktifkan katalog yang sudah direferensikan | Katalog nonaktif, referensi misconduct lama tetap utuh | Property 5 lulus | **Lulus** |
| AO-04 | Kegagalan transaksi misconduct | Tidak meninggalkan record parsial | Property 10 lulus | **Lulus** |
| AO-05 | Poin katalog berubah | Snapshot poin pada kejadian lama tidak berubah | Property 4 lulus | **Lulus** |
| AO-06 | Update/delete langsung melalui database | Harus ditolak bila immutable secara fisik | Tidak ada trigger/constraint database yang melarang akses langsung | **Temuan** |

**Kesimpulan 4.2.5:** sistem memenuhi append-only pada **permukaan API aplikasi** dan menjaga snapshot serta referensi historis. Namun database belum immutable secara fisik; pengguna dengan akses database langsung masih dapat melakukan `UPDATE`/`DELETE`. Jika kebutuhan mensyaratkan immutability kuat, diperlukan trigger database, role database read/write terbatas, atau audit append-only eksternal.

---

## 4.2.6 Pengujian Hash Anchoring dan Verifikasi Integritas Data

Sistem menghitung SHA-256 untuk transaksi penting. Hash selalu disimpan di tabel `BlockchainHash`; jika Ganache, wallet, dan contract tersedia, hash juga dikirim ke smart contract dan menghasilkan `txHash` serta `blockNumber`.

### Tabel 4.7 Hasil Uji Hash dan Blockchain

| ID | Skenario | Hasil yang Diharapkan | Hasil Aktual/Bukti | Status |
|---|---|---|---|---|
| BC-00 | Operator membuka status blockchain | HTTP 200 dan status tersedia | Runtime: HTTP 200, `success: true` | **Lulus** |
| BC-00A | Operator membuka daftar hash | Akses ditolak | Runtime: HTTP 403 | **Lulus** |
| BC-00B | Section Manager membuka daftar hash | HTTP 200 dan daftar hash | Runtime: HTTP 200 | **Lulus** |
| BC-01 | Membuat VoO | Record hash lokal tercipta setelah VoO tersimpan | Pesan UI dirancang menyatakan tercatat; belum dicek ke tabel/hash endpoint | Perlu uji runtime |
| BC-02 | Approval Foreman | Hash baru tersimpan untuk status approval | Belum ada pembandingan jumlah hash sebelum/sesudah | Perlu uji runtime |
| BC-03 | Approval final Manager | Hash baru tersimpan dan, bila Ganache aktif, ada transaksi on-chain | Belum ada bukti `txHash`/`blockNumber` | Perlu uji runtime |
| BC-04 | Ganache tidak tersedia | Operasi bisnis tetap berhasil dan hash lokal tersimpan | Fallback dirancang berjalan; belum diuji dengan mematikan Ganache | Perlu uji runtime |
| BC-05 | Verifikasi hash yang ada di chain | `localHash === onChainHash`, `matches: true` | Belum ada bukti integrasi contract | Perlu uji runtime |
| BC-06 | Verifikasi ID hash tidak ada | Respons error `Hash record not found` | Belum diuji melalui API | Perlu uji runtime |
| BC-07 | Data entity diubah setelah hashing | Verifikasi seharusnya mendeteksi perubahan data | Implementasi verifikasi hanya membandingkan hash lokal dengan hash chain dan tidak menghitung ulang entity | **Temuan** |

**Temuan penting:**
1. Pesan “tercatat di blockchain” dapat muncul walau Ganache gagal, karena hash lokal tetap tersimpan. Istilah yang lebih tepat untuk mode tersebut adalah **“hash tercatat secara lokal”**.
2. Fungsi verifikasi saat ini tidak menghitung ulang hash dari data VoO/Misconduct terbaru. Karena itu, ia membuktikan kesamaan record hash lokal dan on-chain, tetapi belum membuktikan bahwa data entity di database tidak pernah berubah.
3. Pengambilan hash on-chain memakai `blockNumber` sebagai parameter `getHash`; kesesuaian parameter itu dengan indeks contract harus diuji menggunakan contract aktual.

---

## 4.2.7 Pengujian Real-Time Event

Pengujian real-time harus dilakukan sedikitnya dengan dua browser/sesi berbeda agar dapat diamati apakah perubahan dari satu peran langsung diterima oleh peran yang dituju tanpa refresh manual.

### Tabel 4.8 Hasil Uji Real-Time

| ID | Skenario | Hasil yang Diharapkan | Hasil Aktual/Bukti | Status |
|---|---|---|---|---|
| RT-01 | Koneksi Socket.IO dengan token valid | Koneksi berhasil dan user masuk room `user:<id>` serta `role:<role>` | Belum direkam dengan socket client aktif | Perlu uji runtime |
| RT-02 | Koneksi tanpa token | Handshake ditolak dengan `No token provided` | Belum ada rekaman runtime | Perlu uji runtime |
| RT-03 | Koneksi dengan token invalid | Handshake ditolak dengan `Invalid or expired token` | Belum ada rekaman runtime | Perlu uji runtime |
| RT-04 | Operator mengirim VoO saat Foreman membuka antrean | Foreman menerima `voo:changed`; daftar bertambah tanpa refresh manual | Belum diuji dua sesi bersamaan | Perlu uji runtime |
| RT-05 | Foreman menyetujui VoO saat Manager membuka antrean | Manager menerima event dan item masuk antrean final | Gambar memperlihatkan antrean, tetapi tidak membuktikan update realtime | Perlu uji runtime |
| RT-06 | Misconduct dibuat | Operator menerima `notification:new`; Manager menerima notifikasi/event | Dispatch service lulus, tampilan browser belum diuji | Lulus bersyarat |
| RT-07 | Event threshold yang sama terulang | Tidak ada notifikasi eskalasi duplikat | Suppression test lulus | **Lulus** |
| RT-08 | Socket sempat terputus | Notifikasi tetap tersimpan di inbox dan dapat difetch setelah reconnect | Penyimpanan tersedia; belum diuji reconnect | Perlu uji runtime |
| RT-09 | Operator mencoba bergabung ke room Manager | Tidak dapat menentukan room sendiri; room berasal dari JWT | Desain handshake aman; perlu pengujian socket malicious client | Perlu uji runtime |

**Kesimpulan 4.2.7:** dispatch dan penekanan notifikasi duplikat mempunyai bukti otomatis, tetapi karakter real-time pada browser memerlukan pengujian multi-client yang belum terdokumentasi.

---

## Rekapitulasi Hasil

| Area | Ringkasan |
|---|---|
| Fungsi umum/UI | Health check dan login 5 peran lulus runtime; approval terbukti visual; popup terbaru lolos build tetapi belum diuji interaksi browser |
| Hak akses | 12 skenario 200/401/403 sesuai harapan; endpoint user Super Admin gagal 500 |
| QR & Merit | QR invalid ditolak 400; scan valid dan perubahan skor masih perlu bukti runtime |
| Misconduct | Pengujian ulang: 19/19 file dan 45/45 test lulus dalam 323,88 detik |
| Append-only | Lulus pada permukaan API; belum immutable terhadap akses database langsung |
| Hash anchoring | Status/list dan RBAC lulus; integrasi Ganache dan verifikasi entity belum terbukti |
| Real-time | Dispatch service terbukti sebagian; perilaku dua browser belum diuji |
| Build | Frontend lulus; backend gagal dengan 52 error TypeScript |
| Report legacy | Endpoint `/api/reports/*` menghasilkan 404 |

### Hasil Akhir

Pengujian ulang membuktikan bahwa API aktif, lima peran dapat login, kontrol akses utama bekerja, frontend dapat dibangun, dan seluruh 45 regression test misconduct lulus. Namun aplikasi **belum dapat dinyatakan lulus penuh untuk rilis produksi** karena build backend gagal dengan 52 error dan fungsi daftar pengguna Super Admin menghasilkan HTTP 500. Route report legacy juga belum aktif (HTTP 404).

Prioritas perbaikan:
1. Selaraskan `users.service.ts`, `roles.service.ts`, `permissions.service.ts`, `reports.service.ts`, dan `merit.service.ts` dengan `schema.prisma` saat ini.
2. Perbaiki type error pada `route-authorization.test.ts` agar `tsc` dapat lulus.
3. Daftarkan route report yang masih digunakan atau hapus modul legacy beserta navigasinya.
4. Setelah perbaikan, ulangi build backend dan smoke test `/api/users` serta `/api/reports/*`.
5. Lanjutkan pengujian browser untuk popup approval, QR valid, Socket.IO multi-client, dan Ganache.

---

## Prosedur Uji Lanjutan yang Direkomendasikan

1. Jalankan backend dan frontend pada database khusus pengujian, bukan database operasional.
2. Siapkan masing-masing satu akun Operator, Foreman, Section Manager, Staff Produksi, dan Super Admin.
3. Rekam screenshot sebelum aksi, saat popup konfirmasi, dan setelah status berubah.
4. Untuk QR, gunakan satu QR valid, satu QR tidak terdaftar, dan satu payload rusak.
5. Untuk realtime, buka Operator dan Foreman/Manager pada dua browser atau profil browser berbeda; jangan menekan tombol Muat Ulang.
6. Untuk blockchain, catat status Ganache, `txHash`, `blockNumber`, hash lokal, hash on-chain, dan hasil `matches`.
7. Ulangi pengujian dengan Ganache dimatikan untuk membuktikan fallback hash-only.
8. Verifikasi perubahan skor operator sebelum dan sesudah approval final atau misconduct.
9. Simpan hasil baru berupa screenshot, log HTTP, dan file ekspor sebagai lampiran laporan.

## Bukti Acuan

- Pengujian ulang `npm test` — 19/19 file dan 45/45 test lulus, durasi 323,88 detik.
- Build frontend `npm run build` — berhasil, 410 modul, durasi 20,04 detik.
- Build backend `npm run build` — gagal dengan 52 error TypeScript pada 6 file/modul.
- Smoke test HTTP `localhost:3001` — health 200; login lima peran 200; RBAC 200/401/403 sesuai skenario; QR invalid 400; blockchain/audit sesuai role.
- Smoke test Super Admin — `/api/users` 500 dan `/api/reports/operator-performance` 404.
- `backend/final-check.log` — artefak historis 19 file/45 test lulus, durasi 363,41 detik.
- Gambar antrean Foreman (3 pengajuan) dan persetujuan final Manager (4 pengajuan).
- `docs/DOKUMENTASIFULL.md` — dokumentasi diagram dan alur sistem.

> Status pada dokumen telah diperbarui dari hasil eksekusi ulang 2 Agustus 2026. Skenario yang belum memiliki bukti browser/multi-client tetap ditandai secara eksplisit.
