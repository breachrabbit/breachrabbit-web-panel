# FEATURE UPDATES / ОБНОВЛЕНИЯ ФУНКЦИЙ

## 2026-02-11

### RU
- Исправлен запуск Adminer в `install/install.sh`: добавлен запуск PHP-FPM сервиса, поддержка двух путей Adminer и проверка доступности через локальный HTTP-запрос.
- Добавлен финальный шаг ручной установки пароля MariaDB `root` перед выводом доступов.
- Все доступы и пароли теперь выводятся строго в самом конце установки (после всех фаз, включая деплой панели).
- После финального задания пароля MariaDB автоматически обновляется `DB_PASSWORD` в `/opt/breachrabbit/config/.env`.
- README переведен и структурирован на двух языках (RU/EN) с выбором языка вверху.

### EN
- Fixed Adminer startup flow in `install/install.sh`: added PHP-FPM service start, support for two Adminer paths, and local HTTP availability check.
- Added final manual MariaDB `root` password step before printing access details.
- All credentials are now printed strictly at the very end of installation (after all phases, including panel deployment).
- After final MariaDB password setup, `DB_PASSWORD` in `/opt/breachrabbit/config/.env` is updated automatically.
- README was translated and restructured into bilingual RU/EN format with language selector at the top.

> Update this file after each newly added function is verified to work correctly.

## 2026-02-11 (update 2)

### RU
- Исправлено отображение новых доменов в таблице: страница `/domains` переведена в динамический режим (`force-dynamic`), чтобы не отдавать закэшированный список.
- Для API списка доменов `/api/domains` отключено статическое кэширование через `force-dynamic`.
- У ссылки на страницу доменов отключен `prefetch`, чтобы не подхватывался устаревший префетченный снапшот до создания домена.

### EN
- Fixed new-domain visibility in the table: `/domains` page now uses dynamic rendering (`force-dynamic`) to avoid stale cached registry output.
- Disabled static caching for `/api/domains` list endpoint with `force-dynamic`.
- Disabled `prefetch` on the domains link to prevent navigating to an outdated prefetched snapshot created before domain creation.

## 2026-02-11 (update 3)

### RU
- В панель добавлена карточка `Tools` с кнопками быстрого доступа: `Open Adminer` и `Open file manager`.
- Встроен файловый менеджер: новая страница `/files` с навигацией по папкам, отображением типа/размера/даты и скачиванием файлов.
- Добавлен API `GET /api/files` с защитой от выхода за пределы `PANEL_SITES_ROOT` (path traversal guard) и поддержкой скачивания файлов (`download=1`).
- README обновлен: добавлено описание новых инструментов панели (`/adminer`, `/files`, `/api/files`).

### EN
- Added a new `Tools` card to the panel with quick access buttons: `Open Adminer` and `Open file manager`.
- Integrated a built-in file manager: new `/files` page with folder navigation, type/size/date listing, and file download action.
- Added `GET /api/files` endpoint with path traversal protection (restricted to `PANEL_SITES_ROOT`) and file download support (`download=1`).
- Updated README with documentation for the new panel tools (`/adminer`, `/files`, `/api/files`).

## 2026-02-11 (update 4)

### RU
- В `install/install.sh` предупреждение о необходимости перезагрузки перенесено в таблицу доступов (`Reboot required`), чтобы все ключевые доступы и статусы выводились строго в самом конце единым блоком.
- Финальный лог `Done...` перемещен перед сводкой доступов: теперь после него печатается только итоговый блок с доступами.

### EN
- In `install/install.sh`, the reboot recommendation is now embedded into the `Reboot required` row inside the final access table, so all critical access details and statuses are shown strictly at the very end in one block.
- The final `Done...` log line was moved before the access summary: now only the final access block is printed after it.

## 2026-02-11 (update 5)

### RU
- Исправлена конфигурация Adminer в `install/install.sh`: добавлен явный редирект `/adminer -> /adminer/`, выделен точный `location = /adminer/` и обновлена проверка доступности через `http://127.0.0.1/adminer/`, чтобы убрать 404 на открытии.
- Встроенный файловый менеджер панели заменен на FileBrowser (`https://filebrowser.org`): удалены маршруты `/files` и `/api/files` из Next.js, в панели кнопка теперь открывает FileBrowser.
- В установщик добавлена автоматическая установка/настройка FileBrowser как отдельного systemd-сервиса `breachrabbit-filebrowser` с проксированием через Nginx на `/files/`.
- Доступы FileBrowser (URL, логин и пароль) добавлены в финальную таблицу доступов, которая по-прежнему выводится в самом конце.

### EN
- Fixed Adminer config in `install/install.sh`: added explicit `/adminer -> /adminer/` redirect, exact `location = /adminer/` block, and updated availability check via `http://127.0.0.1/adminer/` to eliminate 404 on open.
- Replaced the built-in panel file manager with FileBrowser (`https://filebrowser.org`): removed Next.js `/files` and `/api/files` routes, and updated the panel button to open FileBrowser.
- Added automatic FileBrowser installation/configuration to installer as a dedicated `breachrabbit-filebrowser` systemd service with Nginx proxy on `/files/`.
- Added FileBrowser access details (URL, login, password) to the final access summary, which is still printed at the very end.

