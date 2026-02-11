from __future__ import annotations

import hashlib
import secrets
import sqlite3
from datetime import UTC, datetime, timedelta
from pathlib import Path

from .database import MANAGED_DB_DIR, get_conn


class DatabaseAlreadyExistsError(Exception):
    pass


class DatabaseNotFoundError(Exception):
    pass


class InvalidAdminTokenError(Exception):
    pass


def now_iso() -> str:
    return datetime.now(UTC).isoformat()


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def write_audit(action: str, db_name: str, db_user: str | None, details: str | None) -> None:
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO audit_logs(action, db_name, db_user, details, created_at) VALUES (?, ?, ?, ?, ?)",
            (action, db_name, db_user, details, now_iso()),
        )


def create_database_and_user(db_name: str, user: str, password: str) -> None:
    db_path = MANAGED_DB_DIR / f"{db_name}.db"

    with get_conn() as conn:
        exists = conn.execute("SELECT 1 FROM managed_databases WHERE db_name = ?", (db_name,)).fetchone()
        if exists:
            raise DatabaseAlreadyExistsError(db_name)

        sqlite3.connect(db_path).close()
        conn.execute(
            "INSERT INTO managed_databases(db_name, db_user, password_hash, created_at) VALUES (?, ?, ?, ?)",
            (db_name, user, hash_password(password), now_iso()),
        )

    write_audit("create_database_and_user", db_name, user, "Database and user were created")


def delete_database(db_name: str) -> None:
    db_path = MANAGED_DB_DIR / f"{db_name}.db"

    with get_conn() as conn:
        row = conn.execute(
            "SELECT db_user FROM managed_databases WHERE db_name = ?",
            (db_name,),
        ).fetchone()
        if not row:
            raise DatabaseNotFoundError(db_name)

        conn.execute("DELETE FROM managed_databases WHERE db_name = ?", (db_name,))
        conn.execute("DELETE FROM admin_tokens WHERE db_name = ?", (db_name,))

    if db_path.exists():
        db_path.unlink()

    write_audit("delete_database", db_name, row["db_user"], "Database was deleted")


def change_user_password(db_name: str, new_password: str) -> None:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT db_user FROM managed_databases WHERE db_name = ?",
            (db_name,),
        ).fetchone()
        if not row:
            raise DatabaseNotFoundError(db_name)

        conn.execute(
            "UPDATE managed_databases SET password_hash = ? WHERE db_name = ?",
            (hash_password(new_password), db_name),
        )

    write_audit("change_user_password", db_name, row["db_user"], "Password was rotated")


def list_databases() -> list[dict[str, str]]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT db_name, db_user, created_at FROM managed_databases ORDER BY created_at DESC"
        ).fetchall()
    return [dict(row) for row in rows]


def create_admin_token(db_name: str, ttl_seconds: int = 300) -> str:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT db_user FROM managed_databases WHERE db_name = ?",
            (db_name,),
        ).fetchone()
        if not row:
            raise DatabaseNotFoundError(db_name)

        token = secrets.token_urlsafe(24)
        expires_at = (datetime.now(UTC) + timedelta(seconds=ttl_seconds)).isoformat()
        conn.execute(
            "INSERT INTO admin_tokens(token, db_name, expires_at, used, created_at) VALUES (?, ?, ?, 0, ?)",
            (token, db_name, expires_at, now_iso()),
        )

    write_audit("issue_admin_token", db_name, row["db_user"], "Short-lived admin token issued")
    return token


def validate_admin_token(token: str) -> tuple[str, Path]:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT db_name, expires_at, used FROM admin_tokens WHERE token = ?",
            (token,),
        ).fetchone()
        if not row:
            raise InvalidAdminTokenError("Token not found")

        if row["used"]:
            raise InvalidAdminTokenError("Token already used")

        expires_at = datetime.fromisoformat(row["expires_at"])
        if datetime.now(UTC) > expires_at:
            raise InvalidAdminTokenError("Token is expired")

        conn.execute("UPDATE admin_tokens SET used = 1 WHERE token = ?", (token,))

    db_name = row["db_name"]
    db_path = MANAGED_DB_DIR / f"{db_name}.db"
    if not db_path.exists():
        raise InvalidAdminTokenError("Managed DB file does not exist")

    return db_name, db_path


def inspect_sqlite_database(db_path: Path) -> list[str]:
    with sqlite3.connect(db_path) as conn:
        rows = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        ).fetchall()
    return [row[0] for row in rows]


def list_audit_logs(limit: int = 200) -> list[dict[str, str]]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT action, db_name, db_user, details, created_at FROM audit_logs ORDER BY id DESC LIMIT ?",
            (limit,),
        ).fetchall()
    return [dict(row) for row in rows]
