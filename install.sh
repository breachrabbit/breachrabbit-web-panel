#!/bin/bash

# ==============================================================================
# Breach Rabbit HostPanel Pro - Автоматический установщик (Ubuntu/Debian)
# ==============================================================================

set -e # Остановка скрипта при любой ошибке

# 1. Проверка прав root
if [ "$EUID" -ne 0 ]; then
  echo "❌ Пожалуйста, запустите скрипт с правами root (sudo ./install.sh)"
  exit 1
fi

echo "🐇 Начинаем установку Breach Rabbit HostPanel Pro..."

# 2. Обновление сервера
echo "📦 Обновление системных пакетов..."
apt-get update -y
apt-get upgrade -y

# 3. Установка стандартных приложений и зависимостей
echo "🛠 Установка базовых утилит (curl, git, build-essential, ufw)..."
apt-get install -y curl git wget build-essential ufw software-properties-common

echo "🟢 Установка Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo "🐘 Установка PostgreSQL 14+ и Redis..."
apt-get install -y postgresql postgresql-contrib redis-server

# Настройка PostgreSQL (Создание пользователя и БД)
echo "🗄 Настройка базы данных..."
sudo -u postgres psql -c "CREATE DATABASE breachrabbit;" || true
sudo -u postgres psql -c "CREATE USER br_admin WITH PASSWORD 'br_secure_pass_2026';" || true
sudo -u postgres psql -c "ALTER ROLE br_admin SET client_encoding TO 'utf8';" || true
sudo -u postgres psql -c "ALTER ROLE br_admin SET default_transaction_isolation TO 'read committed';" || true
sudo -u postgres psql -c "ALTER ROLE br_admin SET timezone TO 'UTC';" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE breachrabbit TO br_admin;" || true
sudo -u postgres psql -c "ALTER DATABASE breachrabbit OWNER TO br_admin;" || true

# Установка PM2 для фоновой работы панели
echo "⚙️ Установка PM2..."
npm install -g pm2

# 4. Установка самой панели
APP_DIR="/var/www/breachrabbit-hostpanel-pro"

echo "📂 Подготовка директории проекта ($APP_DIR)..."
mkdir -p /var/www
# Здесь в будущем будет git clone твоего репозитория, например:
# git clone https://github.com/yourusername/breachrabbit-hostpanel-pro.git $APP_DIR
# Пока что предполагаем, что файлы уже лежат в $APP_DIR или мы их туда копируем:
cd $APP_DIR || echo "⚠️ Не забудьте поместить файлы проекта в $APP_DIR"

# Если файлы там есть, продолжаем установку:
if [ -f "package.json" ]; then
    echo "📦 Установка NPM зависимостей..."
    npm install

    echo "🔐 Создание .env файла..."
    cat > .env <<EOF
DATABASE_URL="postgresql://br_admin:br_secure_pass_2026@localhost:5432/breachrabbit"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
EOF

    echo "🗃 Применение миграций Prisma..."
    npx prisma generate
    npx prisma db push

    echo "🏗 Сборка проекта (Next.js Build)..."
    npm run build

    echo "🚀 Запуск Breach Rabbit HostPanel Pro..."
    pm2 start npm --name "breachrabbit-panel" -- run start
    pm2 save
    pm2 startup
    
    echo "✅ Установка успешно завершена! Панель доступна на порту 3000."
else
    echo "⚠️ Файлы проекта не найдены в $APP_DIR. Закиньте файлы и запустите npm install && npm run build вручную."
fi