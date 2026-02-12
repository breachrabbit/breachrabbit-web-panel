#!/bin/bash
set -e

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🐰 Запуск ПОЛНОЙ установки Breach Rabbit HostPanel Pro (со стилями)...${NC}"

# 1. Системные обновления
echo -e "${GREEN}📦 Обновление системы...${NC}"
apt-get update && apt-get install -y curl wget git gnupg2 lsb-release ca-certificates sudo openssl

# 2. Добавление репозиториев
echo -e "${GREEN}🛠 Настройка репозиториев PHP и MariaDB...${NC}"
add-apt-repository ppa:ondrej/php -y

# Фикс для Ubuntu Noble (24.04)
curl -LsS https://r.mariadb.com/downloads/mariadb_repo_setup | bash -s -- \
--mariadb-server-version="mariadb-11.4" \
--os-type=ubuntu \
--os-dist=noble

# OpenLiteSpeed
wget -O - https://rpms.litespeedtech.com/debian/enable_lst_debian_repo.sh | bash

# 3. Установка ПО
echo -e "${GREEN}🚀 Установка серверного стека...${NC}"
apt-get update
apt-get install -y php8.3 php8.3-fpm php8.4 php8.4-fpm \
                   openlitespeed nginx mariadb-server redis-server \
                   postgresql postgresql-contrib nodejs npm

# 4. Настройка PostgreSQL и прав доступа
echo -e "${GREEN}🐘 Настройка PostgreSQL (Schema Public Fix)...${NC}"
sudo -u postgres psql -c "CREATE DATABASE breachrabbit;" || true
sudo -u postgres psql -c "CREATE USER br_admin WITH PASSWORD 'admin123';" || true
sudo -u postgres psql -d breachrabbit -c "ALTER SCHEMA public OWNER TO br_admin;"
sudo -u postgres psql -d breachrabbit -c "GRANT ALL ON SCHEMA public TO br_admin;"

# 5. Настройка окружения (.env)
echo -e "${GREEN}📝 Настройка .env...${NC}"
SERVER_IP=$(curl -s icanhazip.com || hostname -I | awk '{print $1}')

cat > .env <<EOF
DATABASE_URL="postgresql://br_admin:admin123@localhost:5432/breachrabbit"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_URL="http://$SERVER_IP:3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
EOF

# 6. !!! ВКЛЮЧАЕМ СВЕТ (PostCSS Config) !!!
echo -e "${GREEN}🎨 Настройка Tailwind CSS (PostCSS Fix)...${NC}"
cat > postcss.config.js <<EOF
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# 7. Установка зависимостей и Prisma
echo -e "${GREEN}📦 Установка npm пакетов...${NC}"
npm install
npx prisma generate
npx prisma db push

# 8. Seed (Создание админа)
echo -e "${GREEN}👤 Регистрация администратора...${NC}"
npx ts-node prisma/seed.ts || node -r ts-node/register prisma/seed.ts

# 9. Сборка проекта (Теперь со стилями!)
echo -e "${GREEN}🏗 Сборка Next.js (Tailwind Compilation)...${NC}"
rm -rf .next
npm run build

# 10. Запуск через PM2
echo -e "${GREEN}🚀 Запуск процесса...${NC}"
sudo npm install -g pm2
pm2 delete breachrabbit-panel 2>/dev/null || true
pm2 start npm --name "breachrabbit-panel" -- run start
pm2 save

echo -e "${BLUE}-------------------------------------------------------${NC}"
echo -e "${GREEN}✅ УСТАНОВКА ЗАВЕРШЕНА И СВЕТ ВКЛЮЧЕН!${NC}"
echo -e "🌍 Адрес: http://$SERVER_IP:3000"
echo -e "🔐 Логин: admin@breachrabbit.pro"
echo -e "🔑 Пароль: admin123"
echo -e "${BLUE}-------------------------------------------------------${NC}"
