import sys
import httpx
import json

# Ensure UTF-8 output on Windows consoles
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

client = httpx.Client(base_url="http://127.0.0.1:8000")

print("=== 1. ALL LOCATIONS (/api/v1/locations) ===")
r = client.get("/api/v1/locations")
print(f"Status: {r.status_code}")
for loc in r.json():
    print(f"  ID: {loc['id']} | Name: {loc['name']} | Lat: {loc['latitude']} | Lng: {loc['longitude']}")

print("\n=== 2. LOC_001 EVALUATION & RECOMMENDATIONS ===")
r_eval1 = client.get("/api/v1/locations/LOC_001/evaluation")
print(f"Status: {r_eval1.status_code}")
eval1 = r_eval1.json()
print(f"Health Score: {eval1.get('health_score')}")
print(f"Recommendations: {eval1.get('recommendations')}")

print("\n=== 3. LOC_002 TEST LOCATION EVALUATION ===")
r_eval2 = client.get("/api/v1/locations/LOC_002/evaluation")
print(f"Status: {r_eval2.status_code}")
eval2 = r_eval2.json()
print(f"Health Score: {eval2.get('health_score')}")
print(f"Recommendations: {eval2.get('recommendations')}")

print("\n=== 4. CSV DOWNLOAD EXPORTS (LOC_001) ===")
for rng in ["1week", "1month", "1year"]:
    r_exp = client.get(f"/api/v1/locations/LOC_001/export?range={rng}")
    lines = r_exp.text.strip().splitlines()
    print(f"Range {rng}: Status={r_exp.status_code} | Header={r_exp.headers.get('content-disposition')} | Data Rows={len(lines) - 1}")
    if len(lines) > 1:
        print(f"  First: {lines[1]}")
        print(f"  Last:  {lines[-1]}")

print("\n=== 5. CSV DOWNLOAD EXPORTS (LOC_002) ===")
for rng in ["1week", "1month", "1year"]:
    r_exp2 = client.get(f"/api/v1/locations/LOC_002/export?range={rng}")
    lines2 = r_exp2.text.strip().splitlines()
    print(f"Range {rng}: Status={r_exp2.status_code} | Header={r_exp2.headers.get('content-disposition')} | Data Rows={len(lines2) - 1}")
