import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function readSource(fileName) {
  return readFile(new URL(fileName, root), "utf8");
}

test("AI operation status dialog exposes progress, steps and minimized background state", async () => {
  const html = await readSource("index.html");
  const css = await readSource("styles.css");

  assert.match(html, /id="progressOverlay"/);
  assert.match(html, /id="progressSteps"/);
  assert.match(html, /id="progressResult"/);
  assert.match(html, /id="progressMinimizeButton"/);
  assert.match(html, /id="progressMiniStatus"/);
  assert.match(css, /\.progress-steps/);
  assert.match(css, /\.progress-result\.is-error/);
  assert.match(css, /\.progress-mini-status/);
  assert.match(css, /--z-blocking-overlay:\s*260/);
});

test("AI operation runtime estimates are local, anonymized and capped before completion", async () => {
  const app = await readSource("app.js");

  assert.match(app, /AI_OPERATION_TIMING_STORAGE_KEY = "mieleDevPilot\.aiOperationRuntimeStats\.v1"/);
  assert.match(app, /AI_OPERATION_SIZE_CLASS_LIMITS/);
  assert.match(app, /function classifyAiOperationSize/);
  assert.match(app, /function estimateAiOperationDuration/);
  assert.match(app, /function rememberAiOperationRuntime/);
  assert.match(app, /history\.slice\(-200\)/);
  assert.match(app, /Math\.min\(95/);
  assert.doesNotMatch(app, /prompt\s*:/);
});

test("long running AI operations use the unified status helper", async () => {
  const app = await readSource("app.js");

  for (const operationType of [
    "product-improvement",
    "feedback-translation",
    "sr-derivation",
    "software-improvement",
    "e2e-derivation",
    "e2e-improvement",
    "workflow-derivation",
  ]) {
    assert.match(app, new RegExp(`operationType: "${operationType}"`));
  }

  assert.match(app, /fetchAiJsonWithStatus\(endpoint/);
  assert.match(app, /failProgress\(error\)/);
  assert.match(app, /els\.progressCloseButton\.hidden = true;[\s\S]*window\.setTimeout\(hideProgress/);
  assert.match(app, /await waitForNextPaint\(\);[\s\S]*const response = await fetch\(endpoint, \{ \.\.\.init, signal: controller\.signal \}\)/);
  assert.match(app, /els\.progressOverlay\.style\.display = "grid"/);
  assert.match(app, /function aiOperationTimeoutMs/);
  assert.match(app, /controller\.abort\(\)/);
  assert.match(app, /beforeunload/);
});

test("final score recalculation has visible status steps before it calls the AI endpoint", async () => {
  const app = await readSource("app.js");
  const css = await readSource("styles.css");

  assert.match(app, /function runFinalScoreRecalculation/);
  assert.match(app, /function fetchFinalScoreJson/);
  assert.match(app, /function showFinalScoreDialog/);
  assert.match(css, /\.final-score-progress-overlay/);
  assert.match(app, /"Score-Neuberechnung wird vorbereitet"/);
  assert.match(app, /"Übernommener Requirement-Inhalt wird analysiert"/);
  assert.match(app, /"Neuer Score und Analysehinweise werden geprüft"/);
  assert.match(app, /"Score und Hinweise werden aktualisiert"/);
  assert.match(app, /finalScoreProgressPercent/);
  assert.match(app, /saving:\s*10/);
  assert.match(app, /received:\s*70/);
  assert.match(app, /persisting:\s*90/);
  assert.match(app, /completed:\s*100/);
  assert.match(app, /timeoutMs:\s*35000/);
  assert.match(app, /Die Score-Neuberechnung hat zu lange gedauert und wurde abgebrochen/);
  assert.doesNotMatch(app.match(/async function runFinalScoreRecalculation[\s\S]*?async function fetchFinalScoreJson/)?.[0] || "", /fetchAiJsonWithStatus/);
});
