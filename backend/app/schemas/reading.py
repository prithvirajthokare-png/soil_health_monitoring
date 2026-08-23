from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

class SensorReadingBase(BaseModel):
    moisture_pct: float = Field(..., ge=0.0, le=100.0, description="Volumetric Water Content %")
    temperature_c: float = Field(..., ge=-20.0, le=70.0, description="Soil Core Temperature in °C")
    ph: float = Field(..., ge=0.0, le=14.0, description="Soil pH value")
    ec_ds_m: float = Field(..., ge=0.0, description="Electrical Conductivity in dS/m")
    nitrogen_mg_kg: float = Field(..., ge=0.0, description="Nitrogen (N) in mg/kg")
    phosphorus_mg_kg: float = Field(..., ge=0.0, description="Phosphorus (P) in mg/kg")
    potassium_mg_kg: float = Field(..., ge=0.0, description="Potassium (K) in mg/kg")
    battery_pct: Optional[float] = Field(default=100.0, ge=0.0, le=100.0, description="Battery level %")
    sensor_id: Optional[str] = Field(default=None, description="Hardware sensor node identifier")

class SensorReadingCreate(SensorReadingBase):
    timestamp: Optional[datetime] = Field(default=None, description="UTC Timestamp (defaults to current time)")
    raw_payload: Optional[str] = None

class SensorReadingResponse(SensorReadingBase):
    id: int
    location_id: str
    timestamp: datetime
    raw_payload: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class SensorReadingBatchCreate(BaseModel):
    readings: List[SensorReadingCreate]
