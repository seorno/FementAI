"""
FermentAI API — FastAPI application.

Serves prediction, network, and product metadata endpoints
for the FermentAI frontend.
"""

from __future__ import annotations

import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import analytics, explain, network, predict, products, feasibility

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ── App creation ────────────────────────────────────────────────────────

app = FastAPI(
    title="FermentAI",
    description=(
        "Predict fermentation outcomes by modeling the microbial community. "
        "Supports kombucha and kimchi with extensible schema for additional "
        "product types."
    ),
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ────────────────────────────────────────────────────────────────

_raw_origins = os.environ.get(
    "FERMENTAI_CORS_ORIGINS",
    "http://localhost:3000,http://localhost:8000"
).split(",")

_ALLOWED_ORIGINS = [
    origin.strip().rstrip("/") 
    for origin in _raw_origins 
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict.router, prefix="/api")
app.include_router(network.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(explain.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(feasibility.router, prefix="/api/v1")


@app.get("/health")
def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy", "service": "fermentai"}


@app.on_event("startup")
def startup_event():
    """Initialize database on startup."""
    logger.info("FermentAI API starting up...")
    try:
        from db.database import init_db
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.warning(f"Database initialization skipped: {e}")
    logger.info("FermentAI API ready")
