# Portfolio Consumption — Next Step

Do this after the TokenOps repository is pushed and validated.

## Portfolio build workflow logic

The portfolio workflow should check out both repositories and build/copy the module:

```yaml
- name: Checkout portfolio
  uses: actions/checkout@v6

- name: Checkout TokenOps source
  uses: actions/checkout@v6
  with:
    repository: Raghuramreddy-t/tokenops-cost-engineering-lab
    path: external/tokenops-source

- name: Build TokenOps portfolio embed
  working-directory: external/tokenops-source
  run: |
    npm install
    npm run validate
    npm test
    npm run build:embed

- name: Copy TokenOps bundle into portfolio deployment source
  run: |
    mkdir -p assets/external/tokenops
    cp -R external/tokenops-source/dist/portfolio-embed/* assets/external/tokenops/
```

## Existing page mount point

In `pages/tokenops.html`, retain the portfolio shell and use:

```html
<link rel="stylesheet" href="../assets/external/tokenops/tokenops-lab.css">

<div
  id="tokenops-lab-root"
  data-tokenops-base="../assets/external/tokenops/">
</div>

<script type="module" src="../assets/external/tokenops/tokenops-lab.js"></script>
```

Do not use an iframe, do not link to a standalone lab site, and do not fetch files from raw GitHub URLs in visitor browsers.
