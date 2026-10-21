"""
AI Soil Health Report Generator
================================
Generates a comprehensive, narrative soil health report from evaluation data and
recent reading history. The report engine is rule-based but designed to be upgraded
to a Gemini/LLM backend by setting the GEMINI_API_KEY environment variable.
"""

import os
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.orm import Session

from backend.app.models.location import Location
from backend.app.models.reading import SensorReading
from backend.app.services.evaluator import evaluate_soil_health
from backend.app.services.predictor import predict_irrigation

# ---------------------------------------------------------------------------
# Thresholds (mirrors evaluator.py)
# ---------------------------------------------------------------------------
MOISTURE_TRIGGER_PCT = 20.0
MOISTURE_MAX_PCT = 45.0
PH_MIN, PH_MAX = 6.0, 7.5
EC_MAX_DS_M = 2.0
TEMP_MIN_C, TEMP_MAX_C = 15.0, 32.0
NITROGEN_TARGET = 40.0
PHOSPHORUS_TARGET = 20.0
POTASSIUM_TARGET = 100.0


def generate_report(db: Session, location: Location) -> dict:
    """
    Generates a structured AI soil health report for a given location.
    Returns a dict with sections: meta, executive_summary, metrics, irrigation_forecast,
    nutrient_analysis, recommendations, action_plan, generated_at.
    """
    # 1. Fetch latest reading and run evaluation
    latest_reading = (
        db.query(SensorReading)
        .filter(SensorReading.location_id == location.id)
        .order_by(SensorReading.timestamp.desc())
        .first()
    )

    evaluation = evaluate_soil_health(db, location, latest_reading)
    prediction = predict_irrigation(db, location)

    # 2. Fetch recent readings for trend context (last 24)
    recent_readings = (
        db.query(SensorReading)
        .filter(SensorReading.location_id == location.id)
        .order_by(SensorReading.timestamp.desc())
        .limit(24)
        .all()
    )

    # 3. Check if Gemini API key is configured for future upgrade
    gemini_key = os.getenv("GEMINI_API_KEY")
    engine = "gemini" if gemini_key else "rule-based"

    # 4. Build each report section
    meta = _build_meta(location, evaluation, engine)
    executive_summary = _build_executive_summary(location, evaluation, prediction, latest_reading)
    metrics = _build_metrics_section(evaluation, latest_reading)
    irrigation_forecast = _build_irrigation_section(prediction, latest_reading)
    nutrient_analysis = _build_nutrient_section(latest_reading)
    recommendations = _build_recommendations(evaluation, prediction)
    action_plan = _build_action_plan(evaluation, prediction, latest_reading)

    return {
        "meta": meta,
        "executive_summary": executive_summary,
        "metrics": metrics,
        "irrigation_forecast": irrigation_forecast,
        "nutrient_analysis": nutrient_analysis,
        "recommendations": recommendations,
        "action_plan": action_plan,
        "engine": engine,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }


# ---------------------------------------------------------------------------
# Section builders
# ---------------------------------------------------------------------------

def _build_meta(location, evaluation, engine: str) -> dict:
    return {
        "location_id": location.id,
        "location_name": location.name,
        "farmer": getattr(location, "farmer_name", None),
        "current_crop": location.current_crop,
        "soil_type": getattr(location, "soil_type", "Unknown"),
        "coverage_area": getattr(location, "coverage_area", None),
        "health_score": evaluation.health_score,
        "health_status": evaluation.health_status,
        "report_engine": engine,
        "report_version": "2.0"
    }


