import { readFile, access } from 'node:fs/promises';
const required = [
  'dist/portfolio-embed/tokenops-lab.js',
  'dist/portfolio-embed/tokenops-lab.css',
  'dist/portfolio-embed/manifest.json',
  'dist/portfolio-embed/data/tokenops-api-models.json',
  'dist/portfolio-embed/data/tokenops-copilot-models.json',
  'dist/portfolio-embed/data/tokenops-copilot-plans.json',
  'dist/portfolio-embed/data/tokenops-scenarios.json'
];
for (const path of required) await access(path);
const js = await readFile('dist/portfolio-embed/tokenops-lab.js', 'utf8');
const css = await readFile('dist/portfolio-embed/tokenops-lab.css', 'utf8');
if (!js.includes('tokenops-lab-root')) throw new Error('Embed JS is missing mount root contract.');
if (!js.includes('GPT-5.4 mini')) throw new Error('Copilot default selected-model fallback missing.');
if (!css.includes('.tokenops-module')) throw new Error('CSS must be namespaced under .tokenops-module.');
console.log('Portfolio embed output validation passed.');
