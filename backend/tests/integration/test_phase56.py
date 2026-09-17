from datetime import UTC, datetime, timedelta

from app.core.security import hash_password
from app.models import Invoice, InvoiceStatus, LeaseStatus, MaintenanceStatus, User, UserRole

_COUNTER = [0]


def _uid():
    _COUNTER[0] += 1
    return f"t{_COUNTER[0]}"


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


class TestLeaseAutoCreation:
    def test_financial_approval_creates_occupancy_and_lease(self, client, db_session):
        employee, employer, officer, house, p = _seed(db_session, "A")
        app_id = _approve(client, db_session, employee, employer, house, f"{p}_officer")

        lease = client.get("/api/v1/leases/me", headers=_auth(_login(client, f"{p}_emp")))
        assert lease.status_code == 200, lease.text
        body = lease.json()
        assert body is not None
        assert body["status"] == LeaseStatus.ACTIVE.value
        assert body["rent_amount"] == 1000.00
        assert body["deposit_amount"] == 1000.00
        assert body["house_title"] == f"{p} Unit"

        from app.models import Lease, Occupancy

        occupancy = db_session.query(Occupancy).filter(Occupancy.application_id == app_id).first()
        assert occupancy is not None
        lease_row = db_session.query(Lease).filter(Lease.occupancy_id == occupancy.id).first()
        assert lease_row is not None
        assert lease_row.employee_id == employee.id
        assert occupancy.lease_id == lease_row.id

    def test_employer_and_admin_lease_scoping(self, client, db_session):
        employee, employer, officer, house, p = _seed(db_session, "B")
        _approve(client, db_session, employee, employer, house, f"{p}_officer")
        assert client.get("/api/v1/leases", headers=_auth(_login(client, f"{p}_employer"))).json()["total"] == 1
        assert client.get("/api/v1/leases", headers=_auth(_login(client, f"{p}_emp"))).json()["total"] == 1
        assert client.get("/api/v1/leases", headers=_auth(_login(client, f"{p}_admin"))).json()["total"] == 1


class TestBillingInvoices:
    def test_generate_invoice_creates_rent_charge(self, client, db_session):
        _, _, _, house, lease, p = _setup_full(client, db_session, "C")
        inv = client.post(
            f"/api/v1/leases/{lease['id']}/generate-invoice",
            headers=_auth(_login(client, f"{p}_officer")),
        )
        assert inv.status_code == 200, inv.text
        body = inv.json()
        assert body["status"] == InvoiceStatus.OPEN.value
        assert body["house_title"] == house.title
        assert body["charges"][0]["charge_type"] == "RENT"
        assert body["paid_amount"] == 0
        assert body["balance_due"] == body["total_amount"]
        assert body["total_amount"] > 0

    def test_invoice_only_for_active_lease(self, client, db_session):
        _, _, _, house, lease, p = _setup_full(client, db_session, "D")
        ot = _login(client, f"{p}_officer")
        client.post(f"/api/v1/leases/{lease['id']}/terminate", headers=_auth(ot))
        inv = client.post(f"/api/v1/leases/{lease['id']}/generate-invoice", headers=_auth(ot))
        assert inv.status_code == 400

    def test_payment_allocation_partial_then_paid(self, client, db_session):
        _, _, _, house, lease, p = _setup_full(client, db_session, "E")
        ot = _login(client, f"{p}_officer")
        inv = client.post(f"/api/v1/leases/{lease['id']}/generate-invoice", headers=_auth(ot)).json()
        invoice_id = inv["id"]

        partial = client.post(
            "/api/v1/payments/",
            json={"invoice_id": invoice_id, "amount": 400.0, "method": "EFT", "reference": f"{p}-P"},
            headers=_auth(ot),
        )
        assert partial.status_code == 201, partial.text
        assert partial.json()["invoice_id"] == invoice_id

        detail = client.get(f"/api/v1/invoices/{invoice_id}", headers=_auth(ot)).json()
        assert detail["status"] == InvoiceStatus.PARTIAL.value
        assert detail["paid_amount"] == 400.0
        assert detail["balance_due"] == round(inv["total_amount"] - 400.0, 2)

        full = client.post(
            "/api/v1/payments/",
            json={"invoice_id": invoice_id, "amount": detail["balance_due"], "reference": f"{p}-F"},
            headers=_auth(ot),
        )
        assert full.status_code == 201, full.text
        detail2 = client.get(f"/api/v1/invoices/{invoice_id}", headers=_auth(ot)).json()
        assert detail2["status"] == InvoiceStatus.PAID.value
        assert detail2["balance_due"] == 0

    def test_overpayment_rejected(self, client, db_session):
        _, _, _, house, lease, p = _setup_full(client, db_session, "F")
        ot = _login(client, f"{p}_officer")
        inv = client.post(f"/api/v1/leases/{lease['id']}/generate-invoice", headers=_auth(ot)).json()
        overpay = client.post(
            "/api/v1/payments/",
            json={"invoice_id": inv["id"], "amount": inv["total_amount"] + 500, "reference": f"{p}-O"},
            headers=_auth(ot),
        )
        assert overpay.status_code == 400
        assert "exceeds" in overpay.json()["error"]["message"]

    def test_employee_cannot_allocate_payments(self, client, db_session):
        _, _, _, house, lease, p = _setup_full(client, db_session, "G")
        inv = client.post(
            f"/api/v1/leases/{lease['id']}/generate-invoice",
            headers=_auth(_login(client, f"{p}_officer")),
        ).json()
        denied = client.post(
            "/api/v1/payments/",
            json={"invoice_id": inv["id"], "amount": 100, "reference": f"{p}-N"},
            headers=_auth(_login(client, f"{p}_emp")),
        )
        assert denied.status_code == 403


