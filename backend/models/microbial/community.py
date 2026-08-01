"""Community clustering module."""

from __future__ import annotations

import numpy as np
import pandas as pd
from typing import Any
from sklearn.cluster import KMeans
from sklearn.metrics import pairwise_distances
from sklearn.manifold import MDS
from pydantic import BaseModel

from db.database import get_session
from db.models import BatchRecord

class CommunityModel(BaseModel):
    centroids: list[list[float]] = []
    labels: list[str] = []
    taxa: list[str] = []
    
    class Config:
        arbitrary_types_allowed = True

def bray_curtis(u, v):
    """Calculate Bray-Curtis dissimilarity."""
    diff = np.abs(u - v).sum()
    sum_uv = np.abs(u + v).sum()
    return diff / sum_uv if sum_uv != 0 else 0.0

def build_community_model(product_type: str, db_engine=None) -> CommunityModel:
    """Build a community model for clustering batches."""
    with get_session(db_engine) as session:
        records = session.query(BatchRecord).filter_by(product_type=product_type).all()
        
    if not records or len(records) < 5:
        return CommunityModel()
        
    compositions = []
    outcomes = []
    
    for r in records:
        if r.microbial_composition:
            compositions.append(r.microbial_composition)
            outcomes.append({
                "acidity": r.outcome_acidity or 0,
                "off_flavor": r.outcome_off_flavor_risk or 0
            })
            
    df = pd.DataFrame(compositions).fillna(0)
    # Normalize
    df = df.div(df.sum(axis=1), axis=0)
    
    dist_matrix = pairwise_distances(df.values, metric=bray_curtis)
    mds = MDS(n_components=3, dissimilarity='precomputed', random_state=42)
    coords = mds.fit_transform(dist_matrix)
    
    n_clusters = min(3, len(df))
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    cluster_ids = kmeans.fit_predict(coords)
    
    labels = []
    for c in range(n_clusters):
        c_outcomes = [outcomes[i] for i, cid in enumerate(cluster_ids) if cid == c]
        avg_acidity = np.mean([o["acidity"] for o in c_outcomes])
        avg_off_flavor = np.mean([o["off_flavor"] for o in c_outcomes])
        
        if avg_off_flavor > 0.5:
            labels.append("off_flavor_prone")
        elif avg_acidity > 5.0:
            labels.append("high_acidity")
        else:
            labels.append("balanced")
            
    return CommunityModel(
        centroids=kmeans.cluster_centers_.tolist(),
        labels=labels,
        taxa=df.columns.tolist()
    )

def get_community_features(composition: dict[str, float], community_model: CommunityModel) -> dict[str, float]:
    """Extract graph-derived features for the outcome model."""
    if not community_model.centroids:
        return {
            "community_cluster_score": 0.0,
            "hub_taxa_score": 0.0,
            "dominance_index": 0.0
        }
        
    # Berger-Parker dominance index
    vals = list(composition.values())
    dominance = max(vals) / sum(vals) if sum(vals) > 0 else 0.0
    
    # Placeholder scores
    return {
        "community_cluster_score": 1.0,
        "hub_taxa_score": 0.5,
        "dominance_index": dominance
    }
