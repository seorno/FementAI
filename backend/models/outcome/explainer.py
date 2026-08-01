"""SHAP explanation module."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any
import pandas as pd
import joblib
import shap

from data.schema import FermentationBatch
from models.outcome.features import build_feature_matrix

MODELS_DIR = Path(__file__).parent.parent / "trained"

def explain_prediction(batch: FermentationBatch, model_path: str) -> list[dict[str, Any]]:
    """Explain prediction using SHAP TreeExplainer."""
    path = Path(model_path)
    if not path.exists():
        return []
        
    product_type = batch.product_type
    model_dir = path.parent
    
    try:
        with open(model_dir / "features.json", "r") as f:
            features = json.load(f)
    except FileNotFoundError:
        return []
        
    df, _ = build_feature_matrix([batch], product_type)
    
    for f in features:
        if f not in df.columns:
            df[f] = 0.0
            
    X = df[features]
    model = joblib.load(path)
    
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X)
    
    if isinstance(shap_values, list): # XGBoost Classifier might return list
        shap_values = shap_values[1] # Use positive class
        
    shap_vals = shap_values[0]
    
    # Get top 5 features
    top_indices = np.argsort(np.abs(shap_vals))[-5:][::-1]
    
    explanations = []
    for idx in top_indices:
        feat_name = features[idx]
        val = shap_vals[idx]
        direction = "higher" if val > 0 else "lower"
        
        # Translate technical feature names
        text = feat_name
        if feat_name.startswith("clr_"):
            taxon = feat_name.replace("clr_", "")
            desc = "High" if df[feat_name].iloc[0] > 0 else "Low"
            text = f"{desc} {taxon} abundance ({val:+.2f}) is pushing prediction {direction}"
        else:
            text = f"{feat_name} ({val:+.2f}) is pushing prediction {direction}"
            
        explanations.append({
            "feature": feat_name,
            "value": float(val),
            "text": text
        })
        
    return explanations
