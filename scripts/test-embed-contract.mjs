import { readFile } from 'node:fs/promises';
const js = await readFile('src/portfolio-embed/tokenops-lab.js', 'utf8');
const html = await readFile('index.html', 'utf8');
const assertions = [
  ['mount root exists in local harness', html.includes('id="tokenops-lab-root"')],
  ['module uses selected API model control', js.includes('to-api-model')],
  ['module uses selected Copilot model control', js.includes('to-copilot-model')],
  ['module exposes visible critical failure state', js.includes('Unable to load calculator data.')],
  ['optional resources are loaded as optional', js.includes("FILES.learning, false") && js.includes("FILES.announcements, false")],
  ['module does not render global navbar', !js.includes('<nav class="navbar') && !js.includes('site-footer')],
  ['module does not use raw GitHub at runtime', !js.includes('raw.githubusercontent.com')]
];
const failed = assertions.filter(([, okay]) => !okay).map(([name]) => name);
if (failed.length) throw new Error(`Embed contract failed: ${failed.join(', ')}`);
console.log('Embed contract tests passed.');
