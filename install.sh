#!/bin/bash
set -e

echo "🐇 Breach Rabbit HostPanel Pro: Установка..."

# 1. Системные зависимости
echo "📦 Обновление системы и установка зависимостей..."
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y curl git nodejs npm postgresql redis-server build-essential

# 2. Настройка базы данных
echo "🐘 Настройка PostgreSQL..."
sudo -u postgres psql -c "CREATE DATABASE breachrabbit;" 2>/dev/null || echo "✅ БД уже существует"
sudo -u postgres psql -c "CREATE USER br_admin WITH PASSWORD 'br_secure_pass_2026';" 2>/dev/null || echo "✅ Пользователь уже существует"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE breachrabbit TO br_admin;" 2>/dev/null

# 3. Подготовка окружения
if [ ! -f ".env" ]; then
    echo "🔐 Создание .env файла..."
    cat > .env <<EOF
DATABASE_URL="postgresql://br_admin:br_secure_pass_2026@localhost:5432/breachrabbit"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_URL="http://$(curl -s ifconfig.me):3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
EOF
fi

# 4. Сборка приложения
echo "🏗 Установка зависимостей и сборка..."
npm install
npx prisma generate
npx prisma db push
npm run build

# 5. Запуск через PM2
echo "🚀 Запуск процесса..."
sudo npm install -g pm2
pm2 delete breachrabbit-panel 2>/dev/null || true
pm2 start npm --name "breachrabbit-panel" -- run start
pm2 save
pm2 startup

echo "---------------------------------------------------"
echo "✅ Установка завершена!"
echo "🌍 Панель доступна по адресу: http://$(curl -s ifconfig.me):3000"
echo "---------------------------------------------------"