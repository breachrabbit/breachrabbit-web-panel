# 🐇 Breach Rabbit HostPanel Pro

Modern hosting control panel built with Next.js 14, optimized for WordPress sites running on OpenLiteSpeed.

## ✨ Features

- 🚀 **Sites Management** - WordPress, static, PHP, and proxy sites
- 💾 **Database Manager** - MySQL/MariaDB and PostgreSQL
- 🔐 **SSL Automation** - Let's Encrypt with auto-renewal
- 📁 **File Manager** - Web-based file browser and editor
- 🔥 **Firewall Control** - UFW/nftables GUI management
- ⏰ **Cron Manager** - Schedule and manage tasks
- 📊 **Monitoring** - Real-time server metrics
- 📝 **Logs Viewer** - Centralized log management
- 👤 **Authentication** - NextAuth with role-based access

## 🔧 Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- TanStack Query

### Backend
- Next.js API Routes
- Prisma ORM
- PostgreSQL 16
- Redis 7

### Server
- OpenLiteSpeed 1.8
- Nginx 1.28
- MariaDB 11.4
- PHP 8.3/8.4
- Restic (backups)
- acme.sh (SSL)

## 📋 Prerequisites

- Ubuntu 22.04 LTS or newer
- Root access
- At least 4GB RAM
- 50GB+ free disk space

## 🚀 Quick Start

### 1. Download Project

```bash
# Clone or download
git clone <repository-url>
cd breachrabbit-hostpanel-pro
```

### 2. Run Installation Script

```bash
chmod +x install.sh
sudo ./install.sh
```

The script will automatically:
- Install all required packages
- Configure PostgreSQL, MariaDB, Redis
- Setup OpenLiteSpeed and Nginx
- Install Node.js and dependencies
- Create database schema
- Seed admin user
- Build and start the application

**⏱️ Installation takes ~10-15 minutes**

### 3. Access Panel

After installation completes:

```
Panel URL: http://YOUR_SERVER_IP:3000
Login: admin@breachrabbit.pro
Password: admin123
```

**⚠️ Change the default password immediately!**

## 🔧 Manual Setup (Development)

If you want to run in development mode:

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
nano .env
```

Required variables:
```env
DATABASE_URL="postgresql://br_admin:password@localhost:5432/breachrabbit"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
```

### 3. Setup Database

```bash
# Start PostgreSQL (if not running)
sudo systemctl start postgresql

# Create database
sudo -u postgres psql -c "CREATE DATABASE breachrabbit;"
sudo -u postgres psql -c "CREATE USER br_admin WITH PASSWORD 'your_password';"

# Grant permissions (PostgreSQL 15+ fix)
sudo -u postgres psql -d breachrabbit -c "ALTER SCHEMA public OWNER TO br_admin;"
sudo -u postgres psql -d breachrabbit -c "GRANT ALL ON SCHEMA public TO br_admin;"

# Push schema
npx prisma db push

# Seed admin user
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000

## 🐛 Known Issues & Fixes

### Issue 1: PostgreSQL Permission Denied

**Problem:** `permission denied for schema public`

**Cause:** PostgreSQL 15+ doesn't grant schema permissions by default

**Fix:**
```bash
sudo -u postgres psql -d breachrabbit -c "ALTER SCHEMA public OWNER TO br_admin;"
sudo -u postgres psql -d breachrabbit -c "GRANT ALL ON SCHEMA public TO br_admin;"
```

### Issue 2: 404 on Root URL

**Problem:** Accessing server IP shows 404

**Cause:** Missing `app/page.tsx`

**Fix:** Already included - redirects to `/dashboard`

### Issue 3: Tailwind Styles Not Loading

**Problem:** Dark background but no component styling

**Fixes Applied:**
1. ✅ `postcss.config.js` created
2. ✅ `tailwind.config.js` content paths expanded
3. ✅ `app/layout.tsx` imports `globals.css`
4. ✅ `globals.css` has correct Tailwind directives

