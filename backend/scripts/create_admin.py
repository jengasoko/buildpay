#!/usr/bin/env python3
"""Bootstrap a single production admin account.

Unlike scripts/seed_db.py (demo data, hardcoded passwords, dev-only), this
creates exactly one admin user from credentials you supply — nothing else is
seeded. Intended for one-off use against a fresh production database:

    ADMIN_USERNAME=someadmin \\
    ADMIN_EMAIL=someadmin@yourcompany.com \\
    ADMIN_PASSWORD='a-strong-unique-password' \\
    python scripts/create_admin.py

Safe to re-run: it exits without changes if that username or email already
exists.
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models import User, UserRole

MIN_PASSWORD_LENGTH = 8


def create_admin(db: Session, *, username: str, email: str, password: str) -> User | None:
    """Creates an admin user. Returns None (no-op) if one already exists with
    that username or email. Raises ValueError if the password is too short."""
    if len(password) < MIN_PASSWORD_LENGTH:
        raise ValueError(f"ADMIN_PASSWORD must be at least {MIN_PASSWORD_LENGTH} characters.")

    existing = db.query(User).filter((User.username == username) | (User.email == email)).first()
    if existing:
        return None

    admin = User(
        username=username,
        email=email,
        hashed_password=hash_password(password),
        role=UserRole.ADMIN,
        is_active=True,
        is_superuser=True,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


def main():
    username = os.environ.get("ADMIN_USERNAME")
    email = os.environ.get("ADMIN_EMAIL")
    password = os.environ.get("ADMIN_PASSWORD")

    missing = [
        name
        for name, value in (("ADMIN_USERNAME", username), ("ADMIN_EMAIL", email), ("ADMIN_PASSWORD", password))
        if not value
    ]
    if missing:
        print(f"Missing required environment variable(s): {', '.join(missing)}")
        sys.exit(1)

    db = SessionLocal()
    try:
        try:
            admin = create_admin(db, username=username, email=email, password=password)
        except ValueError as exc:
            print(str(exc))
            sys.exit(1)

        if admin is None:
            print(f"User with username '{username}' or email '{email}' already exists. Skipping.")
        else:
            print(f"Admin user '{username}' created.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
