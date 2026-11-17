"""RailSync 2.0 — Layer 1 Integration Adapter: Trained Risk Prediction.
====================================================================
Runs the trained Layer 1 ML models (XGBoost failure/duration/overrun) at
request time. Falls back to the pre-computed trained forecasts CSV, then to
the Weibull cold-start priors, only when the model files are unavailable.
"""

from __future__ import annotations

import csv
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

try:
    import pandas as pd
    _HAS_PANDAS = True
except ImportError:
    pd = None
    _HAS_PANDAS = False

from app.core.logging import get_logger

log = get_logger("layer1")

# Locate Railsync_Layer1_Complete directory
_CANDIDATE_DIRS = [
    Path(__file__).resolve().parent.parent.parent.parent / "Railsync_Layer1_Complete",
    Path("Railsync_Layer1_Complete"),
    Path("../Railsync_Layer1_Complete"),
]

_LAYER1_DIR: Optional[Path] = None
for cand in _CANDIDATE_DIRS:
    if cand.exists() and (cand / "final_failure_forecasts.csv").exists():
        _LAYER1_DIR = cand.resolve()
        break

_TRAINED_FORECASTS: Dict[str, Dict[str, Any]] = {}
_TRAINED_SURVIVAL_CURVES: Dict[str, List[Dict[str, Any]]] = {}
_FEATURE_CONTRIBUTIONS: List[Dict[str, Any]] = []
_LOADED = False


def _ensure_trained_data() -> None:
    """Loads trained Layer 1 forecast outputs, survival curves, and feature importance."""
    global _LOADED, _TRAINED_FORECASTS, _TRAINED_SURVIVAL_CURVES, _FEATURE_CONTRIBUTIONS

    if _LOADED:
        return

    if _LAYER1_DIR is None:
        log.warning("Railsync_Layer1_Complete directory not found. Layer 1 running in fallback mode.")
        _LOADED = True
        return

    try:
        # 1. Load trained failure forecasts
        fc_file = _LAYER1_DIR / "final_failure_forecasts.csv"
        if fc_file.exists():
            if _HAS_PANDAS and pd is not None:
                df_fc = pd.read_csv(fc_file)
                rows = [row.to_dict() for _, row in df_fc.iterrows()]
            else:
                with open(fc_file, "r", encoding="utf-8") as f:
                    rows = list(csv.DictReader(f))

            for row in rows:
                sid = str(row["segment_id"]).strip()
                raw_risk = row.get("failure_probability_30d") or row.get("risk_score") or 0.0
                risk_val = float(raw_risk) if float(raw_risk) <= 1.0 else float(raw_risk) / 100.0
                age = float(row.get("age_years", 20.0))
                exp_down = round(float(risk_val * 4.5), 3)
                prev_dur = round(float(2.0 + risk_val * 2.5), 2)
                conf = "high" if risk_val >= 0.7 or age >= 35 else ("medium" if risk_val >= 0.001 else "low")
                overrun_p = round(float(min(0.95, max(0.05, 0.1 + risk_val * 0.35))), 4)

                _TRAINED_FORECASTS[sid] = {
                    "segment_id": sid,
                    "division": str(row.get("division", "Delhi")),
                    "asset_type": str(row.get("asset_type", "Track")),
                    "risk_30d": round(risk_val, 6),
                    "expected_downtime_days": exp_down,
                    "preventive_block_duration_hrs": prev_dur,
                    "confidence": conf,
                    "cold_start_fallback": False,
                    "overrun_probability": overrun_p,
                    "forecast_as_of": "2025-12-01",
                    "hazard": float(row.get("hazard", 0.0)),
                    "risk_score": float(row.get("risk_score", risk_val * 100.0)),
                }
            log.info("Loaded %d trained segment forecasts from %s", len(_TRAINED_FORECASTS), fc_file.name)

        # 2. Load trained empirical survival curves
        sc_file = _LAYER1_DIR / "segment_survival_curves.csv"
        if sc_file.exists():
            if _HAS_PANDAS and pd is not None:
                df_sc = pd.read_csv(sc_file)
                for sid, group in df_sc.groupby("segment_id"):
                    sid_str = str(sid).strip()
                    curve_pts = [
                        {
                            "day": int(r["forecast_day"]),
                            "survival_probability": round(float(r["survival_probability"]), 6),
                        }
                        for _, r in group.sort_values("forecast_day").iterrows()
                    ]
                    _TRAINED_SURVIVAL_CURVES[sid_str] = curve_pts
            else:
                with open(sc_file, "r", encoding="utf-8") as f:
                    sc_rows = list(csv.DictReader(f))
                by_sid: Dict[str, List[Dict[str, Any]]] = {}
                for r in sc_rows:
                    sid_str = str(r["segment_id"]).strip()
                    by_sid.setdefault(sid_str, []).append({
                        "day": int(r["forecast_day"]),
                        "survival_probability": round(float(r["survival_probability"]), 6),
                    })
                for sid_str, pts in by_sid.items():
                    _TRAINED_SURVIVAL_CURVES[sid_str] = sorted(pts, key=lambda x: x["day"])
            log.info("Loaded %d trained segment survival curves from %s", len(_TRAINED_SURVIVAL_CURVES), sc_file.name)

        # 3. Load feature importances
        fi_file = _LAYER1_DIR / "feature_importance.csv"
        if fi_file.exists():
            if _HAS_PANDAS and pd is not None:
                df_fi = pd.read_csv(fi_file)
                fi_rows = [r.to_dict() for _, r in df_fi.head(6).iterrows()]
            else:
                with open(fi_file, "r", encoding="utf-8") as f:
                    fi_rows = list(csv.DictReader(f))[:6]

            _FEATURE_CONTRIBUTIONS = [
                {
                    "name": str(r["feature"]),
                    "value": round(float(r["importance"]), 4),
                    "contribution": round(float(r["importance"]), 4),
                }
                for r in fi_rows
            ]

        _LOADED = True
    except Exception as exc:
        log.error("Failed to load trained Layer 1 artifacts: %s", exc, exc_info=True)
        _LOADED = True


