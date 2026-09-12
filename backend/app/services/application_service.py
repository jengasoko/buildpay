from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.repositories import application_repository
from app.schemas import ApplicationCreate, ApplicationResponse, ApplicationUpdate


def create_application(db: Session, data: ApplicationCreate) -> ApplicationResponse:
    application = application_repository.create_application(db, data.model_dump())
    return ApplicationResponse.model_validate(application)


def get_application(db: Session, application_id: int) -> ApplicationResponse:
    application = application_repository.get_application_by_id(db, application_id)
    if not application:
        raise NotFoundException("Application")
    return ApplicationResponse.model_validate(application)


def list_applications(db: Session, page: int = 1, page_size: int = 100) -> dict:
    skip = (page - 1) * page_size
    applications = application_repository.get_applications(db, skip=skip, limit=page_size)
    total = application_repository.count_applications(db)
    return {
        "items": [ApplicationResponse.model_validate(a) for a in applications],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


def update_application(db: Session, application_id: int, data: ApplicationUpdate) -> ApplicationResponse:
    application = application_repository.get_application_by_id(db, application_id)
    if not application:
        raise NotFoundException("Application")
    update_data = data.model_dump(exclude_unset=True)
    updated = application_repository.update_application(db, application, update_data)
    return ApplicationResponse.model_validate(updated)
