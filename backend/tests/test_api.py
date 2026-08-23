import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.database import Base, get_db
from backend.app.main import create_app
from backend.app.services.seeder import run_seed

# Test in-memory SQLite database using StaticPool for shared thread memory
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

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client

def test_health_check(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "database" in data

def test_system_info(client):
    response = client.get("/api/v1/system/info")
    assert response.status_code == 200
    data = response.json()
    assert data["statistics"]["monitored_locations"] >= 1
    assert data["statistics"]["supported_crops"] >= 20

def test_get_crop_categories(client):
    response = client.get("/api/v1/crops/categories")
    assert response.status_code == 200
    categories = response.json()
    assert isinstance(categories, list)
    assert len(categories) > 0

def test_get_all_crops(client):
    response = client.get("/api/v1/crops")
    assert response.status_code == 200
    crops = response.json()
    assert isinstance(crops, list)
    assert len(crops) > 0
    first = crops[0]
    assert "plant_type" in first
    assert "category" in first
    assert len(first["stages"]) >= 1

def test_get_single_crop_profile(client):
    response = client.get("/api/v1/crops/tomato")
    assert response.status_code == 200
    data = response.json()
    assert data["plant_type"] == "tomato"
    assert len(data["stages"]) == 3

def test_get_crop_stage_target(client):
    response = client.get("/api/v1/crops/tomato/stages/1")
    assert response.status_code == 200
    data = response.json()
    assert data["plant_type"] == "tomato"
    assert data["growth_stage"] == 1
    assert data["n_target_mg_kg"] > 0
    assert data["irrigation_trigger_pct"] > 0

def test_get_locations(client):
    response = client.get("/api/v1/locations")
    assert response.status_code == 200
    locs = response.json()
    assert isinstance(locs, list)
    assert len(locs) >= 1
    loc1 = next((l for l in locs if l["id"] == "LOC_001"), None)
    assert loc1 is not None
    assert loc1["name"] == "Idea Factory"

def test_get_single_location(client):
    response = client.get("/api/v1/locations/LOC_001")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "LOC_001"
    assert data["latitude"] is not None
    assert data["longitude"] is not None

def test_create_and_update_location(client):
    new_loc = {
        "id": "LOC_TEST_099",
        "name": "Test Experimental Field",
        "latitude": 13.0125,
        "longitude": 74.7980,
        "current_crop": "paddy",
        "growth_stage": 1,
        "sensor_id": "SN_999",
        "soil_type": "Clay Loam",
        "coverage_area": "12.0 Hectares",
        "status": "active"
    }
    create_resp = client.post("/api/v1/locations", json=new_loc)
    assert create_resp.status_code == 201
    assert create_resp.json()["id"] == "LOC_TEST_099"

    # Update crop stage
    update_resp = client.put("/api/v1/locations/LOC_TEST_099", json={"growth_stage": 2})
    assert update_resp.status_code == 200
    assert update_resp.json()["growth_stage"] == 2

    # Clean up
    del_resp = client.delete("/api/v1/locations/LOC_TEST_099")
    assert del_resp.status_code == 204

def test_ingest_reading_and_latest(client):
    reading_payload = {
        "moisture_pct": 28.5,
        "temperature_c": 22.0,
        "ph": 6.8,
        "ec_ds_m": 1.15,
        "nitrogen_mg_kg": 50.0,
        "phosphorus_mg_kg": 26.0,
        "potassium_mg_kg": 100.0,
        "battery_pct": 99.0
    }
    ingest_resp = client.post("/api/v1/locations/LOC_001/readings", json=reading_payload)
    assert ingest_resp.status_code == 201
    assert ingest_resp.json()["moisture_pct"] == 28.5

    latest_resp = client.get("/api/v1/locations/LOC_001/latest")
    assert latest_resp.status_code == 200
    assert latest_resp.json()["moisture_pct"] == 28.5

def test_reading_history(client):
    response = client.get("/api/v1/locations/LOC_001/history?hours=48&limit=50")
    assert response.status_code == 200
    readings = response.json()
    assert isinstance(readings, list)
    assert len(readings) > 0

def test_soil_health_evaluation(client):
    response = client.get("/api/v1/locations/LOC_001/evaluation")
    assert response.status_code == 200
    eval_data = response.json()
    assert eval_data["location_id"] == "LOC_001"
    assert "health_score" in eval_data
    assert 0 <= eval_data["health_score"] <= 100
    assert "health_status" in eval_data
    assert len(eval_data["evaluations"]) > 0
    assert len(eval_data["recommendations"]) > 0

def test_export_historical_telemetry_csv(client):
    # Test 1 week range
    resp_week = client.get("/api/v1/locations/LOC_001/export?range=1week")
    assert resp_week.status_code == 200
    assert "text/csv" in resp_week.headers.get("content-type", "")
    assert "attachment; filename=\"LOC_001_telemetry_1week.csv\"" in resp_week.headers.get("content-disposition", "")
    csv_text = resp_week.text
    assert "Timestamp (UTC),Location ID,Location Name" in csv_text
    assert "LOC_001,Idea Factory" in csv_text

    # Test 1 month range
    resp_month = client.get("/api/v1/locations/LOC_001/export?range=1month")
    assert resp_month.status_code == 200
    assert "LOC_001_telemetry_1month.csv" in resp_month.headers.get("content-disposition", "")

    # Test 1 year range
    resp_year = client.get("/api/v1/locations/LOC_001/export?range=1year")
    assert resp_year.status_code == 200
    assert "LOC_001_telemetry_1year.csv" in resp_year.headers.get("content-disposition", "")
