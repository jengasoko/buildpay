from sqlalchemy.orm import Session

from app.models import House


def get_house_by_id(db: Session, house_id: int) -> House | None:
    return db.query(House).filter(House.id == house_id).first()


def get_houses(db: Session, skip: int = 0, limit: int = 100, available_only: bool = False) -> list[House]:
    query = db.query(House)
    if available_only:
        query = query.filter(House.available)
    return query.offset(skip).limit(limit).all()


def count_houses(db: Session, available_only: bool = False) -> int:
    query = db.query(House)
    if available_only:
        query = query.filter(House.available)
    return query.count()


def create_house(db: Session, house_data: dict) -> House:
    house = House(**house_data)
    db.add(house)
    db.flush()
    db.refresh(house)
    return house


def update_house(db: Session, house: House, update_data: dict) -> House:
    for key, value in update_data.items():
        setattr(house, key, value)
    db.flush()
    db.refresh(house)
    return house


def delete_house(db: Session, house: House) -> None:
    db.delete(house)
    db.flush()
