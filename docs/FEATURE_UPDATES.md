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
