from sqlalchemy.orm import Session, joinedload

from app.models import Employment, User


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return (
        db.query(User)
        .options(joinedload(User.employment_as_employee).joinedload(Employment.employer))
        .filter(User.id == user_id)
        .first()
    )


def get_user_by_username(db: Session, username: str) -> User | None:
    return (
        db.query(User)
        .options(joinedload(User.employment_as_employee).joinedload(Employment.employer))
        .filter(User.username == username)
        .first()
    )


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_users(db: Session, skip: int = 0, limit: int = 100) -> list[User]:
    return (
        db.query(User)
        .options(joinedload(User.employment_as_employee).joinedload(Employment.employer))
        .order_by(User.id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def count_users(db: Session) -> int:
    return db.query(User).count()


def create_user(db: Session, user_data: dict) -> User:
    user = User(**user_data)
    db.add(user)
    db.flush()
    db.refresh(user)
    return user


def update_user(db: Session, user: User, update_data: dict) -> User:
    for key, value in update_data.items():
        setattr(user, key, value)
    db.flush()
    db.refresh(user)
    return user
