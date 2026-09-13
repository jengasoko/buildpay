from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenException, NotFoundException
from app.models import User
from app.repositories import notification_repository
from app.schemas import NotificationResponse, NotificationUnreadCount


def notify(db: Session, user_id: int, title: str, message: str) -> NotificationResponse:
    notification = notification_repository.create_notification(
        db, {"user_id": user_id, "title": title, "message": message}
    )
    return NotificationResponse.model_validate(notification)


def get_notification(db: Session, notification_id: int, current_user: User) -> NotificationResponse:
    notification = notification_repository.get_notification(db, notification_id)
    if not notification:
        raise NotFoundException("Notification")
    if notification.user_id != current_user.id:
        raise ForbiddenException("Users may only access their own notifications")
    return NotificationResponse.model_validate(notification)


def list_notifications(db: Session, current_user: User, page: int = 1, page_size: int = 50) -> dict:
    skip = (page - 1) * page_size
    notifications = notification_repository.get_notifications(db, current_user.id, skip=skip, limit=page_size)
    total = notification_repository.count_notifications(db, user_id=current_user.id)
    return {
        "items": [NotificationResponse.model_validate(n) for n in notifications],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


def unread_count(db: Session, current_user: User) -> NotificationUnreadCount:
    count = notification_repository.count_notifications(db, user_id=current_user.id, unread_only=True)
    return NotificationUnreadCount(count=count)


def mark_read(db: Session, notification_id: int, current_user: User) -> NotificationResponse:
    notification = notification_repository.get_notification(db, notification_id)
    if not notification:
        raise NotFoundException("Notification")
    if notification.user_id != current_user.id:
        raise ForbiddenException("Users may only update their own notifications")
    return NotificationResponse.model_validate(notification_repository.mark_read(db, notification))


def mark_all_read(db: Session, current_user: User) -> dict:
    updated = notification_repository.mark_all_read(db, current_user.id)
    return {"updated": updated}
