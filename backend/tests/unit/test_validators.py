from app.core.exceptions import BadRequestException
from app.utils.validators import sanitize_string, validate_email, validate_phone


class TestValidators:
    def test_valid_email(self):
        assert validate_email("test@example.com") is True

    def test_invalid_email(self):
        try:
            validate_email("not-an-email")
            raise AssertionError("Should have raised")
        except BadRequestException:
            pass

    def test_valid_phone(self):
        assert validate_phone("+1234567890") is True

    def test_invalid_phone(self):
        try:
            validate_phone("12")
            raise AssertionError("Should have raised")
        except BadRequestException:
            pass

    def test_sanitize(self):
        assert sanitize_string("  hello  ") == "hello"
