from sqlalchemy import Column, Integer, String, Float
from backend.app.database import Base

class CropStageTarget(Base):
    __tablename__ = "crop_stage_targets"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    plant_type = Column(String(100), nullable=False, index=True) # e.g. "tomato", "paddy"
    category = Column(String(50), nullable=False, index=True)   # "vegetable", "cereal", etc.
    growth_stage = Column(Integer, nullable=False)              # 0, 1, 2
    stage_name = Column(String(50), nullable=False)             # "seedling", "vegetative", "fruiting"
    kc = Column(Float, default=1.0)                             # Crop coefficient
    n_target_mg_kg = Column(Float, nullable=False)              # Target Nitrogen
    p_target_mg_kg = Column(Float, nullable=False)              # Target Phosphorus
    k_target_mg_kg = Column(Float, nullable=False)              # Target Potassium
    ece_threshold_ds_m = Column(Float, nullable=False)          # Max Salinity tolerance
    irrigation_trigger_pct = Column(Float, nullable=False)      # Soil moisture trigger %
    ph_min = Column(Float, default=6.0)                         # Min optimal pH
    ph_max = Column(Float, default=7.5)                         # Max optimal pH
    temp_min_c = Column(Float, default=15.0)                    # Min optimal temperature
    temp_max_c = Column(Float, default=30.0)                    # Max optimal temperature
    primary_reference_link = Column(String(500), nullable=True) # Citation link
