# 🚀 Quick Start Guide - Breach Rabbit HostPanel Pro

## ⚡ Fastest Way to Get Started

### 1️⃣ Download & Extract

```bash
# Extract archive
tar -xzf breachrabbit-hostpanel-pro.tar.gz
cd breachrabbit-hostpanel-pro
```

### 2️⃣ Run Auto-Installer

```bash
chmod +x install.sh
sudo ./install.sh
```

**⏱️ Takes 10-15 minutes**

### 3️⃣ Access Panel

After installation:

```
🌍 URL: http://YOUR_SERVER_IP:3000
📧 Email: admin@breachrabbit.pro
🔑 Password: admin123
```

**Done! 🎉**

---

## 📋 What Gets Installed

### Software Stack
- ✅ PHP 8.3 + 8.4
- ✅ OpenLiteSpeed 1.8
- ✅ Nginx 1.28
- ✅ MariaDB 11.4
- ✅ PostgreSQL 16
- ✅ Redis 7
- ✅ Node.js 20
- ✅ WP-CLI

### Panel Components
- ✅ Next.js application
- ✅ Database schema
- ✅ Admin user
- ✅ PM2 process manager

---

## 🔧 Post-Installation

### 1. Change Passwords

```bash
# Panel admin password
# Login to panel → Settings → Change Password

# PostgreSQL
sudo -u postgres psql
ALTER USER br_admin WITH PASSWORD 'new_secure_password';

# MariaDB
mysql -u root -p
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';

# OpenLiteSpeed Admin
/usr/local/lsws/admin/misc/admpass.sh
```

### 2. Configure Domain (Optional)

Update `.env`:
```env
NEXTAUTH_URL="https://panel.yourdomain.com"
NEXT_PUBLIC_APP_URL="https://panel.yourdomain.com"
```

Restart:
```bash
pm2 restart breachrabbit-panel
```

### 3. Setup Nginx Reverse Proxy (Optional)

Create `/etc/nginx/sites-available/panel`:

```nginx
server {
    listen 80;
    server_name panel.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable:
```bash
ln -s /etc/nginx/sites-available/panel /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## 🐛 Troubleshooting

### Panel Won't Start

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs breachrabbit-panel

# Restart
pm2 restart breachrabbit-panel
```

### Database Connection Error

```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Test connection
psql -U br_admin -d breachrabbit -h localhost
```

### Styles Not Loading

```bash
# Clear cache
cd /path/to/project
rm -rf .next
pm2 restart breachrabbit-panel
```

### Can't Login

```bash
# Re-seed admin user
cd /path/to/project
npm run db:seed
```

---

## 📞 Need Help?

1. Check logs: `pm2 logs breachrabbit-panel`
2. Read full docs: `README.md`
3. View changelog: `CHANGELOG.md`

---

## 🎯 Next Steps

After logging in:

1. **Create Your First Site**
   - Dashboard → Sites → New Site
   - Choose WordPress template
   - Configure domain and database

2. **Setup SSL**
   - Dashboard → SSL Certificates
   - Issue Let's Encrypt certificate

3. **Configure Backups**
   - Dashboard → Backups
   - Create schedule

4. **Explore Features**
   - File Manager
   - Database Manager
   - Monitoring
   - Logs

---

**Ready to build something amazing! 🐇**
