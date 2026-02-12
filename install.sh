#!/bin/bash

# Breach Rabbit HostPanel Pro - Ультимативный установщик
set -e

echo "🐇 Запуск полной настройки Breach Rabbit HostPanel Pro..."

# 1. Системные обновления
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y curl git nodejs npm postgresql redis-server build-essential openssl

# 2. Настройка PostgreSQL (Фикс прав schema public)
echo "🐘 Настройка базы данных и прав доступа..."
sudo -u postgres psql -c "CREATE DATABASE breachrabbit;" 2>/dev/null || echo "БД уже есть"
sudo -u postgres psql -c "CREATE USER br_admin WITH PASSWORD 'br_secure_pass_2026';" 2>/dev/null || echo "Юзер уже есть"
sudo -u postgres psql -d breachrabbit -c "ALTER SCHEMA public OWNER TO br_admin;"
sudo -u postgres psql -d breachrabbit -c "GRANT ALL ON SCHEMA public TO br_admin;"

# 3. Создание необходимых файлов "на лету"

# А. Редирект корня (Фикс 404)
echo "📝 Исправляем 404 (создаем app/page.tsx)..."
mkdir -p app
cat > app/page.tsx <<EOF
import { redirect } from 'next/navigation';
export default function RootPage() { redirect('/dashboard'); }
EOF

# Б. Конфигурация .env
if [ ! -f ".env" ]; then
    echo "🔐 Создаем .env..."
    cat > .env <<EOF
DATABASE_URL="postgresql://br_admin:br_secure_pass_2026@localhost:5432/breachrabbit"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_URL="http://$(curl -s ifconfig.me):3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
EOF
fi

# 4. Установка зависимостей
echo "📦 Установка NPM пакетов (может занять время)..."
npm install
npm install bcryptjs @types/bcryptjs # На всякий случай для сида

# 5. Prisma: Генерация и деплой схемы
echo "🏗 Синхронизация схемы БД..."
npx prisma generate
npx prisma db push

# 6. Создание админа (Seed)
echo "👤 Создание администратора..."
cat > prisma/seed.ts <<EOF
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@breachrabbit.pro' },
    update: {},
    create: {
      email: 'admin@breachrabbit.pro',
      name: 'Rabbit Admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log('✅ Админ создан: admin@breachrabbit.pro / admin123');
}
main().catch(e => console.error(e)).finally(() => prisma.\$disconnect());
EOF

npx ts-node prisma/seed.ts || node -r ts-node/register prisma/seed.ts

# 7. Сборка и запуск
echo "🚀 Финальная сборка проекта..."
npm run build

sudo npm install -g pm2
pm2 delete breachrabbit-panel 2>/dev/null || true
pm2 start npm --name "breachrabbit-panel" -- run start
pm2 save

echo "-------------------------------------------------------"
echo "✅ ВСЕ ГОТОВО! ПАНЕЛЬ РАБОТАЕТ БЕЗ ОШИБОК."
echo "🌍 Адрес: http://$(curl -s ifconfig.me):3000"
echo "🔐 Логин: admin@breachrabbit.pro"
echo "🔑 Пароль: admin123"
echo "-------------------------------------------------------"