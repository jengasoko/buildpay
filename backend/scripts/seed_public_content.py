#!/usr/bin/env python3
"""Phase 4: seed public website content (featured projects + images).

Idempotent: safe to run repeatedly and alongside scripts/seed_db.py.
Image URLs reference the static images served by the frontend (/images/...).
"""

import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.database import SessionLocal
from app.models import House, Project, ProjectStatus

PROJECT_IMAGES = [
    "/images/bg-construction-1.jpg",
    "/images/bg-construction-2.jpg",
    "/images/bg-construction-3.jpg",
    "/images/bg-house-1.jpg",
    "/images/bg-house-2.jpg",
    "/images/bg-house-3.jpg",
]

HOUSE_IMAGES = ["/images/bg-house-1.jpg", "/images/bg-house-2.jpg", "/images/bg-house-3.jpg"]

# (name, location, description, status, image)
FEATURED_PROJECTS = [
    (
        "Green Meadows Phase 1",
        "Mbezi Beach, Dar es Salaam",
        "Affordable 2- and 3-bedroom units with manicured compounds, borehole water, "
        "a community playground and on-site security.",
        ProjectStatus.ONGOING,
        "/images/bg-house-1.jpg",
    ),
    (
        "Riverside Heights",
        "Upanga, Dar es Salaam",
        "Riverfront apartments for young professionals, steps from the office park with "
        "gym, co-working lounge and rooftop views.",
        ProjectStatus.ONGOING,
        "/images/bg-construction-1.jpg",
    ),
    (
        "Umoja Tech Park",
        "Ubungo, Dar es Salaam",
        "Mixed-use business park with serviced offices, retail ground floor and flex light-industrial workshops.",
        ProjectStatus.PLANNED,
        "/images/bg-construction-2.jpg",
    ),
    (
        "Oyster Bay Executive Villas",
        "Oyster Bay, Dar es Salaam",
        "Five bespoke executive villas with landscaped gardens, double garages and "
        "smart-home systems, delivered ahead of schedule.",
        ProjectStatus.COMPLETED,
        "/images/bg-house-2.jpg",
    ),
    (
        "Kariakoo Student Apartments",
        "Kariakoo, Dar es Salaam",
        "Furnished 1- and 2-bedroom apartments near campus with 24/7 security, "
        "high-speed internet and flexible lease terms.",
        ProjectStatus.ONGOING,
        "/images/bg-construction-3.jpg",
    ),
    (
        "Morogoro Worker Housing Scheme",
        "Morogoro, Morogoro",
        "Two hundred staff units delivered for a flagship agribusiness estate, complete "
        "with social halls, ablution blocks and paved access roads.",
        ProjectStatus.COMPLETED,
        "/images/bg-house-3.jpg",
    ),
]


def _now() -> datetime:
    return datetime.now(UTC)


def seed_public_content():
    db = SessionLocal()
    try:
        seeded = 0
        for index, (name, location, description, status, image) in enumerate(FEATURED_PROJECTS):
            project = db.query(Project).filter(Project.name == name).first()
            if not project:
                start = _now() - timedelta(days=60 + index * 45)
                project = Project(
                    name=name,
                    location=location,
                    description=description,
                    start_date=start,
                    expected_completion=start + timedelta(days=300 + index * 30),
                )
                db.add(project)
                db.flush()
                seeded += 1
            if not project.description:
                project.description = description
            project.status = status
            project.image_url = image
            project.is_featured = True

        featured_names = {p[0] for p in FEATURED_PROJECTS}
        for index, house in enumerate(db.query(House).filter(House.image_url.is_(None)).order_by(House.id).all()):
            if house.project and house.project.name in featured_names:
                house.image_url = HOUSE_IMAGES[index % len(HOUSE_IMAGES)]

        db.commit()

        total_projects = db.query(Project).count()
        featured = db.query(Project).filter(Project.is_featured.is_(True)).count()
        with_images = db.query(House).filter(House.image_url.is_not(None)).count()
        print("Seed complete.")
        print(f"Projects: {total_projects} (featured: {featured}, newly added: {seeded})")
        print(f"Houses with images: {with_images}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_public_content()
