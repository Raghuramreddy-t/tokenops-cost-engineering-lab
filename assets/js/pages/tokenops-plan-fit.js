export function explainAllowance(monthlyCredits, allowance) {
  if (allowance == null) return {label:'Allowance not numerically published', remaining:null, overageUsd:null};
  const remaining = allowance - monthlyCredits;
  return remaining >= 0
    ? {label:`${Math.max(0, remaining).toFixed(1)} credits remaining`, remaining, overageUsd:0}
    : {label:`${Math.abs(remaining).toFixed(1)} excess credits`, remaining, overageUsd:Math.abs(remaining) * 0.01};
}