class TestArrearsAndStatements:
    def test_arrears_aging_buckets(self, client, db_session):
        _, _, _, house, lease, p = _setup_full(client, db_session, "H")
        ot = _login(client, f"{p}_officer")
        inv = client.post(f"/api/v1/leases/{lease['id']}/generate-invoice", headers=_auth(ot)).json()

        invoice = db_session.query(Invoice).filter(Invoice.id == inv["id"]).first()
        invoice.due_date = datetime.now(UTC) - timedelta(days=45)
        db_session.commit()

        summary = client.get("/api/v1/arrears", headers=_auth(ot))
        assert summary.status_code == 200, summary.text
        body = summary.json()
        assert body["total_overdue"] == inv["total_amount"]
        assert body["total_outstanding"] == inv["total_amount"]
        buckets = {b["bucket"]: b for b in body["buckets"]}
        assert buckets["31-60"]["amount"] == inv["total_amount"]

    def test_statement_of_account(self, client, db_session):
        _, _, _, house, lease, p = _setup_full(client, db_session, "I")
        ot = _login(client, f"{p}_officer")
        inv = client.post(f"/api/v1/leases/{lease['id']}/generate-invoice", headers=_auth(ot)).json()
        client.post(
            "/api/v1/payments/",
            json={"invoice_id": inv["id"], "amount": 300.0, "reference": f"{p}-S"},
            headers=_auth(ot),
        )
        statement = client.get(
            f"/api/v1/leases/{lease['id']}/statement",
            headers=_auth(_login(client, f"{p}_emp")),
        )
        assert statement.status_code == 200, statement.text
        body = statement.json()
        assert body["balance"] == round(inv["total_amount"] - 300.0, 2)
        kinds = [e["type"] for e in body["entries"]]
        assert "INVOICE" in kinds
        assert "PAYMENT" in kinds

    def test_employee_cannot_view_others_statement(self, client, db_session):
        _, _, _, house, lease, p = _setup_full(client, db_session, "J")
        _create_user(db_session, "J_other", UserRole.EMPLOYEE)
        resp = client.get(
            f"/api/v1/leases/{lease['id']}/statement",
            headers=_auth(_login(client, "J_other")),
        )
        assert resp.status_code == 403


