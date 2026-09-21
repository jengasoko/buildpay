import json
from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestException, ForbiddenException, NotFoundException
from app.models import Employment, MaintenanceRequest, MaintenanceStatus, User, UserRole
from app.repositories import house_repository, maintenance_repository, room_repository, user_repository
from app.schemas import MaintenanceCreate, MaintenanceResponse, MaintenanceUpdate
from app.services import notification_service
from app.services.logs import log_event

MANAGER_ROLES = (UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.FINANCIAL_OFFICER)


def create_request(db: Session, data: MaintenanceCreate, current_user: User) -> MaintenanceResponse:
    house = house_repository.get_house_by_id(db, data.house_id)
    if not house:
        raise NotFoundException("House")
    if data.room_id is not None:
        room = room_repository.get_room_by_id(db, data.room_id)
        if room is None:
            raise NotFoundException("Room")

    payload = data.model_dump()
    payload["photos"] = json.dumps(list(data.photos or []))
    payload["reported_by_id"] = current_user.id

    if data.employee_id is not None and current_user.role != UserRole.EMPLOYEE:
        employee = user_repository.get_user_by_id(db, data.employee_id)
        if employee is None or employee.role != UserRole.EMPLOYEE:
            raise BadRequestException("employee_id must reference an employee account")
    elif data.employee_id is not None and current_user.role == UserRole.EMPLOYEE:
        if data.employee_id != current_user.id:
            raise ForbiddenException("Employees may not file requests on behalf of others")
    payload["employee_id"] = data.employee_id or current_user.id

    request = maintenance_repository.create_request(db, payload)
    log_event(
        db,
        action="MAINTENANCE.CREATED",
        entity_type="MAINTENANCE",
        entity_id=request.id,
        details={"house_id": data.house_id, "category": data.category.value},
        user_id=current_user.id,
    )
    return MaintenanceResponse.model_validate(request)


def get_request(db: Session, request_id: int, current_user: User | None = None) -> MaintenanceResponse:
    request = maintenance_repository.get_request_by_id(db, request_id)
    if not request:
        raise NotFoundException("Maintenance request")
    _assert_visible(db, request, current_user)
    return MaintenanceResponse.model_validate(request)


def _team_employee_ids(db: Session, employer_id: int) -> list[int]:
    return [e.employee_id for e in db.query(Employment).filter_by(employer_id=employer_id).all()]


def _assert_visible(db: Session, request: MaintenanceRequest, current_user: User | None) -> None:
    if current_user is None:
        return
    if current_user.role in MANAGER_ROLES:
        return
    if current_user.role == UserRole.EMPLOYEE and request.employee_id == current_user.id:
        return
    if current_user.role == UserRole.EMPLOYER and request.employee_id in _team_employee_ids(db, current_user.id):
        return
    raise ForbiddenException("Insufficient permissions to view this maintenance request")


def list_requests(
    db: Session,
    page: int = 1,
    page_size: int = 100,
    status: MaintenanceStatus | None = None,
    current_user: User | None = None,
) -> dict:
    employee_ids = None
    house_ids = None
    if current_user is not None and current_user.role == UserRole.EMPLOYEE:
        employee_ids = [current_user.id]
    elif current_user is not None and current_user.role == UserRole.EMPLOYER:
        employee_ids = _team_employee_ids(db, current_user.id)

    skip = (page - 1) * page_size
    requests = maintenance_repository.get_requests(
        db, skip=skip, limit=page_size, status=status, employee_ids=employee_ids, house_ids=house_ids
    )
    total = maintenance_repository.count_requests(db, status=status, employee_ids=employee_ids, house_ids=house_ids)
    return {
        "items": [MaintenanceResponse.model_validate(r) for r in requests],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


def update_request(db: Session, request_id: int, data: MaintenanceUpdate, current_user: User) -> MaintenanceResponse:
    request = maintenance_repository.get_request_by_id(db, request_id)
    if not request:
        raise NotFoundException("Maintenance request")
    if current_user.role == UserRole.EMPLOYEE and request.employee_id != current_user.id:
        raise ForbiddenException("Employees may only update their own maintenance requests")

    payload = data.model_dump(exclude_unset=True)
    new_status = payload.get("status")

    if new_status in (MaintenanceStatus.RESOLVED, MaintenanceStatus.CLOSED):
        if current_user.role == UserRole.EMPLOYEE and new_status == MaintenanceStatus.CLOSED:
            if request.employee_id != current_user.id:
                raise ForbiddenException("Only the requesting employee may close this request")
        elif current_user.role not in MANAGER_ROLES and new_status == MaintenanceStatus.RESOLVED:
            raise ForbiddenException("Only managers may resolve maintenance requests")
        if new_status == MaintenanceStatus.RESOLVED and request.status not in (
            MaintenanceStatus.SUBMITTED,
            MaintenanceStatus.ASSIGNED,
        ):
            raise BadRequestException("Only open requests may be resolved")

    if new_status == MaintenanceStatus.ASSIGNED and "assigned_to_id" not in payload:
        raise BadRequestException("Assignment requires a technician (assigned_to_id)")
    if new_status == MaintenanceStatus.ASSIGNED:
        payload["assigned_by_id"] = current_user.id

    if payload.get("assigned_to_id") is not None and current_user.role == UserRole.EMPLOYEE:
        raise ForbiddenException("Employees cannot assign maintenance requests")

    if new_status == MaintenanceStatus.CLOSED and request.status == MaintenanceStatus.RESOLVED:
        payload["closed_at"] = datetime.now(UTC)

    updated = maintenance_repository.update_request(db, request, payload)

    if new_status == MaintenanceStatus.ASSIGNED and updated.assigned_to_id:
        notification_service.notify(
            db,
            updated.assigned_to_id,
            "Maintenance assigned",
            f"{updated.title} (house {updated.house_title}) has been assigned to you.",
        )

    log_event(
        db,
        action="MAINTENANCE.UPDATED",
        entity_type="MAINTENANCE",
        entity_id=request_id,
        details={k: _serialize(v) for k, v in payload.items()},
        user_id=current_user.id,
    )
    return MaintenanceResponse.model_validate(updated)


def _serialize(value):
    if isinstance(value, MaintenanceStatus):
        return value.value
    if isinstance(value, datetime):
        return value.isoformat()
    return value
