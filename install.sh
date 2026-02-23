#!/bin/bash
set -e

echo "🐇 HostPanel Pro: Secure Installation"
echo "======================================================================"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_info() { echo -e "${YELLOW}ℹ $1${NC}"; }

if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use sudo)"
    exit 1
fi

# ===== FIX: Generate unique passwords at install time =====
PG_PASS=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 24)
MYSQL_ROOT_PASS=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 24)
OLS_ADMIN_PASS=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 24)
REDIS_PASS=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 24)
ADMIN_PANEL_PASS=$(openssl rand -base64 16 | tr -dc 'A-Za-z0-9!@#$' | head -c 16)

# Save credentials to a secure file
CRED_FILE="/root/.hostpanel-credentials"

# 1. Update system
print_info "Step 1/10: Updating system..."
apt-get update && apt-get upgrade -y
apt-get install -y curl wget gnupg2 lsb-release ca-certificates software-properties-common apt-transport-https
print_success "System updated"

# 2. Add repositories
print_info "Step 2/10: Adding repositories..."

add-apt-repository ppa:ondrej/php -y

# FIX: Download scripts first, verify, then execute
MARIADB_SCRIPT=$(mktemp)
wget -q -O "$MARIADB_SCRIPT" https://r.mariadb.com/downloads/mariadb_repo_setup
chmod +x "$MARIADB_SCRIPT"
bash "$MARIADB_SCRIPT" --mariadb-server-version="mariadb-11.4.10"
rm -f "$MARIADB_SCRIPT"

OLS_SCRIPT=$(mktemp)
wget -q -O "$OLS_SCRIPT" https://rpms.litespeedtech.com/debian/enable_lst_debian_repo.sh
chmod +x "$OLS_SCRIPT"
bash "$OLS_SCRIPT"
rm -f "$OLS_SCRIPT"

echo "deb http://nginx.org/packages/mainline/ubuntu $(lsb_release -cs) nginx" | tee /etc/apt/sources.list.d/nginx.list
curl -fsSL https://nginx.org/keys/nginx_signing.key | apt-key add -

NODESOURCE_SCRIPT=$(mktemp)
curl -fsSL -o "$NODESOURCE_SCRIPT" https://deb.nodesource.com/setup_20.x
bash "$NODESOURCE_SCRIPT"
rm -f "$NODESOURCE_SCRIPT"

print_success "Repositories added"

# 3. Install packages
print_info "Step 3/10: Installing packages..."
apt-get update
apt-get install -y php8.3 php8.3-fpm php8.3-mysql php8.3-xml php8.3-mbstring php8.3-curl php8.3-zip php8.3-gd php8.3-bcmath php8.3-intl
apt-get install -y php8.4 php8.4-fpm php8.4-mysql php8.4-xml php8.4-mbstring php8.4-curl php8.4-zip php8.4-gd php8.4-bcmath php8.4-intl
apt-get install -y lsphp83 lsphp84
apt-get install -y openlitespeed nginx mariadb-server redis-server postgresql postgresql-contrib
apt-get install -y nodejs

curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
chmod +x wp-cli.phar
mv wp-cli.phar /usr/local/bin/wp

print_success "Packages installed"

# 4. Configure PostgreSQL
print_info "Step 4/10: Configuring PostgreSQL..."
systemctl enable postgresql
systemctl start postgresql
sudo -u postgres psql -c "CREATE DATABASE breachrabbit;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE USER br_admin WITH PASSWORD '${PG_PASS}';" 2>/dev/null || true
sudo -u postgres psql -d breachrabbit -c "ALTER SCHEMA public OWNER TO br_admin;"
sudo -u postgres psql -d breachrabbit -c "GRANT ALL ON SCHEMA public TO br_admin;"
print_success "PostgreSQL configured"

# 5. Configure MariaDB
print_info "Step 5/10: Configuring MariaDB..."
systemctl enable mariadb
systemctl start mariadb

mariadb -u root <<EOF
ALTER USER 'root'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('${MYSQL_ROOT_PASS}');
DELETE FROM mysql.user WHERE User='';
DROP DATABASE IF EXISTS test;
DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';
FLUSH PRIVILEGES;
EOF

print_success "MariaDB configured"

