"""Microbial co-occurrence network builder."""

from __future__ import annotations

import networkx as nx
import numpy as np
import pandas as pd
from scipy.stats import spearmanr
from statsmodels.stats.multitest import multipletests
from typing import Any

from db.database import get_session
from db.models import BatchRecord
from data.schema import DataSourceType
from models.outcome.features import clr_transform

def build_network(product_type: str, db_engine=None) -> tuple[nx.Graph, str, int]:
    """Build microbial co-occurrence network. Returns (Graph, provenance, batch_count)."""
    with get_session(db_engine) as session:
        records = session.query(BatchRecord).filter(
            BatchRecord.product_type == product_type,
            BatchRecord.data_source_type == DataSourceType.REAL_LITERATURE.value
        ).all()
        provenance = "real"
        
        if not records or len(records) < 5:
            records = session.query(BatchRecord).filter_by(product_type=product_type).all()
            has_real = any(r.data_source_type == DataSourceType.REAL_LITERATURE.value for r in records)
            has_synth = any(r.data_source_type != DataSourceType.REAL_LITERATURE.value for r in records)
            if has_real and has_synth:
                provenance = "blended"
            elif has_real:
                provenance = "real"
            else:
                provenance = "synthetic"
            
    if not records:
        return nx.Graph(), "none", 0
        
    batch_count = len(records)
        
    compositions = []
    outcomes_acidity = []
    
    for r in records:
        if r.microbial_composition:
            compositions.append(clr_transform(r.microbial_composition))
            outcomes_acidity.append(r.outcome_acidity or 0.0)
            
    if not compositions:
        return nx.Graph(), provenance, batch_count
        
    df = pd.DataFrame(compositions).fillna(0)
    
    # Calculate Spearman correlation
    taxa = df.columns
    corr_matrix, p_matrix = spearmanr(df.values, axis=0)
    
    # Handle single taxon case
    if isinstance(corr_matrix, float):
        return nx.Graph(), provenance, batch_count
        
    G = nx.Graph()
    
    # Add nodes
    mean_abundances = df.mean()
    
    # Calculate outcome association (correlation with acidity as proxy)
    outcome_associations = {}
    if len(set(outcomes_acidity)) > 1:
        for t in taxa:
            r, _ = spearmanr(df[t].values, outcomes_acidity)
            outcome_associations[t] = r if not np.isnan(r) else 0.0
            
    for t in taxa:
        G.add_node(t, mean_abundance=float(mean_abundances[t]), outcome_association=float(outcome_associations.get(t, 0.0)))
        
    # Extract significant edges
    p_values = p_matrix[np.triu_indices_from(p_matrix, k=1)]
    if len(p_values) > 0:
        reject, pvals_corrected, _, _ = multipletests(p_values, alpha=0.05, method='fdr_bh')
        
        idx = 0
        for i in range(len(taxa)):
            for j in range(i + 1, len(taxa)):
                if reject[idx]:
                    corr = corr_matrix[i, j]
                    G.add_edge(taxa[i], taxa[j], weight=float(corr), p_value=float(pvals_corrected[idx]), edge_type='positive' if corr > 0 else 'negative')
                idx += 1
                
    # Calculate centrality
    try:
        centrality = nx.betweenness_centrality(G, weight='weight')
        for node, score in centrality.items():
            G.nodes[node]['hub_score'] = score
    except:
        for node in G.nodes():
            G.nodes[node]['hub_score'] = 0.0
            
    return G, provenance, batch_count

def network_to_json(G: nx.Graph) -> dict[str, list[Any]]:
    """Convert NetworkX graph to JSON format."""
    return {
        "nodes": [{"id": n, **data} for n, data in G.nodes(data=True)],
        "edges": [{"source": u, "target": v, **data} for u, v, data in G.edges(data=True)]
    }
