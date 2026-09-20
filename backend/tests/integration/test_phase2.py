from app.core.security import hash_password
from app.models import User, UserRole


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
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def _seed_workflow(db_session):
    from app.models import Employment, House

    employee = _create_user(db_session, "p2_emp", UserRole.EMPLOYEE)
    employer = _create_user(db_session, "p2_employer", UserRole.EMPLOYER)
    officer = _create_user(db_session, "p2_officer", UserRole.FINANCIAL_OFFICER)
    admin = _create_user(db_session, "p2_admin", UserRole.ADMIN)
    house = House(title="Phase 2 Unit", location="Block C", rent_price=750.00)
    db_session.add(house)
    assignment = Employment(employer_id=employer.id, employee_id=employee.id)
    db_session.add(assignment)
    db_session.commit()
    return employee, employer, officer, admin, house


class TestApplicationWorkflowRules:
    def test_cannot_apply_for_unavailable_house(self, client, db_session):
        employee, employer, officer, admin, house = _seed_workflow(db_session)
        house.available = False
        db_session.commit()
        token = _login(client, "p2_emp")
        response = client.post(
            "/api/v1/applications",
            json={"employee_id": employee.id, "house_id": house.id},
            headers=_auth(token),
        )
        assert response.status_code == 409
        assert "not available" in response.json()["error"]["message"]

    def test_cannot_apply_for_non_employee(self, client, db_session):
        employee, employer, officer, admin, house = _seed_workflow(db_session)
        token = _login(client, "p2_employer")
        response = client.post(
            "/api/v1/applications",
            json={"employee_id": employer.id, "house_id": house.id},
            headers=_auth(token),
        )
        assert response.status_code == 400

    def test_duplicate_application_for_same_house_conflict(self, client, db_session):
        employee, employer, officer, admin, house = _seed_workflow(db_session)
        token = _login(client, "p2_emp")
        first = client.post(
            "/api/v1/applications",
            json={"employee_id": employee.id, "house_id": house.id},
            headers=_auth(token),
        )
        assert first.status_code == 201
        second = client.post(
            "/api/v1/applications",
            json={"employee_id": employee.id, "house_id": house.id},
            headers=_auth(token),
        )
        assert second.status_code == 409

    def test_only_one_active_application_per_employee(self, client, db_session):
        employee, employer, officer, admin, house = _seed_workflow(db_session)
        from app.models import House

        house2 = House(title="Another Unit", location="Block D", rent_price=900.00)
        db_session.add(house2)
        db_session.commit()
        token = _login(client, "p2_emp")
        first = client.post(
            "/api/v1/applications",
            json={"employee_id": employee.id, "house_id": house.id},
            headers=_auth(token),
        )
        assert first.status_code == 201
        second = client.post(
            "/api/v1/applications",
            json={"employee_id": employee.id, "house_id": house2.id},
            headers=_auth(token),
        )
        assert second.status_code == 409
        assert "already has an active application" in second.json()["error"]["message"]

    def test_financial_approval_marks_house_occupied(self, client, db_session):
        employee, employer, officer, admin, house = _seed_workflow(db_session)
        emp_token = _login(client, "p2_emp")
        created = client.post(
            "/api/v1/applications",
            json={"employee_id": employee.id, "house_id": house.id},
            headers=_auth(emp_token),
        )
        application_id = created.json()["id"]

        employer_token = _login(client, "p2_employer")
        step1 = client.put(
            f"/api/v1/applications/{application_id}",
            json={"status": "EMPLOYER_APPROVED"},
            headers=_auth(employer_token),
        )
        assert step1.status_code == 200

        officer_token = _login(client, "p2_officer")
        step2 = client.put(
            f"/api/v1/applications/{application_id}",
            json={"status": "FINANCIAL_APPROVED"},
            headers=_auth(officer_token),
        )
        assert step2.status_code == 200

        db_session.expire_all()
        db_session.refresh(house)
        assert house.available is False

    def test_employee_list_is_scoped_to_own_applications(self, client, db_session):
        employee, employer, officer, admin, house = _seed_workflow(db_session)
        other = _create_user(db_session, "p2_other_emp", UserRole.EMPLOYEE)
        _create_user(db_session, "p2_specialist", UserRole.EMPLOYEE)

        emp_token = _login(client, "p2_emp")
        other_token = _login(client, "p2_other_emp")
        employer_token = _login(client, "p2_employer")
        admin_token = _login(client, "p2_admin")

        client.post(
            "/api/v1/applications",
            json={"employee_id": employee.id, "house_id": house.id},
            headers=_auth(emp_token),
        )

        other_house = _create_extra_house(db_session, "Other Unit")
        client.post(
            "/api/v1/applications",
            json={"employee_id": other.id, "house_id": other_house.id},
            headers=_auth(other_token),
        )

        mine = client.get("/api/v1/applications", headers=_auth(emp_token))
        assert mine.status_code == 200
        assert mine.json()["total"] == 1
        assert mine.json()["items"][0]["employee_username"] == "p2_emp"

        team = client.get("/api/v1/applications", headers=_auth(employer_token))
        assert team.json()["total"] == 1
        assert team.json()["items"][0]["employee_username"] == "p2_emp"

        all_apps = client.get("/api/v1/applications", headers=_auth(admin_token))
        assert all_apps.json()["total"] == 2


