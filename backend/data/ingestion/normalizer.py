"""
Data normalizer for FermentAI ingestion pipeline.
"""

from data.schema import FermentationBatch, DataQualityFlag

class BatchNormalizer:
    """
    Normalizes FermentationBatch records, handles unit conversions,
    and flags missing data rather than dropping records.
    """

    def normalize(self, batches: list[FermentationBatch]) -> list[FermentationBatch]:
        """Normalize a list of batches."""
        normalized = []
        for batch in batches:
            norm_batch = self._normalize_single(batch)
            normalized.append(norm_batch)
        return normalized

    def _normalize_single(self, batch: FermentationBatch) -> FermentationBatch:
        """Normalize a single batch."""
        # Check core fields and flag missing ones
        missing = batch.missing_fields()
        for field in missing:
            batch.data_quality[field] = DataQualityFlag.MISSING
            
        # Ensure microbial composition sums to ~1.0
        if batch.microbial_composition:
            total = sum(batch.microbial_composition.values())
            if total > 0:
                batch.microbial_composition = {
                    k: v / total for k, v in batch.microbial_composition.items()
                }

        return batch
