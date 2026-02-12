#!/bin/bash
set -e

echo "🐇 Breach Rabbit HostPanel Pro: Установка (Yandex + Timeweb + Fix GPG)"
echo "======================================================================"

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_info() { echo -e "${YELLOW}ℹ $1${NC}"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }

if [ "$EUID" -ne 0 ]; then echo -e "${RED}Запустите от root (sudo)!${NC}"; exit 1; fi

# 1. Принудительная настройка зеркал Yandex (чтобы не было archive.ubuntu.com)
print_info "Шаг 1: Настройка быстрых зеркал Yandex..."
cat > /etc/apt/sources.list <<EOF
deb http://mirror.yandex.ru/ubuntu/ noble main restricted universe multiverse
deb http://mirror.yandex.ru/ubuntu/ noble-updates main restricted universe multiverse
deb http://mirror.yandex.ru/ubuntu/ noble-backports main restricted universe multiverse
deb http://mirror.yandex.ru/ubuntu/ noble-security main restricted universe multiverse
EOF

apt-get update && apt-get install -y curl wget gnupg2 lsb-release ca-certificates software-properties-common sudo
print_success "Система переключена на Yandex Mirror"

# 2. Добавление репозиториев без 404 и интерактивных вопросов
print_info "Шаг 2: Настройка репозиториев (Keyrings)..."
mkdir -p /etc/apt/keyrings

# PHP (Ondrej Sury)
add-apt-repository ppa:ondrej/php -y

# MariaDB 11.4 (Timeweb Mirror) - флаг --yes убирает вопрос про Overwrite
curl -fsSL https://mirror.timeweb.ru/mariadb/publicKey | gpg --dearmor --yes -o /etc/apt/keyrings/mariadb-keyring.gpg
echo "deb [signed-by=/etc/apt/keyrings/mariadb-keyring.gpg] https://mirror.timeweb.ru/mariadb/repo/11.4/ubuntu noble main" > /etc/apt/sources.list.d/mariadb.list

# Nginx Mainline (Исправленный путь для Noble)
curl -fsSL https://nginx.org/keys/nginx_signing.key | gpg --dearmor --yes -o /etc/apt/keyrings/nginx-archive-keyring.gpg
echo "deb [signed-by=/etc/apt/keyrings/nginx-archive-keyring.gpg] http://nginx.org/packages/mainline/ubuntu noble nginx" > /etc/apt/sources.list.d/nginx.list

# Node.js 20.x (Актуальный Nodesource)
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor --yes -o /etc/apt/keyrings/nodesource.gpg
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" > /etc/apt/sources.list.d/nodesource.list

# OpenLiteSpeed
wget -O - https://rpms.litespeedtech.com/debian/enable_lst_debian_repo.sh | bash

print_success "Репозитории добавлены успешно"

# 3. Установка пакетов
print_info "Шаг 3: Установка серверного стека..."
apt-get update
apt-get install -y php8.3 php8.3-fpm php8.4 php8.4-fpm \
                   lsphp83 lsphp84 openlitespeed nginx mariadb-server \
                   redis-server postgresql postgresql-contrib nodejs

# 4. Настройка PostgreSQL
print_info "Шаг 4: Настройка PostgreSQL..."
systemctl enable --now postgresql
sudo -u postgres psql -c "CREATE DATABASE breachrabbit;" || true
sudo -u postgres psql -c "CREATE USER br_admin WITH PASSWORD 'br_secure_pass_2026';" || true
sudo -u postgres psql -d breachrabbit -c "ALTER SCHEMA public OWNER TO br_admin; GRANT ALL ON SCHEMA public TO br_admin;"

# 5. Настройка MariaDB
print_info "Шаг 5: Настройка MariaDB..."
systemctl enable --now mariadb
mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'br_mysql_root_2026'; FLUSH PRIVILEGES;" || true

# 6. Конфигурация PostCSS и .env (Свет!)
print_info "Шаг 6: Настройка стилей и окружения..."
SERVER_IP=$(curl -s icanhazip.com || hostname -I | awk '{print $1}')
cat > postcss.config.js <<EOF
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

if [ ! -f ".env" ]; then
    cp .env.example .env 2>/dev/null || touch .env
    echo "DATABASE_URL=\"postgresql://br_admin:br_secure_pass_2026@localhost:5432/breachrabbit\"" >> .env
    echo "NEXTAUTH_URL=\"http://$SERVER_IP:3000\"" >> .env
    echo "NEXTAUTH_SECRET=\"$(openssl rand -base64 32)\"" >> .env
fi

# 7. Сборка и запуск
print_info "Шаг 7: Сборка Next.js и запуск в PM2..."
npm install
npx prisma generate
npx prisma db push --accept-data-loss
npm run build

npm install -g pm2
pm2 delete breachrabbit-panel 2>/dev/null || true
pm2 start npm --name "breachrabbit-panel" -- start
pm2 save

echo "======================================================================"
print_success "УСТАНОВКА ЗАВЕРШЕНА!"
echo "🌍 Панель: http://$SERVER_IP:3000"
echo "======================================================================"
