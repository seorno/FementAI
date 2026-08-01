"""
Parser for supplementary tables (CSV/Excel) from published studies.
"""

import pandas as pd
from typing import Any

from data.schema import FermentationBatch, ProductType, DataQualityFlag
from data.ingestion.parsers.base import BaseParser

class SupplementaryParser(BaseParser):
    """
    Parses CSV/Excel supplementary data tables commonly found in papers.
    Assumes standard column mapping is provided in dataset_config.
    """

    def parse(self, source_path: str, dataset_config: dict[str, Any]) -> list[FermentationBatch]:
        """Parse tabular data into FermentationBatch records."""
        if source_path.endswith('.csv'):
            df = pd.read_csv(source_path)
        elif source_path.endswith('.xlsx') or source_path.endswith('.xls'):
            df = pd.read_excel(source_path)
        else:
            raise ValueError(f"Unsupported file format for {source_path}")

        batches = []
        product_type_str = dataset_config.get("product_type", "kombucha")
        product_type = ProductType(product_type_str)
        dataset_name = dataset_config.get("dataset_name", "unknown")
        citation = dataset_config.get("citation", "")

        for _, row in df.iterrows():
            batch = FermentationBatch(
                product_type=product_type,
                source_dataset=dataset_name,
                source_citation=citation,
                temperature_c=row.get("temperature_c"),
                ph_initial=row.get("ph_initial"),
                ph_final=row.get("ph_final"),
                duration_hours=row.get("duration_hours"),
                data_quality={"temperature_c": DataQualityFlag.MEASURED}
            )
            batches.append(batch)
            
        return batches
