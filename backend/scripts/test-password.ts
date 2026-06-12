import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testPassword() {
  console.log('🔍 Testing password authentication...\n');

  // Test credentials
  const testCases = [
    { username: 'superadmin', password: 'admin123' },
    { username: 'hrd_bridgestone', password: 'hrd123' },
    { username: 'manager_production', password: 'manager123' },
    { username: 'supervisor01', password: 'supervisor123' },
    { username: 'operator01', password: 'operator123' },
  ];

  for (const { username, password } of testCases) {
    try {
      const user = await prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          username: true,
          password: true,
          isActive: true,
        }
      });

      if (!user) {
        console.log(`❌ User '${username}' NOT FOUND`);
        continue;
      }

      const isValid = await bcrypt.compare(password, user.password);
      
      if (isValid) {
        console.log(`✅ ${username}: Password '${password}' is VALID`);
      } else {
        console.log(`❌ ${username}: Password '${password}' is INVALID`);
        console.log(`   Hash in DB: ${user.password.substring(0, 20)}...`);
        
        // Try to update with correct password
        const newHash = await bcrypt.hash(password, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { password: newHash }
        });
        console.log(`   ✓ Password reset for ${username}`);
      }
    } catch (error) {
      console.log(`❌ Error testing ${username}:`, error);
    }
  }

  console.log('\n✅ Password test completed!');
}

testPassword()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
