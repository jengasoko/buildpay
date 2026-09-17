from calendar import monthrange
from datetime import UTC, datetime, timedelta

from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestException, ForbiddenException, NotFoundException
from app.models import (
    ChargeType,
    Employment,
    House,
    Invoice,
    InvoiceStatus,
    Lease,
    LeaseStatus,
    Payment,
    User,
    UserRole,
)
from app.repositories import invoice_repository, lease_repository, payment_repository
from app.schemas import (
    ArrearsBucket,
    ArrearsSummary,
    FinancialReport,
    InvoiceAllocateRequest,
    InvoiceResponse,
    LeaseResponse,
    OccupancyReport,
    StatementEntry,
    StatementOfAccount,
)
from app.services import notification_service
from app.services.logs import log_event

FINANCE_ROLES = (UserRole.ADMIN, UserRole.FINANCIAL_OFFICER, UserRole.PROJECT_MANAGER)


def _month_bounds(year: int, month: int) -> tuple[int, int]:
    return 1, monthrange(year, month)[1]


def _team_employee_ids(db: Session, employer_id: int) -> list[int]:
    return [e.employee_id for e in db.query(Employment).filter_by(employer_id=employer_id).all()]


def _next_month_start(d: datetime) -> datetime:
    if d.month == 12:
        return datetime(d.year + 1, 1, 1)
    return datetime(d.year, d.month + 1, 1)


def _month_end(d: datetime) -> datetime:
    last = monthrange(d.year, d.month)[1]
    return datetime(d.year, d.month, last)


def _naive(d: datetime) -> datetime:
    """Strip tzinfo so values read from PG (timestamptz) compare cleanly against naive UTC nows."""
    return d.replace(tzinfo=None) if d.tzinfo else d


def _pro_rated_rent(lease: Lease, period_start: datetime, period_end: datetime) -> float:
    """First invoice is prorated when the lease begins mid-month."""
    lease_start = _naive(lease.start_date)
    ps = _naive(period_start)
    pe = _naive(period_end)
    total_days = (pe - ps).days + 1
    days = total_days
    if lease_start > ps:
        days = (pe - lease_start).days + 1
    ratio = max(days, 0) / max(total_days, 1)
    return round(float(lease.rent_amount) * ratio + 1e-9, 2)


def generate_monthly_invoice(db: Session, lease_id: int, current_user: User | None = None) -> InvoiceResponse:
    """Rolls the next billing month for an active lease (with proration + late fee)."""
    lease = lease_repository.get_lease_by_id(db, lease_id)
    if not lease:
        raise NotFoundException("Lease")
    if lease.status != LeaseStatus.ACTIVE:
        raise BadRequestException("Only active leases can be billed")

    now = datetime.now(UTC)
    latest = invoice_repository.get_latest_invoice_for_lease(db, lease_id)
    if latest is None:
        period_start = lease.start_date
        period_end = _month_end(lease.start_date)
    else:
        period_start = latest.period_end + timedelta(days=1)
        period_end = _month_end(period_start)

    late_fee = float(lease.late_fee_amount or 0)
    if late_fee:
        now = datetime.now(UTC).replace(tzinfo=None)
        has_overdue = any(
            i.status in (InvoiceStatus.OPEN, InvoiceStatus.PARTIAL) and _naive(i.due_date) < now
            for i in invoice_repository.get_open_invoices_for_lease(db, lease_id)
        )
        if not has_overdue:
            late_fee = 0

    rent = _pro_rated_rent(lease, period_start, period_end) if latest is None else float(lease.rent_amount)
    total = round(rent + late_fee, 2)
    due_date = datetime(
        period_end.year,
        period_end.month,
        min(max(lease.billing_day, 1), monthrange(period_end.year, period_end.month)[1]),
    )

    invoice = invoice_repository.create_invoice(
        db,
        {
            "lease_id": lease_id,
            "period_start": period_start,
            "period_end": period_end,
            "due_date": due_date,
            "total_amount": total,
            "paid_amount": 0,
            "late_fee_amount": late_fee,
            "status": InvoiceStatus.OPEN,
        },
    )
    invoice_repository.create_charge(
        db,
        {"invoice_id": invoice.id, "charge_type": ChargeType.RENT, "label": "Monthly rent", "amount": rent},
    )
    if late_fee:
        invoice_repository.create_charge(
            db,
            {"invoice_id": invoice.id, "charge_type": ChargeType.OTHER, "label": "Late fee", "amount": late_fee},
        )

    log_event(
        db,
        action="INVOICE.CREATED",
        entity_type="INVOICE",
        entity_id=invoice.id,
        details={"lease_id": lease_id, "period": f"{period_start.date()}..{period_end.date()}", "amount": total},
        user_id=current_user.id if current_user else None,
    )
    return InvoiceResponse.model_validate(invoice)