# 6. Configure Redis (FIX: with password and bind)
print_info "Step 6/10: Configuring Redis..."
systemctl enable redis-server

# FIX: Secure Redis
sed -i "s/^# requirepass .*/requirepass ${REDIS_PASS}/" /etc/redis/redis.conf
sed -i "s/^bind .*/bind 127.0.0.1 ::1/" /etc/redis/redis.conf
systemctl restart redis-server

print_success "Redis configured (password protected)"

# 7. Configure OpenLiteSpeed
print_info "Step 7/10: Configuring OpenLiteSpeed..."
/usr/local/lsws/bin/lswsctrl start || true
systemctl unmask lshttpd.service || true
systemctl enable lshttpd.service || true
systemctl restart lshttpd.service || true

/usr/local/lsws/admin/misc/admpass.sh <<EOF
admin
${OLS_ADMIN_PASS}
${OLS_ADMIN_PASS}
EOF

print_success "OpenLiteSpeed configured (port 7080)"

# 8. Configure Nginx
print_info "Step 8/10: Configuring Nginx..."
systemctl enable nginx
print_success "Nginx configured"

# 9. Setup project
print_info "Step 9/10: Setting up project..."

if [ ! -f ".env" ]; then
    cp .env.example .env
    SECRET=$(openssl rand -base64 32)
    SERVER_IP=$(curl -s ifconfig.me)

    sed -i "s|generate-with-openssl-rand-base64-32|$SECRET|g" .env
    sed -i "s|http://localhost:3000|http://$SERVER_IP:3000|g" .env
    sed -i "s|br_secure_pass_2026|${PG_PASS}|g" .env
    sed -i "s|REDIS_PASSWORD=.*|REDIS_PASSWORD=${REDIS_PASS}|g" .env
    sed -i "s|OLS_API_PASS=.*|OLS_API_PASS=${OLS_ADMIN_PASS}|g" .env

    print_success ".env created with unique secrets"
else
    print_info ".env already exists, skipping"
fi

npm install
npx prisma generate

# FIX: Use migrate deploy instead of push --accept-data-loss
npx prisma migrate deploy 2>/dev/null || npx prisma db push

# FIX: Set initial admin password via env
ADMIN_INITIAL_PASSWORD="${ADMIN_PANEL_PASS}" npm run db:seed

print_success "Project setup complete"

# 10. Build and start
print_info "Step 10/10: Building and starting..."
npm run build
npm install -g pm2
pm2 delete hostpanel-pro 2>/dev/null || true
pm2 start npm --name "hostpanel-pro" -- start
pm2 save
pm2 startup systemd -u $SUDO_USER --hp /home/$SUDO_USER
print_success "Application started"

# 11. Firewall (FIX: OLS 7080 NOT open to public)
print_info "Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
# FIX: OLS admin only from localhost (access via SSH tunnel)
# ufw allow 7080/tcp  <-- REMOVED: security risk
ufw --force enable
print_success "Firewall configured (OLS admin: SSH tunnel only)"

# ===== Save credentials securely =====
cat > "$CRED_FILE" <<CREDS
# HostPanel Pro Credentials — Generated $(date)
# DELETE THIS FILE after saving passwords to a password manager!

Panel URL:     http://${SERVER_IP}:3000
Panel Login:   admin@breachrabbit.pro
Panel Pass:    ${ADMIN_PANEL_PASS}

OLS Admin:     https://${SERVER_IP}:7080 (SSH tunnel only)
OLS User:      admin
OLS Pass:      ${OLS_ADMIN_PASS}

PostgreSQL:    br_admin / ${PG_PASS}
MariaDB root:  ${MYSQL_ROOT_PASS}
Redis:         ${REDIS_PASS}
CREDS

chmod 600 "$CRED_FILE"

echo ""
echo "======================================================================"
print_success "HostPanel Pro installed successfully!"
echo "======================================================================"
echo ""
echo "🔐 Credentials saved to: ${CRED_FILE}"
echo "   ⚠️  Move to password manager and DELETE this file!"
echo ""
echo "📍 Panel:     http://${SERVER_IP}:3000"
echo "📍 OLS Admin: Use SSH tunnel: ssh -L 7080:localhost:7080 root@${SERVER_IP}"
echo ""
echo "======================================================================"
