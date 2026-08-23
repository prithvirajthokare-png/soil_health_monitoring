from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.location import Location
from backend.app.models.reading import SensorReading
from backend.app.schemas.location import (
    LocationCreate, 
    LocationUpdate, 
    LocationResponse, 
    LocationSummary
)
from backend.app.schemas.reading import SensorReadingResponse
from backend.app.services.evaluator import evaluate_soil_health

router = APIRouter(prefix="/locations", tags=["Locations"])

@router.get("", response_model=List[LocationSummary])
def get_all_locations(db: Session = Depends(get_db)):
    """Retrieve all monitored field locations with their latest telemetry and health score."""
    locations = db.query(Location).all()
    results = []

    for loc in locations:
        latest = db.query(SensorReading).filter(
            SensorReading.location_id == loc.id
        ).order_by(SensorReading.timestamp.desc()).first()

        health_eval = evaluate_soil_health(db, loc, latest) if latest else None

        loc_summary = LocationSummary(
            id=loc.id,
            name=loc.name,
            latitude=loc.latitude,
            longitude=loc.longitude,
            current_crop=loc.current_crop,
            growth_stage=loc.growth_stage,
            sensor_id=loc.sensor_id,
            soil_type=loc.soil_type,
            coverage_area=loc.coverage_area,
            status=loc.status,
            created_at=loc.created_at,
            updated_at=loc.updated_at,
            latest_reading=SensorReadingResponse.model_validate(latest).model_dump() if latest else None,
            health_score=health_eval.health_score if health_eval else None
        )
        results.append(loc_summary)

    return results

@router.get("/{location_id}", response_model=LocationSummary)
def get_location_by_id(location_id: str, db: Session = Depends(get_db)):
    """Get detailed information and latest telemetry for a specific location."""
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail=f"Location '{location_id}' not found.")

    latest = db.query(SensorReading).filter(
        SensorReading.location_id == loc.id
    ).order_by(SensorReading.timestamp.desc()).first()

    health_eval = evaluate_soil_health(db, loc, latest) if latest else None

    return LocationSummary(
        id=loc.id,
        name=loc.name,
        latitude=loc.latitude,
        longitude=loc.longitude,
        current_crop=loc.current_crop,
        growth_stage=loc.growth_stage,
        sensor_id=loc.sensor_id,
        soil_type=loc.soil_type,
        coverage_area=loc.coverage_area,
        status=loc.status,
        created_at=loc.created_at,
        updated_at=loc.updated_at,
        latest_reading=SensorReadingResponse.model_validate(latest).model_dump() if latest else None,
        health_score=health_eval.health_score if health_eval else None
    )

@router.post("", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
def create_location(payload: LocationCreate, db: Session = Depends(get_db)):
    """Register a new monitored field location."""
    existing = db.query(Location).filter(Location.id == payload.id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Location with ID '{payload.id}' already exists.")

    new_loc = Location(**payload.model_dump())
    db.add(new_loc)
    db.commit()
    db.refresh(new_loc)
    return new_loc

@router.put("/{location_id}", response_model=LocationResponse)
def update_location(location_id: str, payload: LocationUpdate, db: Session = Depends(get_db)):
    """Update location parameters (e.g. crop type, growth stage, or coordinates)."""
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail=f"Location '{location_id}' not found.")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(loc, key, value)

    db.commit()
    db.refresh(loc)
    return loc

@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_location(location_id: str, db: Session = Depends(get_db)):
    """Delete a monitored location and its telemetry records."""
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail=f"Location '{location_id}' not found.")

    db.delete(loc)
    db.commit()
    return None
