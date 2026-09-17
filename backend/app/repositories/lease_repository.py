from sqlalchemy.orm import Session

from app.models import Lease, LeaseStatus


def get_lease_by_id(db: Session, lease_id: int) -> Lease | None:
    return db.query(Lease).filter(Lease.id == lease_id).first()


def get_active_lease_by_employee(db: Session, employee_id: int) -> Lease | None:
    return (
        db.query(Lease)
        .filter(Lease.employee_id == employee_id, Lease.status == LeaseStatus.ACTIVE)
        .order_by(Lease.start_date.desc())
        .first()
    )


def get_active_lease_by_occupancy(db: Session, occupancy_id: int) -> Lease | None:
    return db.query(Lease).filter(Lease.occupancy_id == occupancy_id, Lease.status == LeaseStatus.ACTIVE).first()


def get_leases(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: LeaseStatus | None = None,
    employee_ids: list[int] | None = None,
    current_only: bool = False,
) -> list[Lease]:
    query = db.query(Lease)
    if status is not None:
        query = query.filter(Lease.status == status)
    elif current_only:
        query = query.filter(Lease.status == LeaseStatus.ACTIVE)
    if employee_ids is not None:
        query = query.filter(Lease.employee_id.in_(employee_ids))
    return query.order_by(Lease.start_date.desc()).offset(skip).limit(limit).all()


def count_leases(
    db: Session,
    status: LeaseStatus | None = None,
    employee_ids: list[int] | None = None,
    current_only: bool = False,
) -> int:
    query = db.query(Lease)
    if status is not None:
        query = query.filter(Lease.status == status)
    elif current_only:
        query = query.filter(Lease.status == LeaseStatus.ACTIVE)
    if employee_ids is not None:
        query = query.filter(Lease.employee_id.in_(employee_ids))
    return query.count()


def count_active_leases(db: Session) -> int:
    return db.query(Lease).filter(Lease.status == LeaseStatus.ACTIVE).count()


def create_lease(db: Session, data: dict) -> Lease:
    lease = Lease(**data)
    db.add(lease)
    db.flush()
    db.refresh(lease)
    return lease


def update_lease(db: Session, lease: Lease, update_data: dict) -> Lease:
    for key, value in update_data.items():
        setattr(lease, key, value)
    db.flush()
    db.refresh(lease)
    return lease
