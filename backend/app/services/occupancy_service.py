from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestException, ForbiddenException, NotFoundException
from app.models import User, UserRole
from app.repositories import house_repository, lease_repository, occupancy_repository, room_repository
from app.schemas import OccupancyResponse
from app.services.logs import log_event, log_security_event


def get_occupancy(db: Session, occupancy_id: int, current_user: User | None = None) -> OccupancyResponse:
    occupancy = occupancy_repository.get_occupancy_by_id(db, occupancy_id)
    if not occupancy:
        raise NotFoundException("Occupancy")
    if current_user is not None and current_user.role == UserRole.EMPLOYEE and occupancy.employee_id != current_user.id:
        log_security_event(
            db,
            action="ACCESS.DENIED",
            entity_type="OCCUPANCY",
            entity_id=occupancy_id,
            details={
                "user_id": current_user.id,
                "username": current_user.username,
                "reason": "Employees may only access their own occupancy records",
            },
            user_id=current_user.id,
        )
        raise ForbiddenException("Employees may only access their own occupancy records")
    return OccupancyResponse.model_validate(occupancy)


def list_occupancies(
    db: Session, page: int = 1, page_size: int = 100, current_only: bool = False, current_user: User | None = None
) -> dict:
    if current_user is not None and current_user.role == UserRole.EMPLOYEE:
        log_security_event(
            db,
            action="ACCESS.DENIED",
            entity_type="OCCUPANCY",
            details={
                "user_id": current_user.id,
                "username": current_user.username,
                "reason": "Employees cannot browse occupancy records",
            },
            user_id=current_user.id,
        )
        raise ForbiddenException("Employees cannot browse occupancy records")
    skip = (page - 1) * page_size
    occupancies = occupancy_repository.get_occupancies(db, skip=skip, limit=page_size, current_only=current_only)
    if current_user is not None and current_user.role == UserRole.EMPLOYER:
        team_ids = {e.employee_id for e in current_user.employment_as_employer}
        occupancies = [o for o in occupancies if o.employee_id in team_ids]
        total = len(occupancies)
    else:
        total = occupancy_repository.count_occupancies(db, current_only=current_only)
    return {
        "items": [OccupancyResponse.model_validate(o) for o in occupancies],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


def end_occupancy(db: Session, occupancy_id: int, current_user: User | None = None) -> OccupancyResponse:
    occupancy = occupancy_repository.get_occupancy_by_id(db, occupancy_id)
    if not occupancy:
        raise NotFoundException("Occupancy")
    if occupancy.ended_at is not None:
        raise BadRequestException("Occupancy has already ended")

    from datetime import UTC, datetime

    updated = occupancy_repository.update_occupancy(db, occupancy, {"ended_at": datetime.now(UTC)})

    # Phase 6: terminating move-out also terminates any active lease and frees the room.
    lease = updated.lease or lease_repository.get_active_lease_by_occupancy(db, occupancy_id)
    if lease is not None:
        from app.models import LeaseStatus

        lease_repository.update_lease(db, lease, {"status": LeaseStatus.TERMINATED})

    house = updated.house
    if house is not None and not house.available:
        house_repository.update_house(db, house, {"available": True})
    if updated.room_id is not None:
        room = room_repository.get_room_by_id(db, updated.room_id)
        if room is not None and not room.is_available:
            room_repository.update_room(db, room, {"is_available": True})

    log_event(
        db,
        action="OCCUPANCY.ENDED",
        entity_type="OCCUPANCY",
        entity_id=occupancy_id,
        details={"application_id": updated.application_id, "house_id": updated.house_id},
        user_id=current_user.id if current_user else None,
    )
    return OccupancyResponse.model_validate(updated)
