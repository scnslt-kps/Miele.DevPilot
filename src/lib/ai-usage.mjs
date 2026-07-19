export const AI_USAGE_CAPTURE_STARTED_AT = "2026-07-16";
export const AI_USAGE_PRICING_VERSION = "env-2026-07-16";

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

export function resolvePricing(model, env = process.env) {
  const normalizedModel = String(model || "").trim();
  const configured = parsePricingJson(env.OPENAI_MODEL_PRICING_JSON);
  if (normalizedModel && configured[normalizedModel]) {
    return normalizePricing(configured[normalizedModel], env.OPENAI_PRICING_VERSION || AI_USAGE_PRICING_VERSION);
  }

  const envModel = String(env.OPENAI_MODEL || "").trim();
  if (normalizedModel && envModel && normalizedModel === envModel) {
    const inputUsdPer1m = envNumber(env.OPENAI_INPUT_USD_PER_1M_TOKENS);
    const cachedInputUsdPer1m = envNumber(env.OPENAI_CACHED_INPUT_USD_PER_1M_TOKENS);
    const outputUsdPer1m = envNumber(env.OPENAI_OUTPUT_USD_PER_1M_TOKENS);
    if ([inputUsdPer1m, cachedInputUsdPer1m, outputUsdPer1m].some(Number.isFinite)) {
      return normalizePricing(
        {
          inputUsdPer1m,
          cachedInputUsdPer1m: Number.isFinite(cachedInputUsdPer1m) ? cachedInputUsdPer1m : inputUsdPer1m,
          outputUsdPer1m,
        },
        env.OPENAI_PRICING_VERSION || AI_USAGE_PRICING_VERSION,
      );
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
  const totalCost = formatMoney(Number(inputCost) + Number(cachedInputCost) + Number(outputCost));

  return {
    status: AI_USAGE_STATUS.CAPTURED,
    inputCost,
    outputCost,
    cachedInputCost,
    totalCost,
    pricingVersion: pricing.version,
    pricingAvailable: true,
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
    errorType: usage.hasUsage ? null : "missing_usage",
    pricingVersion: cost.pricingVersion,
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

function normalizePricing(value, fallbackVersion) {
  const pricing = value && typeof value === "object" ? value : {};
  const inputUsdPer1m = envNumber(pricing.inputUsdPer1m);
  const cachedInputUsdPer1m = envNumber(pricing.cachedInputUsdPer1m);
  const outputUsdPer1m = envNumber(pricing.outputUsdPer1m);
  if (!Number.isFinite(inputUsdPer1m) || !Number.isFinite(cachedInputUsdPer1m) || !Number.isFinite(outputUsdPer1m)) {
    return null;
  }

  return {
    inputUsdPer1m,
    cachedInputUsdPer1m,
    outputUsdPer1m,
    version: String(pricing.version || fallbackVersion || AI_USAGE_PRICING_VERSION),
  };
}

function moneyFromTokens(tokens, usdPer1m) {
  return formatMoney((positiveInteger(tokens) / 1_000_000) * Number(usdPer1m));
}

function formatMoney(value) {
  return (Number.isFinite(value) ? value : 0).toFixed(8);
}

function positiveInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.trunc(number) : 0;
}

function envNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
}
