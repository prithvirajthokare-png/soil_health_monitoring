"""
AI Endpoints
============
Provides AI-powered analytics: irrigation prediction and soil health report generation.
These endpoints sit alongside the existing analytics endpoints and use services that are
designed to be upgraded to a Gemini LLM backend via the GEMINI_API_KEY env variable.
"""

"""
AI Endpoints
============
Provides AI-powered analytics: irrigation prediction and soil health report generation.
These endpoints sit alongside the existing analytics endpoints and use services that are
designed to be upgraded to a Gemini LLM backend via the GEMINI_API_KEY env variable.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.location import Location
from backend.app.services.predictor import predict_irrigation
from backend.app.services.report_generator import generate_report

router = APIRouter(prefix="/locations/{location_id}/ai", tags=["AI Analytics"])


@router.get("/prediction")
def get_irrigation_prediction(location_id: str, db: Session = Depends(get_db)):
    """
    Predicts when irrigation will be required based on moisture trend analysis.

    Uses linear regression over the most recent sensor readings to compute
    the soil drying rate (%/hr) and forecast time-to-trigger.

    Returns:
    - has_trend: whether enough readings exist for prediction
    - slope_pct_per_hour: moisture change rate (negative = drying)
    - current_moisture_pct: latest moisture reading
    - predicted_hours_to_trigger: hours until irrigation threshold is hit
    - urgency: 'critical' | 'warning' | 'normal' | 'unknown'
    - confidence: 'high' | 'medium' | 'low'
    - message: human-readable forecast message
    """
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail=f"Location '{location_id}' not found.")

    return predict_irrigation(db, loc)


@router.get("/report")
def get_soil_health_report(location_id: str, db: Session = Depends(get_db)):
    """
    Generates a comprehensive AI-narrated soil health report for the given location.

    The report includes:
    - Executive summary with health narrative
    - Detailed metric-by-metric breakdown with agronomic interpretation
    - Irrigation forecast and methodology
    - NPK nutrient analysis
    - Prioritized recommendations
    - 7-day action plan

    Currently uses a rule-based narrative engine. Set GEMINI_API_KEY environment
    variable to upgrade to Gemini LLM-powered narrative generation.
    """
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail=f"Location '{location_id}' not found.")

    return generate_report(db, loc)
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.location import Location
from backend.app.services.predictor import predict_irrigation
from backend.app.services.report_generator import generate_report

router = APIRouter(prefix="/locations/{location_id}/ai", tags=["AI Analytics"])


@router.get("/prediction")
def get_irrigation_prediction(location_id: str, db: Session = Depends(get_db)):
    """
    Predicts when irrigation will be required based on moisture trend analysis.

    Uses linear regression over the most recent sensor readings to compute
    the soil drying rate (%/hr) and forecast time-to-trigger.

    Returns:
    - has_trend: whether enough readings exist for prediction
    - slope_pct_per_hour: moisture change rate (negative = drying)
    - current_moisture_pct: latest moisture reading
    - predicted_hours_to_trigger: hours until irrigation threshold is hit
    - urgency: 'critical' | 'warning' | 'normal' | 'unknown'
    - confidence: 'high' | 'medium' | 'low'
    - message: human-readable forecast message
    """
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail=f"Location '{location_id}' not found.")

    return predict_irrigation(db, loc)


@router.get("/report")
def get_soil_health_report(location_id: str, db: Session = Depends(get_db)):
    """
    Generates a comprehensive AI-narrated soil health report for the given location.

    The report includes:
    - Executive summary with health narrative
    - Detailed metric-by-metric breakdown with agronomic interpretation
    - Irrigation forecast and methodology
    - NPK nutrient analysis
    - Prioritized recommendations
    - 7-day action plan

    Currently uses a rule-based narrative engine. Set GEMINI_API_KEY environment
    variable to upgrade to Gemini LLM-powered narrative generation.
    """
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail=f"Location '{location_id}' not found.")

    return generate_report(db, loc)
