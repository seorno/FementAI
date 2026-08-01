"""
Pydantic request/response schemas for the FermentAI API.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


# ── Request Schemas ─────────────────────────────────────────────────────


class PredictionRequest(BaseModel):
    """Input batch parameters for fermentation outcome prediction."""
    
    product_type: str = Field(
        ..., description="Fermentation product type: 'kombucha' or 'kimchi'"
    )
    temperature_c: float = Field(
        ..., description="Fermentation temperature in Celsius"
    )
    substrate_conc: float | None = Field(
        None, description="Substrate/sugar concentration in g/L (kombucha)"
    )
    salt_conc: float | None = Field(
        None, description="Salt concentration in % w/v (kimchi)"
    )
    ph_initial: float = Field(
        ..., description="Initial pH of the fermentation"
    )
    duration_hours: float = Field(
        ..., description="Target fermentation duration in hours"
    )
    vessel_size_l: float | None = Field(
        None, description="Vessel size in liters"
    )
    starter_culture: str | None = Field(
        None, description="Starter culture description"
    )
    microbial_composition: dict[str, float] | None = Field(
        None,
        description="Optional microbial community composition: {genus: relative_abundance}",
    )

    model_config = {"json_schema_extra": {
        "examples": [{
            "product_type": "kombucha",
            "temperature_c": 25.0,
            "substrate_conc": 70.0,
            "ph_initial": 4.5,
            "duration_hours": 240,
            "vessel_size_l": 4.0,
            "microbial_composition": {
                "Komagataeibacter": 0.45,
                "Acetobacter": 0.10,
                "Zygosaccharomyces": 0.25,
                "Brettanomyces": 0.10,
                "Lactobacillus": 0.05,
                "Other": 0.05,
            },
        }]
    }}


# ── Response Schemas ────────────────────────────────────────────────────


class CurvePoint(BaseModel):
    """A single point on the fermentation curve."""
    hour: float
    ph: float | None = None
    acidity: float | None = None
    sugar: float | None = None
    ethanol: float | None = None


class ExplanationItem(BaseModel):
    """A single SHAP-based explanation for a prediction."""
    feature: str = Field(..., description="Technical feature name")
    display_name: str = Field(..., description="User-friendly feature name")
    shap_value: float = Field(..., description="SHAP contribution value")
    direction: str = Field(..., description="'positive' or 'negative' effect")
    explanation: str = Field(..., description="Human-readable explanation text")


class PredictionResponse(BaseModel):
    """Full prediction result for a fermentation batch."""
    
    prediction_id: str
    product_type: str
    
    # Predicted outcomes
    predicted_acidity: float = Field(..., description="Predicted titratable acidity (g/L)")
    predicted_alcohol_pct: float | None = Field(None, description="Predicted ABV %")
    predicted_metabolites: dict[str, float] = Field(
        default_factory=dict, description="Predicted metabolite concentrations"
    )
    off_flavor_risk: float = Field(
        ..., description="Off-flavor risk probability (0.0 - 1.0)"
    )
    estimated_completion_hours: float = Field(
        ..., description="Estimated optimal fermentation completion time"
    )
    
    # Time series
    fermentation_curve: list[CurvePoint] = Field(
        default_factory=list, description="Predicted fermentation trajectory"
    )
    
    # Confidence
    confidence: dict[str, dict[str, float]] = Field(
        default_factory=dict,
        description="Confidence intervals: {metric: {lower, upper}}",
    )
    
    # Explainability
    top_explanations: list[ExplanationItem] = Field(
        default_factory=list, description="Top SHAP-based feature explanations"
    )
    
    # Community context
    community_cluster: str | None = Field(
        None, description="Which outcome cluster this batch aligns with"
    )
    community_cluster_description: str | None = Field(
        None, description="Description of the matched community cluster"
    )
    is_simulated_prediction: bool = Field(
        False, description="True if a synthetic fallback model was used"
    )


# ── Network Schemas ─────────────────────────────────────────────────────


class NetworkNode(BaseModel):
    """A node in the microbial interaction network."""
    id: str
    label: str
    size: float = Field(..., description="Relative abundance-based size")
    group: str = Field(..., description="Taxonomic group (e.g., 'bacteria', 'yeast')")
    abundance_mean: float
    hub_score: float = Field(0.0, description="Betweenness centrality score")
    outcome_association: str | None = Field(
        None, description="Associated outcome tendency"
    )


class NetworkEdge(BaseModel):
    """An edge in the microbial interaction network."""
    source: str
    target: str
    weight: float = Field(..., description="Correlation coefficient")
    interaction_type: str = Field(..., description="'positive' or 'negative'")
    mechanism: str | None = Field(None, description="Known biological mechanism")
    p_value: float | None = None


class NetworkCluster(BaseModel):
    """A community cluster in the network."""
    id: str
    label: str
    outcome_profile: str
    description: str
    taxa: list[str] = Field(default_factory=list)


class NetworkResponse(BaseModel):
    """Full microbial interaction network for a product type."""
    product_type: str
    nodes: list[NetworkNode]
    edges: list[NetworkEdge]
    clusters: list[NetworkCluster] = Field(default_factory=list)
    batch_count: int = Field(0, description="Number of batches used to build network")
    data_provenance: str = Field("synthetic", description="real, synthetic, or blended")


# ── Product Schemas ─────────────────────────────────────────────────────


class ParameterRange(BaseModel):
    """Valid range for an input parameter."""
    min: float
    max: float
    default: float
    unit: str


class ProductInfo(BaseModel):
    """Metadata about a supported product type."""
    product_type: str
    display_name: str
    description: str
    parameters: dict[str, ParameterRange]
    key_taxa: list[str]
    batch_count: int = 0


class ProductListResponse(BaseModel):
    """List of supported product types."""
    products: list[ProductInfo]
