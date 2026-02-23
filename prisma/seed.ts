import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const hashed = await bcrypt.hash('admin123', 10)

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashed
    }
  })

  console.log('Seed complete: admin@example.com / admin123')
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
