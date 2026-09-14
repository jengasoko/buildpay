import json
from typing import Any

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.repositories import log_repository
from app.schemas import SystemLogResponse


def log_event(
    db: Session,
    action: str,
    entity_type: str | None = None,
    entity_id: int | None = None,
    details: dict[str, Any] | None = None,
    user_id: int | None = None,
) -> SystemLogResponse:
    log_data = {
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "details": json.dumps(details) if details else None,
        "user_id": user_id,
    }
    log = log_repository.create_log(db, log_data)
    return SystemLogResponse.model_validate(log)


def log_security_event(
    db: Session,
    action: str,
    *,
    entity_type: str | None = None,
    entity_id: int | None = None,
    details: dict[str, Any] | None = None,
    user_id: int | None = None,
) -> SystemLogResponse:
    """Writes an audit entry and commits it immediately.

    Used for security-relevant events (failed logins, denied access) that occur on
    failing request paths. The request transaction would otherwise be rolled back and
    the record lost, so it is persisted in its own commit. Call before any other
    writes in the request to avoid committing unrelated pending changes.
    """
    record = log_event(
        db,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
        user_id=user_id,
    )
    db.commit()
    return record


def get_log(db: Session, log_id: int) -> SystemLogResponse:
    log = log_repository.get_log_by_id(db, log_id)
    if not log:
        raise NotFoundException("System log")
    return SystemLogResponse.model_validate(log)


def list_logs(db: Session, page: int = 1, page_size: int = 100) -> dict:
    skip = (page - 1) * page_size
    logs = log_repository.get_logs(db, skip=skip, limit=page_size)
    total = log_repository.count_logs(db)
    return {
        "items": [SystemLogResponse.model_validate(log) for log in logs],
        "total": total,
        "page": page,
        "page_size": page_size,
    }
