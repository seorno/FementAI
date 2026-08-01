"""
Main orchestrator for FermentAI data ingestion.
"""

import yaml
from pathlib import Path

from db.database import get_session, init_db
from db.models import BatchRecord
from data.ingestion.normalizer import BatchNormalizer
from data.ingestion.parsers.literature import LiteratureParser
from data.ingestion.synthetic.generator import generate_synthetic_batches

CONFIG_PATH = Path(__file__).parent / "config.yaml"


def load_config() -> dict:
    """Load the dataset registry config."""
    with open(CONFIG_PATH, "r") as f:
        return yaml.safe_load(f)


def run_pipeline() -> None:
    """Run the complete data ingestion pipeline."""
    config = load_config()
    datasets = config.get("datasets", {})
    
    all_batches = []
    
    # Parse real literature datasets
    literature_parser = LiteratureParser()
    for ds_name, ds_config in datasets.items():
        ds_config["dataset_name"] = ds_name
        if ds_config.get("source_type") == "literature":
            batches = literature_parser.parse("", ds_config)
            all_batches.extend(batches)
            
    # Generate synthetic data
    kombucha_synthetic = generate_synthetic_batches("kombucha", count=500)
    kimchi_synthetic = generate_synthetic_batches("kimchi", count=500)
    
    all_batches.extend(kombucha_synthetic)
    all_batches.extend(kimchi_synthetic)
    
    # Normalize
    normalizer = BatchNormalizer()
    normalized_batches = normalizer.normalize(all_batches)
    
    # Save to database
    engine = init_db()
    
    inserted_count = 0
    with get_session(engine) as session:
        # Get existing batch IDs
        existing = {row[0] for row in session.query(BatchRecord.batch_id).all()}
        
        for batch in normalized_batches:
            if batch.batch_id in existing:
                continue
                
            record = BatchRecord(
                batch_id=batch.batch_id,
                product_type=batch.product_type.value,
                starter_culture=batch.starter_culture,
                temperature_c=batch.temperature_c,
                substrate_conc=batch.substrate_conc,
                salt_conc=batch.salt_conc,
                ph_initial=batch.ph_initial,
                ph_final=batch.ph_final,
                duration_hours=batch.duration_hours,
                vessel_size_l=batch.vessel_size_l,
                microbial_composition=batch.microbial_composition,
                outcome_metabolites=batch.outcome_metabolites,
                fermentation_curve=batch.fermentation_curve,
                data_quality={k: v.value if hasattr(v, "value") else v for k, v in batch.data_quality.items()},
                outcome_acidity=batch.outcome_acidity,
                outcome_alcohol_pct=batch.outcome_alcohol_pct,
                outcome_off_flavor_risk=batch.outcome_off_flavor_risk,
                data_source_type=batch.data_source_type.value,
                source_dataset=batch.source_dataset,
                source_citation=batch.source_citation
            )
            session.add(record)
            inserted_count += 1
            
    print(f"Successfully ingested {inserted_count} batches.")


if __name__ == "__main__":
    run_pipeline()
