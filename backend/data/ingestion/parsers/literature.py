"""
Parser for hard-coded literature values.
"""

from typing import Any

from data.schema import FermentationBatch, ProductType, DataQualityFlag, DataSourceType
from data.ingestion.parsers.base import BaseParser


class LiteratureParser(BaseParser):
    """
    Creates FermentationBatch records from curated, hard-coded literature values.
    Used when raw data is not available, but summary statistics are published.
    """

    def parse(self, source_path: str, dataset_config: dict[str, Any]) -> list[FermentationBatch]:
        """Returns pre-defined representative batches based on dataset_config."""
        dataset_name = dataset_config.get("dataset_name", "unknown")
        
        batches = []
        if dataset_name == "huang_2022_kombucha":
            # From Ohwofasa et al. 2024 / Barbosa 2021 / Suhre 2021 summaries
            # High Komagataeibacter (>30-90%) -> high acidity, lower pH. Alcohol ~0.2-2.5%
            batches.append(FermentationBatch(
                product_type=ProductType.KOMBUCHA,
                data_source_type=DataSourceType.REAL_LITERATURE,
                source_dataset="Suhre_2021_Kombucha_1",
                source_citation="Suhre et al., 2021 (DOI: 10.26502/jfsnr.2642-11000082)",
                temperature_c=25.0,
                ph_initial=4.5,
                ph_final=2.8,
                duration_hours=288.0, # 12 days
                microbial_composition={"Komagataeibacter": 0.85, "Zygosaccharomyces": 0.10, "Brettanomyces": 0.05},
                outcome_alcohol_pct=2.54,
                outcome_acidity=8.5,
                data_quality={"temperature_c": DataQualityFlag.IMPUTED, "ph_final": DataQualityFlag.MEASURED}
            ))
            batches.append(FermentationBatch(
                product_type=ProductType.KOMBUCHA,
                data_source_type=DataSourceType.REAL_LITERATURE,
                source_dataset="Ohwofasa_2024_Kombucha_2",
                source_citation="Ohwofasa et al., 2024 (DOI: 10.1016/j.crfs.2024.100694)",
                temperature_c=22.0,
                ph_initial=4.2,
                ph_final=3.2,
                duration_hours=168.0, # 7 days
                microbial_composition={"Komagataeibacter": 0.45, "Acetobacter": 0.20, "Saccharomyces": 0.35},
                outcome_alcohol_pct=0.8,
                outcome_acidity=4.2,
                data_quality={"temperature_c": DataQualityFlag.IMPUTED, "ph_final": DataQualityFlag.MEASURED}
            ))
            batches.append(FermentationBatch(
                product_type=ProductType.KOMBUCHA,
                data_source_type=DataSourceType.REAL_LITERATURE,
                source_dataset="Barbosa_2021_Kombucha_3",
                source_citation="Barbosa et al., 2021 (DOI: 10.1016/j.lwt.2021.111788)",
                temperature_c=24.0,
                ph_initial=4.8,
                ph_final=3.5,
                duration_hours=120.0, # 5 days
                microbial_composition={"Komagataeibacter": 0.35, "Brettanomyces": 0.40, "Lactobacillus": 0.25},
                outcome_alcohol_pct=1.2,
                outcome_acidity=3.0,
                data_quality={"temperature_c": DataQualityFlag.IMPUTED, "ph_final": DataQualityFlag.MEASURED}
            ))
        elif dataset_name == "zabat_2018_kimchi":
            # From Jung 2011 / Lee 2017 summaries
            # Initial pH ~5.0-6.4, salt 1.7-4.4%. 
            # Shifts from Leuconostoc to Lactobacillus (Lactiplantibacillus) and Weissella. pH drops to ~4.2.
            batches.append(FermentationBatch(
                product_type=ProductType.KIMCHI,
                data_source_type=DataSourceType.REAL_LITERATURE,
                source_dataset="Jung_2011_Kimchi_1",
                source_citation="Jung et al., 2011 (DOI: 10.1128/AEM.02157-10)",
                temperature_c=15.0,
                ph_initial=5.5,
                ph_final=4.2,
                duration_hours=480.0, # 20 days
                salt_conc=3.0,
                microbial_composition={"Leuconostoc": 0.15, "Lactobacillus": 0.65, "Weissella": 0.20},
                outcome_acidity=3.5,
                data_quality={"temperature_c": DataQualityFlag.IMPUTED, "ph_final": DataQualityFlag.MEASURED}
            ))
            batches.append(FermentationBatch(
                product_type=ProductType.KIMCHI,
                data_source_type=DataSourceType.REAL_LITERATURE,
                source_dataset="Lee_2017_Kimchi_2",
                source_citation="Lee et al., 2017 (DOI: 10.1016/j.fm.2017.05.002)",
                temperature_c=10.0,
                ph_initial=6.39,
                ph_final=4.1,
                duration_hours=672.0, # 28 days
                salt_conc=4.42,
                microbial_composition={"Leuconostoc": 0.25, "Lactobacillus": 0.55, "Weissella": 0.10, "Pediococcus": 0.10},
                outcome_acidity=4.0,
                data_quality={"temperature_c": DataQualityFlag.IMPUTED, "ph_final": DataQualityFlag.MEASURED}
            ))
            batches.append(FermentationBatch(
                product_type=ProductType.KIMCHI,
                data_source_type=DataSourceType.REAL_LITERATURE,
                source_dataset="Lee_2017_Kimchi_3",
                source_citation="Lee et al., 2017 (DOI: 10.1016/j.fm.2017.05.002)",
                temperature_c=20.0,
                ph_initial=5.00,
                ph_final=3.8,
                duration_hours=168.0, # 7 days
                salt_conc=1.72,
                microbial_composition={"Leuconostoc": 0.05, "Lactobacillus": 0.85, "Weissella": 0.05, "Lactococcus": 0.05},
                outcome_acidity=4.5,
                data_quality={"temperature_c": DataQualityFlag.IMPUTED, "ph_final": DataQualityFlag.MEASURED}
            ))
        return batches
