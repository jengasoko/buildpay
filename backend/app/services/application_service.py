from sqlalchemy.orm import Session

from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
)
from app.models import ApplicationStatus, User, UserRole
from app.repositories import application_repository, house_repository, occupancy_repository, user_repository
from app.schemas import ApplicationCreate, ApplicationResponse, ApplicationUpdate
from app.services import employment_service, notification_service
from app.services.logs import log_event

ALLOWED_TRANSITIONS = {
    ApplicationStatus.PENDING: {ApplicationStatus.EMPLOYER_APPROVED, ApplicationStatus.REJECTED},
    ApplicationStatus.EMPLOYER_APPROVED: {ApplicationStatus.FINANCIAL_APPROVED, ApplicationStatus.REJECTED},
    ApplicationStatus.FINANCIAL_APPROVED: set(),
    ApplicationStatus.REJECTED: set(),
}

ROLE_TRANSITIONS = {
    UserRole.EMPLOYER: {
        ApplicationStatus.PENDING: {ApplicationStatus.EMPLOYER_APPROVED, ApplicationStatus.REJECTED},
    },
    UserRole.FINANCIAL_OFFICER: {
        ApplicationStatus.EMPLOYER_APPROVED: {ApplicationStatus.FINANCIAL_APPROVED, ApplicationStatus.REJECTED},
    },
}


def _notify_finance(db: Session, title: str, message: str) -> None:
    officers = db.query(User).filter(User.role == UserRole.FINANCIAL_OFFICER).all()
    for officer in officers:
        notification_service.notify(db, officer.id, title, message)


def _notify_assigned_employers(db: Session, employee_id: int, title: str, message: str) -> None:
    employment = employment_service.get_employment_by_employee(db, employee_id)
    if employment is not None:
        notification_service.notify(db, employment.employer_id, title, message)


def create_application(db: Session, data: ApplicationCreate, current_user: User | None = None) -> ApplicationResponse:
    if current_user is not None and current_user.role == UserRole.EMPLOYEE and data.employee_id != current_user.id:
        raise ForbiddenException("Employees may only create applications for themselves")

    employee = user_repository.get_user_by_id(db, data.employee_id)
    if employee is None:
        raise NotFoundException("Employee")
    if employee.role != UserRole.EMPLOYEE:
        raise BadRequestException("Applications can only be submitted for employees")

    house = house_repository.get_house_by_id(db, data.house_id)
    if house is None:
        raise NotFoundException("House")
    if not house.available:
        raise ConflictException("House is not available for application")

    if application_repository.get_active_application_by_employee(db, data.employee_id):
        raise ConflictException("Employee already has an active application")
    if application_repository.get_active_application_by_house(db, data.employee_id, data.house_id):
        raise ConflictException("Employee already has an active application for this house")

    application = application_repository.create_application(db, data.model_dump())

    log_event(
        db,
        action="APPLICATION.CREATED",
        entity_type="APPLICATION",
        entity_id=application.id,
        details={"house_id": data.house_id, "status": application.status.value},
        user_id=current_user.id if current_user else employee.id,
    )

    house_title = house.title if house and house.title else f"house #{data.house_id}"
    _notify_assigned_employers(
        db, data.employee_id, "New housing application", f"{employee.username} applied for {house_title}"
    )
    _notify_finance(db, "New housing application", f"{employee.username} applied for {house_title} and awaits review")
    return ApplicationResponse.model_validate(application)


def get_application(db: Session, application_id: int, current_user: User | None = None) -> ApplicationResponse:
    application = application_repository.get_application_by_id(db, application_id)
    if not application:
        raise NotFoundException("Application")
    if current_user is not None:
        if current_user.role == UserRole.EMPLOYEE and application.employee_id != current_user.id:
            raise ForbiddenException("Employees may only view their own applications")
        if current_user.role == UserRole.EMPLOYER:
            employment = employment_service.get_employment_by_employee(db, application.employee_id)
            if employment is None or employment.employer_id != current_user.id:
                raise ForbiddenException("Employers may only view applications from their own team")
    return ApplicationResponse.model_validate(application)


