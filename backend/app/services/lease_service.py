from datetime import UTC, datetime, timedelta

from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestException, ConflictException, ForbiddenException, NotFoundException
from app.models import Employment, Lease, LeaseStatus, User, UserRole
from app.repositories import house_repository, lease_repository, occupancy_repository, room_repository
from app.schemas import LeaseCreate, LeaseResponse, LeaseUpdate
from app.services.logs import log_event

FINANCE_ROLES = (UserRole.ADMIN, UserRole.FINANCIAL_OFFICER, UserRole.PROJECT_MANAGER)


def create_lease_from_occupancy(db: Session, occupancy_id: int, *, current_user: User | None = None) -> LeaseResponse:
    """Creates the tenancy record for a financially-approved application."""
    occupancy = occupancy_repository.get_occupancy_by_id(db, occupancy_id)
    if not occupancy:
        raise NotFoundException("Occupancy")
    if lease_repository.get_active_lease_by_occupancy(db, occupancy_id) is not None:
        raise BadRequestException("Occupancy already has an active lease")

    rent = float(occupancy.house.rent_price) if occupancy.house else 0.0
    deposit = rent if rent else 0.0
    today = datetime.now(UTC)
    default_end = today + timedelta(days=365)

    lease = lease_repository.create_lease(
        db,
        {
            "occupancy_id": occupancy_id,
            "employee_id": occupancy.employee_id,
            "house_id": occupancy.house_id,
            "room_id": occupancy.room_id,
            "rent_amount": rent,
            "deposit_amount": deposit,
            "start_date": today,
            "end_date": default_end,
            "billing_day": min(today.day, 28),
            "late_fee_amount": 0,
        },
    )

    if occupancy.room_id is not None:
        room = room_repository.get_room_by_id(db, occupancy.room_id)
        if room is not None and room.is_available:
            room_repository.update_room(db, room, {"is_available": False})
    occupancy_repository.update_occupancy(db, occupancy, {"lease_id": lease.id})

    log_event(
        db,
        action="LEASE.CREATED",
        entity_type="LEASE",
        entity_id=lease.id,
        details={"occupancy_id": occupancy_id, "employee_id": occupancy.employee_id, "rent": rent},
        user_id=current_user.id if current_user else None,
    )
    return LeaseResponse.model_validate(lease)


def create_lease(db: Session, data: LeaseCreate, current_user: User) -> LeaseResponse:
    occupancy = occupancy_repository.get_occupancy_by_id(db, data.occupancy_id)
    if not occupancy:
        raise NotFoundException("Occupancy")
    if lease_repository.get_active_lease_by_occupancy(db, data.occupancy_id) is not None:
        raise ConflictException("Occupancy already has an active lease")
    if data.room_id is not None:
        room = room_repository.get_room_by_id(db, data.room_id)
        if room is None:
            raise NotFoundException("Room")
        if room.house_id != occupancy.house_id:
            raise BadRequestException("Room does not belong to the occupancy house")

    lease_data = data.model_dump()
    lease_data.setdefault("employee_id", occupancy.employee_id)
    lease_data.setdefault("house_id", occupancy.house_id)
    lease = lease_repository.create_lease(db, lease_data)

    if data.room_id is not None:
        room_repository.update_room(db, room, {"is_available": False})
    occupancy_repository.update_occupancy(db, occupancy, {"room_id": data.room_id, "lease_id": lease.id})

    log_event(
        db,
        action="LEASE.CREATED",
        entity_type="LEASE",
        entity_id=lease.id,
        details={"occupancy_id": occupancy.id, "employee_id": occupancy.employee_id},
        user_id=current_user.id,
    )
    return LeaseResponse.model_validate(lease)


def get_lease(db: Session, lease_id: int, current_user: User | None = None) -> LeaseResponse:
    lease = lease_repository.get_lease_by_id(db, lease_id)
    if not lease:
        raise NotFoundException("Lease")
    _assert_can_view(db, lease, current_user)
    return LeaseResponse.model_validate(lease)


def my_lease(db: Session, current_user: User) -> LeaseResponse | None:
    lease = lease_repository.get_active_lease_by_employee(db, current_user.id)
    if lease is None:
        return None
    return LeaseResponse.model_validate(lease)