class TestMaintenanceWorkflow:
    def test_full_maintenance_lifecycle(self, client, db_session):
        employee, employer, officer, house, p = _seed(db_session, "K")
        _approve(client, db_session, employee, employer, house, f"{p}_officer")
        emp = f"{p}_emp"
        ot = f"{p}_officer"

        created = client.post(
            "/api/v1/maintenance-requests",
            json={
                "house_id": house.id,
                "category": "PLUMBING",
                "title": "Leaking tap",
                "description": "Kitchen tap leaks",
                "priority": "high",
            },
            headers=_auth(_login(client, emp)),
        )
        assert created.status_code == 201, created.text
        body = created.json()
        assert body["status"] == MaintenanceStatus.SUBMITTED.value
        assert body["employee_id"] == employee.id
        rid = body["id"]

        assign_denied = client.put(
            f"/api/v1/maintenance-requests/{rid}",
            json={"status": "ASSIGNED", "assigned_to_id": employee.id},
            headers=_auth(_login(client, emp)),
        )
        assert assign_denied.status_code == 403

        assign = client.put(
            f"/api/v1/maintenance-requests/{rid}",
            json={"status": "ASSIGNED", "assigned_to_id": employee.id},
            headers=_auth(_login(client, ot)),
        )
        assert assign.status_code == 200, assign.text
        assert assign.json()["status"] == MaintenanceStatus.ASSIGNED.value

        resolve = client.put(
            f"/api/v1/maintenance-requests/{rid}",
            json={"status": "RESOLVED", "resolution_note": "Fixed"},
            headers=_auth(_login(client, ot)),
        )
        assert resolve.status_code == 200, resolve.text

        close = client.put(
            f"/api/v1/maintenance-requests/{rid}",
            json={"status": "CLOSED"},
            headers=_auth(_login(client, emp)),
        )
        assert close.status_code == 200, close.text
        assert close.json()["status"] == MaintenanceStatus.CLOSED.value

    def test_assign_requires_technician(self, client, db_session):
        employee, employer, _, house, p = _seed(db_session, "L")
        _approve(client, db_session, employee, employer, house, f"{p}_officer")
        created = client.post(
            "/api/v1/maintenance-requests",
            json={"house_id": house.id, "title": "Lock", "description": "Broken"},
            headers=_auth(_login(client, f"{p}_emp")),
        ).json()
        resp = client.put(
            f"/api/v1/maintenance-requests/{created['id']}",
            json={"status": "ASSIGNED"},
            headers=_auth(_login(client, f"{p}_officer")),
        )
        assert resp.status_code == 400

    def test_employee_cannot_touch_others_requests(self, client, db_session):
        employee, employer, _, house, p = _seed(db_session, "M")
        _approve(client, db_session, employee, employer, house, f"{p}_officer")
        _create_user(db_session, "M_other", UserRole.EMPLOYEE)
        created = client.post(
            "/api/v1/maintenance-requests",
            json={"house_id": house.id, "title": "Lift", "description": "Stuck"},
            headers=_auth(_login(client, f"{p}_emp")),
        ).json()
        resp = client.put(
            f"/api/v1/maintenance-requests/{created['id']}",
            json={"status": "CLOSED"},
            headers=_auth(_login(client, "M_other")),
        )
        assert resp.status_code == 403


