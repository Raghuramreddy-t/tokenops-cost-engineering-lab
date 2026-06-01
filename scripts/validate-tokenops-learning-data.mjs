import { readFile } from 'node:fs/promises';
const learning = JSON.parse(await readFile('assets/data/tokenops-learning-content.json', 'utf8'));
const legacy = JSON.parse(await readFile('assets/data/tokenops-copilot-legacy-pru.json', 'utf8'));
if (!learning.metadata?.verifiedOn || learning.apiStrategies.length < 6 || learning.copilotStrategies.length < 8) throw new Error('Learning content is incomplete.');
if (!legacy.metadata?.source?.includes('docs.github.com')) throw new Error('Legacy PRU registry must cite official GitHub docs.');
if (!legacy.metadata.notComparableAsCurrency) throw new Error('Legacy PRU warning is required.');
if (!legacy.models.some(m => m.name === 'GPT-5.5' && m.multiplier === 57)) throw new Error('Expected verified legacy multiplier entry is missing.');
console.log('Learning and legacy-transition data validation passed.');
