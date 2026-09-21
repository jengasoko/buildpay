from datetime import UTC, datetime, timedelta

from app.models import House, Project, ProjectStatus

PUBLIC_PROJECT_KEYS = {
    "id",
    "name",
    "location",
    "description",
    "start_date",
    "expected_completion",
    "status",
    "image_url",
    "is_featured",
}
PUBLIC_HOUSE_KEYS = {
    "id",
    "project_id",
    "title",
    "bedrooms",
    "bathrooms",
    "area_sqft",
    "location",
    "rent_price",
    "price",
    "image_url",
}


def _create_project(db_session, name="Public Project", **kwargs):
    kwargs.setdefault("start_date", datetime.now(UTC))
    kwargs.setdefault("expected_completion", datetime.now(UTC) + timedelta(days=365))
    kwargs.setdefault("status", ProjectStatus.ONGOING)
    project = Project(name=name, location="Dar es Salaam", **kwargs)
    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)
    return project


def _create_house(db_session, title="Public House", **kwargs):
    kwargs.setdefault("rent_price", 1000.0)
    kwargs.setdefault("available", True)
    house = House(title=title, location="Dar es Salaam", **kwargs)
    db_session.add(house)
    db_session.commit()
    db_session.refresh(house)
    return house


class TestPublicSite:
    def test_site_endpoint_requires_no_auth(self, client, db_session):
        _create_project(db_session)
        _create_house(db_session)
        response = client.get("/api/v1/public/site")
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["brand_name"] == "BuildPay"
        assert data["tagline"]
        assert data["stats"]["projects"] >= 1
        assert data["stats"]["houses"] >= 1
        assert data["contact"]["email"]

    def test_site_endpoint_returns_empty_stats_when_no_data(self, client):
        response = client.get("/api/v1/public/site")
        assert response.status_code == 200
        assert response.json()["stats"] == {"projects": 0, "houses": 0, "available_houses": 0}


class TestPublicProjects:
    def test_list_requires_no_auth_and_whitelists_fields(self, client, db_session):
        _create_project(db_session, name="Proj A", is_featured=True, image_url="/images/bg-house-1.jpg")
        response = client.get("/api/v1/public/projects")
        assert response.status_code == 200, response.text
        items = response.json()
        assert len(items) == 1
        assert set(items[0].keys()) == PUBLIC_PROJECT_KEYS

    def test_featured_filter(self, client, db_session):
        _create_project(db_session, name="Featured", is_featured=True)
        _create_project(db_session, name="Regular", is_featured=False)
        response = client.get("/api/v1/public/projects", params={"featured_only": True})
        names = [item["name"] for item in response.json()]
        assert names == ["Featured"]

    def test_featured_sorted_first(self, client, db_session):
        _create_project(db_session, name="Regular", is_featured=False)
        _create_project(db_session, name="Featured", is_featured=True)
        response = client.get("/api/v1/public/projects")
        assert [item["name"] for item in response.json()] == ["Featured", "Regular"]

    def test_get_by_id(self, client, db_session):
        project = _create_project(db_session, name="By Id")
        response = client.get(f"/api/v1/public/projects/{project.id}")
        assert response.status_code == 200
        assert response.json()["name"] == "By Id"

    def test_get_missing_returns_404(self, client):
        response = client.get("/api/v1/public/projects/999999")
        assert response.status_code == 404


class TestPublicHouses:
    def test_list_available_only_and_whitelists_fields(self, client, db_session):
        _create_house(db_session, title="Available Unit")
        _create_house(db_session, title="Unavailable Unit", available=False)
        response = client.get("/api/v1/public/houses")
        assert response.status_code == 200, response.text
        items = response.json()
        assert [item["title"] for item in items] == ["Available Unit"]
        assert set(items[0].keys()) == PUBLIC_HOUSE_KEYS

    def test_get_by_id(self, client, db_session):
        house = _create_house(db_session, title="House A")
        response = client.get(f"/api/v1/public/houses/{house.id}")
        assert response.status_code == 200
        assert response.json()["title"] == "House A"

    def test_get_missing_returns_404(self, client):
        response = client.get("/api/v1/public/houses/999999")
        assert response.status_code == 404

    def test_get_unavailable_returns_404(self, client, db_session):
        house = _create_house(db_session, title="Taken Unit", available=False)
        response = client.get(f"/api/v1/public/houses/{house.id}")
        assert response.status_code == 404
