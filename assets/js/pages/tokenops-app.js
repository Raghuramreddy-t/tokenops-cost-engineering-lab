import { estimateTokens, calculateApiCost } from './tokenops-api-calculator.js';
import { allowanceForPlan, calculateCopilotCredits } from './tokenops-copilot-calculator.js';
import { explainAllowance } from './tokenops-plan-fit.js';
import { renderAnnouncements } from './tokenops-change-radar.js';
import { money, credits, statusBadge, safeText } from './tokenops-render.js';
import { setupTabs } from './tokenops-accessibility.js';

const $ = id => document.getElementById(id);
const num = id => Number($(id).value || 0);
const getJSON = async path => {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Unable to load ${path}`);
  return response.json();
};
const [apiData, copilotData, plansData, scenarios, announcements, learning, legacyPru] = await Promise.all([
  getJSON('./assets/data/tokenops-api-models.json'),
  getJSON('./assets/data/tokenops-copilot-models.json'),
  getJSON('./assets/data/tokenops-copilot-plans.json'),
  getJSON('./assets/data/tokenops-scenarios.json'),
  getJSON('./assets/data/tokenops-announcements.json'),
  getJSON('./assets/data/tokenops-learning-content.json'),
  getJSON('./assets/data/tokenops-copilot-legacy-pru.json')
]);

setupTabs();
initApi();
initCopilot();
renderAnnouncements($('radar-cards'), announcements.announcements);
renderSources();
renderLearning();

function flattenApiModels() {
 return apiData.providers.flatMap(provider =>
  provider.models.map(model => ({...model,providerName:provider.name,officialSource:provider.officialSource})));
}
function initApi() {
 $('api-scenario').innerHTML=scenarios.api.map(s=>`<option value="${s.id}">${safeText(s.name)}</option>`).join('');
 $('api-scenario').addEventListener('change',()=>applyApiScenario($('api-scenario').value));
 ['api-input','api-cached','api-write','api-output','api-requests','api-days','api-mode','api-tier'].forEach(id=>$(id).addEventListener('input',renderApi));
 $('api-text').addEventListener('input',()=>{if($('api-text').value.trim()) $('api-input').value=estimateTokens($('api-text').value); renderApi();});
 applyApiScenario(scenarios.api[0].id);
}
function applyApiScenario(id) {
 const s=scenarios.api.find(x=>x.id===id); if(!s) return;
 $('api-input').value=s.inputTokens; $('api-cached').value=s.cachedInputTokens; $('api-write').value=s.cacheWriteTokens;
 $('api-output').value=s.outputTokens; $('api-requests').value=s.requestsPerDay; $('api-days').value=s.daysPerMonth;
 $('api-text').value=''; renderApi();
}
function renderApi() {
 const inputs={inputTokens:num('api-input'),cachedInputTokens:num('api-cached'),cacheWriteTokens:num('api-write'),
 outputTokens:num('api-output'),requestsPerDay:num('api-requests'),daysPerMonth:num('api-days')};
 const results=flattenApiModels().map(m=>calculateApiCost(m,inputs,$('api-mode').value,$('api-tier').value)).filter(Boolean).sort((a,b)=>a.monthly-b.monthly);
 $('api-results').innerHTML=results.map(r=>`<tr><td><strong>${safeText(r.model.providerName)}</strong><br>${safeText(r.model.name)}</td><td>${statusBadge(r.model.lifecycleStatus)}</td><td>${safeText(r.mode.label)} · ${safeText(r.tier.label)}</td><td class="money">${money(r.perRequest)}</td><td class="money">${money(r.monthly)}</td><td class="money">${money(r.annual)}</td></tr>`).join('');
 const low=results[0], high=results[results.length-1];
 $('api-insight').innerHTML=low?`<h3>Scenario Summary</h3><div class="metric"><span>Models available</span><b>${results.length}</b></div><div class="metric"><span>Lowest monthly estimate</span><b>${money(low.monthly)}</b></div><div class="metric"><span>Model</span><b style="font-size:14px">${safeText(low.model.name)}</b></div><div class="metric"><span>Cost range</span><b style="font-size:16px">${money(high.monthly-low.monthly)}</b></div>`:`<h3>No results</h3><p>Selected pricing mode is not present in the verified registry.</p>`;
}
const allPlans=()=>[...plansData.individualPlans,...plansData.organizationPlans];
function initCopilot() {
 $('copilot-scenario').innerHTML=scenarios.copilot.map(s=>`<option value="${s.id}">${safeText(s.name)}</option>`).join('');
 $('copilot-plan').innerHTML=allPlans().map(p=>`<option value="${p.id}">${safeText(p.name)}</option>`).join('');
 $('copilot-feature').innerHTML=copilotData.features.map(f=>`<option value="${f.id}">${safeText(f.name)}</option>`).join('');
 $('copilot-scenario').addEventListener('change',()=>applyCopilotScenario($('copilot-scenario').value));
 ['copilot-plan','copilot-seats','copilot-feature','copilot-status-filter','copilot-input','copilot-cached','copilot-write','copilot-output','copilot-interactions','copilot-auto','copilot-promo'].forEach(id=>$(id).addEventListener('input',renderCopilot));
 applyCopilotScenario(scenarios.copilot[0].id);
}
function applyCopilotScenario(id) {
 const s=scenarios.copilot.find(x=>x.id===id); if(!s) return;
 $('copilot-feature').value=s.feature; $('copilot-input').value=s.inputTokens; $('copilot-cached').value=s.cachedInputTokens; $('copilot-write').value=s.cacheWriteTokens; $('copilot-output').value=s.outputTokens; $('copilot-interactions').value=s.interactionsPerMonth; renderCopilot();
}
function renderCopilot() {
 const plan=allPlans().find(p=>p.id===$('copilot-plan').value);
 const allowance=allowanceForPlan(plan,num('copilot-seats'),$('copilot-promo').checked);
 const inputs={featureId:$('copilot-feature').value,inputTokens:num('copilot-input'),cachedInputTokens:num('copilot-cached'),cacheWriteTokens:num('copilot-write'),outputTokens:num('copilot-output'),interactionsPerMonth:num('copilot-interactions'),autoSelection:$('copilot-auto').checked};
 const showAll=$('copilot-status-filter').value==='all';
 const models=copilotData.models.filter(m=>showAll || !['closing-down','retired'].includes(m.releaseStatus));
 const results=models.map(m=>calculateCopilotCredits(m,inputs,plan,copilotData)).sort((a,b)=>a.monthlyCredits-b.monthlyCredits);
 $('copilot-results').innerHTML=results.map(r=>{const fit=explainAllowance(r.monthlyCredits,allowance);return `<tr><td><strong>${safeText(r.model.name)}</strong><br><small>${safeText(r.model.provider)}</small>${r.discountApplied?'<br><small>Auto discount modeled</small>':''}</td><td>${statusBadge(r.model.releaseStatus)}</td><td class="money">${money(r.perInteractionUsd)}</td><td class="money">${credits(r.monthlyCredits)}</td><td>${safeText(fit.label)}</td></tr>`;}).join('');
 const low=results[0], fit=low?explainAllowance(low.monthlyCredits,allowance):null;
 $('copilot-insight').innerHTML=low?`<h3>Allowance Forecast</h3><div class="metric"><span>Plan pool</span><b>${allowance==null?'Not listed':credits(allowance)}</b></div><div class="metric"><span>Lowest estimate</span><b>${credits(low.monthlyCredits)}</b></div><div class="metric"><span>Model</span><b style="font-size:14px">${safeText(low.model.name)}</b></div><div class="metric"><span>Overage</span><b>${fit.overageUsd==null?'Unknown':money(fit.overageUsd)}</b></div>`:'<h3>No results</h3>';
}
function renderSources() {
 const sources=apiData.providers.map(p=>({name:p.name,source:p.officialSource,note:`${p.models.length} direct API model record(s)`})).concat([
 {name:'GitHub Copilot Models & Pricing',source:copilotData.metadata.source,note:`${copilotData.models.length} Copilot pricing records`},
 {name:'GitHub Copilot Individual Plans',source:plansData.metadata.individualSource,note:'Individual AI Credit allowances'},
 {name:'GitHub Copilot Business / Enterprise',source:plansData.metadata.organizationSource,note:'Pooled allowances and promotional amounts'}]);
 $('source-cards').innerHTML=sources.map(s=>`<article class="source-card"><h3>${safeText(s.name)}</h3><p>${safeText(s.note)}</p><div class="meta"><span>Verified ${safeText(verified())}</span></div><a href="${s.source}" target="_blank" rel="noopener">Open official source ↗</a></article>`).join('');
}
function verified(){return apiData.metadata.verifiedOn;}


function renderLearning() {
  $('api-strategies').innerHTML = learning.apiStrategies.map(item => `
    <article class="strategy"><strong>${safeText(item.title)}</strong><p>${safeText(item.body)}</p></article>`).join('');
  $('copilot-strategies').innerHTML = learning.copilotStrategies.map(item => `
    <article class="strategy"><strong>#${safeText(item.number)} ${safeText(item.title)}</strong><p>${safeText(item.body)}</p><span class="certainty">${safeText(item.certainty)}</span></article>`).join('');
  renderPlanCards();
  renderCopilotExamples();
  renderLegacyPru();
  renderLifecycleWatch();
}

