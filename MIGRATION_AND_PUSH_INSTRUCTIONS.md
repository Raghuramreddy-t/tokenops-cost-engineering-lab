# Replace the Current TokenOps Repository and Push

This package replaces the earlier standalone-site direction with the correct portfolio-hosted module direction.

## Important before push

Your earlier GitHub Pages deployment may still be publicly accessible. This replacement disables future standalone deployments, but it does not automatically unpublish a previously deployed Pages site. After push, go to the TokenOps repository in GitHub:

```text
Settings → Pages → Unpublish site
```

## Replace local repository contents

Assuming your cloned TokenOps repository is:

```powershell
$Repo = "G:\Raghu\My Projects\TokenOps Cost Engineering\github-tokenops-cost-engineering-lab"
$NewSource = "G:\Raghu\My Projects\TokenOps Cost Engineering\tokenops-portfolio-embedded-module-v3"
```

Create a correction branch and clean obsolete working-tree files while preserving `.git` history:

```powershell
Set-Location $Repo
git checkout main
git pull origin main
git checkout -b refactor/tokenops-portfolio-hosted-module-v3

Get-ChildItem -Force |
  Where-Object { $_.Name -ne ".git" } |
  Remove-Item -Recurse -Force

robocopy $NewSource $Repo /E /XD ".git" "node_modules" "dist" /XF "*.log"
```

This removes superseded current files from the branch only; all previous versions remain in Git history.

## Install and validate

```powershell
Set-Location $Repo
npm install
npm run validate
npm test
npx playwright install chromium
npm run test:ui
npm run validate:release
npm start
```

Open:

```text
http://localhost:4173
```

The preview page is only a portfolio-shell simulation. It is not intended to be deployed from this repository.

## Commit and push

```powershell
git status
git add -A
git commit -m "Refactor TokenOps into portfolio-hosted embed module with model-selection fixes"
git push -u origin refactor/tokenops-portfolio-hosted-module-v3
```

Create a pull request into `main`, verify GitHub Actions validation, then merge.

## After merge

1. Unpublish the standalone TokenOps GitHub Pages site.
2. Do not configure a TokenOps subdomain.
3. Integrate `dist/portfolio-embed` into `raghuramreddy-updated/pages/tokenops.html` through the portfolio deployment workflow.
