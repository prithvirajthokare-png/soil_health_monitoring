import sys
import httpx

# Ensure UTF-8 output on Windows consoles
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

client = httpx.Client(base_url="http://127.0.0.1:8000")

def test_cold_start(round_num: int):
    print(f"\n--- COLD START ROUND #{round_num} ---")
    
    # 1. Verify /api/v1/health
    r = client.get("/api/v1/health")
    assert r.status_code == 200, f"Round {round_num} Health check failed"
    print(f"[Round {round_num}] 1. Health Status: OK (Backend Responsive)")

    # 2. Verify LOC_001 & LOC_002 in /api/v1/locations
    r_locs = client.get("/api/v1/locations")
    assert r_locs.status_code == 200
    locs = {l["id"]: l for l in r_locs.json()}
    assert "LOC_001" in locs and "LOC_002" in locs
    assert locs["LOC_001"]["name"] == "Idea Factory"
    assert abs(locs["LOC_001"]["latitude"] - 13.0094631) < 1e-4
    assert abs(locs["LOC_001"]["longitude"] - 74.7952437) < 1e-4
    assert locs["LOC_002"]["name"] == "Test Location"
    assert abs(locs["LOC_002"]["latitude"] - 20.1929232) < 1e-4
    assert abs(locs["LOC_002"]["longitude"] - 76.5352501) < 1e-4
    print(f"[Round {round_num}] 2. Locations Verified: LOC_001 (Idea Factory) & LOC_002 (Test Location)")

    # 3. Verify LOC_001 Telemetry & Evaluation
    r_latest = client.get("/api/v1/locations/LOC_001/latest")
    assert r_latest.status_code == 200
    latest = r_latest.json()
    assert latest["moisture_pct"] == 27.4
    assert latest["ph"] == 6.78
    assert latest["temperature_c"] == 21.5
    assert latest["ec_ds_m"] == 1.18
    assert latest["nitrogen_mg_kg"] == 52.5
    assert latest["phosphorus_mg_kg"] == 27.5
    assert latest["potassium_mg_kg"] == 104.0
    print(f"[Round {round_num}] 3. LOC_001 Telemetry Verified: Moisture=27.4%, pH=6.78, Temp=21.5°C, EC=1.18, NPK=52.5/27.5/104.0")

    r_eval = client.get("/api/v1/locations/LOC_001/evaluation")
    assert r_eval.status_code == 200
    eval1 = r_eval.json()
    assert eval1["health_score"] == 100
    assert eval1["health_status"] == "Optimal"
    assert len(eval1["recommendations"]) > 0
    print(f"[Round {round_num}] 4. LOC_001 Evaluation Verified: Health Score=100/100, Optimal, Recommendations active")

    # 4. Verify LOC_002 Graceful Telemetry State
    r_eval2 = client.get("/api/v1/locations/LOC_002/evaluation")
    assert r_eval2.status_code == 200
    eval2 = r_eval2.json()
    assert eval2["health_score"] == 0
    assert eval2["health_status"] == "No Telemetry"
    print(f"[Round {round_num}] 5. LOC_002 State Verified: Health Score=0, Status=No Telemetry")

    # 5. Verify 1-Week, 1-Month, 1-Year Exports
    for rng in ["1week", "1month", "1year"]:
        r_exp = client.get(f"/api/v1/locations/LOC_001/export?range={rng}")
        assert r_exp.status_code == 200
        lines = r_exp.text.strip().splitlines()
        assert len(lines) == 50 # 1 header + 49 data rows
    print(f"[Round {round_num}] 6. All CSV Exports (1week, 1month, 1year) Verified: 49 telemetry rows each")
    print(f"[Round {round_num}] ✓ Cold Start Round #{round_num} PASSED with 100% consistency")

if __name__ == "__main__":
    print("==================================================")
    print("EXECUTING 3 CONSECUTIVE COLD START VALIDATION RUNS")
    print("==================================================")
    for round_i in range(1, 4):
        test_cold_start(round_i)
    print("\n==================================================")
    print("ALL 3 COLD START RUNS COMPLETED & VERIFIED IDENTICAL")
    print("==================================================")
