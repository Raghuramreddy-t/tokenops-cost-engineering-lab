const FILES = {
  api: 'tokenops-api-models.json',
  copilot: 'tokenops-copilot-models.json',
  plans: 'tokenops-copilot-plans.json',
  scenarios: 'tokenops-scenarios.json',
  learning: 'tokenops-learning-content.json',
  legacy: 'tokenops-copilot-legacy-pru.json',
  announcements: 'tokenops-announcements.json'
};

const API_ALLOWED_DEFAULT = new Set(['current', 'preview']);
const COPILOT_ALLOWED_DEFAULT = new Set(['ga', 'public-preview']);

export function safeText(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}
export function money(value) {
  const number = Number(value || 0);
  return `$${number.toLocaleString(undefined, { minimumFractionDigits: number < 1 ? 4 : 2, maximumFractionDigits: number < 1 ? 6 : 2 })}`;
}
export function credits(value) {
  return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}
export function nonNegative(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}
export function estimateTokens(text) {
  return text && text.trim() ? Math.max(1, Math.ceil(text.length / 4)) : 0;
}
export function selectTier(mode, totalInputTokens, tierId = 'auto') {
  if (!mode?.tiers?.length) return null;
  if (tierId !== 'auto') {
    const selected = mode.tiers.find(tier => tier.id === tierId);
    if (selected) return selected;
  }
  return mode.tiers.find(tier => {
    const min = tier.minInputTokens == null || totalInputTokens >= tier.minInputTokens;
    const max = tier.maxInputTokens == null || totalInputTokens <= tier.maxInputTokens;
    return min && max;
  }) || mode.tiers[0];
}
export function calculateApiCost(model, input, modeId, tierId = 'auto') {
  const mode = model.modes?.find(entry => entry.id === modeId) || model.modes?.[0];
  if (!mode) return null;
  const inputTokens = nonNegative(input.inputTokens);
  const cachedTokens = Math.min(inputTokens, nonNegative(input.cachedInputTokens));
  const uncachedTokens = inputTokens - cachedTokens;
  const writeTokens = nonNegative(input.cacheWriteTokens);
  const outputTokens = nonNegative(input.outputTokens);
  const requestsPerDay = Math.max(1, nonNegative(input.requestsPerDay, 1));
  const daysPerMonth = Math.max(1, nonNegative(input.daysPerMonth, 30));
  const tier = selectTier(mode, inputTokens, tierId);
  if (!tier) return null;
  const cachedRate = tier.cachedInput == null ? tier.input : tier.cachedInput;
  const writeRate = tier.cacheWrite5m == null ? 0 : tier.cacheWrite5m;
  const perRequest = (
    uncachedTokens * tier.input +
    cachedTokens * cachedRate +
    writeTokens * writeRate +
    outputTokens * tier.output
  ) / 1_000_000;
  return {
    model, mode, tier, perRequest,
    daily: perRequest * requestsPerDay,
    monthly: perRequest * requestsPerDay * daysPerMonth,
    annual: perRequest * requestsPerDay * daysPerMonth * 12,
    cachedApplied: cachedTokens > 0 && tier.cachedInput != null,
    cacheWriteApplied: writeTokens > 0 && writeRate > 0
  };
}
export function allowanceForPlan(plan, seats = 1, promotional = false) {
  if (!plan) return null;
  const seatCount = Math.max(1, Math.floor(nonNegative(seats, 1)));
  if (plan.type === 'organization') {
    const amount = promotional && plan.promotionalCreditsPerSeat
      ? plan.promotionalCreditsPerSeat : plan.includedCreditsPerSeat;
    return amount == null ? null : amount * seatCount;
  }
  return plan.includedCredits == null ? null : plan.includedCredits * seatCount;
}
export function calculateCopilotCost(model, input, plan, registry) {
  const feature = registry.features.find(entry => entry.id === input.featureId);
  if (feature && !feature.billed) {
    return { model, perInteractionUsd: 0, creditsPerInteraction: 0, monthlyCredits: 0, monthlyUsd: 0, discountApplied: false, featureUnbilled: true };
  }
  const inputTokens = nonNegative(input.inputTokens);
  const cachedTokens = Math.min(inputTokens, nonNegative(input.cachedInputTokens));
  const uncachedTokens = inputTokens - cachedTokens;
  const writeTokens = nonNegative(input.cacheWriteTokens);
  const outputTokens = nonNegative(input.outputTokens);
  const interactions = Math.max(1, nonNegative(input.interactionsPerMonth, 1));
  let perInteractionUsd = (
    uncachedTokens * model.input +
    cachedTokens * model.cachedInput +
    writeTokens * (model.cacheWrite || 0) +
    outputTokens * model.output
  ) / 1_000_000;

  const eligibleDiscount = Boolean(input.autoSelection) && Boolean(plan?.paid) &&
    registry.autoSelection.eligibleFeatures.includes(input.featureId) &&
    registry.autoSelection.eligibleModels.includes(model.name);
  if (eligibleDiscount) {
    perInteractionUsd *= (1 - registry.autoSelection.discountPercent / 100);
  }
  const creditsPerInteraction = perInteractionUsd / registry.metadata.creditUsdValue;
  const monthlyCredits = creditsPerInteraction * interactions;
  return {
    model, perInteractionUsd, creditsPerInteraction, monthlyCredits,
    monthlyUsd: monthlyCredits * registry.metadata.creditUsdValue,
    discountApplied: eligibleDiscount,
    featureUnbilled: false,
    cachedApplied: cachedTokens > 0,
    cacheWriteApplied: writeTokens > 0 && Boolean(model.cacheWrite)
  };
}

