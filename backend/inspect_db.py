import sys
import sqlite3
from pathlib import Path

# Ensure UTF-8 output on Windows consoles
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

db_path = Path("backend/data/soil_health.db")

print("=== 1. DATABASE FILE STATUS ===")
print(f"Path: {db_path.resolve()}")
print(f"Exists: {db_path.exists()}")
if db_path.exists():
    print(f"Size: {db_path.stat().st_size} bytes")

conn = sqlite3.connect(str(db_path))
cursor = conn.cursor()

print("\n=== 2. TABLES IN DATABASE ===")
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print([t[0] for t in tables])

print("\n=== 3. SENSOR_READINGS TABLE SCHEMA ===")
cursor.execute("PRAGMA table_info(sensor_readings);")
cols = cursor.fetchall()
for c in cols:
    print(f"  {c[1]} ({c[2]}) - notnull={c[3]} pk={c[5]}")

print("\n=== 4. TELEMETRY STORAGE BY LOCATION ===")
cursor.execute("SELECT location_id, COUNT(*), MIN(timestamp), MAX(timestamp) FROM sensor_readings GROUP BY location_id;")
rows = cursor.fetchall()
if rows:
    for r in rows:
        print(f"  Location: {r[0]} | Records: {r[1]} | Earliest: {r[2]} | Latest: {r[3]}")
else:
    print("  No records found in sensor_readings.")

print("\n=== 5. SAMPLE HISTORICAL READINGS (LOC_001) ===")
cursor.execute("SELECT id, location_id, sensor_id, timestamp, moisture_pct, temperature_c, ph, ec_ds_m, nitrogen_mg_kg, phosphorus_mg_kg, potassium_mg_kg, battery_pct FROM sensor_readings ORDER BY timestamp ASC LIMIT 5;")
for r in cursor.fetchall():
    print("  Earliest:", r)

cursor.execute("SELECT id, location_id, sensor_id, timestamp, moisture_pct, temperature_c, ph, ec_ds_m, nitrogen_mg_kg, phosphorus_mg_kg, potassium_mg_kg, battery_pct FROM sensor_readings ORDER BY timestamp DESC LIMIT 5;")
for r in cursor.fetchall():
    print("  Latest:  ", r)

conn.close()
