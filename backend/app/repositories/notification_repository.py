from sqlalchemy.orm import Session

from app.models import Notification


def get_notification(db: Session, notification_id: int) -> Notification | None:
    return db.query(Notification).filter(Notification.id == notification_id).first()


def get_notifications(db: Session, user_id: int, skip: int = 0, limit: int = 50) -> list[Notification]:
    return (
        db.query(Notification)
        .filter(Notification.user_id == user_id)
        .order_by(Notification.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def count_notifications(db: Session, user_id: int | None = None, unread_only: bool = False) -> int:
    query = db.query(Notification)
    if user_id is not None:
        query = query.filter(Notification.user_id == user_id)
    if unread_only:
        query = query.filter(Notification.is_read.is_(False))
    return query.count()


def create_notification(db: Session, data: dict) -> Notification:
    notification = Notification(**data)
    db.add(notification)
    db.flush()
    db.refresh(notification)
    return notification


def mark_read(db: Session, notification: Notification) -> Notification:
    notification.is_read = True
    db.flush()
    db.refresh(notification)
    return notification


def mark_all_read(db: Session, user_id: int) -> int:
    updated = (
        db.query(Notification)
        .filter(Notification.user_id == user_id, Notification.is_read.is_(False))
        .update({Notification.is_read: True})
    )
    db.flush()
    return updated
