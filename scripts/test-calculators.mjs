import { readFile } from 'node:fs/promises';
import { calculateApiCost, calculateCopilotCost, allowanceForPlan } from '../src/portfolio-embed/tokenops-lab.js';

const api = JSON.parse(await readFile('assets/data/tokenops-api-models.json','utf8'));
const copilot = JSON.parse(await readFile('assets/data/tokenops-copilot-models.json','utf8'));
const plans = JSON.parse(await readFile('assets/data/tokenops-copilot-plans.json','utf8'));

const apiModel = api.providers.find(p => p.id === 'openai').models.find(m => m.id === 'gpt-5.4-mini');
const apiResult = calculateApiCost(apiModel, {
  inputTokens:1000, cachedInputTokens:0, cacheWriteTokens:0, outputTokens:200, requestsPerDay:1, daysPerMonth:30
}, 'standard', 'default');
if (!apiResult || Math.abs(apiResult.perRequest - 0.00165) > 1e-10) throw new Error('API cost formula test failed.');

const model = copilot.models.find(m => m.name === 'GPT-5 mini');
const plan = plans.individualPlans.find(p => p.id === 'pro');
const result = calculateCopilotCost(model, {
  featureId:'chat', inputTokens:1000, cachedInputTokens:0, cacheWriteTokens:0, outputTokens:200, interactionsPerMonth:100, autoSelection:false
}, plan, copilot);
if (Math.abs(result.monthlyCredits - 6.5) > 1e-10) throw new Error('Copilot cost formula test failed.');
if (allowanceForPlan(plan) !== 1500) throw new Error('Plan allowance test failed.');

const completion = calculateCopilotCost(model, {
  featureId:'code-completions', inputTokens:100000, cachedInputTokens:0, cacheWriteTokens:0, outputTokens:100000, interactionsPerMonth:5, autoSelection:false
}, plan, copilot);
if (completion.monthlyCredits !== 0) throw new Error('Non-AI-credit feature test failed.');
console.log('Calculator tests passed.');
