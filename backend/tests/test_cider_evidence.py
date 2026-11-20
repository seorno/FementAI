"""Conservative cider evidence and API contract regression tests."""
from datetime import date, timedelta
from domain.feasibility import FeasibilityRequest, assess
from domain.cider_evidence import cider_evidence, PENN_STATE, MAINE, ORCHARD

def sample(**changes):
    values = dict(adult_confirmed=True, beverage="cider",
                  desired_date=date.today()+timedelta(days=40),
                  ingredients=["apple juice","yeast"],
                  equipment=["fermentation vessel","airlock","sanitiser","hydrometer"])
    values.update(changes)
    return FeasibilityRequest(**values)

def test_still_cider_evidence_is_attributed_but_not_a_recipe():
    result = assess(sample())
    evidence = result.cider_preparation_evidence
    assert result.status == "needs_information"
    assert result.recipe is None and result.safe_to_consume is None
    assert result.estimated_abv is None
    assert evidence is not None and evidence.version == "cider-evidence-v1"
    assert evidence.source_urls == [PENN_STATE, MAINE, ORCHARD]
    assert len(evidence.checkpoints) >= 4 and len(evidence.unresolved) >= 2

def test_incomplete_ingredients_and_equipment_have_explicit_gaps():
    evidence = assess(sample(ingredients=[],equipment=[])).cider_preparation_evidence
    assert evidence is not None
    assert any("apple juice" in item for item in evidence.unresolved)
    assert any("hydrometer" in item for item in evidence.unresolved)

def test_no_evidence_for_pressure_or_contamination_or_age_blockers():
    for changes in (dict(pressure_concern=True),dict(contamination_concern=True),
                    dict(adult_confirmed=False),dict(desired_date=date.today())):
        assert assess(sample(**changes)).cider_preparation_evidence is None

def test_no_evidence_for_sparkling_or_non_cider():
    assert assess(sample(carbonation="sparkling")).cider_preparation_evidence is None
    assert assess(sample(beverage="mead")).cider_preparation_evidence is None

def test_source_registry_does_not_expose_guidance_for_blocked_request():
    assert cider_evidence(ingredients=["apple juice"],equipment=[],carbonation="still",blocked=True) is None

def test_endpoint_returns_evidence_but_no_recipe():
    from api.main import app
    from fastapi.testclient import TestClient
    response = TestClient(app).post("/api/v1/recommendations",json=sample().model_dump(mode="json"))
    assert response.status_code == 200
    payload = response.json()
    assert payload["cider_preparation_evidence"]["version"] == "cider-evidence-v1"
    assert payload["recipe"] is None and payload["safe_to_consume"] is None
