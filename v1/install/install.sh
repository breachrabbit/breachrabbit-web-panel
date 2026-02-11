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

warn() {
  printf '\n[WARN] %s\n' "$*"
}

random_password() {
  openssl rand -base64 24 | tr -d '=+/' | cut -c1-20
}

is_tty() {
  [[ -t 0 ]]
}

write_credentials_file() {
  local file="$1"
  local content="$2"
  umask 077
  printf '%s\n' "$content" > "$file"
}

safe_enable_and_start_unit() {
  local unit="$1"

  # Some packages expose alias/linked unit names that cannot be enabled.
  # In that case, start the service without enable.
  if systemctl enable --now "$unit"; then
    return 0
  fi

  warn "Could not enable ${unit} (possibly alias/linked). Trying start-only."
  systemctl start "$unit"
}

enable_and_start_service() {
  local svc="$1"

  if ! systemctl list-unit-files --type=service | awk '{print $1}' | grep -qx "${svc}.service"; then
    warn "Service unit ${svc}.service not found, skipping"
    return 0
  fi

  safe_enable_and_start_unit "${svc}.service"
}

start_openlitespeed() {
  # On different distros/packaging versions unit name may differ.
  # We avoid alias errors like: "Refusing to operate on alias name ... lsws.service"
  if systemctl list-unit-files --type=service | awk '{print $1}' | grep -qx 'openlitespeed.service'; then
    safe_enable_and_start_unit openlitespeed.service
    return
  fi

  if systemctl list-unit-files --type=service | awk '{print $1}' | grep -qx 'lshttpd.service'; then
    safe_enable_and_start_unit lshttpd.service
    return
  fi

  # IMPORTANT: do not enable/start lsws.service directly because on many hosts
  # it is an alias/linked unit and `systemctl enable lsws` fails.
  if [[ -x /usr/local/lsws/bin/lswsctrl ]]; then
    /usr/local/lsws/bin/lswsctrl start || true
    return
  fi

  warn "OpenLiteSpeed service unit not found (or only alias exists); install may be incomplete"
}

start_php_fpm_service() {
  local php_fpm_service
  php_fpm_service="$(systemctl list-unit-files --type=service | awk '{print $1}' | rg '^php[0-9.\-]*fpm\.service$' | head -n1 || true)"

  if [[ -n "${php_fpm_service}" ]]; then
    safe_enable_and_start_unit "${php_fpm_service}"
  else
    warn "PHP-FPM service unit not found, Adminer may not work until php-fpm is installed and started"
  fi
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

  start_openlitespeed
  enable_and_start_service nginx
  enable_and_start_service mariadb
  enable_and_start_service redis-server
  enable_and_start_service cron
  start_php_fpm_service
}

OLS_ADMIN_PASS=""
DB_ROOT_PASS=""
INITIAL_DB_ROOT_PASS=""
APP_SECRET=""
ADMINER_URL=""
FILEBROWSER_URL=""
FILEBROWSER_ADMIN_USER="admin"
FILEBROWSER_ADMIN_PASS=""
REBOOT_REQUIRED="no"
HOST_IP=""
SUMMARY_FILE="/root/breachrabbit-install-summary.txt"

