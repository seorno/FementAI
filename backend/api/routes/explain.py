"""
Explain endpoint — returns SHAP-based explanation for a prediction.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from api.schemas import ExplanationItem

logger = logging.getLogger(__name__)
router = APIRouter(tags=["explanation"])


@router.get("/explain/{prediction_id}", response_model=list[ExplanationItem])
def explain(prediction_id: str) -> list[ExplanationItem]:
    """
    Get SHAP-based explanation for a stored prediction.
    
    Note: In V1, explanations are returned inline with the prediction
    response. This endpoint is a placeholder for future use when
    predictions are stored and explanations can be retrieved separately.
    """
    # For V1, explanations are included in PredictionResponse
    # This endpoint would look up stored predictions
    raise HTTPException(
        status_code=501,
        detail=(
            "Separate explanation lookup is not yet implemented. "
            "Explanations are included in the /predict response."
        ),
    )