function badge(status) {
  const cls = String(status).replaceAll('_', '-');
  return `<span class="tokenops-status tokenops-status--${safeText(cls)}">${safeText(String(status).replaceAll('-', ' '))}</span>`;
}
function option(value, label, selected = false) {
  return `<option value="${safeText(value)}"${selected ? ' selected' : ''}>${safeText(label)}</option>`;
}
function sourceLink(url, text = 'Official source ↗') {
  return `<a class="tokenops-link" href="${safeText(url)}" target="_blank" rel="noopener">${safeText(text)}</a>`;
}
function empty(message) {
  return `<div class="tokenops-empty">${safeText(message)}</div>`;
}

function moduleTemplate() {
  return `
    <section class="tokenops-module" aria-label="TokenOps Cost Engineering Lab">
      <header class="tokenops-module__hero">
        <span class="tokenops-module__eyebrow">Portfolio-Hosted Interactive Laboratory</span>
        <h1>TokenOps <span>Cost Engineering Lab</span></h1>
        <p>A decision lab for direct API model economics and GitHub Copilot AI Credits. Compare verified rates, forecast workload impact, and make lower-cost AI usage decisions with transparent assumptions.</p>
        <div class="tokenops-trust">
          <span>Browser-Local Calculation</span>
          <span>Official Source Registry</span>
          <span>API and Copilot Billing Separated</span>
          <span data-role="verified-date">Loading verification date…</span>
        </div>
        <div class="tokenops-privacy"><strong>Privacy:</strong> Text entered for estimation stays in the browser. Do not paste secrets, credentials, private documents or confidential content.</div>
      </header>
      <div data-role="critical-status" class="tokenops-load" aria-live="polite">Loading calculator registries…</div>
      <div data-role="application" hidden>
        <nav class="tokenops-tabs" role="tablist" aria-label="TokenOps modules">
          <button class="tokenops-tab" role="tab" aria-selected="true" aria-controls="to-panel-api" data-top-tab="api">API Model Cost Lab</button>
          <button class="tokenops-tab" role="tab" aria-selected="false" aria-controls="to-panel-copilot" data-top-tab="copilot">GitHub Copilot AI Credits</button>
          <button class="tokenops-tab" role="tab" aria-selected="false" aria-controls="to-panel-radar" data-top-tab="radar">Change Radar</button>
          <button class="tokenops-tab" role="tab" aria-selected="false" aria-controls="to-panel-sources" data-top-tab="sources">Source Registry</button>
        </nav>
        <section id="to-panel-api" class="tokenops-panel" role="tabpanel" data-top-panel="api"></section>
        <section id="to-panel-copilot" class="tokenops-panel" role="tabpanel" data-top-panel="copilot" hidden></section>
        <section id="to-panel-radar" class="tokenops-panel" role="tabpanel" data-top-panel="radar" hidden></section>
        <section id="to-panel-sources" class="tokenops-panel" role="tabpanel" data-top-panel="sources" hidden></section>
      </div>
    </section>`;
}

function apiPanelTemplate() {
  return `
    <div class="tokenops-heading"><div><h2>API Model Cost Lab</h2><p>Direct provider economics for applications and workflows you build.</p></div><span class="tokenops-badge tokenops-badge--ok">Direct API only</span></div>
    <nav class="tokenops-subtabs" role="tablist" aria-label="API lab views">
      <button class="tokenops-subtab" role="tab" aria-selected="true" data-sub-tab="api-calc">Workload Calculator</button>
      <button class="tokenops-subtab" role="tab" aria-selected="false" data-sub-tab="api-mechanics">Pricing Mechanics</button>
      <button class="tokenops-subtab" role="tab" aria-selected="false" data-sub-tab="api-optimize">Optimization Strategies</button>
    </nav>
    <div data-sub-panel="api-calc">
      <div class="tokenops-workspace">
        <form class="tokenops-card" data-role="api-form">
          <h3>Workload Builder</h3>
          <div class="tokenops-fields">
            <div class="tokenops-field tokenops-field--full"><label for="to-api-scenario">Scenario</label><select id="to-api-scenario"></select></div>
            <div class="tokenops-field"><label for="to-api-provider">Provider</label><select id="to-api-provider"></select></div>
            <div class="tokenops-field"><label for="to-api-model">Selected model</label><select id="to-api-model"></select></div>
            <div class="tokenops-field"><label for="to-api-mode">Processing mode</label><select id="to-api-mode"></select></div>
            <div class="tokenops-field"><label for="to-api-tier">Context tier</label><select id="to-api-tier"></select></div>
            <div class="tokenops-field tokenops-field--full"><label for="to-api-text">Estimate input from public-safe text, optional</label><textarea id="to-api-text" placeholder="Optional local-only token estimate"></textarea></div>
            <div class="tokenops-field"><label for="to-api-input">Input tokens</label><input id="to-api-input" type="number" min="0"></div>
            <div class="tokenops-field"><label for="to-api-cached">Cached input tokens</label><input id="to-api-cached" type="number" min="0"></div>
            <div class="tokenops-field"><label for="to-api-write">Cache-write tokens</label><input id="to-api-write" type="number" min="0"></div>
            <div class="tokenops-field"><label for="to-api-output">Output tokens</label><input id="to-api-output" type="number" min="0"></div>
            <div class="tokenops-field"><label for="to-api-requests">Requests / day</label><input id="to-api-requests" type="number" min="1"></div>
            <div class="tokenops-field"><label for="to-api-days">Days / month</label><input id="to-api-days" type="number" min="1" max="31"></div>
            <label class="tokenops-checkbox"><input id="to-api-compare" type="checkbox"> Compare verified current alternatives</label>
          </div>
          <p class="tokenops-micro">Text-derived token values are estimates. Use measured token counts for serious budgeting.</p>
        </form>
        <aside class="tokenops-card" data-role="api-summary" aria-live="polite"></aside>
      </div>
      <div data-role="api-comparison"></div>
    </div>
    <div data-sub-panel="api-mechanics" hidden></div>
    <div data-sub-panel="api-optimize" hidden></div>`;
}

