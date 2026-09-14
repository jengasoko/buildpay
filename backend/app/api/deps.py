from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import ForbiddenException, UnauthorizedException
from app.core.security import decode_access_token
from app.models import User, UserRole
from app.repositories.user_repository import get_user_by_id

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise UnauthorizedException("Invalid or expired token")

    user_id = payload.get("sub")
    if user_id is None:
        raise UnauthorizedException("Invalid token payload")

    user = get_user_by_id(db, int(user_id))
    if user is None:
        raise UnauthorizedException("User not found")
    if not user.is_active:
        raise UnauthorizedException("User account is disabled")

    return user


def require_role(*roles: UserRole):
    def role_checker(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> User:
        if current_user.role not in roles:
            from app.services.logs import log_security_event

            log_security_event(
                db,
                action="ACCESS.DENIED",
                entity_type="ENDPOINT",
                details={
                    "user_id": current_user.id,
                    "username": current_user.username,
                    "actual_role": current_user.role.value,
                    "required_roles": [role.value for role in roles],
                },
                user_id=current_user.id,
            )
            raise ForbiddenException("Insufficient permissions")
        return current_user

    return role_checker
