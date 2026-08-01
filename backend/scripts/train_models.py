"""One-shot training script for FermentAI."""

import argparse
import logging
import json
from pathlib import Path

from db.database import init_db, get_default_engine, get_session
from db.models import NetworkCache
from models.outcome.trainer import train_product_models
from models.microbial.network import build_network, network_to_json
from models.microbial.community import build_community_model
from data.schema import PRODUCT_TAXA

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

MODELS_DIR = Path(__file__).parent.parent / "models" / "trained"

def run_training_pipeline():
    """Run the full training pipeline."""
    logger.info("Starting FermentAI training pipeline")
    
    engine = init_db()
    
    # Run data ingestion
    from data.ingestion.pipeline import run_pipeline
    logger.info("Running data ingestion pipeline...")
    run_pipeline()
    
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    
    report = {}
    
    for product_type in PRODUCT_TAXA.keys():
        logger.info(f"Processing {product_type}...")
        
        # 1. Train Outcome Models
        metrics = train_product_models(product_type, engine)
        report[product_type] = {"outcome_metrics": metrics}
        
        # 2. Build Microbial Network
        logger.info(f"Building microbial network for {product_type}")
        G, provenance, batch_count = build_network(product_type, engine)
        
        # 3. Build Community Model
        logger.info(f"Building community model for {product_type}")
        community_model = build_community_model(product_type, engine)
        
        # Save Network and Community to DB Cache
        with get_session(engine) as session:
            cache = session.query(NetworkCache).filter_by(product_type=product_type).first()
            if not cache:
                cache = NetworkCache(product_type=product_type)
                session.add(cache)
                
            net_json = network_to_json(G)
            cache.nodes = net_json["nodes"]
            cache.edges = net_json["edges"]
            cache.clusters = [
                {"centroid": c, "label": l} 
                for c, l in zip(community_model.centroids, community_model.labels)
            ]
            cache.batch_count = batch_count
            cache.data_provenance = provenance
            
    # Print validation report
    print("\n" + "="*50)
    print("TRAINING VALIDATION REPORT")
    print("="*50)
    print(json.dumps(report, indent=2))
    print("="*50)
    
    logger.info("Training pipeline complete.")

if __name__ == "__main__":
    run_training_pipeline()