function copilotPanelTemplate() {
  return `
    <div class="tokenops-heading"><div><h2>GitHub Copilot AI Credits Lab</h2><p>Usage-based planning estimates from GitHub-published model pricing and plan allowances.</p></div><span class="tokenops-badge">GitHub billing model</span></div>
    <div class="tokenops-kpi-strip">
      <span>1 AI Credit = $0.01 USD</span>
      <span>API pricing and Copilot billing are separate</span>
      <span data-role="copilot-verified"></span>
    </div>
    <nav class="tokenops-subtabs" role="tablist" aria-label="Copilot lab views">
      <button class="tokenops-subtab" role="tab" aria-selected="true" data-sub-tab="copilot-calc">Workload Calculator</button>
      <button class="tokenops-subtab" role="tab" aria-selected="false" data-sub-tab="copilot-billing">Understand Billing</button>
      <button class="tokenops-subtab" role="tab" aria-selected="false" data-sub-tab="copilot-optimize">Optimize Usage</button>
      <button class="tokenops-subtab" role="tab" aria-selected="false" data-sub-tab="copilot-lifecycle">Model Lifecycle</button>
    </nav>
    <div data-sub-panel="copilot-calc">
      <div class="tokenops-workspace">
        <form class="tokenops-card" data-role="copilot-form">
          <h3>Workload Builder</h3>
          <div class="tokenops-fields">
            <div class="tokenops-field tokenops-field--full"><label for="to-copilot-scenario">Scenario</label><select id="to-copilot-scenario"></select></div>
            <div class="tokenops-field"><label for="to-copilot-plan">Plan</label><select id="to-copilot-plan"></select></div>
            <div class="tokenops-field"><label for="to-copilot-seats">Seats</label><input id="to-copilot-seats" type="number" min="1" value="1"></div>
            <div class="tokenops-field"><label for="to-copilot-feature">Feature</label><select id="to-copilot-feature"></select></div>
            <div class="tokenops-field"><label for="to-copilot-provider">Provider</label><select id="to-copilot-provider"></select></div>
            <div class="tokenops-field tokenops-field--full"><label for="to-copilot-model">Selected model</label><select id="to-copilot-model"></select></div>
            <div class="tokenops-field"><label for="to-copilot-input">Input tokens</label><input id="to-copilot-input" type="number" min="0"></div>
            <div class="tokenops-field"><label for="to-copilot-cached">Cached input tokens</label><input id="to-copilot-cached" type="number" min="0"></div>
            <div class="tokenops-field"><label for="to-copilot-write">Cache-write tokens</label><input id="to-copilot-write" type="number" min="0"></div>
            <div class="tokenops-field"><label for="to-copilot-output">Output tokens</label><input id="to-copilot-output" type="number" min="0"></div>
            <div class="tokenops-field tokenops-field--full"><label for="to-copilot-interactions">Interactions / month</label><input id="to-copilot-interactions" type="number" min="1"></div>
            <label class="tokenops-checkbox"><input id="to-copilot-include-history" type="checkbox"> Include closing-down and retired models</label>
            <label class="tokenops-checkbox"><input id="to-copilot-auto" type="checkbox"> Model eligible for Auto selection estimate where documented</label>
            <label class="tokenops-checkbox"><input id="to-copilot-promo" type="checkbox" checked> Use promotional organization pool where applicable</label>
            <label class="tokenops-checkbox"><input id="to-copilot-compare" type="checkbox"> Compare alternative available models</label>
          </div>
          <p class="tokenops-micro">Agentic sessions can involve more interactions and context than a short chat. Adjust workload assumptions before budget decisions.</p>
        </form>
        <aside class="tokenops-card" data-role="copilot-summary" aria-live="polite"></aside>
      </div>
      <div data-role="copilot-comparison"></div>
      <div class="tokenops-warning">Lowest cost does not imply equivalent quality, latency, safety, context support or feature compatibility.</div>
    </div>
    <div data-sub-panel="copilot-billing" hidden></div>
    <div data-sub-panel="copilot-optimize" hidden></div>
    <div data-sub-panel="copilot-lifecycle" hidden></div>`;
}

function $root(root, selector) { return root.querySelector(selector); }
function id(root, value) { return root.querySelector(`#${value}`); }

