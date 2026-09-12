from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestException, ForbiddenException, NotFoundException
from app.models import ApplicationStatus, User, UserRole
from app.repositories import application_repository
from app.schemas import ApplicationCreate, ApplicationResponse, ApplicationUpdate

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


def create_application(db: Session, data: ApplicationCreate, current_user: User | None = None) -> ApplicationResponse:
    if current_user is not None and current_user.role == UserRole.EMPLOYEE and data.employee_id != current_user.id:
        raise ForbiddenException("Employees may only create applications for themselves")
    application = application_repository.create_application(db, data.model_dump())
    return ApplicationResponse.model_validate(application)


def get_application(db: Session, application_id: int) -> ApplicationResponse:
    application = application_repository.get_application_by_id(db, application_id)
    if not application:
        raise NotFoundException("Application")
    return ApplicationResponse.model_validate(application)


def list_applications(
    db: Session,
    page: int = 1,
    page_size: int = 100,
    status: ApplicationStatus | None = None,
) -> dict:
    skip = (page - 1) * page_size
    applications = application_repository.get_applications(db, skip=skip, limit=page_size, status=status)
    total = application_repository.count_applications(db, status=status)
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

    updated = application_repository.update_application(db, application, update_data)
    return ApplicationResponse.model_validate(updated)
