from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.core.database import get_db
from app.models import InvoiceStatus, User, UserRole
from app.schemas import ArrearsSummary, InvoiceAllocateRequest, InvoiceResponse, PaginatedResponse
from app.services import billing_service

router = APIRouter(tags=["Invoices"])

FINANCE_ROLES = (UserRole.ADMIN, UserRole.FINANCIAL_OFFICER, UserRole.PROJECT_MANAGER)


@router.get("/invoices", response_model=PaginatedResponse)
def list_invoices(
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    lease_id: int | None = Query(None),
    status: InvoiceStatus | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*UserRole)),
):
    return billing_service.list_invoices(db, page, page_size, lease_id, status, current_user)


@router.get("/invoices/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*UserRole)),
):
    return billing_service.get_invoice(db, invoice_id, current_user)


@router.post("/invoices/{invoice_id}/allocate", response_model=InvoiceResponse)
def allocate_payment(
    invoice_id: int,
    data: InvoiceAllocateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*FINANCE_ROLES)),
):
    return billing_service.allocate_payment(db, invoice_id, data, current_user)


@router.get("/arrears", response_model=ArrearsSummary)
def arrears(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.ADMIN, UserRole.FINANCIAL_OFFICER, UserRole.PROJECT_MANAGER, UserRole.EMPLOYER)
    ),
):
    return billing_service.arrears_summary(db, current_user)
