# Add TokenOps to the Portfolio After Deployment

## Decision

The standalone TokenOps repository owns the live calculator and its source registries. The portfolio displays the system and links to the lab; it does not contain a second copy of the calculator.

This prevents:
- duplicate calculations,
- stale pricing copies,
- conflicting GitHub Copilot billing data,
- two different versions of the same lab.

## Current integration pattern

Use the `portfolio-integration-kit` supplied with the one-shot bundle. It adds a non-destructive banner to the existing portfolio TokenOps page and reads this repository's `portfolio/manifest.json` at runtime.

## Future integration pattern

After the portfolio is reorganized, replace runtime fetching with build-time manifest synchronization using GitHub Actions and `repository_dispatch`. That improves static indexing while preserving this repository as source of truth.

## Required public links after deployment

Update `portfolio/manifest.json`:

```json
"links": {
  "repository": "https://github.com/Raghuramreddy-t/tokenops-cost-engineering-lab",
  "liveDemo": "https://raghuramreddy-t.github.io/tokenops-cost-engineering-lab/",
  "portfolioPage": "https://raghuramreddy.tech/pages/tokenops.html",
  "documentation": "https://github.com/Raghuramreddy-t/tokenops-cost-engineering-lab/tree/main/docs"
}
```

After setting the custom subdomain, replace `liveDemo` with:

```text
https://tokenops.raghuramreddy.tech/
```
