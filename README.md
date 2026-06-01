# TokenOps Cost Engineering Lab — Portfolio-Hosted Module

**Raghuramreddy**  
*Designing technology for human experience*

TokenOps is a separately maintained source repository for a live interactive module rendered through the main portfolio website. It does **not** publish a separate public website.

## Public delivery model

```text
tokenops-cost-engineering-lab
  owns source, data registries, tests and the embed build
        ↓
raghuramreddy-updated portfolio build
  checks out this repository and runs npm run build:embed
        ↓
raghuramreddy.tech/pages/tokenops.html
  mounts the live TokenOps lab inside the portfolio design shell
```

## Modules

1. **API Model Cost Lab** — direct provider API economics with explicit provider/model selection.
2. **GitHub Copilot AI Credits Lab** — GitHub-specific workload, model and plan estimation.
3. **AI Usage Economics Change Radar** — verified product and billing changes.
4. **Source Registry** — official-source traceability and verification dates.

## v3 correction release

This release corrects the previous standalone-page direction and the missing/unclear model-selection experience:

- Produces `dist/portfolio-embed/`, not a deployed TokenOps Pages site.
- Removes the standalone navbar/footer from the distributable module.
- Adopts portfolio-compatible blue/purple design tokens in namespaced CSS.
- Makes both calculators the default first view.
- Adds provider and selected-model controls for both labs.
- Shows a selected-model result before optional comparisons.
- Splits critical data from optional learning/radar loads.
- Shows loading, empty and error states instead of silent blank areas.
- Preserves existing verified pricing registry values unchanged.

## Run locally

Requires Node.js 20+; Node.js 24 is used in GitHub Actions.

```bash
npm install
npm run validate
npm test
npm run build:embed
npm start
```

Open `http://localhost:4173`.

The local `index.html` is a **development harness only**. It simulates the portfolio shell and mounts the same embed distribution the portfolio will consume.

## UI smoke testing

```bash
npx playwright install chromium
npm run test:ui
npm run validate:release
```

## Distribution contract

`npm run build:embed` generates:

```text
dist/portfolio-embed/
├── tokenops-lab.js
├── tokenops-lab.css
├── manifest.json
└── data/
    ├── tokenops-api-models.json
    ├── tokenops-copilot-models.json
    ├── tokenops-copilot-plans.json
    ├── tokenops-scenarios.json
    ├── tokenops-learning-content.json
    ├── tokenops-copilot-legacy-pru.json
    └── tokenops-announcements.json
```

## Deployment boundary

- Keep `.github/workflows/validate.yml`.
- Do not run a GitHub Pages deployment from this repository.
- If a Pages site was enabled previously, unpublish it in repository **Settings → Pages**.
- The live experience becomes public only after the portfolio consumes this bundle.