class TestSystemLogs:
    def _seed_admin(self, db_session):
        return _create_user(db_session, "logs_admin", UserRole.ADMIN)

    def test_employee_cannot_access_system_logs(self, client, db_session):
        _create_user(db_session, "logs_emp", UserRole.EMPLOYEE)
        token = _login(client, "logs_emp")
        response = client.get("/api/v1/system-logs/", headers=_auth(token))
        assert response.status_code == 403

    def test_admin_can_list_system_logs_and_workflow_events_appear(self, client, db_session):
        self._seed_admin(db_session)
        employee, employer, officer, _, _house = _seed_workflow(db_session)
        from app.models import House

        house = House(title="Log Unit", location="Block E", rent_price=650.00)
        db_session.add(house)
        db_session.commit()

        emp_token = _login(client, "p2_emp")
        created = client.post(
            "/api/v1/applications",
            json={"employee_id": employee.id, "house_id": house.id},
            headers=_auth(emp_token),
        )
        app_id = created.json()["id"]
        officer_token = _login(client, "p2_officer")
        client.put(
            f"/api/v1/applications/{app_id}",
            json={"status": "EMPLOYER_APPROVED"},
            headers=_auth(_login(client, "p2_employer")),
        )
        client.put(
            f"/api/v1/applications/{app_id}",
            json={"status": "FINANCIAL_APPROVED"},
            headers=_auth(officer_token),
        )

        token = _login(client, "logs_admin")
        response = client.get("/api/v1/system-logs/", headers=_auth(token))
        assert response.status_code == 200
        actions = [item["action"] for item in response.json()["items"]]
        assert "APPLICATION.CREATED" in actions
        assert "APPLICATION.STATUS_CHANGED" in actions
        assert response.json()["total"] >= 3


class TestPayments:
    def _seed_financed_application(self, client, db_session):
        employee, employer, officer, admin, house = _seed_workflow(db_session)
        emp_token = _login(client, "p2_emp")
        created = client.post(
            "/api/v1/applications",
            json={"employee_id": employee.id, "house_id": house.id},
            headers=_auth(emp_token),
        )
        app_id = created.json()["id"]
        client.put(
            f"/api/v1/applications/{app_id}",
            json={"status": "EMPLOYER_APPROVED"},
            headers=_auth(_login(client, "p2_employer")),
        )
        client.put(
            f"/api/v1/applications/{app_id}",
            json={"status": "FINANCIAL_APPROVED"},
            headers=_auth(_login(client, "p2_officer")),
        )
        return app_id

    def test_payment_requires_financially_approved_application(self, client, db_session):
        _seed_workflow(db_session)
        from app.models import House

        house = House(title="Pending Unit", location="Block F", rent_price=700.00)
        db_session.add(house)
        db_session.commit()
        employee = _create_user(db_session, "p2_pay_emp", UserRole.EMPLOYEE)
        token = _login(client, "p2_pay_emp")
        created = client.post(
            "/api/v1/applications",
            json={"employee_id": employee.id, "house_id": house.id},
            headers=_auth(token),
        )
        app_id = created.json()["id"]

        officer_token = _login(client, "p2_officer")
        response = client.post(
            "/api/v1/payments/",
            json={"application_id": app_id, "amount": 150.00, "reference": "PAY-P2-001"},
            headers=_auth(officer_token),
        )
        assert response.status_code == 400

    def test_payment_on_approved_application_succeeds(self, client, db_session):
        app_id = self._seed_financed_application(client, db_session)
        officer_token = _login(client, "p2_officer")
        response = client.post(
            "/api/v1/payments/",
            json={"application_id": app_id, "amount": 200.00, "reference": "PAY-P2-APPROVED"},
            headers=_auth(officer_token),
        )
        assert response.status_code == 201
        assert response.json()["application_id"] == app_id

    def test_duplicate_payment_reference_conflict(self, client, db_session):
        app_id = self._seed_financed_application(client, db_session)
        officer_token = _login(client, "p2_officer")
        first = client.post(
            "/api/v1/payments/",
            json={"application_id": app_id, "amount": 100.00, "reference": "PAY-DUP"},
            headers=_auth(officer_token),
        )
        assert first.status_code == 201
        second = client.post(
            "/api/v1/payments/",
            json={"amount": 100.00, "reference": "PAY-DUP"},
            headers=_auth(officer_token),
        )
        assert second.status_code == 409


class TestDashboardStats:
    def test_any_authenticated_user_can_view_scoped_stats(self, client, db_session):
        employee, employer, officer, admin, house = _seed_workflow(db_session)
        token = _login(client, "p2_emp")
        response = client.get("/api/v1/dashboard/stats", headers=_auth(token))
        assert response.status_code == 200
        body = response.json()
        assert body["counts"]["users"] == 1
        assert "recent_applications" in body

    def test_stats_require_authentication(self, client, db_session):
        response = client.get("/api/v1/dashboard/stats")
        assert response.status_code in (401, 403)


def _create_extra_house(db_session, title):
    from app.models import House

    house = House(title=title, location="Block Z", rent_price=600.00)
    db_session.add(house)
    db_session.commit()
    return house
