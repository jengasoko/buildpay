from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.core.database import get_db
from app.models import User, UserRole
from app.schemas import OccupancyResponse, PaginatedResponse
from app.services import occupancy_service

router = APIRouter(prefix="/occupancies", tags=["Occupancies"])

STAFF_ROLES = (UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.FINANCIAL_OFFICER, UserRole.EMPLOYER)


@router.get("/", response_model=PaginatedResponse)
def list_occupancies(
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    current_only: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*STAFF_ROLES)),
):
    return occupancy_service.list_occupancies(
        db, page=page, page_size=page_size, current_only=current_only, current_user=current_user
    )


@router.get("/{occupancy_id}", response_model=OccupancyResponse)
def get_occupancy(
    occupancy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*UserRole)),
):
    return occupancy_service.get_occupancy(db, occupancy_id, current_user=current_user)


@router.post("/{occupancy_id}/end", response_model=OccupancyResponse)
def end_occupancy(
    occupancy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.FINANCIAL_OFFICER)),
):
    return occupancy_service.end_occupancy(db, occupancy_id, current_user=current_user)
