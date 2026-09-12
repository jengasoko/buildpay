from sqlalchemy.orm import Session, joinedload

from app.models import Application, ApplicationStatus


def get_application_by_id(db: Session, application_id: int) -> Application | None:
    return (
        db.query(Application)
        .options(joinedload(Application.house), joinedload(Application.employee))
        .filter(Application.id == application_id)
        .first()
    )


def get_applications(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: ApplicationStatus | None = None,
) -> list[Application]:
    query = db.query(Application).options(
        joinedload(Application.house),
        joinedload(Application.employee),
    )
    if status is not None:
        query = query.filter(Application.status == status)
    return query.offset(skip).limit(limit).all()


def get_applications_by_employee(db: Session, employee_id: int) -> list[Application]:
    return db.query(Application).filter(Application.employee_id == employee_id).all()


def count_applications(db: Session, status: ApplicationStatus | None = None) -> int:
    query = db.query(Application)
    if status is not None:
        query = query.filter(Application.status == status)
    return query.count()


def create_application(db: Session, application_data: dict) -> Application:
    application = Application(**application_data)
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


def update_application(db: Session, application: Application, update_data: dict) -> Application:
    for key, value in update_data.items():
        setattr(application, key, value)
    db.commit()
    db.refresh(application)
    return application
