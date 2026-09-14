from sqlalchemy.orm import Session, joinedload

from app.models import Application, Payment


def get_payment_by_id(db: Session, payment_id: int) -> Payment | None:
    return (
        db.query(Payment)
        .options(joinedload(Payment.application).joinedload(Application.house))
        .filter(Payment.id == payment_id)
        .first()
    )


def get_payment_by_reference(db: Session, reference: str) -> Payment | None:
    return db.query(Payment).filter(Payment.reference == reference).first()


def get_payments(db: Session, skip: int = 0, limit: int = 100) -> list[Payment]:
    return (
        db.query(Payment)
        .options(
            joinedload(Payment.application).joinedload(Application.house),
            joinedload(Payment.application).joinedload(Application.employee),
        )
        .order_by(Payment.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_payments_by_employee(db: Session, employee_id: int, skip: int = 0, limit: int = 100) -> list[Payment]:
    return (
        db.query(Payment)
        .join(Payment.application)
        .options(
            joinedload(Payment.application).joinedload(Application.house),
            joinedload(Payment.application).joinedload(Application.employee),
        )
        .filter(Application.employee_id == employee_id)
        .order_by(Payment.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def count_payments_by_employee(db: Session, employee_id: int) -> int:
    return db.query(Payment).join(Payment.application).filter(Application.employee_id == employee_id).count()


def count_payments(db: Session) -> int:
    return db.query(Payment).count()


def create_payment(db: Session, payment_data: dict) -> Payment:
    payment = Payment(**payment_data)
    db.add(payment)
    db.flush()
    db.refresh(payment)
    return payment


def update_payment(db: Session, payment: Payment, update_data: dict) -> Payment:
    for key, value in update_data.items():
        setattr(payment, key, value)
    db.flush()
    db.refresh(payment)
    return payment
