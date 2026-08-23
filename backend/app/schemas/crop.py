from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

class CropStageTargetBase(BaseModel):
    plant_type: str = Field(..., description="Crop identifier, e.g. tomato, paddy")
    category: str = Field(..., description="Crop category, e.g. vegetable, cereal, plantation")
    growth_stage: int = Field(..., ge=0, le=2, description="Stage index (0=seedling, 1=vegetative, 2=fruiting/mature)")
    stage_name: str = Field(..., description="Stage descriptor name")
    kc: float = Field(default=1.0, description="Crop coefficient Kc")
    n_target_mg_kg: float = Field(..., description="Target Nitrogen concentration in mg/kg")
    p_target_mg_kg: float = Field(..., description="Target Phosphorus concentration in mg/kg")
    k_target_mg_kg: float = Field(..., description="Target Potassium concentration in mg/kg")
    ece_threshold_ds_m: float = Field(..., description="Salinity threshold ECe in dS/m")
    irrigation_trigger_pct: float = Field(..., description="Soil moisture trigger threshold %")
    ph_min: float = Field(default=5.5, description="Minimum optimal pH")
    ph_max: float = Field(default=7.5, description="Maximum optimal pH")
    temp_min_c: float = Field(default=18.0, description="Minimum optimal soil temperature (°C)")
    temp_max_c: float = Field(default=27.0, description="Maximum optimal soil temperature (°C)")
    primary_reference_link: Optional[str] = None

class CropStageTargetResponse(CropStageTargetBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

class CropProfileResponse(BaseModel):
    plant_type: str
    category: str
    stages: List[CropStageTargetResponse]
    primary_reference_link: Optional[str] = None
