from sqlalchemy.orm import Session, joinedload

from app.models import Application, ApplicationStatus, Employment, User

ACTIVE_STATUSES = (ApplicationStatus.PENDING, ApplicationStatus.EMPLOYER_APPROVED)


def _with_employment(query):
    return query.options(
        joinedload(Application.house),
        joinedload(Application.employee).joinedload(User.employment_as_employee).joinedload(Employment.employer),
    )


def get_application_by_id(db: Session, application_id: int) -> Application | None:
    return _with_employment(db.query(Application)).filter(Application.id == application_id).first()


def get_active_application_by_house(db: Session, employee_id: int, house_id: int) -> Application | None:
    return (
        db.query(Application)
        .filter(
            Application.employee_id == employee_id,
            Application.house_id == house_id,
            Application.status.in_(ACTIVE_STATUSES),
        )
        .first()
    )


def get_active_application_by_employee(db: Session, employee_id: int) -> Application | None:
    return (
        db.query(Application)
        .filter(Application.employee_id == employee_id, Application.status.in_(ACTIVE_STATUSES))
        .first()
    )


def get_applications(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: ApplicationStatus | None = None,
    employee_id: int | None = None,
    team_ids: list[int] | None = None,
) -> list[Application]:
    query = _with_employment(db.query(Application))
    if status is not None:
        query = query.filter(Application.status == status)
    if employee_id is not None:
        query = query.filter(Application.employee_id == employee_id)
    if team_ids is not None:
        query = query.filter(Application.employee_id.in_(team_ids))
    return query.order_by(Application.created_at.desc()).offset(skip).limit(limit).all()


def get_applications_by_employee(db: Session, employee_id: int) -> list[Application]:
    return db.query(Application).filter(Application.employee_id == employee_id).all()


def count_applications(
    db: Session,
    status: ApplicationStatus | None = None,
    employee_id: int | None = None,
    team_ids: list[int] | None = None,
) -> int:
    query = db.query(Application)
    if status is not None:
        query = query.filter(Application.status == status)
    if employee_id is not None:
        query = query.filter(Application.employee_id == employee_id)
    if team_ids is not None:
        query = query.filter(Application.employee_id.in_(team_ids))
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