def _sync_invoice_status(db: Session, invoice: Invoice) -> Invoice:
    balance = float(invoice.total_amount) - float(invoice.paid_amount)
    if balance <= 0:
        status = InvoiceStatus.PAID
        notification_service.notify(
            db,
            invoice.lease.employee_id,
            "Invoice paid",
            f"Your invoice of ${invoice.total_amount} for {invoice.house_title} is fully paid.",
        )
    elif float(invoice.paid_amount) > 0:
        status = InvoiceStatus.PARTIAL
    else:
        status = InvoiceStatus.OPEN
    return invoice_repository.update_invoice(db, invoice, {"status": status})


def allocate_payment(db: Session, invoice_id: int, data: InvoiceAllocateRequest, current_user: User) -> InvoiceResponse:
    invoice = invoice_repository.get_invoice_by_id(db, invoice_id)
    if not invoice:
        raise NotFoundException("Invoice")
    if float(invoice.balance_due) <= 0:
        raise BadRequestException("Invoice is already paid")
    if data.amount > float(invoice.balance_due) + 1e-9:
        raise BadRequestException("Payment exceeds the invoice balance")

    invoice_repository.update_invoice(db, invoice, {"paid_amount": float(invoice.paid_amount) + data.amount})
    payment = payment_repository.create_payment(
        db,
        {
            "invoice_id": invoice_id,
            "application_id": invoice.lease.occupancy.application_id if invoice.lease.occupancy else None,
            "amount": data.amount,
            "method": data.method,
            "reference": data.reference,
            "payment_date": datetime.now(UTC),
        },
    )
    invoice = _sync_invoice_status(db, invoice)

    log_event(
        db,
        action="PAYMENT.ALLOCATED",
        entity_type="INVOICE",
        entity_id=invoice_id,
        details={"payment_id": payment.id, "amount": data.amount},
        user_id=current_user.id,
    )
    return InvoiceResponse.model_validate(invoice)


