# breachrabbit-web-panel

[🇷🇺 Русский](#-русский) | [🇬🇧 English](#-english)

---

## 🇷🇺 Русский

Bootstrap-проект панели BreachRabbit (OpenLiteSpeed + Nginx + Next.js).

### Установка одной командой (Ubuntu)

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/breachrabbit/breachrabbit-web-panel/main/install/install.sh)
```

### Как запустить установку (пошагово)

> Требуется **Ubuntu** и запуск от `root` (или через `sudo`).

#### Вариант 1 — сразу из GitHub (рекомендуется)

```bash
sudo bash -c "$(curl -fsSL https://raw.githubusercontent.com/breachrabbit/breachrabbit-web-panel/main/install/install.sh)"
```

#### Вариант 2 — через clone репозитория

```bash
git clone https://github.com/breachrabbit/breachrabbit-web-panel.git
cd breachrabbit-web-panel
chmod +x install/install.sh
sudo ./install/install.sh
```

### Что делает установщик

1. Обновляет систему Ubuntu.
2. Устанавливает базовые утилиты (`curl`, `git`, `jq`, `ufw`, `fail2ban` и т.д.).
3. Устанавливает стек: OpenLiteSpeed, Nginx, MariaDB, Redis, Certbot, Node.js, PHP-FPM, Adminer.
4. Настраивает сервисы и разворачивает панель Next.js как systemd-сервис.
5. **В самом конце** предлагает вручную задать пароль `root` для MariaDB.
6. **В самом конце** выводит итоговую таблицу всех доступов и сохраняет её в файл.

### Где смотреть доступы после установки

- `/root/breachrabbit-install-summary.txt`
- Переменные окружения панели: `/opt/breachrabbit/config/.env`

### Инструменты панели

- `/adminer` — web-интерфейс MariaDB (кнопка **Open Adminer** на главной панели).
- `/files` — встроенный файловый менеджер для папки сайтов (`PANEL_SITES_ROOT`).
- `/api/files` — API просмотра/скачивания файлов внутри разрешенного корня.

### Лог добавленных функций

- Отдельный файл с новыми функциями и датами: [`docs/FEATURE_UPDATES.md`](docs/FEATURE_UPDATES.md)

---

## 🇬🇧 English

Bootstrap project for the BreachRabbit Panel (OpenLiteSpeed + Nginx + Next.js).

### One-command install (Ubuntu)

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/breachrabbit/breachrabbit-web-panel/main/install/install.sh)
```

### How to run installation (step-by-step)

> Requires **Ubuntu** and `root` privileges (or `sudo`).

#### Option 1 — run directly from GitHub (recommended)

```bash
sudo bash -c "$(curl -fsSL https://raw.githubusercontent.com/breachrabbit/breachrabbit-web-panel/main/install/install.sh)"
```

#### Option 2 — clone repository first

```bash
git clone https://github.com/breachrabbit/breachrabbit-web-panel.git
cd breachrabbit-web-panel
chmod +x install/install.sh
sudo ./install/install.sh
```

### What the installer does

1. Updates Ubuntu packages.
2. Installs base utilities (`curl`, `git`, `jq`, `ufw`, `fail2ban`, etc.).
3. Installs stack components: OpenLiteSpeed, Nginx, MariaDB, Redis, Certbot, Node.js, PHP-FPM, Adminer.
4. Configures services and deploys the Next.js panel as a systemd service.
5. **At the very end**, asks for manual MariaDB `root` password setup.
6. **At the very end**, prints all access credentials and saves them into a summary file.

### Where to find credentials after install

- `/root/breachrabbit-install-summary.txt`
- Panel environment file: `/opt/breachrabbit/config/.env`

### Panel tools

- `/adminer` — MariaDB web UI (via **Open Adminer** button on main panel).
- `/files` — built-in file manager for the sites root (`PANEL_SITES_ROOT`).
- `/api/files` — API endpoint for browsing/downloading files inside allowed root.

### Added features log

- Dedicated file for features added with dates: [`docs/FEATURE_UPDATES.md`](docs/FEATURE_UPDATES.md)
