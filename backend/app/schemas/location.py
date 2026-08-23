from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class LocationBase(BaseModel):
    name: str = Field(..., description="Location name, e.g. Idea Factory")
    latitude: float = Field(..., description="Latitude coordinate")
    longitude: float = Field(..., description="Longitude coordinate")
    current_crop: str = Field(default="tomato", description="Assigned crop type")
    growth_stage: int = Field(default=1, ge=0, le=2, description="0=seedling, 1=vegetative, 2=fruiting/mature")
    sensor_id: Optional[str] = Field(default="SN_001", description="Assigned hardware sensor ID")
    soil_type: Optional[str] = Field(default="Loamy Silt", description="Soil classification")
    coverage_area: Optional[str] = Field(default="48.5 Hectares", description="Coverage parcel acreage/hectares")
    status: Optional[str] = Field(default="active", description="Operational status: active/inactive")

class LocationCreate(LocationBase):
    id: str = Field(..., description="Unique location identifier, e.g. LOC_001")

class LocationUpdate(BaseModel):
    name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    current_crop: Optional[str] = None
    growth_stage: Optional[int] = Field(None, ge=0, le=2)
    sensor_id: Optional[str] = None
    soil_type: Optional[str] = None
    coverage_area: Optional[str] = None
    status: Optional[str] = None

class LocationResponse(LocationBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class LocationSummary(LocationResponse):
    latest_reading: Optional[Dict[str, Any]] = None
    health_score: Optional[int] = None
