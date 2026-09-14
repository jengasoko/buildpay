from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestException, ConflictException, NotFoundException
from app.models import ApplicationStatus, User
from app.repositories import application_repository, payment_repository
from app.schemas import PaymentCreate, PaymentResponse, PaymentUpdate
from app.services.logs import log_event


def _validate_application(db: Session, application_id: int | None) -> None:
    if application_id is None:
        return
    application = application_repository.get_application_by_id(db, application_id)
    if application is None:
        raise NotFoundException("Application")
    if application.status != ApplicationStatus.FINANCIAL_APPROVED:
        raise BadRequestException("Payments can only be recorded against financially approved applications")


def _validate_reference(db: Session, reference: str | None, exclude_payment_id: int | None = None) -> None:
    if not reference:
        return
    existing = payment_repository.get_payment_by_reference(db, reference)
    if existing is not None and (exclude_payment_id is None or existing.id != exclude_payment_id):
        raise ConflictException(f"Payment reference '{reference}' already exists")


def create_payment(db: Session, data: PaymentCreate, current_user: User | None = None) -> PaymentResponse:
    if data.invoice_id is not None:
        return _allocate_payment(db, data, current_user)
    return _create_legacy_payment(db, data, current_user)


def _allocate_payment(db: Session, data: PaymentCreate, current_user: User | None = None) -> PaymentResponse:
    from app.models import InvoiceStatus
    from app.repositories import invoice_repository

    invoice = invoice_repository.get_invoice_by_id(db, data.invoice_id)
    if invoice is None:
        raise NotFoundException("Invoice")
    balance = float(invoice.total_amount) - float(invoice.paid_amount)
    if balance <= 0:
        raise BadRequestException("Invoice is already paid")
    if data.amount > balance + 1e-9:
        raise BadRequestException("Payment exceeds the invoice balance")

    _validate_reference(db, data.reference)
    new_paid = round(float(invoice.paid_amount) + data.amount, 2)
    invoice_repository.update_invoice(db, invoice, {"paid_amount": new_paid})
    balance_after = round(float(invoice.total_amount) - new_paid, 2)
    new_status = InvoiceStatus.PAID if balance_after <= 0 else (InvoiceStatus.PARTIAL if new_paid > 0 else InvoiceStatus.OPEN)
    invoice_repository.update_invoice(db, invoice, {"status": new_status})

    if new_status == InvoiceStatus.PAID:
        from app.services import notification_service

        notification_service.notify(
            db,
            invoice.lease.employee_id,
            "Invoice paid",
            f"Your invoice of ${invoice.total_amount} for {invoice.house_title} is fully paid.",
        )

    payment = payment_repository.create_payment(
        db,
        {
            "invoice_id": data.invoice_id,
            "application_id": invoice.lease.occupancy.application_id if invoice.lease.occupancy else None,
            "amount": data.amount,
            "method": data.method,
            "reference": data.reference,
        },
    )
    log_event(
        db,
        action="PAYMENT.ALLOCATED",
        entity_type="INVOICE",
        entity_id=data.invoice_id,
        details={"payment_id": payment.id, "amount": data.amount},
        user_id=current_user.id if current_user else None,
    )
    return PaymentResponse.model_validate(payment)


def _create_legacy_payment(db: Session, data: PaymentCreate, current_user: User | None = None) -> PaymentResponse:
    _validate_application(db, data.application_id)
    _validate_reference(db, data.reference)
    payment = payment_repository.create_payment(db, data.model_dump(exclude={"invoice_id"}))
    log_event(
        db,
        action="PAYMENT.CREATED",
        entity_type="PAYMENT",
        entity_id=payment.id,
        details={
            "amount": str(payment.amount),
            "application_id": payment.application_id,
            "reference": payment.reference,
        },
        user_id=current_user.id if current_user else None,
    )
    if data.application_id is not None:
        application = application_repository.get_application_by_id(db, data.application_id)
        if application is not None and application.employee_id is not None:
            employee = db.query(User).filter(User.id == application.employee_id).first()
            if employee is not None:
                from app.services import notification_service

                notification_service.notify(
                    db,
                    employee.id,
                    "Payment recorded",
                    f"A payment of ${payment.amount} was recorded on your account.",
                )
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


def list_my_payments(db: Session, current_user: User, page: int = 1, page_size: int = 100) -> dict:
    skip = (page - 1) * page_size
    payments = payment_repository.get_payments_by_employee(db, current_user.id, skip=skip, limit=page_size)
    total = payment_repository.count_payments_by_employee(db, current_user.id)
    return {
        "items": [PaymentResponse.model_validate(p) for p in payments],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


def update_payment(
    db: Session, payment_id: int, data: PaymentUpdate, current_user: User | None = None
) -> PaymentResponse:
    payment = payment_repository.get_payment_by_id(db, payment_id)
    if not payment:
        raise NotFoundException("Payment")
    update_data = data.model_dump(exclude_unset=True)
    if "application_id" in update_data:
        _validate_application(db, update_data["application_id"] or None)
    if "reference" in update_data:
        _validate_reference(db, update_data["reference"], exclude_payment_id=payment_id)
    updated = payment_repository.update_payment(db, payment, update_data)
    log_event(
        db,
        action="PAYMENT.UPDATED",
        entity_type="PAYMENT",
        entity_id=payment_id,
        details={"amount": str(updated.amount), "reference": updated.reference},
        user_id=current_user.id if current_user else None,
    )
    return PaymentResponse.model_validate(updated)
