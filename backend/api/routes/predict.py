"""
Prediction endpoint — accepts batch parameters, returns predicted
fermentation outcomes with explanations.
"""

from __future__ import annotations

import logging
import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, BackgroundTasks

from api.schemas import (
    CurvePoint,
    ExplanationItem,
    PredictionRequest,
    PredictionResponse,
)
from data.schema import FermentationBatch, ProductType

logger = logging.getLogger(__name__)
router = APIRouter(tags=["prediction"])

MODELS_DIR = Path(__file__).parent.parent.parent / "models" / "trained"

def log_analytics(product_type: str, is_simulated: bool):
    try:
        from db.database import get_session
        from db.models import UsageAnalytics
        with get_session() as session:
            record = UsageAnalytics(
                endpoint="/api/predict",
                product_type=product_type,
                is_simulated_prediction=1 if is_simulated else 0
            )
            session.add(record)
    except Exception as e:
        logger.error(f"Failed to log analytics: {e}")


def _load_predictor(product_type: str):
    """Lazy-load the predictor for a product type."""
    try:
        from models.outcome.predictor import predict_batch
        return predict_batch
    except ImportError as e:
        logger.warning(f"Predictor not available: {e}")
        return None


def _load_explainer(product_type: str):
    """Lazy-load the SHAP explainer."""
    try:
        from models.outcome.explainer import explain_prediction
        return explain_prediction
    except ImportError as e:
        logger.warning(f"Explainer not available: {e}")
        return None


from db.database import get_session
from db.models import UsageAnalytics

@router.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest, background_tasks: BackgroundTasks) -> PredictionResponse:
    """
    Predict fermentation outcomes for a batch.
    
    Accepts macro process variables and optional microbial composition,
    returns predicted outcomes (acidity, ABV, off-flavor risk),
    a fermentation trajectory curve, and SHAP-based explanations.
    """
    # Validate product type
    try:
        product_type = ProductType(request.product_type)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported product type: {request.product_type}. "
                   f"Supported: {[pt.value for pt in ProductType]}",
        )
    
    prediction_id = str(uuid.uuid4())
    
    # Convert request to FermentationBatch
    batch = FermentationBatch(
        batch_id=prediction_id,
        product_type=product_type,
        starter_culture=request.starter_culture,
        temperature_c=request.temperature_c,
        substrate_conc=request.substrate_conc,
        salt_conc=request.salt_conc,
        ph_initial=request.ph_initial,
        duration_hours=request.duration_hours,
        vessel_size_l=request.vessel_size_l,
        microbial_composition=request.microbial_composition,
    )
    
    # Try the trained model predictor
    predict_fn = _load_predictor(product_type.value)
    if predict_fn is not None:
        try:
            result = predict_fn(batch)
            if getattr(result, "acidity", None) is not None:
                is_sim = getattr(result, "is_simulated_prediction", False)
                background_tasks.add_task(log_analytics, product_type.value, is_sim)
                
                confidence = {}
                if getattr(result, "acidity_ci", None):
                    confidence["acidity"] = {"lower": result.acidity_ci[0], "upper": result.acidity_ci[1]}
                if getattr(result, "alcohol_pct_ci", None):
                    confidence["alcohol_pct"] = {"lower": result.alcohol_pct_ci[0], "upper": result.alcohol_pct_ci[1]}
                
                # Default completion to 70% of duration
                completion_hours = batch.duration_hours * 0.7 if batch.duration_hours else 0.0
                
                top_explanations = []
                explain_fn = _load_explainer(product_type.value)
                if explain_fn is not None:
                    # Acidity model path as target for SHAP
                    model_path = getattr(result, "acidity_model_path", None)
                    if model_path:
                        try:
                            explainer_res = explain_fn(batch, model_path)
                            top_explanations = [ExplanationItem(**item) for item in explainer_res]
                        except Exception as e:
                            logger.warning(f"Failed to generate SHAP explanations: {e}")
                
                return PredictionResponse(
                    prediction_id=prediction_id,
                    product_type=product_type.value,
                    predicted_acidity=result.acidity,
                    predicted_alcohol_pct=result.alcohol_pct,
                    off_flavor_risk=result.off_flavor_risk or 0.0,
                    estimated_completion_hours=completion_hours,
                    fermentation_curve=result.fermentation_curve or [],
                    confidence=confidence,
                    top_explanations=top_explanations,
                    is_simulated_prediction=is_sim,
                )
        except Exception as e:
            logger.exception("Model prediction failed:")
            raise HTTPException(status_code=500, detail=f"Model prediction failed: {str(e)}")
    
    # ── Heuristic fallback (when models aren't trained yet) ─────────
    background_tasks.add_task(log_analytics, product_type.value, True)
    return _heuristic_predict(prediction_id, batch)


