/**
 * Script: add-staff-produksi.ts
 * Adds the "Staff Produksi" role and a sample user to an existing database.
 * Run: npx ts-node scripts/add-staff-produksi.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding Staff Produksi role...');

  // Check if role already exists
  const existing = await prisma.role.findFirst({ where: { name: 'Staff Produksi' } });
  if (existing) {
    console.log('✓ Role "Staff Produksi" already exists (id:', existing.id, ')');
    return;
  }

  // Create role
  const role = await prisma.role.create({
    data: {
      name: 'Staff Produksi',
      description: 'Monitor VoO/Kaizen submissions and misconduct records — read-only access',
      permissions: JSON.stringify([
        'voo.view',
        'misconduct.view',
        'counseling.view',
        'kartu_kuning.view',
        'surat_peringatan.view',
        'profile.view'
      ])
    }
  });
  console.log('✓ Created role "Staff Produksi" (id:', role.id, ')');

  // Create sample user (skip if username already taken)
  const existingUser = await prisma.user.findFirst({ where: { username: 'staff_produksi' } });
  if (!existingUser) {
    const hashedPassword = await bcrypt.hash('staff123', 10);
    const user = await prisma.user.create({
      data: {
        username: 'staff_produksi',
        email: 'staffproduksi@bridgestone.com',
        password: hashedPassword,
        fullName: 'Staff Produksi',
        nik: 'NIP-SP-001',
        roleId: role.id
      }
    });
    console.log('✓ Created user "staff_produksi" (id:', user.id, ')');
    console.log('  Login: staff_produksi / staff123');
  } else {
    console.log('✓ User "staff_produksi" already exists, skipped.');
  }

  console.log('\nDone!');
}

main()
  .catch((e) => { console.error('Failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
