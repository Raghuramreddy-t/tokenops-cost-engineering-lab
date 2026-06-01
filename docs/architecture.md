# TokenOps Architecture

## Boundary

TokenOps is a static browser-local lab. The browser loads JSON registries and executes deterministic cost calculations. There is no server-side processing, authentication, database, external prompt submission or billing reconciliation.

## Modules

| Module | Purpose | Source of truth |
|---|---|---|
| API Model Cost Lab | Estimate direct API usage economics | Provider official pricing documentation |
| GitHub Copilot AI Credits Lab | Estimate Copilot token-based credits and plan fit | Official GitHub Copilot documentation |
| Change Radar | Track verified changes affecting economics | Official product documentation |
| Source Registry | Display verification sources and dates | JSON metadata |

## Security and privacy

The prompt text area exists only to estimate local input-token volume. It must not be stored, transmitted, logged or included in analytics.
