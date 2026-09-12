from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestException, ConflictException, NotFoundException
from app.core.security import create_access_token, hash_password, verify_password
from app.repositories import user_repository
from app.schemas import LoginRequest, TokenResponse, UserCreate, UserResponse, UserUpdate


def register_user(db: Session, data: UserCreate) -> UserResponse:
    if user_repository.get_user_by_username(db, data.username):
        raise ConflictException("Username already exists")
    if user_repository.get_user_by_email(db, data.email):
        raise ConflictException("Email already exists")

    user_data = data.model_dump()
    user_data["hashed_password"] = hash_password(user_data.pop("password"))
    user = user_repository.create_user(db, user_data)
    return UserResponse.model_validate(user)


def authenticate_user(db: Session, data: LoginRequest) -> TokenResponse:
    user = user_repository.get_user_by_username(db, data.username)
    if not user or not verify_password(data.password, user.hashed_password):
        raise BadRequestException("Invalid username or password")
    if not user.is_active:
        raise BadRequestException("Account is disabled")

    token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    return TokenResponse(access_token=token)


def get_user(db: Session, user_id: int) -> UserResponse:
    user = user_repository.get_user_by_id(db, user_id)
    if not user:
        raise NotFoundException("User")
    return UserResponse.model_validate(user)


def list_users(db: Session, page: int = 1, page_size: int = 100) -> dict:
    skip = (page - 1) * page_size
    users = user_repository.get_users(db, skip=skip, limit=page_size)
    total = user_repository.count_users(db)
    return {
        "items": [UserResponse.model_validate(u) for u in users],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


def update_user(db: Session, user_id: int, data: UserUpdate) -> UserResponse:
    user = user_repository.get_user_by_id(db, user_id)
    if not user:
        raise NotFoundException("User")
    update_data = data.model_dump(exclude_unset=True)
    updated = user_repository.update_user(db, user, update_data)
    return UserResponse.model_validate(updated)