def _build_executive_summary(location, evaluation, prediction, reading) -> dict:
    score = evaluation.health_score
    status = evaluation.health_status
    crop = location.current_crop or "general crop"

    # Overall health narrative
    if score >= 80:
        health_narrative = (
            f"{location.name} is in excellent agronomic condition with a Soil Health Index of {score}/100. "
            f"The {crop} crop is growing in a well-balanced soil environment. "
            f"All major soil parameters are within optimal ranges, supporting productive growth."
        )
    elif score >= 60:
        health_narrative = (
            f"{location.name} shows good soil health with a score of {score}/100. "
            f"Minor deviations from optimal targets have been detected in one or more parameters. "
            f"Timely corrective actions will prevent further decline and maintain {crop} crop productivity."
        )
    elif score >= 40:
        health_narrative = (
            f"{location.name} requires attention with a Soil Health Index of {score}/100 ({status}). "
            f"Multiple soil parameters are outside optimal ranges for {crop} production. "
            f"Immediate agronomic intervention is recommended to prevent yield loss."
        )
    else:
        health_narrative = (
            f"⚠️ {location.name} is in a critical condition with a Soil Health Index of {score}/100. "
            f"Soil conditions are significantly outside safe thresholds for {crop} cultivation. "
            f"Urgent agronomic intervention is required to prevent crop failure."
        )

    # Irrigation urgency
    urgency = prediction.get("urgency", "unknown")
    if urgency == "critical":
        irr_note = "Irrigation is required immediately or within the next 6 hours."
    elif urgency == "warning":
        irr_note = f"Irrigation should be scheduled within the next {prediction.get('predicted_hours_to_trigger', 24):.0f} hours."
    elif urgency == "normal":
        hrs = prediction.get("predicted_hours_to_trigger")
        irr_note = f"Irrigation is not required for at least {hrs:.0f} hours." if hrs else "Soil moisture levels are stable."
    else:
        irr_note = "Insufficient data to forecast irrigation timing."

    return {
        "headline": f"Soil Health Report: {location.name}",
        "status_badge": status,
        "score": score,
        "health_narrative": health_narrative,
        "irrigation_note": irr_note,
        "critical_issues": [
            e.message for e in evaluation.evaluations
            if e.status in ("critical", "deficient", "warning")
        ],
        "positive_findings": [
            e.message for e in evaluation.evaluations
            if e.status == "optimal"
        ]
    }


def _build_metrics_section(evaluation, reading) -> List[dict]:
    if not reading:
        return []

    sections = []
    for e in evaluation.evaluations:
        status_text = {
            "optimal": "✅ Optimal",
            "warning": "⚠️ Warning",
            "critical": "🔴 Critical",
            "deficient": "🔻 Deficient",
            "excess": "⬆️ Excess"
        }.get(e.status, e.status.title())

        interpretation = _interpret_metric(e.metric, e.current_value, e.status)

        sections.append({
            "metric": e.metric,
            "value": e.current_value,
            "unit": e.unit,
            "status": e.status,
            "status_label": status_text,
            "target": e.target_value,
            "min_bound": e.min_bound,
            "max_bound": e.max_bound,
            "reading_message": e.message,
            "interpretation": interpretation
        })

    return sections


def _interpret_metric(metric: str, value: float, status: str) -> str:
    """Returns an agronomic interpretation sentence for a given metric."""
    if "Moisture" in metric:
        if status == "optimal":
            return "Volumetric water content is ideal for root uptake and gas exchange in the rhizosphere."
        if status in ("critical", "warning"):
            return (
                f"Water deficit stress is likely occurring. At {value:.1f}% VWC, "
                f"root water potential decreases, reducing nutrient uptake efficiency and stomatal conductance."
            )
    if "pH" in metric:
        if status == "optimal":
            return "Soil pH is in the optimal range for nutrient availability and microbial activity."
        if value < PH_MIN:
            return (
                f"Acidic conditions (pH {value}) reduce phosphorus and molybdenum availability "
                f"and may cause aluminum and manganese toxicity at very low levels."
            )
        return (
            f"Alkaline conditions (pH {value}) reduce availability of iron, manganese, zinc, "
            f"copper, and boron, which are critical micronutrients."
        )
    if "Salinity" in metric or "EC" in metric:
        if status == "optimal":
            return "Electrical conductivity is within safe limits, minimizing osmotic stress."
        return (
            f"Elevated EC ({value} dS/m) creates osmotic potential gradient that restricts root water uptake, "
            f"leading to physiological drought even in moist conditions."
        )
    if "Nitrogen" in metric:
        if status == "deficient":
            return "Nitrogen deficiency causes chlorosis (yellowing) in older leaves and reduced vegetative growth."
        if status == "excess":
            return "Excess nitrogen promotes excessive vegetative growth at the expense of fruiting and increases nitrate leaching risk."
        return "Nitrogen levels support adequate vegetative development and protein synthesis."
    if "Phosphorus" in metric:
        if status == "deficient":
            return "Phosphorus deficiency impairs root development, flowering, and energy transfer (ATP synthesis)."
        if status == "excess":
            return "Excess phosphorus can lock out zinc and iron micronutrients."
        return "Phosphorus is adequate for root growth, flowering, and seed development."
    if "Potassium" in metric:
        if status == "deficient":
            return "Potassium deficiency reduces disease resistance, water use efficiency, and fruit quality."
        if status == "excess":
            return "Excess potassium may inhibit uptake of calcium and magnesium (antagonism)."
        return "Potassium levels support strong cell walls, water regulation, and disease resistance."
    if "Temp" in metric:
        if status == "optimal":
            return "Soil temperature is favorable for microbial activity and root growth."
        if value < TEMP_MIN_C:
            return f"Cool soil ({value}°C) slows microbial decomposition and nutrient mineralization."
        return f"Warm soil ({value}°C) increases evapotranspiration demand and may stress roots."
    return ""


