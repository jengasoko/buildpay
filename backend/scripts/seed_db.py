#!/usr/bin/env python3
"""Seed the database with a rich demo dataset for Phase 5/6 (role workflows).

Every account this script creates uses a short, hardcoded, publicly-visible
password (see the printed credentials below) — it is for local development
and demos only. Never run it against a production database; use
scripts/create_admin.py to bootstrap a real production admin account
instead.
"""

import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models import (
    Application,
    ApplicationStatus,
    Employment,
    House,
    Notification,
    Occupancy,
    Payment,
    Project,
    User,
    UserRole,
)


def _now() -> datetime:
    return datetime.now(UTC)


def seed_db():
    if settings.ENVIRONMENT == "production":
        print(
            "Refusing to run: ENVIRONMENT=production. This script creates accounts "
            "with hardcoded, publicly-known passwords and must never touch a "
            "production database. Use scripts/create_admin.py instead."
        )
        sys.exit(1)

    db = SessionLocal()
    try:
        if db.query(User).filter(User.username == "admin").first():
            print("Data already seeded. Skipping.")
            return

        users = [
            User(
                username="admin",
                email="admin@hms.local",
                hashed_password=hash_password("admin123456"),
                first_name="Admin",
                last_name="User",
                role=UserRole.ADMIN,
                is_active=True,
                is_superuser=True,
            ),
            User(
                username="pm",
                email="pm@hms.local",
                hashed_password=hash_password("pm123456"),
                first_name="Project",
                last_name="Manager",
                role=UserRole.PROJECT_MANAGER,
                is_active=True,
            ),
            User(
                username="finance",
                email="finance@hms.local",
                hashed_password=hash_password("finance123"),
                first_name="Financial",
                last_name="Officer",
                role=UserRole.FINANCIAL_OFFICER,
                is_active=True,
            ),
            User(
                username="employer",
                email="employer@hms.local",
                hashed_password=hash_password("employer123"),
                first_name="Janet",
                last_name="Kimani",
                role=UserRole.EMPLOYER,
                is_active=True,
            ),
            User(
                username="brian",
                email="brian@hms.local",
                hashed_password=hash_password("brian123456"),
                first_name="Brian",
                last_name="Otieno",
                role=UserRole.EMPLOYEE,
                is_active=True,
                phone="+255711000001",
            ),
            User(
                username="amina",
                email="amina@hms.local",
                hashed_password=hash_password("amina123456"),
                first_name="Amina",
                last_name="Mohammed",
                role=UserRole.EMPLOYEE,
                is_active=True,
                phone="+255711000002",
            ),
            User(
                username="dorcas",
                email="dorcas@hms.local",
                hashed_password=hash_password("dorcas123"),
                first_name="Dorcas",
                last_name="Njeri",
                role=UserRole.EMPLOYEE,
                is_active=True,
                phone="+255711000003",
            ),
        ]
        db.add_all(users)
        db.commit()

        start = _now() - timedelta(days=120)
        projects = [
            Project(
                name="Green Meadows Phase 1",
                location="Mbezi Beach, Dar es Salaam",
                description="Affordable housing estate with 3-bedroom units.",
                start_date=start,
                expected_completion=start + timedelta(days=365),
            ),
            Project(
                name="Riverside Heights",
                location="Upanga, Dar es Salaam",
                description="Riverfront apartments for young professionals.",
                start_date=start - timedelta(days=60),
                expected_completion=start + timedelta(days=240),
            ),
        ]
        db.add_all(projects)
        db.commit()

        houses = [
            House(
                project_id=projects[0].id,
                title="Unit A1",
                location="Green Meadows, Block A",
                bedrooms=3,
                bathrooms=2,
                area_sqft=1250,
                rent_price=8500,
                price=1850000,
                available=True,
            ),
            House(
                project_id=projects[0].id,
                title="Unit A2",
                location="Green Meadows, Block A",
                bedrooms=3,
                bathrooms=2,
                area_sqft=1280,
                rent_price=9000,
                price=1920000,
                available=True,
            ),
            House(
                project_id=projects[0].id,
                title="Unit B1",
                location="Green Meadows, Block B",
                bedrooms=2,
                bathrooms=1,
                area_sqft=980,
                rent_price=7000,
                price=1450000,
                available=True,
            ),
            House(
                project_id=projects[0].id,
                title="Unit B2",
                location="Green Meadows, Block B",
                bedrooms=2,
                bathrooms=1,
                area_sqft=1020,
                rent_price=7200,
                price=1490000,
                available=False,
            ),
            House(
                project_id=projects[1].id,
                title="Flat 3C",
                location="Riverside Heights, Tower 1",
                bedrooms=1,
                bathrooms=1,
                area_sqft=620,
                rent_price=12000,
                price=2600000,
                available=True,
            ),
            House(
                project_id=projects[1].id,
                title="Flat 4D",
                location="Riverside Heights, Tower 1",
                bedrooms=2,
                bathrooms=2,
                area_sqft=860,
                rent_price=15500,
                price=3200000,
                available=True,
            ),
        ]
        db.add_all(houses)
        db.commit()

        employees = {u.username: u for u in db.query(User).filter(User.role == UserRole.EMPLOYEE).all()}
        applications = [
            Application(
                employee_id=employees["brian"].id,
                house_id=houses[0].id,
                status=ApplicationStatus.PENDING,
                created_at=_now() - timedelta(days=3),
            ),
            Application(
                employee_id=employees["amina"].id,
                house_id=houses[1].id,
                status=ApplicationStatus.EMPLOYER_APPROVED,
                created_at=_now() - timedelta(days=6),
            ),
            Application(
                employee_id=employees["dorcas"].id,
                house_id=houses[3].id,
                status=ApplicationStatus.FINANCIAL_APPROVED,
                created_at=_now() - timedelta(days=20),
            ),
        ]
        db.add_all(applications)
        db.commit()

        payments = [
            Payment(
                application_id=applications[2].id,
                amount=250000,
                reference="PAY-2026-0001",
                payment_date=_now() - timedelta(days=15),
            ),
            Payment(
                amount=50000,
                reference="PAY-2026-0002",
                payment_date=_now() - timedelta(days=2),
            ),
        ]
        db.add_all(payments)

        employer = db.query(User).filter(User.username == "employer").first()
        employments = [
            Employment(employer_id=employer.id, employee_id=employees["brian"].id),
            Employment(employer_id=employer.id, employee_id=employees["amina"].id),
            Employment(employer_id=employer.id, employee_id=employees["dorcas"].id),
        ]
        db.add_all(employments)

        occupancy = Occupancy(
            application_id=applications[2].id,
            house_id=houses[3].id,
            employee_id=employees["dorcas"].id,
            started_at=_now() - timedelta(days=15),
        )
        db.add(occupancy)

        notifications = [
            Notification(
                user_id=employees["brian"].id,
                title="New housing application",
                message="Brian Otieno applied for Unit A1 and awaits review.",
            ),
            Notification(
                user_id=employees["amina"].id,
                title="Application employer-approved",
                message="Janet Kimani approved your application for Unit A2.",
                is_read=True,
            ),
            Notification(
                user_id=employer.id,
                title="New housing application",
                message="Brian Otieno applied for Unit A1 and awaits your review.",
            ),
            Notification(
                user_id=employees["dorcas"].id,
                title="Application financially approved",
                message="Your application for Unit B2 was financially approved. Move-in confirmed.",
                is_read=True,
            ),
        ]
        db.add_all(notifications)
        db.commit()

        print("Seed complete.")
        print("Users: admin / admin123456, pm / pm123456, finance / finance123")
        print("Users: employer / employer123, brian / brian123456, amina / amina123456, dorcas / dorcas123")
        print(
            f"Projects: {len(projects)}, Houses: {len(houses)}, "
            f"Applications: {len(applications)}, Payments: {len(payments)}, "
            f"Employments: {len(employments)}, Occupancies: 1, Notifications: {len(notifications)}"
        )
    finally:
        db.close()


if __name__ == "__main__":
    seed_db()
