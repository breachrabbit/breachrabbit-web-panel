# Breach Rabbit HostPanel Pro

Modern hosting control panel built with Next.js 14, optimized for WordPress sites running on OpenLiteSpeed.

## Features

- 🚀 **Sites Management** - Create and manage WordPress, static, and proxy sites
- 💾 **Database Manager** - Full MySQL/MariaDB and PostgreSQL management
- 🔐 **SSL Automation** - Automatic Let's Encrypt certificate management
- 📁 **File Manager** - Modern web-based file browser and editor
- 🔥 **Firewall Control** - Manage UFW/nftables rules via GUI
- ⏰ **Cron Manager** - Schedule and manage cron jobs
- 📊 **Monitoring** - Real-time server and site metrics
- 📝 **Logs Viewer** - Centralized log management
- 🖥️ **Web Terminal** - Browser-based SSH terminal
- 💾 **Backups** - Automated Restic-based backup system

## Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** components
- **TanStack Query** for data fetching
- **Zustand** for global state

### Backend
- **Next.js API Routes**
- **Prisma** ORM
- **PostgreSQL** database
- **Redis** for caching
- **JWT** authentication

### Server Services
- **OpenLiteSpeed** web server
- **Nginx** reverse proxy
- **MariaDB/PostgreSQL** databases
- **Restic** backups
- **acme.sh** SSL management
- **UFW** firewall

## Prerequisites

- **Node.js** 20.x or higher
- **PostgreSQL** 14+ running locally or via Docker
- **Redis** 7+ running locally or via Docker
- **OpenLiteSpeed** 1.7+ (for production server)

## Quick Start

### 1. Clone the repository

\`\`\`bash
git clone <repository-url>
cd breachrabbit-hostpanel-pro
\`\`\`

### 2. Install dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Setup environment variables

\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env` and configure:

