"""Curated interaction knowledge base."""

from __future__ import annotations

# Known biological interactions per product type
KNOWLEDGE_BASE = {
    "kombucha": [
        {
            "source": "Saccharomyces",
            "target": "Komagataeibacter",
            "type": "cross_feeding",
            "mechanism": "Yeast produces ethanol which bacteria oxidizes to acetic acid",
            "effect_on_outcome": "Increases acidity",
            "citation": "Villarreal-Soto et al., 2018"
        },
        {
            "source": "Zygosaccharomyces",
            "target": "Brettanomyces",
            "type": "competition",
            "mechanism": "Competition for simple sugars in early fermentation",
            "effect_on_outcome": "Alters aroma profile",
            "citation": "Tran et al., 2020"
        },
        {
            "source": "Acetobacter",
            "target": "Saccharomyces",
            "type": "inhibition",
            "mechanism": "High acetic acid levels inhibit yeast growth and fermentation",
            "effect_on_outcome": "Stops alcohol production, limits final ABV",
            "citation": "Coton et al., 2017"
        },
        {
            "source": "Lactobacillus",
            "target": "Gluconacetobacter",
            "type": "synergy",
            "mechanism": "Lactic acid enhances cellulose production structure",
            "effect_on_outcome": "Improves pellicle formation",
            "citation": "Nguyen et al., 2015"
        },
        {
            "source": "Pichia",
            "target": "Acetobacter",
            "type": "competition",
            "mechanism": "Oxygen competition at the surface",
            "effect_on_outcome": "Can lead to off-flavors if Pichia dominates",
            "citation": "Chakravorty et al., 2016"
        },
        {
            "source": "Saccharomyces",
            "target": "Lactobacillus",
            "type": "cross_feeding",
            "mechanism": "Yeast provides vitamins/amino acids required by LAB",
            "effect_on_outcome": "Increases overall lactic acid",
            "citation": "Villarreal-Soto et al., 2018"
        },
        {
            "source": "Brettanomyces",
            "target": "Saccharomyces",
            "type": "succession",
            "mechanism": "Brettanomyces thrives on complex carbohydrates after Saccharomyces depletes simple sugars",
            "effect_on_outcome": "Produces phenolic, funk flavors",
            "citation": "Tran et al., 2020"
        },
        {
            "source": "Komagataeibacter",
            "target": "Zygosaccharomyces",
            "type": "synergy",
            "mechanism": "Bacterial cellulose protects yeast from environmental stress",
            "effect_on_outcome": "Maintains community stability",
            "citation": "Coton et al., 2017"
        }
    ],
    "kimchi": [
        {
            "source": "Leuconostoc",
            "target": "Lactobacillus",
            "type": "succession",
            "mechanism": "Leuconostoc lowers pH initially, then Lactobacillus takes over",
            "effect_on_outcome": "Drives pH drop from 6 to <4.5",
            "citation": "Jung et al., 2014"
        },
        {
            "source": "Weissella",
            "target": "Lactobacillus",
            "type": "competition",
            "mechanism": "Competition for carbohydrates in early stages",
            "effect_on_outcome": "Affects balance of lactic vs acetic acid",
            "citation": "Lee et al., 2015"
        },
        {
            "source": "Leuconostoc",
            "target": "Weissella",
            "type": "synergy",
            "mechanism": "Both are heterofermentative, co-producing CO2 and ethanol",
            "effect_on_outcome": "Enhances characteristic kimchi flavor (carbonation)",
            "citation": "Choi et al., 2003"
        },
        {
            "source": "Lactobacillus",
            "target": "Enterococcus",
            "type": "inhibition",
            "mechanism": "Rapid acidification inhibits enterococci growth",
            "effect_on_outcome": "Improves safety and prevents spoilage",
            "citation": "Jung et al., 2014"
        },
        {
            "source": "Pediococcus",
            "target": "Lactobacillus",
            "type": "succession",
            "mechanism": "Pediococcus can dominate in high salt conditions before Lactobacillus",
            "effect_on_outcome": "Alters acidity profile in high-salt fermentations",
            "citation": "Lee et al., 2015"
        },
        {
            "source": "Lactococcus",
            "target": "Leuconostoc",
            "type": "competition",
            "mechanism": "Competes for initial nutrients in low-salt or fast fermentations",
            "effect_on_outcome": "Can reduce complexity of flavor if Lactococcus dominates",
            "citation": "Choi et al., 2003"
        },
        {
            "source": "Leuconostoc",
            "target": "Pediococcus",
            "type": "inhibition",
            "mechanism": "Leuconostoc produces bacteriocins that inhibit some Pediococcus strains",
            "effect_on_outcome": "Maintains Leuconostoc dominance for optimal flavor",
            "citation": "Jung et al., 2014"
        },
        {
            "source": "Lactobacillus",
            "target": "Lactobacillus",
            "type": "succession",
            "mechanism": "Transition from L. sakei to L. plantarum as acidity increases",
            "effect_on_outcome": "Signals over-ripening or extreme sourness",
            "citation": "Lee et al., 2015"
        }
    ]
}

def get_interactions(product_type: str) -> list[dict[str, str]]:
    """Get known interactions for a product type."""
    return KNOWLEDGE_BASE.get(product_type, [])
