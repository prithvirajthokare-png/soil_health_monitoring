from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.database import Base

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    location_id = Column(String(50), ForeignKey("locations.id", ondelete="CASCADE"), nullable=False, index=True)
    sensor_id = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    
    # Soil Telemetry Metrics
    moisture_pct = Column(Float, nullable=False)       # Volumetric Water Content (%)
    temperature_c = Column(Float, nullable=False)      # Soil Core Temp (°C)
    ph = Column(Float, nullable=False)                 # Soil pH
    ec_ds_m = Column(Float, nullable=False)            # Electrical Conductivity (dS/m)
    nitrogen_mg_kg = Column(Float, nullable=False)     # Nitrogen (N in mg/kg)
    phosphorus_mg_kg = Column(Float, nullable=False)   # Phosphorus (P in mg/kg)
    potassium_mg_kg = Column(Float, nullable=False)    # Potassium (K in mg/kg)
    
    # Operational & Hardware Telemetry
    battery_pct = Column(Float, default=100.0)         # Battery charge %
    raw_payload = Column(Text, nullable=True)          # Optional raw JSON string

    # Relationship to Location
    location = relationship("Location", back_populates="readings")
