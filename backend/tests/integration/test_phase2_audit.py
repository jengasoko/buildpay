from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password
from app.models import House, Project, SystemLog, User, UserRole
from app.repositories import employment_repository


def _create_user(db_session: Session, username: str, role: UserRole = UserRole.EMPLOYEE, **overrides):
    user = User(
        username=username,
        email=f"{username}@test.local",
        hashed_password=hash_password("password123"),
        role=role,
        is_active=overrides.get("is_active", True),
    )
    db_session.add(user)
    db_session.flush()
    return user


def _login(client, username: str, password: str = "password123"):
    return client.post("/api/v1/auth/login", json={"username": username, "password": password})


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def _count_logs(db_session: Session, action: str, **filters) -> int:
    q = db_session.query(SystemLog).filter(SystemLog.action == action)
    for col, val in filters.items():
        q = q.filter(getattr(SystemLog, col) == val)
    return q.count()


def _latest_log(db_session: Session, action: str, **filters):
    q = db_session.query(SystemLog).filter(SystemLog.action == action)
    for col, val in filters.items():
        q = q.filter(getattr(SystemLog, col) == val)
    return q.order_by(SystemLog.id.desc()).first()


def _find_log_by_username(db_session: Session, action: str, username: str):
    needle = f'"username": "{username}"'
    for log in (
        db_session.query(SystemLog)
        .filter(SystemLog.action == action, SystemLog.details.isnot(None))
        .order_by(SystemLog.id.desc())
    ):
        if needle in log.details:
            return log
    return None


def _get_user(db_session: Session, username: str) -> User:
    return db_session.query(User).filter(User.username == username).first()


class TestLoginAudit:
    def test_failed_login_creates_audit_log(self, client, db_session):
        _create_user(db_session, "audit_login", UserRole.EMPLOYEE)
        response = _login(client, "audit_login", "wrong_password")
        assert response.status_code == 400
        log = _find_log_by_username(db_session, "AUTH.LOGIN_FAILED", "audit_login")
        assert log is not None, "AUTH.LOGIN_FAILED was not logged"
        assert log.user_id is None

    def test_nonexistent_user_login_creates_audit_log(self, client, db_session):
        response = _login(client, "nonexistent_login_user", "whatever")
        assert response.status_code == 400
        log = _find_log_by_username(db_session, "AUTH.LOGIN_FAILED", "nonexistent_login_user")
        assert log is not None

    def test_disabled_account_creates_audit_log(self, client, db_session):
        user = _create_user(db_session, "audit_disabled", UserRole.EMPLOYEE, is_active=False)
        response = _login(client, "audit_disabled")
        assert response.status_code == 400
        log = _find_log_by_username(db_session, "AUTH.ACCOUNT_DISABLED", "audit_disabled")
        assert log is not None, "AUTH.ACCOUNT_DISABLED was not logged"
        assert log.user_id == user.id


class TestEndpointAccessDeniedAudit:
    def test_employee_denied_on_system_logs(self, client, db_session):
        _create_user(db_session, "ep_aud_emp", UserRole.EMPLOYEE)
        resp = _login(client, "ep_aud_emp")
        token = resp.json()["access_token"]

        response = client.get("/api/v1/system-logs/", headers=_auth(token))
        assert response.status_code == 403

        user = _get_user(db_session, "ep_aud_emp")
        log = _latest_log(db_session, "ACCESS.DENIED", entity_type="ENDPOINT", user_id=user.id)
        assert log is not None
        assert log.details is not None
        assert "ADMIN" in log.details

    def test_employer_denied_on_payments(self, client, db_session):
        _create_user(db_session, "ep_aud_empowner", UserRole.EMPLOYER)
        resp = _login(client, "ep_aud_empowner")
        token = resp.json()["access_token"]

        response = client.get("/api/v1/payments/", headers=_auth(token))
        assert response.status_code == 403

        user = _get_user(db_session, "ep_aud_empowner")
        log = _latest_log(db_session, "ACCESS.DENIED", entity_type="ENDPOINT", user_id=user.id)
        assert log is not None


