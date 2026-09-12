from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.repositories import project_repository
from app.schemas import ProjectCreate, ProjectResponse, ProjectUpdate


def create_project(db: Session, data: ProjectCreate) -> ProjectResponse:
    project = project_repository.create_project(db, data.model_dump())
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


def update_project(db: Session, project_id: int, data: ProjectUpdate) -> ProjectResponse:
    project = project_repository.get_project_by_id(db, project_id)
    if not project:
        raise NotFoundException("Project")
    update_data = data.model_dump(exclude_unset=True)
    updated = project_repository.update_project(db, project, update_data)
    return ProjectResponse.model_validate(updated)


def delete_project(db: Session, project_id: int) -> None:
    project = project_repository.get_project_by_id(db, project_id)
    if not project:
        raise NotFoundException("Project")
    project_repository.delete_project(db, project)
