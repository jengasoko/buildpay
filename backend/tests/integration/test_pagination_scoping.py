"""Regression tests for a bug where list_invoices/list_occupancies paginated at
the database layer *before* scoping results down to the caller's own team,
which could push an employer's own rows off "page 1" (and report a wrong
`total`) whenever another team's rows happened to rank higher in the
unscoped, global ordering.
"""

from datetime import UTC, datetime, timedelta

from app.core.security import hash_password
from app.models import (
    Application,
    ApplicationStatus,
    Employment,
    House,
    Invoice,
    InvoiceStatus,
    Lease,
    LeaseStatus,
    Occupancy,
    User,
    UserRole,
)
from app.services import billing_service, occupancy_service

_COUNTER = [0]


def _uid():
    _COUNTER[0] += 1
    return f"pg{_COUNTER[0]}"


def _create_user(db_session, role):
    username = _uid()
    user = User(
        username=username,
        email=f"{username}@example.com",
        hashed_password=hash_password("password123"),
        role=role,
    )
    db_session.add(user)
    db_session.commit()
    return user


def _build_team(db_session, *, invoice_period_start):
    """Creates an employer with one employee who has an active lease, occupancy,
    and a single invoice dated at `invoice_period_start`."""
    employer = _create_user(db_session, UserRole.EMPLOYER)
    employee = _create_user(db_session, UserRole.EMPLOYEE)
    db_session.add(Employment(employer_id=employer.id, employee_id=employee.id))
    house = House(title=_uid(), location="Test St", rent_price=1000.00)
    db_session.add(house)
    db_session.commit()

    application = Application(employee_id=employee.id, house_id=house.id, status=ApplicationStatus.FINANCIAL_APPROVED)
    db_session.add(application)
    db_session.commit()

    occupancy = Occupancy(application_id=application.id, house_id=house.id, employee_id=employee.id)
    db_session.add(occupancy)
    db_session.commit()

    lease = Lease(
        occupancy_id=occupancy.id,
        employee_id=employee.id,
        house_id=house.id,
        rent_amount=1000.00,
        start_date=datetime.now(UTC),
        status=LeaseStatus.ACTIVE,
    )
    db_session.add(lease)
    db_session.commit()

    invoice = Invoice(
        lease_id=lease.id,
        period_start=invoice_period_start,
        period_end=invoice_period_start + timedelta(days=30),
        due_date=invoice_period_start + timedelta(days=35),
        total_amount=1000.00,
        status=InvoiceStatus.OPEN,
    )
    db_session.add(invoice)
    db_session.commit()

    return employer, employee, lease, invoice, occupancy


class TestInvoiceListPaginationScoping:
    def test_employer_sees_own_invoice_even_when_outranked_globally(self, db_session):
        now = datetime.now(UTC).replace(tzinfo=None)
        # Another team's invoice is newer, so it ranks first in the unscoped,
        # global `ORDER BY period_start DESC` used by the repository.
        _build_team(db_session, invoice_period_start=now)
        # The target employer's invoice is older, so with page_size=1 it would
        # be pushed off "page 1" if scoping happened after pagination (the bug).
        employer, _employee, _lease, invoice, _occ = _build_team(
            db_session, invoice_period_start=now - timedelta(days=60)
        )

        result = billing_service.list_invoices(db_session, page=1, page_size=1, current_user=employer)

        assert result["total"] == 1
        assert [i.id for i in result["items"]] == [invoice.id]


class TestOccupancyListPaginationScoping:
    def test_employer_sees_own_occupancy_even_when_outranked_globally(self, db_session):
        now = datetime.now(UTC).replace(tzinfo=None)
        employer, _employee, _lease, _invoice, occupancy = _build_team(db_session, invoice_period_start=now)
        # Created after the target team, so it gets a higher id and ranks
        # first in the unscoped `ORDER BY Occupancy.id DESC` ordering.
        _build_team(db_session, invoice_period_start=now)

        result = occupancy_service.list_occupancies(db_session, page=1, page_size=1, current_user=employer)

        assert result["total"] == 1
        assert [o.id for o in result["items"]] == [occupancy.id]