class TestBusinessAccessDeniedAudit:
    def test_employee_cannot_apply_for_another_employee(self, client, db_session):
        emp_a = _create_user(db_session, "biz_a", UserRole.EMPLOYEE)
        emp_b = _create_user(db_session, "biz_b", UserRole.EMPLOYEE)
        house = House(title="Biz House", location="Test", rent_price=500.00)
        db_session.add(house)
        db_session.flush()

        resp = _login(client, "biz_a")
        token = resp.json()["access_token"]
        response = client.post(
            "/api/v1/applications",
            json={"employee_id": emp_b.id, "house_id": house.id},
            headers=_auth(token),
        )
        assert response.status_code == 403
        log = _latest_log(db_session, "ACCESS.DENIED", entity_type="APPLICATION", user_id=emp_a.id)
        assert log is not None, "Business-rule ACCESS.DENIED was not logged for apply for another employee"

    def test_employer_reviews_other_team_application(self, client, db_session):
        employee = _create_user(db_session, "biz_team_emp", UserRole.EMPLOYEE)
        employer = _create_user(db_session, "biz_team_owner", UserRole.EMPLOYER)
        wrong_employer = _create_user(db_session, "biz_team_wrong", UserRole.EMPLOYER)
        house = House(title="Biz Team House", location="Test", rent_price=500.00)
        db_session.add(house)
        db_session.flush()

        employment_repository.create_employment(db_session, {"employer_id": employer.id, "employee_id": employee.id})

        emp_token = _login(client, "biz_team_emp")
        app_resp = client.post(
            "/api/v1/applications",
            json={"employee_id": employee.id, "house_id": house.id},
            headers=_auth(emp_token.json()["access_token"]),
        )
        assert app_resp.status_code == 201
        app_id = app_resp.json()["id"]

        wrong_token = _login(client, "biz_team_wrong")
        response = client.put(
            f"/api/v1/applications/{app_id}",
            json={"status": "EMPLOYER_APPROVED"},
            headers=_auth(wrong_token.json()["access_token"]),
        )
        assert response.status_code == 403
        log = _latest_log(
            db_session, "ACCESS.DENIED", entity_type="APPLICATION", entity_id=app_id, user_id=wrong_employer.id
        )
        assert log is not None, "Employer accessing other team was not logged"

    def test_role_forbidden_status_transition(self, client, db_session):
        employee = _create_user(db_session, "biz_trans_emp", UserRole.EMPLOYEE)
        employer = _create_user(db_session, "biz_trans_owner", UserRole.EMPLOYER)
        officer = _create_user(db_session, "biz_trans_fin", UserRole.FINANCIAL_OFFICER)
        house = House(title="Biz Trans House", location="Test", rent_price=500.00)
        db_session.add(house)
        db_session.flush()

        employment_repository.create_employment(db_session, {"employer_id": employer.id, "employee_id": employee.id})

        emp_token = _login(client, "biz_trans_emp")
        app_resp = client.post(
            "/api/v1/applications",
            json={"employee_id": employee.id, "house_id": house.id},
            headers=_auth(emp_token.json()["access_token"]),
        )
        assert app_resp.status_code == 201
        app_id = app_resp.json()["id"]

        owner_token = _login(client, "biz_trans_owner")
        client.put(
            f"/api/v1/applications/{app_id}",
            json={"status": "EMPLOYER_APPROVED"},
            headers=_auth(owner_token.json()["access_token"]),
        )

        fin_token = _login(client, "biz_trans_fin")
        response = client.put(
            f"/api/v1/applications/{app_id}",
            json={"status": "PENDING"},
            headers=_auth(fin_token.json()["access_token"]),
        )
        assert response.status_code == 403
        log = _latest_log(db_session, "ACCESS.DENIED", entity_type="APPLICATION", entity_id=app_id, user_id=officer.id)
        assert log is not None


class TestAuditAtomicity:
    def test_successful_request_persists_entity_and_audit(self, client, db_session):
        _create_user(db_session, "atom_admin", UserRole.ADMIN)
        user = _get_user(db_session, "atom_admin")
        token = create_access_token(data={"sub": str(user.id), "role": user.role.value})

        response = client.post(
            "/api/v1/projects",
            json={
                "name": "Atom Project",
                "description": "Test",
                "location": "Test",
                "start_date": "2026-01-01T00:00:00",
                "expected_completion": "2027-01-01T00:00:00",
            },
            headers=_auth(token),
        )
        assert response.status_code == 201
        project_id = response.json()["id"]

        assert db_session.get(Project, project_id) is not None
        assert _count_logs(db_session, "PROJECT.CREATED", entity_id=project_id) == 1

    def test_failed_request_leaves_no_false_application_audit(self, client, db_session):
        _create_user(db_session, "no_false_emp", UserRole.EMPLOYEE)
        _create_user(db_session, "no_false_emp2", UserRole.EMPLOYEE)
        employee = _get_user(db_session, "no_false_emp")
        other_emp = _get_user(db_session, "no_false_emp2")
        house = House(title="No False House", location="Test", rent_price=400.00)
        db_session.add(house)
        db_session.flush()

        token = _login(client, "no_false_emp")
        response = client.post(
            "/api/v1/applications",
            json={"employee_id": employee.id, "house_id": house.id},
            headers=_auth(token.json()["access_token"]),
        )
        assert response.status_code == 201
        app_id = response.json()["id"]
        assert _count_logs(db_session, "APPLICATION.CREATED", entity_id=app_id) == 1

        response = client.post(
            "/api/v1/applications",
            json={"employee_id": other_emp.id, "house_id": house.id},
            headers=_auth(token.json()["access_token"]),
        )
        assert response.status_code == 403
        # no additional APPLICATION.CREATED log for this entity
        assert _count_logs(db_session, "APPLICATION.CREATED", entity_id=app_id) == 1
