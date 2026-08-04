/**
 * Script: seed-violation-types.ts
 * Mengisi katalog jenis pelanggaran (ViolationType) dengan pelanggaran umum di
 * lingkungan pabrik / Departemen Produksi (DPT). Tanpa data ini, dropdown
 * "Jenis Pelanggaran" pada form Input Pelanggaran (Foreman/Section Manager)
 * akan kosong.
 *
 * Idempoten: hanya menambahkan jenis yang BELUM ada (berdasarkan nama ternormalisasi),
 * sehingga aman dijalankan ulang tanpa menduplikasi.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/seed-violation-types.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Kategori mengikuti standar aplikasi: Kedisiplinan, Safety (K3), Quality, Produksi, Etika.
// severity: low | medium | high | critical — points: integer 1..100.
const defaults = [
  // ── Kedisiplinan ──────────────────────────────────────────────
  { name: 'Terlambat Masuk Kerja', category: 'Kedisiplinan', severity: 'low', points: 5 },
  { name: 'Tidak Melakukan Absensi (Check-in/Check-out)', category: 'Kedisiplinan', severity: 'low', points: 5 },
  { name: 'Bermain Handphone Saat Jam Kerja', category: 'Kedisiplinan', severity: 'low', points: 5 },
  { name: 'Meninggalkan Area Kerja Tanpa Izin', category: 'Kedisiplinan', severity: 'medium', points: 10 },
  { name: 'Pulang Sebelum Waktunya Tanpa Izin', category: 'Kedisiplinan', severity: 'medium', points: 10 },
  { name: 'Tidak Mengikuti Instruksi Atasan', category: 'Kedisiplinan', severity: 'medium', points: 15 },
  { name: 'Tidur Saat Jam Kerja', category: 'Kedisiplinan', severity: 'high', points: 20 },
  { name: 'Mangkir / Absen Tanpa Keterangan (Alpa)', category: 'Kedisiplinan', severity: 'high', points: 20 },

  // ── Safety / K3 ───────────────────────────────────────────────
  { name: 'Tidak Memakai APD (Alat Pelindung Diri)', category: 'Safety', severity: 'medium', points: 15 },
  { name: 'Mengabaikan Rambu / Tanda Keselamatan', category: 'Safety', severity: 'medium', points: 15 },
  { name: 'Merokok di Area Terlarang', category: 'Safety', severity: 'high', points: 20 },
  { name: 'Mengoperasikan Mesin Tanpa Otorisasi', category: 'Safety', severity: 'high', points: 25 },
  { name: 'Tidak Melaporkan Kecelakaan / Insiden Kerja', category: 'Safety', severity: 'high', points: 20 },
  { name: 'Melanggar Prosedur LOTO (Lock Out Tag Out)', category: 'Safety', severity: 'critical', points: 30 },
  { name: 'Pelanggaran Prosedur Keselamatan Berat', category: 'Safety', severity: 'critical', points: 30 },

  // ── Quality ───────────────────────────────────────────────────
  { name: 'Tidak Mengisi Checksheet / Dokumen Mutu', category: 'Quality', severity: 'low', points: 5 },
  { name: 'Kesalahan Kualitas Produk (Defect)', category: 'Quality', severity: 'medium', points: 10 },
  { name: 'Salah Setting Parameter Mesin', category: 'Quality', severity: 'medium', points: 15 },
  { name: 'Tidak Melakukan Inspeksi Sesuai Standar', category: 'Quality', severity: 'medium', points: 15 },
  { name: 'Meloloskan Produk NG (Not Good)', category: 'Quality', severity: 'high', points: 20 },

  // ── Produksi ──────────────────────────────────────────────────
  { name: 'Tidak Mencapai Target Produksi', category: 'Produksi', severity: 'low', points: 5 },
  { name: 'Tidak Menjaga Kebersihan Area Kerja (5S)', category: 'Produksi', severity: 'low', points: 5 },
  { name: 'Pemborosan Material (Waste)', category: 'Produksi', severity: 'medium', points: 10 },
  { name: 'Kelalaian Menyebabkan Kerusakan Mesin', category: 'Produksi', severity: 'high', points: 25 },

  // ── Etika & Perilaku ──────────────────────────────────────────
  { name: 'Memalsukan Data / Dokumen', category: 'Etika', severity: 'high', points: 30 },
  { name: 'Berkelahi di Tempat Kerja', category: 'Etika', severity: 'critical', points: 40 },
  { name: 'Intimidasi / Pelecehan Terhadap Rekan Kerja', category: 'Etika', severity: 'critical', points: 40 },
  { name: 'Merusak Aset Perusahaan Dengan Sengaja', category: 'Etika', severity: 'critical', points: 40 },
  { name: 'Berjudi / Mabuk di Lingkungan Kerja', category: 'Etika', severity: 'critical', points: 40 },
  { name: 'Pencurian Aset Perusahaan', category: 'Etika', severity: 'critical', points: 50 },
  { name: 'Melakukan Tindakan Asusila', category: 'Etika', severity: 'critical', points: 50 },
];

async function main() {
  // Ambil nama yang sudah ada (ternormalisasi) agar penambahan idempoten.
  const existing = await prisma.violationType.findMany({ select: { nameNormalized: true } });
  const existingNames = new Set(existing.map((e) => e.nameNormalized));

  let created = 0;
  let skipped = 0;
  for (const vt of defaults) {
    const nameNormalized = vt.name.trim().toLowerCase();
    if (existingNames.has(nameNormalized)) {
      skipped++;
      continue;
    }
    await prisma.violationType.create({ data: { ...vt, nameNormalized } });
    created++;
    console.log(`+ ${vt.name} [${vt.category}] ${vt.severity} — ${vt.points} poin`);
  }

  console.log(`\nSelesai. ${created} jenis pelanggaran ditambahkan, ${skipped} sudah ada (dilewati).`);
}

main()
  .catch((e) => { console.error('Gagal seed violation types:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
