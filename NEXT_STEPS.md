# 🚀 Next Steps - Breach Rabbit HostPanel Pro

## ✅ Что уже сделано

### Foundation (Completed)
- ✅ Next.js 14 project structure
- ✅ Prisma schema with complete database models
- ✅ TypeScript configuration
- ✅ Tailwind CSS + shadcn/ui setup
- ✅ Dark theme with custom design system
- ✅ Base UI components (Button, Card, Input, Badge, Toast, etc.)
- ✅ Dashboard layout with Sidebar and Header
- ✅ Dashboard main page with stats widgets
- ✅ Sites list page (Priority #1)
- ✅ Databases list page (Priority #2)
- ✅ Utility functions (formatBytes, date helpers, validation, etc.)
- ✅ Redis client with caching helpers
- ✅ React Query provider setup
- ✅ Environment variables template

---

## 📋 Phase 1: Core Functionality (Week 1-2)

### 1. Authentication System

**Files to create:**
- `app/(auth)/login/page.tsx`
- `app/(auth)/register/page.tsx`
- `app/api/auth/[...nextauth]/route.ts`
- `lib/auth.ts`

**Implementation:**
```typescript
// lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
};
```

**Actions:**
1. Install NextAuth: `npm install next-auth bcryptjs @types/bcryptjs`
2. Create login page with form
3. Create API route handler
4. Add middleware for protected routes
5. Create seed script to create admin user

---

### 2. Sites Management API

**Files to create:**
- `app/api/sites/route.ts`
- `app/api/sites/[id]/route.ts`
- `lib/services/site-manager.ts`
- `lib/integrations/ols-api.ts`
- `app/(dashboard)/dashboard/sites/new/page.tsx`

**Implementation:**

```typescript
// lib/integrations/ols-api.ts
import axios from 'axios';

const OLS_API = axios.create({
  baseURL: process.env.OLS_API_URL,
  auth: {
    username: process.env.OLS_API_USER!,
    password: process.env.OLS_API_PASS!,
  },
});

export async function createVirtualHost(domain: string, rootPath: string) {
  const response = await OLS_API.post('/rest/v1/vhosts', {
    vhName: domain,
    vhRoot: rootPath,
    configFile: `/usr/local/lsws/conf/vhosts/${domain}/vhconf.conf`,
    docRoot: rootPath,
  });
  return response.data;
}

export async function deleteVirtualHost(domain: string) {
  await OLS_API.delete(`/rest/v1/vhosts/${domain}`);
}

// lib/services/site-manager.ts
import { prisma } from '@/lib/prisma';
import { createVirtualHost } from '@/lib/integrations/ols-api';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function createWordPressSite({
  domain,
  userId,
  dbName,
  dbUser,
  dbPass,
  adminEmail,
  adminUser,
  adminPass,
}: {
  domain: string;
  userId: string;
  dbName: string;
  dbUser: string;
  dbPass: string;
  adminEmail: string;
  adminUser: string;
  adminPass: string;
}) {
  const rootPath = `/var/www/${domain}`;

  // 1. Create directory
  await execAsync(`mkdir -p ${rootPath}`);
  await execAsync(`chown -R www-data:www-data ${rootPath}`);

  // 2. Create database
  const database = await prisma.database.create({
    data: {
      name: dbName,
      type: 'MARIADB',
      userId,
    },
  });

  await execAsync(`
    mysql -e "CREATE DATABASE ${dbName};"
    mysql -e "CREATE USER '${dbUser}'@'localhost' IDENTIFIED BY '${dbPass}';"
    mysql -e "GRANT ALL PRIVILEGES ON ${dbName}.* TO '${dbUser}'@'localhost';"
    mysql -e "FLUSH PRIVILEGES;"
  `);

  // 3. Install WordPress
  await execAsync(`
    cd ${rootPath} && \
    wp core download --allow-root && \
    wp config create --dbname=${dbName} --dbuser=${dbUser} --dbpass=${dbPass} --allow-root && \
    wp core install --url=https://${domain} --title="${domain}" \
      --admin_user=${adminUser} --admin_password=${adminPass} \
      --admin_email=${adminEmail} --allow-root
  `);

  // 4. Create virtual host in OLS
  await createVirtualHost(domain, rootPath);

  // 5. Create site in database
  const site = await prisma.site.create({
    data: {
      domain,
      userId,
      type: 'WORDPRESS',
      status: 'ACTIVE',
      rootPath,
      phpVersion: '8.2',
      sslEnabled: false, // Will be enabled after SSL setup
    },
  });

  // 6. Link database to site
  await prisma.siteDatabase.create({
    data: {
      siteId: site.id,
      databaseId: database.id,
      isPrimary: true,
    },
  });

  return site;
}

// app/api/sites/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createWordPressSite } from '@/lib/services/site-manager';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sites = await prisma.site.findMany({
    where: { userId: session.user.id },
    include: {
      databases: {
        include: {
          database: true,
        },
      },
    },
  });

  return NextResponse.json(sites);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();

  try {
    const site = await createWordPressSite({
      ...data,
      userId: session.user.id,
    });

    return NextResponse.json(site);
  } catch (error) {
    console.error('Failed to create site:', error);
    return NextResponse.json(
      { error: 'Failed to create site' },
      { status: 500 }
    );
  }
}
```

**Actions:**
1. Implement OLS API integration
2. Create site creation API endpoint
3. Build "New Site" form with WordPress options
4. Add site deletion functionality
5. Add site start/stop controls

---

### 3. SSL Automation

**Files to create:**
- `app/api/ssl/route.ts`
- `app/api/ssl/[domain]/route.ts`
- `lib/services/ssl-manager.ts`
- `lib/integrations/acme-wrapper.ts`
- `app/(dashboard)/dashboard/ssl/page.tsx`

**Implementation:**

```typescript
// lib/integrations/acme-wrapper.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function issueCertificate(domain: string, webroot: string) {
  const email = process.env.ACME_EMAIL;
  
  const { stdout } = await execAsync(`
    ~/.acme.sh/acme.sh --issue \
      -d ${domain} \
      --webroot ${webroot} \
      --email ${email}
  `);

  return {
    certPath: `~/.acme.sh/${domain}/${domain}.cer`,
    keyPath: `~/.acme.sh/${domain}/${domain}.key`,
    chainPath: `~/.acme.sh/${domain}/fullchain.cer`,
  };
}

export async function renewCertificate(domain: string) {
  const { stdout } = await execAsync(`
    ~/.acme.sh/acme.sh --renew -d ${domain}
  `);
  return stdout;
}

// lib/services/ssl-manager.ts
import { prisma } from '@/lib/prisma';
import { issueCertificate } from '@/lib/integrations/acme-wrapper';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function setupSSL(siteId: string) {
  const site = await prisma.site.findUnique({
    where: { id: siteId },
  });

  if (!site) throw new Error('Site not found');

  // Issue certificate
  const { certPath, keyPath, chainPath } = await issueCertificate(
    site.domain,
    site.rootPath
  );

  // Update Nginx config
  const nginxConfig = `
server {
    listen 443 ssl http2;
    server_name ${site.domain};

    ssl_certificate ${certPath};
    ssl_certificate_key ${keyPath};
    ssl_trusted_certificate ${chainPath};

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://127.0.0.1:8088;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name ${site.domain};
    return 301 https://$server_name$request_uri;
}
  `;

  await execAsync(`
    echo '${nginxConfig}' > /etc/nginx/sites-available/${site.domain}
    ln -sf /etc/nginx/sites-available/${site.domain} /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx
  `);

  // Save certificate info
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 90); // Let's Encrypt certs valid for 90 days

  await prisma.sslCertificate.create({
    data: {
      domain: site.domain,
      provider: 'letsencrypt',
      certPath,
      keyPath,
      chainPath,
      issuedAt: new Date(),
      expiresAt,
      autoRenew: true,
      status: 'active',
    },
  });

  // Update site
  await prisma.site.update({
    where: { id: siteId },
    data: {
      sslEnabled: true,
      sslProvider: 'letsencrypt',
      sslExpiry: expiresAt,
      sslAutoRenew: true,
    },
  });
}
```

**Actions:**
1. Implement acme.sh wrapper
2. Create SSL issuance API
3. Add automatic renewal cron job
4. Build SSL certificates overview page
5. Add "Enable SSL" button to sites

---

## 📋 Phase 2: Database & Files (Week 3)

### 4. Database Management

**Files to create:**
- `app/api/databases/route.ts`
- `app/api/databases/[id]/route.ts`
- `app/api/databases/[id]/users/route.ts`
- `lib/services/database-manager.ts`
- `app/(dashboard)/dashboard/databases/new/page.tsx`
- `components/database-manager/adminer-iframe.tsx`

**Actions:**
1. Create database creation API
2. Add database user management
3. Embed Adminer in iframe
4. Add database backup functionality
5. Show database size statistics

---

### 5. File Manager

**Files to create:**
- `app/api/files/route.ts`
- `app/api/files/upload/route.ts`
- `app/api/files/download/route.ts`
- `lib/services/file-manager.ts`
- `app/(dashboard)/dashboard/files/page.tsx`
- `components/file-manager/file-tree.tsx`
- `components/file-manager/file-editor.tsx` (Monaco)

**Key Features:**
- Browse directory structure
- Upload/download files
- Edit files (Monaco Editor)
- CHMOD permissions
- Compress/extract archives
- File search

---

## 📋 Phase 3: Advanced Features (Week 4-5)

### 6. Backup System

**Implementation using Restic:**

```typescript
// lib/services/backup-service.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import { prisma } from '@/lib/prisma';

const execAsync = promisify(exec);

export async function createBackup(siteId: string) {
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    include: { databases: { include: { database: true } } },
  });

  if (!site) throw new Error('Site not found');

  const backupPath = `/var/backups/hostpanel/${site.domain}`;
  const repoPath = `${backupPath}/restic-repo`;

  // Initialize restic repo if not exists
  try {
    await execAsync(`restic -r ${repoPath} init`);
  } catch (error) {
    // Repo might already exist
  }

  // Backup files
  const backup = await prisma.backup.create({
    data: {
      siteId: site.id,
      type: 'FULL',
      status: 'RUNNING',
      storageType: 'local',
      startedAt: new Date(),
    },
  });

  try {
    // Backup site files
    await execAsync(`
      restic -r ${repoPath} backup ${site.rootPath}
    `);

    // Backup databases
    for (const siteDb of site.databases) {
      const dbDumpPath = `${backupPath}/${siteDb.database.name}.sql`;
      await execAsync(`
        mysqldump ${siteDb.database.name} > ${dbDumpPath}
      `);
      await execAsync(`
        restic -r ${repoPath} backup ${dbDumpPath}
      `);
      await execAsync(`rm ${dbDumpPath}`);
    }

    await prisma.backup.update({
      where: { id: backup.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
  } catch (error) {
    await prisma.backup.update({
      where: { id: backup.id },
      data: {
        status: 'FAILED',
        errorMessage: String(error),
        completedAt: new Date(),
      },
    });
    throw error;
  }
}
```

---

### 7. Firewall Management

**Implementation:**

```typescript
// lib/services/firewall-service.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import { prisma } from '@/lib/prisma';

const execAsync = promisify(exec);

export async function addFirewallRule(data: {
  name: string;
  action: 'allow' | 'deny';
  protocol: string;
  port?: string;
  sourceIp?: string;
}) {
  const rule = await prisma.firewallRule.create({
    data: {
      ...data,
      priority: 100,
      isEnabled: true,
    },
  });

  // Apply rule to UFW
  let command = `ufw ${data.action}`;
  
  if (data.sourceIp) {
    command += ` from ${data.sourceIp}`;
  }
  
  if (data.port) {
    command += ` to any port ${data.port}`;
  }
  
  if (data.protocol !== 'all') {
    command += ` proto ${data.protocol}`;
  }

  await execAsync(command);
  
  return rule;
}
```

---

## 📋 Phase 4: Monitoring & Logs (Week 6)

### 8. Server Monitoring

**Setup Prometheus + Node Exporter:**

```bash
# Install node_exporter
wget https://github.com/prometheus/node_exporter/releases/download/v1.7.0/node_exporter-1.7.0.linux-amd64.tar.gz
tar xvfz node_exporter-1.7.0.linux-amd64.tar.gz
sudo cp node_exporter-1.7.0.linux-amd64/node_exporter /usr/local/bin/
sudo useradd -rs /bin/false node_exporter

# Create systemd service
sudo nano /etc/systemd/system/node_exporter.service
```

**Collect metrics via API:**

```typescript
// app/api/monitoring/server/route.ts
import { NextResponse } from 'next/server';
import axios from 'axios';
import { prisma } from '@/lib/prisma';
import os from 'os';

export async function GET() {
  // Get system metrics
  const cpuUsage = os.loadavg()[0] / os.cpus().length * 100;
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  // Get disk usage
  const { stdout } = await execAsync('df -B1 / | tail -1');
  const [, total, used, available] = stdout.split(/\s+/);

  // Save metrics
  await prisma.serverMetric.create({
    data: {
      timestamp: new Date(),
      cpuUsage: cpuUsage,
      cpuCores: os.cpus().length,
      loadAverage: os.loadavg(),
      memoryTotal: BigInt(totalMem),
      memoryUsed: BigInt(usedMem),
      memoryFree: BigInt(freeMem),
      swapTotal: BigInt(0),
      swapUsed: BigInt(0),
      diskTotal: BigInt(total),
      diskUsed: BigInt(used),
      diskFree: BigInt(available),
      networkIn: BigInt(0),
      networkOut: BigInt(0),
    },
  });

  return NextResponse.json({
    cpu: { usage: cpuUsage, cores: os.cpus().length },
    memory: { total: totalMem, used: usedMem, free: freeMem },
    disk: { total, used, available },
  });
}
```

---

## 🎯 Immediate Next Actions (Start Here!)

### This Week:
1. **Set up local development:**
   ```bash
   npm install
   docker-compose up -d  # Start PostgreSQL & Redis
   npx prisma migrate dev
   npm run dev
   ```

2. **Implement Authentication:**
   - Create login page
   - Set up NextAuth
   - Add middleware for protected routes
   - Create seed script for admin user

3. **Test Sites Page:**
   - Visit `/dashboard/sites`
   - Verify layout and styling
   - Plan "New Site" modal/page

4. **Test Databases Page:**
   - Visit `/dashboard/databases`
   - Verify data display
   - Plan "New Database" modal

### Next Week:
5. **Build Sites Creation Flow**
6. **Implement OLS API Integration**
7. **Add SSL Automation**
8. **Database Management APIs**

---

## 📚 Resources

- [Next.js 14 Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [OpenLiteSpeed API Docs](https://openlitespeed.org/kb/api/)
- [Restic Docs](https://restic.readthedocs.io)
- [acme.sh Docs](https://github.com/acmesh-official/acme.sh)

---

## ✅ Progress Tracking

- [ ] Phase 1: Core Functionality
  - [ ] Authentication
  - [ ] Sites Management API
  - [ ] SSL Automation
- [ ] Phase 2: Database & Files
  - [ ] Database Management
  - [ ] File Manager
- [ ] Phase 3: Advanced Features
  - [ ] Backup System
  - [ ] Firewall Management
  - [ ] Cron Manager
- [ ] Phase 4: Monitoring & Logs
  - [ ] Server Monitoring
  - [ ] Logs Viewer
  - [ ] Web Terminal
