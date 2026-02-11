from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DB = BASE_DIR / "panel.db"
MANAGED_DB_DIR = BASE_DIR / "managed_dbs"


def init_storage() -> None:
    MANAGED_DB_DIR.mkdir(exist_ok=True)
    with sqlite3.connect(DATA_DB) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS managed_databases (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                db_name TEXT UNIQUE NOT NULL,
                db_user TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                action TEXT NOT NULL,
                db_name TEXT NOT NULL,
                db_user TEXT,
                details TEXT,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS admin_tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                token TEXT UNIQUE NOT NULL,
                db_name TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                used INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
            )
            """
        )


@contextmanager
def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DATA_DB)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()
