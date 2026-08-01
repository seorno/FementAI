"""
Product types endpoint — lists available fermentation product types
with their input parameters and metadata.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from api.schemas import ParameterRange, ProductInfo, ProductListResponse
from data.schema import PRODUCT_DEFAULTS, PRODUCT_TAXA, ProductType
from db.database import get_default_engine, get_session
from db.models import BatchRecord

logger = logging.getLogger(__name__)
router = APIRouter(tags=["products"])

# Display metadata per product type
_PRODUCT_DISPLAY = {
    "kombucha": {
        "display_name": "Kombucha",
        "description": (
            "Fermented tea drink driven by a symbiotic culture of acetic acid "
            "bacteria (AAB) and yeast (SCOBY). Key microbes include "
            "Komagataeibacter, Acetobacter, Zygosaccharomyces, and Brettanomyces."
        ),
    },
    "kimchi": {
        "display_name": "Kimchi",
        "description": (
            "Traditional Korean fermented vegetable dish driven by lactic acid "
            "bacteria (LAB). Key microbes include Leuconostoc, Lactobacillus, "
            "and Weissella, with succession patterns strongly influenced by "
            "temperature and salt concentration."
        ),
    },
}


@router.get("/products", response_model=ProductListResponse)
def list_products() -> ProductListResponse:
    """List all supported fermentation product types with parameter metadata."""
    products = []
    
    for pt in ProductType:
        product_key = pt.value
        defaults = PRODUCT_DEFAULTS.get(product_key, {})
        display = _PRODUCT_DISPLAY.get(product_key, {})
        
        # Build parameter ranges (exclude key_taxa from the ranges dict)
        parameters = {}
        for param_name, param_info in defaults.items():
            if param_name == "key_taxa":
                continue
            if isinstance(param_info, dict) and "min" in param_info:
                parameters[param_name] = ParameterRange(**param_info)
        
        # Count batches in DB
        batch_count = 0
        try:
            engine = get_default_engine()
            with get_session(engine) as session:
                batch_count = (
                    session.query(BatchRecord)
                    .filter(BatchRecord.product_type == product_key)
                    .count()
                )
        except Exception as e:
            logger.warning(f"Could not count batches for {product_key}: {e}")
        
        products.append(ProductInfo(
            product_type=product_key,
            display_name=display.get("display_name", product_key.title()),
            description=display.get("description", ""),
            parameters=parameters,
            key_taxa=PRODUCT_TAXA.get(product_key, []),
            batch_count=batch_count,
        ))
    
    return ProductListResponse(products=products)
