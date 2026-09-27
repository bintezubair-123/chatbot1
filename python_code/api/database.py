"""
database.py — SQLite user store for authentication.

Uses only Python stdlib sqlite3, so no extra dependencies are needed.
The DB file is placed at the same directory as this module so it
persists across restarts in local dev and on platforms with a
mounted disk (Render, Railway with volume).

On a fresh deploy the table is created automatically on first import.
"""
from __future__ import annotations

import os
import sqlite3
from pathlib import Path
from typing import TypedDict

# ── Database location ──────────────────────────────────────────────────────
# Allow override via env var (e.g. a mounted volume on Railway/Render).
_DEFAULT_DB_PATH = Path(__file__).resolve().parent / "users.db"
DB_PATH: str = os.getenv("AUTH_DB_PATH", str(_DEFAULT_DB_PATH))


# ── Schema ─────────────────────────────────────────────────────────────────
_CREATE_USERS_TABLE = """
CREATE TABLE IF NOT EXISTS users (
    id           TEXT PRIMARY KEY,          -- UUID string
    name         TEXT NOT NULL,
    email        TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role         TEXT NOT NULL DEFAULT 'user',
    created_at   TEXT NOT NULL,             -- ISO-8601 UTC
    updated_at   TEXT NOT NULL              -- ISO-8601 UTC
);
"""


def get_connection() -> sqlite3.Connection:
    """Return a thread-safe connection with row_factory set."""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Create tables if they don't exist. Called once at app startup."""
    with get_connection() as conn:
        conn.execute(_CREATE_USERS_TABLE)
        conn.commit()


# ── Typed dict returned to callers (never includes password_hash) ──────────
class UserRecord(TypedDict):
    id: str
    name: str
    email: str
    role: str
    created_at: str
    updated_at: str


class UserRecordWithHash(UserRecord):
    password_hash: str


# ── CRUD helpers ───────────────────────────────────────────────────────────

def create_user(
    *,
    user_id: str,
    name: str,
    email: str,
    password_hash: str,
    role: str = "user",
    created_at: str,
    updated_at: str,
) -> UserRecord:
    """Insert a new user row and return the public record (no hash)."""
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (user_id, name, email, password_hash, role, created_at, updated_at),
        )
        conn.commit()
    return UserRecord(
        id=user_id,
        name=name,
        email=email,
        role=role,
        created_at=created_at,
        updated_at=updated_at,
    )


def get_user_by_email(email: str) -> UserRecordWithHash | None:
    """Return the full row (including hash) or None."""
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM users WHERE email = ? COLLATE NOCASE", (email,)
        ).fetchone()
    if row is None:
        return None
    return UserRecordWithHash(
        id=row["id"],
        name=row["name"],
        email=row["email"],
        password_hash=row["password_hash"],
        role=row["role"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def get_user_by_id(user_id: str) -> UserRecord | None:
    """Return the public record (no hash) or None."""
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM users WHERE id = ?", (user_id,)
        ).fetchone()
    if row is None:
        return None
    return UserRecord(
        id=row["id"],
        name=row["name"],
        email=row["email"],
        role=row["role"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def email_exists(email: str) -> bool:
    """Fast existence check without fetching all columns."""
    with get_connection() as conn:
        row = conn.execute(
            "SELECT 1 FROM users WHERE email = ? COLLATE NOCASE LIMIT 1", (email,)
        ).fetchone()
    return row is not None