def list_applications(
    db: Session,
    page: int = 1,
    page_size: int = 100,
    status: ApplicationStatus | None = None,
    current_user: User | None = None,
) -> dict:
    skip = (page - 1) * page_size
    team_ids = None
    employee_id = None
    if current_user is not None:
        if current_user.role == UserRole.EMPLOYEE:
            employee_id = current_user.id
        elif current_user.role == UserRole.EMPLOYER:
            team_ids = employment_service.get_employer_team_ids(db, current_user.id)
    applications = application_repository.get_applications(
        db, skip=skip, limit=page_size, status=status, employee_id=employee_id, team_ids=team_ids
    )
    total = application_repository.count_applications(db, status=status, employee_id=employee_id, team_ids=team_ids)
    return {
        "items": [ApplicationResponse.model_validate(a) for a in applications],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


def update_application(
    db: Session, application_id: int, data: ApplicationUpdate, current_user: User | None = None
) -> ApplicationResponse:
    application = application_repository.get_application_by_id(db, application_id)
    if not application:
        raise NotFoundException("Application")

    update_data = data.model_dump(exclude_unset=True)
    new_status = update_data.get("status")

    if current_user is not None and current_user.role == UserRole.EMPLOYER:
        employment = employment_service.get_employment_by_employee(db, application.employee_id)
        if employment is None or employment.employer_id != current_user.id:
            raise ForbiddenException("Employers may only review applications from their own team")

    if new_status is not None and new_status != application.status:
        if current_user is None or current_user.role == UserRole.ADMIN:
            allowed = ALLOWED_TRANSITIONS[application.status]
            if new_status not in allowed:
                raise BadRequestException(
                    f"Cannot transition application from {application.status.value} to {new_status.value}"
                )
        else:
            allowed = ROLE_TRANSITIONS.get(current_user.role, {}).get(application.status, set())
            if new_status not in allowed:
                raise ForbiddenException(
                    f"Role {current_user.role.value} cannot transition application from "
                    f"{application.status.value} to {new_status.value}"
                )

    previous_status = application.status.value
    updated = application_repository.update_application(db, application, update_data)

    employee = application.employee
    house_title = updated.house.title if updated.house else f"house #{updated.house_id}"

    if new_status == ApplicationStatus.FINANCIAL_APPROVED.value:
        house = updated.house
        if house is not None and house.available:
            house_repository.update_house(db, house, {"available": False})
        if occupancy_repository.get_occupancy_by_application(db, application_id) is None:
            occupancy_repository.create_occupancy(
                db,
                {
                    "application_id": application_id,
                    "house_id": updated.house_id,
                    "employee_id": updated.employee_id,
                },
            )
    elif new_status == ApplicationStatus.REJECTED.value:
        if employee is not None:
            notification_service.notify(
                db, employee.id, "Application rejected", f"Your application for {house_title} was rejected"
            )

    if new_status == ApplicationStatus.EMPLOYER_APPROVED.value and employee is not None:
        notification_service.notify(
            db,
            employee.id,
            "Application employer-approved",
            f"{employee.employer_username or 'Your employer'} approved your application for {house_title}",
        )
        _notify_finance(
            db,
            "Application awaiting financial review",
            f"{employee.username}'s application for {house_title} awaits financial review",
        )
    elif new_status == ApplicationStatus.FINANCIAL_APPROVED.value and employee is not None:
        notification_service.notify(
            db,
            employee.id,
            "Application financially approved",
            f"Your application for {house_title} was financially approved. Move-in confirmed.",
        )

    log_event(
        db,
        action="APPLICATION.STATUS_CHANGED",
        entity_type="APPLICATION",
        entity_id=application_id,
        details={"from": previous_status, "to": new_status if new_status else previous_status},
        user_id=current_user.id if current_user else None,
    )
    return ApplicationResponse.model_validate(updated)
