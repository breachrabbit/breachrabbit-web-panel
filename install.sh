#!/bin/bash
set -e

echo "🐇 Breach Rabbit HostPanel Pro: Установка через зеркала Timeweb..."
echo "======================================================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_info() { echo -e "${YELLOW}ℹ $1${NC}"; }

if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root"
    exit 1
fi

# 1. Update system + Timeweb Mirrors
print_info "Step 1/11: Switching to Timeweb mirrors & updating..."
sed -i 's/archive.ubuntu.com/mirror.timeweb.ru/g' /etc/apt/sources.list
sed -i 's/security.ubuntu.com/mirror.timeweb.ru/g' /etc/apt/sources.list
apt-get update && apt-get upgrade -y
apt-get install -y curl wget gnupg2 lsb-release ca-certificates software-properties-common
print_success "System updated via Timeweb"

# 2. Add repositories
print_info "Step 2/11: Adding specialized repositories..."

# PHP (Ondrej Sury)
add-apt-repository ppa:ondrej/php -y

# MariaDB 11.4 (DIRECT Timeweb Mirror)
mkdir -p /etc/apt/keyrings
curl -fsSL https://mirror.timeweb.ru/mariadb/publicKey | gpg --dearmor -o /etc/apt/keyrings/mariadb-keyring.gpg
echo "deb [signed-by=/etc/apt/keyrings/mariadb-keyring.gpg] https://mirror.timeweb.ru/mariadb/repo/11.4/ubuntu noble main" > /etc/apt/sources.list.d/mariadb.list

# OpenLiteSpeed
wget -O - https://rpms.litespeedtech.com/debian/enable_lst_debian_repo.sh | bash

# Nginx Mainline
curl -fsSL https://nginx.org/keys/nginx_signing.key | gpg --dearmor -o /etc/apt/keyrings/nginx-archive-keyring.gpg
echo "deb [signed-by=/etc/apt/keyrings/nginx-archive-keyring.gpg] http://nginx.org/packages/mainline/ubuntu `lsb_release -cs` nginx" > /etc/apt/sources.list.d/nginx.list

# Node.js 20.x
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" > /etc/apt/sources.list.d/nodesource.list

print_success "Repositories added"

# 3. Install packages
print_info "Step 3/11: Installing packages..."
apt-get update
apt-get install -y php8.3 php8.3-fpm php8.3-mysql php8.3-xml php8.3-mbstring php8.3-curl php8.3-zip php8.3-gd php8.3-bcmath php8.3-intl
apt-get install -y php8.4 php8.4-fpm php8.4-mysql php8.4-xml php8.4-mbstring php8.4-curl php8.4-zip php8.4-gd php8.4-bcmath php8.4-intl
apt-get install -y lsphp83 lsphp84 openlitespeed nginx mariadb-server redis-server postgresql postgresql-contrib nodejs

# WP-CLI
curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar && chmod +x wp-cli.phar && mv wp-cli.phar /usr/local/bin/wp

# 4. PostgreSQL
print_info "Step 4/11: Configuring PostgreSQL..."
systemctl enable --now postgresql
sudo -u postgres psql -c "CREATE DATABASE breachrabbit;" || true
sudo -u postgres psql -c "CREATE USER br_admin WITH PASSWORD 'br_secure_pass_2026';" || true
sudo -u postgres psql -d breachrabbit -c "ALTER SCHEMA public OWNER TO br_admin;"
sudo -u postgres psql -d breachrabbit -c "GRANT ALL ON SCHEMA public TO br_admin;"

# 5. MariaDB
print_info "Step 5/11: Configuring MariaDB..."
systemctl enable --now mariadb
mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'br_mysql_root_2026'; DELETE FROM mysql.user WHERE User=''; DROP DATABASE IF EXISTS test; FLUSH PRIVILEGES;" || true

# 6. Redis & OpenLiteSpeed
print_info "Step 6/11: Services startup..."
systemctl enable --now redis-server lsws
/usr/local/lsws/admin/misc/admpass.sh <<EOF
admin
br_ols_admin_2026
br_ols_admin_2026
EOF

# 7. PostCSS Fix (IMPORTANT FOR TAILWIND)
print_info "Step 7/11: Configuring PostCSS for Tailwind..."
cat > postcss.config.js <<EOF
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# 8. Project Setup
print_info "Step 8/11: Setting up project..."
SERVER_IP=$(curl -s icanhazip.com || hostname -I | awk '{print $1}')
if [ ! -f ".env" ]; then
    cp .env.example .env
    sed -i "s|generate-with-openssl-rand-base64-32|$(openssl rand -base64 32)|g" .env
    sed -i "s|http://localhost:3000|http://$SERVER_IP:3000|g" .env
    # Подставляем креды из скрипта
    sed -i "s|postgresql://.*|postgresql://br_admin:br_secure_pass_2026@localhost:5432/breachrabbit|g" .env
fi

npm install
npx prisma generate
npx prisma db push --accept-data-loss
npm run db:seed || npx ts-node prisma/seed.ts

# 9. Build
print_info "Step 9/11: Building application..."
rm -rf .next
npm run build

# 10. PM2
print_info "Step 10/11: Starting with PM2..."
npm install -g pm2
pm2 delete breachrabbit-panel 2>/dev/null || true
pm2 start npm --name "breachrabbit-panel" -- start
pm2 save

# 11. Firewall
print_info "Step 11/11: Firewall..."
ufw allow 22,80,443,3000,7080/tcp && ufw --force enable

echo "======================================================================"
print_success "УСТАНОВКА ЗАВЕРШЕНА! СВЕТ ВКЛЮЧЕН, ЗЕРКАЛА ТАЙМВЕБ НАСТРОЕНЫ."
echo "🌍 Panel: http://$SERVER_IP:3000"
echo "🔐 Admin: admin@breachrabbit.pro / admin123"
echo "======================================================================"
