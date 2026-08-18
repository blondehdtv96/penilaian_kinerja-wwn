import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Idempotent: kosongkan data dulu (urutan anak→induk) agar seed bisa dijalankan
  // ulang tanpa error unique constraint. Asumsi skema sudah sinkron (jalankan
  // `prisma db push` lebih dulu, atau pakai `npm run db:reset` yang sudah mencakupnya).
  await prisma.blockchainHash.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.eventLog.deleteMany();
  await prisma.qrScanLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.vooSubmission.deleteMany();
  await prisma.misconduct.deleteMany();
  await prisma.counseling.deleteMany();
  await prisma.kartuKuning.deleteMany();
  await prisma.suratPeringatan.deleteMany();
  await prisma.qrLocation.deleteMany();
  await prisma.operator.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  console.log('Cleared existing data (seed idempotent)');

  // ================================================================
  // 1. ROLES (4 roles: Super Admin + 3 operational)
  // ================================================================
  const superAdminRole = await prisma.role.create({
    data: {
      name: 'Super Admin',
      description: 'Full system access: manage all roles, users, data, settings, audit logs, and blockchain',
      permissions: JSON.stringify([
        'super_admin.*', 'admin.*',
        'voo.create', 'voo.view_own', 'voo.upload',
        'voo.approve_foreman', 'voo.approve_manager', 'voo.view',
        'qr.scan', 'qr.view',
        'merit.view_own', 'merit.create',
        'misconduct.create', 'misconduct.view', 'misconduct.view_own',
        'counseling.create', 'counseling.view',
        'kartu_kuning.create', 'kartu_kuning.view',
        'surat_peringatan.create', 'surat_peringatan.view',
        'operator.view', 'operator.monitor',
        'dashboard.kpi', 'ranking.view',
        'trend.merit', 'trend.misconduct',
        'export.pdf', 'export.excel',
        'evidence.upload',
        'users.manage', 'roles.manage', 'settings.manage',
        'audit.view', 'blockchain.view',
        'profile.view'
      ])
    }
  });

  const operatorRole = await prisma.role.create({
    data: {
      name: 'Operator',
      description: 'Scan QR area, submit VoO/Ide Kaizen, upload photos, view status, merit history',
      permissions: JSON.stringify([
        'voo.create', 'voo.view_own', 'voo.upload',
        'qr.scan', 'merit.view_own', 'misconduct.view_own',
        'profile.view'
      ])
    }
  });

  const foremanRole = await prisma.role.create({
    data: {
      name: 'Foreman',
      description: 'Approve VoO, input misconduct/konseling/kartu kuning/SP, upload evidence, monitor operators',
      permissions: JSON.stringify([
        'voo.approve_foreman', 'voo.view',
        'misconduct.create', 'misconduct.view',
        'counseling.create', 'counseling.view',
        'kartu_kuning.create', 'kartu_kuning.view',
        'surat_peringatan.create', 'surat_peringatan.view',
        'operator.view', 'operator.monitor',
        'qr.view', 'evidence.upload'
      ])
    }
  });

  const sectionManagerRole = await prisma.role.create({
    data: {
      name: 'Section Manager',
      description: 'Final approval, KPI dashboard, operator ranking, trend analysis, export PDF/Excel',
      permissions: JSON.stringify([
        'voo.approve_manager', 'voo.view',
        'dashboard.kpi', 'ranking.view',
        'trend.merit', 'trend.misconduct',
        'export.pdf', 'export.excel',
        'operator.view', 'misconduct.view',
        'counseling.view', 'kartu_kuning.view', 'surat_peringatan.view'
      ])
    }
  });

  const staffProduksiRole = await prisma.role.create({
    data: {
      name: 'Staff Produksi',
      description: 'Monitor VoO/Kaizen submissions and misconduct records (read-only) and manage Operator user accounts',
      permissions: JSON.stringify([
        'voo.view',
        'misconduct.view',
        'counseling.view',
        'kartu_kuning.view',
        'surat_peringatan.view',
        'profile.view',
        'operator.manage'
      ])
    }
  });

  console.log('Created 5 roles (Super Admin + 4 operational)');

  // ================================================================
  // 2. USERS
  // ================================================================
  const hash = (pw: string) => bcrypt.hash(pw, 10);

  // Super Admin
  await prisma.user.create({
    data: {
      username: 'superadmin',
      email: 'superadmin@bridgestone.com',
      password: await hash('superadmin123'),
      fullName: 'Super Administrator',
      nik: 'NIP-SA-001',
      roleId: superAdminRole.id
    }
  });

  // Section Manager
  await prisma.user.create({
    data: {
      username: 'section_manager',
      email: 'sectionmanager@bridgestone.com',
      password: await hash('manager123'),
      fullName: 'Section Manager',
      nik: 'NIP-SM-001',
      roleId: sectionManagerRole.id
    }
  });

  // Foreman
  await prisma.user.create({
    data: {
      username: 'foreman01',
      email: 'foreman01@bridgestone.com',
      password: await hash('foreman123'),
      fullName: 'Foreman Line 1',
      nik: 'NIP-FM-001',
      roleId: foremanRole.id
    }
  });

  // Staff Produksi
  await prisma.user.create({
    data: {
      username: 'staff_produksi',
      email: 'staffproduksi@bridgestone.com',
      password: await hash('staff123'),
      fullName: 'Staff Produksi',
      nik: 'NIP-SP-001',
      roleId: staffProduksiRole.id
    }
  });

  // Operator
  const opUser = await prisma.user.create({
    data: {
      username: 'operator01',
      email: 'operator01@bridgestone.com',
      password: await hash('operator123'),
      fullName: 'Operator Curing',
      nik: 'NIP-OP-001',
      roleId: operatorRole.id
    }
  });

  const opQrData = JSON.stringify({ employeeId: 'EMP1001', name: 'Operator Curing' });
  const opQrImage = await QRCode.toDataURL(opQrData);

  await prisma.operator.create({
    data: {
      userId: opUser.id,
      employeeId: 'EMP1001',
      section: 'Curing',
      group: 'A',
      position: 'Curing Operator',
      qrCode: opQrImage
    }
  });

  console.log('Created 5 users (1 per role: Super Admin, Section Manager, Foreman, Staff Produksi, Operator)');

  // ================================================================
  // 3. QR LOCATION AREAS
  // ================================================================
  const areaQrData = JSON.stringify({ locationCode: 'QR-CUR', name: 'Area Curing' });
  const areaQrImage = await QRCode.toDataURL(areaQrData);
  await prisma.qrLocation.create({
    data: { name: 'Area Curing', code: 'QR-CUR', area: 'Curing', description: 'Area kerja Curing', qrImage: areaQrImage }
  });

  console.log('Created 1 QR location area (Curing)');

  console.log('\n=== Seeding Complete ===');
  console.log('Credentials:');
  console.log('  Super Admin:     superadmin / superadmin123');
  console.log('  Section Manager: section_manager / manager123');
  console.log('  Foreman:         foreman01 / foreman123');
  console.log('  Staff Produksi:  staff_produksi / staff123');
  console.log('  Operator:        operator01 / operator123');
}

main()
  .catch((e) => { console.error('Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
