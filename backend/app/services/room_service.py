from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.models import User
from app.repositories import house_repository, room_repository
from app.schemas import RoomCreate, RoomResponse, RoomUpdate
from app.services.logs import log_event


def create_room(db: Session, data: RoomCreate, current_user: User) -> RoomResponse:
    house = house_repository.get_house_by_id(db, data.house_id)
    if house is None:
        raise NotFoundException("House")
    room = room_repository.create_room(db, data.model_dump())
    log_event(
        db,
        action="ROOM.CREATED",
        entity_type="ROOM",
        entity_id=room.id,
        details={"house_id": data.house_id, "room_number": room.room_number},
        user_id=current_user.id,
    )
    return RoomResponse.model_validate(room)


def get_room(db: Session, room_id: int) -> RoomResponse:
    room = room_repository.get_room_by_id(db, room_id)
    if not room:
        raise NotFoundException("Room")
    return RoomResponse.model_validate(room)


def list_rooms(db: Session, page: int = 1, page_size: int = 100, house_id: int | None = None) -> dict:
    skip = (page - 1) * page_size
    rooms = room_repository.get_rooms(db, skip=skip, limit=page_size, house_id=house_id)
    total = room_repository.count_rooms(db, house_id=house_id)
    return {
        "items": [RoomResponse.model_validate(r) for r in rooms],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


def update_room(db: Session, room_id: int, data: RoomUpdate, current_user: User) -> RoomResponse:
    room = room_repository.get_room_by_id(db, room_id)
    if not room:
        raise NotFoundException("Room")
    update_data = data.model_dump(exclude_unset=True)
    updated = room_repository.update_room(db, room, update_data)
    log_event(
        db,
        action="ROOM.UPDATED",
        entity_type="ROOM",
        entity_id=room_id,
        details=update_data,
        user_id=current_user.id,
    )
    return RoomResponse.model_validate(updated)