### Issue 4: NextAuth Not Working

**Fixes Applied:**
1. ✅ `lib/auth.ts` - NextAuth configuration
2. ✅ `middleware.ts` - Route protection
3. ✅ `app/api/auth/[...nextauth]/route.ts` - API endpoint
4. ✅ `app/login/page.tsx` - Login page
5. ✅ `prisma/seed.ts` - Admin user creation

## 📁 Project Structure

```
breachrabbit-hostpanel-pro/
├── app/
│   ├── (dashboard)/
│   │   ├── dashboard/          # Main dashboard
│   │   │   ├── sites/         # Sites management
│   │   │   └── databases/     # Database management
│   │   └── layout.tsx         # Dashboard layout
│   ├── login/
│   │   └── page.tsx           # Login page
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/  # NextAuth API
│   ├── globals.css
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Redirect to dashboard
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── sidebar.tsx
│   ├── header.tsx
│   └── providers.tsx
├── lib/
│   ├── auth.ts               # NextAuth config
│   ├── prisma.ts
│   ├── redis.ts
│   └── utils.ts
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Admin user seed
├── middleware.ts             # Route protection
├── install.sh               # Auto installation
└── package.json
```

## 🔐 Security

### Default Credentials

**Change these immediately after installation:**

```
Panel:
  - Email: admin@breachrabbit.pro
  - Password: admin123

OpenLiteSpeed Admin:
  - Username: admin
  - Password: br_ols_admin_2026

PostgreSQL:
  - User: br_admin
  - Password: br_secure_pass_2026

MariaDB:
  - User: root
  - Password: br_mysql_root_2026
```

### Firewall Rules

The installation script configures UFW with:
- Port 22 (SSH)
- Port 80 (HTTP)
- Port 443 (HTTPS)
- Port 3000 (Panel)
- Port 7080 (OLS Admin)

## 📝 Environment Variables

See `.env.example` for all available options.

Required:
```env
DATABASE_URL      # PostgreSQL connection
NEXTAUTH_SECRET   # JWT secret (32+ chars)
```

Optional:
```env
REDIS_URL         # Redis connection
OLS_API_URL       # OpenLiteSpeed API
AEZA_API_KEY      # Aeza API integration
SMTP_*            # Email notifications
TELEGRAM_*        # Telegram notifications
```

## 🚀 Production Deployment

### Using PM2 (Recommended)

```bash
# Build
npm run build

# Start with PM2
pm2 start npm --name "breachrabbit-panel" -- start
pm2 save
pm2 startup
```

### Using systemd

Create `/etc/systemd/system/breachrabbit-panel.service`:

```ini
[Unit]
Description=Breach Rabbit HostPanel Pro
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/breachrabbit-hostpanel-pro
ExecStart=/usr/bin/npm start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
systemctl enable breachrabbit-panel
systemctl start breachrabbit-panel
```

## 🛠️ Development

### Database Changes

```bash
# Make changes to prisma/schema.prisma

# Push to database
npx prisma db push

# Or create migration
npx prisma migrate dev --name description
```

### Add Admin User Manually

```bash
npm run db:seed
```

Or via Prisma Studio:
```bash
npx prisma studio
```

## 📚 Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth Docs](https://next-auth.js.org)
- [OpenLiteSpeed Docs](https://openlitespeed.org/kb/)

## 🐛 Troubleshooting

### Panel Won't Start

```bash
# Check logs
pm2 logs breachrabbit-panel

# Or if running with npm
npm run dev
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U br_admin -d breachrabbit -h localhost
```

### Styles Not Loading

```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

### Port Already in Use

```bash
# Find process on port 3000
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>
```

## 📞 Support

For issues and questions:
- GitHub Issues: [repository-url]/issues
- Documentation: [docs-url]

## 📄 License

MIT License

---

**Made with 🐇 by Breach Rabbit Team**
