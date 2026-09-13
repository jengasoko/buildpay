from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.core.database import get_db
from app.models import User, UserRole
from app.schemas import PaginatedResponse, SystemLogResponse
from app.services import logs as logs_service

router = APIRouter(prefix="/system-logs", tags=["System Logs"])

AUDIT_ROLES = (UserRole.ADMIN, UserRole.PROJECT_MANAGER)


@router.get("/", response_model=PaginatedResponse)
def list_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role(*AUDIT_ROLES)),
):
    return logs_service.list_logs(db, page=page, page_size=page_size)


@router.get("/{log_id}", response_model=SystemLogResponse)
def get_log(
    log_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role(*AUDIT_ROLES)),
):
    return logs_service.get_log(db, log_id)
