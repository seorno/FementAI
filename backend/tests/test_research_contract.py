"""Research endpoints must stay clearly distinct from the new consumer studio."""
from fastapi.testclient import TestClient
from api.main import app
from api.schemas import PredictionRequest
from data.schema import ProductType

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_research_product_scope():
    assert {item.value for item in ProductType} == {"kombucha", "kimchi"}
    assert client.get("/api/products").status_code == 200

def test_alcohol_cider_not_silently_treated_as_kombucha():
    payload = PredictionRequest(
        product_type="cider", temperature_c=20, ph_initial=3.5, duration_hours=240
    ).model_dump()
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 400
    assert "Unsupported product type" in response.json()["detail"]
