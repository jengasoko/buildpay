from datetime import datetime

from sqlalchemy.orm import Session

from app.models import Charge, Invoice, InvoiceStatus, Lease


def get_invoice_by_id(db: Session, invoice_id: int) -> Invoice | None:
    return db.query(Invoice).filter(Invoice.id == invoice_id).first()


def _scoped_invoices_query(
    db: Session,
    lease_id: int | None,
    status: InvoiceStatus | None,
    employee_ids: list[int] | None,
):
    query = db.query(Invoice)
    if employee_ids is not None:
        query = query.join(Lease, Invoice.lease_id == Lease.id).filter(Lease.employee_id.in_(employee_ids))
    if lease_id is not None:
        query = query.filter(Invoice.lease_id == lease_id)
    if status is not None:
        query = query.filter(Invoice.status == status)
    return query


def get_invoices(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    lease_id: int | None = None,
    status: InvoiceStatus | None = None,
    employee_ids: list[int] | None = None,
) -> list[Invoice]:
    query = _scoped_invoices_query(db, lease_id, status, employee_ids)
    return query.order_by(Invoice.period_start.desc()).offset(skip).limit(limit).all()


def count_invoices(
    db: Session,
    lease_id: int | None = None,
    status: InvoiceStatus | None = None,
    employee_ids: list[int] | None = None,
) -> int:
    return _scoped_invoices_query(db, lease_id, status, employee_ids).count()


def get_open_invoices_for_lease(db: Session, lease_id: int) -> list[Invoice]:
    return (
        db.query(Invoice)
        .filter(Invoice.lease_id == lease_id, Invoice.status.in_([InvoiceStatus.OPEN, InvoiceStatus.PARTIAL]))
        .order_by(Invoice.due_date.asc())
        .all()
    )


def get_latest_invoice_for_lease(db: Session, lease_id: int) -> Invoice | None:
    return db.query(Invoice).filter(Invoice.lease_id == lease_id).order_by(Invoice.period_end.desc()).first()


def has_overdue_invoice(db: Session, lease_id: int, as_of: datetime) -> bool:
    as_of_naive = as_of.replace(tzinfo=None) if as_of.tzinfo else as_of
    return (
        db.query(Invoice)
        .filter(
            Invoice.lease_id == lease_id,
            Invoice.due_date < as_of_naive,
            Invoice.status.in_([InvoiceStatus.OPEN, InvoiceStatus.PARTIAL]),
        )
        .count()
        > 0
    )


def create_invoice(db: Session, data: dict) -> Invoice:
    invoice = Invoice(**data)
    db.add(invoice)
    db.flush()
    db.refresh(invoice)
    return invoice


def update_invoice(db: Session, invoice: Invoice, update_data: dict) -> Invoice:
    for key, value in update_data.items():
        setattr(invoice, key, value)
    db.flush()
    db.refresh(invoice)
    return invoice


def create_charge(db: Session, data: dict) -> Charge:
    charge = Charge(**data)
    db.add(charge)
    db.flush()
    db.refresh(charge)
    return charge
