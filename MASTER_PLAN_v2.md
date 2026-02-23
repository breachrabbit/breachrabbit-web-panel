# 🚀 HostPanel Pro — Мастер План v2.0

> **Статус:** В разработке | **Версия стека:** Next.js 16.1 + Node.js 20.x LTS  
> **Последнее обновление:** Февраль 2026

---

## 📋 Оглавление

1. [Видение проекта](#видение-проекта)
2. [Tech Stack](#tech-stack)
3. [Архитектура системы](#архитектура-системы)
4. [Схема базы данных](#схема-базы-данных)
5. [Модули и функционал](#модули-и-функционал)
6. [UI/UX Design System](#uiux-design-system)
7. [API Endpoints](#api-endpoints)
8. [Roadmap & Приоритеты](#roadmap--приоритеты)
9. [Setup & Deployment](#setup--deployment)
10. [Структура проекта](#структура-проекта)
11. [Документация](#документация)

---

## 🎯 Видение проекта

### Концепция
**HostPanel Pro** — современная панель управления хостингом с фокусом на WordPress, построенная на OpenLiteSpeed + Nginx, с полностью кастомным UI в стиле единой экосистемы. Отличается встроенным красивым инсталлятором, WP Toolkit, полным управлением через браузер.

### Версии продукта

#### v1.0 — Single VPS (текущая разработка)
**Аудитория:** Один администратор, один личный VPS  
**Scope:** Полный контроль над сервером через браузер, без SSH  
**GitHub README:** Пишется после выхода стабильной v1.0

#### v2.0 — Multi-VPS + Client Portal (следующий этап)
**Аудитория:** Хостинг-провайдеры, реселлеры  
**Scope:**
- Подключение и управление **удалёнными VPS** через панель (аналог RunCloud)
- **Client Portal** — страница клиента с ограниченным доступом к своим сайтам
- **Управление доменами и DNS** через интерфейс
- **Wildcard SSL** и кастомные сертификаты расширенный менеджмент

### Ключевые отличия от конкурентов
- Все компоненты в едином стиле (файлы, БД, логи, мониторинг)
- WordPress-first: WP Toolkit из коробки
- Встроенный браузерный инсталлятор с live-терминалом
- Терминал прямо в панели (xterm.js + node-pty)
- Бэкапы в стиле Zerobyte (Restic под капотом)
- Современный UI — никаких устаревших интерфейсов
- Все через браузер, без SSH для клиентов

---

## 🛠️ Tech Stack

### Frontend
```json
{
  "framework": "Next.js 16.1 (App Router)",
  "language": "TypeScript 5.3+",
  "runtime": "Node.js 20.x LTS (минимум 20.9.0)",
  "styling": "Tailwind CSS 4.x (CSS-first config)",
  "theme": "HostPanel UI — собственная тема (см. раздел Design System)",
  "components": "Собственная библиотека поверх Radix UI primitives (без shadcn overhead)",
  "icons": "Lucide React (легкий, tree-shakeable)",
  "state": "Zustand + TanStack Query v5",
  "forms": "React Hook Form + Zod",
  "charts": "Recharts (только нужные компоненты)",
  "terminal": "xterm.js 5.x + xterm-addon-fit + xterm-addon-web-links",
  "editor": "Monaco Editor (lazy loaded)",
  "animations": "CSS transitions + Framer Motion только там где реально нужно"
}
```

### Backend
```json
{
  "framework": "Next.js 16.1 API Routes (App Router)",
  "language": "TypeScript 5.3+",
  "orm": "Prisma 5.x",
  "validation": "Zod",
  "auth": "NextAuth.js v5 (Auth.js) + JWT",
  "jobs": "BullMQ (Redis)",
  "websockets": "Socket.io 4.x",
  "terminal_pty": "node-pty 1.x"
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
  "webServer": "OpenLiteSpeed 1.8+",
  "proxy": "Nginx 1.25+",
  "database": "MariaDB 10.11+",
  "php": "PHP 8.2 / 8.3 / 8.4 / 8.5 (LSAPI)",
  "backup": "Restic 0.16+",
  "ssl": "acme.sh",
  "monitoring": "Prometheus + Node Exporter",
  "logs": "Loki",
  "firewall": "UFW (nftables)"
}
```

### DevOps
```json
{
  "process": "PM2 (для Next.js)",
  "containers": "Docker + Docker Compose (опционально)",
  "ci": "GitHub Actions",
  "dashboard_extra": "Grafana (опционально)"
}
```

### Критические изменения Next.js 16 vs 14
- Node.js **минимум 20.9.0** — Node 18 не поддерживается
- TypeScript **минимум 5.1.0**
- `params` в layout/page — только **async**
- `cache()` — новая модель кэширования (opt-in)
- Turbopack — дефолтный бандлер (5-10x быстрее)
- React Compiler — встроенная автоматическая мемоизация (stable)
- `proxy.ts` вместо части Middleware

---

## 🏗️ Архитектура системы

```
┌─────────────────────────────────────────────────────────────┐
│                  Next.js 16.1 Frontend                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Admin UI   │  │  Client UI   │  │  Installer UI    │  │
│  │  (Full ACL)  │  │  (Limited)   │  │  (Onboarding)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│            Next.js 16.1 API Routes (App Router)             │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Service Layer                                      │    │
│  │  ├─ SiteManager        ├─ BackupService (Restic)   │    │
│  │  ├─ SSLManager         ├─ FirewallService (UFW)    │    │
│  │  ├─ DatabaseManager    ├─ MonitoringService        │    │
│  │  ├─ FileManager        ├─ CronService              │    │
│  │  ├─ WPToolkit          └─ InstallerService         │    │
│  └────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Integration Layer                                  │    │
│  │  ├─ OLS API Client     (Full REST API coverage)    │    │
│  │  ├─ Nginx Config       (File-based management)     │    │
│  │  ├─ Restic Wrapper     (Backup orchestration)      │    │
│  │  ├─ UFW Wrapper        (Firewall rules)            │    │
│  │  ├─ ACME.sh Wrapper    (SSL automation)            │    │
│  │  └─ WP-CLI Wrapper     (WordPress automation)      │    │
│  └────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Realtime Layer (Socket.io)                        │    │
│  │  ├─ Terminal Sessions  (node-pty → xterm.js)       │    │
│  │  ├─ Log Streaming      (live tail)                 │    │
│  │  ├─ Metrics Push       (server stats)              │    │
│  │  └─ Installer Progress (setup steps)               │    │
│  └────────────────────────────────────────────────────┘    │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                  Data & Cache Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  PostgreSQL  │  │    Redis     │  │   File System    │  │
│  │  (Panel DB)  │  │ (Cache/Jobs/ │  │   (/var/www)     │  │
│  │              │  │  BullMQ)     │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                   Server Services                           │
│  OpenLiteSpeed │ Nginx │ MariaDB │ PHP 8.2/8.3             │
│  Restic │ Fail2ban │ UFW │ acme.sh                         │
│  Node Exporter │ Prometheus │ Loki                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Схема базы данных

### (см. предыдущую версию schema.prisma — актуальна, обновления минимальны)

Добавляемые модели:

```prisma
// Installer sessions
model InstallerSession {
  id            String   @id @default(cuid())
  token         String   @unique  // one-time setup token
  completed     Boolean  @default(false)
  config        Json?    // сохраненная конфигурация
  createdAt     DateTime @default(now())
  completedAt   DateTime?
}

// WP Toolkit — WordPress instances
model WordPressInstance {
  id            String   @id @default(cuid())
  siteId        String
  site          Site     @relation(fields: [siteId], references: [id], onDelete: Cascade)
  
  version       String
  adminUser     String
  adminEmail    String
  language      String   @default("en_US")
  
  autoUpdateCore    Boolean @default(true)
  autoUpdatePlugins Boolean @default(false)
  autoUpdateThemes  Boolean @default(false)
  
  lastScanAt    DateTime?
  securityScore Int?
  
  plugins       WPPlugin[]
  themes        WPTheme[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model WPPlugin {
  id          String            @id @default(cuid())
  wpId        String
  wp          WordPressInstance @relation(fields: [wpId], references: [id], onDelete: Cascade)
  
  slug        String
  name        String
  version     String
  latestVersion String?
  status      String  // active, inactive, update_available
  
  updatedAt   DateTime @updatedAt
}

model WPTheme {
  id          String            @id @default(cuid())
  wpId        String
  wp          WordPressInstance @relation(fields: [wpId], references: [id], onDelete: Cascade)
  
  slug        String
  name        String
  version     String
  latestVersion String?
  isActive    Boolean @default(false)
  
  updatedAt   DateTime @updatedAt
}

// Restic backup snapshots
model ResticSnapshot {
  id            String   @id @default(cuid())
  snapshotId    String   @unique  // restic snapshot ID
  backupId      String?
  backup        Backup?  @relation(fields: [backupId], references: [id])
  
  hostname      String
  paths         String[]
  tags          String[]
  sizeBytes     BigInt?
  
  snapshotTime  DateTime
  createdAt     DateTime @default(now())
}
```

---

## 📦 Модули и функционал

### 1. 🔧 Браузерный Инсталлятор

Запускается при первом входе (токен из `.env`). Красивый wizard в браузере.

**Фаза 0 — Автоматическая (до wizard):**
Перед показом UI инсталлятор тихо выполняет в фоне:
- `apt update && apt upgrade -y`
- Установка базовых пакетов: `curl git wget nano ufw fail2ban htop unzip`
- Определение железа (CPU cores, RAM, Disk, тип диска SSD/HDD/NVMe)
- Расчёт оптимальных настроек под конкретное железо
- Подготовка конфигурационных шаблонов

**Шаги wizard:**
1. **Добро пожаловать** — логотип, описание панели
2. **Анализ железа** — красивая карточка с характеристиками сервера:
   - CPU: количество ядер, модель
   - RAM: объём
   - Disk: тип (NVMe/SSD/HDD), свободное место
   - OS: Ubuntu версия
   - Рекомендуемый профиль: "Оптимизировано под WordPress"
   - Предпросмотр ключевых настроек (swap, PHP workers, MySQL buffers)
3. **Системные зависимости** — live установка с прогрессом:
   - OpenLiteSpeed + lsphp 8.2/8.3/8.4
   - Nginx
   - MariaDB
   - PostgreSQL (для панели)
   - Redis
   - Restic, acme.sh, WP-CLI
4. **Настройка БД панели** — PostgreSQL credentials, тест подключения
5. **Администратор** — email, пароль, имя
6. **Настройки сервера** — домен панели, порты, email для SSL
7. **OLS интеграция** — URL, логин/пароль OLS WebAdmin
8. **Опциональные сервисы** — Telegram bot, SMTP
9. **Применение оптимальных настроек** — автоматически под железо:
   - SWAP (если RAM < 8GB — создать, размер = RAM)
   - PHP (workers, memory_limit, opcache по RAM/CPU)
   - MariaDB (innodb_buffer_pool, max_connections по RAM)
   - OLS (max_connections, keep-alive по CPU)
   - UFW базовые правила
10. **Опция: Установить WordPress** — прямо из инсталлятора:
    - Домен
    - БД: название, пользователь, пароль
    - Admin WP: логин, пароль, email
    - Язык (выбор из списка)
    - Всё создаётся автоматически
11. **Готово** — ссылка на панель, сводка настроек

**Логика расчёта оптимальных настроек:**

```
RAM 1-2 GB:
  swap = 2GB
  php_memory_limit = 128M
  php_workers = 2
  innodb_buffer_pool = 256M
  max_connections = 50

RAM 2-4 GB:
  swap = 4GB
  php_memory_limit = 256M
  php_workers = 4
  innodb_buffer_pool = 512M
  max_connections = 100

RAM 4-8 GB:
  swap = 4GB
  php_memory_limit = 256M
  php_workers = 8
  innodb_buffer_pool = 1G
  max_connections = 150

RAM 8-16 GB:
  swap = 2GB (только если нет)
  php_memory_limit = 512M
  php_workers = CPU_CORES * 3
  innodb_buffer_pool = RAM * 0.5
  max_connections = 200

RAM 16+ GB:
  swap = 0 (не нужен)
  php_memory_limit = 512M
  php_workers = CPU_CORES * 4
  innodb_buffer_pool = RAM * 0.6
  max_connections = 300
```

**Особенности UI:**
- Левая часть: красивый прогресс с шагами (чекбоксы с анимацией)
- Правая часть: встроенный live-терминал (xterm.js) — видны все команды в реальном времени
- Анимации через Framer Motion
- Нельзя закрыть/перезагрузить во время установки (beforeunload guard)
- Карточка железа с иконками и цветными метриками

---

### 2. 🌐 Управление сайтами

- Создание: WordPress, Static, PHP, Node.js proxy, Docker proxy
- Старт/стоп/перезапуск
- Статистика: запросы, трафик, время ответа
- Управление PHP версией (8.1 / 8.2 / 8.3)
- Basic Auth
- Редиректы и алиасы
- Графики трафика/запросов **по каждому конкретному сайту**
  - Запросы в час/день/неделю
  - Трафик (входящий/исходящий)
  - Время ответа (avg/p95/p99)
  - HTTP статус-коды (200/301/404/500)
  - Топ URL по запросам
  - Топ IP по запросам

---

### 3. 🔒 SSL Manager

**Автоматические сертификаты:**
- Автовыпуск через acme.sh (Let's Encrypt / ZeroSSL)
- Wildcard сертификаты (DNS challenge)
- Автообновление (cron acme.sh)
- Мониторинг сроков (предупреждение за 30/14/7 дней)

**🔑 Кастомные (купленные) сертификаты — ПРИОРИТЕТ v1.0:**
- Загрузка через UI: Certificate (.crt/.pem), Private Key (.key), CA Bundle (chain)
- Валидация перед сохранением (совпадение ключа и сертификата, срок действия, домен)
- Привязка к домену / vhost
- Просмотр деталей: issuer, subject, SANs, срок, алгоритм
- Предупреждение что сертификат не будет автообновляться (reminder за 30 дней)
- Смешанный режим: один домен на auto-SSL, другой на custom — без конфликтов

**Общее:**
- Список всех сертификатов (auto + custom) в едином UI
- Статусы: active / expiring / expired / pending
- Принудительная замена сертификата одной кнопкой

---

### 4. 📁 Файловый менеджер

**Панель с двумя колонками** (дерево + содержимое):
- Просмотр файлов и директорий
- Upload (drag & drop, множественный)
- Download (файл / zip папки)
- Создание файла / папки
- Переименование
- Перемещение (drag & drop + cut/paste)
- Удаление (с корзиной)
- CHMOD (визуальный редактор прав)
- Архивация (.zip, .tar.gz)
- Распаковка
- Поиск файлов
- Batch операции (выбор нескольких)
- **Monaco Editor** для редактирования текстовых файлов
  - Синтаксис: PHP, JS, CSS, HTML, YAML, JSON, .conf
  - Поиск и замена
  - Форматирование
- Превью изображений
- Показ размера директорий

---

### 5. 💾 Менеджер баз данных

- Создание/удаление БД (MariaDB / PostgreSQL)
- Управление пользователями (права, пароли)
- Привязка БД к сайту
- **Встроенный SQL клиент** (аналог Adminer):
  - Таблицы с навигацией
  - SQL редактор с подсветкой
  - Экспорт результатов (CSV, JSON)
  - Просмотр структуры таблицы
- Импорт SQL дампа
- Экспорт SQL дампа
- Размер БД

---

### 6. 💻 Терминал

- **xterm.js 5.x** — полноценный терминал в браузере
- **node-pty** — псевдотерминал на сервере
- Socket.io для передачи I/O
- Несколько вкладок терминала
- Изменение размера (resize)
- Цветовые темы (dark/light)
- Буфер прокрутки
- Копирование/вставка
- Поиск в буфере
- Переход к директории сайта одной кнопкой
- Сессии сохраняются при смене страницы (background)

---

### 7. 💿 Бэкапы (Restic GUI — стиль Zerobyte)

**Основные возможности:**
- Полный бэкап (файлы + БД)
- Инкрементальный бэкап (только изменения)
- Ручной запуск одной кнопкой
- Расписания (cron-based)
- Retention политики (7 дней / 4 недели / 3 месяца)

**Хранилища:**
- Локальное (/var/backups)
- S3 / S3-compatible (MinIO, Wasabi, etc)
- SFTP
- B2 (Backblaze)

**Восстановление:**
- Список снимков с деревом файлов
- Восстановление отдельных файлов/папок
- Полное восстановление сайта
- Восстановление БД отдельно

**UI в стиле Zerobyte:**
- Шкала использования пространства бэкапов
- Timeline снимков
- Детальный прогресс-бар во время бэкапа
- Estimated time remaining
- Лог последних операций

---

### 8. 🔥 Firewall (UFW GUI)

- Список активных правил
- Создание правила: allow/deny, порт/диапазон, протокол, IP/CIDR
- Быстрые профили: "Только веб", "Только SSH", "Разрешить всё"
- IP whitelist / blacklist
- Fail2ban интеграция:
  - Список заблокированных IP
  - Ручная разблокировка
  - Статистика попыток
- Включение/выключение UFW
- Экстренный сброс (unlock все)
- Текущее состояние в реальном времени

---

### 9. ⏰ Cron менеджер

- Список всех задач
- Визуальный редактор расписания (человекочитаемый: "каждый день в 3:00")
- Создание задачи с командой и пользователем
- Привязка к сайту (опционально)
- Логи последних запусков (stdout/stderr)
- Ручной запуск задачи
- Включение/выключение
- Следующее время выполнения

---

### 10. 📊 Мониторинг и логи

**Сервер:**
- CPU (usage, load average, cores)
- RAM (total/used/free, swap)
- Disk (I/O, usage по каждому разделу)
- Network (in/out трафик, pps)
- Процессы (топ-10 по CPU/RAM)

**Сайты:**
- График запросов в разрезе каждого сайта
- Статус-коды ответов
- Время ответа
- Пропускная способность

**Логи:**
- Централизованный просмотр: OLS access/error, Nginx, PHP, System
- Цветная подсветка уровней (ERROR, WARN, INFO)
- Фильтрация по уровню/дате/паттерну
- **Live tail** (WebSocket стриминг)
- Поиск по логам (grep-like)
- Скачивание лог-файлов

**Алерты:**
- SSL истекает
- Диск заполнен (>80%, >90%, >95%)
- Высокая нагрузка CPU
- Бэкап не выполнился
- Сайт недоступен
- Каналы: Email, Telegram

---

### 11. 🔌 OpenLiteSpeed API — Полное покрытие

Полная интеграция со всеми endpoints OLS WebAdmin REST API:

**Виртуальные хосты:**
- Список, создание, редактирование, удаление vhosts
- Клонирование vhost (template)
- Включение/выключение

**Listeners:**
- HTTP / HTTPS listeners
- Привязка к vhosts
- SSL настройки

**PHP / LSAPI:**
- Управление версиями PHP (8.1, 8.2, 8.3)
- Конфигурация php.ini через UI
- OPcache статистика и сброс
- PHP workers управление

**Кэш (LSCache):**
- Включение/выключение LSCache
- Сброс кэша (per site / global)
- Статистика попаданий в кэш
- Конфигурация правил кэширования

**WebAdmin:**
- Перезапуск OLS
- Graceful restart
- Reload конфигурации
- Статус сервисов

**Логи OLS:**
- Access log per vhost
- Error log per vhost
- Уровень логирования

---

### 12. 🔧 WP Toolkit

**Установка WordPress:**
- Выбор версии (последняя / конкретная)
- Язык (список всех доступных)
- БД: создание новой / выбор существующей
- Admin: логин, пароль, email
- Опции: HTTPS, WWW/без WWW
- Одна кнопка → автоматическая установка через WP-CLI

**Управление установленным WordPress:**
- Версия ядра + кнопка обновления
- Таблица плагинов:
  - Название, версия, статус (active/inactive/update)
  - Активация/деактивация/удаление
  - Массовое обновление
- Таблица тем (аналогично)
- Обновление ядра (one click)
- Настройки автообновлений

**Безопасность:**
- Смена Admin URL (`/wp-admin`)
- Отключение XML-RPC
- Защита `wp-config.php`
- Скрытие версии WordPress
- Принудительный HTTPS

**Инструменты:**
- Сброс пароля admin
- Режим обслуживания (maintenance mode)
- Очистка транзиентов (transients)
- Регенерация `salts`
- Клонирование сайта

---

### 13. ⚙️ Страница настроек (PHP / MariaDB / OLS)

Централизованная страница управления конфигурациями сервисов.

#### PHP Settings
**Версии:** 8.2 / 8.3 / 8.4 / 8.5 (устанавливаются по запросу)

- Переключение дефолтной версии PHP для новых сайтов
- Per-site версия PHP (каждый сайт на своей версии)
- Редактор `php.ini` с UI-формами (не сырой текст):
  - `memory_limit`
  - `max_execution_time` / `max_input_time`
  - `upload_max_filesize` / `post_max_size`
  - `max_input_vars`
  - `display_errors` / `error_reporting`
  - `date.timezone`
- **OPcache настройки:**
  - enable/disable
  - `opcache.memory_consumption`
  - `opcache.max_accelerated_files`
  - `opcache.revalidate_freq`
  - Статистика hit rate + кнопка сброса
- **PHP Extensions:**
  - Список установленных
  - Включение/выключение (imagick, redis, memcached, gd, etc)
  - Установка новых через UI
- PHP Workers (LSAPI): количество, таймауты
- Применение настроек без перезапуска сервера (graceful)

#### MariaDB Settings
- Версия MariaDB (текущая + доступные)
- Редактор `my.cnf` с UI-формами:
  - **InnoDB:**
    - `innodb_buffer_pool_size` (с подсказкой: "рекомендуется 50-70% RAM")
    - `innodb_buffer_pool_instances`
    - `innodb_log_file_size`
    - `innodb_flush_log_at_trx_commit`
    - `innodb_flush_method`
  - **Connections:**
    - `max_connections`
    - `wait_timeout` / `interactive_timeout`
    - `connect_timeout`
  - **Query Cache:**
    - `query_cache_type` / `query_cache_size`
    - `tmp_table_size` / `max_heap_table_size`
  - **Logs:**
    - Slow query log (enable, `long_query_time`)
    - Error log уровень
- Статус сервера: uptime, connections, queries/sec
- Slow query log viewer прямо в UI
- Кнопка "Применить рекомендуемые настройки под железо"
- Перезапуск MariaDB из UI

#### OpenLiteSpeed Settings
- Версия OLS (текущая)
- **Performance:**
  - `maxConnections`
  - `maxSSLConnections`
  - `connTimeout` / `maxKeepAliveReq`
  - `smartKeepAlive`
  - `keepAliveTimeout`
  - `sndBufSize` / `rcvBufSize`
- **GZIP / Brotli:**
  - Включение/выключение
  - Уровень сжатия
  - MIME типы для сжатия
- **Cache (LSCache global):**
  - Default TTL
  - Stale cache settings
  - Исключения
- **Security:**
  - Hide server signature
  - `maxReqURLLen` / `maxReqHeaderSize` / `maxReqBodySize`
  - reCAPTCHA интеграция (для DDoS защиты)
- **Logging:**
  - Уровень логирования (DEBUG/INFO/ERROR)
  - Rolling size
- Restart / Graceful Restart / Reload конфига из UI

#### SWAP Manager
- Текущий размер swap и использование
- Создание/удаление swap файла
- Изменение `vm.swappiness`
- Рекомендация по размеру исходя из RAM

#### Системные лимиты
- `ulimit` настройки (open files, processes)
- `sysctl` параметры (net.core.somaxconn, vm.overcommit_memory)
- Применение с сохранением в `/etc/sysctl.conf`

---

### 14. 📖 Документация

Встроенная документация прямо в панели.

**Разделы:**
- Быстрый старт
- Создание первого сайта
- WordPress: установка и управление
- Файловый менеджер: как работать
- Бэкапы: настройка и восстановление
- SSL: автоматический и ручной
- Терминал: основные команды
- Firewall: безопасная настройка
- Cron: примеры задач
- Мониторинг: метрики и алерты
- API: использование внешних интеграций
- FAQ и устранение неполадок

**Особенности:**
- MDX-файлы (Markdown с компонентами)
- Поиск по документации
- Примеры с копированием кода
- Ссылки на внешние ресурсы (OLS docs, WP docs)

---

## 🎨 UI/UX Design System — HostPanel UI

### Философия
**Собственная тема с нуля.** Никакого NextAdmin, никакого тяжёлого shadcn bundle.  
Цель: быстрый первый paint, минимум JS в runtime, максимум через CSS.

**Принципы:**
- CSS-first: анимации, переходы, hover-эффекты — через CSS, не JS
- Tree-shaking везде: импортируем только то что используем
- Radix UI primitives — только для accessibility (dropdown, dialog, tooltip) без стилей
- Lucide icons — SVG inline, tree-shakeable
- Monaco и xterm — строго lazy-loaded (не попадают в initial bundle)
- Нет тяжёлых UI-библиотек целиком (no MUI, no Ant, no full shadcn)

### Бандл-стратегия
```
Initial bundle (цель < 150KB gzip):
  ├── Next.js runtime         ~40KB
  ├── React                   ~45KB
  ├── Zustand                  ~3KB
  ├── HostPanel UI theme       ~25KB  (все базовые компоненты)
  ├── Lucide (tree-shaken)     ~8KB
  └── TanStack Query           ~15KB

Lazy loaded (только когда нужно):
  ├── Monaco Editor           ~2MB   (только на странице редактора)
  ├── xterm.js                ~300KB (только страница терминала)
  ├── Recharts                ~150KB (только страницы с графиками)
  └── Framer Motion           ~50KB  (только инсталлятор)
```

### Цветовая схема

```css
/* globals.css — Tailwind CSS 4 CSS-first approach */
@theme {
  /* Backgrounds */
  --color-bg-base:      #080808;
  --color-bg-surface:   #101010;
  --color-bg-elevated:  #181818;
  --color-bg-overlay:   #202020;
  
  /* Borders */
  --color-border:       rgba(255,255,255,0.07);
  --color-border-hover: rgba(255,255,255,0.12);
  --color-border-focus: rgba(255,255,255,0.20);
  
  /* Text */
  --color-text-primary:   #f0f0f0;
  --color-text-secondary: #888888;
  --color-text-muted:     #444444;
  --color-text-inverse:   #080808;
  
  /* Accent — Blue */
  --color-accent:         #3b82f6;
  --color-accent-hover:   #2563eb;
  --color-accent-subtle:  rgba(59,130,246,0.10);
  --color-accent-border:  rgba(59,130,246,0.30);
  
  /* Status */
  --color-success:        #10b981;
  --color-success-subtle: rgba(16,185,129,0.10);
  --color-warning:        #f59e0b;
  --color-warning-subtle: rgba(245,158,11,0.10);
  --color-error:          #ef4444;
  --color-error-subtle:   rgba(239,68,68,0.10);
  --color-info:           #6366f1;
  --color-info-subtle:    rgba(99,102,241,0.10);
  
  /* Special */
  --color-wordpress:      #21759b;
  --color-terminal-green: #00d46a;
  --color-terminal-bg:    #0a0a0a;
  
  /* Sizing */
  --sidebar-width:        240px;
  --header-height:        56px;
  --radius-sm:            6px;
  --radius-md:            10px;
  --radius-lg:            14px;
  --radius-xl:            20px;
}
```

### Typography

```css
/* System font stack — ноль сетевых запросов */
--font-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;

/* Шрифт загружается через next/font/google с display:swap */
/* Inter Variable — один файл вместо множества начертаний */
```

### Layout структура

```
┌─────────────────────────────────────────────────────┐
│  Header (56px) — лого, поиск, уведомления, профиль  │
├──────────────┬──────────────────────────────────────┤
│              │                                       │
│  Sidebar     │  Main Content                         │
│  (240px)     │  (fluid)                              │
│              │                                       │
│  nav items   │  ┌─────────────────────────────────┐ │
│  с иконками  │  │  Page Header (title + actions)  │ │
│              │  ├─────────────────────────────────┤ │
│  collapsed   │  │                                 │ │
│  → 56px      │  │  Content                        │ │
│  (иконки)    │  │                                 │ │
│              │  └─────────────────────────────────┘ │
└──────────────┴──────────────────────────────────────┘
```

### Компоненты HostPanel UI

Все компоненты — в `/components/ui/` — собственные, легкие:

**Layout:**
- `AppShell` — обёртка sidebar + header + content
- `Sidebar` — навигация, collapsible, active states
- `Header` — топ-бар с поиском и уведомлениями
- `PageHeader` — заголовок страницы + actions
- `Card` — базовая карточка (border, radius, bg-surface)
- `Section` — секция с заголовком внутри страницы

**Data Display:**
- `StatusBadge` — online/offline/warning/error с dot
- `MetricCard` — число + иконка + delta + мини-спарклайн
- `StatRow` — строка: label + value (для таблиц настроек)
- `ProgressBar` — анимированный, с лейблом и процентом
- `UsageBar` — disk/RAM с цветом по порогу (зелёный→жёлтый→красный)
- `Timeline` — вертикальный таймлайн (для бэкапов, логов)
- `Table` — таблица с сортировкой, sticky header
- `EmptyState` — иконка + текст + CTA когда нет данных

**Inputs:**
- `Button` — primary / secondary / ghost / danger, sizes sm/md/lg
- `Input` — с иконкой слева/справа, error state
- `Select` — на Radix, кастомные стили
- `Toggle` — switch для enable/disable
- `Checkbox` — с indeterminate state
- `CodeInput` — моноширинный инпут (для паролей, команд)
- `FileDropzone` — drag & drop загрузка файлов
- `SegmentedControl` — таб-переключатель (замена radio)

**Feedback:**
- `Toast` — уведомления (success/error/info), автоскрытие
- `Modal` — диалог на Radix Dialog
- `ConfirmDialog` — "Вы уверены?" с деструктивной кнопкой
- `Tooltip` — на Radix Tooltip, без JS overhead
- `AlertBanner` — предупреждения вверху страницы
- `Skeleton` — loading placeholder (CSS animation)
- `Spinner` — лёгкий CSS spinner

**Специальные:**
- `SiteCard` — карточка сайта (статус, домен, SSL, метрики)
- `TerminalWindow` — xterm.js wrapper с header-строкой
- `CodeEditor` — Monaco wrapper (lazy)
- `FileTree` — дерево файлов (рекурсивное)
- `BackupCard` — карточка снимка Restic
- `ChartCard` — Recharts wrapper с заголовком и легендой
- `HardwareCard` — карточка сервера (CPU/RAM/Disk)
- `InstallerStep` — шаг wizard с иконкой + статусом

### Визуальный стиль

```
Карточки:        тонкая граница rgba(255,255,255,0.07) + radius 10px
                 bg-surface (#101010), нет тени (shadow-free)
                 hover: border становится чуть светлее (CSS transition)

Кнопки:          Primary — solid accent blue, radius 8px
                 Ghost — прозрачный фон, border при hover
                 Danger — красный только при hover/focus (не кричит)

Sidebar:         bg-base (#080808), items с radius 6px
                 Active: accent-subtle bg + accent text
                 Hover: overlay bg

Таблицы:         полосатые строки через odd/even
                 hover строки — лёгкое highlight
                 sticky header с bg-surface

Статус-точки:    пульсирующая CSS анимация для "online"
                 статичная для offline/warning

Переходы:        150ms ease для hover
                 200ms ease для modal/dropdown появления
                 Нет тяжёлых spring-анимаций в обычном UI
```

---

## 🔌 API Endpoints

### Auth
```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me
PATCH  /api/auth/me
POST   /api/auth/verify-2fa
```

### Installer
```
GET    /api/installer/status       # Установлена ли панель?
POST   /api/installer/check-deps   # Проверка зависимостей
POST   /api/installer/configure    # Сохранить конфиг
POST   /api/installer/run          # Запустить установку
WS     /api/installer/stream       # WebSocket прогресс + терминал
POST   /api/installer/complete     # Завершить установку
```

### Sites
```
GET    /api/sites
POST   /api/sites
GET    /api/sites/:id
PATCH  /api/sites/:id
DELETE /api/sites/:id
POST   /api/sites/:id/start
POST   /api/sites/:id/stop
POST   /api/sites/:id/restart
GET    /api/sites/:id/stats        # Метрики конкретного сайта
GET    /api/sites/:id/logs
GET    /api/sites/:id/graphs       # Графики трафика/запросов
```

### OLS (OpenLiteSpeed Full API)
```
GET    /api/ols/status
POST   /api/ols/restart
POST   /api/ols/graceful-restart
POST   /api/ols/reload
GET    /api/ols/vhosts
POST   /api/ols/vhosts
GET    /api/ols/vhosts/:name
PATCH  /api/ols/vhosts/:name
DELETE /api/ols/vhosts/:name
POST   /api/ols/vhosts/:name/enable
POST   /api/ols/vhosts/:name/disable
GET    /api/ols/listeners
POST   /api/ols/listeners
GET    /api/ols/php/versions
GET    /api/ols/php/:version/config
PATCH  /api/ols/php/:version/config
GET    /api/ols/cache/stats
POST   /api/ols/cache/flush
POST   /api/ols/cache/flush/:vhost
GET    /api/ols/opcache/stats
POST   /api/ols/opcache/flush
```

### SSL
```
GET    /api/ssl
POST   /api/ssl/issue
POST   /api/ssl/:id/renew
DELETE /api/ssl/:id
GET    /api/ssl/expiring
POST   /api/ssl/upload          # Custom certificate
```

### Databases
```
GET    /api/databases
POST   /api/databases
GET    /api/databases/:id
DELETE /api/databases/:id
POST   /api/databases/:id/export
POST   /api/databases/:id/import
GET    /api/databases/:id/users
POST   /api/databases/:id/users
PATCH  /api/databases/:id/users/:uid
DELETE /api/databases/:id/users/:uid
POST   /api/databases/:id/query   # SQL клиент
```

### Files
```
GET    /api/files               # Список (query: path)
POST   /api/files/upload
GET    /api/files/download
POST   /api/files/mkdir
POST   /api/files/rename
POST   /api/files/move
POST   /api/files/copy
DELETE /api/files
POST   /api/files/chmod
POST   /api/files/extract
POST   /api/files/compress
GET    /api/files/read
PUT    /api/files/save
POST   /api/files/search
```

### Backups (Restic)
```
GET    /api/backups
POST   /api/backups             # Создать бэкап
GET    /api/backups/:id
DELETE /api/backups/:id
POST   /api/backups/:id/restore
GET    /api/backups/snapshots   # Restic snapshots
GET    /api/backups/snapshots/:id/files  # Дерево файлов снимка
POST   /api/backups/snapshots/:id/restore-file  # Восстановить файл
GET    /api/backups/schedules
POST   /api/backups/schedules
PATCH  /api/backups/schedules/:id
DELETE /api/backups/schedules/:id
GET    /api/backups/stats       # Размер репозитория, count снимков
WS     /api/backups/stream      # Прогресс текущего бэкапа
```

### Firewall
```
GET    /api/firewall/status
POST   /api/firewall/enable
POST   /api/firewall/disable
GET    /api/firewall/rules
POST   /api/firewall/rules
PATCH  /api/firewall/rules/:id
DELETE /api/firewall/rules/:id
POST   /api/firewall/rules/:id/toggle
GET    /api/firewall/fail2ban/status
GET    /api/firewall/fail2ban/banned
POST   /api/firewall/fail2ban/unban
```

### Cron
```
GET    /api/cron
POST   /api/cron
GET    /api/cron/:id
PATCH  /api/cron/:id
DELETE /api/cron/:id
POST   /api/cron/:id/run
GET    /api/cron/:id/logs
```

### Terminal
```
POST   /api/terminal/create
WS     /api/terminal/:sessionId
DELETE /api/terminal/:sessionId
GET    /api/terminal/sessions
```

### Monitoring
```
GET    /api/monitoring/server           # Метрики сервера
GET    /api/monitoring/sites            # Метрики всех сайтов
GET    /api/monitoring/sites/:id        # Метрики конкретного сайта
GET    /api/monitoring/alerts           # Активные алерты
GET    /api/monitoring/history          # Исторические данные
WS     /api/monitoring/stream           # Live metrics push
```

### Logs
```
GET    /api/logs/:type                  # ols, nginx, php, system, access
POST   /api/logs/search
WS     /api/logs/stream/:type           # Live tail
GET    /api/logs/:type/download
```

### WP Toolkit
```
GET    /api/wp
POST   /api/wp/install              # Установить WordPress
GET    /api/wp/:id
GET    /api/wp/:id/plugins
POST   /api/wp/:id/plugins/install
POST   /api/wp/:id/plugins/activate/:slug
POST   /api/wp/:id/plugins/deactivate/:slug
DELETE /api/wp/:id/plugins/:slug
POST   /api/wp/:id/plugins/update-all
GET    /api/wp/:id/themes
POST   /api/wp/:id/themes/activate/:slug
DELETE /api/wp/:id/themes/:slug
POST   /api/wp/:id/update           # Обновить ядро
POST   /api/wp/:id/reset-password   # Сброс пароля admin
POST   /api/wp/:id/maintenance      # Maintenance mode
POST   /api/wp/:id/clone            # Клонирование
POST   /api/wp/:id/security-harden  # Hardening
GET    /api/wp/:id/security-scan    # Scan
```

### System
```
GET    /api/system/info
GET    /api/system/services
POST   /api/system/services/:name/restart
POST   /api/system/services/:name/stop
POST   /api/system/services/:name/start
GET    /api/system/updates
POST   /api/system/updates/install
```

---

## 📅 Roadmap & Приоритеты

### 🔴 ПРИОРИТЕТ 1: Миграция и инфраструктура (Текущий спринт)

- [ ] **Миграция на Next.js 16.1 + Node.js 20.x**
  - [ ] Обновление package.json зависимостей
  - [ ] Миграция async params (codemod)
  - [ ] Настройка Turbopack
  - [ ] Обновление auth на NextAuth v5
  - [ ] Проверка всех API routes на совместимость
- [ ] **Тестирование текущей версии** (параллельно)
  - [ ] Поиск и фиксация багов
  - [ ] Проверка OLS интеграции
  - [ ] Проверка создания сайтов
  - [ ] Проверка SSL

### 🟠 ПРИОРИТЕТ 2: Браузерный инсталлятор

- [ ] Installer UI (wizard, 9 шагов)
- [ ] Socket.io live-терминал в инсталляторе
- [ ] Проверка системных зависимостей
- [ ] Автоматическая настройка БД и Redis
- [ ] Сохранение конфига при первом запуске

### 🟡 ПРИОРИТЕТ 3: Ядро функционала

- [ ] Полное подключение OLS API (все endpoints)
- [ ] Файловый менеджер (Monaco Editor + CHMOD + архивы)
- [ ] Терминал (xterm.js + node-pty)
- [ ] Firewall GUI (UFW)
- [ ] Cron менеджер

### 🟢 ПРИОРИТЕТ 4: Бэкапы + Мониторинг

- [ ] Restic GUI (стиль Zerobyte)
- [ ] Расписания бэкапов
- [ ] Хранилища (local, S3, SFTP, B2)
- [ ] Восстановление отдельных файлов
- [ ] Графики по каждому сайту
- [ ] Live мониторинг (WebSocket)

### 🔵 ПРИОРИТЕТ 5: WP Toolkit + Документация

- [ ] WP Toolkit (установка + управление)
- [ ] Безопасность WP
- [ ] Клонирование сайтов
- [ ] Встроенная документация (MDX)
- [ ] Поиск по документации

### 🟡 ПРИОРИТЕТ 3 (добавить к ядру): SSL кастомные сертификаты

- [ ] Загрузка Custom SSL через UI (.crt + .key + chain)
- [ ] Валидация сертификата на сервере (key match, expiry, domain)
- [ ] Просмотр деталей сертификата (issuer, SANs, алгоритм)
- [ ] Reminder за 30 дней об истечении кастомного сертификата
- [ ] Единый список auto + custom сертификатов

### ⚪ ПРИОРИТЕТ 6: Полировка + Релиз v1.0

- [ ] Client Role (RBAC)
- [ ] Client Dashboard
- [ ] Mobile responsive
- [ ] i18n (мультиязычность)
- [ ] E2E тесты (Playwright)
- [ ] Unit тесты сервисов
- [ ] **GitHub README v1.0** (после стабильного релиза)
  - [ ] Описание, скриншоты, фичи
  - [ ] Быстрый старт (install script)
  - [ ] Требования, лицензия

---

### 🗺️ Версии продукта

#### ✅ v1.0 — Single VPS (текущая разработка)
Один администратор, один личный VPS. Полный контроль через браузер.

#### 🔮 v2.0 — Multi-VPS + Client Portal + Extended Languages
- **Удалённое управление VPS** (подключать чужие серверы как в RunCloud)
- **Client Portal** — клиент видит только свои сайты, упрощённый UI
- **Управление доменами и DNS** — A, CNAME, MX, TXT записи через UI
- **Расширенный SSL** — wildcard через DNS, multi-domain, SAN
- **Поддержка внешних приложений через OLS + Nginx** (все языки OLS):
  - **PHP** — дополнительные версии (8.0, 8.1, 8.2, 8.3), custom php.ini per app
  - **Ruby** — Rack/Passenger, управление Gemfile, rbenv/rvm
  - **Python** — WSGI/ASGI (Django, Flask, FastAPI), virtualenv, pip
  - **Perl** — CGI/FastCGI, CPAN зависимости
  - **Java** — Servlet/JSP через AJP proxy, Tomcat/Jetty интеграция
  - **Node.js** — расширенная поддержка (PM2 управление из UI, env vars, logs)
  - Управление процессами приложений (start/stop/restart/reload)
  - Просмотр логов приложения из панели
  - Env variables manager (как в Heroku/Railway)
  - Auto-restart при падении (systemd/PM2)
- **Billing** — тарифы, история платежей (опционально)

---

## 🚀 Setup & Deployment

### Требования к серверу

**Минимум:**
- OS: Ubuntu 22.04 LTS
- CPU: 2 cores
- RAM: 4 GB
- Disk: 50 GB SSD
- Node.js: 20.9.0+ LTS

**Рекомендуется:**
- OS: Ubuntu 22.04 LTS
- CPU: 4+ cores
- RAM: 8+ GB
- Disk: 100+ GB NVMe
- Node.js: 20.x LTS

### Быстрый старт (разработка)

```bash
# Требования: Node.js 20.9.0+
node --version  # должно быть >= 20.9.0

# Клонировать репозиторий
git clone https://github.com/yourusername/hostpanel-pro.git
cd hostpanel-pro

# Установить зависимости
npm install

# Запустить PostgreSQL и Redis
docker-compose up -d postgres redis

# Настроить окружение
cp .env.example .env
# Отредактировать .env

# Запустить миграции
npx prisma migrate dev
npx prisma generate

# Запустить в dev режиме (Turbopack)
npm run dev

# Панель: http://localhost:3000
# При первом запуске → перенаправление на /setup (инсталлятор)
```

### Обновление с Next.js 14/15 на 16

```bash
# Автоматическая миграция
npx @next/codemod@canary upgrade latest

# Или вручную
npm install next@latest react@latest react-dom@latest
npm install @types/react@latest @types/react-dom@latest --save-dev

# Исправить async params
npx next typegen
```

### Environment Variables

```env
# .env

# App
NODE_ENV=production
NEXTAUTH_URL=https://panel.example.com
NEXTAUTH_SECRET=generate-random-64-char-secret-here
INSTALLER_TOKEN=one-time-setup-token  # удалить после установки

# Database
DATABASE_URL=postgresql://panel:password@localhost:5432/hostpanel

# Redis
REDIS_URL=redis://localhost:6379

# OpenLiteSpeed
OLS_API_URL=http://localhost:7080
OLS_API_USER=admin
OLS_API_PASS=your-ols-admin-password

# Server
SERVER_ROOT=/var/www
BACKUP_ROOT=/var/backups/panel

# SSL
ACME_EMAIL=admin@example.com

# Monitoring
PROMETHEUS_URL=http://localhost:9090

# Notifications (опционально)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=app-password

TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

---

## 📁 Структура проекта

```
/opt/panel/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (setup)/
│   │   └── setup/               # Инсталлятор
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx             # Dashboard
│   │   ├── sites/
│   │   │   ├── page.tsx         # Список сайтов
│   │   │   └── [id]/
│   │   │       ├── page.tsx     # Детали сайта
│   │   │       ├── files/       # Файловый менеджер сайта
│   │   │       ├── logs/        # Логи сайта
│   │   │       └── stats/       # Графики сайта
│   │   ├── databases/
│   │   ├── files/               # Глобальный файловый менеджер
│   │   ├── backups/
│   │   ├── firewall/
│   │   ├── cron/
│   │   ├── monitoring/
│   │   ├── logs/
│   │   ├── terminal/
│   │   ├── wordpress/           # WP Toolkit
│   │   ├── ssl/
│   │   └── settings/
│   ├── api/
│   │   ├── auth/
│   │   ├── installer/
│   │   ├── sites/
│   │   ├── ols/                 # OLS Full API
│   │   ├── ssl/
│   │   ├── databases/
│   │   ├── files/
│   │   ├── backups/
│   │   ├── firewall/
│   │   ├── cron/
│   │   ├── monitoring/
│   │   ├── logs/
│   │   ├── terminal/
│   │   ├── wordpress/
│   │   └── system/
│   └── layout.tsx
├── components/
│   ├── ui/                      # shadcn/ui + кастом
│   ├── installer/               # Компоненты инсталлятора
│   ├── dashboard/
│   ├── sites/
│   ├── file-manager/
│   ├── database-manager/
│   ├── terminal/                # xterm.js компонент
│   ├── backups/
│   ├── monitoring/
│   └── wordpress/
├── lib/
│   ├── services/
│   │   ├── site-manager.ts
│   │   ├── ssl-manager.ts
│   │   ├── database-manager.ts
│   │   ├── file-manager.ts
│   │   ├── backup-service.ts
│   │   ├── firewall-service.ts
│   │   ├── cron-service.ts
│   │   ├── monitoring-service.ts
│   │   ├── wp-toolkit.ts
│   │   └── installer-service.ts
│   ├── integrations/
│   │   ├── ols-api.ts           # Full OLS REST API client
│   │   ├── nginx-manager.ts
│   │   ├── restic-wrapper.ts
│   │   ├── ufw-wrapper.ts
│   │   ├── acme-wrapper.ts
│   │   └── wp-cli-wrapper.ts
│   ├── socket/
│   │   ├── server.ts            # Socket.io сервер
│   │   └── handlers/
│   ├── prisma.ts
│   ├── redis.ts
│   └── utils.ts
├── docs/                        # MDX документация
│   ├── getting-started.mdx
│   ├── sites.mdx
│   ├── wordpress.mdx
│   ├── backups.mdx
│   └── ...
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
├── next.config.ts               # .ts вместо .js (Next.js 16)
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

---

## 📖 Документация (план)

### Встроенная (MDX в панели)

| Раздел | Статус |
|--------|--------|
| Быстрый старт | ⬜ Не начат |
| Создание сайта | ⬜ Не начат |
| WordPress установка | ⬜ Не начат |
| Файловый менеджер | ⬜ Не начат |
| Бэкапы | ⬜ Не начат |
| SSL | ⬜ Не начат |
| Терминал | ⬜ Не начат |
| Firewall | ⬜ Не начат |
| Cron | ⬜ Не начат |
| Мониторинг | ⬜ Не начат |
| API | ⬜ Не начат |
| FAQ | ⬜ Не начат |

### Внешняя (GitHub Wiki / Docs сайт)

- README.md с быстрым стартом
- CONTRIBUTING.md
- CHANGELOG.md
- API Reference (auto-generated из OpenAPI)

---

## 🐛 Известные проблемы и ограничения

_Заполняется в процессе тестирования_

| # | Проблема | Модуль | Статус | Приоритет |
|---|----------|--------|--------|-----------|
| — | — | — | — | — |

---

## 📝 Примечания

- Этот документ обновляется по мере разработки
- Функции отмечаются `✅` когда полностью протестированы и стабильны
- Раздел "Известные проблемы" пополняется в процессе тестирования
- Версия Next.js зафиксирована на **16.1.x** (текущий latest stable)
