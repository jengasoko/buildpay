from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestException, ConflictException, NotFoundException
from app.core.security import create_access_token, hash_password, verify_password
from app.models import User
from app.repositories import user_repository
from app.schemas import LoginRequest, TokenResponse, UserCreate, UserResponse, UserUpdate
from app.services.logs import log_event, log_security_event


def register_user(db: Session, data: UserCreate) -> UserResponse:
    if user_repository.get_user_by_username(db, data.username):
        raise ConflictException("Username already exists")
    if user_repository.get_user_by_email(db, data.email):
        raise ConflictException("Email already exists")

    user_data = data.model_dump()
    user_data["hashed_password"] = hash_password(user_data.pop("password"))
    user = user_repository.create_user(db, user_data)
    log_event(
        db,
        action="USER.REGISTERED",
        entity_type="USER",
        entity_id=user.id,
        details={"username": user.username, "role": user.role.value},
        user_id=user.id,
    )
    return UserResponse.model_validate(user)


def authenticate_user(db: Session, data: LoginRequest) -> TokenResponse:
    user = user_repository.get_user_by_username(db, data.username)
    if not user or not verify_password(data.password, user.hashed_password):
        log_security_event(
            db,
            action="AUTH.LOGIN_FAILED",
            entity_type="AUTH",
            details={"username": data.username, "user_id": user.id if user else None, "reason": "bad_credentials"},
        )
        raise BadRequestException("Invalid username or password")
    if not user.is_active:
        log_security_event(
            db,
            action="AUTH.ACCOUNT_DISABLED",
            entity_type="AUTH",
            details={"username": data.username, "user_id": user.id},
            user_id=user.id,
        )
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


def update_user(db: Session, user_id: int, data: UserUpdate, current_user: User | None = None) -> UserResponse:
    user = user_repository.get_user_by_id(db, user_id)
    if not user:
        raise NotFoundException("User")
    update_data = data.model_dump(exclude_unset=True)
    details = {"updated": list(update_data.keys())}
    if "role" in update_data and user.role != update_data["role"]:
        details["role_changed"] = {"from": user.role.value, "to": update_data["role"].value}
    updated = user_repository.update_user(db, user, update_data)
    log_event(
        db,
        action="USER.UPDATED",
        entity_type="USER",
        entity_id=user_id,
        details=details,
        user_id=current_user.id if current_user else None,
    )
    return UserResponse.model_validate(updated)
