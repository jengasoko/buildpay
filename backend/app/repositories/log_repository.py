from sqlalchemy.orm import Session, joinedload

from app.models import SystemLog


def get_log_by_id(db: Session, log_id: int) -> SystemLog | None:
    return db.query(SystemLog).options(joinedload(SystemLog.user)).filter(SystemLog.id == log_id).first()


def get_logs(db: Session, skip: int = 0, limit: int = 100) -> list[SystemLog]:
    return (
        db.query(SystemLog)
        .options(joinedload(SystemLog.user))
        .order_by(SystemLog.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def count_logs(db: Session) -> int:
    return db.query(SystemLog).count()


def create_log(db: Session, log_data: dict) -> SystemLog:
    log = SystemLog(**log_data)
    db.add(log)
    db.commit()
    db.refresh(log)
    return log
