import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
const bad=['â€”','â€™','â€œ','â€¢','Ã—','ï»¿','Â'];
const findings=[];
async function walk(dir){
 for(const entry of await readdir(dir,{withFileTypes:true})){
  const path=join(dir,entry.name);
  if(path.includes('legacy') || path.endsWith('scripts/check-encoding.mjs')) continue;
  if(entry.isDirectory()) await walk(path);
  else if(/\.(html|css|js|mjs|json|md|yml|yaml)$/.test(entry.name)){
   const text=await readFile(path,'utf8');
   for(const token of bad) if(text.includes(token)) findings.push(`${path}: ${token}`);
  }
 }
}
await walk('.');
if(findings.length) throw new Error(`Encoding defects found:\n${findings.join('\n')}`);
console.log('Encoding validation passed (legacy source and checker definitions intentionally excluded).');
