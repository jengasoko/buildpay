from app.core.security import hash_password
from app.models import User


class TestAuthEndpoints:
    def test_register_user(self, client):
        response = client.post(
            "/api/v1/auth/register",
            json={
                "username": "newuser",
                "email": "new@example.com",
                "password": "securepass123",
                "role": "EMPLOYEE",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["username"] == "newuser"
        assert data["email"] == "new@example.com"
        assert "id" in data

    def test_register_ignores_client_supplied_privileged_role(self, client):
        response = client.post(
            "/api/v1/auth/register",
            json={
                "username": "wannabeadmin",
                "email": "wannabeadmin@example.com",
                "password": "securepass123",
                "role": "ADMIN",
            },
        )
        assert response.status_code == 201
        assert response.json()["role"] == "EMPLOYEE"

    def test_register_rate_limited_after_too_many_attempts(self, client):
        from app.core.config import settings

        for i in range(settings.RATE_LIMIT_REGISTER_ATTEMPTS):
            client.post(
                "/api/v1/auth/register",
                json={
                    "username": f"rl_reg_{i}",
                    "email": f"rl_reg_{i}@example.com",
                    "password": "securepass123",
                },
            )
        response = client.post(
            "/api/v1/auth/register",
            json={
                "username": "rl_reg_over_limit",
                "email": "rl_reg_over_limit@example.com",
                "password": "securepass123",
            },
        )
        assert response.status_code == 429

    def test_login_rate_limited_after_too_many_attempts(self, client):
        from app.core.config import settings

        for _ in range(settings.RATE_LIMIT_LOGIN_ATTEMPTS):
            client.post(
                "/api/v1/auth/login",
                json={"username": "nobody", "password": "wrong"},
            )
        response = client.post(
            "/api/v1/auth/login",
            json={"username": "nobody", "password": "wrong"},
        )
        assert response.status_code == 429

    def test_register_duplicate_username(self, client):
        client.post(
            "/api/v1/auth/register",
            json={
                "username": "dupuser",
                "email": "dup1@example.com",
                "password": "securepass123",
            },
        )
        response = client.post(
            "/api/v1/auth/register",
            json={
                "username": "dupuser",
                "email": "dup2@example.com",
                "password": "securepass123",
            },
        )
        assert response.status_code == 409

    def test_login_success(self, client, db_session):
        user = User(
            username="logintest",
            email="login@example.com",
            hashed_password=hash_password("password123"),
            role="EMPLOYEE",
        )
        db_session.add(user)
        db_session.commit()

        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "logintest",
                "password": "password123",
            },
        )
        assert response.status_code == 200
        assert "access_token" in response.json()

    def test_login_wrong_password(self, client, db_session):
        user = User(
            username="wrongpw",
            email="wrongpw@example.com",
            hashed_password=hash_password("correctpass"),
            role="EMPLOYEE",
        )
        db_session.add(user)
        db_session.commit()

        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "wrongpw",
                "password": "wrongpass",
            },
        )
        assert response.status_code == 400

    def test_login_nonexistent_user(self, client):
        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "nonexistent",
                "password": "password123",
            },
        )
        assert response.status_code == 400


class TestUserEndpoints:
    def _get_token(self, client, db_session):
        user = User(
            username="authuser",
            email="auth@example.com",
            hashed_password=hash_password("password123"),
            role="ADMIN",
        )
        db_session.add(user)
        db_session.commit()
        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "authuser",
                "password": "password123",
            },
        )
        return response.json()["access_token"]

    def test_get_current_user(self, client, db_session):
        token = self._get_token(client, db_session)
        response = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        assert response.json()["username"] == "authuser"

    def test_unauthorized_access(self, client):
        response = client.get("/api/v1/users/me")
        assert response.status_code in (401, 403)

    def test_invalid_token(self, client):
        response = client.get("/api/v1/users/me", headers={"Authorization": "Bearer invalid"})
        assert response.status_code == 401

    def test_list_users(self, client, db_session):
        token = self._get_token(client, db_session)
        response = client.get("/api/v1/users/", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        assert "items" in response.json()


class TestPaymentEndpoints:
    def _get_token(self, client, db_session):
        user = User(
            username="payuser",
            email="pay@example.com",
            hashed_password=hash_password("password123"),
            role="FINANCIAL_OFFICER",
        )
        db_session.add(user)
        db_session.commit()
        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "payuser",
                "password": "password123",
            },
        )
        return response.json()["access_token"]

    def test_create_payment(self, client, db_session):
        token = self._get_token(client, db_session)
        response = client.post(
            "/api/v1/payments/",
            json={
                "amount": 5000.00,
                "reference": "PAY-001",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 201
        assert response.json()["amount"] == 5000.00

    def test_list_payments(self, client, db_session):
        token = self._get_token(client, db_session)
        response = client.get("/api/v1/payments/", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200

    def test_get_nonexistent_payment(self, client, db_session):
        token = self._get_token(client, db_session)
        response = client.get("/api/v1/payments/99999", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 404


class TestHealthEndpoints:
    def test_health_check(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"

    def test_readiness_check(self, client):
        response = client.get("/health/ready")
        assert response.status_code == 200
        assert "database" in response.json()
