"""Contract and conservative failure-mode tests for the consumer screen."""
from datetime import date, timedelta

import pytest
from pydantic import ValidationError

from domain.feasibility import FeasibilityRequest, assess


def request(**overrides):
    values = dict(
        adult_confirmed=True, beverage="cider",
        desired_date=date.today() + timedelta(days=40),
        ingredients=["apple juice", "yeast"],
        equipment=["fermentation vessel", "airlock", "sanitiser"],
    )
    values.update(overrides)
    return FeasibilityRequest(**values)


def test_no_validated_recipe_even_with_complete_inventory():
    result = assess(request())
    assert result.status == "needs_information"
    assert result.recipe is None and result.estimated_abv is None
    assert result.safe_to_consume is None
    assert result.data_provenance == "rule_based_screen"
    assert any("source-reviewed" in reason for reason in result.reasons)


@pytest.mark.parametrize("changes", [
    {"adult_confirmed": False},
    {"beverage": "spirits"},
    {"beverage": "other"},
    {"contamination_concern": True},
    {"pressure_concern": True},
    {"desired_date": date.today()},
])
def test_hard_blockers(changes):
    assert assess(request(**changes)).status == "unsupported"


def test_sparkling_requires_verified_packaging_method():
    result = assess(request(carbonation="sparkling"))
    assert result.status == "needs_information"
    assert any("pressure-safe" in item for item in result.missing_information)
    assert any("bottle pressure" in item for item in result.safety_warnings)


def test_missing_inventory_is_explicit():
    result = assess(request(ingredients=[], equipment=[]))
    assert "Ingredient inventory" in result.missing_information
    assert "Equipment inventory" in result.missing_information


def test_invalid_input_rejected():
    with pytest.raises(ValidationError):
        request(beverage="kombucha")
    with pytest.raises(ValidationError):
        request(ingredients=[" "])


def test_contract_endpoint_and_legacy_routes_remain_registered():
    from api.main import app
    from fastapi.testclient import TestClient

    client = TestClient(app)
    response = client.post("/api/v1/recommendations", json={
        "adult_confirmed": True, "beverage": "cider",
        "desired_date": (date.today() + timedelta(days=40)).isoformat(),
        "ingredients": ["apple juice"], "equipment": ["fermentation vessel", "airlock", "sanitiser"]
    })
    assert response.status_code == 200
    assert response.json()["status"] == "needs_information"
    assert response.json()["recipe"] is None
    assert client.post("/api/v1/recommendations", json={"beverage": "kombucha"}).status_code == 422
    paths = {route.path for route in app.routes if hasattr(route, "path")}
    assert "/api/predict" in paths
