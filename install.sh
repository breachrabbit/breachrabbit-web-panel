#!/bin/bash
set -e

echo "🐇 Breach Rabbit HostPanel Pro: Global Setup"

# 1. Авто-переименование в проекте
echo "📝 Обновляем название в конфигах..."
sed -i 's/"name": "hostpanel-pro"/"name": "breachrabbit-hostpanel-pro"/' package.json
# Замена во всех текстовых файлах (README, MASTER_PLAN и т.д.)
grep -rl "HostPanel Pro" . --exclude="install.sh" | xargs sed -i 's/HostPanel Pro/Breach Rabbit HostPanel Pro/g' || true

# 2. Определение пути
CURRENT_DIR=$(pwd)
APP_DIR="/var/www/breachrabbit-hostpanel-pro"

if [ "$CURRENT_DIR" != "$APP_DIR" ]; then
    echo "📂 Копируем файлы в $APP_DIR..."
    sudo mkdir -p $APP_DIR
    sudo cp -r ./* $APP_DIR/
    cd $APP_DIR
fi

# 3. Обновление и зависимости
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y curl git nodejs npm postgresql redis-server

# 4. Настройка БД (если еще не сделано)
echo "🐘 Проверка базы данных..."
sudo -u postgres psql -c "CREATE DATABASE breachrabbit;" 2>/dev/null || echo "БД уже есть"

# 5. Установка и Билд
npm install
npx prisma generate
npx prisma db push
npm run build

# 6. Запуск через PM2
sudo npm install -g pm2
pm2 delete breachrabbit-panel 2>/dev/null || true
pm2 start npm --name "breachrabbit-panel" -- run start

echo "✅ Готово! Проверь теперь: http://твой-ip:3000/"
1