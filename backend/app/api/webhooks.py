from typing import Dict, Any
from datetime import datetime, timezone
from dateutil.parser import parse as parse_date
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
import logging
import json

from backend.app.database import get_db
from backend.app.models.location import Location
from backend.app.models.reading import SensorReading
from backend.app.schemas.reading import SensorReadingCreate

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])
logger = logging.getLogger("uvicorn.error")

@router.post("/chirpstack", status_code=status.HTTP_201_CREATED)
async def chirpstack_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Handle HTTP integration webhooks from ChirpStack.
    """
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    # ChirpStack sends event type in query param `event=up` or we can check the payload structure.
    # An uplink event has `deviceInfo` and `object` (the decoded payload).
    device_info = payload.get("deviceInfo")
    if not device_info:
        # If it's not an uplink or has no device info, just return 200 to acknowledge
        return {"status": "ok", "message": "Ignored non-uplink or empty event"}

    dev_eui = device_info.get("devEui", "")
    device_name = device_info.get("deviceName", "")

    # Look up location by deviceName / devEui
    location_id = None
    sensor_id = None

    if dev_eui == "a8404145c1893321" or device_name == "RS485-LN-node-1":
        location_id = "LOC_001"
        sensor_id = "SN_001"
    else:
        # Fallback: check if the location with sensor_id = dev_eui exists
        loc = db.query(Location).filter(Location.sensor_id == dev_eui).first()
        if loc:
            location_id = loc.id
            sensor_id = dev_eui

    if not location_id:
        # Just log and return 200 so ChirpStack doesn't retry indefinitely
        logger.warning(f"Device {dev_eui} ({device_name}) not mapped to any location")
        return {"status": "ok", "message": "Device not mapped"}

    obj = payload.get("object")
    if not obj:
        return {"status": "ok", "message": "No decoded object data"}

    # Parse time
    time_str = payload.get("time")
    timestamp = None
    if time_str:
        try:
            timestamp = parse_date(time_str)
        except Exception:
            pass

    if not timestamp:
        timestamp = datetime.now(timezone.utc)

    def safe_float(val, default=0.0):
        return float(val) if val is not None else default

    # Build the reading data
    reading_data = {
        "timestamp": timestamp,
        "sensor_id": sensor_id,
        "moisture_pct": safe_float(obj.get("Moisture")),
        "temperature_c": safe_float(obj.get("Temperature")),
        "ph": safe_float(obj.get("pH")),
        "ec_ds_m": safe_float(obj.get("Conductivity")),
        "nitrogen_mg_kg": safe_float(obj.get("Nitrogen")),
        "phosphorus_mg_kg": safe_float(obj.get("Phosphorus")),
        "potassium_mg_kg": safe_float(obj.get("Potassium")),
        "raw_payload": json.dumps(payload)
    }

    # Validate with schema
    try:
        # battery_pct is omitted so the schema default (100.0) is used
        reading_schema = SensorReadingCreate(**reading_data)
    except Exception as e:
        logger.error(f"Failed to validate ChirpStack payload: {e}")
        raise HTTPException(status_code=400, detail=f"Validation error: {e}")

    # Save to database
    db_reading = SensorReading(
        location_id=location_id,
        **reading_schema.model_dump()
    )
    db.add(db_reading)
    db.commit()
    db.refresh(db_reading)

    return {"status": "success", "id": db_reading.id}
