from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.location import Location
from backend.app.models.reading import SensorReading
from backend.app.schemas.evaluation import SoilHealthEvaluation
from backend.app.services.evaluator import evaluate_soil_health

router = APIRouter(prefix="/locations/{location_id}", tags=["Soil Health Analytics"])

@router.get("/evaluation", response_model=SoilHealthEvaluation)
def get_soil_health_evaluation(location_id: str, db: Session = Depends(get_db)):
    """
    Evaluates real-time sensor telemetry against the location's active crop stage targets.
    Returns:
    - Composite Soil Health Score (0-100) & Status (Optimal/Needs Attention/Critical)
    - Moisture, pH, EC (Salinity), and NPK balance breakdown
    - Immediate agronomic recommendations (e.g. irrigation triggers, lime application)
    """
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail=f"Location '{location_id}' not found.")

    latest_reading = db.query(SensorReading).filter(
        SensorReading.location_id == location_id
    ).order_by(SensorReading.timestamp.desc()).first()

    evaluation = evaluate_soil_health(db, loc, latest_reading)
    return evaluation
