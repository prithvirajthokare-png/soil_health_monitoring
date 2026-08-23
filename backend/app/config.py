import os
from pathlib import Path

# Base paths
BACKEND_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BACKEND_DIR.parent
PARENT_ROOT = PROJECT_ROOT.parent

# Database configuration
DATA_DIR = BACKEND_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
SQLITE_DB_PATH = DATA_DIR / "soil_health.db"
DATABASE_URL = f"sqlite:///{SQLITE_DB_PATH.as_posix()}"

# External Seed Data Paths
CROP_LIBRARY_CSV = PARENT_ROOT / "final_crop_library_v1.csv"
CROP_STAGE_TARGETS_CSV = PARENT_ROOT / "crop_stage_targets.csv"
LOCATION_WORKBOOK_XLSX = PARENT_ROOT / "location_sensor_workbook_2.xlsx"

# CORS configuration
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*"
]

# API Metadata
API_TITLE = "TerraPulse Soil Health Monitoring API"
API_VERSION = "v1.0.0"
API_DESCRIPTION = "Local precision agriculture & soil telemetry backend powered by FastAPI & SQLite"
