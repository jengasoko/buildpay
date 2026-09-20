from datetime import UTC, datetime

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import (
    Application,
    ApplicationStatus,
    Employment,
    House,
    Invoice,
    InvoiceStatus,
    Lease,
    LeaseStatus,
    MaintenanceRequest,
    MaintenanceStatus,
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
    EmployerDashboardResponse,
    EmployerStaffSummary,
    EmployerTeamLease,
    FinancialDashboardResponse,
    InvoiceResponse,
    LeaseResponse,
    PaymentResponse,
)

_OPEN_MAINTENANCE_STATUSES = (MaintenanceStatus.SUBMITTED, MaintenanceStatus.ASSIGNED)


def _naive(dt: datetime) -> datetime:
    if dt is not None and dt.tzinfo is not None:
        return dt.replace(tzinfo=None)
    return dt


def _team_employee_ids(db: Session, employer_id: int) -> list[int]:
    return [
        e.employee_id
        for e in db.query(Employment).filter(Employment.employer_id == employer_id).all()
    ]


def get_dashboard_stats(db: Session, current_user: User) -> DashboardStatsResponse:
    if current_user.role == UserRole.EMPLOYER:
        return _employer_scoped_stats(db, current_user)
    if current_user.role == UserRole.EMPLOYEE:
        return _employee_scoped_stats(db, current_user)
    return _system_stats(db)


def _system_stats(db: Session) -> DashboardStatsResponse:
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


def _employer_scoped_stats(db: Session, employer: User) -> DashboardStatsResponse:
    team_ids = _team_employee_ids(db, employer.id)
    team_filter = team_ids or [0]

    employees = db.query(User).filter(User.id.in_(team_filter)).count()
    applications = application_repository.count_applications(db, team_ids=team_filter)
    pending = application_repository.count_applications(db, team_ids=team_filter, status=ApplicationStatus.PENDING)

    team_leases = db.query(Lease).filter(Lease.employee_id.in_(team_filter)).all()
    team_house_ids = {lease.house_id for lease in team_leases}
    active_lease_house_ids = {lease.house_id for lease in team_leases if lease.status == LeaseStatus.ACTIVE}

    payments = (
        db.query(Payment)
        .join(Invoice, Payment.invoice_id == Invoice.id)
        .join(Lease, Invoice.lease_id == Lease.id)
        .filter(Lease.employee_id.in_(team_filter))
        .count()
    )
    total_payment_amount = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .join(Invoice, Payment.invoice_id == Invoice.id)
        .join(Lease, Invoice.lease_id == Lease.id)
        .filter(Lease.employee_id.in_(team_filter))
        .scalar()
        or 0
    )

    recent_applications = application_repository.get_applications(db, team_ids=team_filter, skip=0, limit=5)

    counts = DashboardCounts(
        users=employees,
        employees=employees,
        employers=1,
        projects=0,
        houses=len(team_house_ids),
        available_houses=max(0, len(team_house_ids) - len(active_lease_house_ids)),
        occupied_houses=len(active_lease_house_ids),
        applications=applications,
        pending_applications=pending,
        employer_approved_applications=0,
        financial_approved_applications=0,
        rejected_applications=0,
        payments=payments,
        active_occupancies=len(active_lease_house_ids),
    )
    return DashboardStatsResponse(
        counts=counts,
        total_payment_amount=float(total_payment_amount),
        recent_applications=[ApplicationResponse.model_validate(a) for a in recent_applications],
    )


def _employee_scoped_stats(db: Session, employee: User) -> DashboardStatsResponse:
    apps = application_repository.count_applications(db, employee_id=employee.id)
    active_lease = lease_repository.get_active_lease_by_employee(db, employee.id)
    counts = DashboardCounts(
        users=1,
        employees=1,
        employers=0,
        projects=0,
        houses=1 if active_lease else 0,
        available_houses=0,
        occupied_houses=1 if active_lease else 0,
        applications=apps,
        pending_applications=0,
        employer_approved_applications=0,
        financial_approved_applications=0,
        rejected_applications=0,
        payments=0,
        active_occupancies=1 if active_lease else 0,
    )
    return DashboardStatsResponse(
        counts=counts,
        total_payment_amount=0.0,
        recent_applications=[],
    )


