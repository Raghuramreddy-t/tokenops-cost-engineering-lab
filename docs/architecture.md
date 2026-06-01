# TokenOps Portfolio-Hosted Module Architecture

## Product boundary

TokenOps is maintained in its own repository but rendered publicly inside the portfolio website. The repository produces an embed bundle, and the portfolio build copies that bundle into its deployment artifact.

```text
TokenOps source repository
  └── npm run build:embed
      └── dist/portfolio-embed
             ↓ consumed at portfolio build time
raghuramreddy-updated/pages/tokenops.html
```

## Why this boundary

- Pricing registries and calculator logic have one owner.
- The portfolio retains one public brand shell and one public URL.
- No browser-time dependency on raw GitHub content is required.
- TokenOps releases can be validated before becoming visible in the portfolio.

## Runtime behavior

Critical registries are loaded first. Calculator initialization stops with a visible error state only if a required pricing/scenario resource fails. Educational content and the Change Radar are optional: their failure never removes the calculators.
