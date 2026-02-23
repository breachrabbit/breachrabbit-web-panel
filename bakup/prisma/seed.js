const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { randomBytes } = require('crypto');

const prisma = new PrismaClient();

function generateSecurePassword(length) {
  length = length || 16;
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const bytes = randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

async function main() {
  console.log('Seeding database...');

  var adminPassword = process.env.ADMIN_INITIAL_PASSWORD || generateSecurePassword();
  var hashedPassword = await bcrypt.hash(adminPassword, 12);

  var admin = await prisma.user.upsert({
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

  console.log('Admin user created: ' + admin.email);
  console.log('');
  console.log('========================================================');
  console.log('  ADMIN PASSWORD (save this now!):');
  console.log('  ' + adminPassword);
  console.log('  This will NOT be shown again!');
  console.log('========================================================');
  console.log('');
}

main()
  .catch(function(e) {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(function() {
    return prisma.$disconnect();
  });