def _build_irrigation_section(prediction, reading) -> dict:
    return {
        "current_moisture": reading.moisture_pct if reading else None,
        "trigger_threshold": MOISTURE_TRIGGER_PCT,
        "slope_pct_per_hour": prediction.get("slope_pct_per_hour"),
        "predicted_hours_to_trigger": prediction.get("predicted_hours_to_trigger"),
        "urgency": prediction.get("urgency", "unknown"),
        "confidence": prediction.get("confidence", "low"),
        "has_trend": prediction.get("has_trend", False),
        "forecast_message": prediction.get("message", ""),
        "methodology": (
            "Irrigation forecast uses linear regression on the last 20 moisture readings "
            "to compute a drying rate (% VWC per hour), then extrapolates to the irrigation "
            f"trigger threshold ({MOISTURE_TRIGGER_PCT}% VWC)."
        )
    }


def _build_nutrient_section(reading) -> dict:
    if not reading:
        return {"available": False, "message": "No sensor reading available."}

    def status_for(val, target, low_frac=0.75, high_frac=1.35):
        if val < target * low_frac:
            return "deficient"
        if val > target * high_frac:
            return "excess"
        return "optimal"

    n_status = status_for(reading.nitrogen_mg_kg, NITROGEN_TARGET)
    p_status = status_for(reading.phosphorus_mg_kg, PHOSPHORUS_TARGET)
    k_status = status_for(reading.potassium_mg_kg, POTASSIUM_TARGET)

    def npk_note(name, val, target, status):
        pct = ((val - target) / target) * 100
        direction = "above" if pct > 0 else "below"
        return f"{name}: {val} mg/kg ({abs(pct):.0f}% {direction} target of {target} mg/kg) — {status}"

    return {
        "available": True,
        "nitrogen": {
            "value": reading.nitrogen_mg_kg,
            "target": NITROGEN_TARGET,
            "status": n_status,
            "note": npk_note("Nitrogen (N)", reading.nitrogen_mg_kg, NITROGEN_TARGET, n_status)
        },
        "phosphorus": {
            "value": reading.phosphorus_mg_kg,
            "target": PHOSPHORUS_TARGET,
            "status": p_status,
            "note": npk_note("Phosphorus (P)", reading.phosphorus_mg_kg, PHOSPHORUS_TARGET, p_status)
        },
        "potassium": {
            "value": reading.potassium_mg_kg,
            "target": POTASSIUM_TARGET,
            "status": k_status,
            "note": npk_note("Potassium (K)", reading.potassium_mg_kg, POTASSIUM_TARGET, k_status)
        },
        "npk_ratio": f"{reading.nitrogen_mg_kg:.0f}:{reading.phosphorus_mg_kg:.0f}:{reading.potassium_mg_kg:.0f}",
        "balance_summary": _npk_balance_summary(n_status, p_status, k_status)
    }


