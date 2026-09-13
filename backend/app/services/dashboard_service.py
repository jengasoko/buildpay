from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import (
    Application,
    ApplicationStatus,
    House,
    Occupancy,
    Payment,
    Project,
    User,
    UserRole,
)
from app.repositories import application_repository
from app.schemas import ApplicationResponse, DashboardCounts, DashboardStatsResponse


def get_dashboard_stats(db: Session) -> DashboardStatsResponse:
    users = db.query(User).count()
    employees = db.query(User).filter(User.role == UserRole.EMPLOYEE).count()
    employers = db.query(User).filter(User.role == UserRole.EMPLOYER).count()
    projects = db.query(Project).count()
    houses = db.query(House).count()
    available_houses = db.query(House).filter(House.available.is_(True)).count()
    occupied_houses = houses - available_houses

    applications = db.query(Application).count()
    pending = db.query(Application).filter(Application.status == ApplicationStatus.PENDING).count()
    employer_approved = db.query(Application).filter(Application.status == ApplicationStatus.EMPLOYER_APPROVED).count()
    financial_approved = (
        db.query(Application).filter(Application.status == ApplicationStatus.FINANCIAL_APPROVED).count()
    )
    rejected = db.query(Application).filter(Application.status == ApplicationStatus.REJECTED).count()

    payments = db.query(Payment).count()
    total_payment_amount = db.query(func.coalesce(func.sum(Payment.amount), 0)).scalar() or 0
    active_occupancies = db.query(Occupancy).filter(Occupancy.ended_at.is_(None)).count()

    recent_applications = application_repository.get_applications(db, skip=0, limit=5)

    counts = DashboardCounts(
        users=users,
        employees=employees,
        employers=employers,
        projects=projects,
        houses=houses,
        available_houses=available_houses,
        occupied_houses=occupied_houses,
        applications=applications,
        pending_applications=pending,
        employer_approved_applications=employer_approved,
        financial_approved_applications=financial_approved,
        rejected_applications=rejected,
        payments=payments,
        active_occupancies=active_occupancies,
    )
    return DashboardStatsResponse(
        counts=counts,
        total_payment_amount=float(total_payment_amount),
        recent_applications=[ApplicationResponse.model_validate(a) for a in recent_applications],
    )
