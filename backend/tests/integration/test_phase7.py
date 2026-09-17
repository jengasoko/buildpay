from datetime import datetime

from app.core.security import hash_password
from app.models import User, UserRole

_COUNTER = [100]


def _uid():
    _COUNTER[0] += 1
    return f"p7_{_COUNTER[0]}"


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


def _setup_full(client, db_session, prefix=None):
    employee, employer, officer, house, p = _seed(db_session, prefix)
    _approve(client, db_session, employee, employer, house, f"{p}_officer")
    lease = client.get("/api/v1/leases/me", headers=_auth(_login(client, f"{p}_emp"))).json()
    return employee, employer, officer, house, lease, p


class TestAnalyticsTrends:
    def test_revenue_trend_returns_monthly_points(self, client, db_session):
        _, _, _, _, lease, p = _setup_full(client, db_session, "T1")
        ot = _login(client, f"{p}_officer")
        inv = client.post(f"/api/v1/leases/{lease['id']}/generate-invoice", headers=_auth(ot)).json()
        paid = client.post(
            "/api/v1/payments/",
            json={"invoice_id": inv["id"], "amount": 500.0, "reference": f"{p}-R"},
            headers=_auth(ot),
        )
        assert paid.status_code == 201, paid.text

        resp = client.get("/api/v1/dashboard/analytics/revenue-trend?months=12", headers=_auth(ot))
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert "data" in body
        assert len(body["data"]) == 12
        now = datetime.now().strftime("%Y-%m")
        assert body["data"][-1]["month"] == now
        assert body["data"][-1]["value"] >= 500.0

    def test_occupancy_trend_returns_counts(self, client, db_session):
        _, _, _, _, _, p = _setup_full(client, db_session, "T2")
        ot = _login(client, f"{p}_officer")
        resp = client.get("/api/v1/dashboard/analytics/occupancy-trend?months=6", headers=_auth(ot))
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert len(body["data"]) == 6
        last = body["data"][-1]
        assert last["occupied"] >= 1
        assert last["total"] >= 1
        for point in body["data"]:
            assert point["occupied"] <= point["total"]

    def test_collection_rate_returns_rate(self, client, db_session):
        _, _, _, _, lease, p = _setup_full(client, db_session, "T3")
        ot = _login(client, f"{p}_officer")
        inv = client.post(f"/api/v1/leases/{lease['id']}/generate-invoice", headers=_auth(ot)).json()
        paid = client.post(
            "/api/v1/payments/",
            json={"invoice_id": inv["id"], "amount": inv["total_amount"], "reference": f"{p}-CR"},
            headers=_auth(ot),
        )
        assert paid.status_code == 201, paid.text

        resp = client.get("/api/v1/dashboard/analytics/collection-rate?months=12", headers=_auth(ot))
        assert resp.status_code == 200, resp.text
        last = resp.json()["data"][-1]
        assert last["invoiced"] > 0
        assert last["collected"] == last["invoiced"]
        assert last["rate"] == 100.0

    def test_analytics_requires_finance_role(self, client, db_session):
        employee, _, _, _, _, _ = _setup_full(client, db_session, "T4")
        emp_token = _login(client, employee.username)
        resp = client.get("/api/v1/dashboard/analytics/revenue-trend", headers=_auth(emp_token))
        assert resp.status_code == 403


class TestCsvExport:
    def test_financial_report_export_csv(self, client, db_session):
        _, _, _, _, lease, p = _setup_full(client, db_session, "T5")
        ot = _login(client, f"{p}_officer")
        client.post(f"/api/v1/leases/{lease['id']}/generate-invoice", headers=_auth(ot))

        now = datetime.now()
        resp = client.get(
            f"/api/v1/dashboard/reports/financial/export?year={now.year}&month={now.month}",
            headers=_auth(ot),
        )
        assert resp.status_code == 200, resp.text
        assert resp.headers["content-type"].startswith("text/csv")
        text = resp.content.decode("utf-8")
        assert "Collected" in text
        assert "Metric" in text

    def test_occupancy_report_export_csv(self, client, db_session):
        _, _, _, _, _, p = _setup_full(client, db_session, "T6")
        ot = _login(client, f"{p}_officer")
        resp = client.get("/api/v1/dashboard/reports/occupancy/export", headers=_auth(ot))
        assert resp.status_code == 200, resp.text
        assert resp.headers["content-type"].startswith("text/csv")
        text = resp.content.decode("utf-8")
        assert "House ID" in text

    def test_revenue_trend_export_csv(self, client, db_session):
        _, _, _, _, lease, p = _setup_full(client, db_session, "T7")
        ot = _login(client, f"{p}_officer")
        inv = client.post(f"/api/v1/leases/{lease['id']}/generate-invoice", headers=_auth(ot)).json()
        client.post(
            "/api/v1/payments/",
            json={"invoice_id": inv["id"], "amount": 300.0, "reference": f"{p}-RE"},
            headers=_auth(ot),
        )
        resp = client.get("/api/v1/dashboard/analytics/revenue-trend/export?months=12", headers=_auth(ot))
        assert resp.status_code == 200, resp.text
        assert resp.headers["content-type"].startswith("text/csv")
        text = resp.content.decode("utf-8")
        assert "Month" in text
        assert "Collected" in text

    def test_export_requires_finance_role(self, client, db_session):
        employee, _, _, _, _, _ = _setup_full(client, db_session, "T8")
        emp_token = _login(client, employee.username)
        resp = client.get("/api/v1/dashboard/reports/occupancy/export", headers=_auth(emp_token))
        assert resp.status_code == 403
