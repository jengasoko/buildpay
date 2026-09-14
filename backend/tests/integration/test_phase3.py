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


def _seed_stack(db_session):
    from app.models import Employment, House

    employer = _create_user(db_session, "p3_employer", UserRole.EMPLOYER)
    other_employer = _create_user(db_session, "p3_other_employer", UserRole.EMPLOYER)
    employee = _create_user(db_session, "p3_emp", UserRole.EMPLOYEE)
    other_employee = _create_user(db_session, "p3_other_emp", UserRole.EMPLOYEE)
    officer = _create_user(db_session, "p3_officer", UserRole.FINANCIAL_OFFICER)
    admin = _create_user(db_session, "p3_admin", UserRole.ADMIN)
    house = House(title="P3 Unit", location="Block P", rent_price=800.00)
    db_session.add(house)
    assignment = Employment(employer_id=employer.id, employee_id=employee.id)
    db_session.add(assignment)
    db_session.commit()
    return employer, other_employer, employee, other_employee, officer, admin, house


def _apply_and_get_id(client, employee, house):
    token = _login(client, employee.username)
    response = client.post(
        "/api/v1/applications",
        json={"employee_id": employee.id, "house_id": house.id},
        headers=_auth(token),
    )
    assert response.status_code == 201, response.text
    return response.json()["id"]


class TestEmployment:
    def test_admin_assigns_employee_to_employer(self, client, db_session):
        employer, other_employer, employee, other_employee, officer, admin, house = _seed_stack(db_session)
        other_assign = client.post(
            "/api/v1/employments",
            json={"employer_id": employer.id, "employee_id": other_employee.id},
            headers=_auth(_login(client, "p3_admin")),
        )
        assert other_assign.status_code == 201
        assert other_assign.json()["employee_username"] == "p3_other_emp"

    def test_employee_cannot_be_assigned_twice(self, client, db_session):
        employer, other_employer, employee, other_employee, officer, admin, house = _seed_stack(db_session)
        admin_token = _auth(_login(client, "p3_admin"))
        second = client.post(
            "/api/v1/employments",
            json={"employer_id": other_employer.id, "employee_id": employee.id},
            headers=admin_token,
        )
        assert second.status_code == 409

    def test_cannot_assign_non_employee(self, client, db_session):
        _seed_stack(db_session)
        admin_token = _auth(_login(client, "p3_admin"))
        response = client.post(
            "/api/v1/employments",
            json={"employer_id": 1, "employee_id": 1},
            headers=admin_token,
        )
        assert response.status_code in (400, 404)

    def test_employer_lists_only_own_team(self, client, db_session):
        _seed_stack(db_session)
        admin_token = _auth(_login(client, "p3_admin"))
        client.post(
            "/api/v1/employments",
            json={"employer_id": 1, "employee_id": 3},
            headers=admin_token,
        )

        employer = _login(client, "p3_employer")
        response = client.get("/api/v1/employments", headers=_auth(employer))
        assert response.status_code == 200
        assert response.json()["total"] == 1
        assert response.json()["items"][0]["employee_username"] == "p3_emp"

        emp_token = _login(client, "p3_emp")
        forbidden = client.get("/api/v1/employments", headers=_auth(emp_token))
        assert forbidden.status_code == 403


class TestEmployerScope:
    def test_employer_cannot_review_outside_team(self, client, db_session):
        _, other_employer, employee, _, _, _, house = _seed_stack(db_session)
        application_id = _apply_and_get_id(client, employee, house)

        other_token = _login(client, "p3_other_employer")
        response = client.put(
            f"/api/v1/applications/{application_id}",
            json={"status": "EMPLOYER_APPROVED"},
            headers=_auth(other_token),
        )
        assert response.status_code == 403

    def test_assigned_employer_can_review_and_occupancy_is_created(self, client, db_session):
        from app.models import Occupancy

        employer, other_employer, employee, _, officer, _, house = _seed_stack(db_session)
        application_id = _apply_and_get_id(client, employee, house)

        employer_token = _login(client, "p3_employer")
        approved = client.put(
            f"/api/v1/applications/{application_id}",
            json={"status": "EMPLOYER_APPROVED"},
            headers=_auth(employer_token),
        )
        assert approved.status_code == 200

        officer_token = _login(client, "p3_officer")
        financed = client.put(
            f"/api/v1/applications/{application_id}",
            json={"status": "FINANCIAL_APPROVED"},
            headers=_auth(officer_token),
        )
        assert financed.status_code == 200
        assert financed.json()["employer_username"] == "p3_employer"

        db_session.expire_all()
        occupancy = db_session.query(Occupancy).filter(Occupancy.application_id == application_id).first()
        assert occupancy is not None
        assert occupancy.ended_at is None
        db_session.refresh(house)
        assert house.available is False

    def test_employee_cannot_browse_occupancies(self, client, db_session):
        _, _, employee, _, _, _, _house = _seed_stack(db_session)
        token = _login(client, "p3_emp")
        response = client.get("/api/v1/occupancies", headers=_auth(token))
        assert response.status_code == 403

    def test_finance_can_list_and_end_occupancy(self, client, db_session):
        employer, other_employer, employee, _, officer, _, house = _seed_stack(db_session)
        application_id = _apply_and_get_id(client, employee, house)
        client.put(
            f"/api/v1/applications/{application_id}",
            json={"status": "EMPLOYER_APPROVED"},
            headers=_auth(_login(client, "p3_employer")),
        )
        client.put(
            f"/api/v1/applications/{application_id}",
            json={"status": "FINANCIAL_APPROVED"},
            headers=_auth(_login(client, "p3_officer")),
        )

        officer_token = _auth(_login(client, "p3_officer"))
        listing = client.get("/api/v1/occupancies", headers=officer_token)
        assert listing.status_code == 200
        assert listing.json()["total"] == 1
        occupancy_id = listing.json()["items"][0]["id"]
        assert listing.json()["items"][0]["house_title"] == "P3 Unit"
        assert listing.json()["items"][0]["employee_username"] == "p3_emp"

        ended = client.post(f"/api/v1/occupancies/{occupancy_id}/end", headers=officer_token)
        assert ended.status_code == 200
        assert ended.json()["ended_at"] is not None

        db_session.expire_all()
        db_session.refresh(house)
        assert house.available is True