def get_employer_dashboard(db: Session, employer: User) -> EmployerDashboardResponse:
    team_ids = _team_employee_ids(db, employer.id)
    team_filter = team_ids or [0]

    staff_total = len(team_ids)

    applications = application_repository.get_applications(db, team_ids=team_filter, skip=0, limit=8)
    pending_count = application_repository.count_applications(db, team_ids=team_filter, status=ApplicationStatus.PENDING)

    leases = db.query(Lease).filter(Lease.employee_id.in_(team_filter)).all()
    active_leases = [lease for lease in leases if lease.status == LeaseStatus.ACTIVE]
    staff_with_lease = len({lease.employee_id for lease in active_leases})
    team_house_ids = {lease.house_id for lease in leases}

    open_maintenance = (
        db.query(MaintenanceRequest)
        .filter(
            MaintenanceRequest.employee_id.in_(team_filter),
            MaintenanceRequest.status.in_(_OPEN_MAINTENANCE_STATUSES),
        )
        .count()
    )

    username_map = {
        u.id: u.username
        for u in db.query(User).filter(User.id.in_(team_filter)).all()
    }
    house_map = {h.id: h for h in db.query(House).filter(House.id.in_(team_house_ids or {0})).all()}

    team_leases = [
        EmployerTeamLease(
            employee_username=username_map.get(lease.employee_id, ""),
            house_title=house_map[lease.house_id].title if lease.house_id in house_map else "",
            room_number=None,
            start_date=lease.start_date,
            status=lease.status.value,
        )
        for lease in sorted(active_leases, key=lambda x: _naive(x.start_date) or datetime.min, reverse=True)
    ]

    return EmployerDashboardResponse(
        staff=EmployerStaffSummary(
            total=staff_total,
            with_lease=staff_with_lease,
            pending_approval=pending_count,
        ),
        team_houses=len(team_house_ids),
        pending_applications=pending_count,
        active_leases=len(active_leases),
        open_maintenance=open_maintenance,
        recent_applications=[ApplicationResponse.model_validate(a) for a in applications],
        team_leases=team_leases,
    )


def get_finance_dashboard(db: Session) -> FinancialDashboardResponse:
    from app.repositories import payment_repository
    from app.services import analytics_service, billing_service

    now = datetime.now(UTC)
    now_naive = _naive(now)
    month_start_naive = now_naive.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    collected_this_month = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(Payment.payment_date >= month_start_naive)
        .scalar()
        or 0
    )
    collected_all_time = db.query(func.coalesce(func.sum(Payment.amount), 0)).scalar() or 0

    arrears = billing_service.arrears_summary(db)

    open_invoices = db.query(Invoice).filter(Invoice.status.in_((InvoiceStatus.OPEN, InvoiceStatus.PARTIAL))).count()
    active_leases = lease_repository.count_active_leases(db)

    recent_payments = payment_repository.get_payments(db, skip=0, limit=6)

    collection_rate = 0.0
    trend_keys = analytics_service._last_n_month_keys(12)
    trend_start = analytics_service._month_start(trend_keys[0])
    invoiced = (
        db.query(func.coalesce(func.sum(Invoice.total_amount), 0))
        .filter(Invoice.period_end >= trend_start)
        .scalar()
        or 0
    )
    collected_12m = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(Payment.payment_date >= trend_start)
        .scalar()
        or 0
    )
    if invoiced > 0:
        collection_rate = round(float(collected_12m) / float(invoiced) * 100, 1)

    return FinancialDashboardResponse(
        month=now_naive.month,
        year=now_naive.year,
        collected_this_month=float(collected_this_month),
        collected_all_time=float(collected_all_time),
        outstanding=arrears.total_outstanding,
        overdue=arrears.total_overdue,
        collection_rate=collection_rate,
        open_invoices=open_invoices,
        active_leases=active_leases,
        recent_payments=[PaymentResponse.model_validate(p) for p in recent_payments],
        arrears=arrears.buckets,
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
