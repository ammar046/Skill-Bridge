"""
Durable assessment storage for policymaker aggregates.

Replaces the in-process list with SQLite so assessments survive redeploys
on a single instance. For multi-instance production, point all workers at
a shared database file or migrate to Postgres.
"""

from __future__ import annotations

import json
import logging
import sqlite3
import threading
from pathlib import Path

logger = logging.getLogger(__name__)

MAX_ASSESSMENTS = 1000

_LOCK = threading.Lock()


def _backend_root() -> Path:
    return Path(__file__).resolve().parent.parent


def db_path() -> Path:
    data_dir = _backend_root() / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    return data_dir / "assessments.sqlite"


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(str(db_path()), check_same_thread=False)
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db() -> None:
    """Create table and seed from JSON when the database is empty (idempotent)."""
    with _LOCK:
        conn = _connect()
        try:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS assessments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    payload TEXT NOT NULL
                )
                """
            )
            conn.commit()
            row = conn.execute("SELECT COUNT(*) FROM assessments").fetchone()
            count = int(row[0]) if row else 0
            if count == 0:
                seed_path = _backend_root() / "config" / "seed_assessments.json"
                try:
                    with open(seed_path, "r", encoding="utf-8") as f:
                        seed = json.load(f)
                    if isinstance(seed, list):
                        conn.executemany(
                            "INSERT INTO assessments (payload) VALUES (?)",
                            [(json.dumps(rec, ensure_ascii=False),) for rec in seed],
                        )
                        conn.commit()
                        logger.info("Seeded %d assessment records from %s", len(seed), seed_path)
                except Exception as exc:
                    logger.warning("Could not seed assessments: %s", exc)
        finally:
            conn.close()


def fetch_all() -> list[dict]:
    """Return all assessment records (newest rows have higher id)."""
    init_db()
    with _LOCK:
        conn = _connect()
        try:
            rows = conn.execute(
                "SELECT payload FROM assessments ORDER BY id ASC"
            ).fetchall()
            out: list[dict] = []
            for (payload,) in rows:
                try:
                    out.append(json.loads(payload))
                except json.JSONDecodeError:
                    continue
            return out
        finally:
            conn.close()


def append_record(record: dict) -> None:
    """Persist one assessment and trim to MAX_ASSESSMENTS oldest rows."""
    init_db()
    payload = json.dumps(record, ensure_ascii=False)
    with _LOCK:
        conn = _connect()
        try:
            conn.execute("INSERT INTO assessments (payload) VALUES (?)", (payload,))
            conn.commit()
            row = conn.execute("SELECT COUNT(*) FROM assessments").fetchone()
            n = int(row[0]) if row else 0
            if n > MAX_ASSESSMENTS:
                to_drop = n - MAX_ASSESSMENTS
                conn.execute(
                    """
                    DELETE FROM assessments WHERE id IN (
                        SELECT id FROM assessments ORDER BY id ASC LIMIT ?
                    )
                    """,
                    (to_drop,),
                )
                conn.commit()
        finally:
            conn.close()
