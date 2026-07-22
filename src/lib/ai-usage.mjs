export const AI_USAGE_CAPTURE_STARTED_AT = "2026-07-16";
export const AI_USAGE_PRICING_VERSION = "openai-api-pricing-2026-07-22";

export const AI_MODEL_PRICING = Object.freeze([
  {
    canonicalModel: "gpt-5.5",
    aliases: ["gpt-5.5"],
    prefixes: ["gpt-5.5-"],
    inputUsdPer1m: "2.50",
    cachedInputUsdPer1m: "0.25",
    outputUsdPer1m: "15.00",
    currency: "USD",
    effectiveFrom: "2026-07-16",
    effectiveUntil: "",
    source: "OpenAI API pricing page checked 2026-07-22",
    version: AI_USAGE_PRICING_VERSION,
  },
]);

export const AI_USAGE_ACTIONS = {
  PRODUCT_REQUIREMENT_ANALYSIS: "product_requirement_analysis",
  IMPROVEMENT_SUGGESTION: "improvement_suggestion",
  TRANSLATION: "translation",
  SCORE_RECALCULATION: "score_recalculation",
  SOFTWARE_REQUIREMENT_GENERATION: "software_requirement_generation",
  USE_CASE_GENERATION: "use_case_generation",
  E2E_TESTCASE_GENERATION: "e2e_testcase_generation",
  USER_STORY_GENERATION: "user_story_generation",
  APP_TESTCASE_GENERATION: "app_testcase_generation",
  OTHER_AI_PROCESSING: "other_ai_processing",
};

export const AI_USAGE_STATUS = {
  CAPTURED: "captured",
  PRICE_UNAVAILABLE: "price_unavailable",
  MISSING_USAGE: "missing_usage",
};

export function extractOpenAiUsage(payload = {}) {
  const usage = payload?.usage;
  if (!usage || typeof usage !== "object") {
    return {
      hasUsage: false,
      inputTokens: 0,
      outputTokens: 0,
      cachedInputTokens: 0,
      reasoningTokens: 0,
      totalTokens: 0,
    };
  }

  const inputTokens = positiveInteger(usage.input_tokens);
  const outputTokens = positiveInteger(usage.output_tokens);
  const cachedInputTokens = positiveInteger(usage.input_tokens_details?.cached_tokens);
  const reasoningTokens = positiveInteger(usage.output_tokens_details?.reasoning_tokens);
  const totalTokens = positiveInteger(usage.total_tokens) || inputTokens + outputTokens;

  return {
    hasUsage: true,
    inputTokens,
    outputTokens,
    cachedInputTokens,
    reasoningTokens,
    totalTokens,
  };
}

export function resolvePricing(model, env = process.env, usageDate = new Date()) {
  const normalizedModel = String(model || "").trim();
  const configured = parsePricingJson(env.OPENAI_MODEL_PRICING_JSON);
  if (normalizedModel && configured[normalizedModel]) {
    const pricing = normalizePricing(configured[normalizedModel], env.OPENAI_PRICING_VERSION || AI_USAGE_PRICING_VERSION, normalizedModel);
    if (pricing && pricingAppliesAt(pricing, usageDate)) return pricing;
  }

  const configuredPricing = resolvePricingFromConfiguredEntries(normalizedModel, configured, env.OPENAI_PRICING_VERSION, usageDate);
  if (configuredPricing) return configuredPricing;

  const centralPricing = resolvePricingFromConfiguredEntries(normalizedModel, AI_MODEL_PRICING, AI_USAGE_PRICING_VERSION, usageDate);
  if (centralPricing) return centralPricing;

  const envModel = String(env.OPENAI_MODEL || "").trim();
  if (normalizedModel && envModel && normalizedModel === envModel) {
    const inputUsdPer1m = envNumber(env.OPENAI_INPUT_USD_PER_1M_TOKENS);
    const cachedInputUsdPer1m = envNumber(env.OPENAI_CACHED_INPUT_USD_PER_1M_TOKENS);
    const outputUsdPer1m = envNumber(env.OPENAI_OUTPUT_USD_PER_1M_TOKENS);
    if ([inputUsdPer1m, cachedInputUsdPer1m, outputUsdPer1m].some(Number.isFinite)) {
      const pricing = normalizePricing(
        {
          inputUsdPer1m,
          cachedInputUsdPer1m: Number.isFinite(cachedInputUsdPer1m) ? cachedInputUsdPer1m : inputUsdPer1m,
          outputUsdPer1m,
        },
        env.OPENAI_PRICING_VERSION || AI_USAGE_PRICING_VERSION,
        normalizedModel,
      );
      if (pricing && pricingAppliesAt(pricing, usageDate)) return pricing;
    }
  }

  return null;
}

