import { PrismaClient } from '@prisma/client';
import QRCode from 'qrcode';

const prisma = new PrismaClient();

/**
 * Backfill profil operator untuk user dengan role "Operator" yang belum memiliki
 * record di tabel `operator`. Tanpa profil ini, operator tidak muncul di endpoint
 * GET /operators sehingga dropdown "Pilih operator" pada form pelanggaran kosong.
 */
async function main() {
  const operatorUsers = await prisma.user.findMany({
    where: { role: { name: 'Operator' }, operator: null },
    orderBy: { id: 'asc' },
  });

  if (operatorUsers.length === 0) {
    console.log('Semua user operator sudah memiliki profil. Tidak ada yang perlu dibuat.');
    return;
  }

  // Tentukan nomor employeeId berikutnya agar unik.
  const existing = await prisma.operator.findMany({ select: { employeeId: true } });
  let nextNum = 1001;
  for (const o of existing) {
    const m = /^EMP(\d+)$/.exec(o.employeeId);
    if (m) nextNum = Math.max(nextNum, parseInt(m[1], 10) + 1);
  }

  let created = 0;
  for (const u of operatorUsers) {
    const employeeId = `EMP${nextNum++}`;
    const qrCode = await QRCode.toDataURL(
      JSON.stringify({ employeeId, name: u.fullName })
    );

    await prisma.operator.create({
      data: {
        userId: u.id,
        employeeId,
        section: 'Curing',
        group: '',
        position: 'Operator',
        qrCode,
      },
    });
    created++;
    console.log(`Profil operator dibuat: ${u.fullName} (${u.username}) -> ${employeeId}`);
  }

  console.log(`Selesai. ${created} profil operator dibuat.`);
}

main()
  .catch((e) => {
    console.error('Gagal backfill operator:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
