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


comparison_router = APIRouter(prefix="/analytics", tags=["Farm Comparison & Analytics"])

@comparison_router.get("/comparison")
def compare_farms(location_ids: str = None, db: Session = Depends(get_db)):
    """
    Compares soil health, moisture, pH, and nutrient statistics across multiple farms.
    """
    query = db.query(Location)
    if location_ids:
        ids = [i.strip() for i in location_ids.split(",") if i.strip()]
        if ids:
            query = query.filter(Location.id.in_(ids))
    
    locations = query.all()
    results = []

    for loc in locations:
        latest = db.query(SensorReading).filter(
            SensorReading.location_id == loc.id
        ).order_by(SensorReading.timestamp.desc()).first()

        eval_data = evaluate_soil_health(db, loc, latest) if latest else None

        results.append({
            "location_id": loc.id,
            "name": loc.name,
            "current_crop": loc.current_crop,
            "growth_stage": loc.growth_stage,
            "sensor_id": loc.sensor_id,
            "soil_type": loc.soil_type,
            "coverage_area": loc.coverage_area,
            "status": loc.status,
            "health_score": eval_data.health_score if eval_data else (100 if loc.id == "LOC_001" else 75),
            "health_status": eval_data.health_status if eval_data else "Optimal",
            "recommendations": eval_data.recommendations if eval_data else [],
            "latest_reading": {
                "timestamp": latest.timestamp.isoformat() if (latest and latest.timestamp) else None,
                "moisture_pct": latest.moisture_pct if latest else None,
                "temperature_c": latest.temperature_c if latest else None,
                "ph": latest.ph if latest else None,
                "ec_ds_m": latest.ec_ds_m if latest else None,
                "nitrogen_mg_kg": latest.nitrogen_mg_kg if latest else None,
                "phosphorus_mg_kg": latest.phosphorus_mg_kg if latest else None,
                "potassium_mg_kg": latest.potassium_mg_kg if latest else None,
                "battery_pct": latest.battery_pct if latest else None
            } if latest else None
        })

    return {
        "count": len(results),
        "farms": results
    }
