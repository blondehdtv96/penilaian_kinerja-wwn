# Mockup Antarmuka (untuk Skripsi)

Rancangan antarmuka 24 halaman sistem, digambar sebagai **wireframe hitam-putih**
agar tetap terbaca saat dicetak grayscale.

## Isi folder

| Berkas | Keterangan |
| --- | --- |
| `svg/` | 24 mockup siap sisip ke dokumen (SVG, vektor — tidak pecah saat di-zoom) |
| `screenshots/` | Tangkapan layar aplikasi yang berjalan; jadi acuan isi tiap mockup |
| `generate-mockups.js` | Skrip pembuat SVG |
| `index.html` | Halaman indeks untuk melihat seluruh mockup sekaligus |

## Membuat ulang

```bash
node docs/mockup/generate-mockups.js
```

Skrip menulis ulang seluruh isi `svg/` dan `index.html`. Ubah dulu definisi
halaman di `generate-mockups.js` bila ada perubahan tata letak.

## Daftar halaman

| No | Berkas | Peran |
| --- | --- | --- |
| 1 | `01-login` | — |
| 2 | `02-operator-dashboard` | Operator |
| 3 | `03-operator-scan-qr` | Operator |
| 4 | `04-operator-ajukan-voo` | Operator |
| 5 | `05-operator-pengajuan-saya` | Operator |
| 6 | `06-operator-pelanggaran-saya` | Operator |
| 7 | `07-profil-saya` | Semua peran |
| 8 | `08-foreman-persetujuan-voo` | Foreman |
| 9 | `09-foreman-pembinaan-pelanggaran` | Foreman |
| 10 | `10-monitor-operator` | Foreman, Section Manager |
| 11 | `11-detail-operator` | Foreman, Section Manager |
| 12 | `12-manager-dashboard-kpi` | Section Manager |
| 13 | `13-manager-persetujuan-final` | Section Manager |
| 14 | `14-manager-ranking-operator` | Section Manager |
| 15 | `15-manager-analisis-tren` | Section Manager |
| 16 | `16-manager-export-laporan` | Section Manager |
| 17 | `17-manager-blockchain` | Section Manager |
| 18 | `18-manager-log-audit` | Section Manager |
| 19 | `19-manager-katalog-pelanggaran` | Section Manager |
| 20 | `20-admin-kelola-pengguna` | Super Admin |
| 21 | `21-admin-kelola-peran` | Super Admin |
| 22 | `22-admin-lokasi-qr` | Super Admin |
| 23 | `23-staff-monitor-voo` | Staff Produksi |
| 24 | `24-staff-monitor-pelanggaran` | Staff Produksi |

## Menyisipkan ke Word

SVG didukung langsung oleh Word 2016 ke atas: **Insert → Pictures → This Device**,
pilih berkas `.svg`. Bila versi Word Anda menolak SVG, buka `index.html` di
browser lalu cetak ke PDF, atau ekspor tiap SVG ke PNG lewat browser.

## Catatan

Sebagian angka pada mockup (skor, jumlah pengajuan) berasal dari data seed
pengembangan, bukan data produksi.
