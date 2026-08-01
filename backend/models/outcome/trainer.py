"""Model training module."""

from __future__ import annotations

import os
import json
import logging
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingClassifier
from sklearn.model_selection import RandomizedSearchCV, StratifiedKFold, KFold, LeaveOneOut
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score, accuracy_score, f1_score, roc_auc_score

try:
    from xgboost import XGBClassifier
    _HAS_XGBOOST = True
except Exception:
    _HAS_XGBOOST = False

from data.schema import FermentationBatch, DataSourceType
from db.database import get_session
from db.models import BatchRecord
from models.outcome.features import build_feature_matrix

logger = logging.getLogger(__name__)

MODELS_DIR = Path(__file__).parent.parent / "trained"

def train_target_model(df: pd.DataFrame, target_col: str, features: list[str], is_classification: bool, save_path: Path) -> dict:
    mask = df[target_col].notna()
    if mask.sum() < 3:
        logger.warning(f"Not enough data to train model for {target_col} at {save_path.name}")
        return {}
        
    X = df.loc[mask, features]
    y = df.loc[mask, target_col]
    
    if is_classification:
        y = (y > 0.5).astype(int)
        if len(y.unique()) < 2:
            logger.warning(f"Single class found for {target_col}, skipping.")
            return {}
            
        if _HAS_XGBOOST:
            clf = XGBClassifier(random_state=42, eval_metric='logloss')
        else:
            clf = GradientBoostingClassifier(random_state=42)
            
        param_dist = {
            'n_estimators': [50, 100],
            'max_depth': [3, 5],
            'learning_rate': [0.01, 0.1]
        }
        cv = StratifiedKFold(min(3, len(y)), shuffle=True, random_state=42)
        search = RandomizedSearchCV(clf, param_distributions=param_dist, n_iter=5, cv=cv, scoring='roc_auc', random_state=42)
        search.fit(X, y)
        best_model = search.best_estimator_
        
        preds = best_model.predict(X)
        preds_proba = best_model.predict_proba(X)[:, 1]
        metrics = {
            "accuracy": float(accuracy_score(y, preds)),
            "f1": float(f1_score(y, preds)),
            "auroc": float(roc_auc_score(y, preds_proba))
        }
    else:
        rf = RandomForestRegressor(random_state=42)
        param_dist = {
            'n_estimators': [50, 100],
            'max_depth': [None, 10],
            'min_samples_split': [2, 5]
        }
        n_samples = len(y)
        cv = LeaveOneOut() if n_samples < 10 else KFold(min(5, n_samples), shuffle=True, random_state=42)
        
        search = RandomizedSearchCV(rf, param_distributions=param_dist, n_iter=5, cv=cv, scoring='neg_mean_squared_error', random_state=42)
        search.fit(X, y)
        best_model = search.best_estimator_
        
        preds = best_model.predict(X)
        metrics = {
            "rmse": float(np.sqrt(mean_squared_error(y, preds))),
            "mae": float(mean_absolute_error(y, preds)),
            "r2": float(r2_score(y, preds)) if n_samples > 3 else "N/A (too few samples for R2)"
        }
        
    joblib.dump(best_model, save_path)
    return metrics


def train_product_models(product_type: str, db_engine=None) -> dict[str, Any]:
    """Train all models for a specific product type, separating real vs synthetic data."""
    logger.info(f"Training models for {product_type}")
    
    with get_session(db_engine) as session:
        records = session.query(BatchRecord).filter_by(product_type=product_type).all()
        
    if not records:
        logger.warning(f"No records found for {product_type}")
        return {}
        
    batches = []
    for r in records:
        b = FermentationBatch(
            batch_id=r.batch_id,
            product_type=r.product_type,
            temperature_c=r.temperature_c,
            substrate_conc=r.substrate_conc,
            salt_conc=r.salt_conc,
            ph_initial=r.ph_initial,
            duration_hours=r.duration_hours,
            vessel_size_l=r.vessel_size_l,
            microbial_composition=r.microbial_composition,
            outcome_acidity=r.outcome_acidity,
            outcome_alcohol_pct=r.outcome_alcohol_pct,
            outcome_off_flavor_risk=r.outcome_off_flavor_risk,
            data_source_type=DataSourceType(r.data_source_type)
        )
        batches.append(b)
        
    df, features = build_feature_matrix(batches, product_type)
    if df.empty:
        return {}
        
    # Reconstruct data_source_type in df for filtering
    df['data_source_type'] = [b.data_source_type.value for b in batches]
    
    df_real = df[df['data_source_type'] == DataSourceType.REAL_LITERATURE.value]
    df_sim = df[df['data_source_type'] == DataSourceType.SYNTHETIC.value]
    
    metrics = {"real_models": {}, "simulated_models": {}}
    save_dir = MODELS_DIR / product_type
    save_dir.mkdir(parents=True, exist_ok=True)
    
    targets = [
        ("acidity", "outcome_acidity", False),
        ("alcohol", "outcome_alcohol_pct", False),
        ("off_flavor", "outcome_off_flavor_risk", True)
    ]
    
    for name, col, is_classification in targets:
        # Try training real model
        real_metrics = train_target_model(df_real, col, features, is_classification, save_dir / f"{name}_model.joblib")
        if real_metrics:
            metrics["real_models"][name] = real_metrics
        else:
            logger.info(f"Could not train real model for {name}, falling back to _sim.")
            
        # Always train a synthetic fallback for completeness/UI fallback
        sim_metrics = train_target_model(df_sim, col, features, is_classification, save_dir / f"{name}_model_sim.joblib")
        if sim_metrics:
            metrics["simulated_models"][name] = sim_metrics

    # Save features list
    with open(save_dir / "features.json", "w") as f:
        json.dump(features, f)
        
    with open(save_dir / "metrics.json", "w") as f:
        json.dump(metrics, f)
        
    return metrics
