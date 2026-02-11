# breachrabbit-web-panel

Bootstrap skeleton for BreachRabbit Web Panel (OpenLiteSpeed + Nginx + Next.js control panel foundation).

## One-command install (Ubuntu)

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/breachrabbit/breachrabbit-web-panel/main/install/install.sh)
```

## Как запустить установку (пошагово)

> Требуется **Ubuntu** и запуск от `root` (или через `sudo`).

### Вариант 1 — сразу из GitHub (рекомендуется)

```bash
sudo bash -c "$(curl -fsSL https://raw.githubusercontent.com/breachrabbit/breachrabbit-web-panel/main/install/install.sh)"
```

### Вариант 2 — через clone репозитория

```bash
git clone https://github.com/breachrabbit/breachrabbit-web-panel.git
cd breachrabbit-web-panel
chmod +x install/install.sh
sudo ./install/install.sh
```

## Что делает установщик (part 1)

1. Checks Ubuntu updates and installs them.
2. Installs standard utilities (`curl`, `git`, `jq`, `ufw`, `fail2ban`, etc.).
3. Installs core stack components:
   - OpenLiteSpeed
   - Nginx
   - MariaDB
   - Redis
   - Certbot
   - Node.js + npm
   - PHP-FPM + PHP MySQL extension
4. Generates random credentials for first boot and prints a summary table with URLs/logins/passwords.

## Где смотреть доступы после установки

After completion, installer writes a credentials report to:

- `/root/breachrabbit-install-summary.txt`

And prepares skeleton env for the panel in:

- `/opt/breachrabbit/config/.env`

## Troubleshooting

- If you previously saw `Refusing to operate on alias name or linked unit file: lsws.service`, pull latest installer and rerun it.
- The installer now auto-detects the proper OpenLiteSpeed unit (`openlitespeed.service` / `lshttpd.service`) and falls back to `lswsctrl` when needed.