\`\`\`env
# Database
DATABASE_URL="postgresql://hostpanel:password@localhost:5432/hostpanel"

# Redis
REDIS_URL="redis://localhost:6379"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# OpenLiteSpeed API (configure later)
OLS_API_URL="http://localhost:7080"
OLS_API_USER="admin"
OLS_API_PASS="your-admin-password"
\`\`\`

### 4. Start PostgreSQL and Redis (via Docker)

\`\`\`bash
# PostgreSQL
docker run -d \
  --name hostpanel-postgres \
  -e POSTGRES_USER=hostpanel \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=hostpanel \
  -p 5432:5432 \
  postgres:16

# Redis
docker run -d \
  --name hostpanel-redis \
  -p 6379:6379 \
  redis:7-alpine
\`\`\`

### 5. Initialize database

\`\`\`bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Open Prisma Studio to view data
npx prisma studio
\`\`\`

### 6. Start development server

\`\`\`bash
npm run dev
\`\`\`

Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

\`\`\`
breachrabbit-hostpanel-pro/
├── app/
│   ├── (auth)/              # Authentication pages
│   ├── (dashboard)/         # Dashboard pages
│   │   ├── dashboard/       # Main dashboard
│   │   ├── sites/          # Sites management
│   │   ├── databases/      # Database management
│   │   ├── files/          # File manager
│   │   ├── ssl/            # SSL certificates
│   │   ├── backups/        # Backup management
│   │   ├── firewall/       # Firewall rules
│   │   ├── cron/           # Cron jobs
│   │   ├── monitoring/     # Server monitoring
│   │   ├── logs/           # Logs viewer
│   │   ├── terminal/       # Web terminal
│   │   └── settings/       # Settings
│   ├── api/                # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── sites/         # Sites API
│   │   ├── databases/     # Databases API
│   │   ├── files/         # Files API
│   │   └── ...            # Other API endpoints
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── sidebar.tsx        # Main sidebar
│   ├── header.tsx         # Header with user menu
│   └── providers.tsx      # React providers
├── lib/
│   ├── services/          # Business logic
│   ├── integrations/      # External API clients
│   ├── prisma.ts          # Prisma client
│   ├── redis.ts           # Redis client
│   └── utils.ts           # Utility functions
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Database migrations
├── hooks/                 # Custom React hooks
├── .env.example          # Environment variables template
├── next.config.js        # Next.js configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies
\`\`\`

## Development Workflow

### 1. Database Changes

When modifying the Prisma schema:

\`\`\`bash
# Create a new migration
npx prisma migrate dev --name description-of-changes

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
\`\`\`

### 2. API Development

API routes are in `app/api/`:

\`\`\`typescript
// app/api/sites/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const sites = await prisma.site.findMany();
  return NextResponse.json(sites);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const site = await prisma.site.create({ data });
  return NextResponse.json(site);
}
\`\`\`

### 3. Adding New Pages

Pages use Next.js App Router:

\`\`\`typescript
// app/(dashboard)/dashboard/new-page/page.tsx
export default function NewPage() {
  return (
    <div>
      <h1>New Page</h1>
    </div>
  );
}
\`\`\`

### 4. Using React Query for Data Fetching

\`\`\`typescript
"use client";
import { useQuery } from '@tanstack/react-query';

export default function SitesPage() {
  const { data: sites, isLoading } = useQuery({
    queryKey: ['sites'],
    queryFn: async () => {
      const res = await fetch('/api/sites');
      return res.json();
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {sites?.map(site => (
        <div key={site.id}>{site.domain}</div>
      ))}
    </div>
  );
}
\`\`\`

## Production Deployment

### Server Setup

1. **Install Dependencies**

\`\`\`bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Redis
sudo apt install -y redis-server

# Install OpenLiteSpeed
wget -O - http://rpms.litespeedtech.com/debian/enable_lst_debian_repo.sh | sudo bash
sudo apt update
sudo apt install -y openlitespeed lsphp82

# Install Nginx
sudo apt install -y nginx

# Install Restic
sudo apt install -y restic

# Install acme.sh
curl https://get.acme.sh | sh
\`\`\`

2. **Deploy Application**

\`\`\`bash
# Clone repository
cd /opt
sudo git clone <repository-url> panel
cd panel

# Install dependencies
npm install

# Build application
npm run build

# Install PM2
sudo npm install -g pm2

# Start application
pm2 start npm --name "hostpanel" -- start

# Setup PM2 to start on boot
pm2 startup
pm2 save
\`\`\`

3. **Configure Nginx Reverse Proxy**

\`\`\`nginx
# /etc/nginx/sites-available/hostpanel
server {
    listen 80;
    server_name panel.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
\`\`\`

Enable the site:

\`\`\`bash
sudo ln -s /etc/nginx/sites-available/hostpanel /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
\`\`\`

4. **Setup SSL**

\`\`\`bash
sudo certbot --nginx -d panel.example.com
\`\`\`

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `NEXTAUTH_URL` | Application URL | `https://panel.example.com` |
| `NEXTAUTH_SECRET` | JWT secret (32+ characters) | Generated with `openssl rand -base64 32` |
| `OLS_API_URL` | OpenLiteSpeed API URL | `http://localhost:7080` |
| `OLS_API_USER` | OLS admin username | `admin` |
| `OLS_API_PASS` | OLS admin password | `secure-password` |
| `SERVER_ROOT` | Web root directory | `/var/www` |
| `BACKUP_ROOT` | Backups directory | `/var/backups/hostpanel` |
| `ACME_EMAIL` | Email for SSL certificates | `admin@example.com` |

## Troubleshooting

### Database Connection Issues

\`\`\`bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U hostpanel -h localhost -d hostpanel
\`\`\`

### Redis Connection Issues

\`\`\`bash
# Check Redis is running
sudo systemctl status redis

# Test connection
redis-cli ping
\`\`\`

### Port Already in Use

\`\`\`bash
# Find process using port 3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: <repository-url>/issues
- Documentation: <docs-url>
