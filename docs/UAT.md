# UAT (*User Acceptance Test*)

*User Acceptance Test* (UAT) adalah uji kelayakan perangkat lunak yang bertujuan untuk memastikan seluruh komponen program aplikasi berjalan dengan lancar dan sesuai dengan kebutuhan pengguna. UAT pada program aplikasi Sistem Penilaian Kinerja VoO / Ide Kaizen dan Disiplin Terintegrasi adalah sebagai berikut.

## Lingkungan dan Bukti Pengujian

| Atribut | Keterangan |
|---|---|
| Tanggal pelaksanaan | 2 Agustus 2026 |
| Backend | Express + TypeScript, Prisma, SQLite, berjalan pada `http://localhost:3001` |
| Frontend | Ionic Vue 3 (build produksi berhasil, 410 modul) |
| Bukti login | Login 5 peran berhasil (HTTP 200) menggunakan akun seed |
| Bukti hak akses | Uji API nonmutasi memverifikasi status 200 untuk akses sah dan 403 untuk akses ditolak |
| Bukti unit/integrasi | `npm test`: 19 file, 45 pengujian lulus |

Keterangan status:
- **Berhasil**: proses berjalan sesuai harapan dan didukung bukti runtime atau hasil pengujian tersimpan.
- **Perlu Perbaikan**: proses tersedia tetapi ditemukan kesalahan pada saat pengujian runtime.
- **Belum Diuji Penuh**: proses tersedia namun belum ada bukti eksekusi end-to-end pada lingkungan aktif.

---

## a. Super Admin

Tabel 4.1 UAT Super Admin

| No. | Proses | Hasil yang diharapkan | Status |
|---|---|---|---|
| 1. | Login | Dapat menampilkan halaman login dan masuk ke dalam aplikasi dengan username dan password yang terdaftar sebagai Super Admin. | Berhasil |
| 2. | Dashboard | Dapat menampilkan halaman utama beserta menu yang tersedia bagi Super Admin. | Berhasil |
| 3. | Kelola Pengguna | Dapat menampilkan, menambah, mengubah, dan menghapus data pengguna. | Perlu Perbaikan |
| 4. | Kelola Peran & Hak Akses | Dapat menampilkan dan mengatur peran serta hak akses pengguna. | Belum Diuji Penuh |
| 5. | Kelola Lokasi QR | Dapat menampilkan dan mengelola daftar lokasi QR area kerja. | Belum Diuji Penuh |
| 6. | Bypass hak akses | Dapat mengakses seluruh modul lintas peran tanpa penolakan. | Berhasil |
| 7. | Kelola Profil | Dapat memperbarui email, NIK, dan kata sandi sendiri. | Belum Diuji Penuh |
| 8. | Logout | Dapat keluar dari sesi dan kembali ke halaman login. | Belum Diuji Penuh |

Catatan: pada pengujian runtime, permintaan daftar pengguna (`GET /api/users`) mengembalikan HTTP 500 sehingga proses Kelola Pengguna berstatus Perlu Perbaikan.

---

## b. Section Manager

Tabel 4.2 UAT Section Manager

| No. | Proses | Hasil yang diharapkan | Status |
|---|---|---|---|
| 1. | Login | Dapat menampilkan halaman login dan masuk ke dashboard dengan akun Section Manager. | Berhasil |
| 2. | Dashboard KPI | Dapat menampilkan ringkasan KPI, jumlah VoO, pelanggaran, dan tren. | Berhasil |
| 3. | Persetujuan Final VoO | Dapat menampilkan daftar VoO yang telah disetujui Foreman dan memberi poin merit. | Berhasil |
| 4. | Peringkat Operator | Dapat menampilkan peringkat operator berdasarkan skor kinerja. | Belum Diuji Penuh |
| 5. | Analisis Tren | Dapat menampilkan grafik tren VoO dan pelanggaran per periode. | Belum Diuji Penuh |
| 6. | Kelola Katalog Pelanggaran | Dapat menampilkan, menambah, mengubah, dan menonaktifkan jenis pelanggaran. | Berhasil |
| 7. | Konfigurasi Ambang Eskalasi | Dapat menampilkan dan menyimpan ambang eskalasi yang valid (menaik). | Berhasil |
| 8. | Acknowledge Konseling | Dapat menandatangani/menyetujui lembar konseling. | Berhasil |
| 9. | Blockchain & Log Audit | Dapat menampilkan daftar hash dan riwayat log audit. | Belum Diuji Penuh |
| 10. | Ekspor Laporan | Dapat mengunduh laporan dalam format PDF/Excel. | Perlu Perbaikan |
| 11. | Logout | Dapat keluar dari sesi dan kembali ke halaman login. | Belum Diuji Penuh |

Catatan: modul laporan (`reports.routes.ts`) belum terpasang di server utama sehingga fitur ekspor/laporan berstatus Perlu Perbaikan hingga rute didaftarkan dan diuji ulang.

---

## c. Foreman

Tabel 4.3 UAT Foreman

