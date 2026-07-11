import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Sinkronkan ulang counter `totalMisconduct` pada setiap operator agar sesuai
 * dengan jumlah record pelanggaran (Misconduct) yang sebenarnya.
 *
 * Diperlukan karena pembuatan pelanggaran sebelumnya tidak menaikkan counter,
 * sehingga kartu "Pelanggaran" menampilkan 0 meski operator punya pelanggaran.
 * Aman dijalankan berulang (idempoten) dan hanya menyentuh field totalMisconduct.
 */
async function main() {
  const operators = await prisma.operator.findMany({ select: { id: true, totalMisconduct: true } });

  let updated = 0;
  for (const op of operators) {
    const actual = await prisma.misconduct.count({ where: { operatorId: op.id } });
    if (actual !== op.totalMisconduct) {
      await prisma.operator.update({
        where: { id: op.id },
        data: { totalMisconduct: actual },
      });
      updated++;
      console.log(`Operator #${op.id}: ${op.totalMisconduct} -> ${actual}`);
    }
  }

  console.log(`Selesai. ${updated} operator disinkronkan (dari total ${operators.length}).`);
}

main()
  .catch((e) => {
    console.error('Gagal resync:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
