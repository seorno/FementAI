"""Versioned, source-attributed cider preparation evidence, not a validated recipe.

Sources reviewed 2026-11-20. These references describe general cider processes
and apple-juice hygiene; neither independently validates a specific Ferment AI
recipe, packaging method, serving deadline, or batch safety.
"""
from __future__ import annotations
from pydantic import BaseModel

PENN_STATE = "https://extension.psu.edu/food-safety-and-quality/beer-hard-cider-and-distilled-spirits/production"
MAINE = "https://extension.umaine.edu/publications/4191e/"
ORCHARD = "https://www.theorchardproject.org.uk/guides_and_advice/community-cider-making/"


class CiderEvidence(BaseModel):
    version: str = "cider-evidence-v1"
    scope: str = "Educational preparation checkpoints for still cider; not a recipe or safety certification."
    source_urls: list[str]
    checkpoints: list[str]
    unresolved: list[str]


def cider_evidence(*, ingredients: list[str], equipment: list[str],
                   carbonation: str, blocked: bool) -> CiderEvidence | None:
    """Only display educational guidance for unblocked, still-cider requests."""
    if blocked or carbonation != "still":
        return None
    inventory = {x.strip().lower() for x in ingredients}
    gear = {x.strip().lower() for x in equipment}
    checkpoints = [
        "Use commercially pasteurised, preservative-free apple juice as the preferred starting material; check its label (Penn State Extension).",
        "Clean and sanitise all juice-contact equipment; do not use spoiled or mouldy apples (University of Maine Extension).",
        "Use a suitable fermentation vessel and vented airlock, not a sealed pressure vessel; monitor it during fermentation (The Orchard Project).",
        "Keep a dated batch record and obtain appropriate gravity measurements; bubbles or elapsed days alone do not establish completion.",
        "Do not bottle, sweeten, carbonate or consume on the basis of this educational checklist; a validated packaging and batch-specific safety procedure is missing.",
    ]
    unresolved = [
        "No Ferment AI recipe has been independently validated for ingredient quantities, yeast strain, temperature, duration or finished product.",
        "No verified stable-gravity, microbiological, packaging or consumption-safety determination is available.",
    ]
    if "apple juice" not in inventory:
        unresolved.append("Confirm pasteurised, preservative-free apple juice before choosing a cider process.")
    if "yeast" not in inventory:
        unresolved.append("Confirm an appropriate cider yeast and follow its manufacturer instructions.")
    if "hydrometer" not in gear:
        unresolved.append("Obtain a hydrometer for batch observations; a single reading cannot confirm fermentation completion.")
    return CiderEvidence(source_urls=[PENN_STATE, MAINE, ORCHARD],
                         checkpoints=checkpoints, unresolved=unresolved)
