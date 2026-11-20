# ADR 001: Flavour-first studio and research isolation

**Status:** Accepted, 20 November 2026. Canonical product source: [Ferment AI Notion](https://app.notion.com/p/41e091db8d5081efac33f6dba7179ff3).

## Context

The existing FementAI codebase models kombucha and kimchi with small published datasets and synthetic fallbacks. Its current model outputs are not validated for cider, mead or fruit wine. The new product starts with the adult user's desired drinking occasion and sensory profile, then works backwards to feasible non-distilled fermentation plans.

## Decision

Keep Next.js, FastAPI and the scientific research routes. Separate the research lab from the consumer studio. Do not re-label kombucha predictions as alcohol recipes. Build the studio around structured taste preferences, deterministic feasibility checks, vetted recipe templates and versioned batch observations. Any future AI explanation must be subordinate to safety and provenance constraints.

Until a validated recipe engine exists, the studio landing page is explicitly marked coming soon. Never fabricate results, claims of safety, fermentation time or ABV.

## Consequences

The research UI must show provenance and connection errors, not silently replace service failures with mock results. Demo mode is explicit: NEXT_PUBLIC_DEMO_MODE=true. The default is live API or visible error. Existing scientific UI is preserved for experimentation.

New consumer routes will use /api/v1/* with typed schemas. No distillation, retail, pressure-unsafe bottling recommendations, or alcohol-intoxication optimisation. This PR lays reliability and visual foundations, not a functioning recipe designer.
