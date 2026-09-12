from app.core.config import settings


class TestSettings:
    def test_settings_has_required_fields(self):
        required_fields = [
            "APP_NAME",
            "ENVIRONMENT",
            "DATABASE_URL",
            "JWT_SECRET_KEY",
            "JWT_ALGORITHM",
            "JWT_ACCESS_TOKEN_EXPIRE_MINUTES",
            "CORS_ORIGINS",
        ]
        for field in required_fields:
            assert hasattr(settings, field), f"Settings missing field: {field}"

    def test_settings_values(self):
        assert settings.JWT_ALGORITHM == "HS256"
        assert settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES == 30
