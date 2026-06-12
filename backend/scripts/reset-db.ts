import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log('🔄 Resetting database...\n');

  try {
    // Delete all data in correct order (respecting foreign keys)
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
    await prisma.shift.deleteMany({});
    await prisma.department.deleteMany({});
    await prisma.division.deleteMany({});
    console.log('✅ All data deleted\n');

    // Create Permissions
    console.log('Creating permissions...');
    const permissions = await Promise.all([
      // User Management
      prisma.permission.create({ data: { name: 'user.view', description: 'View users', module: 'User Management' } }),
      prisma.permission.create({ data: { name: 'user.create', description: 'Create users', module: 'User Management' } }),
      prisma.permission.create({ data: { name: 'user.update', description: 'Update users', module: 'User Management' } }),
      prisma.permission.create({ data: { name: 'user.delete', description: 'Delete users', module: 'User Management' } }),
      
      // Role Management
      prisma.permission.create({ data: { name: 'role.view', description: 'View roles', module: 'Role Management' } }),
      prisma.permission.create({ data: { name: 'role.create', description: 'Create roles', module: 'Role Management' } }),
      prisma.permission.create({ data: { name: 'role.update', description: 'Update roles', module: 'Role Management' } }),
      prisma.permission.create({ data: { name: 'role.delete', description: 'Delete roles', module: 'Role Management' } }),
      
      // Operator Management
      prisma.permission.create({ data: { name: 'operator.view', description: 'View operators', module: 'Operator' } }),
      prisma.permission.create({ data: { name: 'operator.create', description: 'Create operators', module: 'Operator' } }),
      prisma.permission.create({ data: { name: 'operator.update', description: 'Update operators', module: 'Operator' } }),
      prisma.permission.create({ data: { name: 'operator.delete', description: 'Delete operators', module: 'Operator' } }),
      
      // Merit Management
      prisma.permission.create({ data: { name: 'merit.view', description: 'View merits', module: 'Merit' } }),
      prisma.permission.create({ data: { name: 'merit.create', description: 'Create merits', module: 'Merit' } }),
      prisma.permission.create({ data: { name: 'merit.approve', description: 'Approve merits', module: 'Merit' } }),
      
      // Misconduct Management
      prisma.permission.create({ data: { name: 'misconduct.view', description: 'View misconducts', module: 'Misconduct' } }),
      prisma.permission.create({ data: { name: 'misconduct.create', description: 'Create misconducts', module: 'Misconduct' } }),
      prisma.permission.create({ data: { name: 'misconduct.approve', description: 'Approve misconducts', module: 'Misconduct' } }),
      
      // Blockchain
      prisma.permission.create({ data: { name: 'blockchain.view', description: 'View blockchain', module: 'Blockchain' } }),
      prisma.permission.create({ data: { name: 'blockchain.verify', description: 'Verify blockchain', module: 'Blockchain' } }),
      
      // Reports
      prisma.permission.create({ data: { name: 'report.view', description: 'View reports', module: 'Reports' } }),
      prisma.permission.create({ data: { name: 'report.export', description: 'Export reports', module: 'Reports' } }),
      
      // Dashboard
      prisma.permission.create({ data: { name: 'dashboard.view', description: 'View dashboard', module: 'Dashboard' } }),
    ]);
    console.log(`✅ Created ${permissions.length} permissions\n`);

    // Create Roles
    console.log('Creating roles...');
    const superAdminRole = await prisma.role.create({
      data: {
        name: 'Super Admin',
        description: 'Full system access',
        rolePermissions: {
          create: permissions.map(p => ({ permissionId: p.id }))
        }
      }
    });

    const hrdRole = await prisma.role.create({
      data: {
        name: 'HRD',
        description: 'Human Resource Department',
        rolePermissions: {
          create: permissions
            .filter(p => !p.name.startsWith('role.') && !p.name.startsWith('user.delete'))
            .map(p => ({ permissionId: p.id }))
        }
      }
    });

    const managerRole = await prisma.role.create({
      data: {
        name: 'Manager',
        description: 'Department Manager',
        rolePermissions: {
          create: permissions
            .filter(p => p.module === 'Dashboard' || p.module === 'Reports' || p.module === 'Blockchain' || p.name.includes('.view'))
            .map(p => ({ permissionId: p.id }))
        }
      }
    });

    const supervisorRole = await prisma.role.create({
      data: {
        name: 'Supervisor',
        description: 'Production Supervisor',
        rolePermissions: {
          create: permissions
            .filter(p => p.name.includes('merit.') || p.name.includes('misconduct.') || p.name === 'operator.view' || p.name === 'dashboard.view')
            .map(p => ({ permissionId: p.id }))
        }
      }
    });

    const operatorRole = await prisma.role.create({
      data: {
        name: 'Operator',
        description: 'Production Operator',
        rolePermissions: {
          create: permissions
            .filter(p => p.name === 'dashboard.view' || p.name === 'operator.view' || p.name === 'merit.view' || p.name === 'misconduct.view')
            .map(p => ({ permissionId: p.id }))
        }
      }
    });
    console.log('✅ Created 5 roles\n');

    // Create Users with properly hashed passwords
    console.log('Creating users...');
    const password1 = await bcrypt.hash('admin123', 10);
    const password2 = await bcrypt.hash('hrd123', 10);
    const password3 = await bcrypt.hash('manager123', 10);
    const password4 = await bcrypt.hash('supervisor123', 10);
    const password5 = await bcrypt.hash('operator123', 10);

    const superAdmin = await prisma.user.create({
      data: {
        username: 'superadmin',
        email: 'admin@bridgestone.com',
        password: password1,
        fullName: 'Super Administrator',
        userRoles: { create: { roleId: superAdminRole.id } }
      }
    });

    const hrdUser = await prisma.user.create({
      data: {
        username: 'hrd_bridgestone',
        email: 'hrd@bridgestone.com',
        password: password2,
        fullName: 'HRD Bridgestone',
        userRoles: { create: { roleId: hrdRole.id } }
      }
    });

    const managerUser = await prisma.user.create({
      data: {
        username: 'manager_production',
        email: 'manager@bridgestone.com',
        password: password3,
        fullName: 'Production Manager',
        userRoles: { create: { roleId: managerRole.id } }
      }
    });

    const supervisorUser = await prisma.user.create({
      data: {
        username: 'supervisor01',
        email: 'supervisor01@bridgestone.com',
        password: password4,
        fullName: 'Supervisor Line 1',
        userRoles: { create: { roleId: supervisorRole.id } }
      }
    });
    console.log('✅ Created admin users\n');

    // Create Master Data
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

    // Production Lines
    const line1 = await prisma.productionLine.create({
      data: { name: 'Production Line 1', code: 'LINE-01', description: 'Tire Assembly Line 1' }
    });

    const line2 = await prisma.productionLine.create({
      data: { name: 'Production Line 2', code: 'LINE-02', description: 'Tire Assembly Line 2' }
    });
    console.log('✅ Created master data\n');

    // Create Sample Operators
    console.log('Creating operators...');
    const operators = [];
    
    for (let i = 1; i <= 5; i++) {
      const operatorPassword = await bcrypt.hash('operator123', 10);
      
      const operatorUser = await prisma.user.create({
        data: {
          username: `operator${i.toString().padStart(2, '0')}`,
          email: `operator${i}@bridgestone.com`,
          password: operatorPassword,
          fullName: `Operator ${i}`,
          userRoles: { create: { roleId: operatorRole.id } }
        }
      });

      const qrData = JSON.stringify({
        employeeId: `EMP${(1000 + i).toString()}`,
        name: `Operator ${i}`,
        timestamp: new Date().toISOString()
      });
      
      const qrCode = await QRCode.toDataURL(qrData);

      const operator = await prisma.operator.create({
        data: {
          employeeId: `EMP${(1000 + i).toString()}`,
          userId: operatorUser.id,
          departmentId: i % 2 === 0 ? tireManufacturing.id : qualityControl.id,
          shiftId: i % 3 === 0 ? shift3.id : i % 2 === 0 ? shift2.id : shift1.id,
          productionLineId: i % 2 === 0 ? line2.id : line1.id,
          qrCode: qrCode,
          position: i % 2 === 0 ? 'Assembly Operator' : 'Quality Inspector'
        }
      });

      operators.push(operator);
    }
    console.log(`✅ Created ${operators.length} operators\n`);

    console.log('✅ Database reset completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`- Permissions: ${permissions.length}`);
    console.log(`- Roles: 5`);
    console.log(`- Users: ${4 + operators.length}`);
    console.log(`- Operators: ${operators.length}`);
    console.log(`- Departments: 2`);
    console.log(`- Shifts: 3`);
    console.log(`- Production Lines: 2`);
    
    console.log('\n🔑 Default Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Super Admin:');
    console.log('  Username: superadmin');
    console.log('  Password: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('HRD:');
    console.log('  Username: hrd_bridgestone');
    console.log('  Password: hrd123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Manager:');
    console.log('  Username: manager_production');
    console.log('  Password: manager123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Supervisor:');
    console.log('  Username: supervisor01');
    console.log('  Password: supervisor123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Operators (5 users):');
    console.log('  Username: operator01, operator02, ..., operator05');
    console.log('  Password: operator123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

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
