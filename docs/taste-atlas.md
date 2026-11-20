# Taste Atlas — first interactive studio slice

The Taste Atlas captures taste **intent**, not measured flavour, ABV or a validated recipe.

## Durable design

- The versioned draft lives in the user's own browser under the storage key ferment-ai:design:v1.
- Users choose occasion, serving style and carbonation preference, then explore eight flavour nodes and nine ordinal sensory axes.
- Each flavour node cycles neutral → prefer → avoid → neutral; all nodes are native buttons with readable state labels. Sliders are keyboard operable and have text labels.
- Supplies, equipment, preferred ready-by date, volume and budget are constraints for a future deterministic feasibility engine, not grounds for claiming that a recipe is presently possible.
- The age acknowledgement is an exploratory 18+ gate, not a substitute for legal age verification in a public launch.
- Saved data is never uploaded, trained on or used as scientific evidence. Unknown fields, unsupported versions, invalid dates and out-of-range values are removed or clamped during browser storage hydration.
- The review page explicitly says that the result is a preference summary only, not a verified drink recipe, predicted ABV or safety certificate.
- Research-only kombucha/kimchi routes remain separate. No distillation or alcohol-strength optimization is offered.

## Quality gates

- Pure model: frontend/src/lib/taste-draft.mjs with declared TypeScript contract in taste-draft.d.mts.
- Tests: from frontend run node --test test/*.test.mjs; all six behaviour specifications cover defaults, roundtrip, malicious/malformed storage, version resets, cycling and provenance.
- CI also performs TypeScript type checking and Next production build.
- Manual review still required at 375px and 1440px, keyboard-only flow, assistive-tech announcement, dark-mode settings and low-motion settings.

## Next vertical slice

Define vetted cider recipe template(s) with references and implement server-validated feasibility for available ingredients, equipment, deadlines and requested carbonation. Keep constraints and warning propagation deterministic. Never convert ordinal flavour node values directly into claims about chemistry.
