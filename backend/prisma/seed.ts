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
      nip: 'NIP-SA-001',
      roleId: superAdminRole.id
    }
  });

  // Section Manager
  const smUser = await prisma.user.create({
    data: {
      username: 'section_manager',
      email: 'sectionmanager@bridgestone.com',
      password: await hash('manager123'),
      fullName: 'Section Manager',
      nip: 'NIP-SM-001',
      roleId: sectionManagerRole.id
    }
  });

  // Foremen
  const foreman1 = await prisma.user.create({
    data: {
      username: 'foreman01',
      email: 'foreman01@bridgestone.com',
      password: await hash('foreman123'),
      fullName: 'Foreman Line 1',
      nip: 'NIP-FM-001',
      roleId: foremanRole.id
    }
  });

  const foreman2 = await prisma.user.create({
    data: {
      username: 'foreman02',
      email: 'foreman02@bridgestone.com',
      password: await hash('foreman123'),
      fullName: 'Foreman Line 2',
      nip: 'NIP-FM-002',
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
      nip: 'NIP-SP-001',
      roleId: staffProduksiRole.id
    }
  });

  // Operators
  const sections = ['Curing', 'Curing', 'Curing', 'Curing', 'Curing'];
  const lines = ['Line A', 'Line B', 'Line C', 'Line D', 'Line E'];
  const groups = ['4-3A', '4-3B', '4-3C', '4-3D', 'Non-Shift'];
  const positions = ['Curing Operator', 'Curing Operator', 'Curing Operator', 'Curing Operator', 'Curing Operator'];

  const operators = [];
  for (let i = 0; i < 5; i++) {
    const empId = `EMP${(1001 + i).toString()}`;
    const opUser = await prisma.user.create({
      data: {
        username: `operator${(i + 1).toString().padStart(2, '0')}`,
        email: `operator${i + 1}@bridgestone.com`,
        password: await hash('operator123'),
        fullName: `Operator ${i + 1}`,
        nip: `NIP-OP-${(i + 1).toString().padStart(3, '0')}`,
        roleId: operatorRole.id
      }
    });

    const qrData = JSON.stringify({ employeeId: empId, name: `Operator ${i + 1}` });
    const qrImage = await QRCode.toDataURL(qrData);

    const op = await prisma.operator.create({
      data: {
        userId: opUser.id,
        employeeId: empId,
        section: sections[i],
        line: lines[i],
        group: groups[i],
        position: positions[i],
        qrCode: qrImage,
        performanceScore: Math.round((50 + Math.random() * 50) * 10) / 10,
        totalMerit: Math.floor(Math.random() * 20),
        totalMisconduct: Math.floor(Math.random() * 5)
      }
    });
    operators.push(op);
  }

  console.log('Created 9 users (1 Super Admin, 1 SM, 2 Foremen, 1 Staff Produksi, 5 Operators)');

  // ================================================================
  // 3. QR LOCATION AREAS
  // ================================================================
  const qrAreas = [
    { name: 'Area Curing', code: 'QR-CUR', area: 'Curing', description: 'Area kerja Curing' },
  ];

  for (const area of qrAreas) {
    const qrData = JSON.stringify({ locationCode: area.code, name: area.name });
    const qrImage = await QRCode.toDataURL(qrData);
    await prisma.qrLocation.create({
      data: { ...area, qrImage }
    });
  }

  console.log('Created 1 QR location area (Curing)');

  // ================================================================
  // 4. SAMPLE VOO SUBMISSIONS
  // ================================================================
  const sampleVoos = [
    { title: 'Perbaikan Alur Material', desc: 'Mengurangi waste pada proses搬运 material', type: 'VoO' },
    { title: 'Ide Kaizen Safety Guard', desc: 'Penambahan safety guard pada mesin pressing', type: 'IdeKaizen' },
    { title: 'Efisiensi Waktu Setup', desc: 'Mengurangi waktu setup mesin dari 30 menit ke 15 menit', type: 'VoO' },
  ];

  for (let i = 0; i < sampleVoos.length; i++) {
    await prisma.vooSubmission.create({
      data: {
        operatorId: operators[i % operators.length].id,
        submittedById: operators[i % operators.length].userId,
        title: sampleVoos[i].title,
        description: sampleVoos[i].desc,
        type: sampleVoos[i].type,
        status: i === 0 ? 'approved_foreman' : i === 1 ? 'approved_final' : 'pending',
        points: i === 1 ? 15 : 0,
        foremanApprovedBy: i >= 0 ? foreman1.id : null,
        managerApprovedBy: i === 1 ? smUser.id : null,
      }
    });
  }

  console.log('Created 3 sample VoO submissions');

  // ================================================================
  // 5. SAMPLE MISCONDUCT
  // ================================================================
  await prisma.misconduct.create({
    data: {
      operatorId: operators[0].id,
      createdById: foreman1.id,
      type: 'Late Arrival',
      severity: 'low',
      description: 'Terlambat 15 menit tanpa pemberitahuan',
      points: 5
    }
  });

  console.log('Created 1 sample misconduct');

  console.log('\n=== Seeding Complete ===');
  console.log('Credentials:');
  console.log('  Super Admin:     superadmin / superadmin123');
  console.log('  Section Manager: section_manager / manager123');
  console.log('  Foreman:         foreman01 / foreman123');
  console.log('                 foreman02 / foreman123');
  console.log('  Staff Produksi:  staff_produksi / staff123');
  console.log('  Operators:       operator01-05 / operator123');
}

main()
  .catch((e) => { console.error('Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
