import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from app.core.rate_limit import rate_limiter
from app.main import app

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "sqlite:///./test_hms.db",
)

connect_args = {}
if TEST_DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    if TEST_DATABASE_URL.startswith("sqlite"):
        import pathlib

        pathlib.Path("test_hms.db").unlink(missing_ok=True)


@pytest.fixture(scope="function", autouse=True)
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function", autouse=True)
def _reset_rate_limits():
    # TestClient requests all share one fake host, so the rate limiter's
    # per-IP buckets must be cleared between tests or they'd leak across
    # every test that happens to hit /auth/login or /auth/register.
    rate_limiter._hits.clear()
    yield


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
