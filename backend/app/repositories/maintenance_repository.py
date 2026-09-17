from sqlalchemy.orm import Session

from app.models import MaintenanceRequest, MaintenanceStatus


def get_request_by_id(db: Session, request_id: int) -> MaintenanceRequest | None:
    return db.query(MaintenanceRequest).filter(MaintenanceRequest.id == request_id).first()


def get_requests(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: MaintenanceStatus | None = None,
    employee_ids: list[int] | None = None,
    house_ids: list[int] | None = None,
) -> list[MaintenanceRequest]:
    query = db.query(MaintenanceRequest)
    if status is not None:
        query = query.filter(MaintenanceRequest.status == status)
    if employee_ids is not None:
        query = query.filter(MaintenanceRequest.employee_id.in_(employee_ids))
    if house_ids is not None:
        query = query.filter(MaintenanceRequest.house_id.in_(house_ids))
    return query.order_by(MaintenanceRequest.created_at.desc()).offset(skip).limit(limit).all()


def count_requests(
    db: Session,
    status: MaintenanceStatus | None = None,
    employee_ids: list[int] | None = None,
    house_ids: list[int] | None = None,
) -> int:
    query = db.query(MaintenanceRequest)
    if status is not None:
        query = query.filter(MaintenanceRequest.status == status)
    if employee_ids is not None:
        query = query.filter(MaintenanceRequest.employee_id.in_(employee_ids))
    if house_ids is not None:
        query = query.filter(MaintenanceRequest.house_id.in_(house_ids))
    return query.count()


def count_open_requests(db: Session, employee_id: int | None = None) -> int:
    query = db.query(MaintenanceRequest).filter(
        MaintenanceRequest.status.in_([MaintenanceStatus.SUBMITTED, MaintenanceStatus.ASSIGNED])
    )
    if employee_id is not None:
        query = query.filter(MaintenanceRequest.employee_id == employee_id)
    return query.count()


def create_request(db: Session, data: dict) -> MaintenanceRequest:
    request = MaintenanceRequest(**data)
    db.add(request)
    db.flush()
    db.refresh(request)
    return request


def update_request(db: Session, request: MaintenanceRequest, update_data: dict) -> MaintenanceRequest:
    for key, value in update_data.items():
        setattr(request, key, value)
    db.flush()
    db.refresh(request)
    return request
