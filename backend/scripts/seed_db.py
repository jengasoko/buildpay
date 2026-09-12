#!/usr/bin/env python3
"""Seed the database with initial data."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models import User, UserRole


def seed_db():
    db = SessionLocal()
    try:
        if db.query(User).filter(User.username == "admin").first():
            print("Admin user already exists. Skipping seed.")
            return

        admin = User(
            username="admin",
            email="admin@hms.local",
            hashed_password=hash_password("admin123456"),
            first_name="Admin",
            last_name="User",
            role=UserRole.ADMIN,
            is_active=True,
            is_superuser=True,
        )
        db.add(admin)
        db.commit()
        print("Admin user created: admin / admin123456")
    finally:
        db.close()


if __name__ == "__main__":
    seed_db()