| No. | Proses | Hasil yang diharapkan | Status |
|---|---|---|---|
| 1. | Login | Dapat menampilkan halaman login dan masuk ke halaman persetujuan VoO dengan akun Foreman. | Berhasil |
| 2. | Persetujuan VoO (tahap Foreman) | Dapat menampilkan daftar VoO berstatus pending beserta aksi setujui/tolak. | Berhasil |
| 3. | Popup Detail Persetujuan | Dapat menampilkan detail pengajuan (operator, klasifikasi, deskripsi, foto) sebelum konfirmasi. | Belum Diuji Penuh |
| 4. | Catat Pelanggaran | Dapat mencatat pelanggaran operator dari katalog jenis pelanggaran. | Berhasil |
| 5. | Catat Konseling | Dapat membuat lembar konseling atas pelanggaran yang sudah tercatat. | Berhasil |
| 6. | Terbitkan Kartu Kuning | Dapat menerbitkan kartu kuning beserta snapshot poin akumulasi. | Berhasil |
| 7. | Terbitkan Surat Peringatan | Dapat menerbitkan SP1/SP2/SP3 secara berurutan tanpa duplikasi. | Berhasil |
| 8. | Baca Katalog Pelanggaran | Dapat menampilkan daftar jenis pelanggaran. | Berhasil |
| 9. | Tolak Menulis Katalog | Tidak dapat menambah/mengubah katalog (khusus Section Manager). | Berhasil |
| 10. | Pantau Operator | Dapat menampilkan daftar dan detail operator serta riwayat disiplinnya. | Belum Diuji Penuh |
| 11. | Logout | Dapat keluar dari sesi dan kembali ke halaman login. | Belum Diuji Penuh |

Catatan: percobaan menulis katalog oleh Foreman ditolak dengan HTTP 403 sesuai harapan (proses no. 9 Berhasil).

---

## d. Staff Produksi

Tabel 4.4 UAT Staff Produksi

| No. | Proses | Hasil yang diharapkan | Status |
|---|---|---|---|
| 1. | Login | Dapat menampilkan halaman login dan masuk ke halaman monitor dengan akun Staff Produksi. | Berhasil |
| 2. | Monitor VoO / Ide Kaizen | Dapat menampilkan daftar pengajuan VoO secara read-only. | Belum Diuji Penuh |
| 3. | Monitor Pelanggaran | Dapat menampilkan daftar catatan pelanggaran secara read-only. | Berhasil |
| 4. | Tolak Menulis Data | Tidak dapat membuat/mengubah pelanggaran atau catatan disiplin. | Berhasil |
| 5. | Kelola Profil | Dapat memperbarui data profil sendiri. | Belum Diuji Penuh |
| 6. | Logout | Dapat keluar dari sesi dan kembali ke halaman login. | Belum Diuji Penuh |

Catatan: pembacaan records oleh Staff Produksi berhasil (HTTP 200) dan percobaan menulis ditolak (HTTP 403), sesuai peran read-only.

---

## e. Operator

Tabel 4.5 UAT Operator

| No. | Proses | Hasil yang diharapkan | Status |
|---|---|---|---|
| 1. | Login | Dapat menampilkan halaman login dan masuk ke halaman kinerja dengan akun Operator. | Berhasil |
| 2. | Pindai QR Area | Dapat memindai QR area kerja dan menampilkan konfirmasi lokasi. | Belum Diuji Penuh |
| 3. | Ajukan VoO / Ide Kaizen | Dapat mengisi form pengajuan (judul, group/shift, sumber, kategori 4M, klasifikasi, deskripsi, foto). | Belum Diuji Penuh |
| 4. | Klasifikasi Pilih Satu | Dapat memilih hanya satu klasifikasi; pilihan lain menjadi nonaktif. | Belum Diuji Penuh |
| 5. | Popup Konfirmasi Pengajuan | Dapat menampilkan ringkasan pengajuan sebelum benar-benar dikirim. | Belum Diuji Penuh |
| 6. | Lihat Pengajuan Saya | Dapat menampilkan daftar dan status pengajuan sendiri. | Belum Diuji Penuh |
| 7. | Lihat Skor Kinerja | Dapat menampilkan skor kinerja dan riwayat merit. | Belum Diuji Penuh |
| 8. | Lihat Pelanggaran Saya | Dapat menampilkan riwayat pelanggaran/disiplin milik sendiri. | Berhasil |
| 9. | Tolak Akses Data Orang Lain | Tidak dapat melihat riwayat disiplin operator lain. | Berhasil |
| 10. | Tolak Mencatat Pelanggaran | Tidak dapat membuat pelanggaran (khusus Foreman/Section Manager). | Berhasil |
| 11. | Logout | Dapat keluar dari sesi dan kembali ke halaman login. | Belum Diuji Penuh |

Catatan: pembacaan riwayat pelanggaran sendiri berhasil (HTTP 200), akses ke riwayat operator lain ditolak, dan percobaan mencatat pelanggaran ditolak dengan HTTP 403 sesuai harapan.

---

## Rekapitulasi UAT

| Peran | Berhasil | Perlu Perbaikan | Belum Diuji Penuh | Total Proses |
|---|:---:|:---:|:---:|:---:|
| Super Admin | 3 | 1 | 4 | 8 |
| Section Manager | 6 | 1 | 4 | 11 |
| Foreman | 8 | 0 | 3 | 11 |
| Staff Produksi | 3 | 0 | 3 | 6 |
| Operator | 4 | 0 | 7 | 11 |
| **Jumlah** | **24** | **2** | **21** | **47** |

## Temuan yang Perlu Ditindaklanjuti

1. `GET /api/users` mengembalikan HTTP 500 sehingga fitur Kelola Pengguna Super Admin belum dapat dinyatakan berhasil.
2. Modul laporan (`reports.routes.ts`) belum dipasang pada server utama sehingga fitur ekspor/laporan Section Manager perlu perbaikan.
3. Proses berstatus Belum Diuji Penuh perlu direkam dengan skenario end-to-end pada browser (login sampai logout, pengajuan VoO, scan QR, ekspor, dan monitoring) untuk melengkapi bukti UAT.

> Status Berhasil pada dokumen ini hanya diberikan bila terdapat bukti runtime atau hasil pengujian tersimpan. Proses yang belum memiliki bukti eksekusi antarmuka ditandai Belum Diuji Penuh agar laporan UAT tetap dapat dipertanggungjawabkan.
