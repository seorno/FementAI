import os
from fastapi import APIRouter, Header, HTTPException
from sqlalchemy import func
from db.database import get_session
from db.models import UsageAnalytics
from typing import Dict, Any

router = APIRouter(tags=["analytics"])

@router.get("/analytics")
def get_analytics(x_admin_token: str | None = Header(default=None)) -> Dict[str, Any]:
    """
    Returns basic usage analytics from the internal SQLite/Postgres table.
    """
    expected_token = os.environ.get("FERMENTAI_ADMIN_TOKEN")
    if expected_token and x_admin_token != expected_token:
        raise HTTPException(status_code=401, detail="Unauthorized")

    with get_session() as session:
        total_predictions = session.query(func.count(UsageAnalytics.id)).scalar() or 0
        
        simulated_count = session.query(func.count(UsageAnalytics.id)).filter(
            UsageAnalytics.is_simulated_prediction == 1
        ).scalar() or 0
        
        real_count = total_predictions - simulated_count
        
        # Group by product type
        product_counts = session.query(
            UsageAnalytics.product_type, 
            func.count(UsageAnalytics.id)
        ).group_by(UsageAnalytics.product_type).all()
        
        product_stats = {pt: count for pt, count in product_counts if pt}
        
    return {
        "total_predictions": total_predictions,
        "real_data_predictions": real_count,
        "simulated_fallback_predictions": simulated_count,
        "product_breakdown": product_stats
    }
