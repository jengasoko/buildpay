from sqlalchemy.orm import Session

from app.models import Payment


def get_payment_by_id(db: Session, payment_id: int) -> Payment | None:
    return db.query(Payment).filter(Payment.id == payment_id).first()


def get_payment_by_reference(db: Session, reference: str) -> Payment | None:
    return db.query(Payment).filter(Payment.reference == reference).first()


def get_payments(db: Session, skip: int = 0, limit: int = 100) -> list[Payment]:
    return db.query(Payment).offset(skip).limit(limit).all()


def count_payments(db: Session) -> int:
    return db.query(Payment).count()


def create_payment(db: Session, payment_data: dict) -> Payment:
    payment = Payment(**payment_data)
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


def update_payment(db: Session, payment: Payment, update_data: dict) -> Payment:
    for key, value in update_data.items():
        if value is not None:
            setattr(payment, key, value)
    db.commit()
    db.refresh(payment)
    return payment
