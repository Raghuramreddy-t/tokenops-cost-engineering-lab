import { readFile } from 'node:fs/promises';
const models=JSON.parse(await readFile('assets/data/tokenops-copilot-models.json','utf8'));
const plans=JSON.parse(await readFile('assets/data/tokenops-copilot-plans.json','utf8'));
if(models.metadata.creditUsdValue !== 0.01) throw new Error('AI credit conversion must equal 0.01 USD');
if(!models.metadata.source.includes('docs.github.com')) throw new Error('Copilot source must be official GitHub docs');
if(!plans.metadata.individualSource.includes('docs.github.com')) throw new Error('Plan source must be official GitHub docs');
for(const model of models.models){
 if(!model.pricingStatus || !model.verifiedOn || !Number.isFinite(model.input) || !Number.isFinite(model.output)) throw new Error(`Invalid record: ${model.name}`);
}
const closing=models.models.filter(m=>m.releaseStatus==='closing-down').map(m=>m.name);
for(const required of ['GPT-4.1','GPT-5.2','GPT-5.2-Codex']) if(!closing.includes(required)) throw new Error(`Closing-down record missing: ${required}`);
console.log(`Copilot data validation passed: ${models.models.length} model records.`);