def _npk_balance_summary(n, p, k) -> str:
    statuses = [n, p, k]
    deficient = statuses.count("deficient")
    excess = statuses.count("excess")
    if deficient == 0 and excess == 0:
        return "All three macronutrients (N, P, K) are well balanced within target ranges."
    parts = []
    if deficient > 0:
        names = []
        if n == "deficient": names.append("Nitrogen")
        if p == "deficient": names.append("Phosphorus")
        if k == "deficient": names.append("Potassium")
        parts.append(f"{', '.join(names)} {'is' if len(names)==1 else 'are'} deficient")
    if excess > 0:
        names = []
        if n == "excess": names.append("Nitrogen")
        if p == "excess": names.append("Phosphorus")
        if k == "excess": names.append("Potassium")
        parts.append(f"{', '.join(names)} {'is' if len(names)==1 else 'are'} in excess")
    return ". ".join(parts) + ". Fertilizer adjustments are recommended."


def _build_recommendations(evaluation, prediction) -> List[dict]:
    """Returns structured, prioritized recommendations."""
    recs = []
    priority = 1

    # Irrigation always comes first if critical
    if prediction.get("urgency") == "critical":
        recs.append({
            "priority": priority,
            "category": "Irrigation",
            "action": prediction["message"],
            "urgency": "immediate"
        })
        priority += 1

    # Pull from evaluator recommendations
    for rec_text in evaluation.recommendations:
        urgency_level = "immediate" if any(w in rec_text.lower() for w in ["trigger", "flush", "critical"]) else "scheduled"
        category = _categorize_rec(rec_text)
        recs.append({
            "priority": priority,
            "category": category,
            "action": rec_text,
            "urgency": urgency_level
        })
        priority += 1

    # Warning-level irrigation
    if prediction.get("urgency") == "warning" and priority == 1:
        hrs = prediction.get("predicted_hours_to_trigger", 24)
        recs.append({
            "priority": priority,
            "category": "Irrigation",
            "action": f"Schedule irrigation within the next {hrs:.0f} hours to prevent moisture deficit.",
            "urgency": "scheduled"
        })

    if not recs:
        recs.append({
            "priority": 1,
            "category": "Maintenance",
            "action": "All parameters are within optimal ranges. Continue current agronomic practices and maintain monitoring schedule.",
            "urgency": "routine"
        })

    return recs


def _categorize_rec(text: str) -> str:
    t = text.lower()
    if "irrigat" in t or "water" in t or "moisture" in t:
        return "Irrigation"
    if "lime" in t or "sulfur" in t or "ph" in t or "acid" in t or "alkalin" in t:
        return "Soil Amendment (pH)"
    if "fertiliz" in t or "nitrogen" in t or "phosphorus" in t or "potassium" in t or "npk" in t:
        return "Fertilization"
    if "salt" in t or "ec" in t or "salinity" in t or "leach" in t:
        return "Salinity Management"
    return "General Agronomy"


def _build_action_plan(evaluation, prediction, reading) -> List[dict]:
    """Returns a sequenced 7-day action plan."""
    plan = []
    urgency = prediction.get("urgency", "unknown")

    # Day 0 actions
    day0_actions = []
    if urgency == "critical":
        day0_actions.append("Initiate irrigation immediately. Target: bring VWC above trigger threshold.")
    if evaluation.salinity_stress:
        day0_actions.append("Begin soil flushing with fresh water to reduce salinity (EC) levels.")
    if evaluation.health_score < 40:
        day0_actions.append("Conduct an urgent field inspection to verify sensor readings match observed crop condition.")

    if day0_actions:
        plan.append({"timeframe": "Today (Immediate)", "actions": day0_actions})

    # Days 1-3 actions
    d3_actions = []
    if urgency == "warning":
        hrs = prediction.get("predicted_hours_to_trigger", 24)
        d3_actions.append(f"Schedule and execute irrigation within {hrs:.0f} hours to stay ahead of moisture deficit.")
    for rec in evaluation.recommendations:
        if any(w in rec.lower() for w in ["lime", "sulfur", "fertiliz", "supplement"]):
            d3_actions.append(rec)
    if d3_actions:
        plan.append({"timeframe": "Next 1–3 Days", "actions": list(dict.fromkeys(d3_actions))})

    # Weekly plan
    plan.append({
        "timeframe": "Ongoing (Weekly)",
        "actions": [
            "Review soil health evaluation daily via TerraPulse dashboard.",
            "Monitor irrigation prediction trends and adjust scheduling accordingly.",
            "Calibrate sensor nodes if battery drops below 20%.",
            f"Target soil health index above 80 for {evaluation.current_crop} crop."
        ]
    })

    return plan
