# breachrabbit-web-panel

Минимальная web-панель для управления изолированными SQLite БД:

- создание БД и пользователя,
- удаление БД,
- смена пароля пользователя,
- аудит-лог по каждому действию,
- защищенный Adminer-аналог по short-lived one-time токену,
- страница `Databases` с таблицей `db_name`, `user`, `created_at`, `actions`.

## Запуск

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

После запуска откройте: http://127.0.0.1:8000/

## Тесты

```bash
pytest
```
