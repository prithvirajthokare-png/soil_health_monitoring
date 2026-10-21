from typing import Optional, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from backend.app.models.reading import SensorReading
from backend.app.models.location import Location

# How many recent readings to use for trend analysis
TREND_WINDOW = 20
# Irrigation trigger threshold (VWC %)
MOISTURE_TRIGGER_PCT = 20.0


def _linear_regression_slope(xs: List[float], ys: List[float]) -> float:
    """
    Computes the slope (dy/dx) of a simple linear regression line.
    Returns 0 if fewer than 2 points are available.
    """
    n = len(xs)
    if n < 2:
        return 0.0
    mean_x = sum(xs) / n
    mean_y = sum(ys) / n
    numerator = sum((xs[i] - mean_x) * (ys[i] - mean_y) for i in range(n))
    denominator = sum((xs[i] - mean_x) ** 2 for i in range(n))
    if denominator == 0:
        return 0.0
    return numerator / denominator


def predict_irrigation(db: Session, location: Location) -> dict:
    """
    Predicts when irrigation will be required based on moisture trend analysis.

    Returns a dict with:
      - has_trend (bool): whether enough readings exist for a prediction
      - slope_pct_per_hour (float): rate of moisture change per hour (negative = drying)
      - current_moisture_pct (float | None): latest moisture reading
      - predicted_hours_to_trigger (float | None): hours until irrigation threshold
      - confidence (str): 'high' | 'medium' | 'low'
      - urgency (str): 'critical' | 'warning' | 'normal' | 'unknown'
      - message (str): human-readable forecast message
    """
    readings = (
        db.query(SensorReading)
        .filter(SensorReading.location_id == location.id)
        .order_by(SensorReading.timestamp.desc())
        .limit(TREND_WINDOW)
        .all()
    )

    if not readings:
        return _no_data_prediction()

    latest = readings[0]
    current_moisture = latest.moisture_pct

    # Already needs irrigation?
    if current_moisture <= MOISTURE_TRIGGER_PCT:
        return {
            "has_trend": True,
            "slope_pct_per_hour": 0.0,
            "current_moisture_pct": current_moisture,
            "predicted_hours_to_trigger": 0.0,
            "confidence": "high",
            "urgency": "critical",
            "message": (
                f"Irrigation required now. Soil moisture ({current_moisture:.1f}%) "
                f"is at or below the trigger threshold ({MOISTURE_TRIGGER_PCT}%)."
            )
        }

    if len(readings) < 3:
        return {
            "has_trend": False,
            "slope_pct_per_hour": None,
            "current_moisture_pct": current_moisture,
            "predicted_hours_to_trigger": None,
            "confidence": "low",
            "urgency": "unknown",
            "message": (
                f"Insufficient historical data for irrigation prediction "
                f"(need at least 3 readings, have {len(readings)}). "
                f"Current moisture: {current_moisture:.1f}%."
            )
        }

    # Build time-series: x = hours since oldest reading, y = moisture_pct
    # Reverse so oldest = index 0
    ordered = list(reversed(readings))
    t0 = ordered[0].timestamp
    if t0.tzinfo is None:
        t0 = t0.replace(tzinfo=timezone.utc)

    xs = []
    ys = []
    for r in ordered:
        ts = r.timestamp
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        delta_hours = (ts - t0).total_seconds() / 3600.0
        xs.append(delta_hours)
        ys.append(r.moisture_pct)

    slope = _linear_regression_slope(xs, ys)  # %/hour

    # Compute time-since-latest to extrapolate from latest reading
    t_latest = ordered[-1].timestamp
    if t_latest.tzinfo is None:
        t_latest = t_latest.replace(tzinfo=timezone.utc)
    hours_since_latest = (datetime.now(timezone.utc) - t_latest).total_seconds() / 3600.0

    # Extrapolate current moisture using slope
    projected_now = current_moisture + slope * hours_since_latest

    if slope >= 0:
        # Moisture is stable or increasing — no irrigation needed soon
        return {
            "has_trend": True,
            "slope_pct_per_hour": round(slope, 4),
            "current_moisture_pct": current_moisture,
            "predicted_hours_to_trigger": None,
            "confidence": _confidence(len(readings)),
            "urgency": "normal",
            "message": (
                f"Soil moisture ({current_moisture:.1f}%) is stable or increasing "
                f"(+{slope:.3f}%/hr trend). No irrigation required in the forecast window."
            )
        }

    # Slope is negative — soil drying
    # Time to reach trigger from current projected moisture
    if projected_now <= MOISTURE_TRIGGER_PCT:
        hours_to_trigger = 0.0
    else:
        hours_to_trigger = (projected_now - MOISTURE_TRIGGER_PCT) / abs(slope)

    urgency = _urgency(hours_to_trigger)
    confidence = _confidence(len(readings))

    return {
        "has_trend": True,
        "slope_pct_per_hour": round(slope, 4),
        "current_moisture_pct": current_moisture,
        "predicted_hours_to_trigger": round(hours_to_trigger, 1),
        "confidence": confidence,
        "urgency": urgency,
        "message": _forecast_message(current_moisture, hours_to_trigger, slope, urgency)
    }


def _no_data_prediction() -> dict:
    return {
        "has_trend": False,
        "slope_pct_per_hour": None,
        "current_moisture_pct": None,
        "predicted_hours_to_trigger": None,
        "confidence": "low",
        "urgency": "unknown",
        "message": "No sensor readings available for this location. Connect IoT nodes to enable irrigation forecasting."
    }


def _confidence(n_readings: int) -> str:
    if n_readings >= 10:
        return "high"
    if n_readings >= 5:
        return "medium"
    return "low"


def _urgency(hours: float) -> str:
    if hours <= 6:
        return "critical"
    if hours <= 24:
        return "warning"
    return "normal"


def _forecast_message(current: float, hours: float, slope: float, urgency: str) -> str:
    rate_str = f"{abs(slope):.3f}%/hr"
    if urgency == "critical":
        return (
            f"⚠️ Critical: Irrigation required within ~{hours:.0f} hours. "
            f"Moisture ({current:.1f}%) drying at {rate_str}. Trigger threshold: {MOISTURE_TRIGGER_PCT}%."
        )
    if urgency == "warning":
        return (
            f"Irrigation forecast in ~{hours:.0f} hours. "
            f"Moisture ({current:.1f}%) declining at {rate_str}. Schedule irrigation within 24 hours."
        )
    return (
        f"Irrigation not required for ~{hours:.0f} hours. "
        f"Moisture ({current:.1f}%) declining gradually at {rate_str}."
    )
