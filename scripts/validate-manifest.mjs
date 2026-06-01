import { readFile } from 'node:fs/promises';
const manifest = JSON.parse(await readFile('portfolio/manifest.json', 'utf8'));
const required = ['schemaVersion','slug','name','repository','status','brand','summary','links','release'];
for (const key of required) {
  if (!manifest[key]) throw new Error(`Manifest missing required field: ${key}`);
}
if (manifest.slug !== 'tokenops') throw new Error('Manifest slug must be tokenops.');
if (manifest.brand.owner !== 'Raghuramreddy') throw new Error('Locked brand owner changed.');
if (manifest.brand.tagline !== 'Designing technology for human experience') throw new Error('Locked tagline changed.');
if (manifest.links.liveDemo) throw new Error('TokenOps repository must not claim a standalone liveDemo before portfolio integration.');
if (!manifest.links.portfolioPage.includes('raghuramreddy.tech')) throw new Error('Portfolio page destination missing.');
console.log('Manifest validation passed: portfolio-hosted module contract.');
