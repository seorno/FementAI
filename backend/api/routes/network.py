"""
Network endpoint — returns the microbial interaction network
for a given product type.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from api.schemas import (
    NetworkCluster,
    NetworkEdge,
    NetworkNode,
    NetworkResponse,
)
from data.schema import PRODUCT_TAXA, ProductType

logger = logging.getLogger(__name__)
router = APIRouter(tags=["network"])


def _load_network(product_type: str) -> NetworkResponse | None:
    """Try to load a pre-computed network from the database."""
    try:
        from db.database import get_default_engine, get_session
        from db.models import NetworkCache
        
        engine = get_default_engine()
        with get_session(engine) as session:
            cached = (
                session.query(NetworkCache)
                .filter(NetworkCache.product_type == product_type)
                .first()
            )
            if cached:
                return NetworkResponse(
                    product_type=product_type,
                    nodes=[NetworkNode(**n) for n in cached.nodes],
                    edges=[NetworkEdge(**e) for e in cached.edges],
                    clusters=[NetworkCluster(**c) for c in (cached.clusters or [])],
                    batch_count=cached.batch_count or 0,
                    data_provenance=cached.data_provenance or "synthetic",
                )
    except Exception as e:
        logger.warning(f"Could not load cached network: {e}")
    return None


# ── Fallback: knowledge-based network ───────────────────────────────────

_KOMBUCHA_NETWORK = NetworkResponse(
    product_type="kombucha",
    batch_count=0,
    nodes=[
        NetworkNode(id="komagataeibacter", label="Komagataeibacter", size=0.45,
                    group="bacteria_aab", abundance_mean=0.42, hub_score=0.85,
                    outcome_association="High acidity, cellulose production"),
        NetworkNode(id="acetobacter", label="Acetobacter", size=0.15,
                    group="bacteria_aab", abundance_mean=0.12, hub_score=0.45,
                    outcome_association="Moderate acidity contribution"),
        NetworkNode(id="gluconacetobacter", label="Gluconacetobacter", size=0.08,
                    group="bacteria_aab", abundance_mean=0.06, hub_score=0.25,
                    outcome_association="Gluconic acid production"),
        NetworkNode(id="zygosaccharomyces", label="Zygosaccharomyces", size=0.25,
                    group="yeast", abundance_mean=0.22, hub_score=0.70,
                    outcome_association="Ethanol production, sugar consumption"),
        NetworkNode(id="brettanomyces", label="Brettanomyces", size=0.12,
                    group="yeast", abundance_mean=0.10, hub_score=0.50,
                    outcome_association="Flavor complexity, potential off-flavors at high abundance"),
        NetworkNode(id="saccharomyces", label="Saccharomyces", size=0.08,
                    group="yeast", abundance_mean=0.05, hub_score=0.30,
                    outcome_association="Rapid initial sugar fermentation"),
        NetworkNode(id="pichia", label="Pichia", size=0.05,
                    group="yeast", abundance_mean=0.03, hub_score=0.15,
                    outcome_association="Minor ethanol contribution"),
        NetworkNode(id="lactobacillus", label="Lactobacillus", size=0.07,
                    group="bacteria_lab", abundance_mean=0.05, hub_score=0.35,
                    outcome_association="Lactic acid, probiotic potential"),
        NetworkNode(id="oenococcus", label="Oenococcus", size=0.03,
                    group="bacteria_lab", abundance_mean=0.02, hub_score=0.10,
                    outcome_association="Minor lactic acid contribution"),
    ],
    edges=[
        # Cross-feeding relationships
        NetworkEdge(source="zygosaccharomyces", target="komagataeibacter",
                    weight=0.78, interaction_type="positive",
                    mechanism="Yeast produces ethanol → AAB converts to acetic acid"),
        NetworkEdge(source="brettanomyces", target="komagataeibacter",
                    weight=0.65, interaction_type="positive",
                    mechanism="Alternative ethanol source for AAB"),
        NetworkEdge(source="saccharomyces", target="komagataeibacter",
                    weight=0.55, interaction_type="positive",
                    mechanism="Rapid ethanol production feeds AAB"),
        # Competition
        NetworkEdge(source="zygosaccharomyces", target="saccharomyces",
                    weight=-0.45, interaction_type="negative",
                    mechanism="Competition for simple sugars and nutrients"),
        NetworkEdge(source="komagataeibacter", target="acetobacter",
                    weight=-0.35, interaction_type="negative",
                    mechanism="Competition for ethanol substrate"),
        NetworkEdge(source="brettanomyces", target="saccharomyces",
                    weight=-0.40, interaction_type="negative",
                    mechanism="Brettanomyces outcompetes in low-sugar, acidic conditions"),
        # Succession / pH-mediated
        NetworkEdge(source="lactobacillus", target="komagataeibacter",
                    weight=0.30, interaction_type="positive",
                    mechanism="Lactic acid lowers pH, co-exists with AAB in acidic environment"),
        NetworkEdge(source="komagataeibacter", target="pichia",
                    weight=-0.25, interaction_type="negative",
                    mechanism="AAB cellulose mat limits oxygen access for surface yeasts"),
    ],
    clusters=[
        NetworkCluster(id="c1", label="AAB-Dominant",
                       outcome_profile="high_acidity",
                       description="High Komagataeibacter abundance → strong acidity, thick pellicle",
                       taxa=["komagataeibacter", "lactobacillus"]),
        NetworkCluster(id="c2", label="Balanced Community",
                       outcome_profile="balanced",
                       description="Even yeast-bacteria balance → moderate acidity with flavor complexity",
                       taxa=["komagataeibacter", "zygosaccharomyces", "brettanomyces"]),
        NetworkCluster(id="c3", label="Yeast-Dominant",
                       outcome_profile="high_alcohol",
                       description="High yeast abundance → more ethanol, less acetic acid",
                       taxa=["zygosaccharomyces", "saccharomyces", "brettanomyces"]),
    ],
)

_KIMCHI_NETWORK = NetworkResponse(
    product_type="kimchi",
    batch_count=0,
    nodes=[
        NetworkNode(id="leuconostoc", label="Leuconostoc", size=0.40,
                    group="bacteria_lab", abundance_mean=0.38, hub_score=0.80,
                    outcome_association="Early-phase dominant, CO₂ and mannitol production"),
        NetworkNode(id="lactobacillus", label="Lactobacillus", size=0.45,
                    group="bacteria_lab", abundance_mean=0.42, hub_score=0.90,
                    outcome_association="Late-phase dominant, strong lactic acid production"),
        NetworkNode(id="weissella", label="Weissella", size=0.15,
                    group="bacteria_lab", abundance_mean=0.12, hub_score=0.50,
                    outcome_association="Mid-phase, heterofermentative — produces CO₂ + lactic acid"),
        NetworkNode(id="lactococcus", label="Lactococcus", size=0.08,
                    group="bacteria_lab", abundance_mean=0.06, hub_score=0.30,
                    outcome_association="Early mild acid production"),
        NetworkNode(id="pediococcus", label="Pediococcus", size=0.05,
                    group="bacteria_lab", abundance_mean=0.04, hub_score=0.25,
                    outcome_association="Acid tolerance, late-phase persistence"),
        NetworkNode(id="enterococcus", label="Enterococcus", size=0.03,
                    group="bacteria_other", abundance_mean=0.02, hub_score=0.10,
                    outcome_association="Minor early-phase presence, declines with acidification"),
    ],
    edges=[
        # Succession (temporal competition)
        NetworkEdge(source="leuconostoc", target="lactobacillus",
                    weight=-0.70, interaction_type="negative",
                    mechanism="Temporal succession: Lactobacillus replaces Leuconostoc as pH drops below 4.0"),
        NetworkEdge(source="leuconostoc", target="weissella",
                    weight=0.45, interaction_type="positive",
                    mechanism="Both thrive in early, mildly acidic conditions"),
        NetworkEdge(source="weissella", target="lactobacillus",
                    weight=-0.35, interaction_type="negative",
                    mechanism="Weissella declines as Lactobacillus acidifies environment"),
        # Cross-feeding
        NetworkEdge(source="leuconostoc", target="lactobacillus",
                    weight=0.30, interaction_type="positive",
                    mechanism="Leuconostoc mannitol production provides carbon source for Lactobacillus"),
        # pH-mediated exclusion
        NetworkEdge(source="lactobacillus", target="enterococcus",
                    weight=-0.60, interaction_type="negative",
                    mechanism="Lactic acid production inhibits acid-sensitive Enterococcus"),
        NetworkEdge(source="lactobacillus", target="lactococcus",
                    weight=-0.40, interaction_type="negative",
                    mechanism="Lactobacillus outcompetes in highly acidic late-stage"),
        # Co-existence
        NetworkEdge(source="lactobacillus", target="pediococcus",
                    weight=0.35, interaction_type="positive",
                    mechanism="Both acid-tolerant, co-exist in late fermentation"),
    ],
    clusters=[
        NetworkCluster(id="c1", label="Early Fermentation",
                       outcome_profile="mild_acidity",
                       description="Leuconostoc-dominant, fresh and slightly fizzy",
                       taxa=["leuconostoc", "weissella", "lactococcus"]),
        NetworkCluster(id="c2", label="Optimal Maturation",
                       outcome_profile="balanced",
                       description="Balanced LAB community → ideal tangy flavor",
                       taxa=["leuconostoc", "lactobacillus", "weissella"]),
        NetworkCluster(id="c3", label="Over-Fermented",
                       outcome_profile="high_acidity",
                       description="Lactobacillus-dominant, very sour, potential off-flavors",
                       taxa=["lactobacillus", "pediococcus"]),
    ],
)

_FALLBACK_NETWORKS = {
    "kombucha": _KOMBUCHA_NETWORK,
    "kimchi": _KIMCHI_NETWORK,
}


@router.get("/network/{product_type}", response_model=NetworkResponse)
def get_network(product_type: str) -> NetworkResponse:
    """
    Get the microbial interaction network for a product type.
    
    Returns nodes (microbial taxa), edges (co-occurrence/exclusion relationships),
    and community clusters (outcome-associated groupings).
    """
    # Validate product type
    try:
        pt = ProductType(product_type)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported product type: {product_type}. "
                   f"Supported: {[p.value for p in ProductType]}",
        )
    
    # Try cached/computed network first
    network = _load_network(pt.value)
    if network is not None:
        return network
    
    # Fall back to knowledge-based network
    fallback = _FALLBACK_NETWORKS.get(pt.value)
    if fallback is None:
        return NetworkResponse(
            product_type=product_type,
            nodes=[],
            edges=[],
            clusters=[],
            batch_count=0,
            data_provenance="none",
        )
    
    return fallback