class TestRooms:
    def test_room_binding_swap_and_termination(self, client, db_session):
        _, employer, officer, house, p = _seed(db_session, "N")
        employee = _create_user(db_session, f"{p}_real_emp", UserRole.EMPLOYEE)
        from app.models import Employment

        db_session.add(Employment(employer_id=employer.id, employee_id=employee.id))
        db_session.commit()
        _approve(client, db_session, employee, employer, house, f"{p}_officer")
        ot = _login(client, f"{p}_officer")
        et = _login(client, f"{p}_real_emp")

        room = client.post(
            "/api/v1/rooms",
            json={"house_id": house.id, "room_number": "A-101", "block_type": "PRIVATE", "capacity": 2},
            headers=_auth(ot),
        )
        assert room.status_code == 201, room.text
        room_id = room.json()["id"]

        lease = client.get("/api/v1/leases/me", headers=_auth(et)).json()
        bound = client.put(f"/api/v1/leases/{lease['id']}", json={"room_id": room_id}, headers=_auth(ot))
        assert bound.status_code == 200, bound.text
        assert bound.json()["room_id"] == room_id
        assert client.get(f"/api/v1/rooms/{room_id}", headers=_auth(ot)).json()["is_available"] is False

        room2 = client.post(
            "/api/v1/rooms",
            json={"house_id": house.id, "room_number": "A-102", "block_type": "SHARED", "capacity": 1},
            headers=_auth(ot),
        ).json()
        swapped = client.put(f"/api/v1/leases/{lease['id']}", json={"room_id": room2["id"]}, headers=_auth(ot))
        assert swapped.status_code == 200
        assert client.get(f"/api/v1/rooms/{room_id}", headers=_auth(ot)).json()["is_available"] is True
        assert client.get(f"/api/v1/rooms/{room2['id']}", headers=_auth(ot)).json()["is_available"] is False

        client.post(f"/api/v1/leases/{lease['id']}/terminate", headers=_auth(ot))
        assert client.get(f"/api/v1/rooms/{room2['id']}", headers=_auth(ot)).json()["is_available"] is True


class TestEmployeeDashboard:
    def test_dashboard_me(self, client, db_session):
        employee, employer, officer, house, p = _seed(db_session, "O")
        _approve(client, db_session, employee, employer, house, f"{p}_officer")

        dash = client.get("/api/v1/dashboard/me", headers=_auth(_login(client, f"{p}_emp")))
        assert dash.status_code == 200, dash.text
        body = dash.json()
        assert body["lease"] is not None
        assert body["application"] is not None
        assert body["account_balance"] == 0

        client.post(
            f"/api/v1/leases/{body['lease']['id']}/generate-invoice",
            headers=_auth(_login(client, f"{p}_officer")),
        )
        dash2 = client.get("/api/v1/dashboard/me", headers=_auth(_login(client, f"{p}_emp"))).json()
        assert len(dash2["recent_invoices"]) == 1
        assert dash2["account_balance"] == dash2["recent_invoices"][0]["total_amount"]


class TestReports:
    def test_financial_and_occupancy_reports(self, client, db_session):
        employee, employer, officer, house, p = _seed(db_session, "P")
        _approve(client, db_session, employee, employer, house, f"{p}_officer")
        ot = _login(client, f"{p}_officer")
        now = datetime.now(UTC)

        fin = client.get(
            f"/api/v1/dashboard/reports/financial?year={now.year}&month={now.month}",
            headers=_auth(ot),
        )
        assert fin.status_code == 200, fin.text
        assert "arrears" in fin.json()

        occ = client.get("/api/v1/dashboard/reports/occupancy", headers=_auth(ot))
        assert occ.status_code == 200, occ.text
        body = occ.json()
        assert body["total_houses"] >= 1
        assert body["occupied_houses"] >= 1


class TestApprovalReviewTrail:
    def test_application_records_reviewer_and_note(self, client, db_session):
        employee, employer, officer, house, p = _seed(db_session, "Q")
        app_id = client.post(
            "/api/v1/applications",
            json={"employee_id": employee.id, "house_id": house.id},
            headers=_auth(_login(client, f"{p}_emp")),
        ).json()["id"]

        step1 = client.put(
            f"/api/v1/applications/{app_id}",
            json={"status": "EMPLOYER_APPROVED", "review_note": "Confirmed by HR"},
            headers=_auth(_login(client, f"{p}_employer")),
        )
        assert step1.status_code == 200, step1.text
        body = step1.json()
        assert body["review_note"] == "Confirmed by HR"
        assert body["reviewed_by"] == f"{p}_employer"
        assert body["reviewed_at"] is not None

        step2 = client.put(
            f"/api/v1/applications/{app_id}",
            json={"status": "FINANCIAL_APPROVED"},
            headers=_auth(_login(client, f"{p}_officer")),
        )
        assert step2.status_code == 200, step2.text
        assert step2.json()["reviewed_by"] == f"{p}_officer"
