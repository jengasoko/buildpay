from sqlalchemy.orm import Session, joinedload

from app.models import Employment


def get_employment_by_id(db: Session, employment_id: int) -> Employment | None:
    return (
        db.query(Employment)
        .options(joinedload(Employment.employer), joinedload(Employment.employee))
        .filter(Employment.id == employment_id)
        .first()
    )


def get_employment_by_employee(db: Session, employee_id: int) -> Employment | None:
    return (
        db.query(Employment)
        .options(joinedload(Employment.employer), joinedload(Employment.employee))
        .filter(Employment.employee_id == employee_id)
        .first()
    )


def get_employments(db: Session, skip: int = 0, limit: int = 100, employer_id: int | None = None) -> list[Employment]:
    query = db.query(Employment).options(joinedload(Employment.employer), joinedload(Employment.employee))
    if employer_id is not None:
        query = query.filter(Employment.employer_id == employer_id)
    return query.order_by(Employment.id.desc()).offset(skip).limit(limit).all()


def count_employments(db: Session, employer_id: int | None = None) -> int:
    query = db.query(Employment)
    if employer_id is not None:
        query = query.filter(Employment.employer_id == employer_id)
    return query.count()


def create_employment(db: Session, data: dict) -> Employment:
    employment = Employment(**data)
    db.add(employment)
    db.commit()
    db.refresh(employment)
    return employment


def delete_employment(db: Session, employment: Employment) -> None:
    db.delete(employment)
    db.commit()