export function calculateAiUsageCost(usage, pricing) {
  if (!usage?.hasUsage) {
    return {
      status: AI_USAGE_STATUS.MISSING_USAGE,
      inputCost: "0.00000000",
      outputCost: "0.00000000",
      cachedInputCost: "0.00000000",
      totalCost: "0.00000000",
      pricingVersion: pricing?.version || AI_USAGE_PRICING_VERSION,
      pricingAvailable: Boolean(pricing),
    };
  }

  if (!pricing) {
    return {
      status: AI_USAGE_STATUS.PRICE_UNAVAILABLE,
      inputCost: "0.00000000",
      outputCost: "0.00000000",
      cachedInputCost: "0.00000000",
      totalCost: "0.00000000",
      pricingVersion: AI_USAGE_PRICING_VERSION,
      pricingAvailable: false,
    };
  }

  const cachedInputTokens = Math.min(usage.cachedInputTokens || 0, usage.inputTokens || 0);
  const billableInputTokens = Math.max((usage.inputTokens || 0) - cachedInputTokens, 0);
  const inputCost = moneyFromTokens(billableInputTokens, pricing.inputUsdPer1m);
  const cachedInputCost = moneyFromTokens(cachedInputTokens, pricing.cachedInputUsdPer1m);
  const outputCost = moneyFromTokens(usage.outputTokens || 0, pricing.outputUsdPer1m);
  const totalCost = addMoney(inputCost, cachedInputCost, outputCost);

  return {
    status: AI_USAGE_STATUS.CAPTURED,
    inputCost,
    outputCost,
    cachedInputCost,
    totalCost,
    pricingVersion: pricing.version,
    pricingAvailable: true,
    resolvedModel: pricing.canonicalModel || pricing.model || "",
    inputUsdPer1m: pricing.inputUsdPer1m,
    cachedInputUsdPer1m: pricing.cachedInputUsdPer1m,
    outputUsdPer1m: pricing.outputUsdPer1m,
    pricingSource: pricing.source || "",
    pricingEffectiveFrom: pricing.effectiveFrom || "",
    pricingEffectiveUntil: pricing.effectiveUntil || "",
  };
}

export function buildAiUsageRecord({ payload, action, projectId, userId = "", env = process.env }) {
  const model = String(payload?.model || env.OPENAI_MODEL || "").trim() || "unknown";
  const usage = extractOpenAiUsage(payload);
  const pricing = resolvePricing(model, env);
  const cost = calculateAiUsageCost(usage, pricing);
  const providerRequestId = String(payload?.id || payload?.response?.id || "").trim() || null;

  return {
    projectId,
    userId: userId || null,
    action,
    model,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    cachedInputTokens: usage.cachedInputTokens,
    reasoningTokens: usage.reasoningTokens,
    totalTokens: usage.totalTokens,
    inputCost: cost.inputCost,
    outputCost: cost.outputCost,
    cachedInputCost: cost.cachedInputCost,
    totalCost: cost.totalCost,
    currency: "USD",
    providerRequestId,
    status: cost.status,
    errorType: usage.hasUsage ? (pricing ? null : "pricing_model_not_found") : "missing_usage",
    pricingVersion: cost.pricingVersion,
    resolvedModel: cost.resolvedModel || "",
    inputPriceUsdPer1m: cost.inputUsdPer1m || "0.00000000",
    cachedInputPriceUsdPer1m: cost.cachedInputUsdPer1m || "0.00000000",
    outputPriceUsdPer1m: cost.outputUsdPer1m || "0.00000000",
    pricingSource: cost.pricingSource || "",
    pricingEffectiveFrom: cost.pricingEffectiveFrom ? new Date(cost.pricingEffectiveFrom) : null,
    pricingEffectiveUntil: cost.pricingEffectiveUntil ? new Date(cost.pricingEffectiveUntil) : null,
  };
}

