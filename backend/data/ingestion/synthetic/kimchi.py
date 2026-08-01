"""
Kimchi fermentation kinetics model for synthetic data generation.
"""

import uuid
import numpy as np
from typing import List

from data.schema import FermentationBatch, ProductType, DataQualityFlag


def generate_kimchi_batches(count: int = 500) -> List[FermentationBatch]:
    """
    Generate synthetic kimchi fermentation batches.
    
    Args:
        count: Number of batches to generate.
        
    Returns:
        List of synthetic FermentationBatch objects.
    """
    np.random.seed(100)
    batches = []
    
    for _ in range(count):
        # Initial parameters
        temp = np.random.uniform(4, 25)
        salt_conc = np.random.uniform(2.0, 5.0)
        initial_ph = np.random.uniform(5.5, 6.5)
        
        if temp < 10:
            duration_days = np.random.uniform(14, 30) # slow
        else:
            duration_days = np.random.uniform(3, 10) # fast
            
        duration_hours = duration_days * 24
        
        # Kinetics logic
        rate_modifier = (temp / 15.0) * (3.0 / salt_conc)
        
        final_ph = max(3.5, initial_ph - (2.0 * rate_modifier))
        final_ph += np.random.normal(0, 0.1)
        
        # Off-flavor risk
        off_flavor = 0.05
        if temp > 22:
            off_flavor += 0.3
        if salt_conc < 2.5:
            off_flavor += 0.2
        if duration_days > 20 and temp > 15:
            off_flavor += 0.4
        off_flavor = min(1.0, off_flavor + np.random.uniform(0, 0.1))
        
        # Time series
        curve = []
        hours = np.linspace(0, duration_hours, num=int(duration_days) + 1)
        for h in hours:
            progress = h / duration_hours
            curve.append({
                "hour": float(h),
                "ph": float(initial_ph - (initial_ph - final_ph) * (1 / (1 + np.exp(-8 * (progress - 0.4)))))
            })
            
        # Compute lactic acid outcome from pH drop
        ph_drop = initial_ph - final_ph
        outcome_acidity = max(0.3, ph_drop * 1.8 + np.random.normal(0, 0.3))
        
        # Generate microbial community (normalized to sum to 1.0)
        raw_abundances = {
            "Leuconostoc": np.random.uniform(0.1, 0.4) if temp > 15 else np.random.uniform(0.3, 0.6),
            "Lactobacillus": np.random.uniform(0.4, 0.8) if temp > 15 else np.random.uniform(0.2, 0.4),
            "Weissella": np.random.uniform(0.05, 0.2),
            "Pediococcus": np.random.uniform(0.01, 0.08),
            "Lactococcus": np.random.uniform(0.01, 0.06),
        }
        total = sum(raw_abundances.values())
        microbial = {k: round(v / total, 4) for k, v in raw_abundances.items()}
        
        batch = FermentationBatch(
            batch_id=str(uuid.uuid4()),
            product_type=ProductType.KIMCHI,
            source_dataset="synthetic_v1",
            source_citation="FermentAI Synthetic Generator V1",
            temperature_c=float(temp),
            salt_conc=float(salt_conc),
            ph_initial=float(initial_ph),
            ph_final=float(final_ph),
            duration_hours=float(duration_hours),
            microbial_composition=microbial,
            outcome_acidity=float(outcome_acidity),
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