async function readJson(baseUrl, filename, required = false) {
  try {
    const response = await fetch(new URL(`data/${filename}`, baseUrl));
    if (!response.ok) throw new Error(`${filename}: HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`[TokenOps] Failed loading ${filename}`, error);
    if (required) throw error;
    return null;
  }
}

function setupTabs(container, buttonSelector, panelAttribute) {
  const buttons = [...container.querySelectorAll(buttonSelector)];
  const activate = selected => {
    const key = selected.dataset[panelAttribute];
    buttons.forEach(button => button.setAttribute('aria-selected', String(button === selected)));
    container.querySelectorAll(`[data-${panelAttribute.replace('Tab', 'Panel')}]`).forEach(panel => {
      panel.hidden = panel.dataset[panelAttribute.replace('Tab', 'Panel')] !== key;
    });
  };
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => activate(button));
    button.addEventListener('keydown', event => {
      if (!['ArrowRight','ArrowLeft','Home','End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 :
        event.key === 'ArrowRight' ? (index + 1) % buttons.length : (index - 1 + buttons.length) % buttons.length;
      buttons[next].focus();
      activate(buttons[next]);
    });
  });
}

function setupTopTabs(root) {
  const tabs = [...root.querySelectorAll('[data-top-tab]')];
  const panels = [...root.querySelectorAll('[data-top-panel]')];
  const activate = tab => {
    tabs.forEach(button => button.setAttribute('aria-selected', String(button === tab)));
    panels.forEach(panel => panel.hidden = panel.dataset.topPanel !== tab.dataset.topTab);
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', event => {
      if (!['ArrowRight','ArrowLeft','Home','End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 :
        event.key === 'ArrowRight' ? (index + 1) % tabs.length : (index - 1 + tabs.length) % tabs.length;
      tabs[next].focus(); activate(tabs[next]);
    });
  });
}

function setupSubTabs(panel, prefix) {
  const buttons = [...panel.querySelectorAll('[data-sub-tab]')].filter(button => button.dataset.subTab.startsWith(prefix));
  const panels = [...panel.querySelectorAll('[data-sub-panel]')].filter(item => item.dataset.subPanel.startsWith(prefix));
  const activate = button => {
    buttons.forEach(entry => entry.setAttribute('aria-selected', String(entry === button)));
    panels.forEach(entry => entry.hidden = entry.dataset.subPanel !== button.dataset.subTab);
  };
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => activate(button));
    button.addEventListener('keydown', event => {
      if (!['ArrowRight','ArrowLeft','Home','End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 :
        event.key === 'ArrowRight' ? (index + 1) % buttons.length : (index - 1 + buttons.length) % buttons.length;
      buttons[next].focus(); activate(buttons[next]);
    });
  });
}

function flattenApiModels(api) {
  return api.providers.flatMap(provider => provider.models.map(model => ({
    ...model, providerId: provider.id, providerName: provider.name, officialSource: provider.officialSource
  })));
}
function currentApiModels(api, provider = 'all') {
  return flattenApiModels(api).filter(model =>
    model.pricingStatus === 'verified' &&
    API_ALLOWED_DEFAULT.has(model.lifecycleStatus) &&
    (provider === 'all' || model.providerId === provider)
  );
}
function visibleCopilotModels(copilot, provider, includeHistory) {
  return copilot.models.filter(model =>
    (provider === 'all' || model.provider === provider) &&
    (includeHistory || COPILOT_ALLOWED_DEFAULT.has(model.releaseStatus))
  );
}
function allPlans(plans) {
  return [...plans.individualPlans, ...plans.organizationPlans];
}

function populateSelect(select, items, selectedValue) {
  select.innerHTML = items.join('');
  if (selectedValue && [...select.options].some(item => item.value === selectedValue)) select.value = selectedValue;
}

function initializeApi(root, data) {
  const panel = $root(root, '[data-top-panel="api"]');
  panel.innerHTML = apiPanelTemplate();
  setupSubTabs(panel, 'api-');
  const scenarioSelect = id(root, 'to-api-scenario');
  const providerSelect = id(root, 'to-api-provider');
  const modelSelect = id(root, 'to-api-model');
  const modeSelect = id(root, 'to-api-mode');
  const tierSelect = id(root, 'to-api-tier');
  populateSelect(scenarioSelect, data.scenarios.api.map(item => option(item.id, item.name)));
  populateSelect(providerSelect, [option('all', 'All providers'), ...data.api.providers.map(provider => option(provider.id, provider.name))]);

  function modelsForProvider() { return currentApiModels(data.api, providerSelect.value); }
  function syncModels(preferred) {
    const models = modelsForProvider();
    if (!models.length) {
      modelSelect.innerHTML = option('', 'No compatible current models');
      render();
      return;
    }
    const selected = preferred && models.find(model => model.id === preferred) ? preferred : models[0].id;
    populateSelect(modelSelect, models.map(model => option(model.id, `${model.providerName} · ${model.name}`)), selected);
    syncModelDetails();
  }
  function selectedModel() { return modelsForProvider().find(model => model.id === modelSelect.value); }
  function syncModelDetails() {
    const model = selectedModel();
    if (!model) return render();
    const previousMode = modeSelect.value;
    populateSelect(modeSelect, model.modes.map(mode => option(mode.id, mode.label)), model.modes.some(mode => mode.id === previousMode) ? previousMode : model.modes[0].id);
    syncTiers();
  }
  function syncTiers() {
    const model = selectedModel();
    const mode = model?.modes.find(item => item.id === modeSelect.value);
    if (!mode) return render();
    const thresholded = mode.tiers.some(tier => tier.maxInputTokens != null || tier.minInputTokens != null);
    const options = thresholded ? [option('auto', 'Auto by published threshold')] : [];
    options.push(...mode.tiers.map(tier => option(tier.id, tier.label)));
    populateSelect(tierSelect, options, thresholded ? 'auto' : mode.tiers[0].id);
    render();
  }
  function inputValues() {
    return {
      inputTokens: nonNegative(id(root, 'to-api-input').value),
      cachedInputTokens: nonNegative(id(root, 'to-api-cached').value),
      cacheWriteTokens: nonNegative(id(root, 'to-api-write').value),
      outputTokens: nonNegative(id(root, 'to-api-output').value),
      requestsPerDay: nonNegative(id(root, 'to-api-requests').value, 1),
      daysPerMonth: nonNegative(id(root, 'to-api-days').value, 30)
    };
  }
  function applyScenario(scenarioId) {
    const scenario = data.scenarios.api.find(item => item.id === scenarioId);
    if (!scenario) return;
    id(root, 'to-api-input').value = scenario.inputTokens;
    id(root, 'to-api-cached').value = scenario.cachedInputTokens;
    id(root, 'to-api-write').value = scenario.cacheWriteTokens;
    id(root, 'to-api-output').value = scenario.outputTokens;
    id(root, 'to-api-requests').value = scenario.requestsPerDay;
    id(root, 'to-api-days').value = scenario.daysPerMonth;
    id(root, 'to-api-text').value = '';
    render();
  }
  function render() {
    const model = selectedModel();
    const summary = $root(root, '[data-role="api-summary"]');
    const comparison = $root(root, '[data-role="api-comparison"]');
    if (!model) {
      summary.innerHTML = empty('No verified current API model matches the selected provider.');
      comparison.innerHTML = '';
      return;
    }
    const result = calculateApiCost(model, inputValues(), modeSelect.value, tierSelect.value);
    if (!result) {
      summary.innerHTML = empty('No compatible verified pricing mode or context tier is available.');
      comparison.innerHTML = '';
      return;
    }
    const chips = [
      `${result.mode.label} · ${result.tier.label}`,
      result.cachedApplied ? 'Cached input applied' : 'No cached input applied',
      result.cacheWriteApplied ? 'Cache-write rate applied' : 'No cache-write cost applied'
    ];
    summary.innerHTML = `
      <div class="tokenops-summary__title"><div><h3>${safeText(model.name)}</h3><small>${safeText(model.providerName)}</small></div>${badge(model.lifecycleStatus)}</div>
      <div class="tokenops-metrics">
        <div class="tokenops-metric"><span>Per Request</span><strong>${money(result.perRequest)}</strong></div>
        <div class="tokenops-metric"><span>Daily</span><strong>${money(result.daily)}</strong></div>
        <div class="tokenops-metric"><span>Monthly</span><strong>${money(result.monthly)}</strong></div>
        <div class="tokenops-metric"><span>Annual</span><strong>${money(result.annual)}</strong></div>
      </div>
      <div class="tokenops-rule-chips">${chips.map(chip => `<span>${safeText(chip)}</span>`).join('')}</div>
      ${sourceLink(model.officialSource)}`;
    if (!id(root, 'to-api-compare').checked) {
      comparison.innerHTML = '';
      return;
    }
    const alternatives = currentApiModels(data.api).map(candidate => calculateApiCost(candidate, inputValues(), modeSelect.value, tierSelect.value))
      .filter(Boolean).sort((a, b) => a.monthly - b.monthly);
    comparison.innerHTML = alternatives.length ? `
      <div class="tokenops-table-wrap"><table>
        <caption>Verified current API alternatives under entered assumptions</caption>
        <thead><tr><th>Model</th><th>Status</th><th>Applied Rate</th><th>Monthly</th><th>Annual</th></tr></thead>
        <tbody>${alternatives.map(row => `<tr><td><strong>${safeText(row.model.name)}</strong>${safeText(row.model.providerName)}</td><td>${badge(row.model.lifecycleStatus)}</td><td>${safeText(row.mode.label)} · ${safeText(row.tier.label)}</td><td class="tokenops-money">${money(row.monthly)}</td><td class="tokenops-money">${money(row.annual)}</td></tr>`).join('')}</tbody>
      </table></div><div class="tokenops-warning">Lowest cost does not imply equivalent output quality, safety, latency or model capability.</div>` : empty('No alternative models support the selected pricing-mode assumptions.');
  }

  providerSelect.addEventListener('change', () => syncModels());
  modelSelect.addEventListener('change', syncModelDetails);
  modeSelect.addEventListener('change', syncTiers);
  tierSelect.addEventListener('change', render);
  scenarioSelect.addEventListener('change', () => applyScenario(scenarioSelect.value));
  ['to-api-input','to-api-cached','to-api-write','to-api-output','to-api-requests','to-api-days','to-api-compare'].forEach(value => id(root, value).addEventListener('input', render));
  id(root, 'to-api-text').addEventListener('input', event => {
    if (event.target.value.trim()) id(root, 'to-api-input').value = estimateTokens(event.target.value);
    render();
  });
  syncModels();
  applyScenario(data.scenarios.api[0].id);

  const mechanics = $root(root, '[data-sub-panel="api-mechanics"]');
  mechanics.innerHTML = `
    <div class="tokenops-formula"><code>Cost = ((uncached input × input rate) + (cached input × cached rate) + (cache write × cache-write rate) + (output × output rate)) ÷ 1,000,000</code></div>
    <div class="tokenops-learning-grid">
      <article class="tokenops-learning-card"><h3>Input</h3><p>Instructions, source context and payload supplied to the model.</p></article>
      <article class="tokenops-learning-card"><h3>Output</h3><p>Generated text or code. Output rates are frequently higher than input rates.</p></article>
      <article class="tokenops-learning-card"><h3>Caching</h3><p>Repeated stable context may use lower cached-input rates where published.</p></article>
      <article class="tokenops-learning-card"><h3>Pricing modes</h3><p>Batch, flex, priority and context tiers appear only where stored official data supports them.</p></article>
    </div>`;
  const optimize = $root(root, '[data-sub-panel="api-optimize"]');
  if (data.learning?.apiStrategies?.length) {
    optimize.innerHTML = `<div class="tokenops-learning-grid">${data.learning.apiStrategies.map(item => `<article class="tokenops-learning-card"><h3>${safeText(item.title)}</h3><p>${safeText(item.body)}</p></article>`).join('')}</div>`;
  } else {
    optimize.innerHTML = `<div class="tokenops-supporting-error">This supporting content is temporarily unavailable. The calculator remains active.</div>`;
  }
}

function initializeCopilot(root, data) {
  const panel = $root(root, '[data-top-panel="copilot"]');
  panel.innerHTML = copilotPanelTemplate();
  setupSubTabs(panel, 'copilot-');
  $root(root, '[data-role="copilot-verified"]').textContent = `Verified ${data.copilot.metadata.verifiedOn}`;
  const scenario = id(root, 'to-copilot-scenario');
  const plan = id(root, 'to-copilot-plan');
  const seats = id(root, 'to-copilot-seats');
  const feature = id(root, 'to-copilot-feature');
  const provider = id(root, 'to-copilot-provider');
  const model = id(root, 'to-copilot-model');

  populateSelect(scenario, data.scenarios.copilot.map(item => option(item.id, item.name)));
  populateSelect(plan, allPlans(data.plans).map(item => option(item.id, item.name)));
  populateSelect(feature, data.copilot.features.map(item => option(item.id, item.name)));
  const providers = [...new Set(data.copilot.models.map(item => item.provider))];
  populateSelect(provider, [option('all', 'All providers'), ...providers.map(item => option(item, item[0].toUpperCase() + item.slice(1)))]);

  function selectedPlan() { return allPlans(data.plans).find(item => item.id === plan.value); }
  function candidates() { return visibleCopilotModels(data.copilot, provider.value, id(root, 'to-copilot-include-history').checked); }
  function syncModels(preferred) {
    const options = candidates();
    if (!options.length) {
      model.innerHTML = option('', 'No matching models');
      render();
      return;
    }
    const defaultModel = options.find(item => item.name === 'GPT-5.4 mini') || options.find(item => item.releaseStatus === 'ga') || options[0];
    const selected = options.some(item => item.name === preferred) ? preferred : defaultModel.name;
    populateSelect(model, options.map(item => option(item.name, `${item.name} · ${item.category}`)), selected);
    render();
  }
  function selectedModel() { return candidates().find(item => item.name === model.value); }
  function inputValues() {
    return {
      featureId: feature.value,
      inputTokens: nonNegative(id(root, 'to-copilot-input').value),
      cachedInputTokens: nonNegative(id(root, 'to-copilot-cached').value),
      cacheWriteTokens: nonNegative(id(root, 'to-copilot-write').value),
      outputTokens: nonNegative(id(root, 'to-copilot-output').value),
      interactionsPerMonth: nonNegative(id(root, 'to-copilot-interactions').value, 1),
      autoSelection: id(root, 'to-copilot-auto').checked
    };
  }
  function applyScenario(value) {
    const item = data.scenarios.copilot.find(entry => entry.id === value);
    if (!item) return;
    feature.value = item.feature;
    id(root, 'to-copilot-input').value = item.inputTokens;
    id(root, 'to-copilot-cached').value = item.cachedInputTokens;
    id(root, 'to-copilot-write').value = item.cacheWriteTokens;
    id(root, 'to-copilot-output').value = item.outputTokens;
    id(root, 'to-copilot-interactions').value = item.interactionsPerMonth;
    render();
  }
  function fit(monthly, allowance) {
    if (allowance == null) return { text: 'Allowance not numerically listed', overage: null, remaining: null };
    const remaining = allowance - monthly;
    return remaining >= 0
      ? { text: `${credits(remaining)} credits remaining`, overage: 0, remaining }
      : { text: `${credits(Math.abs(remaining))} excess credits`, overage: Math.abs(remaining) * data.copilot.metadata.creditUsdValue, remaining };
  }
  function render() {
    const selected = selectedModel();
    const summary = $root(root, '[data-role="copilot-summary"]');
    const comparison = $root(root, '[data-role="copilot-comparison"]');
    if (!selected) {
      summary.innerHTML = empty('No GitHub Copilot model matches the selected provider and lifecycle filters.');
      comparison.innerHTML = '';
      return;
    }
    const selectedPlanValue = selectedPlan();
    const promotion = id(root, 'to-copilot-promo').checked;
    const allowance = allowanceForPlan(selectedPlanValue, seats.value, promotion);
    const result = calculateCopilotCost(selected, inputValues(), selectedPlanValue, data.copilot);
    const allowanceFit = fit(result.monthlyCredits, allowance);
    const rules = [
      result.featureUnbilled ? 'Feature is not AI-credit billed' : 'Token-based AI Credit estimate',
      result.cachedApplied ? 'Cached input applied' : 'No cached input applied',
      result.cacheWriteApplied ? 'Cache-write applied' : 'No cache-write cost',
      result.discountApplied ? 'Auto discount applied' : 'No Auto discount applied',
      selectedPlanValue?.type === 'organization' && promotion ? 'Promotional pool applied' : 'Standard allowance'
    ];
    summary.innerHTML = `
      <div class="tokenops-summary__title"><div><h3>${safeText(selected.name)}</h3><small>${safeText(selected.provider)} · ${safeText(selected.category)}</small></div>${badge(selected.releaseStatus)}</div>
      <div class="tokenops-metrics">
        <div class="tokenops-metric"><span>Credits / Interaction</span><strong>${credits(result.creditsPerInteraction)}</strong></div>
        <div class="tokenops-metric"><span>Cost / Interaction</span><strong>${money(result.perInteractionUsd)}</strong></div>
        <div class="tokenops-metric"><span>Credits / Month</span><strong>${credits(result.monthlyCredits)}</strong></div>
        <div class="tokenops-metric"><span>Estimated Overage</span><strong>${allowanceFit.overage == null ? 'Unknown' : money(allowanceFit.overage)}</strong></div>
      </div>
      <div class="tokenops-kpi-strip"><span>Plan pool: ${allowance == null ? 'Not numerically listed' : credits(allowance)}</span><span>${safeText(allowanceFit.text)}</span></div>
      <div class="tokenops-rule-chips">${rules.map(rule => `<span>${safeText(rule)}</span>`).join('')}</div>
      ${sourceLink(data.copilot.metadata.source)}`;
    if (!id(root, 'to-copilot-compare').checked) {
      comparison.innerHTML = '';
      return;
    }
    const alternatives = candidates().map(candidate => ({
      result: calculateCopilotCost(candidate, inputValues(), selectedPlanValue, data.copilot),
      candidate
    })).sort((a, b) => a.result.monthlyCredits - b.result.monthlyCredits);
    comparison.innerHTML = alternatives.length ? `
      <div class="tokenops-table-wrap"><table>
        <caption>Alternative GitHub Copilot model estimates under entered assumptions</caption>
        <thead><tr><th>Model</th><th>Status</th><th>Credits / Interaction</th><th>Monthly Credits</th><th>Plan Impact</th></tr></thead>
        <tbody>${alternatives.map(row => {
          const planFit = fit(row.result.monthlyCredits, allowance);
          return `<tr><td><strong>${safeText(row.candidate.name)}</strong>${safeText(row.candidate.provider)}</td><td>${badge(row.candidate.releaseStatus)}</td><td class="tokenops-money">${credits(row.result.creditsPerInteraction)}</td><td class="tokenops-money">${credits(row.result.monthlyCredits)}</td><td>${safeText(planFit.text)}</td></tr>`;
        }).join('')}</tbody>
      </table></div>` : empty('No alternative models match the selected filters.');
  }
  scenario.addEventListener('change', () => applyScenario(scenario.value));
  provider.addEventListener('change', () => syncModels());
  model.addEventListener('change', render);
  ['to-copilot-plan','to-copilot-seats','to-copilot-feature','to-copilot-input','to-copilot-cached','to-copilot-write','to-copilot-output','to-copilot-interactions','to-copilot-auto','to-copilot-promo','to-copilot-compare']
    .forEach(item => id(root, item).addEventListener('input', render));
  id(root, 'to-copilot-include-history').addEventListener('change', () => syncModels(model.value));
  syncModels('GPT-5.4 mini');
  applyScenario(data.scenarios.copilot[0].id);

  const billing = $root(root, '[data-sub-panel="copilot-billing"]');
  if (data.learning && data.legacy) {
    billing.innerHTML = `
      <div class="tokenops-formula"><code>AI Credits = Estimated model USD cost ÷ $0.01\n\nEstimated model USD cost = ((input × input rate) + (cached input × cached rate) + (cache write × cache-write rate where published) + (output × output rate)) ÷ 1,000,000</code></div>
      <div class="tokenops-warning">Legacy Premium Request Units are an education-only transition reference. They are not dollar costs and are not used by the AI Credits calculator.</div>
      <div class="tokenops-learning-grid">
        ${allPlans(data.plans).filter(item => item.includedCredits || item.includedCreditsPerSeat).map(item => `<article class="tokenops-learning-card"><h3>${safeText(item.name)}</h3><p><strong>${credits(item.includedCredits ?? item.includedCreditsPerSeat)}</strong> included credits ${item.type === 'organization' ? 'per seat under standard allowance.' : 'per month.'}</p></article>`).join('')}
      </div>
      <div class="tokenops-table-wrap"><table><caption>Legacy request-multiplier reference retained for transition learning</caption><thead><tr><th>Model</th><th>Legacy Multiplier</th></tr></thead><tbody>${data.legacy.models.map(entry => `<tr><td>${safeText(entry.name)}</td><td class="tokenops-money">${safeText(entry.multiplier)}×</td></tr>`).join('')}</tbody></table></div>`;
  } else {
    billing.innerHTML = `<div class="tokenops-supporting-error">This supporting billing education content is temporarily unavailable. The workload calculator remains active.</div>`;
  }

  const optimize = $root(root, '[data-sub-panel="copilot-optimize"]');
  optimize.innerHTML = data.learning?.copilotStrategies?.length
    ? `<div class="tokenops-learning-grid">${data.learning.copilotStrategies.map(item => `<article class="tokenops-learning-card"><h3>#${safeText(item.number)} ${safeText(item.title)}</h3><p>${safeText(item.body)}</p></article>`).join('')}</div>`
    : `<div class="tokenops-supporting-error">This supporting optimization content is temporarily unavailable. The workload calculator remains active.</div>`;

  const lifecycle = $root(root, '[data-sub-panel="copilot-lifecycle"]');
  const grouped = [
    ['Generally Available', data.copilot.models.filter(entry => entry.releaseStatus === 'ga')],
    ['Public Preview', data.copilot.models.filter(entry => entry.releaseStatus === 'public-preview')],
    ['Closing Down / Retired', data.copilot.models.filter(entry => ['closing-down','retired'].includes(entry.releaseStatus))]
  ];
  lifecycle.innerHTML = grouped.map(([title, items]) => `<h3>${safeText(title)}</h3><div class="tokenops-lifecycle-grid">${items.map(entry => `<article class="tokenops-lifecycle-card"><h3>${safeText(entry.name)}</h3><p>${badge(entry.releaseStatus)}</p><p>${safeText(entry.note || `Verified ${entry.verifiedOn}`)}</p></article>`).join('')}</div>`).join('') + sourceLink(data.copilot.metadata.supportedModelsSource, 'Official supported-model source ↗');
}

function initializeSources(root, data) {
  const panel = $root(root, '[data-top-panel="sources"]');
  const entries = data.api.providers.map(provider => ({
    title: provider.name, detail: `${provider.models.length} stored direct API model records`, source: provider.officialSource, date: data.api.metadata.verifiedOn
  })).concat([
    { title: 'GitHub Copilot Models and Pricing', detail: `${data.copilot.models.length} stored Copilot model records`, source: data.copilot.metadata.source, date: data.copilot.metadata.verifiedOn },
    { title: 'GitHub Copilot Individual Plans', detail: 'Included allowance registry', source: data.plans.metadata.individualSource, date: data.plans.metadata.verifiedOn },
    { title: 'GitHub Copilot Organizations', detail: 'Pooled allowances and promotional periods', source: data.plans.metadata.organizationSource, date: data.plans.metadata.verifiedOn }
  ]);
  panel.innerHTML = `<div class="tokenops-heading"><div><h2>Source Registry</h2><p>Official documentation sources used by the estimation registries.</p></div><span class="tokenops-badge tokenops-badge--ok">Traceable</span></div><div class="tokenops-source-grid">${entries.map(item => `<article class="tokenops-source-card"><h3>${safeText(item.title)}</h3><p>${safeText(item.detail)}</p><p>Verified ${safeText(item.date)}</p>${sourceLink(item.source)}</article>`).join('')}</div>`;
}

function initializeRadar(root, announcements) {
  const panel = $root(root, '[data-top-panel="radar"]');
  panel.innerHTML = `<div class="tokenops-heading"><div><h2>AI Usage Economics Change Radar</h2><p>Verified changes that alter cost, model availability or planning assumptions.</p></div><span class="tokenops-badge">Verified notices</span></div>` +
    (announcements?.announcements?.length ? `<div class="tokenops-radar-grid">${announcements.announcements.map(item => `<article class="tokenops-radar-card"><h3>${safeText(item.title)}</h3><p>${safeText(item.summary)}</p><p><strong>Impact:</strong> ${safeText(item.impact)}</p>${sourceLink(item.source)}</article>`).join('')}</div>` : `<div class="tokenops-supporting-error">Change Radar supporting content is temporarily unavailable. Calculators remain active.</div>`);
}

export async function mountTokenOps(root) {
  root.innerHTML = moduleTemplate();
  const status = $root(root, '[data-role="critical-status"]');
  const app = $root(root, '[data-role="application"]');
  const configuredBase = root.dataset.tokenopsBase;
  const baseUrl = configuredBase ? new URL(configuredBase, document.baseURI) : new URL('./', import.meta.url);
  try {
    const [api, copilot, plans, scenarios] = await Promise.all([
      readJson(baseUrl, FILES.api, true),
      readJson(baseUrl, FILES.copilot, true),
      readJson(baseUrl, FILES.plans, true),
      readJson(baseUrl, FILES.scenarios, true)
    ]);
    const [learning, legacy, announcements] = await Promise.all([
      readJson(baseUrl, FILES.learning, false),
      readJson(baseUrl, FILES.legacy, false),
      readJson(baseUrl, FILES.announcements, false)
    ]);
    const data = { api, copilot, plans, scenarios, learning, legacy, announcements };
    $root(root, '[data-role="verified-date"]').textContent = `Verified: ${copilot.metadata.verifiedOn}`;
    status.hidden = true;
    app.hidden = false;
    setupTopTabs(root);
    initializeApi(root, data);
    initializeCopilot(root, data);
    initializeRadar(root, announcements);
    initializeSources(root, data);
  } catch (error) {
    status.className = 'tokenops-error';
    status.innerHTML = `<strong>Unable to load calculator data.</strong> Refresh the page or review the embedded source registry files. The browser console contains the exact failed resource.`;
  }
}

if (typeof document !== 'undefined') {
  const root = document.getElementById('tokenops-lab-root');
  if (root) mountTokenOps(root);
}
