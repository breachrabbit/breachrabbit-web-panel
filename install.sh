#!/bin/bash

set -e

if [ "$EUID" -ne 0 ]; then
  echo "❌ Run as root"
  exit 1
fi

PANEL_DOMAIN=$1
SSL_EMAIL=$2

if [ -z "$PANEL_DOMAIN" ] || [ -z "$SSL_EMAIL" ]; then
  echo "Usage:"
  echo "sudo ./install.sh panel.domain.com email@example.com"
  exit 1
fi

echo "🚀 Installing Breach Rabbit Web Panel"
echo "Domain: $PANEL_DOMAIN"
echo "Email:  $SSL_EMAIL"
echo "====================================="

# -----------------------------------
# System update
# -----------------------------------
apt update && apt upgrade -y

apt install -y curl wget git unzip build-essential \
  nginx redis-server postgresql postgresql-contrib \
  certbot python3-certbot-nginx ufw

# -----------------------------------
# Node 20
# -----------------------------------
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# -----------------------------------
# PostgreSQL setup
# -----------------------------------
sudo -u postgres psql <<EOF
CREATE USER hostpanel WITH PASSWORD 'StrongPanelPass123!';
CREATE DATABASE hostpanel OWNER hostpanel;
EOF

systemctl enable postgresql
systemctl start postgresql

# -----------------------------------
# Redis
# -----------------------------------
systemctl enable redis-server
systemctl start redis-server

# -----------------------------------
# Deploy app
# -----------------------------------
mkdir -p /opt
cd /opt

if [ ! -d "panel" ]; then
  git clone https://github.com/breachrabbit/breachrabbit-web-panel.git panel
fi

cd panel

npm install

cat > .env <<EOF
DATABASE_URL="postgresql://hostpanel:StrongPanelPass123!@localhost:5432/hostpanel"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_URL="https://$PANEL_DOMAIN"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
SERVER_ROOT="/var/www"
EOF

npx prisma generate
npx prisma migrate deploy

npm run build

# -----------------------------------
# PM2
# -----------------------------------
npm install -g pm2

pm2 start npm --name breach-panel -- start
pm2 startup systemd -u root --hp /root
pm2 save

# -----------------------------------
# Nginx
# -----------------------------------
cat > /etc/nginx/sites-available/panel <<EOF
server {
    listen 80;
    server_name $PANEL_DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/panel /etc/nginx/sites-enabled/panel
nginx -t
systemctl restart nginx

# -----------------------------------
# SSL
# -----------------------------------
certbot --nginx -d $PANEL_DOMAIN \
  --non-interactive --agree-tos \
  -m $SSL_EMAIL \
  --redirect

# -----------------------------------
# Firewall
# -----------------------------------
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo ""
echo "✅ Installation complete!"
echo "====================================="
echo "🌍 https://$PANEL_DOMAIN"
echo ""
echo "App directory: /opt/panel"
echo "PM2 logs: pm2 logs breach-panel"
