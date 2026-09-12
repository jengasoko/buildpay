from sqlalchemy.orm import Session

from app.models import Application


def get_application_by_id(db: Session, application_id: int) -> Application | None:
    return db.query(Application).filter(Application.id == application_id).first()


def get_applications(db: Session, skip: int = 0, limit: int = 100) -> list[Application]:
    return db.query(Application).offset(skip).limit(limit).all()


def get_applications_by_employee(db: Session, employee_id: int) -> list[Application]:
    return db.query(Application).filter(Application.employee_id == employee_id).all()


def count_applications(db: Session) -> int:
    return db.query(Application).count()


def create_application(db: Session, application_data: dict) -> Application:
    application = Application(**application_data)
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


def update_application(db: Session, application: Application, update_data: dict) -> Application:
    for key, value in update_data.items():
        if value is not None:
            setattr(application, key, value)
    db.commit()
    db.refresh(application)
    return application
