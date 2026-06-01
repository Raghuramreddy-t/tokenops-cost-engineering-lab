# TokenOps Cost Engineering Lab

**Raghuramreddy**  
*Designing technology for human experience*

TokenOps is a standalone browser-local decision lab for **API model economics** and **GitHub Copilot AI Credits**. It compares officially sourced pricing, estimates workload cost under editable assumptions, tracks cost-impacting product changes, and publishes a manifest for later integration into `raghuramreddy.tech`.

## Modules

1. **API Model Cost Lab** — direct provider API pricing for OpenAI, Anthropic, Google Gemini and xAI.
2. **GitHub Copilot AI Credits Lab** — Copilot-specific model pricing, included credits, agentic workload assumptions and overage forecasting.
3. **AI Usage Economics Change Radar** — verified pricing, model lifecycle and billing changes.
4. **Source Registry** — official documentation sources and verification dates.


## Learning Experience Included in v2

Both labs now teach the economics before showing the calculator.

### API Model Cost Lab

- Token anatomy: input, output, cached input and cache write.
- Direct API cost formula.
- Processing-mode and context-tier explanation.
- Six cost-engineering strategies.
- Comparable scenario calculator.

### GitHub Copilot AI Credits Lab

- Premium-request legacy model versus token-priced AI Credits.
- Clear legacy eligibility warning for existing annual Pro / Pro+ subscribers remaining on legacy billing after June 1, 2026.
- AI Credit formula and plan allowance cards.
- Worked scenario comparison and legacy PRU multiplier reference.
- Eight AI Credit protection strategies.
- Enterprise pool/budget warning, code review dual-cost warning and model lifecycle watch.

## Guardrails

- Browser-local calculations only; no backend and no API key.
- Do not paste secrets, credentials or confidential data.
- API pricing and GitHub Copilot billing are never mixed.
- Results are planning estimates, not billing reconciliation.
- Historical/retiring models are preserved but labeled accurately.
- Displayed current pricing is sourced from official documentation and timestamped.

## Run locally

Requires Node.js 20+.

```bash
npm run validate
npm test
npm start
```

Open `http://localhost:4173`.

## Structure

```text
assets/data/             Verified price, plan, scenario and announcement registries
assets/js/pages/         Browser-only calculation and rendering modules
portfolio/manifest.json  Contract later consumed by the main portfolio site
docs/                    Calculation, governance and integration documentation
scripts/                 Validation, tests and local server
legacy/                  Preserve source from the original portfolio here
```

## Portfolio integration

The portfolio should later read `portfolio/manifest.json` from this repository and display TokenOps as a live external laboratory. Application code stays here; it is not copied into the portfolio repository.

## Current release

`0.1.0` — Local starter ready: working lab, official-source seed registries, validation, tests and GitHub Pages deployment workflow.
