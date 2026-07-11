/**
 * Script: seed-violation-types.ts
 * Mengisi katalog jenis pelanggaran (ViolationType) default jika kosong.
 * Tanpa data ini, dropdown "Jenis Pelanggaran" pada form Input Pelanggaran
 * (Foreman/Section Manager) akan menampilkan "Katalog pelanggaran belum tersedia".
 * Run: npx tsx scripts/seed-violation-types.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaults = [
  { name: 'Terlambat Masuk Kerja', category: 'Kedisiplinan', severity: 'low', points: 5 },
  { name: 'Tidak Memakai APD', category: 'Safety', severity: 'medium', points: 15 },
  { name: 'Meninggalkan Area Kerja Tanpa Izin', category: 'Kedisiplinan', severity: 'medium', points: 10 },
  { name: 'Merokok di Area Terlarang', category: 'Safety', severity: 'high', points: 20 },
  { name: 'Tidak Mencapai Target Produksi', category: 'Produksi', severity: 'low', points: 5 },
  { name: 'Kesalahan Kualitas Produk', category: 'Quality', severity: 'medium', points: 10 },
  { name: 'Pelanggaran Prosedur Keselamatan Berat', category: 'Safety', severity: 'critical', points: 30 },
  { name: 'Tidur Saat Bekerja', category: 'Kedisiplinan', severity: 'high', points: 20 },
];

async function main() {
  const existingCount = await prisma.violationType.count();
  if (existingCount > 0) {
    console.log(`Katalog sudah memiliki ${existingCount} jenis pelanggaran. Tidak ada yang ditambahkan.`);
    return;
  }

  let created = 0;
  for (const vt of defaults) {
    await prisma.violationType.create({
      data: { ...vt, nameNormalized: vt.name.trim().toLowerCase() },
    });
    created++;
    console.log(`Jenis pelanggaran dibuat: ${vt.name} (${vt.points} poin)`);
  }

  console.log(`Selesai. ${created} jenis pelanggaran ditambahkan ke katalog.`);
}

main()
  .catch((e) => { console.error('Gagal seed violation types:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
