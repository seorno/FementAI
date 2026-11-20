"""Public v1 screening contract, separate from legacy research predictions."""
from fastapi import APIRouter
from domain.feasibility import FeasibilityRequest, FeasibilityResponse, assess

router = APIRouter(tags=["studio-feasibility"])


@router.post("/recommendations", response_model=FeasibilityResponse)
def screen_design(request: FeasibilityRequest) -> FeasibilityResponse:
    """Return explicit blockers/missing evidence; never fabricate a recipe."""
    return assess(request)
