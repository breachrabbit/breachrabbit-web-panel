#!/bin/bash
set -e

echo "🐇 Breach Rabbit HostPanel Pro: Установка High-End стека..."
echo "======================================================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root (use sudo)"
    exit 1
fi

# 1. Update system
print_info "Step 1/10: Updating system..."
apt-get update && apt-get upgrade -y
apt-get install -y curl wget gnupg2 lsb-release ca-certificates software-properties-common
print_success "System updated"

# 2. Add repositories
print_info "Step 2/10: Adding repositories..."

# PHP (Ondrej Sury)
add-apt-repository ppa:ondrej/php -y

# MariaDB 11.4
curl -LsS https://r.mariadb.com/downloads/mariadb_repo_setup | bash -s -- --mariadb-server-version="mariadb-11.4"

# OpenLiteSpeed 1.8
wget -O - https://rpms.litespeedtech.com/debian/enable_lst_debian_repo.sh | bash

# Nginx Mainline
echo "deb http://nginx.org/packages/mainline/ubuntu `lsb_release -cs` nginx" | tee /etc/apt/sources.list.d/nginx.list
curl -fsSL https://nginx.org/keys/nginx_signing.key | apt-key add -

# Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

print_success "Repositories added"

# 3. Install packages
print_info "Step 3/10: Installing packages..."

apt-get update

# PHP 8.3 and 8.4
apt-get install -y php8.3 php8.3-fpm php8.3-mysql php8.3-xml php8.3-mbstring php8.3-curl php8.3-zip php8.3-gd php8.3-bcmath php8.3-intl
apt-get install -y php8.4 php8.4-fpm php8.4-mysql php8.4-xml php8.4-mbstring php8.4-curl php8.4-zip php8.4-gd php8.4-bcmath php8.4-intl

# LSPHP (for OpenLiteSpeed)
apt-get install -y lsphp83 lsphp84

# Web servers & databases
apt-get install -y openlitespeed nginx mariadb-server redis-server postgresql postgresql-contrib

# Node.js
apt-get install -y nodejs

# WP-CLI
curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
chmod +x wp-cli.phar
mv wp-cli.phar /usr/local/bin/wp

print_success "Packages installed"

# 4. Configure PostgreSQL
print_info "Step 4/10: Configuring PostgreSQL..."

# Start PostgreSQL
systemctl enable postgresql
systemctl start postgresql

# Create database and user
sudo -u postgres psql -c "CREATE DATABASE breachrabbit;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE USER br_admin WITH PASSWORD 'br_secure_pass_2026';" 2>/dev/null || true

# FIX: Grant schema permissions (PostgreSQL 15+ requirement)
sudo -u postgres psql -d breachrabbit -c "ALTER SCHEMA public OWNER TO br_admin;"
sudo -u postgres psql -d breachrabbit -c "GRANT ALL ON SCHEMA public TO br_admin;"

print_success "PostgreSQL configured"

# 5. Configure MariaDB
print_info "Step 5/10: Configuring MariaDB..."

systemctl enable mariadb
systemctl start mariadb

# Secure installation (non-interactive)
mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'br_mysql_root_2026';" 2>/dev/null || true
mysql -e "DELETE FROM mysql.user WHERE User='';"
mysql -e "DROP DATABASE IF EXISTS test;"
mysql -e "FLUSH PRIVILEGES;"

print_success "MariaDB configured"

# 6. Configure Redis
print_info "Step 6/10: Configuring Redis..."

systemctl enable redis-server
systemctl start redis-server

print_success "Redis configured"

# 7. Configure OpenLiteSpeed
print_info "Step 7/10: Configuring OpenLiteSpeed..."

systemctl enable lsws
systemctl start lsws

# Set admin password
/usr/local/lsws/admin/misc/admpass.sh <<EOF
admin
br_ols_admin_2026
br_ols_admin_2026
EOF

print_success "OpenLiteSpeed configured (port 7080)"

# 8. Configure Nginx
print_info "Step 8/10: Configuring Nginx..."

systemctl enable nginx
# Don't start yet, we'll configure it later

print_success "Nginx configured"

# 9. Setup project
print_info "Step 9/10: Setting up project..."

# Create .env if not exists
if [ ! -f ".env" ]; then
    cp .env.example .env
    
    # Generate random secret
    SECRET=$(openssl rand -base64 32)
    sed -i "s|generate-with-openssl-rand-base64-32|$SECRET|g" .env
    
    # Set server IP
    SERVER_IP=$(curl -s ifconfig.me)
    sed -i "s|http://localhost:3000|http://$SERVER_IP:3000|g" .env
    
    print_success ".env created"
else
    print_info ".env already exists, skipping"
fi

# Install npm dependencies
print_info "Installing npm dependencies..."
npm install

# Generate Prisma client
print_info "Generating Prisma client..."
npx prisma generate

# Push database schema
print_info "Pushing database schema..."
npx prisma db push --accept-data-loss

# Seed database
print_info "Seeding database..."
npm run db:seed

print_success "Project setup complete"

# 10. Build and start
print_info "Step 10/10: Building and starting..."

npm run build

# Install PM2 globally
npm install -g pm2

# Stop existing process
pm2 delete breachrabbit-panel 2>/dev/null || true

# Start with PM2
pm2 start npm --name "breachrabbit-panel" -- start

# Save PM2 process list
pm2 save

# Setup PM2 startup
pm2 startup systemd -u $SUDO_USER --hp /home/$SUDO_USER

print_success "Application started"

# 11. Configure firewall
print_info "Configuring firewall..."

ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw allow 7080/tcp
ufw --force enable

print_success "Firewall configured"

# Final message
echo ""
echo "======================================================================"
print_success "Breach Rabbit HostPanel Pro успешно установлена!"
echo "======================================================================"
echo ""
echo "📍 Версии:"
echo "   - PHP: 8.3, 8.4"
echo "   - OpenLiteSpeed: 1.8 (port 7080)"
echo "   - Nginx: 1.28 (port 80/443)"
echo "   - MariaDB: 11.4"
echo "   - PostgreSQL: 16"
echo "   - Redis: 7"
echo "   - Node.js: 20"
echo ""
echo "🌍 URLs:"
echo "   - Panel: http://$(curl -s ifconfig.me):3000"
echo "   - OLS Admin: https://$(curl -s ifconfig.me):7080"
echo ""
echo "🔐 Credentials:"
echo "   - Panel: admin@breachrabbit.pro / admin123"
echo "   - OLS Admin: admin / br_ols_admin_2026"
echo "   - PostgreSQL: br_admin / br_secure_pass_2026"
echo "   - MariaDB root: br_mysql_root_2026"
echo ""
echo "📝 Next steps:"
echo "   1. Change default passwords"
echo "   2. Configure SSL certificates"
echo "   3. Setup your first website"
echo ""
echo "======================================================================"