def _team_ids(db: Session, employer_id: int) -> list[int]:
    return [e.employee_id for e in db.query(Employment).filter_by(employer_id=employer_id).all()]


def _assert_can_view(db: Session, lease: Lease, current_user: User | None) -> None:
    if current_user is None:
        return
    if current_user.role in FINANCE_ROLES:
        return
    if current_user.role == UserRole.EMPLOYEE and lease.employee_id == current_user.id:
        return
    if current_user.role == UserRole.EMPLOYER and lease.employee_id in _team_ids(db, current_user.id):
        return
    raise ForbiddenException("Insufficient permissions to view this lease")


def list_leases(
    db: Session,
    page: int = 1,
    page_size: int = 100,
    status: LeaseStatus | None = None,
    current_user: User | None = None,
) -> dict:
    employee_ids = None
    if current_user is not None and current_user.role == UserRole.EMPLOYER:
        employee_ids = _team_ids(db, current_user.id)
    elif current_user is not None and current_user.role == UserRole.EMPLOYEE:
        employee_ids = [current_user.id]

    skip = (page - 1) * page_size
    leases = lease_repository.get_leases(db, skip=skip, limit=page_size, status=status, employee_ids=employee_ids)
    total = lease_repository.count_leases(db, status=status, employee_ids=employee_ids)
    return {
        "items": [LeaseResponse.model_validate(lease) for lease in leases],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


def update_lease(db: Session, lease_id: int, data: LeaseUpdate, current_user: User) -> LeaseResponse:
    lease = lease_repository.get_lease_by_id(db, lease_id)
    if not lease:
        raise NotFoundException("Lease")
    update_data = data.model_dump(exclude_unset=True)
    if "room_id" in update_data and update_data["room_id"] != lease.room_id:
        if lease.room is not None:
            room_repository.update_room(db, lease.room, {"is_available": True})
        if update_data["room_id"] is not None:
            room = room_repository.get_room_by_id(db, update_data["room_id"])
            if room is None:
                raise NotFoundException("Room")
            room_repository.update_room(db, room, {"is_available": False})
    updated = lease_repository.update_lease(db, lease, update_data)
    log_event(
        db,
        action="LEASE.UPDATED",
        entity_type="LEASE",
        entity_id=lease_id,
        details=update_data,
        user_id=current_user.id,
    )
    return LeaseResponse.model_validate(updated)


def sign_lease(db: Session, lease_id: int, current_user: User) -> LeaseResponse:
    lease = lease_repository.get_lease_by_id(db, lease_id)
    if not lease:
        raise NotFoundException("Lease")
    if current_user.role not in (UserRole.ADMIN, UserRole.FINANCIAL_OFFICER) and lease.employee_id != current_user.id:
        raise ForbiddenException("Only the assigned employee may accept the lease")
    updated = lease_repository.update_lease(
        db, lease, {"signed_at": datetime.now(UTC), "signed_by_id": current_user.id}
    )
    log_event(
        db,
        action="LEASE.SIGNED",
        entity_type="LEASE",
        entity_id=lease_id,
        user_id=current_user.id,
    )
    return LeaseResponse.model_validate(updated)


def terminate_lease(db: Session, lease_id: int, current_user: User) -> LeaseResponse:
    lease = lease_repository.get_lease_by_id(db, lease_id)
    if not lease:
        raise NotFoundException("Lease")
    if lease.status == LeaseStatus.TERMINATED:
        raise BadRequestException("Lease is already terminated")

    updated = lease_repository.update_lease(db, lease, {"status": LeaseStatus.TERMINATED})

    occupancy = occupancy_repository.get_occupancy_by_id(db, lease.occupancy_id)
    if occupancy is not None and occupancy.ended_at is None:
        occupancy_repository.update_occupancy(db, occupancy, {"ended_at": datetime.now(UTC)})

    house = house_repository.get_house_by_id(db, lease.house_id)
    if house is not None and not house.available:
        house_repository.update_house(db, house, {"available": True})
    if lease.room is not None:
        room_repository.update_room(db, lease.room, {"is_available": True})

    log_event(
        db,
        action="LEASE.TERMINATED",
        entity_type="LEASE",
        entity_id=lease_id,
        details={"employee_id": lease.employee_id, "house_id": lease.house_id},
        user_id=current_user.id,
    )
    return LeaseResponse.model_validate(updated)
