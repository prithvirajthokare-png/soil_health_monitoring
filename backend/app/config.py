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
WORKING_DOCS_CROP_CSV = PARENT_ROOT / "WorkingDocuments" / "Final_Crop_Library.csv"
LOCATION_WORKBOOK_XLSX = PARENT_ROOT / "location_sensor_workbook_2.xlsx"

# Authentication & Security
AUTH_SECRET_KEY = os.getenv("AUTH_SECRET_KEY", "terrapulse-soil-health-secret-key-2026-precision-ag")
AUTH_TOKEN_EXPIRE_HOURS = int(os.getenv("AUTH_TOKEN_EXPIRE_HOURS", "72"))
AUTH_ALGORITHM = "HS256"

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
