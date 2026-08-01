"""
Orchestrator for synthetic data generation.
"""

from typing import List

from data.schema import FermentationBatch, ProductType
from data.ingestion.synthetic.kombucha import generate_kombucha_batches
from data.ingestion.synthetic.kimchi import generate_kimchi_batches


def generate_synthetic_batches(product_type: str, count: int = 500) -> List[FermentationBatch]:
    """
    Generate synthetic batches for the specified product type.
    
    Args:
        product_type: The product type (e.g., 'kombucha', 'kimchi')
        count: Number of batches to generate.
        
    Returns:
        List of synthetic FermentationBatch objects.
    """
    if product_type.lower() == ProductType.KOMBUCHA.value:
        return generate_kombucha_batches(count)
    elif product_type.lower() == ProductType.KIMCHI.value:
        return generate_kimchi_batches(count)
    else:
        raise ValueError(f"Unsupported synthetic product type: {product_type}")
