import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

// FIX: Generate secure random password instead of hardcoded 'admin123'
function generateSecurePassword(length = 16): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const bytes = randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

async function main() {
  console.log('🌱 Seeding database...');

  // Use env variable or generate a new password
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || generateSecurePassword();

  // FIX: bcrypt cost 12 (was 10)
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@breachrabbit.pro' },
    update: {},
    create: {
      email: 'admin@breachrabbit.pro',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      firstName: 'Admin',
      lastName: 'User',
      language: 'ru',
      timezone: 'Europe/Moscow',
    },
  });

  console.log('✅ Admin user created:', admin.email);
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  🔐 INITIAL ADMIN PASSWORD (save this now!):    ║');
  console.log(`║  ${adminPassword.padEnd(48)}║`);
  console.log('║  ⚠️  This will NOT be shown again!              ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