configure_initial_services() {
  log "Phase 4/4: Initial configuration and credentials"

  OLS_ADMIN_PASS="$(random_password)"
  DB_ROOT_PASS="$(random_password)"
  INITIAL_DB_ROOT_PASS="${DB_ROOT_PASS}"
  APP_SECRET="$(random_password)$(random_password)"
  FILEBROWSER_ADMIN_PASS="$(random_password)"
  REBOOT_REQUIRED="no"

  # OpenLiteSpeed admin password
  if [[ -x /usr/local/lsws/admin/misc/admpass.sh ]]; then
    /usr/local/lsws/admin/misc/admpass.sh <<PASS_INPUT
admin
${OLS_ADMIN_PASS}
${OLS_ADMIN_PASS}
PASS_INPUT
  fi

  # MariaDB root password
  mysql --protocol=socket -uroot <<SQL
ALTER USER 'root'@'localhost' IDENTIFIED BY '${DB_ROOT_PASS}';
FLUSH PRIVILEGES;
SQL

  # Prepare app directories
  install -d -m 750 /opt/breachrabbit/{config,data,logs,domains,sites,certs}

  HOST_IP="$(hostname -I | awk '{print $1}')"

  install -d -m 755 /etc/nginx/snippets
  if [[ ! -f /etc/nginx/snippets/adminer.conf ]]; then
    cat > /etc/nginx/snippets/adminer.conf <<'SNIP'
# Adminer snippet will be configured later in installer.
SNIP
  fi

  if [[ ! -f /etc/nginx/snippets/filebrowser.conf ]]; then
    cat > /etc/nginx/snippets/filebrowser.conf <<'SNIP'
# FileBrowser snippet will be configured later in installer.
SNIP
  fi

  # Nginx placeholder config for Next.js panel
  cat > /etc/nginx/sites-available/breachrabbit-panel.conf <<NGINX
server {
    listen 80;
    server_name _;

    include /etc/nginx/snippets/adminer.conf;
    include /etc/nginx/snippets/filebrowser.conf;

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
APP_SECRET=${APP_SECRET}
NEXTAUTH_SECRET=${APP_SECRET}
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=${DB_ROOT_PASS}
DB_NAME=breachrabbit
REDIS_URL=redis://127.0.0.1:6379
OLS_API_BASE_URL=http://127.0.0.1:7080
AEZA_API_KEY=CHANGE_ME
PANEL_ALLOW_SYSTEM_CHANGES=true
PANEL_RESTART_COMMAND=systemctl restart nginx openlitespeed breachrabbit-panel || systemctl restart nginx lshttpd breachrabbit-panel
PANEL_NGINX_RELOAD_COMMAND=nginx -t && systemctl reload nginx
PANEL_DOMAINS_ROOT=/etc/nginx/sites-available
PANEL_NGINX_ENABLED_ROOT=/etc/nginx/sites-enabled
PANEL_SITES_ROOT=/opt/breachrabbit/sites
PANEL_DOMAIN_REGISTRY_PATH=/opt/breachrabbit/data/domain-registry.json
PANEL_TARGET_URL=http://127.0.0.1:3000
PANEL_CERTBOT_EMAIL=admin@${HOST_IP}.nip.io
PANEL_MAIN_SITE_CONFIG_PATH=/etc/nginx/sites-available/breachrabbit-panel.conf
PANEL_MAIN_SITE_ENABLED_PATH=/etc/nginx/sites-enabled/breachrabbit-panel.conf
PANEL_ENV_FILE_PATH=/opt/breachrabbit/config/.env
ENV
  chmod 600 /opt/breachrabbit/config/.env

  if [[ -f /usr/share/adminer/adminer.php ]] || [[ -f /usr/share/adminer/adminer/index.php ]]; then
    local php_socket
    php_socket="$(ls /run/php/php*-fpm.sock 2>/dev/null | head -n1 || true)"

    if [[ -n "${php_socket}" ]]; then
      local adminer_script
      if [[ -f /usr/share/adminer/adminer.php ]]; then
        adminer_script="/usr/share/adminer/adminer.php"
      else
        adminer_script="/usr/share/adminer/adminer/index.php"
      fi

      ADMINER_URL="http://${HOST_IP}/adminer/"
      cat > /etc/nginx/snippets/adminer.conf <<SNIP
location = /adminer {
    return 302 /adminer/;
}

location = /adminer/ {
    include snippets/fastcgi-php.conf;
    fastcgi_param SCRIPT_FILENAME ${adminer_script};
    fastcgi_param SCRIPT_NAME /adminer;
    fastcgi_param QUERY_STRING \$query_string;
    fastcgi_pass unix:${php_socket};
}
SNIP

      if ! grep -q "include /etc/nginx/snippets/adminer.conf;" /etc/nginx/sites-available/breachrabbit-panel.conf; then
        sed -i '/server_name _;/a \
    include /etc/nginx/snippets/adminer.conf;' /etc/nginx/sites-available/breachrabbit-panel.conf
      fi

      nginx -t
      systemctl reload nginx

      if ! curl -fsS "http://127.0.0.1/adminer/" >/dev/null 2>&1; then
        ADMINER_URL="Configured, but local check failed (http://127.0.0.1/adminer/)"
      fi
    else
      ADMINER_URL="Installed, but php-fpm socket not found"
    fi
  else
    ADMINER_URL="Not installed"
  fi

  # FileBrowser (https://filebrowser.org) setup
  if command -v filebrowser >/dev/null 2>&1; then
    :
  else
    curl -fsSL https://raw.githubusercontent.com/filebrowser/get/master/get.sh | bash
  fi

  if command -v filebrowser >/dev/null 2>&1; then
    local filebrowser_bin
    filebrowser_bin="$(command -v filebrowser)"

    install -d -m 750 /opt/breachrabbit/filebrowser/{config,data}

    filebrowser config init \
      --database /opt/breachrabbit/filebrowser/data/filebrowser.db \
      --address 127.0.0.1 \
      --port 8081 \
      --root /opt/breachrabbit/sites

    if ! filebrowser users update "${FILEBROWSER_ADMIN_USER}" \
      --password "${FILEBROWSER_ADMIN_PASS}" \
      --database /opt/breachrabbit/filebrowser/data/filebrowser.db \
      --perm.admin >/dev/null 2>&1
    then
      filebrowser users add "${FILEBROWSER_ADMIN_USER}" "${FILEBROWSER_ADMIN_PASS}" \
        --database /opt/breachrabbit/filebrowser/data/filebrowser.db \
        --perm.admin
    fi

    cat > /etc/systemd/system/breachrabbit-filebrowser.service <<SERVICE
[Unit]
Description=BreachRabbit FileBrowser
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/breachrabbit/filebrowser
ExecStart=${filebrowser_bin} \
  --database /opt/breachrabbit/filebrowser/data/filebrowser.db \
  --address 127.0.0.1 \
  --port 8081 \
  --root /opt/breachrabbit/sites
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICE

    cat > /etc/nginx/snippets/filebrowser.conf <<'SNIP'
location /files/ {
    proxy_pass http://127.0.0.1:8081/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location = /files {
    return 302 /files/;
}
SNIP

    if ! grep -q "include /etc/nginx/snippets/filebrowser.conf;" /etc/nginx/sites-available/breachrabbit-panel.conf; then
      sed -i '/server_name _;/a \
    include /etc/nginx/snippets/filebrowser.conf;' /etc/nginx/sites-available/breachrabbit-panel.conf
    fi

    nginx -t
    systemctl reload nginx

    systemctl daemon-reload
    systemctl enable --now breachrabbit-filebrowser

    FILEBROWSER_URL="http://${HOST_IP}/files/"
  else
    FILEBROWSER_URL="Not installed (filebrowser binary unavailable)"
  fi

  if [[ -f /var/run/reboot-required ]]; then
    REBOOT_REQUIRED="yes"
  fi
}

manual_set_mariadb_root_password() {
  log "Final step: manual MariaDB root password setup before access summary"

  local entered_pass confirm_pass

  if is_tty; then
    while true; do
      read -r -s -p "Enter MariaDB root password (leave empty to keep generated): " entered_pass
      printf '\n'

      if [[ -z "${entered_pass}" ]]; then
        warn "Keeping generated MariaDB root password"
        break
      fi

      read -r -s -p "Repeat MariaDB root password: " confirm_pass
      printf '\n'

      if [[ "${entered_pass}" != "${confirm_pass}" ]]; then
        warn "Passwords do not match. Try again."
        continue
      fi

      DB_ROOT_PASS="${entered_pass}"
      break
    done
  else
    warn "Non-interactive shell detected. Keeping generated MariaDB root password."
  fi

  if ! mysql --protocol=socket -uroot -p"${INITIAL_DB_ROOT_PASS}" <<SQL
ALTER USER 'root'@'localhost' IDENTIFIED BY '${DB_ROOT_PASS}';
FLUSH PRIVILEGES;
SQL
  then
    mysql --protocol=socket -uroot <<SQL
ALTER USER 'root'@'localhost' IDENTIFIED BY '${DB_ROOT_PASS}';
FLUSH PRIVILEGES;
SQL
  fi

  sed -i "s|^DB_PASSWORD=.*$|DB_PASSWORD=${DB_ROOT_PASS}|" /opt/breachrabbit/config/.env
}

print_access_summary() {
  local reboot_note="${REBOOT_REQUIRED}"
  if [[ "${REBOOT_REQUIRED}" == "yes" ]]; then
    reboot_note="${REBOOT_REQUIRED} (recommended: reboot now to load updated binaries)"
  fi

  write_credentials_file "${SUMMARY_FILE}" "$(cat <<SUMMARY
BreachRabbit Panel bootstrap complete.

| Service | URL | Login | Password / Token |
|---|---|---|---|
| OpenLiteSpeed Admin | https://${HOST_IP}:7080 | admin | ${OLS_ADMIN_PASS} |
| Nginx Panel Proxy (placeholder) | http://${HOST_IP} | - | - |
| MariaDB Root | localhost:3306 | root | ${DB_ROOT_PASS} |
| Adminer | ${ADMINER_URL} | root | ${DB_ROOT_PASS} |
| FileBrowser | ${FILEBROWSER_URL} | ${FILEBROWSER_ADMIN_USER} | ${FILEBROWSER_ADMIN_PASS} |
| Panel env file | /opt/breachrabbit/config/.env | NEXTAUTH_SECRET | ${APP_SECRET} |
| Reboot required | system status | - | ${reboot_note} |

Saved: ${SUMMARY_FILE}
SUMMARY
)"

  printf '\n%s\n\n' "============================================================"
  cat "${SUMMARY_FILE}"
  printf '%s\n' "============================================================"
}