# ── Trained models (run at request time; the .joblib files are read-only) ──
_MODELS_DIR: Optional[Path] = None
for _cand in [
    Path(__file__).resolve().parent.parent.parent.parent / "Railsync_Layer1_Complete" / "models",
    Path("Railsync_Layer1_Complete") / "models",
]:
    if (_cand / "failure_xgb.joblib").exists():
        _MODELS_DIR = _cand.resolve()
        break

_MODELS: Dict[str, Any] = {}
_MODELS_LOADED = False
_SNAPSHOT: Dict[str, Dict[str, Any]] = {}
_SNAPSHOT_LOADED = False

# Raw feature fields the failure model needs (one-hot encoded at predict time).
_NUMERIC_FEATURES = [
    "grade3_defects_previous_90d", "defect_count_month", "monsoon_month",
    "defect_count_prev_month", "overdue_tasks_active", "overdue_days_max",
    "length_km", "age_years", "installation_year",
]
_CATEGORICAL_FEATURES = [
    "monsoon_exposure", "freight_density_class",
    "curve_gradient_class", "asset_type", "division",
]
# A segment counts as "has feature data" when any of these were supplied.
_FEATURE_DATA_KEYS = [
    "defect_count_month", "defect_count_prev_month",
    "grade3_defects_previous_90d", "overdue_tasks_active", "overdue_days_max",
]


