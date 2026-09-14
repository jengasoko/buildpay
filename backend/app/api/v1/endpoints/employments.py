from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.core.database import get_db
from app.models import User, UserRole
from app.schemas import EmploymentCreate, EmploymentResponse, PaginatedResponse
from app.services import employment_service

router = APIRouter(prefix="/employments", tags=["Employments"])

ADMIN_OR_EMPLOYER = (UserRole.ADMIN, UserRole.EMPLOYER)


@router.post("/", response_model=EmploymentResponse, status_code=201)
def create_employment(
    data: EmploymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    return employment_service.create_employment(db, data, current_user=current_user)


@router.get("/", response_model=PaginatedResponse)
def list_employments(
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*ADMIN_OR_EMPLOYER)),
):
    return employment_service.list_employments(db, page=page, page_size=page_size, current_user=current_user)


@router.get("/{employment_id}", response_model=EmploymentResponse)
def get_employment(
    employment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*ADMIN_OR_EMPLOYER)),
):
    return employment_service.get_employment(db, employment_id, current_user=current_user)


@router.delete("/{employment_id}", status_code=204)
def delete_employment(
    employment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    employment_service.delete_employment(db, employment_id, current_user=current_user)
    return None
