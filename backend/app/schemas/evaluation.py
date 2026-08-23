from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from backend.app.schemas.reading import SensorReadingResponse
from backend.app.schemas.crop import CropStageTargetResponse

class MetricEvaluation(BaseModel):
    metric: str
    current_value: float
    target_value: Optional[float] = None
    min_bound: Optional[float] = None
    max_bound: Optional[float] = None
    unit: str
    status: str # "optimal", "deficient", "excess", "warning", "critical"
    message: str

class SoilHealthEvaluation(BaseModel):
    location_id: str
    location_name: str
    current_crop: str
    growth_stage: int
    stage_name: str
    health_score: int = Field(..., ge=0, le=100, description="Composite Soil Health Index (0-100)")
    health_status: str = Field(..., description="Optimal, Good, Needs Attention, Critical")
    irrigation_required: bool
    salinity_stress: bool
    latest_reading: Optional[SensorReadingResponse] = None
    stage_targets: Optional[CropStageTargetResponse] = None
    evaluations: List[MetricEvaluation] = []
    recommendations: List[str] = []