function parsePricingJson(value) {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function resolvePricingFromConfiguredEntries(model, entries, fallbackVersion = AI_USAGE_PRICING_VERSION, usageDate = new Date()) {
  const normalizedModel = normalizeModelSnapshotName(model);
  const list = Array.isArray(entries)
    ? entries
    : Object.entries(entries || {}).map(([key, value]) => ({ canonicalModel: key, aliases: [key], ...value }));
  return list
    .map((entry) => normalizePricing(entry, fallbackVersion, entry.canonicalModel || entry.model || ""))
    .find((entry) => pricingMatchesModel(model, normalizedModel, entry) && pricingAppliesAt(entry, usageDate)) || null;
}

export function normalizeModelSnapshotName(model) {
  return String(model || "")
    .trim()
    .replace(/-\d{4}-\d{2}-\d{2}$/u, "");
}

function pricingMatchesModel(rawModel, normalizedModel, pricing) {
  if (!pricing) return false;
  const model = String(rawModel || "");
  const canonical = String(pricing.canonicalModel || "");
  if (model === canonical || normalizedModel === canonical) return true;
  if ((pricing.aliases || []).some((alias) => model === alias || normalizedModel === alias)) return true;
  return (pricing.prefixes || []).some((prefix) => model.startsWith(prefix));
}

function pricingAppliesAt(pricing, usageDate) {
  const timestamp = usageDate instanceof Date ? usageDate.getTime() : new Date(usageDate || Date.now()).getTime();
  if (!Number.isFinite(timestamp)) return true;
  const from = pricing.effectiveFrom ? new Date(pricing.effectiveFrom).getTime() : NaN;
  const until = pricing.effectiveUntil ? new Date(pricing.effectiveUntil).getTime() : NaN;
  if (Number.isFinite(from) && timestamp < from) return false;
  if (Number.isFinite(until) && timestamp >= until) return false;
  return true;
}

function normalizePricing(value, fallbackVersion, fallbackModel = "") {
  const pricing = value && typeof value === "object" ? value : {};
  const inputUsdPer1m = normalizeDecimalString(pricing.inputUsdPer1m);
  const cachedInputUsdPer1m = normalizeDecimalString(pricing.cachedInputUsdPer1m);
  const outputUsdPer1m = normalizeDecimalString(pricing.outputUsdPer1m);
  if (!inputUsdPer1m || !cachedInputUsdPer1m || !outputUsdPer1m) {
    return null;
  }

  return {
    inputUsdPer1m,
    cachedInputUsdPer1m,
    outputUsdPer1m,
    version: String(pricing.version || fallbackVersion || AI_USAGE_PRICING_VERSION),
    canonicalModel: String(pricing.canonicalModel || pricing.model || fallbackModel || ""),
    aliases: Array.isArray(pricing.aliases) ? pricing.aliases.map(String) : [],
    prefixes: Array.isArray(pricing.prefixes) ? pricing.prefixes.map(String) : [],
    currency: String(pricing.currency || "USD"),
    effectiveFrom: String(pricing.effectiveFrom || ""),
    effectiveUntil: String(pricing.effectiveUntil || ""),
    source: String(pricing.source || ""),
  };
}

function moneyFromTokens(tokens, usdPer1m) {
  const tokenCount = BigInt(positiveInteger(tokens));
  const priceScale = decimalToScale(usdPer1m, 8);
  const scaledCost = (tokenCount * priceScale + 500_000n) / 1_000_000n;
  return formatScaledMoney(scaledCost);
}

function addMoney(...values) {
  const sum = values.reduce((total, value) => total + decimalToScale(value, 8), 0n);
  return formatScaledMoney(sum);
}

function formatScaledMoney(value) {
  const sign = value < 0n ? "-" : "";
  const absolute = value < 0n ? -value : value;
  const whole = absolute / 100_000_000n;
  const fraction = String(absolute % 100_000_000n).padStart(8, "0");
  return `${sign}${whole}.${fraction}`;
}

function normalizeDecimalString(value) {
  try {
    return formatScaledMoney(decimalToScale(value, 8));
  } catch {
    return "";
  }
}

function decimalToScale(value, scale) {
  const text = String(value ?? "").trim();
  if (!/^\d+(\.\d+)?$/u.test(text)) return 0n;
  const [whole, fraction = ""] = text.split(".");
  const padded = `${fraction}${"0".repeat(scale)}`.slice(0, scale);
  const nextDigit = Number(fraction[scale] || 0);
  return BigInt(whole || "0") * (10n ** BigInt(scale)) + BigInt(padded || "0") + (nextDigit >= 5 ? 1n : 0n);
}

function positiveInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.trunc(number) : 0;
}

function envNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
}
