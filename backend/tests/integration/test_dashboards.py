from app.core.security import hash_password
from app.models import User, UserRole

_COUNTER = [200]


def _uid():
    _COUNTER[0] += 1
    return f"dbd_{_COUNTER[0]}"


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
    response = client.post("/api/v1/auth/login", json={"username": username, "password": password})
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def _seed(db_session, prefix=None):
    from app.models import Employment, House

    p = prefix or _uid()
    employee = _create_user(db_session, f"{p}_emp", UserRole.EMPLOYEE)
    employer = _create_user(db_session, f"{p}_employer", UserRole.EMPLOYER)
    officer = _create_user(db_session, f"{p}_officer", UserRole.FINANCIAL_OFFICER)
    _create_user(db_session, f"{p}_admin", UserRole.ADMIN)
    house = House(title=f"{p} Unit", location="Block C", rent_price=1000.00)
    db_session.add(house)
    db_session.add(Employment(employer_id=employer.id, employee_id=employee.id))
    db_session.commit()
    return employee, employer, officer, house, p


def _approve(client, db_session, employee, employer, house, officer_username):
    emp_token = _login(client, employee.username)
    created = client.post(
        "/api/v1/applications",
        json={"employee_id": employee.id, "house_id": house.id},
        headers=_auth(emp_token),
    )
    assert created.status_code == 201, created.text
    app_id = created.json()["id"]
    r1 = client.put(
        f"/api/v1/applications/{app_id}",
        json={"status": "EMPLOYER_APPROVED", "review_note": "HR confirmed"},
        headers=_auth(_login(client, employer.username)),
    )
    assert r1.status_code == 200, r1.text
    r2 = client.put(
        f"/api/v1/applications/{app_id}",
        json={"status": "FINANCIAL_APPROVED"},
        headers=_auth(_login(client, officer_username)),
    )
    assert r2.status_code == 200, r2.text
    return app_id


def _apply(client, employee, house):
    created = client.post(
        "/api/v1/applications",
        json={"employee_id": employee.id, "house_id": house.id},
        headers=_auth(_login(client, employee.username)),
    )
    assert created.status_code == 201, created.text
    return created.json()


class TestRoleScopedStats:
    def test_admin_stats_are_system_wide(self, client, db_session):
        _, _, _, _, p = _seed(db_session, "DS1")
        resp = client.get("/api/v1/dashboard/stats", headers=_auth(_login(client, f"{p}_admin")))
        assert resp.status_code == 200, resp.text
        counts = resp.json()["counts"]
        assert counts["users"] >= 4
        assert counts["employees"] >= 1
        assert counts["employers"] >= 1

    def test_employer_stats_are_team_scoped(self, client, db_session):
        _, _, _, _, p1 = _seed(db_session, "DS2")
        _seed(db_session, "DS3")
        resp = client.get("/api/v1/dashboard/stats", headers=_auth(_login(client, f"{p1}_employer")))
        assert resp.status_code == 200, resp.text
        counts = resp.json()["counts"]
        assert counts["employees"] == 1
        assert counts["users"] == 1
        assert counts["projects"] == 0
        assert counts["houses"] == 0

    def test_employee_stats_are_minimal(self, client, db_session):
        employee, _, _, _, p = _seed(db_session, "DS4")
        resp = client.get("/api/v1/dashboard/stats", headers=_auth(_login(client, employee.username)))
        assert resp.status_code == 200, resp.text
        counts = resp.json()["counts"]
        assert counts["users"] == 1
        assert counts["projects"] == 0
        assert resp.json()["total_payment_amount"] == 0.0

    def test_project_manager_still_sees_system_stats(self, client, db_session):
        _, _, _, _, p = _seed(db_session, "DS5")
        manager = _create_user(db_session, f"{p}_manager", UserRole.PROJECT_MANAGER)
        resp = client.get("/api/v1/dashboard/stats", headers=_auth(_login(client, manager.username)))
        counts = resp.json()["counts"]
        assert counts["users"] >= 5


