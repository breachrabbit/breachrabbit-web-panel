# breachrabbit-web-panel

Bootstrap skeleton for BreachRabbit Web Panel (OpenLiteSpeed + Nginx + Next.js control panel foundation).

## One-command install (Ubuntu)

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/breachrabbit/breachrabbit-web-panel/main/install/install.sh)
```

## What the installer does (part 1)

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

## Result

After completion, installer writes a credentials report to:

- `/root/breachrabbit-install-summary.txt`

And prepares skeleton env for the panel in:

- `/opt/breachrabbit/config/.env`