function renderPlanCards() {
  const selected = [
    ...plansData.individualPlans.filter(p => ['pro','pro-plus','max'].includes(p.id)).map(p => ({name:p.name, credits:p.includedCredits, note:`$${p.monthlyUsd}/mo`})),
    ...plansData.organizationPlans.map(p => ({name:p.name, credits:p.includedCreditsPerSeat, note:'per seat · standard'}))
  ];
  $('copilot-plan-cards').innerHTML = selected.map(p => `<article class="plan-box"><strong>${safeText(p.name)}</strong><b>${credits(p.credits)}</b><small>AI credits / month · ${safeText(p.note)}</small></article>`).join('');
}

function renderCopilotExamples() {
  const defaultPlan = plansData.individualPlans.find(p => p.id === 'pro');
  $('copilot-example-results').innerHTML = learning.copilotExamples.map(example => {
    const model = copilotData.models.find(m => m.name === example.model);
    if (!model) return '';
    const result = calculateCopilotCredits(model, {
      featureId:'chat', inputTokens:example.inputTokens, cachedInputTokens:example.cachedInputTokens,
      cacheWriteTokens:0, outputTokens:example.outputTokens, interactionsPerMonth:1, autoSelection:false
    }, defaultPlan, copilotData);
    return `<tr><td><strong>${safeText(example.task)}</strong><br><small>${safeText(example.note)}</small></td><td>${safeText(example.model)}</td><td>${credits(example.inputTokens)}</td><td>${credits(example.cachedInputTokens)}</td><td>${credits(example.outputTokens)}</td><td class="money">${money(result.perInteractionUsd)}</td><td class="money">${credits(result.monthlyCredits)}</td></tr>`;
  }).join('');
}

function renderLegacyPru() {
  const rows = legacyPru.models;
  const midpoint = Math.ceil(rows.length / 2);
  $('legacy-pru-results').innerHTML = Array.from({length: midpoint}, (_, idx) => {
    const first = rows[idx], second = rows[idx + midpoint];
    return `<tr><td>${safeText(first.name)}</td><td class="money">${first.multiplier}×</td><td>${second ? safeText(second.name) : '—'}</td><td class="money">${second ? `${second.multiplier}×` : '—'}</td></tr>`;
  }).join('');
}

function renderLifecycleWatch() {
  const riskModels = copilotData.models.filter(m => ['closing-down','retired'].includes(m.releaseStatus));
  $('copilot-model-watch').innerHTML = riskModels.map(model => `<article><h3>${safeText(model.name)}</h3><p>${statusBadge(model.releaseStatus)}</p><p>${safeText(model.note || 'Lifecycle status recorded from official GitHub documentation.')}</p></article>`).join('');
}