def _heuristic_predict(
    prediction_id: str, batch: FermentationBatch
) -> PredictionResponse:
    """
    Simple heuristic prediction based on domain knowledge.
    Used as fallback when trained models aren't available.
    """
    import math
    
    pt = batch.product_type.value
    temp = batch.temperature_c or 25.0
    ph0 = batch.ph_initial or (4.5 if pt == "kombucha" else 5.8)
    duration = batch.duration_hours or 240.0
    
    if pt == "kombucha":
        # Kombucha heuristics based on published fermentation kinetics
        rate = 0.003 * (temp / 25.0)  # pH drop rate scales with temp
        ph_final = max(2.5, ph0 - rate * duration)
        acidity = max(0.5, (ph0 - ph_final) * 2.5)  # rough g/L estimate
        alcohol = min(3.0, 0.005 * duration * (temp / 25.0))
        sugar_consumed = min(0.9, 0.003 * duration * (temp / 25.0))
        
        off_flavor = 0.1
        if temp > 30:
            off_flavor += 0.2
        if duration > 400:
            off_flavor += 0.15
        if temp < 20:
            off_flavor += 0.1
        off_flavor = min(0.95, off_flavor)
        
        metabolites = {
            "acetic_acid_g_l": round(acidity, 2),
            "ethanol_pct": round(alcohol, 2),
            "glucuronic_acid_g_l": round(0.3 + 0.001 * duration, 2),
        }
        
        # Generate fermentation curve
        curve = []
        for hour in range(0, int(duration) + 1, max(1, int(duration / 24))):
            t_frac = hour / max(duration, 1)
            curve.append(CurvePoint(
                hour=hour,
                ph=round(ph0 - (ph0 - ph_final) * (1 - math.exp(-3 * t_frac)), 2),
                acidity=round(acidity * (1 - math.exp(-3 * t_frac)), 2),
                sugar=round((batch.substrate_conc or 70) * (1 - sugar_consumed * (1 - math.exp(-2.5 * t_frac))), 1),
                ethanol=round(alcohol * (1 - math.exp(-2 * t_frac)), 3),
            ))
        
        completion = duration * 0.7  # rough estimate: 70% of target duration
        
    else:  # kimchi
        salt = batch.salt_conc or 3.0
        rate = 0.005 * (temp / 15.0) * (3.0 / max(salt, 1.0))
        ph_final = max(3.5, ph0 - rate * duration)
        acidity = max(0.3, (ph0 - ph_final) * 1.8)
        alcohol = 0.0  # kimchi doesn't produce significant alcohol
        
        off_flavor = 0.1
        if temp > 25:
            off_flavor += 0.25
        if salt < 2.0:
            off_flavor += 0.2
        if duration > 500:
            off_flavor += 0.15
        off_flavor = min(0.95, off_flavor)
        
        metabolites = {
            "lactic_acid_g_l": round(acidity, 2),
            "acetic_acid_g_l": round(acidity * 0.15, 2),
            "mannitol_g_l": round(0.5 + 0.001 * duration, 2),
        }
        
        curve = []
        for hour in range(0, int(duration) + 1, max(1, int(duration / 24))):
            t_frac = hour / max(duration, 1)
            curve.append(CurvePoint(
                hour=hour,
                ph=round(ph0 - (ph0 - ph_final) * (1 - math.exp(-3 * t_frac)), 2),
                acidity=round(acidity * (1 - math.exp(-3 * t_frac)), 2),
            ))
        
        completion = duration * 0.6
    
    # Generate heuristic explanations
    explanations = [
        ExplanationItem(
            feature="temperature_c",
            display_name="Temperature",
            shap_value=round((temp - 25) * 0.05, 3),
            direction="positive" if temp > 25 else "negative",
            explanation=f"Temperature of {temp}°C {'accelerates' if temp > 25 else 'slows'} fermentation rate",
        ),
        ExplanationItem(
            feature="duration_hours",
            display_name="Duration",
            shap_value=round(duration * 0.001, 3),
            direction="positive",
            explanation=f"Longer fermentation ({duration:.0f}h) increases acid production",
        ),
        ExplanationItem(
            feature="ph_initial",
            display_name="Initial pH",
            shap_value=round((ph0 - 4.5) * 0.1, 3),
            direction="positive" if ph0 > 4.5 else "negative",
            explanation=f"Starting pH of {ph0} provides {'more' if ph0 > 4.5 else 'less'} buffer capacity",
        ),
    ]
    
    return PredictionResponse(
        prediction_id=prediction_id,
        product_type=pt,
        predicted_acidity=round(acidity, 2),
        predicted_alcohol_pct=round(alcohol, 2) if alcohol > 0 else None,
        predicted_metabolites=metabolites,
        off_flavor_risk=round(off_flavor, 3),
        estimated_completion_hours=round(completion, 1),
        fermentation_curve=curve,
        confidence={
            "acidity": {"lower": round(acidity * 0.7, 2), "upper": round(acidity * 1.3, 2)},
            "off_flavor_risk": {"lower": round(off_flavor * 0.6, 3), "upper": round(min(1.0, off_flavor * 1.4), 3)},
        },
        top_explanations=explanations,
        community_cluster="balanced" if off_flavor < 0.3 else "off_flavor_prone",
        community_cluster_description=(
            "Your batch parameters align with historically balanced fermentations"
            if off_flavor < 0.3
            else "Parameters suggest elevated risk — consider adjusting temperature or duration"
        ),
        is_simulated_prediction=True,
    )
