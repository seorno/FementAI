# Studio feasibility screen (v1)

`POST /api/v1/recommendations` is a deterministic **screen**, not a recipe generator. It accepts a UK adult acknowledgement, one of cider/mead/fruit_wine, a target date, inventory, equipment, carbonation intent and explicit contamination/pressure concerns. Pydantic rejects unsupported categories and malformed inventory (HTTP 422). The response has `unsupported` or `needs_information` status, explicit reasons, missing facts, warnings and provenance.

No recipe is returned yet: no consumer recipe template has passed source review. No ABV estimate, drinking safety determination, bottling instruction, accelerated fermentation claim or sensory prediction is produced. Acknowledgement is not age verification. A future supported recipe must be versioned, sourced and tested before the response can ever say `feasible`. This deliberately avoids laundering kombucha/kimchi research predictions into alcohol recommendations.

Example:

```json
{"adult_confirmed":true,"beverage":"cider","desired_date":"2027-01-15","ingredients":["apple juice","yeast"],"equipment":["fermentation vessel","airlock","sanitiser"],"carbonation":"still"}
```

The date is an input, not an assurance of completion. The screen never asserts that 40 days is sufficient. For sparkling intentions, a verified stable-gravity and pressure-safe packaging procedure is a missing prerequisite. Contamination or pressure concerns block recommendations. Missing equipment is reported, not silently assumed.

Run from the repository root with backend dependencies installed:

```sh
PYTHONPATH=backend pytest -q backend/tests/test_feasibility.py
```

Next: source-review one non-distilled cider recipe family, document ingredient constraints and measured checkpoints, and only then introduce a curated versioned recipe with a `feasible` status. Integrate the Taste Atlas review into this endpoint after its branch lands, preserving explicit no-recipe states. UK scope and legal context: [HMRC](https://www.gov.uk/guidance/check-if-you-need-an-alcoholic-products-producer-approval-appa), [CAP Code section 18](https://www.asa.org.uk/type/non_broadcast/code_section/18.html). These links do not establish a recipe's food safety.
