from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.core.database import get_db
from app.models import MaintenanceStatus, User, UserRole
from app.schemas import MaintenanceCreate, MaintenanceResponse, MaintenanceUpdate, PaginatedResponse
from app.services import maintenance_service

router = APIRouter(prefix="/maintenance-requests", tags=["Maintenance"])


@router.post("", response_model=MaintenanceResponse, status_code=201)
def create_request(
    data: MaintenanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*UserRole)),
):
    return maintenance_service.create_request(db, data, current_user)


@router.get("", response_model=PaginatedResponse)
def list_requests(
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    status: MaintenanceStatus | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*UserRole)),
):
    return maintenance_service.list_requests(db, page, page_size, status=status, current_user=current_user)


@router.get("/{request_id}", response_model=MaintenanceResponse)
def get_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*UserRole)),
):
    return maintenance_service.get_request(db, request_id, current_user=current_user)


@router.put("/{request_id}", response_model=MaintenanceResponse)
def update_request(
    request_id: int,
    data: MaintenanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*UserRole)),
):
    return maintenance_service.update_request(db, request_id, data, current_user)
