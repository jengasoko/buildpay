import pytest

from app.models import User, UserRole
from scripts import seed_db
from scripts.create_admin import create_admin


class TestSeedDbProductionGuard:
    def test_refuses_to_run_in_production(self, monkeypatch):
        monkeypatch.setattr(seed_db.settings, "ENVIRONMENT", "production")
        with pytest.raises(SystemExit) as exc_info:
            seed_db.seed_db()
        assert exc_info.value.code == 1


class TestCreateAdmin:
    def test_rejects_short_password(self, db_session):
        with pytest.raises(ValueError):
            create_admin(db_session, username="short_pw_admin", email="short@example.com", password="abc")

    def test_creates_admin(self, db_session):
        admin = create_admin(db_session, username="new_admin", email="new_admin@example.com", password="strongpass123")
        assert admin is not None
        assert admin.role == UserRole.ADMIN
        assert admin.is_superuser is True
        assert admin.is_active is True

    def test_idempotent_when_username_or_email_exists(self, db_session):
        create_admin(db_session, username="dup_admin", email="dup1@example.com", password="strongpass123")
        result = create_admin(db_session, username="dup_admin", email="dup2@example.com", password="strongpass123")
        assert result is None
        assert db_session.query(User).filter(User.username == "dup_admin").count() == 1
