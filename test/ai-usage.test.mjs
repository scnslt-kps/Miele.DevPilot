import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  AI_USAGE_STATUS,
  buildAiUsageRecord,
  calculateAiUsageCost,
  extractOpenAiUsage,
  normalizeModelSnapshotName,
  resolvePricing,
} from "../src/lib/ai-usage.mjs";

const serverSource = await readFile(new URL("../server.mjs", import.meta.url), "utf8");
const appSource = await readFile(new URL("../app.js", import.meta.url), "utf8");
const cssSource = await readFile(new URL("../styles.css", import.meta.url), "utf8");
const schemaSource = await readFile(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
const migrationSource = await readFile(new URL("../prisma/migrations/20260716090000_add_project_ai_usage/migration.sql", import.meta.url), "utf8");
const pricingDetailsMigrationSource = await readFile(new URL("../prisma/migrations/20260722102000_add_ai_usage_pricing_details/migration.sql", import.meta.url), "utf8");

test("extracts input, output, cached input, reasoning, and total tokens from OpenAI usage", () => {
  const usage = extractOpenAiUsage({
    usage: {
      input_tokens: 1200,
      output_tokens: 300,
      total_tokens: 1500,
      input_tokens_details: { cached_tokens: 200 },
      output_tokens_details: { reasoning_tokens: 75 },
    },
  });

  assert.deepEqual(usage, {
    hasUsage: true,
    inputTokens: 1200,
    outputTokens: 300,
    cachedInputTokens: 200,
    reasoningTokens: 75,
    totalTokens: 1500,
  });
});

test("calculates model costs with separate input, cached input, and output prices", () => {
  const cost = calculateAiUsageCost(
    {
      hasUsage: true,
      inputTokens: 1200,
      outputTokens: 300,
      cachedInputTokens: 200,
      totalTokens: 1500,
    },
    {
      inputUsdPer1m: 10,
      cachedInputUsdPer1m: 1,
      outputUsdPer1m: 20,
      version: "test-2026-07-16",
    },
  );

  assert.equal(cost.status, AI_USAGE_STATUS.CAPTURED);
  assert.equal(cost.inputCost, "0.01000000");
  assert.equal(cost.cachedInputCost, "0.00020000");
  assert.equal(cost.outputCost, "0.00600000");
  assert.equal(cost.totalCost, "0.01620000");
  assert.equal(cost.pricingVersion, "test-2026-07-16");
});

test("marks unknown models as price unavailable without dropping token usage", () => {
  const record = buildAiUsageRecord({
    projectId: "project-1",
    userId: "user-1",
    action: "product_requirement_analysis",
    payload: {
      id: "resp_1",
      model: "unknown-model",
      usage: { input_tokens: 50, output_tokens: 25, total_tokens: 75 },
    },
    env: {},
  });

  assert.equal(record.status, AI_USAGE_STATUS.PRICE_UNAVAILABLE);
  assert.equal(record.errorType, "pricing_model_not_found");
  assert.equal(record.inputTokens, 50);
  assert.equal(record.outputTokens, 25);
  assert.equal(record.totalCost, "0.00000000");
});

test("marks successful responses without usage data as missing usage", () => {
  const record = buildAiUsageRecord({
    projectId: "project-1",
    action: "translation",
    payload: { id: "resp_2", model: "priced-model" },
    env: {
      OPENAI_MODEL_PRICING_JSON: JSON.stringify({
        "priced-model": { inputUsdPer1m: 1, cachedInputUsdPer1m: 0.1, outputUsdPer1m: 2, version: "test" },
      }),
    },
  });

  assert.equal(record.status, AI_USAGE_STATUS.MISSING_USAGE);
  assert.equal(record.errorType, "missing_usage");
});

test("resolves pricing from central JSON configuration and preserves pricing version", () => {
  const pricing = resolvePricing("priced-model", {
    OPENAI_MODEL_PRICING_JSON: JSON.stringify({
      "priced-model": { inputUsdPer1m: 1.25, cachedInputUsdPer1m: 0.125, outputUsdPer1m: 10, version: "prices-2026-07-16" },
    }),
  });

  assert.equal(pricing.inputUsdPer1m, "1.25000000");
  assert.equal(pricing.cachedInputUsdPer1m, "0.12500000");
  assert.equal(pricing.outputUsdPer1m, "10.00000000");
  assert.equal(pricing.version, "prices-2026-07-16");
});

test("normalizes OpenAI snapshot model names to central pricing entries", () => {
  const pricing = resolvePricing("gpt-5.5-2026-04-23", {});

  assert.equal(normalizeModelSnapshotName("gpt-5.5-2026-04-23"), "gpt-5.5");
  assert.equal(pricing.canonicalModel, "gpt-5.5");
  assert.equal(pricing.inputUsdPer1m, "2.50000000");
  assert.equal(pricing.cachedInputUsdPer1m, "0.25000000");
  assert.equal(pricing.outputUsdPer1m, "15.00000000");
  assert.equal(pricing.currency, "USD");
  assert.equal(pricing.version, "openai-api-pricing-2026-07-22");
});

test("builds records with resolved tariff model and applied prices", () => {
  const record = buildAiUsageRecord({
    projectId: "project-1",
    userId: "user-1",
    action: "score_recalculation",
    payload: {
      id: "resp_snapshot",
      model: "gpt-5.5-2026-04-23",
      usage: { input_tokens: 1000, output_tokens: 100, total_tokens: 1100 },
    },
    env: {},
  });

  assert.equal(record.status, AI_USAGE_STATUS.CAPTURED);
  assert.equal(record.resolvedModel, "gpt-5.5");
  assert.equal(record.inputPriceUsdPer1m, "2.50000000");
  assert.equal(record.cachedInputPriceUsdPer1m, "0.25000000");
  assert.equal(record.outputPriceUsdPer1m, "15.00000000");
  assert.equal(record.inputCost, "0.00250000");
  assert.equal(record.outputCost, "0.00150000");
  assert.equal(record.totalCost, "0.00400000");
});

test("project AI usage persistence is project-scoped, permission-checked, and de-duplicated", () => {
  assert.match(schemaSource, /model ProjectAiUsage/);
  assert.match(schemaSource, /@@unique\(\[providerRequestId\]\)/);
  assert.match(schemaSource, /resolvedModel\s+String\s+@default\(""\)/);
  assert.match(schemaSource, /inputPriceUsdPer1m\s+Decimal\s+@default\(0\) @db\.Decimal\(18, 8\)/);
  assert.match(pricingDetailsMigrationSource, /ADD COLUMN "resolvedModel"/);
  assert.match(pricingDetailsMigrationSource, /ADD COLUMN "inputPriceUsdPer1m"/);
  assert.match(schemaSource, /references: \[id\], onDelete: Cascade/);
  assert.match(migrationSource, /CREATE TABLE "ProjectAiUsage"/);
  assert.match(migrationSource, /ON DELETE CASCADE/);
  assert.match(serverSource, /resolveProjectAiUsageContext/);
  assert.match(serverSource, /projectAccessWhere\(user\)/);
  assert.match(serverSource, /providerRequestId/);
  assert.match(serverSource, /findUnique\(\{\s*where: \{ providerRequestId/s);
});

test("project cost API and UI support aggregation, filters, pagination, and translations", () => {
  assert.match(serverSource, /handleProjectAiUsage/);
  assert.match(serverSource, /groupBy\(\{\s*by: \["action"\]/s);
  assert.match(serverSource, /groupBy\(\{\s*by: \["model"\]/s);
  assert.match(serverSource, /pageSize/);
  assert.match(serverSource, /backfillProjectAiUsageCosts/);
  assert.match(serverSource, /pricing_model_not_found/);
  assert.match(appSource, /getProjectAiUsageEndpoint/);
  assert.match(appSource, /projectAiUsageFilters/);
  assert.match(appSource, /translateAiUsageAction/);
  assert.match(appSource, /"Projektkosten": "Project costs"/);
  assert.match(appSource, /"Preis nicht verfügbar": "Price unavailable"/);
  assert.match(appSource, /"Nicht berechenbar": "Not calculable"/);
  assert.match(appSource, /"Die Kostenerfassung ist ab dem \{\{date\}\}/);
});

test("project cost dialog uses responsive cards, filters, and readable table cells", () => {
  assert.match(cssSource, /\.project-cost-summary\s*\{[\s\S]*repeat\(auto-fit, minmax\(170px, 1fr\)\)/);
  assert.match(cssSource, /\.project-cost-filters\s*\{[\s\S]*repeat\(auto-fit, minmax\(155px, 1fr\)\)/);
  assert.match(cssSource, /\.project-cost-table-wrap\s*\{[\s\S]*overflow: auto/);
  assert.match(cssSource, /\.project-cost-table\s*\{[\s\S]*min-width: 980px/);
  assert.match(cssSource, /\.project-cost-table th,\s*\.project-cost-table td\s*\{[\s\S]*overflow-wrap: anywhere/);
  assert.match(appSource, /formatUsdDisplay\(summary\.totalCost, \{ summary: true \}\)/);
  assert.match(appSource, /translateUiText\("Nicht berechenbar"\)/);
  assert.match(appSource, /costBreakdownTitle\(record\)/);
});
