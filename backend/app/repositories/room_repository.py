from sqlalchemy.orm import Session

from app.models import Room


def get_room_by_id(db: Session, room_id: int) -> Room | None:
    return db.query(Room).filter(Room.id == room_id).first()


def get_rooms(db: Session, skip: int = 0, limit: int = 100, house_id: int | None = None) -> list[Room]:
    query = db.query(Room)
    if house_id is not None:
        query = query.filter(Room.house_id == house_id)
    return query.offset(skip).limit(limit).all()


def count_rooms(db: Session, house_id: int | None = None) -> int:
    query = db.query(Room)
    if house_id is not None:
        query = query.filter(Room.house_id == house_id)
    return query.count()


def count_available_rooms(db: Session, house_id: int | None = None) -> int:
    query = db.query(Room).filter(Room.is_available.is_(True))
    if house_id is not None:
        query = query.filter(Room.house_id == house_id)
    return query.count()


def create_room(db: Session, data: dict) -> Room:
    room = Room(**data)
    db.add(room)
    db.flush()
    db.refresh(room)
    return room


def update_room(db: Session, room: Room, update_data: dict) -> Room:
    for key, value in update_data.items():
        setattr(room, key, value)
    db.flush()
    db.refresh(room)
    return room
