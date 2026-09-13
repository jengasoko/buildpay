from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.models import User
from app.repositories import house_repository
from app.schemas import HouseCreate, HouseResponse, HouseUpdate
from app.services.logs import log_event


def create_house(db: Session, data: HouseCreate, current_user: User | None = None) -> HouseResponse:
    house = house_repository.create_house(db, data.model_dump())
    log_event(
        db,
        action="HOUSE.CREATED",
        entity_type="HOUSE",
        entity_id=house.id,
        details={"title": house.title},
        user_id=current_user.id if current_user else None,
    )
    return HouseResponse.model_validate(house)


def get_house(db: Session, house_id: int) -> HouseResponse:
    house = house_repository.get_house_by_id(db, house_id)
    if not house:
        raise NotFoundException("House")
    return HouseResponse.model_validate(house)


def list_houses(db: Session, page: int = 1, page_size: int = 100, available_only: bool = False) -> dict:
    skip = (page - 1) * page_size
    houses = house_repository.get_houses(db, skip=skip, limit=page_size, available_only=available_only)
    total = house_repository.count_houses(db, available_only=available_only)
    return {
        "items": [HouseResponse.model_validate(h) for h in houses],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


def update_house(db: Session, house_id: int, data: HouseUpdate, current_user: User | None = None) -> HouseResponse:
    house = house_repository.get_house_by_id(db, house_id)
    if not house:
        raise NotFoundException("House")
    update_data = data.model_dump(exclude_unset=True)
    updated = house_repository.update_house(db, house, update_data)
    log_event(
        db,
        action="HOUSE.UPDATED",
        entity_type="HOUSE",
        entity_id=house_id,
        details={"updated": list(update_data.keys())},
        user_id=current_user.id if current_user else None,
    )
    return HouseResponse.model_validate(updated)


def delete_house(db: Session, house_id: int, current_user: User | None = None) -> None:
    house = house_repository.get_house_by_id(db, house_id)
    if not house:
        raise NotFoundException("House")
    title = house.title
    house_repository.delete_house(db, house)
    log_event(
        db,
        action="HOUSE.DELETED",
        entity_type="HOUSE",
        entity_id=house_id,
        details={"title": title},
        user_id=current_user.id if current_user else None,
    )
