from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.models import User
from app.repositories import project_repository
from app.schemas import ProjectCreate, ProjectResponse, ProjectUpdate
from app.services.logs import log_event


def create_project(db: Session, data: ProjectCreate, current_user: User | None = None) -> ProjectResponse:
    project = project_repository.create_project(db, data.model_dump())
    log_event(
        db,
        action="PROJECT.CREATED",
        entity_type="PROJECT",
        entity_id=project.id,
        details={"name": project.name},
        user_id=current_user.id if current_user else None,
    )
    return ProjectResponse.model_validate(project)


def get_project(db: Session, project_id: int) -> ProjectResponse:
    project = project_repository.get_project_by_id(db, project_id)
    if not project:
        raise NotFoundException("Project")
    return ProjectResponse.model_validate(project)


def list_projects(db: Session, page: int = 1, page_size: int = 100) -> dict:
    skip = (page - 1) * page_size
    projects = project_repository.get_projects(db, skip=skip, limit=page_size)
    total = project_repository.count_projects(db)
    return {
        "items": [ProjectResponse.model_validate(p) for p in projects],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


def update_project(
    db: Session, project_id: int, data: ProjectUpdate, current_user: User | None = None
) -> ProjectResponse:
    project = project_repository.get_project_by_id(db, project_id)
    if not project:
        raise NotFoundException("Project")
    update_data = data.model_dump(exclude_unset=True)
    updated = project_repository.update_project(db, project, update_data)
    log_event(
        db,
        action="PROJECT.UPDATED",
        entity_type="PROJECT",
        entity_id=project_id,
        details={"updated": list(update_data.keys())},
        user_id=current_user.id if current_user else None,
    )
    return ProjectResponse.model_validate(updated)


def delete_project(db: Session, project_id: int, current_user: User | None = None) -> None:
    project = project_repository.get_project_by_id(db, project_id)
    if not project:
        raise NotFoundException("Project")
    project_repository.delete_project(db, project)
    log_event(
        db,
        action="PROJECT.DELETED",
        entity_type="PROJECT",
        entity_id=project_id,
        details={"name": project.name},
        user_id=current_user.id if current_user else None,
    )
