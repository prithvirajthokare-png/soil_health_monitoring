from contextlib import asynccontextmanager
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.database import Base, get_db
from backend.app.main import create_app
from backend.app.services.seeder import run_seed

# Shared in-memory test database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def test_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    run_seed(db)
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(test_db):
    app = create_app()

    @asynccontextmanager
    async def _test_lifespan(app):
        yield

    app.router.lifespan_context = _test_lifespan

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client

def test_admin_login(client):
    response = client.post("/api/v1/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["username"] == "admin"
    assert data["user"]["role"] == "admin"

def test_farmer_login(client):
    response = client.post("/api/v1/auth/login", json={
        "username": "farmer_nitk",
        "password": "farmer123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["username"] == "farmer_nitk"
    assert data["user"]["role"] == "user"
    assert "LOC_001" in data["user"]["assigned_farms"]

def test_invalid_login(client):
    response = client.post("/api/v1/auth/login", json={
        "username": "admin",
        "password": "wrongpassword"
    })
    assert response.status_code == 401

def test_user_registration(client):
    payload = {
        "username": "farmer_new",
        "email": "farmer_new@test.com",
        "password": "securepassword123",
        "full_name": "New Farmer Test",
        "role": "user",
        "assigned_farms": ["LOC_001"]
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["user"]["username"] == "farmer_new"
    assert "LOC_001" in data["user"]["assigned_farms"]

def test_rbac_admin_can_list_users(client):
    # Log in as admin
    login_resp = client.post("/api/v1/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    users_resp = client.get("/api/v1/users", headers=headers)
    assert users_resp.status_code == 200
    users = users_resp.json()
    assert isinstance(users, list)
    assert len(users) >= 3

def test_rbac_regular_user_cannot_list_users(client):
    # Log in as farmer
    login_resp = client.post("/api/v1/auth/login", json={
        "username": "farmer_nitk",
        "password": "farmer123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    users_resp = client.get("/api/v1/users", headers=headers)
    assert users_resp.status_code == 403

def test_admin_assign_farm_to_user(client):
    # Log in as admin
    login_resp = client.post("/api/v1/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    admin_token = login_resp.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Assign LOC_002 to farmer_nitk (user id 2)
    users_resp = client.get("/api/v1/users", headers=admin_headers)
    farmer_nitk = next(u for u in users_resp.json() if u["username"] == "farmer_nitk")
    user_id = farmer_nitk["id"]

    assign_resp = client.post(
        f"/api/v1/users/{user_id}/farms", 
        json={"location_ids": ["LOC_002"]},
        headers=admin_headers
    )
    assert assign_resp.status_code == 200
    data = assign_resp.json()
    assert "LOC_002" in data["assigned_farms"]

    # Clean up / unassign
    unassign_resp = client.delete(
        f"/api/v1/users/{user_id}/farms/LOC_002",
        headers=admin_headers
    )
    assert unassign_resp.status_code == 204

def test_farm_comparison_analytics(client):
    resp = client.get("/api/v1/analytics/comparison?location_ids=LOC_001,LOC_002")
    assert resp.status_code == 200
    data = resp.json()
    assert "count" in data
    assert "farms" in data
    assert len(data["farms"]) >= 1
    farm1 = data["farms"][0]
    assert "location_id" in farm1
    assert "health_score" in farm1
