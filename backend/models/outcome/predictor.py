"""Inference module for outcome prediction."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any
import numpy as np
import pandas as pd
import joblib

from pydantic import BaseModel
from data.schema import FermentationBatch
from models.outcome.features import build_feature_matrix

MODELS_DIR = Path(__file__).parent.parent / "trained"

class PredictionResult(BaseModel):
    acidity: float | None = None
    acidity_ci: tuple[float, float] | None = None
    alcohol_pct: float | None = None
    alcohol_pct_ci: tuple[float, float] | None = None
    off_flavor_risk: float | None = None
    fermentation_curve: list[dict[str, float]] | None = None
    is_simulated_prediction: bool = False
    acidity_model_path: str | None = None

def _get_rf_ci(model, X: pd.DataFrame, percentile: float = 95) -> tuple[float, float]:
    """Calculate confidence interval from RandomForest."""
    preds = []
    for estimator in model.estimators_:
        preds.append(estimator.predict(X)[0])
    lower = np.percentile(preds, (100 - percentile) / 2.0)
    upper = np.percentile(preds, 100 - (100 - percentile) / 2.0)
    return float(lower), float(upper)

def _load_model(model_dir: Path, target_name: str) -> tuple[Any | None, bool, str | None]:
    """Loads real model if exists, otherwise simulated model. Returns (model, is_simulated, model_path)"""
    real_path = model_dir / f"{target_name}_model.joblib"
    if real_path.exists():
        return joblib.load(real_path), False, str(real_path)
        
    sim_path = model_dir / f"{target_name}_model_sim.joblib"
    if sim_path.exists():
        return joblib.load(sim_path), True, str(sim_path)
        
    return None, False, None

def predict_batch(batch: FermentationBatch) -> PredictionResult:
    """Predict outcomes for a new batch."""
    product_type = batch.product_type
    model_dir = MODELS_DIR / product_type
    
    if not model_dir.exists():
        return PredictionResult()
        
    try:
        with open(model_dir / "features.json", "r") as f:
            features = json.load(f)
    except FileNotFoundError:
        return PredictionResult()
        
    df, _ = build_feature_matrix([batch], product_type)
    
    # Ensure all features exist
    for f in features:
        if f not in df.columns:
            df[f] = 0.0
            
    X = df[features]
    
    result = PredictionResult()
    
    # Predict acidity
    model, is_sim, model_path = _load_model(model_dir, "acidity")
    if model:
        result.acidity = float(model.predict(X)[0])
        if hasattr(model, 'estimators_'):
            result.acidity_ci = _get_rf_ci(model, X)
        if is_sim: result.is_simulated_prediction = True
        result.acidity_model_path = model_path
            
    # Predict alcohol
    model, is_sim, _ = _load_model(model_dir, "alcohol")
    if model:
        result.alcohol_pct = float(model.predict(X)[0])
        if hasattr(model, 'estimators_'):
            result.alcohol_pct_ci = _get_rf_ci(model, X)
        if is_sim: result.is_simulated_prediction = True
            
    # Predict off-flavor risk
    model, is_sim, _ = _load_model(model_dir, "off_flavor")
    if model:
        result.off_flavor_risk = float(model.predict_proba(X)[0, 1])
        if is_sim: result.is_simulated_prediction = True
        
    # Generate mock fermentation curve based on initial and final predictions
    if batch.duration_hours and result.acidity is not None:
        hours = np.linspace(0, batch.duration_hours, num=10)
        curve = []
        initial_ph = batch.ph_initial or 5.5
        for h in hours:
            progress = h / batch.duration_hours
            current_acidity = result.acidity * progress
            # exponential decay of pH
            current_ph = initial_ph - (initial_ph - 3.0) * (1 - np.exp(-3 * progress))
            curve.append({"hour": float(h), "acidity": float(current_acidity), "ph": float(current_ph)})
        result.fermentation_curve = curve
        
    return result