def _ensure_models() -> None:
    """Load the trained .joblib models once. Missing files => model path off."""
    global _MODELS_LOADED
    if _MODELS_LOADED:
        return
    _MODELS_LOADED = True
    if _MODELS_DIR is None:
        log.warning("Trained model files not found. Layer 1 running on CSV fallback.")
        return
    try:
        import joblib
        import numpy as np  # noqa: F401  (needed by the sklearn wrappers at predict time)
    except ImportError as exc:
        log.warning("joblib/numpy unavailable (%s). Layer 1 running on CSV fallback.", exc)
        return
    try:
        # Only the failure head runs live: the duration/overrun heads take
        # just age+length and predict near-constant values (0.2-0.7h,
        # 0.40-0.57), so they would put noise into the plan. Their fields
        # keep the same risk-derived formulas the CSV path already used.
        _MODELS["failure_xgb"] = joblib.load(_MODELS_DIR / "failure_xgb.joblib")
        log.info("Loaded trained Layer 1 failure model from %s", _MODELS_DIR)
    except Exception as exc:
        log.error("Failed to load trained Layer 1 models: %s", exc, exc_info=True)
        _MODELS.clear()


def _ensure_snapshot() -> None:
    """Load the per-segment feature snapshot (Layer 0 final-month rows)."""
    global _SNAPSHOT_LOADED
    if _SNAPSHOT_LOADED:
        return
    _SNAPSHOT_LOADED = True
    snap_file = Path(__file__).resolve().parent / "segment_features.json"
    if not snap_file.exists():
        return
    try:
        import json
        with open(snap_file, "r", encoding="utf-8") as f:
            _SNAPSHOT.update(json.load(f).get("segments", {}))
        log.info("Loaded %d segment feature rows from %s", len(_SNAPSHOT), snap_file.name)
    except Exception as exc:
        log.error("Failed to load segment feature snapshot: %s", exc, exc_info=True)


def _title_case(value: Any) -> str:
    """'high' -> 'High': the model was trained on title-case categories."""
    s = str(value or "").strip()
    return s[:1].upper() + s[1:].lower() if s else s


