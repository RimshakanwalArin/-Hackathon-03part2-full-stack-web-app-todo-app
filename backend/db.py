"""
Database connection and session management for PostgreSQL
Maps to @specs/database/schema.md
"""

import os
from sqlmodel import create_engine, Session
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Database URL configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./todoapp.db"
)

# Create SQLAlchemy engine
# SQLite doesn't need pool configuration
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        echo=os.getenv("SQL_ECHO", "false").lower() == "true",
        future=True,
        connect_args={"check_same_thread": False},
    )
else:
    engine = create_engine(
        DATABASE_URL,
        echo=os.getenv("SQL_ECHO", "false").lower() == "true",
        future=True,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,  # Verify connections before using
    )

# Create session factory
SessionLocal = sessionmaker(
    engine,
    class_=Session,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


def get_session():
    """Dependency for getting database session"""
    print("[DEBUG] db:get_session >> Creating new database session")
    try:
        with SessionLocal() as session:
            print("[DEBUG] db:get_session >> Database session opened successfully")
            yield session
            print("[DEBUG] db:get_session >> Database session closed successfully")
    except Exception as e:
        print(f"[ERROR] db:get_session >> {type(e).__name__}: {str(e)}")
        raise


async def create_db_and_tables():
    """Create database tables (called on startup)"""
    print("[DEBUG] db:create_db_and_tables >> Starting database initialization")
    try:
        from models import SQLModel
        print(f"[DEBUG] db:create_db_and_tables >> Database URL: {DATABASE_URL.split('://')[0]}://*** | engine_type={'sqlite' if DATABASE_URL.startswith('sqlite') else 'postgresql'}")
        SQLModel.metadata.create_all(engine)
        print("[DEBUG] db:create_db_and_tables >> All database tables created/verified successfully")
    except Exception as e:
        print(f"[ERROR] db:create_db_and_tables >> {type(e).__name__}: {str(e)}")
        raise


async def close_db():
    """Close database connections (called on shutdown)"""
    print("[DEBUG] db:close_db >> Closing database connections")
    try:
        engine.dispose()
        print("[DEBUG] db:close_db >> Database connections closed successfully")
    except Exception as e:
        print(f"[ERROR] db:close_db >> {type(e).__name__}: {str(e)}")
        raise
