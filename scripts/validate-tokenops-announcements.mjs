import { readFile } from 'node:fs/promises';
const data=JSON.parse(await readFile('assets/data/tokenops-announcements.json','utf8'));
for(const item of data.announcements){
 if(!item.title || !item.source || !item.verifiedOn) throw new Error(`Incomplete announcement: ${item.id||'unknown'}`);
 if(!item.source.startsWith('https://docs.github.com/')) throw new Error(`${item.id}: starter announcement source is not official GitHub documentation`);
}
console.log(`Announcements validation passed: ${data.announcements.length} entries.`);
