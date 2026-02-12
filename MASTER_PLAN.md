# 🚀 Breach Rabbit HostPanel Pro - Мастер План

## 📋 Оглавление
1. [Видение проекта](#видение-проекта)
2. [Архитектура системы](#архитектура-системы)
3. [Схема базы данных](#схема-базы-данных)
4. [API Endpoints](#api-endpoints)
5. [UI/UX Структура](#uiux-структура)
6. [WordPress Оптимизация](#wordpress-оптимизация)
7. [Roadmap & Приоритеты](#roadmap--приоритеты)
8. [Tech Stack](#tech-stack)
9. [Setup & Deployment](#setup--deployment)

---

## 🎯 Видение проекта

### Концепция
**Breach Rabbit HostPanel Pro** — современная панель управления хостингом с фокусом на WordPress, построенная на OpenLiteSpeed + Nginx, с полностью кастомным UI в стиле единой экосистемы.

### Целевая аудитория
- **Фаза 1:** Администратор (ты) — полный контроль над сервером
- **Фаза 2:** Клиенты — упрощенный интерфейс для управления своими сайтами

### Ключевые отличия от конкурентов
✅ Все компоненты в едином стиле (файлы, БД, логи)  
✅ WordPress из коробки с оптимизированными конфигами  
✅ Современный UI/UX (никаких устаревших интерфейсов)  
✅ Все через веб-интерфейс (без SSH для клиентов)  
✅ Интеграция с Aeza API для расширенных возможностей  

---

## 🏗️ Архитектура системы

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Frontend (React)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Admin UI   │  │  Client UI   │  │  Public API  │     │
│  │  (Full ACL)  │  │  (Limited)   │  │  (External)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│              Next.js API Routes (Backend)                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Service Layer                                      │    │
│  │  ├─ SiteManager      ├─ BackupService              │    │
│  │  ├─ SSLManager       ├─ FirewallService            │    │
│  │  ├─ DatabaseManager  ├─ MonitoringService          │    │
│  │  ├─ FileManager      └─ CronService                │    │
│  └────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Integration Layer                                  │    │
│  │  ├─ OLS API Client   (OpenLiteSpeed REST API)      │    │
│  │  ├─ Nginx Config     (File-based management)       │    │
│  │  ├─ Aeza API Client  (VPS management)              │    │
│  │  ├─ Restic Wrapper   (Backup orchestration)        │    │
│  │  └─ ACME.sh Wrapper  (SSL automation)              │    │
│  └────────────────────────────────────────────────────┘    │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                  Data & Cache Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  PostgreSQL  │  │    Redis     │  │  File System │     │
│  │  (Panel DB)  │  │ (Cache/Jobs) │  │  (/var/www)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                   Server Services                           │
│  ┌──────────────────────────────────────────────────┐      │
│  │  OpenLiteSpeed  │  Nginx        │  MariaDB       │      │
│  │  (Web Server)   │  (Proxy/SSL)  │  (Databases)   │      │
│  ├──────────────────────────────────────────────────┤      │
│  │  Restic         │  Fail2ban     │  UFW/nftables  │      │
│  │  (Backups)      │  (Security)   │  (Firewall)    │      │
│  ├──────────────────────────────────────────────────┤      │
│  │  Node Exporter  │  Prometheus   │  Loki          │      │
│  │  (Metrics)      │  (Monitoring) │  (Logs)        │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Поток данных
1. **Пользователь** → Next.js UI → API Route
2. **API Route** → Service Layer (бизнес-логика)
3. **Service** → Integration Layer (OLS API, Nginx, etc)
4. **Integration** → Server Services (реальные изменения)
5. **Результат** → Panel DB (сохранение состояния)
6. **Response** → UI (обновление интерфейса)

---

## 🗄️ Схема базы данных

### PostgreSQL Schema (Prisma)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// USERS & AUTHENTICATION
// ============================================================================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  role          UserRole  @default(CLIENT)
  firstName     String?
  lastName      String?
  avatar        String?
  
  // Settings
  language      String    @default("en")
  timezone      String    @default("UTC")
  theme         String    @default("dark")
  
  // Security
  twoFactorEnabled Boolean @default(false)
  twoFactorSecret  String?
  lastLoginAt      DateTime?
  lastLoginIp      String?
  
  // Relationships
  sites         Site[]
  databases     Database[]
  apiKeys       ApiKey[]
  auditLogs     AuditLog[]
  notifications Notification[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([email])
  @@index([role])
}

enum UserRole {
  ADMIN       // Полный доступ
  CLIENT      // Ограниченный доступ к своим сайтам
  DEVELOPER   // Расширенный доступ (SSH, Git)
}

model ApiKey {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  name        String
  key         String   @unique
  permissions String[] // ["sites.create", "databases.read"]
  
  lastUsedAt  DateTime?
  expiresAt   DateTime?
  isActive    Boolean  @default(true)
  
  createdAt   DateTime @default(now())
  
  @@index([userId])
  @@index([key])
}

// ============================================================================
// SITES MANAGEMENT
// ============================================================================

model Site {
  id            String      @id @default(cuid())
  userId        String
  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Basic Info
  domain        String      @unique
  type          SiteType    @default(WORDPRESS)
  status        SiteStatus  @default(ACTIVE)
  
  // Paths
  rootPath      String      // /var/www/example.com
  
  // PHP Settings (для WordPress/PHP сайтов)
  phpVersion    String?     @default("8.2")
  phpMemoryLimit String?    @default("256M")
  phpMaxExecutionTime Int?  @default(300)
  
  // Proxy Settings (для Docker/Node.js)
  proxyTarget   String?     // http://localhost:3000
  proxyWebsockets Boolean   @default(false)
  
  // WordPress specific
  wpVersion     String?
  wpAutoUpdate  Boolean     @default(true)
  wpPluginsAutoUpdate Boolean @default(false)
  
  // SSL
  sslEnabled    Boolean     @default(true)
  sslProvider   String?     @default("letsencrypt")
  sslExpiry     DateTime?
  sslAutoRenew  Boolean     @default(true)
  sslRenewDays  Int         @default(30)
  
  // Security
  basicAuthEnabled Boolean  @default(false)
  basicAuthUser    String?
  basicAuthPass    String?
  
  // Statistics (cached)
  bandwidth24h     BigInt?    @default(0)
  requests24h      Int?       @default(0)
  avgResponseTime  Float?     @default(0)
  lastCheckedAt    DateTime?
  
  // Relationships
  databases     SiteDatabase[]
  backups       Backup[]
  deployments   Deployment[]
  cronJobs      CronJob[]
  
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  @@index([userId])
  @@index([domain])
  @@index([status])
  @@index([type])
}

enum SiteType {
  WORDPRESS      // WordPress сайт
  STATIC         // Статический HTML/CSS/JS
  PHP            // Обычный PHP сайт
  NODEJS_PROXY   // Node.js через proxy
  DOCKER_PROXY   // Docker контейнер через proxy
  CUSTOM_PROXY   // Любой другой proxy
}

enum SiteStatus {
  ACTIVE         // Работает
  STOPPED        // Остановлен
  SUSPENDED      // Приостановлен (неоплата)
  BUILDING       // Создается
  ERROR          // Ошибка
}

// ============================================================================
// DATABASES
// ============================================================================

model Database {
  id            String       @id @default(cuid())
  userId        String
  user          User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  name          String       @unique
  type          DatabaseType @default(MARIADB)
  charset       String       @default("utf8mb4")
  collation     String       @default("utf8mb4_unicode_ci")
  
  // Size tracking
  sizeBytes     BigInt       @default(0)
  lastSizeCheck DateTime?
  
  // Relationships
  users         DatabaseUser[]
  sites         SiteDatabase[]
  backups       DatabaseBackup[]
  
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  
  @@index([userId])
  @@index([name])
}

enum DatabaseType {
  MARIADB
  POSTGRESQL
  MONGODB
}

model DatabaseUser {
  id            String   @id @default(cuid())
  databaseId    String
  database      Database @relation(fields: [databaseId], references: [id], onDelete: Cascade)
  
  username      String
  passwordHash  String
  host          String   @default("localhost")
  
  permissions   String[] // ["SELECT", "INSERT", "UPDATE", "DELETE", "CREATE", "DROP"]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@unique([databaseId, username, host])
  @@index([databaseId])
}

model SiteDatabase {
  id         String   @id @default(cuid())
  siteId     String
  site       Site     @relation(fields: [siteId], references: [id], onDelete: Cascade)
  databaseId String
  database   Database @relation(fields: [databaseId], references: [id], onDelete: Cascade)
  
  isPrimary  Boolean  @default(false) // Главная БД сайта
  
  createdAt  DateTime @default(now())
  
  @@unique([siteId, databaseId])
  @@index([siteId])
  @@index([databaseId])
}

// ============================================================================
// SSL CERTIFICATES
// ============================================================================

model SslCertificate {
  id            String   @id @default(cuid())
  
  domain        String   @unique
  provider      String   // letsencrypt, zerossl, custom
  
  certPath      String
  keyPath       String
  chainPath     String?
  
  issuedAt      DateTime
  expiresAt     DateTime
  
  autoRenew     Boolean  @default(true)
  renewDays     Int      @default(30)
  lastRenewAt   DateTime?
  
  status        String   @default("active") // active, expiring, expired, error
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([domain])
  @@index([expiresAt])
  @@index([status])
}

// ============================================================================
// BACKUPS
// ============================================================================

model Backup {
  id            String       @id @default(cuid())
  siteId        String?
  site          Site?        @relation(fields: [siteId], references: [id], onDelete: Cascade)
  
  type          BackupType
  status        BackupStatus @default(PENDING)
  
  // Backup details
  sizeBytes     BigInt?
  filePath      String?      // Путь к архиву
  resticId      String?      // ID снимка в Restic
  
  // Storage
  storageType   String       @default("local") // local, s3, ftp
  storageConfig Json?
  
  // Metadata
  filesCount    Int?
  errorMessage  String?
  
  startedAt     DateTime?
  completedAt   DateTime?
  createdAt     DateTime     @default(now())
  
  @@index([siteId])
  @@index([status])
  @@index([createdAt])
}

enum BackupType {
  FULL          // Полный бэкап (файлы + БД)
  FILES         // Только файлы
  DATABASE      // Только БД
  CONFIG        // Только конфиги
}

enum BackupStatus {
  PENDING       // В очереди
  RUNNING       // Выполняется
  COMPLETED     // Завершен успешно
  FAILED        // Ошибка
}

model DatabaseBackup {
  id            String       @id @default(cuid())
  databaseId    String
  database      Database     @relation(fields: [databaseId], references: [id], onDelete: Cascade)
  
  status        BackupStatus @default(PENDING)
  sizeBytes     BigInt?
  filePath      String?
  
  startedAt     DateTime?
  completedAt   DateTime?
  createdAt     DateTime     @default(now())
  
  @@index([databaseId])
  @@index([createdAt])
}

model BackupSchedule {
  id            String   @id @default(cuid())
  
  name          String
  description   String?
  
  // Что бэкапить
  targetType    String   // site, database, server
  targetId      String?  // ID сайта или БД (null для всего сервера)
  
  // Расписание
  cronExpression String  // "0 2 * * *"
  timezone      String   @default("UTC")
  
  // Retention
  keepDaily     Int      @default(7)
  keepWeekly    Int      @default(4)
  keepMonthly   Int      @default(3)
  
  // Storage
  storageType   String   @default("local")
  storageConfig Json?
  
  isEnabled     Boolean  @default(true)
  lastRunAt     DateTime?
  nextRunAt     DateTime?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([isEnabled])
  @@index([nextRunAt])
}

// ============================================================================
// FIREWALL
// ============================================================================

model FirewallRule {
  id            String   @id @default(cuid())
  
  name          String
  description   String?
  
  action        String   // allow, deny, reject
  protocol      String   // tcp, udp, icmp, all
  
  port          String?  // "80" или "1000-2000"
  sourceIp      String?  // IP или CIDR
  destinationIp String?
  
  zone          String?  // public, trusted, docker
  interface     String?  // eth0, docker0
  
  priority      Int      @default(100)
  isEnabled     Boolean  @default(true)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([isEnabled])
  @@index([priority])
}

// ============================================================================
// CRON JOBS
// ============================================================================

model CronJob {
  id            String       @id @default(cuid())
  siteId        String?
  site          Site?        @relation(fields: [siteId], references: [id], onDelete: Cascade)
  
  name          String
  description   String?
  
  command       String
  schedule      String       // Cron expression
  user          String       @default("www-data")
  
  isEnabled     Boolean      @default(true)
  
  lastRunAt     DateTime?
  lastStatus    String?      // success, failed
  lastOutput    String?
  lastError     String?
  
  nextRunAt     DateTime?
  
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  
  @@index([siteId])
  @@index([isEnabled])
  @@index([nextRunAt])
}

// ============================================================================
// DEPLOYMENTS (Git/FTP)
// ============================================================================

model Deployment {
  id            String           @id @default(cuid())
  siteId        String
  site          Site             @relation(fields: [siteId], references: [id], onDelete: Cascade)
  
  type          DeploymentType
  status        DeploymentStatus @default(PENDING)
  
  // Git specific
  gitRepo       String?
  gitBranch     String?          @default("main")
  gitCommit     String?
  
  // Build
  buildCommand  String?
  deployPath    String
  
  // Logs
  buildLog      String?
  errorLog      String?
  
  triggeredBy   String?          // user_id или "webhook"
  
  startedAt     DateTime?
  completedAt   DateTime?
  createdAt     DateTime         @default(now())
  
  @@index([siteId])
  @@index([status])
  @@index([createdAt])
}

enum DeploymentType {
  GIT
  ZIP_UPLOAD
  FTP
  MANUAL
}

enum DeploymentStatus {
  PENDING
  CLONING
  BUILDING
  DEPLOYING
  COMPLETED
  FAILED
}

// ============================================================================
// MONITORING & LOGS
// ============================================================================

model ServerMetric {
  id            String   @id @default(cuid())
  
  timestamp     DateTime @default(now())
  
  // CPU
  cpuUsage      Float
  cpuCores      Int
  loadAverage   Float[]  // [1m, 5m, 15m]
  
  // Memory
  memoryTotal   BigInt
  memoryUsed    BigInt
  memoryFree    BigInt
  swapTotal     BigInt
  swapUsed      BigInt
  
  // Disk
  diskTotal     BigInt
  diskUsed      BigInt
  diskFree      BigInt
  
  // Network
  networkIn     BigInt   // bytes
  networkOut    BigInt
  
  @@index([timestamp])
}

model AuditLog {
  id            String   @id @default(cuid())
  userId        String?
  user          User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  action        String   // site.create, database.delete, etc
  resource      String?  // Тип ресурса
  resourceId    String?  // ID ресурса
  
  details       Json?    // Детали изменений
  
  ipAddress     String?
  userAgent     String?
  
  createdAt     DateTime @default(now())
  
  @@index([userId])
  @@index([action])
  @@index([createdAt])
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

model Notification {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  type          String   // ssl_expiring, backup_failed, disk_full
  title         String
  message       String
  severity      String   @default("info") // info, warning, error, critical
  
  isRead        Boolean  @default(false)
  readAt        DateTime?
  
  metadata      Json?    // Дополнительные данные
  
  createdAt     DateTime @default(now())
  
  @@index([userId])
  @@index([isRead])
  @@index([createdAt])
}

// ============================================================================
// SYSTEM SETTINGS
// ============================================================================

model SystemSetting {
  id            String   @id @default(cuid())
  
  key           String   @unique
  value         Json
  description   String?
  
  updatedAt     DateTime @updatedAt
  
  @@index([key])
}
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/register
POST   /api/auth/refresh
POST   /api/auth/verify-2fa
GET    /api/auth/me
PATCH  /api/auth/me
```

### Sites
```
GET    /api/sites                    # Список сайтов
POST   /api/sites                    # Создать сайт
GET    /api/sites/:id                # Детали сайта
PATCH  /api/sites/:id                # Обновить сайт
DELETE /api/sites/:id                # Удалить сайт
POST   /api/sites/:id/start          # Запустить сайт
POST   /api/sites/:id/stop           # Остановить сайт
GET    /api/sites/:id/stats          # Статистика сайта
GET    /api/sites/:id/logs           # Логи сайта
```

### SSL
```
GET    /api/ssl                      # Список сертификатов
POST   /api/ssl/issue                # Выпустить сертификат
POST   /api/ssl/:id/renew            # Обновить сертификат
DELETE /api/ssl/:id                  # Удалить сертификат
GET    /api/ssl/expiring             # Истекающие сертификаты
```

### Databases
```
GET    /api/databases                # Список БД
POST   /api/databases                # Создать БД
GET    /api/databases/:id            # Детали БД
DELETE /api/databases/:id            # Удалить БД
GET    /api/databases/:id/users      # Пользователи БД
POST   /api/databases/:id/users      # Создать пользователя
PATCH  /api/databases/:id/users/:uid # Изменить пароль
DELETE /api/databases/:id/users/:uid # Удалить пользователя
```

### Files
```
GET    /api/files                    # Список файлов/папок
POST   /api/files/upload             # Загрузить файл
GET    /api/files/download           # Скачать файл
POST   /api/files/mkdir              # Создать папку
POST   /api/files/rename             # Переименовать
POST   /api/files/move               # Переместить
DELETE /api/files                    # Удалить
POST   /api/files/chmod              # Изменить права
POST   /api/files/extract            # Распаковать архив
POST   /api/files/compress           # Создать архив
GET    /api/files/read               # Прочитать файл (редактор)
PUT    /api/files/save               # Сохранить файл
POST   /api/files/search             # Поиск файлов
```

### Backups
```
GET    /api/backups                  # Список бэкапов
POST   /api/backups                  # Создать бэкап
GET    /api/backups/:id              # Детали бэкапа
DELETE /api/backups/:id              # Удалить бэкап
POST   /api/backups/:id/restore      # Восстановить
GET    /api/backups/schedules        # Расписания
POST   /api/backups/schedules        # Создать расписание
PATCH  /api/backups/schedules/:id    # Обновить
DELETE /api/backups/schedules/:id    # Удалить
```

### Firewall
```
GET    /api/firewall/rules           # Список правил
POST   /api/firewall/rules           # Создать правило
PATCH  /api/firewall/rules/:id       # Обновить правило
DELETE /api/firewall/rules/:id       # Удалить правило
POST   /api/firewall/rules/:id/toggle # Включить/выключить
GET    /api/firewall/zones           # Зоны безопасности
```

### Cron
```
GET    /api/cron                     # Список задач
POST   /api/cron                     # Создать задачу
GET    /api/cron/:id                 # Детали задачи
PATCH  /api/cron/:id                 # Обновить задачу
DELETE /api/cron/:id                 # Удалить задачу
POST   /api/cron/:id/run             # Запустить вручную
```

### Monitoring
```
GET    /api/monitoring/server        # Метрики сервера
GET    /api/monitoring/sites         # Метрики сайтов
GET    /api/monitoring/alerts        # Активные алерты
```

### Logs
```
GET    /api/logs/:type               # Получить логи (ols, nginx, php, system)
POST   /api/logs/search              # Поиск в логах
GET    /api/logs/stream              # WebSocket стрим
```

### Terminal
```
POST   /api/terminal/create          # Создать сессию
WS     /api/terminal/:sessionId      # WebSocket для I/O
DELETE /api/terminal/:sessionId      # Закрыть сессию
```

### System
```
GET    /api/system/info              # Информация о сервере
GET    /api/system/services          # Статус сервисов
POST   /api/system/services/:name/restart
GET    /api/system/updates           # Доступные обновления
POST   /api/system/updates/install
```

---

## 🎨 UI/UX Структура

### Design System

**Цветовая схема (Dark Theme по умолчанию):**
```css
:root {
  --bg-primary: #0a0a0a;
  --bg-secondary: #141414;
  --bg-tertiary: #1a1a1a;
  
  --border: #2a2a2a;
  --border-hover: #3a3a3a;
  
  --text-primary: #ffffff;
  --text-secondary: #a0a0a0;
  --text-muted: #6a6a6a;
  
  --accent: #3b82f6;      /* Blue */
  --accent-hover: #2563eb;
  
  --success: #10b981;     /* Green */
  --warning: #f59e0b;     /* Orange */
  --error: #ef4444;       /* Red */
  
  --wordpress: #21759b;   /* WordPress blue */
}
```

**Typography:**
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Headings */
h1: 32px / 700
h2: 24px / 600
h3: 20px / 600
h4: 18px / 600

/* Body */
body: 14px / 400
small: 12px / 400
```

**Components:**
- **shadcn/ui** как база
- Кастомизация под наш дизайн
- Все компоненты в едином стиле

### Основные экраны

#### 1. Dashboard (Главная)
```
┌─────────────────────────────────────────────────────────┐
│  🏠 Dashboard                         [Profile] [Theme]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ CPU Usage   │  │ Memory      │  │ Disk Space  │    │
│  │   45%       │  │   12.4/16GB │  │   85/250GB  │    │
│  │   [Chart]   │  │   [Chart]   │  │   [Chart]   │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 🌐 Sites Overview (5 active)                     │  │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│  │
│  │  ✅ blog.example.com    │ 🔒 SSL: 45 days       │  │
│  │  ✅ shop.example.com    │ 🔒 SSL: 12 days ⚠️    │  │
│  │  ✅ api.example.com     │ 🔒 SSL: 89 days       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌───────────────┐  ┌──────────────────────────────┐  │
│  │ 🔔 Alerts (2) │  │ 📊 Traffic (24h)             │  │
│  │ • SSL expiring│  │   [Traffic Chart]            │  │
│  │ • Backup fail │  │                               │  │
│  └───────────────┘  └──────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### 2. Sites List
```
┌─────────────────────────────────────────────────────────┐
│  🌐 Sites                    [+ New Site]  [Filter] [⚙️] │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 🟢 blog.example.com                  [WordPress]  │  │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│  │
│  │ 🔒 SSL: 45 days  │  PHP 8.2  │  256MB RAM        │  │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│  │
│  │ 📊 1,234 req/24h │ 45.2 MB traffic │ 125ms avg  │  │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│  │
│  │ [Open] [Files] [Database] [Logs] [Settings] [...] │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 🟢 app.example.com              [Docker Proxy]    │  │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│  │
│  │ 🔒 SSL: 60 days  │  → localhost:3000             │  │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│  │
│  │ 📊 856 req/24h │ 12.8 MB traffic │ 45ms avg     │  │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│  │
│  │ [Open] [Logs] [Settings] [...]                   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### 3. File Manager
```
┌─────────────────────────────────────────────────────────┐
│  📁 Files  /var/www/blog.example.com                    │
├───────────────┬─────────────────────────────────────────┤
│ 📂 wp-admin   │  ┌─────────────────────────────────────┐│
│ 📂 wp-content │  │ Name           Size      Modified   ││
│ 📂 wp-includes│  ├─────────────────────────────────────┤│
│ 📄 index.php  │  │ 📄 index.php   2.4 KB   12 Feb 2026 ││
│ 📄 wp-config  │  │ 📄 wp-config   5.1 KB   10 Feb 2026 ││
│               │  │ 📂 wp-admin      -      05 Feb 2026 ││
│ [Upload] [+]  │  │ 📂 wp-content    -      12 Feb 2026 ││
│               │  └─────────────────────────────────────┘│
│               │                                          │
│               │  [Select] [Download] [Delete] [Rename]  │
│               │  [CHMOD] [Edit] [Compress]              │
└───────────────┴─────────────────────────────────────────┘
```

#### 4. Database Manager (Adminer style)
```
┌─────────────────────────────────────────────────────────┐
│  💾 Database: blog_wp                                   │
├─────────────────────────────────────────────────────────┤
│  Tables (12)          │  Query                          │
│  ━━━━━━━━━━━━━━━━━━━│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│  📋 wp_posts          │  SELECT * FROM wp_posts         │
│  📋 wp_postmeta       │  WHERE post_status = 'publish'  │
│  📋 wp_users          │  LIMIT 10;                      │
│  📋 wp_usermeta       │                                 │
│  📋 wp_terms          │  [Run Query] [Save] [Format]   │
│                        │                                 │
│  [+ New Table]        │  ┌─────────────────────────────┐│
│  [Import]             │  │ Results (10 rows)           ││
│  [Export]             │  │                             ││
│                        │  │ [Table View]                ││
│                        │  └─────────────────────────────┘│
└───────────────────────┴─────────────────────────────────┘
```

---

## ⚡ WordPress Оптимизация

### OLS конфиг для WordPress

**Template: `/usr/local/lsws/conf/vhosts/wordpress.conf`**
```apache
docRoot                   $VH_ROOT/public_html
enableGzip                1
enableBrCompress          1

index  {
  useServer               0
  indexFiles              index.php, index.html
}

errorlog $VH_ROOT/logs/error.log {
  useServer               0
  logLevel                ERROR
  rollingSize             10M
}

accesslog $VH_ROOT/logs/access.log {
  useServer               0
  logFormat               "%h %l %u %t \"%r\" %>s %b"
  logHeaders              5
  rollingSize             10M
  keepDays                30
}

scripthandler  {
  add lsapi:lsphp82 php
}

extprocessor lsphp82 {
  type                    lsapi
  address                 uds://tmp/lshttpd/lsphp.sock
  maxConns                35
  env                     PHP_LSAPI_CHILDREN=35
  initTimeout             60
  retryTimeout            0
  persistConn             1
  pcKeepAliveTimeout      1
  respBuffer              0
  autoStart               1
  path                    /usr/local/lsws/lsphp82/bin/lsphp
  backlog                 100
  instances               1
  priority                0
  memSoftLimit            2047M
  memHardLimit            2047M
  procSoftLimit           1400
  procHardLimit           1500
}

rewrite  {
  enable                  1
  autoLoadHtaccess        1
}

# WordPress Rewrite Rules
rewrite  {
RewriteFile .htaccess
}

# Cache Settings for WordPress
expires  {
  enableExpires           1
  expiresDefault          A604800
  expiresByType           image/*=A2592000, text/css=A604800, application/x-javascript=A2592000
}

# Security
context /xmlrpc.php {
  allowBrowse             0
  note                    Disable xmlrpc.php
}

context /wp-admin/ {
  location                $DOC_ROOT/wp-admin/
  allowBrowse             1
  rewrite  {
    enable                1
  }
}

# Static file caching
context exp:^.*(css|js|gif|png|jpg|jpeg|webp|svg|woff|woff2|ttf|eot|ico)$ {
  location                $DOC_ROOT/$0
  allowBrowse             1
  enableExpires           1
  expiresDefault          A604800
  extraHeaders            <<<END_rules
Cache-Control: public, max-age=604800
END_rules
}
```

### PHP 8.2 конфиг для WordPress

**Template: `/usr/local/lsws/lsphp82/etc/php/8.2/litespeed/php.ini`**
```ini
[PHP]
engine = On
short_open_tag = Off
precision = 14
output_buffering = 4096
zlib.output_compression = Off
implicit_flush = Off
serialize_precision = -1

; Resource Limits (WordPress optimized)
max_execution_time = 300
max_input_time = 300
max_input_vars = 5000
memory_limit = 256M
post_max_size = 256M
upload_max_filesize = 256M

; Error handling
error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT
display_errors = Off
display_startup_errors = Off
log_errors = On
error_log = /var/log/php82-error.log

; WordPress specific
allow_url_fopen = On
allow_url_include = Off

; OPcache (критично для производительности)
[opcache]
opcache.enable = 1
opcache.enable_cli = 0
opcache.memory_consumption = 256
opcache.interned_strings_buffer = 16
opcache.max_accelerated_files = 10000
opcache.max_wasted_percentage = 5
opcache.use_cwd = 1
opcache.validate_timestamps = 1
opcache.revalidate_freq = 2
opcache.fast_shutdown = 1

; WordPress object caching
opcache.save_comments = 1
opcache.enable_file_override = 0

; Session
session.save_handler = files
session.save_path = "/var/lib/php/sessions"
session.use_strict_mode = 1
session.cookie_httponly = 1
session.cookie_samesite = "Lax"
session.gc_maxlifetime = 1440

; File uploads
file_uploads = On
upload_tmp_dir = /tmp

; Date
date.timezone = UTC

; Security
disable_functions = exec,passthru,shell_exec,system,proc_open,popen,curl_exec,curl_multi_exec,parse_ini_file,show_source
expose_php = Off
```

### Nginx конфиг для WordPress

**Template: `/etc/nginx/sites-available/wordpress.conf`**
```nginx
# Fastcgi cache для WordPress
fastcgi_cache_path /var/cache/nginx/wordpress levels=1:2 keys_zone=WORDPRESS:100m inactive=60m;
fastcgi_cache_key "$scheme$request_method$host$request_uri";

server {
    listen 443 ssl http2;
    server_name example.com www.example.com;
    root /var/www/example.com;
    index index.php index.html;

    # SSL Configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Logging
    access_log /var/www/example.com/logs/access.log;
    error_log /var/www/example.com/logs/error.log;

    # Proxy to OpenLiteSpeed
    location / {
        proxy_pass http://127.0.0.1:8088;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Fastcgi cache
        proxy_cache WORDPRESS;
        proxy_cache_valid 200 60m;
        proxy_cache_bypass $cookie_wordpress_logged_in;
        proxy_no_cache $cookie_wordpress_logged_in;
        
        add_header X-Cache-Status $upstream_cache_status;
    }

    # Deny access to sensitive files
    location ~ /\.(?!well-known).* {
        deny all;
    }

    location ~ /wp-config\.php {
        deny all;
    }

    location = /xmlrpc.php {
        deny all;
    }

    # Static files
    location ~* \.(css|js|gif|png|jpg|jpeg|webp|svg|woff|woff2|ttf|eot|ico)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
}

# Redirect www to non-www
server {
    listen 443 ssl http2;
    server_name www.example.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    return 301 https://example.com$request_uri;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name example.com www.example.com;
    return 301 https://example.com$request_uri;
}
```

### WordPress CLI автоматизация

```bash
#!/bin/bash
# /opt/panel/scripts/wordpress-setup.sh

DOMAIN=$1
DB_NAME=$2
DB_USER=$3
DB_PASS=$4
ADMIN_EMAIL=$5
ADMIN_USER=$6
ADMIN_PASS=$7

WP_PATH="/var/www/${DOMAIN}"

# Download WordPress
wp core download --path="${WP_PATH}" --allow-root

# Create wp-config.php
wp config create \
  --dbname="${DB_NAME}" \
  --dbuser="${DB_USER}" \
  --dbpass="${DB_PASS}" \
  --dbhost="localhost" \
  --path="${WP_PATH}" \
  --allow-root

# Install WordPress
wp core install \
  --url="https://${DOMAIN}" \
  --title="${DOMAIN}" \
  --admin_user="${ADMIN_USER}" \
  --admin_password="${ADMIN_PASS}" \
  --admin_email="${ADMIN_EMAIL}" \
  --path="${WP_PATH}" \
  --allow-root

# Security improvements
wp config shuffle-salts --path="${WP_PATH}" --allow-root

# Install essential plugins
wp plugin install \
  wp-super-cache \
  wordfence \
  updraftplus \
  --activate \
  --path="${WP_PATH}" \
  --allow-root

# Set permissions
chown -R www-data:www-data "${WP_PATH}"
find "${WP_PATH}" -type d -exec chmod 755 {} \;
find "${WP_PATH}" -type f -exec chmod 644 {} \;

echo "WordPress installed successfully at ${WP_PATH}"
```

---

## 📅 Roadmap & Приоритеты

### Phase 1: MVP (4-6 недель) - Базовый функционал

**Week 1-2: Foundation**
- [x] Настройка Next.js проекта
- [x] Prisma схема и миграции
- [x] Базовая аутентификация (JWT)
- [x] UI компоненты (shadcn/ui настройка)
- [x] Layout и навигация

**Week 3-4: Core Features**
- [x] Sites Management
  - Создание сайта (WordPress template)
  - Список сайтов
  - Старт/стоп сайта
  - Удаление сайта
- [x] SSL Management
  - Автоматический выпуск (acme.sh)
  - Мониторинг срока действия
  - Автообновление
- [x] File Manager (базовый)
  - Просмотр файлов
  - Upload/Download
  - Редактирование текстовых файлов

**Week 5-6: Essential Tools**
- [x] Database Management
  - Создание/удаление БД
  - Управление пользователями
  - Интегрированный SQL клиент
- [x] Backups (базовый)
  - Ручное создание бэкапа
  - Восстановление
- [x] Dashboard
  - Системные метрики
  - Список сайтов
  - SSL статус

### Phase 2: Enhanced Features (3-4 недели)

**Week 7-8:**
- [x] Advanced File Manager
  - CHMOD
  - Архивация/разархивация
  - Поиск файлов
  - Batch операции
- [x] Firewall GUI
  - Управление правилами
  - IP whitelist/blacklist
  - Зоны безопасности
- [x] Cron Manager
  - Создание задач
  - Логи выполнения

**Week 9-10:**
- [x] Monitoring & Alerts
  - Real-time метрики (Prometheus)
  - Алерты (SSL, disk space, etc)
  - Уведомления (email/telegram)
- [x] Logs Viewer
  - Централизованные логи
  - Поиск и фильтрация
  - Live tail
- [x] Terminal (xterm.js)

### Phase 3: Advanced Features (4-5 недель)

**Week 11-12:**
- [x] Docker Proxy Support
  - Создание proxy для контейнеров
  - WebSocket поддержка
- [x] Git Deployment
  - Auto-deploy from Git
  - Build процессы
- [x] Multi-site Management
  - Bulk операции
  - Templates

**Week 13-15:**
- [x] Analytics
  - Traffic анализ
  - Performance metrics
  - WordPress specific stats
- [x] Security Center
  - Malware scanner
  - Fail2ban интеграция
  - Audit logs
- [x] API для внешних интеграций

### Phase 4: Client Portal (3-4 недели)

**Week 16-18:**
- [x] Client Role & Permissions
  - RBAC система
  - Ограниченный доступ
- [x] Client Dashboard
  - Только свои сайты
  - Упрощенный интерфейс
- [x] Billing (опционально)
  - Тарифы
  - История платежей

### Phase 5: Polish & Optimization (ongoing)

- [x] Performance optimization
- [x] Mobile responsive
- [x] Localization (i18n)
- [x] Documentation
- [x] Tests (E2E, unit)

---

## 🛠️ Tech Stack

### Frontend
```json
{
  "framework": "Next.js 14 (App Router)",
  "language": "TypeScript",
  "styling": "Tailwind CSS",
  "components": "shadcn/ui",
  "state": "Zustand + TanStack Query",
  "forms": "React Hook Form + Zod",
  "charts": "Recharts",
  "terminal": "xterm.js",
  "editor": "Monaco Editor (VS Code)"
}
```

### Backend
```json
{
  "framework": "Next.js API Routes",
  "language": "TypeScript",
  "orm": "Prisma",
  "validation": "Zod",
  "auth": "NextAuth.js + JWT",
  "jobs": "BullMQ (Redis)",
  "websockets": "Socket.io"
}
```

### Database & Cache
```json
{
  "primary": "PostgreSQL 16",
  "cache": "Redis 7",
  "orm": "Prisma"
}
```

### Server Services
```json
{
  "webServer": "OpenLiteSpeed 1.7+",
  "proxy": "Nginx 1.24+",
  "database": "MariaDB 10.11+",
  "php": "PHP 8.2 (LSAPI)",
  "backup": "Restic",
  "ssl": "acme.sh",
  "monitoring": "Prometheus + Node Exporter",
  "logs": "Loki",
  "firewall": "UFW (nftables)"
}
```

### DevOps
```json
{
  "containerization": "Docker + Docker Compose",
  "deployment": "PM2 (для Next.js)",
  "ci": "GitHub Actions",
  "monitoring": "Grafana (optional)"
}
```

---

## 🚀 Setup & Deployment

### Server Requirements

**Minimum:**
- OS: Ubuntu 22.04 LTS
- CPU: 2 cores
- RAM: 4 GB
- Disk: 50 GB SSD
- Network: 100 Mbps

**Recommended:**
- OS: Ubuntu 22.04 LTS
- CPU: 4+ cores
- RAM: 8+ GB
- Disk: 100+ GB NVMe
- Network: 1 Gbps

### Installation Script

```bash
#!/bin/bash
# install.sh

set -e

echo "🚀 Breach Rabbit HostPanel Pro Installation"
echo "=============================="

# Update system
apt update && apt upgrade -y

# Install dependencies
apt install -y curl git wget nano ufw fail2ban

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PostgreSQL
apt install -y postgresql postgresql-contrib
systemctl enable postgresql
systemctl start postgresql

# Install Redis
apt install -y redis-server
systemctl enable redis-server
systemctl start redis-server

# Install OpenLiteSpeed
wget -O - http://rpms.litespeedtech.com/debian/enable_lst_debian_repo.sh | bash
apt update
apt install -y openlitespeed lsphp82 lsphp82-common lsphp82-mysql lsphp82-opcache

# Install Nginx
apt install -y nginx
systemctl enable nginx

# Install MariaDB
apt install -y mariadb-server
mysql_secure_installation

# Install Restic
wget https://github.com/restic/restic/releases/download/v0.16.0/restic_0.16.0_linux_amd64.bz2
bzip2 -d restic_0.16.0_linux_amd64.bz2
chmod +x restic_0.16.0_linux_amd64
mv restic_0.16.0_linux_amd64 /usr/local/bin/restic

# Install acme.sh
curl https://get.acme.sh | sh
~/.acme.sh/acme.sh --upgrade --auto-upgrade

# Install WP-CLI
curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
chmod +x wp-cli.phar
mv wp-cli.phar /usr/local/bin/wp

# Setup firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Clone panel
cd /opt
git clone https://github.com/yourusername/breachrabbit-hostpanel-pro.git panel
cd panel

# Install dependencies
npm install

# Setup environment
cp .env.example .env
nano .env  # Edit configuration

# Setup database
npx prisma migrate deploy
npx prisma generate

# Build application
npm run build

# Install PM2
npm install -g pm2
pm2 start npm --name "hostpanel" -- start
pm2 startup
pm2 save

echo "✅ Installation complete!"
echo "Panel URL: http://your-server-ip:3000"
echo "Default credentials will be sent to your email"
```

### Environment Variables

```env
# .env

# Database
DATABASE_URL="postgresql://panel:password@localhost:5432/hostpanel"

# Redis
REDIS_URL="redis://localhost:6379"

# NextAuth
NEXTAUTH_URL="https://panel.example.com"
NEXTAUTH_SECRET="generate-random-secret-here"

# OpenLiteSpeed
OLS_API_URL="http://localhost:7080"
OLS_API_USER="admin"
OLS_API_PASS="your-admin-password"

# Aeza API
AEZA_API_KEY="your-aeza-api-key"
AEZA_API_URL="https://api.aeza.net/v1"

# Server paths
SERVER_ROOT="/var/www"
BACKUP_ROOT="/var/backups/panel"

# SSL
ACME_EMAIL="admin@example.com"

# Monitoring
PROMETHEUS_URL="http://localhost:9090"

# Notifications
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_CHAT_ID="your-chat-id"
```

---

## 📦 Project Structure

```
/opt/panel/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── sites/
│   │   ├── databases/
│   │   ├── files/
│   │   ├── backups/
│   │   ├── firewall/
│   │   ├── cron/
│   │   ├── monitoring/
│   │   ├── logs/
│   │   ├── terminal/
│   │   └── settings/
│   ├── api/                      # API Routes
│   │   ├── auth/
│   │   ├── sites/
│   │   ├── databases/
│   │   ├── files/
│   │   ├── ssl/
│   │   ├── backups/
│   │   ├── firewall/
│   │   ├── cron/
│   │   ├── monitoring/
│   │   ├── logs/
│   │   ├── terminal/
│   │   └── system/
│   └── layout.tsx
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── dashboard/
│   ├── sites/
│   ├── file-manager/
│   ├── database-manager/
│   └── terminal/
├── lib/
│   ├── services/                 # Business logic
│   │   ├── site-manager.ts
│   │   ├── ssl-manager.ts
│   │   ├── database-manager.ts
│   │   ├── file-manager.ts
│   │   ├── backup-service.ts
│   │   └── monitoring-service.ts
│   ├── integrations/             # External APIs
│   │   ├── ols-api.ts
│   │   ├── nginx-manager.ts
│   │   ├── aeza-api.ts
│   │   ├── restic-wrapper.ts
│   │   └── acme-wrapper.ts
│   ├── prisma.ts
│   ├── redis.ts
│   └── utils.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── scripts/
│   ├── wordpress-setup.sh
│   ├── site-create.sh
│   └── backup-restore.sh
├── public/
├── .env
├── .env.example
├── next.config.js
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

---

## 🎯 Next Steps

1. **Setup Development Environment**
   ```bash
   # Clone repo
   git clone https://github.com/yourusername/breachrabbit-hostpanel-pro.git
   cd breachrabbit-hostpanel-pro
   
   # Install dependencies
   npm install
   
   # Setup database
   docker-compose up -d postgres redis
   npx prisma migrate dev
   
   # Start development
   npm run dev
   ```

2. **Create Initial Components**
   - Dashboard layout
   - Navigation sidebar
   - Auth pages
   - Sites list page

3. **Implement Core Services**
   - OLS API integration
   - Site creation flow
   - SSL automation
   - File manager backend

4. **Testing**
   - Unit tests for services
   - E2E tests for critical flows
   - Manual testing

---

**Готов начинать?** Что делаем первым делом? 🚀
