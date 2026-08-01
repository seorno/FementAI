"""
Base parser interface for FermentAI data ingestion.
"""

from abc import ABC, abstractmethod
from typing import Any

from data.schema import FermentationBatch


class BaseParser(ABC):
    """
    Abstract base class for all data parsers.
    Parsers are responsible for reading a raw data source and returning
    a list of unnormalized FermentationBatch records.
    """

    @abstractmethod
    def parse(self, source_path: str, dataset_config: dict[str, Any]) -> list[FermentationBatch]:
        """
        Parse the source data into a list of FermentationBatch records.

        Args:
            source_path: Path to the data source (file, directory, etc.)
            dataset_config: Configuration dictionary for the dataset

        Returns:
            List of FermentationBatch objects.
        """
        pass
