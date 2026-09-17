from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.core.database import get_db
from app.models import User, UserRole
from app.schemas import PaginatedResponse, RoomCreate, RoomResponse, RoomUpdate
from app.services import room_service

router = APIRouter(prefix="/rooms", tags=["Rooms"])

MANAGER_ROLES = (UserRole.ADMIN, UserRole.FINANCIAL_OFFICER, UserRole.PROJECT_MANAGER)


@router.post("", response_model=RoomResponse, status_code=201)
def create_room(
    data: RoomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*MANAGER_ROLES)),
):
    return room_service.create_room(db, data, current_user=current_user)


@router.get("", response_model=PaginatedResponse)
def list_rooms(
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    house_id: int | None = Query(None),
    db: Session = Depends(get_db),
):
    return room_service.list_rooms(db, page=page, page_size=page_size, house_id=house_id)


@router.get("/{room_id}", response_model=RoomResponse)
def get_room(room_id: int, db: Session = Depends(get_db)):
    return room_service.get_room(db, room_id)


@router.put("/{room_id}", response_model=RoomResponse)
def update_room(
    room_id: int,
    data: RoomUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*MANAGER_ROLES)),
):
    return room_service.update_room(db, room_id, data, current_user=current_user)
