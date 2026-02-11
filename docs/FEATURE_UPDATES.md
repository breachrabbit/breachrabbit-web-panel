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
