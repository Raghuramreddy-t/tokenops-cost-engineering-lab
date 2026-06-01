import { readFile } from 'node:fs/promises';
const data=JSON.parse(await readFile('assets/data/tokenops-api-models.json','utf8'));
if(!data.metadata?.verifiedOn || !Array.isArray(data.providers)) throw new Error('API registry metadata/providers missing');
let count=0;
for(const provider of data.providers){
 if(!provider.officialSource) throw new Error(`${provider.name}: official source missing`);
 for(const model of provider.models){
  count++;
  if(!model.pricingStatus || !model.lifecycleStatus || !model.verifiedOn) throw new Error(`${model.name}: status/verified date missing`);
  if(!Array.isArray(model.modes)||!model.modes.length) throw new Error(`${model.name}: pricing modes missing`);
  for(const mode of model.modes) for(const tier of mode.tiers) {
   if(!Number.isFinite(tier.input) || !Number.isFinite(tier.output)) throw new Error(`${model.name}: invalid rate`);
  }
 }
}
console.log(`API data validation passed: ${count} model records.`);