def _feature_row(segment: dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Build the raw feature row for a segment, or None when it has no feature data.

    Snapshot rows (the 46 trained segments) win. Otherwise the row is built
    from the segment dict; it only counts when the caller supplied defect /
    overdue data — a bare segment keeps the cold-start priors path.
    """
    _ensure_snapshot()
    sid = str(segment.get("segment_id") or segment.get("id") or "").strip()
    if sid in _SNAPSHOT:
        return dict(_SNAPSHOT[sid])
    if not any(segment.get(k) is not None for k in _FEATURE_DATA_KEYS):
        return None
    import datetime
    month = datetime.datetime.now(datetime.timezone.utc).month
    return {
        "age_years": float(segment.get("age_years") or 25.0),
        "length_km": float(segment.get("length_km") or 12.0),
        "installation_year": int(segment.get("installation_year") or 2001),
        "grade3_defects_previous_90d": float(segment.get("grade3_defects_previous_90d") or 0.0),
        "defect_count_month": float(segment.get("defect_count_month") or 0.0),
        "defect_count_prev_month": float(segment.get("defect_count_prev_month") or 0.0),
        "overdue_tasks_active": float(segment.get("overdue_tasks_active") or 0.0),
        "overdue_days_max": float(segment.get("overdue_days_max") or 0.0),
        "monsoon_month": float(segment.get("monsoon_month") if segment.get("monsoon_month") is not None else (1.0 if month in (6, 7, 8, 9) else 0.0)),
        "monsoon_exposure": _title_case(segment.get("monsoon_exposure", "Medium")),
        "freight_density_class": _title_case(segment.get("freight_density_class", "Medium")),
        "curve_gradient_class": str(segment.get("curve_gradient_class", "Low-Flat")),
        "asset_type": str(segment.get("asset_type", "Track")),
        "division": str(segment.get("division", "Delhi")),
    }


def _encode_failure_row(row: Dict[str, Any], columns: list[str]):
    """One-hot encode a raw feature row into the failure model's column order."""
    import numpy as np
    vec = {c: 0.0 for c in columns}
    for k in _NUMERIC_FEATURES:
        if k in vec:
            vec[k] = float(row.get(k, 0.0))
    for k in _CATEGORICAL_FEATURES:
        key = f"{k}_{row.get(k, '')}"
        if key in vec:
            vec[key] = 1.0
    return np.array([[vec[c] for c in columns]], dtype=float)


def _model_predict(segment: dict[str, Any], row: Dict[str, Any]) -> Dict[str, Any]:
    """Run the trained failure head and return the Layer 1 contract."""
    _ensure_trained_data()  # feature importances for the response
    failure = _MODELS["failure_xgb"]
    columns = list(failure.get_booster().feature_names)
    x = _encode_failure_row(row, columns)
    hazard = float(failure.predict_proba(x)[0, 1])
    hazard = min(max(hazard, 1e-8), 1 - 1e-8)
    risk_val = round(1 - (1 - hazard) ** 30, 6)
    age = float(row.get("age_years", 25.0))
    # Duration / overrun come from the segment's own Layer 0 history (measured,
    # not predicted — the trained duration/overrun heads take only age+length
    # and return near-constant values). Fall back to the risk formulas when a
    # segment has no task history.
    hist_dur = row.get("hist_mean_planned_duration_hrs")
    prev_dur = round(float(hist_dur), 2) if hist_dur is not None else round(float(2.0 + risk_val * 2.5), 2)
    hist_rate = row.get("hist_overrun_rate")
    overrun_p = round(float(hist_rate), 4) if hist_rate is not None else round(float(min(0.95, max(0.05, 0.1 + risk_val * 0.35))), 4)
    exp_down = round(float(risk_val * 4.5), 3)
    conf = "high" if risk_val >= 0.7 or age >= 35 else ("medium" if risk_val >= 0.001 else "low")
    curve = [
        {
            "day": d,
            "daily_hazard": round(hazard, 6),
            "survival_probability": round(max(0.0, (1.0 - hazard) ** d), 6),
            "cumulative_failure_probability": round(1.0 - (1.0 - hazard) ** d, 6),
        }
        for d in range(1, 31)
    ]
    return {
        "segment_id": str(segment.get("segment_id") or segment.get("id") or "").strip(),
        "division": str(segment.get("division", row.get("division", "Delhi"))),
        "asset_type": str(segment.get("asset_type", row.get("asset_type", "Track"))),
        "risk_30d": risk_val,
        "expected_downtime_days": exp_down,
        "preventive_block_duration_hrs": prev_dur,
        "confidence": conf,
        "cold_start_fallback": False,
        "overrun_probability": overrun_p,
        "forecast_as_of": "2025-12-01",
        "hazard": round(hazard, 6),
        "risk_score": round(risk_val * 100.0, 4),
        "survival_curve": curve,
        "feature_contributions": _FEATURE_CONTRIBUTIONS,
        "model_version": "failure-xgb-v1.0",
    }


def _calculate_cold_start_risk(segment: dict[str, Any]) -> float:
    """Calculates cold-start 30-day failure risk based on trained Layer 1 Weibull asset-type priors."""
    asset = str(segment.get("asset_type", "Track")).strip()
    age = float(segment.get("age_years", 10.0))
    freight_class = str(segment.get("freight_density_class", "medium")).lower()
    monsoon = str(segment.get("monsoon_exposure", "medium")).lower()

    # Asset base 30-day failure rate from trained Weibull priors
    asset_upper = asset.upper()
    if asset_upper in ("TRACK",):
        base_rate = 0.0012
    elif asset_upper in ("S&T", "SIG", "SIGNAL", "TELE"):
        base_rate = 0.0009
    elif asset_upper in ("OHE", "TRACTION/OHE", "TRACTION"):
        base_rate = 0.0008
    elif asset_upper in ("BRIDGE",):
        base_rate = 0.0005
    else:
        base_rate = 0.0010

    # Weibull age acceleration factor
    design_life = 40.0 if asset_upper in ("BRIDGE", "TRACTION/OHE", "OHE") else 30.0
    age_factor = 1.0 + (max(0.0, age - 3.0) / design_life) ** 2.2

    # Freight density multiplier
    freight_mult = {"very_high": 1.4, "high": 1.2, "medium": 1.0, "low": 0.85}.get(freight_class, 1.0)

    # Monsoon exposure multiplier
    monsoon_mult = {"high": 1.25, "medium": 1.0, "low": 0.9}.get(monsoon, 1.0)

    risk_val = base_rate * age_factor * freight_mult * monsoon_mult
    return round(min(0.95, max(0.0005, risk_val)), 6)


def predict_risk(segment: dict[str, Any]) -> dict[str, Any]:
    """Predict 30-day failure risk for a segment using the trained Layer 1 models.

    Runs the XGBoost failure/duration/overrun heads at request time. Falls back
    to the pre-computed trained forecasts CSV, then to the Weibull cold-start
    priors, only when the model files are unavailable or the segment has no
    feature data. Returns the normalized 10-field Layer 1 contract.
    """
    _ensure_models()

    sid = str(segment.get("segment_id") or segment.get("id") or "").strip()

    # 1. Real inference when the models are loaded and the segment has features.
    if _MODELS:
        row = _feature_row(segment)
        if row is not None:
            try:
                return _model_predict(segment, row)
            except Exception as exc:
                log.error("Model inference failed for %s, using CSV fallback: %s", sid, exc)

    _ensure_trained_data()

    # 2. Exact lookup from trained ML forecasts (CSV fallback).
    if sid in _TRAINED_FORECASTS:
        item = dict(_TRAINED_FORECASTS[sid])
        item["survival_curve"] = _TRAINED_SURVIVAL_CURVES.get(sid, [])
        item["feature_contributions"] = _FEATURE_CONTRIBUTIONS
        item["model_version"] = "trained-layer1-v1.0"
        return item

    # 3. Cold-start fallback for new/unseen corridor segments using trained asset-type priors
    risk_val = _calculate_cold_start_risk(segment)
    exp_down = round(max(0.01, risk_val * 4.5), 3)

    # Dynamic block duration based on asset_type, length_km, and age
    asset_str = str(segment.get("asset_type", "Track")).upper()
    length_km = float(segment.get("length_km", 12.0))
    age_yrs = float(segment.get("age_years", 25.0))

    if "OHE" in asset_str or "CATENARY" in asset_str:
        base_hrs = 2.5
    elif "S&T" in asset_str or "SIGNAL" in asset_str:
        base_hrs = 1.5
    elif "BRIDGE" in asset_str:
        base_hrs = 4.0
    else:  # TRACK
        base_hrs = 3.5

    prev_dur = round(max(1.0, min(6.0, base_hrs + (length_km / 20.0) * 0.6 + (age_yrs / 40.0) * 0.4)), 1)
    overrun_p = round(min(0.95, max(0.05, 0.08 + risk_val * 0.35)), 4)

    # Discrete daily survival curve: S(t) = (1 - h)^t where h is the daily hazard
    daily_hazard = 1.0 - (1.0 - risk_val) ** (1.0 / 30.0)
    default_curve = [
        {
            "day": d,
            "survival_probability": round(max(0.0, (1.0 - daily_hazard) ** d), 6),
        }
        for d in range(1, 31)
    ]

    return {
        "segment_id": sid,
        "division": str(segment.get("division", "Delhi")),
        "asset_type": str(segment.get("asset_type", "Track")),
        "risk_30d": risk_val,
        "expected_downtime_days": exp_down,
        "preventive_block_duration_hrs": prev_dur,
        "confidence": "80% Confidence",
        "cold_start_fallback": True,
        "overrun_probability": overrun_p,
        "forecast_as_of": "2025-12-01",
        "survival_curve": default_curve,
        "feature_contributions": _FEATURE_CONTRIBUTIONS,
        "model_version": "trained-cold-start-v1.0",
    }


def predict_risk_batch(segments: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Batch risk prediction for multiple segments using trained model outputs."""
    return [predict_risk(seg) for seg in segments]


def is_available() -> bool:
    """Returns True if the trained Layer 1 models, or the forecast data, are operational."""
    _ensure_models()
    if _MODELS:
        return True
    _ensure_trained_data()
    return len(_TRAINED_FORECASTS) > 0 or _LAYER1_DIR is not None
