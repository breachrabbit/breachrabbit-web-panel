import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@breachrabbit.pro' },
    update: {},
    create: {
      email: 'admin@breachrabbit.pro',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      firstName: 'Breach',
      lastName: 'Rabbit',
      language: 'ru',
      timezone: 'Europe/Moscow',
    },
  });

  console.log('✅ Admin user created:', admin.email);
  console.log('🔐 Default password: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