deploy_panel_app() {
  log "Phase 5/5: Deploying Next.js panel and enabling background service"

  local panel_repo panel_dir panel_user panel_unit
  panel_repo="https://github.com/breachrabbit/breachrabbit-web-panel.git"
  panel_dir="/opt/breachrabbit/panel"
  panel_user="root"
  panel_unit="/etc/systemd/system/breachrabbit-panel.service"

  if [[ -d "${panel_dir}/.git" ]]; then
    git -C "${panel_dir}" fetch --all --prune
    git -C "${panel_dir}" reset --hard origin/main
  else
    rm -rf "${panel_dir}"
    git clone "${panel_repo}" "${panel_dir}"
  fi

  cd "${panel_dir}"

  if [[ -f package-lock.json ]]; then
    npm ci
  else
    npm install
  fi

  npm run build

  cat > "${panel_unit}" <<SERVICE
[Unit]
Description=BreachRabbit Next.js Panel
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${panel_user}
WorkingDirectory=${panel_dir}
EnvironmentFile=/opt/breachrabbit/config/.env
Environment=PORT=3000
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICE

  systemctl daemon-reload
  systemctl enable --now breachrabbit-panel
}

main() {
  install_phase_updates
  install_phase_base_utils
  install_phase_stack
  configure_initial_services
  deploy_panel_app
  manual_set_mariadb_root_password
  log "Done. Panel is deployed and running in background via breachrabbit-panel service."
  print_access_summary
}

main "$@"
