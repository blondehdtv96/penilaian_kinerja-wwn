import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log('🔄 Resetting database...\n');

  try {
    console.log('Deleting existing data...');
    await prisma.blockchainLog.deleteMany({});
    await prisma.performanceLog.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.misconductEvent.deleteMany({});
    await prisma.meritEvent.deleteMany({});
    await prisma.operator.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.permission.deleteMany({});
    await prisma.productionLine.deleteMany({});
    await prisma.group.deleteMany({});
    await prisma.shift.deleteMany({});
    await prisma.department.deleteMany({});
    await prisma.division.deleteMany({});
    console.log('✅ All data deleted\n');
  } catch (error) {
    console.error('❌ Reset failed:', error);
    throw error;
  }
}

resetDatabase()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
