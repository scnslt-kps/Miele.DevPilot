import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  AI_USAGE_STATUS,
  buildAiUsageRecord,
  calculateAiUsageCost,
  extractOpenAiUsage,
  resolvePricing,
} from "../src/lib/ai-usage.mjs";

const serverSource = await readFile(new URL("../server.mjs", import.meta.url), "utf8");
const appSource = await readFile(new URL("../app.js", import.meta.url), "utf8");
const schemaSource = await readFile(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
const migrationSource = await readFile(new URL("../prisma/migrations/20260716090000_add_project_ai_usage/migration.sql", import.meta.url), "utf8");

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

  assert.equal(pricing.inputUsdPer1m, 1.25);
  assert.equal(pricing.cachedInputUsdPer1m, 0.125);
  assert.equal(pricing.outputUsdPer1m, 10);
  assert.equal(pricing.version, "prices-2026-07-16");
});

test("project AI usage persistence is project-scoped, permission-checked, and de-duplicated", () => {
  assert.match(schemaSource, /model ProjectAiUsage/);
  assert.match(schemaSource, /@@unique\(\[providerRequestId\]\)/);
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
  assert.match(appSource, /getProjectAiUsageEndpoint/);
  assert.match(appSource, /projectAiUsageFilters/);
  assert.match(appSource, /translateAiUsageAction/);
  assert.match(appSource, /"Projektkosten": "Project costs"/);
  assert.match(appSource, /"Preis nicht verfügbar": "Price unavailable"/);
  assert.match(appSource, /"Die Kostenerfassung ist ab dem \{\{date\}\}/);
});
