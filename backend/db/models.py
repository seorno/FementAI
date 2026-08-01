"""
SQLAlchemy ORM models for FermentAI database.
"""

from __future__ import annotations

import json
from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """SQLAlchemy declarative base."""
    pass


class BatchRecord(Base):
    """
    ORM model for the fermentation_batches table.
    
    Maps directly to the FermentationBatch Pydantic schema.
    JSON fields are stored as TEXT and serialized/deserialized on access.
    """
    __tablename__ = "fermentation_batches"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    batch_id = Column(String(36), unique=True, nullable=False, index=True)
    product_type = Column(String(50), nullable=False, index=True)
    
    # Macro input variables
    starter_culture = Column(String(200), nullable=True)
    temperature_c = Column(Float, nullable=True)
    substrate_conc = Column(Float, nullable=True)
    salt_conc = Column(Float, nullable=True)
    ph_initial = Column(Float, nullable=True)
    ph_final = Column(Float, nullable=True)
    duration_hours = Column(Float, nullable=True)
    vessel_size_l = Column(Float, nullable=True)
    
    # JSON fields stored as TEXT
    microbial_composition_json = Column(Text, nullable=True)
    outcome_metabolites_json = Column(Text, nullable=True)
    fermentation_curve_json = Column(Text, nullable=True)
    data_quality_json = Column(Text, nullable=True)
    
    # Outcome variables
    outcome_acidity = Column(Float, nullable=True)
    outcome_alcohol_pct = Column(Float, nullable=True)
    outcome_off_flavor_risk = Column(Float, nullable=True)
    
    # Metadata
    data_source_type = Column(String(50), nullable=False, default="synthetic", index=True)
    source_dataset = Column(String(200), nullable=True)
    source_citation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    @property
    def microbial_composition(self) -> dict[str, float] | None:
        if self.microbial_composition_json:
            return json.loads(self.microbial_composition_json)
        return None
    
    @microbial_composition.setter
    def microbial_composition(self, value: dict[str, float] | None) -> None:
        self.microbial_composition_json = json.dumps(value) if value else None
    
    @property
    def outcome_metabolites(self) -> dict[str, float] | None:
        if self.outcome_metabolites_json:
            return json.loads(self.outcome_metabolites_json)
        return None
    
    @outcome_metabolites.setter
    def outcome_metabolites(self, value: dict[str, float] | None) -> None:
        self.outcome_metabolites_json = json.dumps(value) if value else None
    
    @property
    def fermentation_curve(self) -> list[dict[str, float]] | None:
        if self.fermentation_curve_json:
            return json.loads(self.fermentation_curve_json)
        return None
    
    @fermentation_curve.setter
    def fermentation_curve(self, value: list[dict[str, float]] | None) -> None:
        self.fermentation_curve_json = json.dumps(value) if value else None
    
    @property
    def data_quality(self) -> dict[str, str]:
        if self.data_quality_json:
            return json.loads(self.data_quality_json)
        return {}
    
    @data_quality.setter
    def data_quality(self, value: dict[str, str]) -> None:
        self.data_quality_json = json.dumps(value) if value else None
    
    def __repr__(self) -> str:
        return (
            f"<BatchRecord(batch_id={self.batch_id!r}, "
            f"product_type={self.product_type!r}, "
            f"source={self.source_dataset!r})>"
        )


class NetworkCache(Base):
    """
    Cached microbial interaction network per product type.
    
    Stores pre-computed network graph as JSON so it doesn't
    need to be recomputed on every API request.
    """
    __tablename__ = "microbial_networks"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    product_type = Column(String(50), unique=True, nullable=False, index=True)
    nodes_json = Column(Text, nullable=False)
    edges_json = Column(Text, nullable=False)
    clusters_json = Column(Text, nullable=True)
    computed_at = Column(DateTime, default=datetime.utcnow)
    batch_count = Column(Integer, nullable=True)  # How many batches were used
    data_provenance = Column(String(50), nullable=True, default="synthetic")
    
    @property
    def nodes(self) -> list[dict]:
        return json.loads(self.nodes_json)
    
    @nodes.setter
    def nodes(self, value: list[dict]) -> None:
        self.nodes_json = json.dumps(value)
    
    @property
    def edges(self) -> list[dict]:
        return json.loads(self.edges_json)
    
    @edges.setter
    def edges(self, value: list[dict]) -> None:
        self.edges_json = json.dumps(value)
    
    @property
    def clusters(self) -> list[dict] | None:
        if self.clusters_json:
            return json.loads(self.clusters_json)
        return None
    
    @clusters.setter
    def clusters(self, value: list[dict] | None) -> None:
        self.clusters_json = json.dumps(value) if value else None


class UsageAnalytics(Base):
    """
    Lightweight, privacy-respecting usage analytics.
    Tracks predictions over time.
    """
    __tablename__ = "usage_analytics"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    endpoint = Column(String(100), nullable=False)
    product_type = Column(String(50), nullable=True)
    is_simulated_prediction = Column(Integer, nullable=True)