## 2026-02-11 (update 6)

### RU
- Исправлено поведение формы добавления домена: по умолчанию отключена привязка к панели (`Bind domain to panel`), чтобы при стандартном сценарии создавался тестовый статический сайт.
- В API создания домена тестовый сайт и папка домена теперь создаются всегда при включенной опции `Create demo website`, независимо от режима привязки к панели.
- В реестре доменов флаг `demoSite` теперь корректно отражает выбранную опцию формы без дополнительной фильтрации.

### EN
- Fixed the domain creation form behavior: `Bind domain to panel` is now disabled by default so the default flow creates a static demo site.
- Updated domain creation API so demo site files and the site folder are created whenever `Create demo website` is enabled, regardless of panel binding mode.
- Domain registry `demoSite` flag now directly reflects the selected form option without extra filtering.

## 2026-02-11 (update 7)

### RU
- Блок управления БД в панели переработан в табы `MySQL` и `Redis` в стиле, близком к примеру: отдельный интерфейс для MySQL-операций и отдельный для Redis.
- Во вкладке `MySQL` добавлены: создание БД (`Add DB`), смена `root`-пароля и кнопка быстрого перехода в Adminer.
- Добавлен API `POST /api/databases/root-password` для смены пароля `root@localhost` через SQL-команду.
- Во вкладке `Redis` добавлена форма `Add key` (DB index, key, value, TTL) и API `POST /api/redis/keys` для записи ключей через `redis-cli`.

### EN
- The panel database block was redesigned into `MySQL` and `Redis` tabs in a style close to the provided example: separate MySQL and Redis management views.
- The `MySQL` tab now includes database creation (`Add DB`), `root` password change, and a quick Adminer button.
- Added `POST /api/databases/root-password` endpoint to update `root@localhost` password via SQL.
- The `Redis` tab now includes an `Add key` form (DB index, key, value, TTL) and `POST /api/redis/keys` endpoint that writes keys via `redis-cli`.


## 2026-02-11 (update 8)

### RU
- Добавлен отдельный API `POST /api/panel/domain` для настройки домена самой панели: обновление `server_name` основного Nginx-конфига, автоматическое добавление `adminer/filebrowser` snippets, перезагрузка Nginx и (опционально) выпуск сертификата Let's Encrypt.
- В карточках панели добавлен новый блок `Panel domain access`, чтобы настраивать домен панели отдельно от пользовательских доменов проектов.
- Инструменты `Adminer` и `FileBrowser` встроены прямо в панель через iframe-блок `Tools embedded in panel`.
- В API создания домена (`/api/domains/create`) для режима привязки к панели теперь явно подключаются snippets `adminer` и `filebrowser`, чтобы ссылки на инструменты не отдавали 404 на таких доменах.
- Исправлены операции с MySQL: форма создания БД теперь поддерживает явный ввод пароля, а API `/api/databases/create` и `/api/databases/root-password` получили fallback на socket-аутентификацию для случаев, когда TCP-доступ `root` отключен.
- `install/install.sh` обновлен: переменные путей основного panel-конфига добавлены в `.env`, а include snippets для `adminer/filebrowser` подключаются в основном Nginx-сайте с безопасными заглушками до финальной настройки.

### EN
- Added dedicated `POST /api/panel/domain` API for panel domain configuration: updates main Nginx `server_name`, ensures `adminer/filebrowser` snippets are included, reloads Nginx, and optionally issues a Let's Encrypt certificate.
- Added a new `Panel domain access` block in the panel UI to configure panel domain separately from project domains.
- Embedded `Adminer` and `FileBrowser` directly into the panel using iframe-based `Tools embedded in panel` section.
- Updated domain creation API (`/api/domains/create`) so panel-bound domains explicitly include `adminer` and `filebrowser` snippets, preventing tool-link 404s on those domains.
- Fixed MySQL operations: DB creation form now supports explicit password input, and `/api/databases/create` + `/api/databases/root-password` now include socket-auth fallback when TCP `root` access is disabled.
- Updated `install/install.sh`: added main panel config path variables to `.env`, and wired `adminer/filebrowser` include snippets in the main Nginx site with safe placeholders before final setup.

## 2026-02-11 (update 9)

### RU
- Добавлен новый API-эндпоинт `GET /api/logs` для получения логов по разделам: `OLS access/error`, `Nginx`, `PHP`, `System`, `Auth`.
- Реализованы фильтрация по уровню (`all/error/warning/info`), поиск по тексту и ограничение количества строк (`limit`).
- На главной странице панели добавлен раздел `Logs` с табами разделов, строкой поиска, фильтрацией и кнопкой `Refresh`.

### EN
- Added a new `GET /api/logs` endpoint to read logs by sections: `OLS access/error`, `Nginx`, `PHP`, `System`, `Auth`.
- Implemented level filtering (`all/error/warning/info`), text search, and row limit control (`limit`).
- Added a new `Logs` section on the main panel page with section tabs, search input, filters, and `Refresh` button.
