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
@router.post("/ttn", status_code=status.HTTP_201_CREATED)
async def lora_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Handle HTTP integration webhooks from ChirpStack or The Things Network (TTN).
    """
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    # Detect TTN v3 format vs ChirpStack v4 format
    dev_eui = ""
    device_name = ""
    obj = {}
    time_str = None

    if "end_device_ids" in payload:
        # The Things Network (TTN v3) payload structure
        end_devices = payload.get("end_device_ids", {})
        dev_eui = end_devices.get("dev_eui", "").lower()
        device_name = end_devices.get("device_id", "")
        uplink = payload.get("uplink_message", {})
        obj = uplink.get("decoded_payload") or {}
        time_str = uplink.get("received_at") or payload.get("received_at")
    elif "deviceInfo" in payload:
        # ChirpStack v4 payload structure
        device_info = payload.get("deviceInfo", {})
        dev_eui = device_info.get("devEui", "").lower()
        device_name = device_info.get("deviceName", "")
        obj = payload.get("object") or {}
        time_str = payload.get("time")
    else:
        # Ping, test, or non-uplink payload
        return {"status": "ok", "message": "Ignored non-uplink or unrecognized event"}

    # Look up location by deviceName / devEui
    location_id = None
    sensor_id = None

    if dev_eui in ["a8404145c1893321", "a8-40-41-45-c1-89-33-21"] or device_name in ["RS485-LN-node-1", "rs485-ln-node-1"]:
        location_id = "LOC_001"
        sensor_id = "SN_001"
    else:
        # Fallback: check if the location with sensor_id = dev_eui exists
        loc = db.query(Location).filter(Location.sensor_id == dev_eui).first()
        if loc:
            location_id = loc.id
            sensor_id = dev_eui

    if not location_id:
        logger.warning(f"Device {dev_eui} ({device_name}) not mapped to any location")
        return {"status": "ok", "message": f"Device {dev_eui} not mapped"}

    if not obj:
        return {"status": "ok", "message": "No decoded object data"}

    # Parse time
    timestamp = None
    if time_str:
        try:
            timestamp = parse_date(time_str)
        except Exception:
            pass

    if not timestamp:
        timestamp = datetime.now(timezone.utc)

    def get_val(keys, default=0.0):
        for k in keys:
            if k in obj and obj[k] is not None:
                try:
                    return float(obj[k])
                except (ValueError, TypeError):
                    pass
        return default

    # Build the reading data (handles various codec casing)
    reading_data = {
        "timestamp": timestamp,
        "sensor_id": sensor_id,
        "moisture_pct": get_val(["Moisture", "moisture", "soil_moisture"]),
        "temperature_c": get_val(["Temperature", "temperature", "temp"]),
        "ph": get_val(["pH", "ph", "soil_ph"], default=7.0),
        "ec_ds_m": get_val(["Conductivity", "conductivity", "ec"]),
        "nitrogen_mg_kg": get_val(["Nitrogen", "nitrogen", "n"]),
        "phosphorus_mg_kg": get_val(["Phosphorus", "phosphorus", "p"]),
        "potassium_mg_kg": get_val(["Potassium", "potassium", "k"]),
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
