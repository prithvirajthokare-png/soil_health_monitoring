from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.app.database import get_db
from backend.app.models.crop import CropStageTarget
from backend.app.models.location import Location
from backend.app.models.reading import SensorReading
from backend.app.config import API_TITLE, API_VERSION, SQLITE_DB_PATH

router = APIRouter(tags=["System & Health"])

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint to verify database connectivity and system status."""
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "healthy",
        "service": API_TITLE,
        "version": API_VERSION,
        "database": {
            "type": "SQLite",
            "status": db_status,
            "path": str(SQLITE_DB_PATH)
        }
    }

@router.get("/system/info")
def system_info(db: Session = Depends(get_db)):
    """Returns database statistics and runtime metadata."""
    total_locations = db.query(Location).count()
    total_crops = db.query(CropStageTarget.plant_type).distinct().count()
    total_stages = db.query(CropStageTarget).count()
    total_readings = db.query(SensorReading).count()

    return {
        "title": API_TITLE,
        "version": API_VERSION,
        "engine": "FastAPI + SQLite",
        "statistics": {
            "monitored_locations": total_locations,
            "supported_crops": total_crops,
            "crop_stage_targets": total_stages,
            "total_telemetry_records": total_readings
        }
    }
