"""
FermentAI shared data schema.

One normalized schema for all fermentation product types. Product-specific
fields go in JSON columns (microbial_composition, outcome_metabolites)
rather than new top-level columns, so adding a new product type is a
config change, not a schema migration.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, field_validator


class ProductType(str, Enum):
    """Supported fermentation product types."""
    KOMBUCHA = "kombucha"
    KIMCHI = "kimchi"
    # Future: SOURDOUGH = "sourdough", YOGURT = "yogurt", KEFIR = "kefir", CHEESE = "cheese"


class DataSourceType(str, Enum):
    """Provenance of the batch data."""
    REAL_LITERATURE = "real_literature"
    SYNTHETIC = "synthetic"

class DataQualityFlag(str, Enum):
    """How a field's value was obtained."""
    MEASURED = "measured"
    IMPUTED = "imputed"
    SYNTHETIC = "synthetic"
    MISSING = "missing"

class FermentationBatch(BaseModel):
    """
    Core schema for a single fermentation batch record.
    
    All product types map into this same structure. Product-specific
    measurements go in the JSON columns (microbial_composition,
    outcome_metabolites) rather than new top-level fields.
    """
    # Identity
    batch_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_type: ProductType
    
    # Macro input variables
    starter_culture: str | None = None
    temperature_c: float | None = None
    substrate_conc: float | None = None  # g/L (sugar for kombucha)
    salt_conc: float | None = None       # % w/v (relevant for kimchi)
    ph_initial: float | None = None
    ph_final: float | None = None
    duration_hours: float | None = None
    vessel_size_l: float | None = None
    
    # Microbial composition (JSON: {genus_or_species: relative_abundance})
    # Relative abundances should sum to ~1.0
    microbial_composition: dict[str, float] | None = None
    
    # Outcome variables
    outcome_acidity: float | None = None        # g/L titratable acidity
    outcome_alcohol_pct: float | None = None    # % ABV
    outcome_metabolites: dict[str, float] | None = None  # {metabolite: concentration}
    outcome_off_flavor_risk: float | None = None  # 0.0 - 1.0 probability
    
    # Fermentation curve (time series)
    fermentation_curve: list[dict[str, float]] | None = None  # [{hour, ph, acidity, ...}]
    
    # Metadata
    data_source_type: DataSourceType = DataSourceType.SYNTHETIC
    source_dataset: str = "unknown"
    source_citation: str = ""
    data_quality: dict[str, DataQualityFlag] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    @field_validator("microbial_composition")
    @classmethod
    def validate_composition(cls, v: dict[str, float] | None) -> dict[str, float] | None:
        """Validate that relative abundances are non-negative."""
        if v is None:
            return v
        for species, abundance in v.items():
            if abundance < 0:
                raise ValueError(
                    f"Relative abundance for {species} cannot be negative: {abundance}"
                )
        return v
    
    @field_validator("outcome_off_flavor_risk")
    @classmethod
    def validate_off_flavor_risk(cls, v: float | None) -> float | None:
        """Off-flavor risk must be between 0 and 1."""
        if v is not None and not (0.0 <= v <= 1.0):
            raise ValueError(f"off_flavor_risk must be between 0 and 1, got {v}")
        return v
    
    def completeness_score(self) -> float:
        """
        Return fraction of core fields that are non-null.
        Useful for data quality reporting.
        """
        core_fields = [
            "temperature_c", "substrate_conc", "salt_conc", "ph_initial",
            "ph_final", "duration_hours", "microbial_composition",
            "outcome_acidity", "outcome_alcohol_pct"
        ]
        filled = sum(1 for f in core_fields if getattr(self, f) is not None)
        return filled / len(core_fields)
    
    def missing_fields(self) -> list[str]:
        """Return list of core fields that are None."""
        core_fields = [
            "temperature_c", "substrate_conc", "salt_conc", "ph_initial",
            "ph_final", "duration_hours", "microbial_composition",
            "outcome_acidity", "outcome_alcohol_pct"
        ]
        return [f for f in core_fields if getattr(self, f) is None]


# ── Key microbial taxa per product type ──────────────────────────────────

PRODUCT_TAXA: dict[str, list[str]] = {
    "kombucha": [
        "Komagataeibacter",
        "Acetobacter",
        "Gluconacetobacter",
        "Zygosaccharomyces",
        "Brettanomyces",
        "Saccharomyces",
        "Pichia",
        "Lactobacillus",
        "Oenococcus",
    ],
    "kimchi": [
        "Leuconostoc",
        "Lactobacillus",
        "Weissella",
        "Lactococcus",
        "Pediococcus",
        "Enterococcus",
    ],
}

# ── Default parameter ranges per product type (for UI defaults & validation) ─

PRODUCT_DEFAULTS: dict[str, dict[str, Any]] = {
    "kombucha": {
        "temperature_c": {"min": 18, "max": 32, "default": 25, "unit": "°C"},
        "substrate_conc": {"min": 40, "max": 120, "default": 70, "unit": "g/L sugar"},
        "ph_initial": {"min": 3.5, "max": 5.5, "default": 4.5, "unit": "pH"},
        "duration_hours": {"min": 72, "max": 504, "default": 240, "unit": "hours"},
        "vessel_size_l": {"min": 0.5, "max": 100, "default": 4, "unit": "L"},
        "key_taxa": PRODUCT_TAXA["kombucha"],
    },
    "kimchi": {
        "temperature_c": {"min": 2, "max": 30, "default": 15, "unit": "°C"},
        "salt_conc": {"min": 1.5, "max": 6.0, "default": 3.0, "unit": "% w/v"},
        "ph_initial": {"min": 5.0, "max": 7.0, "default": 5.8, "unit": "pH"},
        "duration_hours": {"min": 24, "max": 720, "default": 168, "unit": "hours"},
        "vessel_size_l": {"min": 0.5, "max": 50, "default": 2, "unit": "L"},
        "key_taxa": PRODUCT_TAXA["kimchi"],
    },
}
