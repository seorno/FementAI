"""Feature engineering module for outcome prediction."""

from __future__ import annotations

import numpy as np
import pandas as pd
from typing import Tuple, List
from data.schema import FermentationBatch, PRODUCT_TAXA

def clr_transform(composition: dict[str, float], eps: float = 1e-6) -> dict[str, float]:
    """Centered Log-Ratio (CLR) transformation for compositional data."""
    if not composition:
        return {}
    taxa = list(composition.keys())
    values = np.array(list(composition.values())) + eps
    values = values / values.sum()
    log_vals = np.log(values)
    clr_vals = log_vals - log_vals.mean()
    return dict(zip(taxa, clr_vals))

def shannon_index(composition: dict[str, float]) -> float:
    """Calculate Shannon diversity index."""
    if not composition:
        return 0.0
    values = np.array(list(composition.values()))
    values = values[values > 0]
    p = values / values.sum()
    return -np.sum(p * np.log(p))

def simpson_index(composition: dict[str, float]) -> float:
    """Calculate Simpson diversity index."""
    if not composition:
        return 0.0
    values = np.array(list(composition.values()))
    values = values[values > 0]
    p = values / values.sum()
    return 1 - np.sum(p**2)

def build_feature_matrix(batches: List[FermentationBatch], product_type: str) -> Tuple[pd.DataFrame, List[str]]:
    """Build a feature matrix from a list of batches."""
    features_list = []
    
    key_taxa = PRODUCT_TAXA.get(product_type, [])
    
    for batch in batches:
        row = {}
        # Macro features
        row["temperature_c"] = batch.temperature_c
        row["substrate_conc"] = batch.substrate_conc
        row["salt_conc"] = batch.salt_conc
        row["ph_initial"] = batch.ph_initial
        row["duration_hours"] = batch.duration_hours
        row["vessel_size_l"] = batch.vessel_size_l
        
        # Microbial features
        comp = batch.microbial_composition or {}
        row["alpha_shannon"] = shannon_index(comp)
        row["alpha_simpson"] = simpson_index(comp)
        row["alpha_richness"] = float(len([v for v in comp.values() if v > 0]))
        
        clr_comp = clr_transform(comp)
        for taxon in key_taxa:
            row[f"clr_{taxon}"] = clr_comp.get(taxon, 0.0)
            
        # Network features (placeholders)
        row["community_cluster_score"] = 0.0
        row["hub_taxa_score"] = 0.0
        row["dominance_index"] = 0.0
        
        # Outcomes
        row["outcome_acidity"] = batch.outcome_acidity
        row["outcome_alcohol_pct"] = batch.outcome_alcohol_pct
        row["outcome_off_flavor_risk"] = batch.outcome_off_flavor_risk
        
        features_list.append(row)
        
    df = pd.DataFrame(features_list)
    if df.empty:
        return df, []
        
    # Missing value handling
    feature_cols = [c for c in df.columns if not c.startswith("outcome_")]
    
    for col in feature_cols:
        if df[col].isnull().any():
            df[f"{col}_missing"] = df[col].isnull().astype(int)
            df[col] = df[col].fillna(df[col].median() if not df[col].isnull().all() else 0)
            
    final_features = [c for c in df.columns if not c.startswith("outcome_")]
    
    return df, final_features
