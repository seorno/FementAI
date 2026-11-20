"""Conservative, deterministic screening for UK adult home-fermentation designs.

This is NOT a recipe generator or a safety certification. No unverified
cider/mead/wine recipes or alcohol-strength estimates are returned.
"""
from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, model_validator
from domain.cider_evidence import CiderEvidence, cider_evidence


class FeasibilityRequest(BaseModel):
    locale: Literal["GB"] = "GB"
    adult_confirmed: bool = False
    beverage: Literal["cider", "mead", "fruit_wine", "spirits", "other"]
    desired_date: date | None = None
    ingredients: list[str] = Field(default_factory=list, max_length=30)
    equipment: list[str] = Field(default_factory=list, max_length=30)
    carbonation: Literal["still", "gentle", "sparkling"] = "still"
    wants_bottling_instructions: bool = False
    contamination_concern: bool = False
    pressure_concern: bool = False

    @model_validator(mode="after")
    def check_items(self):
        for item in self.ingredients + self.equipment:
            if not item.strip() or len(item) > 80:
                raise ValueError("Inventory items must contain 1–80 non-whitespace characters")
        return self


class FeasibilityResponse(BaseModel):
    status: Literal["unsupported", "needs_information"]
    data_provenance: Literal["rule_based_screen"]
    template_version: str
    reasons: list[str]
    missing_information: list[str]
    safety_warnings: list[str]
    supporting_sources: list[str]
    cider_preparation_evidence: CiderEvidence | None = None
    recipe: None = None
    estimated_abv: None = None
    safe_to_consume: None = None


SOURCE_HMRC = "https://www.gov.uk/guidance/check-if-you-need-an-alcoholic-products-producer-approval-appa"
SOURCE_CAP = "https://www.asa.org.uk/type/non_broadcast/code_section/18.html"
SUPPORTED = {"cider", "mead", "fruit_wine"}


def assess(request: FeasibilityRequest, today: date | None = None) -> FeasibilityResponse:
    today = today or date.today()
    reasons: list[str] = []
    missing: list[str] = []
    warnings: list[str] = [
        "Screening does not establish food safety, fermentation completion or suitability for consumption.",
        "Do not rely on smell, appearance, pH or an estimated alcohol strength alone to certify safety.",
    ]
    blocked = False

    if not request.adult_confirmed:
        blocked = True
        reasons.append("Alcohol design is restricted to adults who acknowledge the age requirement.")
    if request.beverage not in SUPPORTED:
        blocked = True
        reasons.append("Only non-distilled cider, mead and fruit wine are in the intended UK scope; spirits and other categories are unsupported.")
    if request.contamination_concern:
        blocked = True
        reasons.append("A contamination concern requires conservative stop/discard guidance, not a recipe recommendation.")
        warnings.append("Do not taste a batch to check suspected contamination; stop use and seek appropriate local safety guidance.")
    if request.pressure_concern:
        blocked = True
        reasons.append("A reported pressure concern prevents bottling or carbonation guidance.")
        warnings.append("Do not open or handle a pressurised vessel casually; seek appropriate safe-handling guidance.")
    if request.desired_date is None:
        missing.append("Desired serving date")
    elif request.desired_date <= today:
        blocked = True
        reasons.append("A same-day or past deadline cannot support a new fermentation plan.")
    if not request.ingredients:
        missing.append("Ingredient inventory")
    if not request.equipment:
        missing.append("Equipment inventory")
    else:
        normalized = {item.strip().lower() for item in request.equipment}
        for essential in ("fermentation vessel", "airlock", "sanitiser"):
            if essential not in normalized:
                missing.append(f"Confirm equipment: {essential}")
    if request.carbonation != "still" or request.wants_bottling_instructions:
        missing.append("Validated carbonation, stable-gravity and pressure-safe packaging procedure")
        warnings.append("Residual fermentable sugar and active fermentation can create dangerous bottle pressure; no bottling procedure is provided.")
    if not blocked:
        reasons.append("No source-reviewed, validated consumer recipe template is available yet; feasibility cannot be confirmed.")
    return FeasibilityResponse(
        status="unsupported" if blocked else "needs_information",
        data_provenance="rule_based_screen",
        template_version="screen-v1",
        reasons=reasons,
        missing_information=list(dict.fromkeys(missing)),
        safety_warnings=warnings,
        supporting_sources=[SOURCE_HMRC, SOURCE_CAP],
        cider_preparation_evidence=(cider_evidence(ingredients=request.ingredients,
            equipment=request.equipment, carbonation=request.carbonation, blocked=blocked)
            if request.beverage == 'cider' else None),
    )
