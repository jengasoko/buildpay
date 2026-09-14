from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.core.database import get_db
from app.models import ApplicationStatus, User, UserRole
from app.schemas import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationUpdate,
    HouseCreate,
    HouseResponse,
    HouseUpdate,
    PaginatedResponse,
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)
from app.services import application_service, house_service, project_service

router = APIRouter(tags=["Projects"])

MANAGER_ROLES = (UserRole.ADMIN, UserRole.PROJECT_MANAGER)


# --- Projects ---
@router.post("/projects", response_model=ProjectResponse, status_code=201)
def create_project(
    data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*MANAGER_ROLES)),
):
    return project_service.create_project(db, data, current_user=current_user)


@router.get("/projects", response_model=PaginatedResponse)
def list_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role(*UserRole)),
):
    return project_service.list_projects(db, page=page, page_size=page_size)


@router.get("/projects/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role(*UserRole)),
):
    return project_service.get_project(db, project_id)


@router.put("/projects/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*MANAGER_ROLES)),
):
    return project_service.update_project(db, project_id, data, current_user=current_user)


@router.delete("/projects/{project_id}", status_code=204)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*MANAGER_ROLES)),
):
    project_service.delete_project(db, project_id, current_user=current_user)
    return None


# --- Houses ---
@router.post("/houses", response_model=HouseResponse, status_code=201)
def create_house(
    data: HouseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*MANAGER_ROLES)),
):
    return house_service.create_house(db, data, current_user=current_user)


@router.get("/houses", response_model=PaginatedResponse)
def list_houses(
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    available_only: bool = Query(False),
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role(*UserRole)),
):
    return house_service.list_houses(db, page=page, page_size=page_size, available_only=available_only)


@router.get("/houses/{house_id}", response_model=HouseResponse)
def get_house(
    house_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role(*UserRole)),
):
    return house_service.get_house(db, house_id)


@router.put("/houses/{house_id}", response_model=HouseResponse)
def update_house(
    house_id: int,
    data: HouseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*MANAGER_ROLES)),
):
    return house_service.update_house(db, house_id, data, current_user=current_user)


@router.delete("/houses/{house_id}", status_code=204)
def delete_house(
    house_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*MANAGER_ROLES)),
):
    house_service.delete_house(db, house_id, current_user=current_user)
    return None


# --- Applications ---
@router.post("/applications", response_model=ApplicationResponse, status_code=201)
def create_application(
    data: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.EMPLOYER, UserRole.EMPLOYEE)),
):
    return application_service.create_application(db, data, current_user=current_user)


@router.get("/applications", response_model=PaginatedResponse)
def list_applications(
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    status: ApplicationStatus | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*UserRole)),
):
    return application_service.list_applications(
        db, page=page, page_size=page_size, status=status, current_user=current_user
    )


@router.get("/applications/{application_id}", response_model=ApplicationResponse)
def get_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*UserRole)),
):
    return application_service.get_application(db, application_id, current_user=current_user)


# --- Application status workflow ---
@router.put("/applications/{application_id}", response_model=ApplicationResponse)
def update_application(
    application_id: int,
    data: ApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.EMPLOYER, UserRole.FINANCIAL_OFFICER)),
):
    return application_service.update_application(db, application_id, data, current_user=current_user)
