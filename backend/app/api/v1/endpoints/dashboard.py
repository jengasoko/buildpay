from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.core.database import get_db
from app.models import User, UserRole
from app.schemas import (
    DashboardStatsResponse,
    EmployeeDashboardResponse,
    FinancialReport,
    OccupancyReport,
)
from app.services import billing_service, dashboard_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
def dashboard_stats(
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role(*UserRole)),
):
    return dashboard_service.get_dashboard_stats(db)


@router.get("/me", response_model=EmployeeDashboardResponse)
def employee_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*UserRole)),
):
    return dashboard_service.get_employee_dashboard(db, current_user)


@router.get("/reports/financial", response_model=FinancialReport)
def financial_report(
    year: int = Query(..., ge=2020, le=2100),
    month: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.FINANCIAL_OFFICER, UserRole.PROJECT_MANAGER)),
):
    return billing_service.financial_report(db, year, month)


@router.get("/reports/occupancy", response_model=OccupancyReport)
def occupancy_report(
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.FINANCIAL_OFFICER, UserRole.PROJECT_MANAGER)),
):
    return billing_service.occupancy_report(db)
