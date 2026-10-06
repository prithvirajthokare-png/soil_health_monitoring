import sys
import httpx
import csv
import io

# Ensure UTF-8 output on Windows consoles
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

client = httpx.Client(base_url="http://127.0.0.1:8000")

def run_suite():
    print("==================================================")
    print("STARTING COMPLETE BACKEND & EXPORT STRESS TEST")
    print("==================================================")

    # 1. Test Health & Locations
    r_locs = client.get("/api/v1/locations")
    assert r_locs.status_code == 200, f"Expected 200, got {r_locs.status_code}"
    locs = r_locs.json()
    assert len(locs) >= 2, f"Expected at least 2 locations, got {len(locs)}"
    loc_ids = [l["id"] for l in locs]
    assert "LOC_001" in loc_ids and "LOC_002" in loc_ids, f"Locations missing: {loc_ids}"
    print("✓ Locations Check Passed: LOC_001 and LOC_002 present")

    # 2. Test LOC_001 latest reading & evaluation
    r_latest = client.get("/api/v1/locations/LOC_001/latest")
    assert r_latest.status_code == 200, f"Expected 200, got {r_latest.status_code}"
    latest = r_latest.json()
    assert latest["moisture_pct"] is not None and latest["ph"] is not None
    print(f"✓ LOC_001 Latest Telemetry: Moisture={latest['moisture_pct']}%, pH={latest['ph']}, Temp={latest['temperature_c']}°C")

    r_eval = client.get("/api/v1/locations/LOC_001/evaluation")
    assert r_eval.status_code == 200
    eval_data = r_eval.json()
    assert eval_data["health_score"] == 100
    print(f"✓ LOC_001 Health Score: {eval_data['health_score']}/100 ({eval_data['health_status']})")

    # 3. Test LOC_002 (Test Location)
    r_eval2 = client.get("/api/v1/locations/LOC_002/evaluation")
    assert r_eval2.status_code == 200
    eval2 = r_eval2.json()
    assert eval2["health_score"] == 0
    print("✓ LOC_002 Handled cleanly: Score=0, Status=No Telemetry")

    # 4. Test Export Ranges (1week, 1month, 1year)
    for rng in ["1week", "1month", "1year"]:
        r_exp = client.get(f"/api/v1/locations/LOC_001/export?range={rng}")
        assert r_exp.status_code == 200, f"Export {rng} failed with {r_exp.status_code}"
        assert "text/csv" in r_exp.headers.get("content-type", "")
        lines = r_exp.text.strip().splitlines()
        reader = csv.reader(io.StringIO(r_exp.text))
        rows = list(reader)
        assert len(rows) > 1, f"Expected data rows for {rng}, got {len(rows)}"
        assert rows[0][0] == "Timestamp (UTC)", f"Invalid header: {rows[0]}"
        print(f"✓ LOC_001 Export ({rng}): {len(rows)-1} rows exported successfully")

    # 5. Stress Test: 10 Rapid Sequential Export Requests
    print("Running 10 rapid export requests to test worker stability...")
    for i in range(10):
        rng = ["1week", "1month", "1year"][i % 3]
        r = client.get(f"/api/v1/locations/LOC_001/export?range={rng}")
        assert r.status_code == 200, f"Request {i+1} failed with {r.status_code}"
    print("✓ 10/10 Rapid Export Requests Succeeded without server interruption")

    # 6. Test Error Handling (Invalid range & Nonexistent location)
    r_bad_range = client.get("/api/v1/locations/LOC_001/export?range=invalid_range")
    assert r_bad_range.status_code == 200, "Invalid range should fallback to default safely"
    print("✓ Invalid Range fallback handled safely")

    r_404 = client.get("/api/v1/locations/NON_EXISTENT_999/export?range=1week")
    assert r_404.status_code == 404, f"Expected 404, got {r_404.status_code}"
    print("✓ Non-existent location returned controlled 404 HTTP error")

    # 7. Final Health Check after Stress Test
    r_health = client.get("/api/v1/health")
    assert r_health.status_code == 200
    print("✓ Backend Health Check after Stress Test: OK (Process Alive & Stable)")
    print("==================================================")
    print("ALL TESTS PASSED SUCCESSFULLY")
    print("==================================================")

if __name__ == "__main__":
    run_suite()
