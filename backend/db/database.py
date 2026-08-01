"""
Database connection and session management for FermentAI.

Uses SQLite for V1 — simple, no separate service needed,
fits the free-tier deployment constraint.
"""

from __future__ import annotations

import os
from pathlib import Path
from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from db.models import Base

# Default database path: backend/data/processed/fermentai.db
_DEFAULT_DB_DIR = Path(__file__).parent.parent / "data" / "processed"
_DEFAULT_DB_PATH = _DEFAULT_DB_DIR / "fermentai.db"

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    os.environ.get(
        "FERMENTAI_DATABASE_URL",
        f"sqlite:///{_DEFAULT_DB_PATH}"
    )
)


@event.listens_for(Engine, "connect")
def _set_sqlite_pragma(dbapi_connection, connection_record):
    """Enable WAL mode and foreign keys for SQLite (skip for Postgres)."""
    # Only run SQLite pragmas if it's an sqlite3 connection
    if "sqlite" in type(dbapi_connection).__module__:
        try:
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()
        except Exception:
            pass


def get_engine(url: str | None = None) -> Engine:
    """Create a SQLAlchemy engine."""
    db_url = url or DATABASE_URL
    # Ensure parent directory exists for SQLite
    if db_url.startswith("sqlite:///"):
        db_path = Path(db_url.replace("sqlite:///", ""))
        db_path.parent.mkdir(parents=True, exist_ok=True)
    return create_engine(db_url, echo=False)


def init_db(engine: Engine | None = None) -> Engine:
    """
    Initialize the database: create all tables if they don't exist.
    Returns the engine.
    """
    if engine is None:
        engine = get_engine()
    Base.metadata.create_all(engine)
    return engine


def get_session_factory(engine: Engine | None = None) -> sessionmaker[Session]:
    """Create a session factory bound to the given engine."""
    if engine is None:
        engine = get_engine()
    return sessionmaker(bind=engine, expire_on_commit=False)


@contextmanager
def get_session(engine: Engine | None = None) -> Generator[Session, None, None]:
    """
    Context manager that yields a database session.
    Commits on success, rolls back on error.
    """
    factory = get_session_factory(engine)
    session = factory()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


# ── Convenience: module-level engine (lazy init) ────────────────────────

_engine: Engine | None = None


def get_default_engine() -> Engine:
    """Get or create the default engine (singleton)."""
    global _engine
    if _engine is None:
        _engine = init_db()
    return _engine
