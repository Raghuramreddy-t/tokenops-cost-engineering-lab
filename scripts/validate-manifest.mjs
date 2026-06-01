import { readFile } from 'node:fs/promises';
const manifest = JSON.parse(await readFile('portfolio/manifest.json','utf8'));
for (const key of ['schemaVersion','slug','name','repository','status','brand','summary','links','release']) {
 if (!manifest[key]) throw new Error(`manifest missing required field: ${key}`);
}
if (manifest.slug !== 'tokenops') throw new Error('manifest slug must be tokenops');
if (manifest.brand.owner !== 'Raghuramreddy') throw new Error('locked brand owner changed');
if (manifest.brand.tagline !== 'Designing technology for human experience') throw new Error('locked tagline changed');
console.log('Manifest validation passed.');
