import csv
import os
import math
from datetime import datetime, timedelta, timezone
from pathlib import Path
from sqlalchemy.orm import Session
import openpyxl

from backend.app.config import (
    CROP_LIBRARY_CSV, 
    CROP_STAGE_TARGETS_CSV, 
    LOCATION_WORKBOOK_XLSX
)
from backend.app.models.location import Location
from backend.app.models.crop import CropStageTarget
from backend.app.models.reading import SensorReading

def seed_crop_library(db: Session) -> int:
    """Ingests crop library CSV files into the SQLite database."""
    count = 0
    csv_file = None
    
    # Try primary full library, then fallback
    if CROP_LIBRARY_CSV.exists():
        csv_file = CROP_LIBRARY_CSV
    elif CROP_STAGE_TARGETS_CSV.exists():
        csv_file = CROP_STAGE_TARGETS_CSV
    else:
        # Search sibling/parent dirs
        for p in [Path("c:/WO477/final_crop_library_v1.csv"), Path("c:/WO477/crop_stage_targets.csv")]:
            if p.exists():
                csv_file = p
                break

    if not csv_file or not csv_file.exists():
        print("[Seeder] No crop library CSV found.")
        return 0

    print(f"[Seeder] Ingesting crop library from: {csv_file}")
    
    with open(csv_file, mode="r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            plant_type = row.get("plant_type", "").strip().lower()
            if not plant_type:
                continue

            growth_stage = int(row.get("growth_stage", 0))
            category = row.get("category", "general").strip().lower()
            stage_name = row.get("stage_name", "vegetative").strip()

            # Check existing
            existing = db.query(CropStageTarget).filter(
                CropStageTarget.plant_type == plant_type,
                CropStageTarget.growth_stage == growth_stage
            ).first()

            target_data = {
                "plant_type": plant_type,
                "category": category,
                "growth_stage": growth_stage,
                "stage_name": stage_name,
                "kc": float(row.get("kc") or 1.0),
                "n_target_mg_kg": float(row.get("N_target_mg_kg") or 40.0),
                "p_target_mg_kg": float(row.get("P_target_mg_kg") or 20.0),
                "k_target_mg_kg": float(row.get("K_target_mg_kg") or 100.0),
                "ece_threshold_ds_m": float(row.get("ece_threshold_dS_m") or 2.0),
                "irrigation_trigger_pct": float(row.get("irrigation_trigger_pct") or 20.0),
                "ph_min": float(row.get("pH_min") or 5.5),
                "ph_max": float(row.get("pH_max") or 7.5),
                "temp_min_c": float(row.get("temp_min_c") or 15.0),
                "temp_max_c": float(row.get("temp_max_c") or 30.0),
                "primary_reference_link": row.get("Primary_Reference_Link") or None
            }

            if existing:
                for k, v in target_data.items():
                    setattr(existing, k, v)
            else:
                db.add(CropStageTarget(**target_data))
            
            count += 1

    db.commit()
    print(f"[Seeder] Successfully seeded/updated {count} crop stage targets.")
    return count

def seed_locations_and_telemetry(db: Session):
    """Ingests initial locations from workbook and creates baseline readings."""
    # 1. Ensure LOC_001 exists (Idea Factory)
    loc = db.query(Location).filter(Location.id == "LOC_001").first()
    
    loc_id = "LOC_001"
    loc_name = "Idea Factory"
    lat = 13.0094631
    lng = 74.7952437
    crop = "tomato"
    stage = 1
    sensor_id = "SN_001"

    if LOCATION_WORKBOOK_XLSX.exists():
        try:
            wb = openpyxl.load_workbook(LOCATION_WORKBOOK_XLSX)
            if "Locations" in wb.sheetnames:
                ws = wb["Locations"]
                r2_id = ws.cell(row=2, column=1).value
                r2_name = ws.cell(row=2, column=2).value
                r2_lat = ws.cell(row=2, column=3).value
                r2_lng = ws.cell(row=2, column=4).value
                r2_crop = ws.cell(row=2, column=5).value
                r2_stage = ws.cell(row=2, column=6).value
                r2_sensor = ws.cell(row=2, column=7).value

                if r2_id:
                    loc_id = str(r2_id).strip()
                if r2_name:
                    loc_name = str(r2_name).strip()
                if r2_lat:
                    lat = float(r2_lat)
                if r2_lng:
                    lng = float(r2_lng)
                if r2_crop:
                    crop = str(r2_crop).strip().lower()
                if r2_stage is not None:
                    stage = int(r2_stage)
                if r2_sensor:
                    sensor_id = str(r2_sensor).strip()
        except Exception as e:
            print(f"[Seeder] Note: Reading excel workbook encountered: {e}, using defaults.")

    if not loc:
        loc = Location(
            id=loc_id,
            name=loc_name,
            latitude=lat,
            longitude=lng,
            current_crop=crop,
            growth_stage=stage,
            sensor_id=sensor_id,
            soil_type="Loamy Silt",
            coverage_area="48.5 Hectares",
            status="active"
        )
        db.add(loc)
        db.commit()
        db.refresh(loc)
        print(f"[Seeder] Seeded location {loc_id} ({loc_name})")

    # 2. Ensure LOC_002 exists (Test Location)
    loc2 = db.query(Location).filter(Location.id == "LOC_002").first()
    if not loc2:
        loc2 = Location(
            id="LOC_002",
            name="Test Location",
            latitude=20.1929232,
            longitude=76.5352501,
            current_crop="Unknown / To be provided",
            growth_stage=1,
            sensor_id="SN_002",
            soil_type="Unknown / To be provided",
            coverage_area="Unknown / To be provided",
            status="active"
        )
        db.add(loc2)
        db.commit()
        db.refresh(loc2)
        print("[Seeder] Seeded test location LOC_002 (Test Location)")

    # 3. Check if readings exist for LOC_001
    existing_readings_count = db.query(SensorReading).filter(SensorReading.location_id == loc_id).count()
    if existing_readings_count == 0:
        print(f"[Seeder] Generating 24-hour historical baseline telemetry for {loc_id}...")
        now = datetime.now(timezone.utc)
        
        # Target metrics for tomato stage 1 (vegetative): N~53.8, P~28, K~103, pH~6.5, EC~1.2, Moisture~27%
        for i in range(48, -1, -1):
            t = now - timedelta(minutes=i * 30)
            diurnal_wave = math.sin(i * 0.2)
            moisture = round(27.4 + diurnal_wave * 1.5 - (i * 0.02), 2)
            temp = round(21.5 + diurnal_wave * 2.8, 2)
            ph_val = round(6.7 + (math.cos(i * 0.1) * 0.08), 2)
            ec_val = round(1.18 + (diurnal_wave * 0.04), 2)
            n_val = round(52.5 + diurnal_wave * 1.8, 1)
            p_val = round(27.5 + diurnal_wave * 0.9, 1)
            k_val = round(104.0 + diurnal_wave * 2.5, 1)

            reading = SensorReading(
                location_id=loc_id,
                sensor_id=sensor_id,
                timestamp=t,
                moisture_pct=max(15.0, min(moisture, 45.0)),
                temperature_c=temp,
                ph=ph_val,
                ec_ds_m=ec_val,
                nitrogen_mg_kg=n_val,
                phosphorus_mg_kg=p_val,
                potassium_mg_kg=k_val,
                battery_pct=round(98.5 - (i * 0.05), 1),
                raw_payload=None
            )
            db.add(reading)

        db.commit()
        print(f"[Seeder] Seeded 49 historical telemetry records for {loc_id}.")

def run_seed(db: Session):
    """Runs the complete auto-seeding pipeline."""
    seed_crop_library(db)
    seed_locations_and_telemetry(db)
