import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Backfill satu kali untuk mengisi field `accumulatedPoints` pada setiap operator
 * agar sama dengan jumlah poin dari pelanggaran (Misconduct) yang masih aktif
 * (isActive = true).
 *
 * Diperlukan karena field `accumulatedPoints` baru ditambahkan pada skema, sehingga
 * operator yang sudah memiliki pelanggaran sebelumnya masih bernilai 0.
 * Menjaga invariant R8.1: accumulatedPoints == sum(active misconduct points).
 * Aman dijalankan berulang (idempoten) dan hanya menyentuh field accumulatedPoints.
 */
async function main() {
  const operators = await prisma.operator.findMany({ select: { id: true, accumulatedPoints: true } });

  let updated = 0;
  for (const op of operators) {
    const aggregate = await prisma.misconduct.aggregate({
      where: { operatorId: op.id, isActive: true },
      _sum: { points: true },
    });
    const actual = aggregate._sum.points ?? 0;

    if (actual !== op.accumulatedPoints) {
      await prisma.operator.update({
        where: { id: op.id },
        data: { accumulatedPoints: actual },
      });
      updated++;
      console.log(`Operator #${op.id}: ${op.accumulatedPoints} -> ${actual}`);
    }
  }

  console.log(`Selesai. ${updated} operator disinkronkan (dari total ${operators.length}).`);
}

main()
  .catch((e) => {
    console.error('Gagal backfill:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
