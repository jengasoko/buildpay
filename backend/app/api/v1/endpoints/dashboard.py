from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.core.database import get_db
from app.models import User, UserRole
from app.schemas import DashboardStatsResponse
from app.services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
def dashboard_stats(
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role(*UserRole)),
):
    return dashboard_service.get_dashboard_stats(db)
