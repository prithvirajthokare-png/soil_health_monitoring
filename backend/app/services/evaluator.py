from typing import Optional, List
from sqlalchemy.orm import Session

from backend.app.models.location import Location
from backend.app.models.reading import SensorReading
from backend.app.schemas.evaluation import SoilHealthEvaluation, MetricEvaluation
from backend.app.schemas.reading import SensorReadingResponse

# Generic, crop-agnostic soil health thresholds.
MOISTURE_TRIGGER_PCT = 20.0
MOISTURE_MAX_PCT = 45.0
PH_MIN = 6.0
PH_MAX = 7.5
EC_MAX_DS_M = 2.0
TEMP_MIN_C = 15.0
TEMP_MAX_C = 32.0
NITROGEN_TARGET_MG_KG = 40.0
PHOSPHORUS_TARGET_MG_KG = 20.0
POTASSIUM_TARGET_MG_KG = 100.0

def evaluate_soil_health(db: Session, location: Location, reading: Optional[SensorReading]) -> SoilHealthEvaluation:
    """
    Evaluates a real-time sensor reading against fixed, generic soil health thresholds.
    Computes a normalized composite Soil Health Index (0-100) and generated recommendations.
    """
    growth_stage = location.growth_stage if location.growth_stage is not None else 1
    stage_name = "General"
    evaluations: List[MetricEvaluation] = []
    recommendations: List[str] = []

    score = 100
    irrigation_required = False
    salinity_stress = False

    if not reading:
        return SoilHealthEvaluation(
            location_id=location.id,
            location_name=location.name,
            current_crop=location.current_crop,
            growth_stage=growth_stage,
            stage_name=stage_name,
            health_score=0,
            health_status="No Telemetry",
            irrigation_required=False,
            salinity_stress=False,
            latest_reading=None,
            stage_targets=None,
            evaluations=[],
            recommendations=["Connect IoT sensor nodes to begin receiving telemetry."]
        )

    # 1. Evaluate Moisture (VWC %)
    trig = MOISTURE_TRIGGER_PCT
    if reading.moisture_pct < trig:
        irrigation_required = True
        deficit = trig - reading.moisture_pct
        penalty = min(25, int(deficit * 3))
        score -= penalty
        evaluations.append(MetricEvaluation(
            metric="Moisture (VWC)",
            current_value=reading.moisture_pct,
            target_value=trig + 8.0,
            min_bound=trig,
            max_bound=MOISTURE_MAX_PCT,
            unit="%",
            status="critical" if reading.moisture_pct < (trig - 5.0) else "warning",
            message=f"Soil moisture ({reading.moisture_pct}%) is below irrigation trigger threshold ({trig}%)."
        ))
        recommendations.append(f"Trigger irrigation cycle: moisture deficit of {deficit:.1f}% detected.")
    else:
        evaluations.append(MetricEvaluation(
            metric="Moisture (VWC)",
            current_value=reading.moisture_pct,
            target_value=trig + 8.0,
            min_bound=trig,
            max_bound=MOISTURE_MAX_PCT,
            unit="%",
            status="optimal",
            message=f"Soil moisture ({reading.moisture_pct}%) is optimal (trigger: {trig}%)."
        ))

    # 2. Evaluate pH
    ph_min = PH_MIN
    ph_max = PH_MAX
    if reading.ph < ph_min:
        score -= 15
        evaluations.append(MetricEvaluation(
            metric="Soil pH",
            current_value=reading.ph,
            target_value=round((ph_min + ph_max) / 2, 2),
            min_bound=ph_min,
            max_bound=ph_max,
            unit="pH",
            status="warning",
            message=f"Soil pH ({reading.ph}) is below optimal range ({ph_min} - {ph_max})."
        ))
        recommendations.append(f"Apply agricultural lime / calcium carbonate to buffer acidic pH (target {ph_min}-{ph_max}).")
    elif reading.ph > ph_max:
        score -= 15
        evaluations.append(MetricEvaluation(
            metric="Soil pH",
            current_value=reading.ph,
            target_value=round((ph_min + ph_max) / 2, 2),
            min_bound=ph_min,
            max_bound=ph_max,
            unit="pH",
            status="warning",
            message=f"Soil pH ({reading.ph}) is above optimal range ({ph_min} - {ph_max})."
        ))
        recommendations.append(f"Apply elemental sulfur or acidifying organic compost to lower alkaline pH.")
    else:
        evaluations.append(MetricEvaluation(
            metric="Soil pH",
            current_value=reading.ph,
            target_value=round((ph_min + ph_max) / 2, 2),
            min_bound=ph_min,
            max_bound=ph_max,
            unit="pH",
            status="optimal",
            message=f"Soil pH ({reading.ph}) is in nominal range ({ph_min} - {ph_max})."
        ))

    # 3. Evaluate Electrical Conductivity / Salinity
    ece_max = EC_MAX_DS_M
    if reading.ec_ds_m > ece_max:
        salinity_stress = True
        score -= 20
        evaluations.append(MetricEvaluation(
            metric="Salinity (EC)",
            current_value=reading.ec_ds_m,
            target_value=round(ece_max * 0.6, 2),
            min_bound=0.2,
            max_bound=ece_max,
            unit="dS/m",
            status="warning",
            message=f"Electrical conductivity ({reading.ec_ds_m} dS/m) exceeds salinity tolerance ({ece_max} dS/m)."
        ))
        recommendations.append(f"Leach soil with fresh water to flush soluble salts and mitigate osmotic stress.")
    else:
        evaluations.append(MetricEvaluation(
            metric="Salinity (EC)",
            current_value=reading.ec_ds_m,
            target_value=round(ece_max * 0.6, 2),
            min_bound=0.2,
            max_bound=ece_max,
            unit="dS/m",
            status="optimal",
            message=f"Salinity ({reading.ec_ds_m} dS/m) is safe below threshold ({ece_max} dS/m)."
        ))

    # 4. Evaluate NPK Macronutrients
    def check_nutrient(name, val, target_val, weight=8):
        nonlocal score
        diff_pct = (val - target_val) / target_val
        if diff_pct < -0.25:
            score -= weight
            evaluations.append(MetricEvaluation(
                metric=name,
                current_value=val,
                target_value=target_val,
                unit="mg/kg",
                status="deficient",
                message=f"{name} ({val} mg/kg) is deficient relative to target ({target_val} mg/kg)."
            ))
            recommendations.append(f"Supplement {name} fertilizer to meet target {target_val} mg/kg.")
        elif diff_pct > 0.35:
            score -= int(weight * 0.5)
            evaluations.append(MetricEvaluation(
                metric=name,
                current_value=val,
                target_value=target_val,
                unit="mg/kg",
                status="excess",
                message=f"{name} ({val} mg/kg) is above target level ({target_val} mg/kg)."
            ))
        else:
            evaluations.append(MetricEvaluation(
                metric=name,
                current_value=val,
                target_value=target_val,
                unit="mg/kg",
                status="optimal",
                message=f"{name} ({val} mg/kg) is well balanced for target ({target_val} mg/kg)."
            ))

    check_nutrient("Nitrogen (N)", reading.nitrogen_mg_kg, NITROGEN_TARGET_MG_KG, 10)
    check_nutrient("Phosphorus (P)", reading.phosphorus_mg_kg, PHOSPHORUS_TARGET_MG_KG, 8)
    check_nutrient("Potassium (K)", reading.potassium_mg_kg, POTASSIUM_TARGET_MG_KG, 8)

    # 5. Evaluate Temperature
    t_min = TEMP_MIN_C
    t_max = TEMP_MAX_C
    if reading.temperature_c < t_min:
        score -= 5
        evaluations.append(MetricEvaluation(
            metric="Core Temp",
            current_value=reading.temperature_c,
            min_bound=t_min,
            max_bound=t_max,
            unit="°C",
            status="warning",
            message=f"Soil temp ({reading.temperature_c}°C) is cool (min {t_min}°C)."
        ))
    elif reading.temperature_c > t_max:
        score -= 5
        evaluations.append(MetricEvaluation(
            metric="Core Temp",
            current_value=reading.temperature_c,
            min_bound=t_min,
            max_bound=t_max,
            unit="°C",
            status="warning",
            message=f"Soil temp ({reading.temperature_c}°C) is warm (max {t_max}°C)."
        ))
    else:
        evaluations.append(MetricEvaluation(
            metric="Core Temp",
            current_value=reading.temperature_c,
            min_bound=t_min,
            max_bound=t_max,
            unit="°C",
            status="optimal",
            message=f"Soil temp ({reading.temperature_c}°C) is nominal ({t_min}°C - {t_max}°C)."
        ))

    # Clamp health score between 0 and 100
    final_score = max(0, min(100, score))

    if final_score >= 80:
        health_status = "Optimal"
    elif final_score >= 60:
        health_status = "Good"
    elif final_score >= 40:
        health_status = "Needs Attention"
    else:
        health_status = "Critical"

    if not recommendations:
        recommendations.append(f"All soil health metrics for {location.name} are within optimal generic targets.")

    return SoilHealthEvaluation(
        location_id=location.id,
        location_name=location.name,
        current_crop=location.current_crop,
        growth_stage=growth_stage,
        stage_name=stage_name,
        health_score=final_score,
        health_status=health_status,
        irrigation_required=irrigation_required,
        salinity_stress=salinity_stress,
        latest_reading=SensorReadingResponse.model_validate(reading),
        stage_targets=None,
        evaluations=evaluations,
        recommendations=recommendations
    )
