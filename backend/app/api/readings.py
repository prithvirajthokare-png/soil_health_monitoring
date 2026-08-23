import io
import csv
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.location import Location
from backend.app.models.reading import SensorReading
from backend.app.schemas.reading import (
    SensorReadingCreate, 
    SensorReadingResponse, 
    SensorReadingBatchCreate
)

router = APIRouter(prefix="/locations/{location_id}", tags=["Sensor Readings & Telemetry"])

@router.get("/latest", response_model=SensorReadingResponse)
def get_latest_reading(location_id: str, db: Session = Depends(get_db)):
    """Retrieve the most recent real-time sensor reading for a given field location."""
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail=f"Location '{location_id}' not found.")

    latest = db.query(SensorReading).filter(
        SensorReading.location_id == location_id
    ).order_by(SensorReading.timestamp.desc()).first()

    if not latest:
        raise HTTPException(status_code=404, detail=f"No telemetry readings found for '{location_id}'.")

    return latest

@router.get("/history", response_model=List[SensorReadingResponse])
def get_reading_history(
    location_id: str,
    hours: Optional[int] = Query(24, ge=1, le=8760, description="Number of past hours of telemetry"),
    limit: Optional[int] = Query(1000, ge=1, le=10000, description="Max number of records to return"),
    db: Session = Depends(get_db)
):
    """Retrieve historical time-series sensor data for a field location."""
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail=f"Location '{location_id}' not found.")

    since_time = datetime.now(timezone.utc) - timedelta(hours=hours)

    readings = db.query(SensorReading).filter(
        SensorReading.location_id == location_id,
        SensorReading.timestamp >= since_time
    ).order_by(SensorReading.timestamp.desc()).limit(limit).all()

    return readings

@router.get("/export")
def export_historical_telemetry_csv(
    location_id: str,
    range: str = Query("1week", description="Historical time range: '1week', '1month', '1year'"),
    db: Session = Depends(get_db)
):
    """
    Exports historical sensor telemetry for the given location and time range as a downloadable CSV file.
    Supported ranges:
    - 1week (7 days)
    - 1month (30 days)
    - 1year (365 days)
    """
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail=f"Location '{location_id}' not found.")

    range_clean = range.lower().strip()
    if range_clean in ["1week", "7d", "week"]:
        days_count = 7
        range_label = "1week"
    elif range_clean in ["1month", "30d", "month"]:
        days_count = 30
        range_label = "1month"
    elif range_clean in ["1year", "365d", "year"]:
        days_count = 365
        range_label = "1year"
    else:
        days_count = 7
        range_label = "1week"

    since_time = datetime.now(timezone.utc) - timedelta(days=days_count)

    readings = db.query(SensorReading).filter(
        SensorReading.location_id == location_id,
        SensorReading.timestamp >= since_time
    ).order_by(SensorReading.timestamp.asc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    
    # Standard CSV Header
    writer.writerow([
        "Timestamp (UTC)",
        "Location ID",
        "Location Name",
        "Sensor ID",
        "Moisture (%)",
        "Soil Temperature (°C)",
        "Soil pH",
        "Electrical Conductivity (dS/m)",
        "Nitrogen (mg/kg)",
        "Phosphorus (mg/kg)",
        "Potassium (mg/kg)",
        "Battery (%)"
    ])

    for r in readings:
        writer.writerow([
            r.timestamp.isoformat() if r.timestamp else "",
            r.location_id,
            loc.name,
            r.sensor_id or "",
            round(r.moisture_pct, 2) if r.moisture_pct is not None else "",
            round(r.temperature_c, 2) if r.temperature_c is not None else "",
            round(r.ph, 2) if r.ph is not None else "",
            round(r.ec_ds_m, 2) if r.ec_ds_m is not None else "",
            round(r.nitrogen_mg_kg, 2) if r.nitrogen_mg_kg is not None else "",
            round(r.phosphorus_mg_kg, 2) if r.phosphorus_mg_kg is not None else "",
            round(r.potassium_mg_kg, 2) if r.potassium_mg_kg is not None else "",
            round(r.battery_pct, 1) if r.battery_pct is not None else ""
        ])

    csv_content = output.getvalue()
    filename = f"{location_id}_telemetry_{range_label}.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=\"{filename}\"",
            "Cache-Control": "no-cache"
        }
    )

@router.post("/readings", response_model=SensorReadingResponse, status_code=status.HTTP_201_CREATED)
def ingest_sensor_reading(
    location_id: str,
    payload: SensorReadingCreate,
    db: Session = Depends(get_db)
):
    """Ingest a new real-time soil telemetry reading for a location."""
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail=f"Location '{location_id}' not found.")

    reading_data = payload.model_dump()
    if not reading_data.get("timestamp"):
        reading_data["timestamp"] = datetime.now(timezone.utc)
    if not reading_data.get("sensor_id"):
        reading_data["sensor_id"] = loc.sensor_id

    reading = SensorReading(
        location_id=location_id,
        **reading_data
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)
    return reading

@router.post("/readings/batch", response_model=List[SensorReadingResponse], status_code=status.HTTP_201_CREATED)
def batch_ingest_readings(
    location_id: str,
    batch: SensorReadingBatchCreate,
    db: Session = Depends(get_db)
):
    """Bulk ingest multiple sensor telemetry records."""
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail=f"Location '{location_id}' not found.")

    inserted = []
    for r in batch.readings:
        r_data = r.model_dump()
        if not r_data.get("timestamp"):
            r_data["timestamp"] = datetime.now(timezone.utc)
        if not r_data.get("sensor_id"):
            r_data["sensor_id"] = loc.sensor_id

        db_reading = SensorReading(
            location_id=location_id,
            **r_data
        )
        db.add(db_reading)
        inserted.append(db_reading)

    db.commit()
    for item in inserted:
        db.refresh(item)
    return inserted
