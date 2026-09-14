from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import (
    Application,
    ApplicationStatus,
    House,
    InvoiceStatus,
    Occupancy,
    Payment,
    Project,
    User,
    UserRole,
)
from app.repositories import application_repository, lease_repository, maintenance_repository
from app.schemas import (
    ApplicationResponse,
    DashboardCounts,
    DashboardStatsResponse,
    EmployeeDashboardResponse,
    InvoiceResponse,
    LeaseResponse,
)


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


def get_employee_dashboard(db: Session, current_user: User) -> EmployeeDashboardResponse:
    lease = lease_repository.get_active_lease_by_employee(db, current_user.id)
    apps = application_repository.get_applications(db, employee_id=current_user.id, skip=0, limit=1)
    application = apps[0] if apps else None

    balance = 0.0
    next_due = None
    recent_invoices = []
    if lease is not None:
        from app.repositories import invoice_repository

        all_open = invoice_repository.get_open_invoices_for_lease(db, lease.id)
        balance = round(sum(float(i.balance_due) for i in all_open), 2)
        open_due = [i for i in all_open if i.status in (InvoiceStatus.OPEN, InvoiceStatus.PARTIAL)]
        if open_due:
            next_due = min(i.due_date for i in open_due)
        recent_invoices = invoice_repository.get_invoices(db, lease_id=lease.id, skip=0, limit=5)

    return EmployeeDashboardResponse(
        counts={
            "applications": application_repository.count_applications(db, employee_id=current_user.id),
            "open_maintenance": maintenance_repository.count_open_requests(db, employee_id=current_user.id),
            "active_invoice_count": len(recent_invoices),
        },
        application=ApplicationResponse.model_validate(application) if application else None,
        lease=LeaseResponse.model_validate(lease) if lease else None,
        account_balance=balance,
        next_invoice_due=next_due,
        recent_invoices=[InvoiceResponse.model_validate(i) for i in recent_invoices],
        open_maintenance=maintenance_repository.count_open_requests(db, employee_id=current_user.id),
    )
