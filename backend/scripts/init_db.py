#!/usr/bin/env python3
"""Initialize the database tables."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.database import Base, engine
from app.models import House, Project, User  # noqa: F401  (registers models with Base.metadata)


def init_db():
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully.")


if __name__ == "__main__":
    init_db()
