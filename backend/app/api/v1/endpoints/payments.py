from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.core.database import get_db
from app.models import User, UserRole
from app.schemas import PaginatedResponse, PaymentCreate, PaymentResponse, PaymentUpdate
from app.services import payment_service

router = APIRouter(prefix="/payments", tags=["Payments"])

FINANCIAL_ROLES = (UserRole.ADMIN, UserRole.FINANCIAL_OFFICER)


@router.post("/", response_model=PaymentResponse, status_code=201)
def create_payment(
    data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*FINANCIAL_ROLES)),
):
    return payment_service.create_payment(db, data, current_user=current_user)


@router.get("/my-payments", response_model=PaginatedResponse)
def list_my_payments(
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.EMPLOYEE)),
):
    return payment_service.list_my_payments(db, current_user, page=page, page_size=page_size)


@router.get("/", response_model=PaginatedResponse)
def list_payments(
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role(*FINANCIAL_ROLES)),
):
    return payment_service.list_payments(db, page=page, page_size=page_size)


@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role(*FINANCIAL_ROLES)),
):
    return payment_service.get_payment(db, payment_id)


@router.put("/{payment_id}", response_model=PaymentResponse)
def update_payment(
    payment_id: int,
    data: PaymentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*FINANCIAL_ROLES)),
):
    return payment_service.update_payment(db, payment_id, data, current_user=current_user)
