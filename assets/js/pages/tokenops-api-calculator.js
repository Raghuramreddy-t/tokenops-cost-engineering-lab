export function nonNegative(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}
export function estimateTokens(text) {
  if (!text || !text.trim()) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}
export function selectTier(mode, totalInputTokens, tierPreference = 'auto') {
  if (!mode?.tiers?.length) return null;
  if (tierPreference !== 'auto') {
    const selected = mode.tiers.find(t => t.id === tierPreference ||
      (tierPreference === 'short' && ['default','under-200k','text'].includes(t.id)));
    if (selected) return selected;
  }
  return mode.tiers.find(t => (t.minInputTokens == null || totalInputTokens >= t.minInputTokens) &&
    (t.maxInputTokens == null || totalInputTokens <= t.maxInputTokens)) || mode.tiers[0];
}
export function calculateApiCost(model, inputs, modeId = 'standard', tierPreference = 'auto') {
  const inputTokens = nonNegative(inputs.inputTokens);
  const cachedTokens = Math.min(inputTokens, nonNegative(inputs.cachedInputTokens));
  const uncachedTokens = inputTokens - cachedTokens;
  const cacheWriteTokens = nonNegative(inputs.cacheWriteTokens);
  const outputTokens = nonNegative(inputs.outputTokens);
  const requestsPerDay = Math.max(1, nonNegative(inputs.requestsPerDay, 1));
  const daysPerMonth = Math.max(1, nonNegative(inputs.daysPerMonth, 30));
  const mode = model.modes.find(entry => entry.id === modeId);
  if (!mode) return null;
  const tier = selectTier(mode, inputTokens, tierPreference);
  if (!tier) return null;
  const cachedRate = tier.cachedInput == null ? tier.input : tier.cachedInput;
  const writeRate = tier.cacheWrite5m == null ? 0 : tier.cacheWrite5m;
  const perRequest = (uncachedTokens * tier.input + cachedTokens * cachedRate +
    cacheWriteTokens * writeRate + outputTokens * tier.output) / 1_000_000;
  const monthly = perRequest * requestsPerDay * daysPerMonth;
  return {model, mode, tier, perRequest, monthly, annual: monthly * 12};
}
