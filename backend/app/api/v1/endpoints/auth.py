from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.rate_limit import rate_limit
from app.schemas import LoginRequest, TokenResponse, UserCreate, UserResponse
from app.services import user_service

router = APIRouter(prefix="/auth", tags=["Authentication"])

_register_rate_limit = rate_limit(
    "auth_register", settings.RATE_LIMIT_REGISTER_ATTEMPTS, settings.RATE_LIMIT_REGISTER_WINDOW_SECONDS
)
_login_rate_limit = rate_limit(
    "auth_login", settings.RATE_LIMIT_LOGIN_ATTEMPTS, settings.RATE_LIMIT_LOGIN_WINDOW_SECONDS
)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=201,
    dependencies=[Depends(_register_rate_limit)],
)
def register(data: UserCreate, db: Session = Depends(get_db)):
    return user_service.register_user(db, data)


@router.post(
    "/login",
    response_model=TokenResponse,
    dependencies=[Depends(_login_rate_limit)],
)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    return user_service.authenticate_user(db, data)