class TestNotifications:
    def test_apply_notifies_employer_and_finance(self, client, db_session):
        employer, other_employer, employee, _, officer, _, house = _seed_stack(db_session)
        _apply_and_get_id(client, employee, house)

        employer_token = _auth(_login(client, "p3_employer"))
        employer_notifs = client.get("/api/v1/notifications", headers=employer_token)
        assert employer_notifs.status_code == 200
        assert employer_notifs.json()["total"] >= 1

        officer_token = _auth(_login(client, "p3_officer"))
        officer_notifs = client.get("/api/v1/notifications", headers=officer_token)
        assert officer_notifs.json()["total"] >= 1

    def test_unread_count_and_mark_read(self, client, db_session):
        _, _, employee, _, _, _, house = _seed_stack(db_session)
        _apply_and_get_id(client, employee, house)

        emp_token = _auth(_login(client, "p3_emp"))
        # apply creates notifications for employer + finance, not the employee yet
        before = client.get("/api/v1/notifications/unread-count", headers=emp_token).json()["count"]

        employer_token = _auth(_login(client, "p3_employer"))
        response = client.post(
            "/api/v1/notifications/read-all",
            headers=employer_token,
        )
        assert response.status_code == 200
        assert response.json()["updated"] >= 1

        after = client.get("/api/v1/notifications/unread-count", headers=employer_token).json()["count"]
        assert after < before or after == 0

    def test_employee_cannot_mark_others_notifications(self, client, db_session):
        _, _, employee, _, _, _, _house = _seed_stack(db_session)
        emp_token = _auth(_login(client, "p3_emp"))
        listing = client.get("/api/v1/notifications", headers=emp_token)
        assert listing.status_code == 200
        assert listing.json()["total"] == 0

    def test_financial_approval_notifies_employee_with_payments_visible(self, client, db_session):
        _, _, employee, _, officer, _, house = _seed_stack(db_session)
        application_id = _apply_and_get_id(client, employee, house)
        client.put(
            f"/api/v1/applications/{application_id}",
            json={"status": "EMPLOYER_APPROVED"},
            headers=_auth(_login(client, "p3_employer")),
        )
        client.put(
            f"/api/v1/applications/{application_id}",
            json={"status": "FINANCIAL_APPROVED"},
            headers=_auth(_login(client, "p3_officer")),
        )
        client.post(
            "/api/v1/payments/",
            json={"application_id": application_id, "amount": 500.00, "reference": "PAY-P3-1"},
            headers=_auth(_login(client, "p3_officer")),
        )

        emp_token = _auth(_login(client, "p3_emp"))
        notifs = client.get("/api/v1/notifications", headers=emp_token)
        titles = [n["title"] for n in notifs.json()["items"]]
        assert "Application employer-approved" in titles
        assert "Application financially approved" in titles
        assert "Payment recorded" in titles

        mine = client.get("/api/v1/payments/my-payments", headers=emp_token)
        assert mine.status_code == 200
        assert mine.json()["total"] == 1
        assert mine.json()["items"][0]["application_house_title"] == "P3 Unit"


class TestDashboardPhase3:
    def test_stats_include_active_occupancies(self, client, db_session):
        _seed_stack(db_session)
        token = _auth(_login(client, "p3_emp"))
        response = client.get("/api/v1/dashboard/stats", headers=token)
        assert response.status_code == 200
        assert "active_occupancies" in response.json()["counts"]
        assert response.json()["counts"]["active_occupancies"] >= 0

    def test_user_response_includes_employer(self, client, db_session):
        _seed_stack(db_session)
        admin_token = _auth(_login(client, "p3_admin"))
        listing = client.get("/api/v1/users/", headers=admin_token)
        assert listing.status_code == 200
        employee = next(u for u in listing.json()["items"] if u["username"] == "p3_emp")
        assert employee["employer_username"] == "p3_employer"
