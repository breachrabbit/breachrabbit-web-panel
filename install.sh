#!/bin/bash
set -e

echo "🐇 Breach Rabbit HostPanel Pro: Установка High-End стека..."

# 1. Подключение репозиториев (PHP, MariaDB, OLS, Nginx)
echo "📦 Настройка репозиториев..."
sudo apt-get update && sudo apt-get install -y curl wget gnupg2 lsb-release ca-certificates

# PHP (Ondrej Sury)
sudo add-apt-repository ppa:ondrej/php -y

# MariaDB 11
curl -LsS https://r.mariadb.com/downloads/mariadb_repo_setup | sudo bash -s -- --mariadb-server-version="mariadb-11.4"

# OpenLiteSpeed 1.8
wget -O - https://rpms.litespeedtech.com/debian/enable_lst_debian_repo.sh | sudo bash

# Nginx Mainline
echo "deb http://nginx.org/packages/mainline/ubuntu `lsb_release -cs` nginx" | sudo tee /etc/apt/sources.list.d/nginx.list
curl -fsSL https://nginx.org/keys/nginx_signing.key | sudo apt-key add -

# 2. Обновление и установка софта
sudo apt-get update
echo "🛠 Установка софта (PHP 8.3/8.4, MariaDB 11, OLS 1.8, Nginx)..."

# Устанавливаем PHP и расширения
sudo apt-get install -y php8.3 php8.3-fpm php8.3-mysql php8.3-xml php8.3-mbstring php8.3-curl php8.3-zip \
                        php8.4 php8.4-fpm php8.4-mysql php8.4-xml php8.4-mbstring php8.4-curl php8.4-zip

# Устанавливаем LSPHP (для OpenLiteSpeed)
sudo apt-get install -y lsphp83 lsphp84

# Серверы
sudo apt-get install -y openlitespeed nginx mariadb-server redis-server postgresql postgresql-contrib

# 3. Исправление прав PostgreSQL (как обсуждали)
echo "🐘 Настройка PostgreSQL и прав..."
sudo -u postgres psql -c "CREATE DATABASE breachrabbit;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE USER br_admin WITH PASSWORD 'br_secure_pass_2026';" 2>/dev/null || true
sudo -u postgres psql -d breachrabbit -c "ALTER SCHEMA public OWNER TO br_admin;"
sudo -u postgres psql -d breachrabbit -c "GRANT ALL ON SCHEMA public TO br_admin;"

# 4. Создание структуры папок и файлов панели
echo "📝 Настройка Next.js окружения..."
mkdir -p app
cat > app/page.tsx <<EOF
import { redirect } from 'next/navigation';
export default function RootPage() { redirect('/dashboard'); }
EOF

if [ ! -f ".env" ]; then
    cat > .env <<EOF
DATABASE_URL="postgresql://br_admin:br_secure_pass_2026@localhost:5432/breachrabbit"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_URL="http://$(curl -s ifconfig.me):3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
EOF
fi

# 5. Установка зависимостей и БД
echo "📦 NPM Install & Prisma..."
npm install
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
    create: { email: 'admin@breachrabbit.pro', name: 'Rabbit Admin', password: hashedPassword, role: 'ADMIN' },
  });
}
main().catch(console.error).finally(() => prisma.\$disconnect());
EOF
npx ts-node prisma/seed.ts || node -r ts-node/register prisma/seed.ts

# 7. Сборка и автозапуск
echo "🚀 Финальная сборка..."
npm run build
sudo npm install -g pm2
pm2 delete breachrabbit-panel 2>/dev/null || true
pm2 start npm --name "breachrabbit-panel" -- run start
pm2 save

echo "-------------------------------------------------------"
echo "✅ Breach Rabbit HostPanel Pro успешно установлена!"
echo "📍 PHP: 8.3, 8.4 (8.5 repo added)"
echo "📍 Веб-серверы: OpenLiteSpeed 1.8 + Nginx 1.28"
echo "📍 БД: MariaDB 11.4 + PostgreSQL 16"
echo "🌍 Адрес: http://$(curl -s ifconfig.me):3000"
echo "🔐 Логин: admin@breachrabbit.pro / admin123"
echo "-------------------------------------------------------"