class TestEmployerDashboard:
    def test_employer_dashboard_shows_team(self, client, db_session):
        emp_a_employee, emp_a_employer, _, house_a, p_a = _seed(db_session, "ED1")
        emp_b_employee, emp_b_employer, _, house_b, p_b = _seed(db_session, "ED2")
        _approve(client, db_session, emp_a_employee, emp_a_employer, house_a, f"{p_a}_officer")
        _approve(client, db_session, emp_b_employee, emp_b_employer, house_b, f"{p_b}_officer")

        token = _login(client, emp_a_employer.username)
        resp = client.get("/api/v1/dashboard/employer", headers=_auth(token))
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert body["staff"]["total"] == 1
        assert body["staff"]["with_lease"] == 1
        assert body["team_houses"] == 1
        assert body["active_leases"] == 1
        assert len(body["team_leases"]) == 1
        assert body["team_leases"][0]["employee_username"] == emp_a_employee.username
        assert body["team_leases"][0]["house_title"] == house_a.title
        assert "PENDING" not in {a["status"] for a in body["recent_applications"]}

    def test_employer_sees_only_own_team_applications(self, client, db_session):
        emp_a, emp_a_employer, _, house_a, _ = _seed(db_session, "ED3")
        emp_b, _, _, house_b, _ = _seed(db_session, "ED4")
        _apply(client, emp_a, house_a)
        _apply(client, emp_b, house_b)

        token_a = _login(client, emp_a_employer.username)
        resp = client.get("/api/v1/dashboard/employer", headers=_auth(token_a))
        body = resp.json()
        assert body["pending_applications"] == 1
        assert len(body["recent_applications"]) == 1
        assert body["recent_applications"][0]["employee_username"] == emp_a.username

        stats = client.get("/api/v1/dashboard/stats", headers=_auth(token_a)).json()
        assert stats["counts"]["applications"] == 1
        assert stats["counts"]["pending_applications"] == 1


class TestFinanceDashboard:
    def test_finance_dashboard_returns_cash_position(self, client, db_session):
        _, _, officer, _, lease, p = _setup_full(client, db_session, "FD1")
        ot = _login(client, f"{p}_officer")
        inv = client.post(f"/api/v1/leases/{lease['id']}/generate-invoice", headers=_auth(ot)).json()
        paid = client.post(
            "/api/v1/payments/",
            json={"invoice_id": inv["id"], "amount": 500.0, "reference": f"{p}-FD"},
            headers=_auth(ot),
        )
        assert paid.status_code == 201, paid.text

        resp = client.get("/api/v1/dashboard/financial", headers=_auth(ot))
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert body["month"] >= 1
        assert body["year"] >= 2020
        assert body["collected_this_month"] >= 500.0
        assert body["collected_all_time"] >= 500.0
        assert body["active_leases"] >= 1
        assert body["open_invoices"] >= 1
        assert isinstance(body["arrears"], list)
        assert len(body["recent_payments"]) >= 1


class TestDashboardAccessControl:
    def test_employee_cannot_access_employer_dashboard(self, client, db_session):
        _, _, _, _, p = _seed(db_session, "DA1")
        token = _login(client, f"{p}_emp")
        assert client.get("/api/v1/dashboard/employer", headers=_auth(token)).status_code == 403

    def test_employee_cannot_access_finance_dashboard(self, client, db_session):
        _, _, _, _, p = _seed(db_session, "DA2")
        token = _login(client, f"{p}_emp")
        assert client.get("/api/v1/dashboard/financial", headers=_auth(token)).status_code == 403

    def test_employer_cannot_access_finance_dashboard(self, client, db_session):
        _, _, _, _, p = _seed(db_session, "DA3")
        token = _login(client, f"{p}_employer")
        assert client.get("/api/v1/dashboard/financial", headers=_auth(token)).status_code == 403

    def test_officer_cannot_access_employer_dashboard(self, client, db_session):
        _, _, _, _, p = _seed(db_session, "DA4")
        token = _login(client, f"{p}_officer")
        assert client.get("/api/v1/dashboard/employer", headers=_auth(token)).status_code == 403

    def test_admin_can_access_finance_dashboard(self, client, db_session):
        _, _, _, _, p = _seed(db_session, "DA5")
        token = _login(client, f"{p}_admin")
        assert client.get("/api/v1/dashboard/financial", headers=_auth(token)).status_code == 200


def _setup_full(client, db_session, prefix=None):
    employee, employer, officer, house, p = _seed(db_session, prefix)
    _approve(client, db_session, employee, employer, house, f"{p}_officer")
    lease = client.get("/api/v1/leases/me", headers=_auth(_login(client, f"{p}_emp"))).json()
    return employee, employer, officer, house, lease, p
