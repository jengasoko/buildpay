from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.core.database import get_db
from app.models import User, UserRole
from app.schemas import (
    CollectionRateResponse,
    DashboardStatsResponse,
    EmployeeDashboardResponse,
    FinancialReport,
    OccupancyReport,
    OccupancyTrendResponse,
    RevenueTrendResponse,
)
from app.services import analytics_service, billing_service, dashboard_service, export_service

FINANCE_ROLES = (UserRole.ADMIN, UserRole.FINANCIAL_OFFICER, UserRole.PROJECT_MANAGER)

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
    _current_user: User = Depends(require_role(*FINANCE_ROLES)),
):
    return billing_service.financial_report(db, year, month)


@router.get("/reports/occupancy", response_model=OccupancyReport)
def occupancy_report(
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role(*FINANCE_ROLES)),
):
    return billing_service.occupancy_report(db)


@router.get("/analytics/revenue-trend", response_model=RevenueTrendResponse)
def revenue_trend(
    months: int = Query(default=12, ge=1, le=36),
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role(*FINANCE_ROLES)),
):
    return analytics_service.revenue_trend(db, months)


@router.get("/analytics/occupancy-trend", response_model=OccupancyTrendResponse)
def occupancy_trend(
    months: int = Query(default=12, ge=1, le=36),
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role(*FINANCE_ROLES)),
):
    return analytics_service.occupancy_trend(db, months)


@router.get("/analytics/collection-rate", response_model=CollectionRateResponse)
def collection_rate(
    months: int = Query(default=12, ge=1, le=36),
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role(*FINANCE_ROLES)),
):
    return analytics_service.collection_rate(db, months)


@router.get("/reports/financial/export")
def financial_report_export(
    year: int = Query(..., ge=2020, le=2100),
    month: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role(*FINANCE_ROLES)),
):
    return export_service.financial_report_csv(db, year, month)


@router.get("/reports/occupancy/export")
def occupancy_report_export(
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role(*FINANCE_ROLES)),
):
    return export_service.occupancy_report_csv(db)


@router.get("/analytics/revenue-trend/export")
def revenue_trend_export(
    months: int = Query(default=12, ge=1, le=36),
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role(*FINANCE_ROLES)),
):
    return export_service.revenue_trend_csv(db, months)
