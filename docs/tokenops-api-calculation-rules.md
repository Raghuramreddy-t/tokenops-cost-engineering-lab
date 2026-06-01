# API Calculation Rules

All rates are USD per one million tokens.

```text
uncachedInputTokens = inputTokens - min(inputTokens, cachedInputTokens)

perRequest =
  (uncachedInputTokens × inputRate
  + cachedInputTokens × cachedInputRate
  + cacheWriteTokens × cacheWriteRate
  + outputTokens × outputRate) / 1,000,000

monthly = perRequest × requestsPerDay × daysPerMonth
annual = monthly × 12
```

A model is shown only when a verified stored pricing mode exists. For context tiers, the lab either applies a published numeric threshold or requires the user to select a stored tier; it does not invent provider rules.
