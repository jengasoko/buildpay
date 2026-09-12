import re

from app.core.exceptions import BadRequestException


def validate_email(email: str) -> bool:
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    if not re.match(pattern, email):
        raise BadRequestException("Invalid email format")
    return True


def validate_phone(phone: str) -> bool:
    pattern = r"^\+?[\d\s\-()]{7,20}$"
    if not re.match(pattern, phone):
        raise BadRequestException("Invalid phone number format")
    return True


def sanitize_string(value: str) -> str:
    return value.strip()
