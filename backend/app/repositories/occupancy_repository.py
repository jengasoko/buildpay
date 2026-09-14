from sqlalchemy.orm import Session, joinedload

from app.models import Occupancy


def get_occupancy_by_id(db: Session, occupancy_id: int) -> Occupancy | None:
    return (
        db.query(Occupancy)
        .options(joinedload(Occupancy.house), joinedload(Occupancy.employee))
        .filter(Occupancy.id == occupancy_id)
        .first()
    )


def get_occupancy_by_application(db: Session, application_id: int) -> Occupancy | None:
    return (
        db.query(Occupancy)
        .options(joinedload(Occupancy.house), joinedload(Occupancy.employee))
        .filter(Occupancy.application_id == application_id)
        .first()
    )


def get_occupancies(db: Session, skip: int = 0, limit: int = 100, current_only: bool = False) -> list[Occupancy]:
    query = db.query(Occupancy).options(joinedload(Occupancy.house), joinedload(Occupancy.employee))
    if current_only:
        query = query.filter(Occupancy.ended_at.is_(None))
    return query.order_by(Occupancy.id.desc()).offset(skip).limit(limit).all()


def count_occupancies(db: Session, current_only: bool = False) -> int:
    query = db.query(Occupancy)
    if current_only:
        query = query.filter(Occupancy.ended_at.is_(None))
    return query.count()


def create_occupancy(db: Session, data: dict) -> Occupancy:
    occupancy = Occupancy(**data)
    db.add(occupancy)
    db.flush()
    db.refresh(occupancy)
    return occupancy


def update_occupancy(db: Session, occupancy: Occupancy, update_data: dict) -> Occupancy:
    for key, value in update_data.items():
        setattr(occupancy, key, value)
    db.flush()
    db.refresh(occupancy)
    return occupancy
