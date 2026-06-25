import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Clear all TRANSACTIONAL data while keeping master data:
 *   KEPT    : User, Role, Operator, QrLocation
 *   CLEARED : VooSubmission, Misconduct, Counseling, KartuKuning,
 *             SuratPeringatan, Approval, EventLog, BlockchainHash, QrScanLog
 *
 * Operator performance counters are reset to 0 so testing starts clean.
 */
async function clearData() {
  console.log('🧹 Clearing transactional data (keeping users, roles, operators, QR locations)...\n');

  try {
    // Order matters because of foreign-key relations.
    // Delete dependent records first.
    const blockchain = await prisma.blockchainHash.deleteMany({});
    console.log(`  - BlockchainHash      : ${blockchain.count} deleted`);

    const approvals = await prisma.approval.deleteMany({});
    console.log(`  - Approval            : ${approvals.count} deleted`);

    const voo = await prisma.vooSubmission.deleteMany({});
    console.log(`  - VooSubmission       : ${voo.count} deleted`);

    const misconduct = await prisma.misconduct.deleteMany({});
    console.log(`  - Misconduct          : ${misconduct.count} deleted`);

    const counseling = await prisma.counseling.deleteMany({});
    console.log(`  - Counseling          : ${counseling.count} deleted`);

    const kartuKuning = await prisma.kartuKuning.deleteMany({});
    console.log(`  - KartuKuning         : ${kartuKuning.count} deleted`);

    const suratPeringatan = await prisma.suratPeringatan.deleteMany({});
    console.log(`  - SuratPeringatan     : ${suratPeringatan.count} deleted`);

    const qrScans = await prisma.qrScanLog.deleteMany({});
    console.log(`  - QrScanLog           : ${qrScans.count} deleted`);

    const events = await prisma.eventLog.deleteMany({});
    console.log(`  - EventLog            : ${events.count} deleted`);

    // Reset operator performance counters
    const opsReset = await prisma.operator.updateMany({
      data: {
        performanceScore: 0,
        totalMerit: 0,
        totalMisconduct: 0,
      },
    });
    console.log(`\n  ↺ Operator counters reset: ${opsReset.count} operators`);

    // Report what remains
    const [users, roles, operators, qrLocations] = await Promise.all([
      prisma.user.count(),
      prisma.role.count(),
      prisma.operator.count(),
      prisma.qrLocation.count(),
    ]);

    console.log('\n✅ Done. Remaining master data:');
    console.log(`     Users        : ${users}`);
    console.log(`     Roles        : ${roles}`);
    console.log(`     Operators    : ${operators}`);
    console.log(`     QR Locations : ${qrLocations}`);
    console.log('\nAll transactional data is empty. Ready for fresh input testing. 🚀');
  } catch (error) {
    console.error('❌ Clear failed:', error);
    throw error;
  }
}

clearData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
