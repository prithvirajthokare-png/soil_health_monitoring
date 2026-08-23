from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Location(Base):
    __tablename__ = "locations"

    id = Column(String(50), primary_key=True, index=True) # e.g. "LOC_001"
    name = Column(String(150), nullable=False)           # e.g. "Idea Factory" / "Field Alpha"
    latitude = Column(Float, nullable=False)             # 13.0094631
    longitude = Column(Float, nullable=False)            # 74.7952437
    current_crop = Column(String(100), default="tomato") # e.g. "tomato"
    growth_stage = Column(Integer, default=1)            # 0=seedling, 1=vegetative, 2=fruiting
    sensor_id = Column(String(50), default="SN_001")     # e.g. "SN_001"
    soil_type = Column(String(100), default="Loamy Silt")
    coverage_area = Column(String(100), default="48.5 Hectares")
    status = Column(String(50), default="active")        # "active", "inactive"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationship to sensor readings
    readings = relationship("SensorReading", back_populates="location", cascade="all, delete-orphan", order_by="desc(SensorReading.timestamp)")
