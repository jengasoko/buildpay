from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.core.database import get_db
from app.models import User, UserRole
from app.schemas import (
    InvoiceResponse,
    LeaseCreate,
    LeaseResponse,
    LeaseUpdate,
    PaginatedResponse,
    StatementOfAccount,
)
from app.services import billing_service, lease_service

router = APIRouter(prefix="/leases", tags=["Leases"])

MANAGER_ROLES = (UserRole.ADMIN, UserRole.FINANCIAL_OFFICER, UserRole.PROJECT_MANAGER)


@router.post("", response_model=LeaseResponse, status_code=201)
def create_lease(
    data: LeaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*MANAGER_ROLES)),
):
    return lease_service.create_lease(db, data, current_user=current_user)


@router.get("", response_model=PaginatedResponse)
def list_leases(
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    status: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*UserRole)),
):
    from app.models import LeaseStatus

    status_enum = LeaseStatus(status) if status else None
    return lease_service.list_leases(db, page=page, page_size=page_size, status=status_enum, current_user=current_user)


@router.get("/me", response_model=LeaseResponse | None)
def my_lease(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*UserRole)),
):
    return lease_service.my_lease(db, current_user)


@router.get("/{lease_id}", response_model=LeaseResponse)
def get_lease(
    lease_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*UserRole)),
):
    return lease_service.get_lease(db, lease_id, current_user=current_user)


@router.put("/{lease_id}", response_model=LeaseResponse)
def update_lease(
    lease_id: int,
    data: LeaseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*MANAGER_ROLES)),
):
    return lease_service.update_lease(db, lease_id, data, current_user=current_user)


@router.post("/{lease_id}/sign", response_model=LeaseResponse)
def sign_lease(
    lease_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*UserRole)),
):
    return lease_service.sign_lease(db, lease_id, current_user)


@router.post("/{lease_id}/terminate", response_model=LeaseResponse)
def terminate_lease(
    lease_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*MANAGER_ROLES)),
):
    return lease_service.terminate_lease(db, lease_id, current_user)


@router.post("/{lease_id}/generate-invoice", response_model=InvoiceResponse)
def generate_invoice(
    lease_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*MANAGER_ROLES)),
):
    return billing_service.generate_monthly_invoice(db, lease_id, current_user)


@router.get("/{lease_id}/statement", response_model=StatementOfAccount)
def statement(
    lease_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*UserRole)),
):
    return billing_service.statement_of_account(db, lease_id, current_user)
