
from app.core.security import hash_password
from app.models import House, User


def _create_user(db_session, username, role, **kwargs):
    user = User(
        username=username,
        email=f"{username}@example.com",
        hashed_password=hash_password("password123"),
        role=role,
        **kwargs,
    )
    db_session.add(user)
    db_session.commit()
    return user


def _login(client, username, password="password123"):
    response = client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def _auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


class TestProjectPermissions:
    def test_employee_cannot_create_project(self, client, db_session):
        _create_user(db_session, "proj_emp", "EMPLOYEE")
        token = _login(client, "proj_emp")
        response = client.post(
            "/api/v1/projects",
            json={
                "name": "Unauthorized Project",
                "location": "Nowhere",
                "start_date": "2026-01-01T00:00:00",
                "expected_completion": "2027-01-01T00:00:00",
            },
            headers=_auth_headers(token),
        )
        assert response.status_code == 403

    def test_project_manager_can_create_project(self, client, db_session):
        _create_user(db_session, "proj_pm", "PROJECT_MANAGER")
        token = _login(client, "proj_pm")
        response = client.post(
            "/api/v1/projects",
            json={
                "name": "Green Meadows",
                "location": "Springfield",
                "start_date": "2026-01-01T00:00:00",
                "expected_completion": "2027-01-01T00:00:00",
            },
            headers=_auth_headers(token),
        )
        assert response.status_code == 201
        assert response.json()["name"] == "Green Meadows"

    def test_any_authenticated_user_can_view_projects(self, client, db_session):
        _create_user(db_session, "proj_viewer", "EMPLOYEE")
        token = _login(client, "proj_viewer")
        response = client.get("/api/v1/projects", headers=_auth_headers(token))
        assert response.status_code == 200
        assert "items" in response.json()


class TestUserPermissions:
    def test_employee_cannot_list_users(self, client, db_session):
        _create_user(db_session, "users_emp", "EMPLOYEE")
        token = _login(client, "users_emp")
        response = client.get("/api/v1/users/", headers=_auth_headers(token))
        assert response.status_code == 403

    def test_admin_can_list_users(self, client, db_session):
        _create_user(db_session, "users_admin", "ADMIN")
        token = _login(client, "users_admin")
        response = client.get("/api/v1/users/", headers=_auth_headers(token))
        assert response.status_code == 200

    def test_admin_can_update_user_role(self, client, db_session):
        _create_user(db_session, "upd_admin", "ADMIN")
        target = _create_user(db_session, "upd_target", "EMPLOYEE")
        token = _login(client, "upd_admin")
        response = client.put(
            f"/api/v1/users/{target.id}",
            json={"role": "PROJECT_MANAGER"},
            headers=_auth_headers(token),
        )
        assert response.status_code == 200
        assert response.json()["role"] == "PROJECT_MANAGER"

    def test_employee_cannot_update_users(self, client, db_session):
        _create_user(db_session, "upd_emp", "EMPLOYEE")
        target = _create_user(db_session, "upd_target2", "EMPLOYEE")
        token = _login(client, "upd_emp")
        response = client.put(
            f"/api/v1/users/{target.id}",
            json={"role": "ADMIN"},
            headers=_auth_headers(token),
        )
        assert response.status_code == 403


class TestPaymentPermissions:
    def test_employee_cannot_create_payment(self, client, db_session):
        _create_user(db_session, "pay_emp", "EMPLOYEE")
        token = _login(client, "pay_emp")
        response = client.post(
            "/api/v1/payments/",
            json={"amount": 500.00, "reference": "PAY-EMP-001"},
            headers=_auth_headers(token),
        )
        assert response.status_code == 403

    def test_financial_officer_can_create_payment(self, client, db_session):
        _create_user(db_session, "pay_fo", "FINANCIAL_OFFICER")
        token = _login(client, "pay_fo")
        response = client.post(
            "/api/v1/payments/",
            json={"amount": 1200.50, "reference": "PAY-FO-001"},
            headers=_auth_headers(token),
        )
        assert response.status_code == 201

    def test_project_manager_cannot_view_payments(self, client, db_session):
        _create_user(db_session, "pay_pm", "PROJECT_MANAGER")
        token = _login(client, "pay_pm")
        response = client.get("/api/v1/payments/", headers=_auth_headers(token))
        assert response.status_code == 403


