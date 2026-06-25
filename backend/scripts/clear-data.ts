import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearData() {
  console.log('🗑️  Menghapus semua data transaksi (menyisakan User & Role)...\n');

  try {
    // Hapus dari child ke parent (sesuai relasi)
    const blockchainCount = await prisma.blockchainHash.deleteMany({});
    console.log(`✅ BlockchainHash: ${blockchainCount.count} dihapus`);

    const approvalCount = await prisma.approval.deleteMany({});
    console.log(`✅ Approval: ${approvalCount.count} dihapus`);

    const eventLogCount = await prisma.eventLog.deleteMany({});
    console.log(`✅ EventLog: ${eventLogCount.count} dihapus`);

    const qrScanCount = await prisma.qrScanLog.deleteMany({});
    console.log(`✅ QrScanLog: ${qrScanCount.count} dihapus`);

    const qrLocationCount = await prisma.qrLocation.deleteMany({});
    console.log(`✅ QrLocation: ${qrLocationCount.count} dihapus`);

    const vooCount = await prisma.vooSubmission.deleteMany({});
    console.log(`✅ VooSubmission: ${vooCount.count} dihapus`);

    const misconductCount = await prisma.misconduct.deleteMany({});
    console.log(`✅ Misconduct: ${misconductCount.count} dihapus`);

    const counselingCount = await prisma.counseling.deleteMany({});
    console.log(`✅ Counseling: ${counselingCount.count} dihapus`);

    const kartuKuningCount = await prisma.kartuKuning.deleteMany({});
    console.log(`✅ KartuKuning: ${kartuKuningCount.count} dihapus`);

    const suratCount = await prisma.suratPeringatan.deleteMany({});
    console.log(`✅ SuratPeringatan: ${suratCount.count} dihapus`);

    const operatorCount = await prisma.operator.deleteMany({});
    console.log(`✅ Operator: ${operatorCount.count} dihapus`);

    console.log('\n✅ Selesai! Data User & Role tetap tersimpan.');

    // Tampilkan user yang tersisa
    const users = await prisma.user.findMany({
      select: { id: true, username: true, fullName: true, role: { select: { name: true } } }
    });
    console.log(`\n👤 ${users.length} User tersisa:`);
    users.forEach(u => console.log(`   - ${u.username} (${u.role.name}) — ${u.fullName}`));

  } catch (error) {
    console.error('❌ Gagal:', error);
    throw error;
  }
}

clearData()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
