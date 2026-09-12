from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.repositories import payment_repository
from app.schemas import PaymentCreate, PaymentResponse, PaymentUpdate


def create_payment(db: Session, data: PaymentCreate) -> PaymentResponse:
    payment = payment_repository.create_payment(db, data.model_dump())
    return PaymentResponse.model_validate(payment)


def get_payment(db: Session, payment_id: int) -> PaymentResponse:
    payment = payment_repository.get_payment_by_id(db, payment_id)
    if not payment:
        raise NotFoundException("Payment")
    return PaymentResponse.model_validate(payment)


def list_payments(db: Session, page: int = 1, page_size: int = 100) -> dict:
    skip = (page - 1) * page_size
    payments = payment_repository.get_payments(db, skip=skip, limit=page_size)
    total = payment_repository.count_payments(db)
    return {
        "items": [PaymentResponse.model_validate(p) for p in payments],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


def update_payment(db: Session, payment_id: int, data: PaymentUpdate) -> PaymentResponse:
    payment = payment_repository.get_payment_by_id(db, payment_id)
    if not payment:
        raise NotFoundException("Payment")
    update_data = data.model_dump(exclude_unset=True)
    updated = payment_repository.update_payment(db, payment, update_data)
    return PaymentResponse.model_validate(updated)
