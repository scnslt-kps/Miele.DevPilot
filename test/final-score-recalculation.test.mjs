import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [app, server, css, html] = await Promise.all([
  readFile(new URL("../app.js", import.meta.url), "utf8"),
  readFile(new URL("../server.mjs", import.meta.url), "utf8"),
  readFile(new URL("../styles.css", import.meta.url), "utf8"),
  readFile(new URL("../index.html", import.meta.url), "utf8"),
]);

const recalcSource = app.match(/async function recalculateFinalScore[\s\S]*?async function fetchFinalScoreJson/)?.[0] || "";
const saveSource = app.match(/async function saveProductReviewFinalText[\s\S]*?async function recalculateProductReviewFinalScore/)?.[0] || "";
const acceptSource = app.match(/async function selectFinalText[\s\S]*?function productApprovalSubmissionBlockReason/)?.[0] || "";

test("final score recalculation is single-flight per requirement and versioned", () => {
  assert.match(app, /finalScoreOperations: new Map\(\)/);
  assert.match(recalcSource, /const existingOperation = state\.finalScoreOperations\.get\(rowNumber\)/);
  assert.match(recalcSource, /if \(existingOperation\?\.promise\)/);
  assert.match(recalcSource, /const analysisHash = options\.contentHash \|\| semanticContentHash\(finalText\)/);
  assert.match(recalcSource, /const operationId = options\.operationId \|\| crypto\.randomUUID\(\)/);
  assert.match(recalcSource, /contentHash:\s*analysisHash/);
  assert.doesNotMatch(recalcSource, /contentHash:\s*contentVersion/);
  assert.match(recalcSource, /finalRequirementAnalysisOperationId = operationId/);
  assert.match(recalcSource, /currentSelection\.finalRequirementAnalysisOperationId !== operationId/);
  assert.match(recalcSource, /currentSelection\.finalRequirementContentHash !== analysisHash/);
  assert.match(recalcSource, /Promise\.resolve\(\)\.then\(\(\) => runFinalScoreRecalculation/);
  assert.doesNotMatch(app, /PRODUCT_QUALITY_GATE_SCORE/);
});

test("edit save and AI acceptance persist final content before recalculating score", () => {
  assert.match(saveSource, /persistCurrentProjectNow\(projectRevisionActionFor\("Finales PR gespeichert"/);
  assert.match(saveSource, /await recalculateFinalScore\(item, selection\.text, selection\.choice \|\| "manual"/);
  assert.match(acceptSource, /persistCurrentProjectNow\(projectRevisionActionFor\("AI-Vorschlag uebernommen"/);
  assert.match(acceptSource, /await recalculateFinalScore\(item, text, choice, \{ contentHash: analysisHash, operationId \}\)/);
  assert.doesNotMatch(app, /FINAL_CONTENT_SAVE_STARTED/);
  assert.doesNotMatch(app, /FINAL_CONTENT_SAVE_COMPLETED/);
  assert.doesNotMatch(app, /RECALCULATION_REQUEST_STARTED/);
  assert.doesNotMatch(app, /RECALCULATION_FINALLY_ENTERED/);
  assert.doesNotMatch(acceptSource, /confirmFinalAiSuggestionAcceptance\(\)/);
});

test("final score progress is deterministic and not driven by the generic progress timer", () => {
  assert.match(app, /function finalScoreProgressPercent/);
  assert.match(app, /saving:\s*10/);
  assert.match(app, /started:\s*25/);
  assert.match(app, /received:\s*70/);
  assert.match(app, /persisting:\s*90/);
  assert.match(app, /completed:\s*100/);
  assert.doesNotMatch(recalcSource, /fetchAiJsonWithStatus/);
  assert.doesNotMatch(recalcSource, /setInterval|tickProgressCountdown|setProgressTimePercent/);
  assert.match(css, /\.final-score-progress-overlay/);
  assert.doesNotMatch(html, /score-dialog-20260719/);
});

test("final score failures cannot leave pending state forever", () => {
  assert.match(recalcSource, /finally \{/);
  assert.match(recalcSource, /hideFinalScoreDialog\(\)/);
  assert.match(recalcSource, /finalRequirementAnalysisStatus === "PENDING"/);
  assert.match(recalcSource, /finalRequirementAnalysisStatus = "FAILED"/);
  assert.match(recalcSource, /Score-Neuberechnung wurde ohne Ergebnis beendet/);
});

test("server final score requests have a timeout and fallback payload", () => {
  assert.match(server, /function fetchOpenAiResponses/);
  assert.match(server, /OPENAI_FINAL_SCORE_TIMEOUT_MS\) \|\| 15_000/);
  assert.match(server, /OpenAI request timed out/);
  assert.match(server, /analysisMode === "final"[\s\S]{0,140}productFinalQualityFallbackPayload\(cleaned\)/);
  assert.doesNotMatch(server, /RECALCULATION_API_ENTERED/);
  assert.doesNotMatch(server, /AI_ANALYSIS_STARTED/);
  assert.doesNotMatch(server, /AI_ANALYSIS_FAILED/);
  assert.doesNotMatch(server, /RESPONSE_SENT/);
});
