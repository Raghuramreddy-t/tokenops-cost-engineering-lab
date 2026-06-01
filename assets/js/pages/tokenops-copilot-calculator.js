import { nonNegative } from './tokenops-api-calculator.js';
export function allowanceForPlan(plan, seats = 1, usePromotion = false) {
  const count = Math.max(1, Math.floor(nonNegative(seats, 1)));
  if (plan.type === 'organization') {
    const credits = usePromotion && plan.promotionalCreditsPerSeat ?
      plan.promotionalCreditsPerSeat : plan.includedCreditsPerSeat;
    return credits * count;
  }
  return plan.includedCredits == null ? null : plan.includedCredits * count;
}
export function calculateCopilotCredits(model, inputs, plan, registry) {
  const feature = registry.features.find(entry => entry.id === inputs.featureId);
  if (feature && !feature.billed) return {model, feature, perInteractionUsd:0, monthlyUsd:0, monthlyCredits:0, discountApplied:false};
  const input = nonNegative(inputs.inputTokens);
  const cached = Math.min(input, nonNegative(inputs.cachedInputTokens));
  const uncached = input - cached;
  const written = nonNegative(inputs.cacheWriteTokens);
  const output = nonNegative(inputs.outputTokens);
  const interactions = Math.max(1, nonNegative(inputs.interactionsPerMonth, 1));
  let perInteractionUsd = (uncached * model.input + cached * model.cachedInput +
    written * (model.cacheWrite || 0) + output * model.output) / 1_000_000;
  const eligible = Boolean(inputs.autoSelection) && Boolean(plan.paid) &&
    registry.autoSelection.eligibleFeatures.includes(inputs.featureId) &&
    registry.autoSelection.eligibleModels.includes(model.name);
  if (eligible) perInteractionUsd *= (1 - registry.autoSelection.discountPercent / 100);
  const monthlyUsd = perInteractionUsd * interactions;
  return {model, feature, perInteractionUsd, monthlyUsd,
    monthlyCredits: monthlyUsd / registry.metadata.creditUsdValue, discountApplied:eligible};
}
