#!/usr/bin/env bash
set -euo pipefail

# breachrabbit-web-panel bootstrap installer (skeleton v1)

if [[ ${EUID:-$(id -u)} -ne 0 ]]; then
  echo "[ERROR] Run installer as root: sudo bash install.sh"
  exit 1
fi

if [[ ! -f /etc/os-release ]]; then
  echo "[ERROR] Unsupported OS: /etc/os-release is missing"
  exit 1
fi

# shellcheck disable=SC1091
source /etc/os-release
if [[ "${ID:-}" != "ubuntu" ]]; then
  echo "[ERROR] This installer currently supports Ubuntu only"
  exit 1
fi

log() {
  printf '\n[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

random_password() {
  openssl rand -base64 24 | tr -d '=+/' | cut -c1-20
}

write_credentials_file() {
  local file="$1"
  local content="$2"
  umask 077
  printf '%s\n' "$content" > "$file"
}

install_phase_updates() {
  log "Phase 1/4: Checking and installing Ubuntu updates"
  apt-get update -y
  DEBIAN_FRONTEND=noninteractive apt-get upgrade -y
}

install_phase_base_utils() {
  log "Phase 2/4: Installing standard utilities"
  DEBIAN_FRONTEND=noninteractive apt-get install -y \
    ca-certificates curl wget git unzip zip jq gnupg lsb-release software-properties-common \
    htop net-tools dnsutils ufw fail2ban openssl cron
}

install_phase_stack() {
  log "Phase 3/4: Installing core stack components"

  # OpenLiteSpeed repository + package
  wget -qO - https://repo.litespeed.sh | bash

  DEBIAN_FRONTEND=noninteractive apt-get install -y \
    openlitespeed \
    nginx \
    mariadb-server \
    redis-server \
    certbot \
    python3-certbot-nginx \
    nodejs npm \
    php-fpm php-mysql

  # Optional: admin UI for DB
  DEBIAN_FRONTEND=noninteractive apt-get install -y adminer || true

  systemctl enable --now lsws
  systemctl enable --now nginx
  systemctl enable --now mariadb
  systemctl enable --now redis-server
  systemctl enable --now cron
}

configure_initial_services() {
  log "Phase 4/4: Initial configuration and credentials"

  local ols_admin_pass db_root_pass app_secret adminer_url summary_file
  ols_admin_pass="$(random_password)"
  db_root_pass="$(random_password)"
  app_secret="$(random_password)$(random_password)"

  # OpenLiteSpeed admin password
  if [[ -x /usr/local/lsws/admin/misc/admpass.sh ]]; then
    /usr/local/lsws/admin/misc/admpass.sh <<PASS_INPUT
admin
${ols_admin_pass}
${ols_admin_pass}
PASS_INPUT
  fi

  # MariaDB root password
  mysql --protocol=socket -uroot <<SQL
ALTER USER 'root'@'localhost' IDENTIFIED BY '${db_root_pass}';
FLUSH PRIVILEGES;
SQL

  # Prepare app directories
  install -d -m 750 /opt/breachrabbit/{config,data,logs}

  local host_ip
  host_ip="$(hostname -I | awk '{print $1}')"

  # Nginx placeholder config for Next.js panel
  cat > /etc/nginx/sites-available/breachrabbit-panel.conf <<NGINX
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX

  ln -sf /etc/nginx/sites-available/breachrabbit-panel.conf /etc/nginx/sites-enabled/breachrabbit-panel.conf
  rm -f /etc/nginx/sites-enabled/default
  nginx -t
  systemctl reload nginx

  # Panel environment skeleton
  cat > /opt/breachrabbit/config/.env <<ENV
NODE_ENV=production
APP_PORT=3000
APP_SECRET=${app_secret}
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=${db_root_pass}
DB_NAME=breachrabbit
REDIS_URL=redis://127.0.0.1:6379
OLS_API_BASE_URL=http://127.0.0.1:7080
AEZA_API_KEY=CHANGE_ME
ENV
  chmod 600 /opt/breachrabbit/config/.env

  if [[ -f /usr/share/adminer/adminer.php ]]; then
    local php_socket
    php_socket="$(ls /run/php/php*-fpm.sock 2>/dev/null | head -n1 || true)"

    if [[ -n "${php_socket}" ]]; then
      adminer_url="http://${host_ip}/adminer"
      cat > /etc/nginx/snippets/adminer.conf <<SNIP
location = /adminer {
    include snippets/fastcgi-php.conf;
    fastcgi_param SCRIPT_FILENAME /usr/share/adminer/adminer.php;
    fastcgi_pass unix:${php_socket};
}
SNIP

      if ! grep -q "include /etc/nginx/snippets/adminer.conf;" /etc/nginx/sites-available/breachrabbit-panel.conf; then
        sed -i '/server_name _;/a \
    include /etc/nginx/snippets/adminer.conf;' /etc/nginx/sites-available/breachrabbit-panel.conf
      fi

      nginx -t
      systemctl reload nginx
    else
      adminer_url="Installed, but php-fpm socket not found"
    fi
  else
    adminer_url="Not installed"
  fi

  summary_file="/root/breachrabbit-install-summary.txt"
  write_credentials_file "$summary_file" "$(cat <<SUMMARY
BreachRabbit Panel bootstrap complete.

| Service | URL | Login | Password / Token |
|---|---|---|---|
| OpenLiteSpeed Admin | https://${host_ip}:7080 | admin | ${ols_admin_pass} |
| Nginx Panel Proxy (placeholder) | http://${host_ip} | - | - |
| MariaDB Root | localhost:3306 | root | ${db_root_pass} |
| Adminer | ${adminer_url} | root | ${db_root_pass} |
| Panel env file | /opt/breachrabbit/config/.env | APP_SECRET | ${app_secret} |

Saved: ${summary_file}
SUMMARY
)"

  printf '\n%s\n\n' "============================================================"
  cat "$summary_file"
  printf '%s\n' "============================================================"
}

main() {
  install_phase_updates
  install_phase_base_utils
  install_phase_stack
  configure_initial_services

  log "Done. Next step: deploy Next.js panel code into /opt/breachrabbit and run it on port 3000."
}

main "$@"