class TestApplicationWorkflow:
    def _seed(self, client, db_session):
        employee = _create_user(db_session, "wf_emp", "EMPLOYEE")
        employer = _create_user(db_session, "wf_employer", "EMPLOYER")
        officer = _create_user(db_session, "wf_fo", "FINANCIAL_OFFICER")
        house = House(title="Unit 101", location="Block A", rent_price=800.00)
        db_session.add(house)
        db_session.commit()
        return employee, employer, officer, house

    def test_employee_cannot_create_application_for_others(self, client, db_session):
        employee, employer, officer, house = self._seed(client, db_session)
        other = _create_user(db_session, "wf_other", "EMPLOYEE")
        token = _login(client, "wf_emp")
        response = client.post(
            "/api/v1/applications",
            json={"employee_id": other.id, "house_id": house.id},
            headers=_auth_headers(token),
        )
        assert response.status_code == 403

    def test_full_approval_workflow(self, client, db_session):
        employee, employer, officer, house = self._seed(client, db_session)
        emp_token = _login(client, "wf_emp")

        create_resp = client.post(
            "/api/v1/applications",
            json={"employee_id": employee.id, "house_id": house.id},
            headers=_auth_headers(emp_token),
        )
        assert create_resp.status_code == 201
        application_id = create_resp.json()["id"]

        employer_token = _login(client, "wf_employer")
        step1 = client.put(
            f"/api/v1/applications/{application_id}",
            json={"status": "EMPLOYER_APPROVED"},
            headers=_auth_headers(employer_token),
        )
        assert step1.status_code == 200
        assert step1.json()["status"] == "EMPLOYER_APPROVED"

        officer_token = _login(client, "wf_fo")
        step2 = client.put(
            f"/api/v1/applications/{application_id}",
            json={"status": "FINANCIAL_APPROVED"},
            headers=_auth_headers(officer_token),
        )
        assert step2.status_code == 200
        assert step2.json()["status"] == "FINANCIAL_APPROVED"

    def test_employer_cannot_finance_own_application(self, client, db_session):
        employee, employer, officer, house = self._seed(client, db_session)
        emp_token = _login(client, "wf_emp")
        create_resp = client.post(
            "/api/v1/applications",
            json={"employee_id": employee.id, "house_id": house.id},
            headers=_auth_headers(emp_token),
        )
        application_id = create_resp.json()["id"]

        employer_token = _login(client, "wf_employer")
        skipped = client.put(
            f"/api/v1/applications/{application_id}",
            json={"status": "FINANCIAL_APPROVED"},
            headers=_auth_headers(employer_token),
        )
        assert skipped.status_code == 403

    def test_employee_cannot_update_application_status(self, client, db_session):
        employee, employer, officer, house = self._seed(client, db_session)
        emp_token = _login(client, "wf_emp")
        create_resp = client.post(
            "/api/v1/applications",
            json={"employee_id": employee.id, "house_id": house.id},
            headers=_auth_headers(emp_token),
        )
        application_id = create_resp.json()["id"]

        response = client.put(
            f"/api/v1/applications/{application_id}",
            json={"status": "EMPLOYER_APPROVED"},
            headers=_auth_headers(emp_token),
        )
        assert response.status_code == 403

    def test_list_application_includes_house_and_employee(self, client, db_session):
        employee, employer, officer, house = self._seed(client, db_session)
        emp_token = _login(client, "wf_emp")
        client.post(
            "/api/v1/applications",
            json={"employee_id": employee.id, "house_id": house.id},
            headers=_auth_headers(emp_token),
        )

        response = client.get("/api/v1/applications", headers=_auth_headers(emp_token))
        assert response.status_code == 200
        item = response.json()["items"][0]
        assert item["house_title"] == "Unit 101"
        assert item["employee_username"] == "wf_emp"

    def test_filter_applications_by_status(self, client, db_session):
        employee, employer, officer, house = self._seed(client, db_session)
        emp_token = _login(client, "wf_emp")
        create_resp = client.post(
            "/api/v1/applications",
            json={"employee_id": employee.id, "house_id": house.id},
            headers=_auth_headers(emp_token),
        )
        application_id = create_resp.json()["id"]

        pending = client.get(
            "/api/v1/applications?status=PENDING",
            headers=_auth_headers(emp_token),
        )
        assert pending.status_code == 200
        assert pending.json()["total"] == 1

        employer_token = _login(client, "wf_employer")
        approved = client.put(
            f"/api/v1/applications/{application_id}",
            json={"status": "EMPLOYER_APPROVED"},
            headers=_auth_headers(employer_token),
        )
        assert approved.status_code == 200

        filtered = client.get(
            "/api/v1/applications?status=EMPLOYER_APPROVED",
            headers=_auth_headers(emp_token),
        )
        assert filtered.status_code == 200
        assert filtered.json()["total"] == 1


class TestNullUpdates:
    def _seed_admin(self, client, db_session):
        _create_user(db_session, "null_admin", "ADMIN")
        return _login(client, "null_admin")

    def test_clearing_house_image_url(self, client, db_session):
        token = self._seed_admin(client, db_session)
        house = House(
            title="Unit 200",
            location="Block B",
            rent_price=900.00,
            image_url="https://example.com/house.jpg",
        )
        db_session.add(house)
        db_session.commit()

        response = client.put(
            f"/api/v1/houses/{house.id}",
            json={"image_url": None},
            headers=_auth_headers(token),
        )
        assert response.status_code == 200
        assert response.json()["image_url"] is None

    def test_clearing_project_actual_completion(self, client, db_session):
        token = self._seed_admin(client, db_session)
        from datetime import datetime

        from app.models import Project

        project = Project(
            name="Ocean View",
            location="Coast",
            start_date=datetime(2026, 1, 1),
            expected_completion=datetime(2027, 1, 1),
            actual_completion=datetime(2026, 6, 1),
        )
        db_session.add(project)
        db_session.commit()

        response = client.put(
            f"/api/v1/projects/{project.id}",
            json={"actual_completion": None},
            headers=_auth_headers(token),
        )
        assert response.status_code == 200
        assert response.json()["actual_completion"] is None

    def test_clearing_payment_reference(self, client, db_session):
        _create_user(db_session, "null_fo", "FINANCIAL_OFFICER")
        token = _login(client, "null_fo")
        from app.models import Payment

        payment = Payment(amount=100.00, reference="PAY-CLEAR")
        db_session.add(payment)
        db_session.commit()

        response = client.put(
            f"/api/v1/payments/{payment.id}",
            json={"reference": None},
            headers=_auth_headers(token),
        )
        assert response.status_code == 200
        assert response.json()["reference"] is None