def list_invoices(
    db: Session,
    page: int = 1,
    page_size: int = 100,
    lease_id: int | None = None,
    status: InvoiceStatus | None = None,
    current_user: User | None = None,
) -> dict:
    skip = (page - 1) * page_size
    invoices = invoice_repository.get_invoices(db, skip=skip, limit=page_size, lease_id=lease_id, status=status)
    total = invoice_repository.count_invoices(db, lease_id=lease_id, status=status)

    if current_user is not None and current_user.role == UserRole.EMPLOYEE:
        invoices = [i for i in invoices if i.lease.employee_id == current_user.id]
        total = len(invoices)
    elif current_user is not None and current_user.role == UserRole.EMPLOYER:
        team = _team_employee_ids(db, current_user.id)
        invoices = [i for i in invoices if i.lease.employee_id in team]
        total = len(invoices)

    return {
        "items": [InvoiceResponse.model_validate(i) for i in invoices],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


def get_invoice(db: Session, invoice_id: int, current_user: User | None = None) -> InvoiceResponse:
    invoice = invoice_repository.get_invoice_by_id(db, invoice_id)
    if not invoice:
        raise NotFoundException("Invoice")
    if (
        current_user is not None
        and current_user.role == UserRole.EMPLOYEE
        and invoice.lease.employee_id != current_user.id
    ):
        raise ForbiddenException("Employees may only access their own invoices")
    if (
        current_user is not None
        and current_user.role == UserRole.EMPLOYER
        and invoice.lease.employee_id not in _team_employee_ids(db, current_user.id)
    ):
        raise ForbiddenException("Employers may only access invoices for their own team")
    return InvoiceResponse.model_validate(invoice)


def _open_balance(lease: Lease) -> float:
    return round(
        sum(float(i.balance_due) for i in lease.invoices if i.status in (InvoiceStatus.OPEN, InvoiceStatus.PARTIAL)),
        2,
    )


def arrears_summary(db: Session, current_user: User | None = None) -> ArrearsSummary:
    if current_user is not None and current_user.role == UserRole.EMPLOYER:
        team = _team_employee_ids(db, current_user.id)
        leases = db.query(Lease).filter(Lease.status == LeaseStatus.ACTIVE, Lease.employee_id.in_(team or [0])).all()
    else:
        leases = db.query(Lease).filter(Lease.status == LeaseStatus.ACTIVE).all()

    now = datetime.now(UTC).replace(tzinfo=None)
    buckets = [
        {"bucket": "0-30", "lo": 0, "hi": 30},
        {"bucket": "31-60", "lo": 31, "hi": 60},
        {"bucket": "61-90", "lo": 61, "hi": 90},
        {"bucket": "90+", "lo": 91, "hi": None},
    ]
    bucket_totals = {b["bucket"]: {"count": 0, "amount": 0.0} for b in buckets}
    total_outstanding = 0.0
    total_overdue = 0.0

    for lease in leases:
        for inv in lease.invoices:
            if inv.status not in (InvoiceStatus.OPEN, InvoiceStatus.PARTIAL):
                continue
            balance = float(inv.balance_due)
            total_outstanding = round(total_outstanding + balance, 2)
            if _naive(inv.due_date) >= now:
                continue
            total_overdue = round(total_overdue + balance, 2)
            days = (now.date() - inv.due_date.date()).days
            for b in buckets:
                if b["lo"] <= days and (b["hi"] is None or days <= b["hi"]):
                    bucket_totals[b["bucket"]]["count"] += 1
                    bucket_totals[b["bucket"]]["amount"] = round(bucket_totals[b["bucket"]]["amount"] + balance, 2)
                    break

    return ArrearsSummary(
        total_outstanding=total_outstanding,
        total_overdue=total_overdue,
        buckets=[ArrearsBucket(bucket=k, count=v["count"], amount=v["amount"]) for k, v in bucket_totals.items()],
    )


def statement_of_account(db: Session, lease_id: int, current_user: User | None = None) -> StatementOfAccount:
    lease = lease_repository.get_lease_by_id(db, lease_id)
    if not lease:
        raise NotFoundException("Lease")
    if current_user is not None and current_user.role == UserRole.EMPLOYEE and lease.employee_id != current_user.id:
        raise ForbiddenException("Employees may only view their own statement")
    if (
        current_user is not None
        and current_user.role == UserRole.EMPLOYER
        and lease.employee_id not in _team_employee_ids(db, current_user.id)
    ):
        raise ForbiddenException("Employers may only view statements for their own team")

    entries: list[tuple] = []
    for inv in lease.invoices:
        entries.append(
            (
                inv.period_start,
                "INVOICE",
                f"Rent {inv.period_start.date()}..{inv.period_end.date()}",
                float(inv.total_amount),
            )
        )
    invoice_ids = [i.id for i in lease.invoices]
    if invoice_ids:
        pays = db.query(Payment).filter(Payment.invoice_id.in_(invoice_ids)).all()
        for pay in pays:
            entries.append((pay.payment_date, "PAYMENT", f"Receipt {pay.reference or pay.id}", -float(pay.amount)))

    entries.sort(key=lambda e: e[0])
    running = 0.0
    statement = []
    for ts, kind, desc, amt in entries:
        running = round(running + amt, 2)
        statement.append(StatementEntry(date=ts, type=kind, description=desc, amount=amt, running_balance=running))

    return StatementOfAccount(
        lease=LeaseResponse.model_validate(lease), balance=_open_balance(lease), entries=statement
    )


def financial_report(db: Session, year: int, month: int) -> FinancialReport:
    first, last = _month_bounds(year, month)
    start_dt = datetime(year, month, first)
    end_dt = datetime(year, month, last, 23, 59, 59, 999999)

    payments = db.query(Payment).filter(Payment.payment_date >= start_dt, Payment.payment_date <= end_dt).all()
    collected = round(sum(float(p.amount) for p in payments), 2)

    arrears = arrears_summary(db)
    active_leases = lease_repository.count_active_leases(db)
    open_invoices = invoice_repository.count_invoices(
        db, status=InvoiceStatus.OPEN
    ) + invoice_repository.count_invoices(db, status=InvoiceStatus.PARTIAL)

    return FinancialReport(
        month=month,
        year=year,
        collected=collected,
        outstanding=arrears.total_outstanding,
        overdue=arrears.total_overdue,
        open_invoices=open_invoices,
        active_leases=active_leases,
        arrears=arrears.buckets,
    )


def occupancy_report(db: Session) -> OccupancyReport:
    houses = db.query(House).all()
    total = len(houses)
    available = sum(1 for h in houses if h.available)
    occupied = total - available
    leases = db.query(Lease).filter(Lease.status == LeaseStatus.ACTIVE).all()
    by_house = [
        {
            "house_id": h.id,
            "title": h.title,
            "available": h.available,
            "occupants": sum(1 for lease in leases if lease.house_id == h.id),
        }
        for h in houses
    ]
    return OccupancyReport(
        total_houses=total,
        available_houses=available,
        occupied_houses=occupied,
        active_leases=len(leases),
        by_house=by_house,
    )
