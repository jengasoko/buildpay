import logging

logger = logging.getLogger("hms.tasks")


def send_notification_email(recipient: str, subject: str, body: str) -> None:
    logger.info("Sending email to %s: %s", recipient, subject)
    # TODO: Integrate with actual email service (SMTP, SendGrid, etc.)


def process_payment_notification(payment_id: int, status: str) -> None:
    logger.info("Payment %d status updated to %s", payment_id, status)
    # TODO: Integrate with payment webhook/notification system
