const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.role.findFirst({ where: { name: 'Staff Produksi' } });
  if (existing) {
    console.log('Role "Staff Produksi" already exists, id:', existing.id);
    return;
  }

  const role = await prisma.role.create({
    data: {
      name: 'Staff Produksi',
      description: 'Monitor VoO/Kaizen submissions and misconduct records - read-only access',
      permissions: JSON.stringify([
        'voo.view', 'misconduct.view', 'counseling.view',
        'kartu_kuning.view', 'surat_peringatan.view', 'profile.view'
      ])
    }
  });
  console.log('Created role "Staff Produksi", id:', role.id);

  const existingUser = await prisma.user.findFirst({ where: { username: 'staff_produksi' } });
  if (!existingUser) {
    const pw = await bcrypt.hash('staff123', 10);
    const u = await prisma.user.create({
      data: {
        username: 'staff_produksi',
        email: 'staffproduksi@bridgestone.com',
        password: pw,
        fullName: 'Staff Produksi',
        nip: 'NIP-SP-001',
        roleId: role.id
      }
    });
    console.log('Created user "staff_produksi", id:', u.id);
    console.log('Login: staff_produksi / staff123');
  } else {
    console.log('User "staff_produksi" already exists, skipped.');
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
