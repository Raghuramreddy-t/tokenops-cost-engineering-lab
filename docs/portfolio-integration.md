# Portfolio Integration Plan

TokenOps remains a standalone repository and deployable lab. The portfolio later consumes only `portfolio/manifest.json` and links to the live lab.

## Planned integration flow

1. Validate and deploy TokenOps on `main`.
2. Publish `portfolio/manifest.json`.
3. Trigger a portfolio rebuild after successful TokenOps deployment.
4. Render TokenOps metadata and link to the standalone site; do not copy application source into the portfolio.

The live subdomain target is `tokenops.raghuramreddy.tech`. Rename `CNAME.example` to `CNAME` only after DNS and GitHub Pages custom-domain setup are ready.
