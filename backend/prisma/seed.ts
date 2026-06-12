import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // ================================================================
  // 1. PERMISSIONS
  // ================================================================
  console.log('Creating permissions...');

  const permissionData = [
    // User Management
    { name: 'user.view', description: 'View users', module: 'User Management' },
    { name: 'user.create', description: 'Create users', module: 'User Management' },
    { name: 'user.update', description: 'Update users', module: 'User Management' },
    { name: 'user.delete', description: 'Delete users', module: 'User Management' },

    // Role Management
    { name: 'role.view', description: 'View roles', module: 'Role Management' },
    { name: 'role.create', description: 'Create roles', module: 'Role Management' },
    { name: 'role.update', description: 'Update roles', module: 'Role Management' },
    { name: 'role.delete', description: 'Delete roles', module: 'Role Management' },

    // Permission Management
    { name: 'permission.view', description: 'View permissions', module: 'Permission Management' },
    { name: 'permission.assign', description: 'Assign permissions to roles', module: 'Permission Management' },

    // Operator Management
    { name: 'operator.view', description: 'View operators', module: 'Operator' },
    { name: 'operator.create', description: 'Create operators', module: 'Operator' },
    { name: 'operator.update', description: 'Update operators', module: 'Operator' },
    { name: 'operator.delete', description: 'Delete operators', module: 'Operator' },
    { name: 'operator.scan', description: 'Scan QR operator', module: 'Operator' },

    // Merit Management
    { name: 'merit.view', description: 'View merits', module: 'Merit' },
    { name: 'merit.create', description: 'Create merits', module: 'Merit' },
    { name: 'merit.approve', description: 'Approve merits', module: 'Merit' },

    // Misconduct Management
    { name: 'misconduct.view', description: 'View misconducts', module: 'Misconduct' },
    { name: 'misconduct.create', description: 'Create misconducts', module: 'Misconduct' },
    { name: 'misconduct.approve', description: 'Approve misconducts', module: 'Misconduct' },

    // Blockchain
    { name: 'blockchain.view', description: 'View blockchain', module: 'Blockchain' },
    { name: 'blockchain.verify', description: 'Verify blockchain integrity', module: 'Blockchain' },

    // Reports
    { name: 'report.view', description: 'View reports', module: 'Reports' },
    { name: 'report.export', description: 'Export reports', module: 'Reports' },

    // Dashboard
    { name: 'dashboard.view', description: 'View dashboard KPI', module: 'Dashboard' },
    { name: 'dashboard.personal', description: 'View personal dashboard', module: 'Dashboard' },

    // Performance
    { name: 'performance.self', description: 'View own performance score', module: 'Performance' },
    { name: 'ranking.view', description: 'View ranking', module: 'Performance' },
  ];

  const permissions = await Promise.all(
    permissionData.map(p => prisma.permission.create({ data: p }))
  );

  console.log(`Created ${permissions.length} permissions`);

  // Helper to find permission by name
  const perm = (name: string) => permissions.find(p => p.name === name)!;

  // ================================================================
  // 2. ROLES with exact permission assignments
  // ================================================================
  console.log('Creating roles...');

  // Super Admin - Full system access
  const superAdminRole = await prisma.role.create({
    data: {
      name: 'Super Admin',
      description: 'Full system access - User, Role, Permission management, Blockchain monitoring',
      rolePermissions: {
        create: permissions.map(p => ({ permissionId: p.id }))
      }
    }
  });

  // Manager - Dashboard KPI + Audit Blockchain
  const managerRole = await prisma.role.create({
    data: {
      name: 'Manager',
      description: 'Dashboard KPI and Blockchain audit access',
      rolePermissions: {
        create: [
          { permissionId: perm('dashboard.view').id },
          { permissionId: perm('blockchain.view').id },
          { permissionId: perm('blockchain.verify').id },
        ]
      }
    }
  });

  // Staff Produksi - Monitoring, Dashboard, Approval, Reports
  const staffProduksiRole = await prisma.role.create({
    data: {
      name: 'Staff Produksi',
      description: 'Monitoring kinerja, approval events, dashboard KPI, export laporan',
      rolePermissions: {
        create: [
          { permissionId: perm('dashboard.view').id },
          { permissionId: perm('operator.view').id },
          { permissionId: perm('operator.create').id },
          { permissionId: perm('operator.update').id },
          { permissionId: perm('operator.delete').id },
          { permissionId: perm('merit.view').id },
          { permissionId: perm('merit.approve').id },
          { permissionId: perm('misconduct.view').id },
          { permissionId: perm('misconduct.approve').id },
          { permissionId: perm('report.view').id },
          { permissionId: perm('report.export').id },
          { permissionId: perm('ranking.view').id },
        ]
      }
    }
  });

  // Foreman - Scan QR, Input Merit/Misconduct
  const foremanRole = await prisma.role.create({
    data: {
      name: 'Foreman',
      description: 'Scan QR operator, input merit and misconduct events',
      rolePermissions: {
        create: [
          { permissionId: perm('operator.scan').id },
          { permissionId: perm('operator.view').id },
          { permissionId: perm('merit.view').id },
          { permissionId: perm('merit.create').id },
          { permissionId: perm('misconduct.view').id },
          { permissionId: perm('misconduct.create').id },
        ]
      }
    }
  });

  // Operator - View personal score, ranking, QR identity
  const operatorRole = await prisma.role.create({
    data: {
      name: 'Operator',
      description: 'View personal performance score, ranking, and QR identity',
      rolePermissions: {
        create: [
          { permissionId: perm('dashboard.personal').id },
          { permissionId: perm('performance.self').id },
          { permissionId: perm('ranking.view').id },
          { permissionId: perm('merit.view').id },
          { permissionId: perm('misconduct.view').id },
        ]
      }
    }
  });

  console.log('Created 5 roles');

  // ================================================================
  // 3. MASTER DATA (Divisions, Departments, Shifts, Groups, Lines)
  // ================================================================
  console.log('Creating master data...');

  // Divisions
  const productionDiv = await prisma.division.create({
    data: { name: 'Production Division', code: 'PROD', description: 'Manufacturing & Production' }
  });

  // Departments
  const tireManufacturing = await prisma.department.create({
    data: { name: 'Tire Manufacturing', code: 'TM01', divisionId: productionDiv.id }
  });

  const qualityControl = await prisma.department.create({
    data: { name: 'Quality Control', code: 'QC01', divisionId: productionDiv.id }
  });

  // Shifts
  const shift1 = await prisma.shift.create({
    data: { name: 'Shift 1', startTime: '07:00', endTime: '15:00' }
  });

  const shift2 = await prisma.shift.create({
    data: { name: 'Shift 2', startTime: '15:00', endTime: '23:00' }
  });

  const shift3 = await prisma.shift.create({
    data: { name: 'Shift 3', startTime: '23:00', endTime: '07:00' }
  });

  // Groups
  const group43A = await prisma.group.create({
    data: { name: '4-3A', code: 'GRP-43A', description: 'Group 4-3A' }
  });

  const group43B = await prisma.group.create({
    data: { name: '4-3B', code: 'GRP-43B', description: 'Group 4-3B' }
  });

  const group43C = await prisma.group.create({
    data: { name: '4-3C', code: 'GRP-43C', description: 'Group 4-3C' }
  });

  const group43D = await prisma.group.create({
    data: { name: '4-3D', code: 'GRP-43D', description: 'Group 4-3D' }
  });

  const groupNonShift = await prisma.group.create({
    data: { name: 'Non-Shift', code: 'GRP-NS', description: 'Non-shift workers' }
  });

  const allGroups = [group43A, group43B, group43C, group43D, groupNonShift];

  // Production Lines
  const line1 = await prisma.productionLine.create({
    data: { name: 'Production Line 1', code: 'LINE-01', description: 'Tire Assembly Line 1' }
  });

  const line2 = await prisma.productionLine.create({
    data: { name: 'Production Line 2', code: 'LINE-02', description: 'Tire Assembly Line 2' }
  });

  console.log('Created master data');

  // ================================================================
  // 4. USERS
  // ================================================================
  console.log('Creating users...');

  // Super Admin
  await prisma.user.create({
    data: {
      username: 'superadmin',
      email: 'admin@bridgestone.com',
      password: await bcrypt.hash('admin123', 10),
      fullName: 'Super Administrator',
      userRoles: { create: { roleId: superAdminRole.id } }
    }
  });

  // Manager
  await prisma.user.create({
    data: {
      username: 'manager_production',
      email: 'manager@bridgestone.com',
      password: await bcrypt.hash('manager123', 10),
      fullName: 'Production Manager',
      userRoles: { create: { roleId: managerRole.id } }
    }
  });

  // Staff Produksi (replaces HRD)
  await prisma.user.create({
    data: {
      username: 'staff_produksi',
      email: 'staffproduksi@bridgestone.com',
      password: await bcrypt.hash('staff123', 10),
      fullName: 'Staff Produksi',
      userRoles: { create: { roleId: staffProduksiRole.id } }
    }
  });

  // Foreman (replaces Supervisor)
  await prisma.user.create({
    data: {
      username: 'foreman01',
      email: 'foreman01@bridgestone.com',
      password: await bcrypt.hash('foreman123', 10),
      fullName: 'Foreman Line 1',
      userRoles: { create: { roleId: foremanRole.id } }
    }
  });

  // ================================================================
  // 5. OPERATORS
  // ================================================================
  console.log('Creating operators...');

  const jobTypes = ['operator', 'checker', 'inspector'];
  const positions = ['Assembly Operator', 'Quality Checker', 'Quality Inspector'];

  for (let i = 1; i <= 5; i++) {
    const jobIndex = (i - 1) % jobTypes.length;

    const operatorUser = await prisma.user.create({
      data: {
        username: `operator${i.toString().padStart(2, '0')}`,
        email: `operator${i}@bridgestone.com`,
        password: await bcrypt.hash('operator123', 10),
        fullName: `Operator ${i}`,
        userRoles: { create: { roleId: operatorRole.id } }
      }
    });

    await prisma.operator.create({
      data: {
        employeeId: `EMP${(1000 + i).toString()}`,
        userId: operatorUser.id,
        departmentId: i % 2 === 0 ? tireManufacturing.id : qualityControl.id,
        shiftId: i % 3 === 0 ? shift3.id : i % 2 === 0 ? shift2.id : shift1.id,
        productionLineId: i % 2 === 0 ? line2.id : line1.id,
        groupId: allGroups[(i - 1) % allGroups.length].id,
        job: jobTypes[jobIndex],
        qrCode: `QR-EMP${(1000 + i).toString()}`,
        position: positions[jobIndex]
      }
    });
  }

  console.log('✅ Seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Permissions: ${permissions.length}`);
  console.log(`- Roles: 5 (Super Admin, Manager, Staff Produksi, Foreman, Operator)`);
  console.log(`- Users: 9 (4 staff + 5 operators)`);
  console.log(`- Groups: 5 (4-3A, 4-3B, 4-3C, 4-3D, Non-Shift)`);
  console.log(`- Departments: 2`);
  console.log(`- Shifts: 3`);
  console.log(`- Production Lines: 2`);

  console.log('\n🔑 Default Credentials:');
  console.log('Super Admin     - username: superadmin,           password: admin123');
  console.log('Manager         - username: manager_production,   password: manager123');
  console.log('Staff Produksi  - username: staff_produksi,       password: staff123');
  console.log('Foreman         - username: foreman01,            password: foreman123');
  console.log('Operators       - username: operator01-05,        password: operator123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
