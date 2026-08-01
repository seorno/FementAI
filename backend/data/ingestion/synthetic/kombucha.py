"""
Kombucha fermentation kinetics model for synthetic data generation.
"""

import uuid
import numpy as np
from typing import List

from data.schema import FermentationBatch, ProductType, DataQualityFlag


def generate_kombucha_batches(count: int = 500) -> List[FermentationBatch]:
    """
    Generate synthetic kombucha fermentation batches.
    
    Args:
        count: Number of batches to generate.
        
    Returns:
        List of synthetic FermentationBatch objects.
    """
    np.random.seed(42)
    batches = []
    
    for _ in range(count):
        # Initial parameters
        temp = np.random.uniform(18, 32)
        initial_sugar = np.random.uniform(50, 100)
        initial_ph = np.random.uniform(4.0, 5.0)
        duration_days = np.random.uniform(7, 21)
        duration_hours = duration_days * 24
        
        # Kinetics logic
        # Temperature affects rate
        rate_modifier = (temp - 18) / 14.0 + 0.5  # Higher temp = faster rate
        
        final_ph = max(2.5, initial_ph - (1.5 * rate_modifier * (duration_days / 14.0)))
        final_ph += np.random.normal(0, 0.1)
        
        final_sugar = max(5.0, initial_sugar - (60.0 * rate_modifier * (duration_days / 14.0)))
        final_sugar += np.random.normal(0, 2.0)
        
        final_ethanol = min(3.0, 0.5 + (2.0 * rate_modifier * (duration_days / 14.0)))
        final_ethanol += np.random.normal(0, 0.2)
        
        final_acidity = min(10.0, 2.0 + (6.0 * rate_modifier * (duration_days / 14.0)))
        
        # Off-flavor risk
        off_flavor = 0.1
        if temp > 28:
            off_flavor += 0.3
        if duration_days > 18:
            off_flavor += 0.2
        off_flavor = min(1.0, off_flavor + np.random.uniform(0, 0.1))
        
        # Time series
        curve = []
        hours = np.linspace(0, duration_hours, num=int(duration_days) + 1)
        for h in hours:
            progress = h / duration_hours
            curve.append({
                "hour": float(h),
                "ph": float(initial_ph - (initial_ph - final_ph) * (1 / (1 + np.exp(-10 * (progress - 0.5))))),
                "acidity": float(final_acidity * progress),
                "sugar": float(initial_sugar - (initial_sugar - final_sugar) * progress),
                "ethanol": float(final_ethanol * progress)
            })
            
        # Generate microbial community composition (normalized to sum to 1.0)
        raw_abundances = {
            "Komagataeibacter": np.random.uniform(0.3, 0.6),
            "Acetobacter": np.random.uniform(0.05, 0.2),
            "Zygosaccharomyces": np.random.uniform(0.1, 0.3),
            "Brettanomyces": np.random.uniform(0.05, 0.15),
            "Saccharomyces": np.random.uniform(0.01, 0.08),
            "Lactobacillus": np.random.uniform(0.01, 0.10),
        }
        total = sum(raw_abundances.values())
        microbial = {k: round(v / total, 4) for k, v in raw_abundances.items()}
        
        batch = FermentationBatch(
            batch_id=str(uuid.uuid4()),
            product_type=ProductType.KOMBUCHA,
            source_dataset="synthetic_v1",
            source_citation="FermentAI Synthetic Generator V1",
            temperature_c=float(temp),
            substrate_conc=float(initial_sugar),
            ph_initial=float(initial_ph),
            ph_final=float(final_ph),
            duration_hours=float(duration_hours),
            microbial_composition=microbial,
            outcome_acidity=float(final_acidity),
            outcome_alcohol_pct=float(final_ethanol),
            outcome_off_flavor_risk=float(off_flavor),
            fermentation_curve=curve,
            data_quality={
                "temperature_c": DataQualityFlag.SYNTHETIC,
                "ph_initial": DataQualityFlag.SYNTHETIC,
                "ph_final": DataQualityFlag.SYNTHETIC,
                "duration_hours": DataQualityFlag.SYNTHETIC
            }
        )
        batches.append(batch)
        
    return batches
