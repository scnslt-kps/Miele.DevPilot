import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  PRODUCT_REQUIREMENT_QUALITY_CRITERIA,
  assessProductRequirementQuality,
  productRequirementQualityPromptContext,
} from "../src/lib/product-requirement-quality.mjs";
import { richTextFromPlainText, richTextToPlainText } from "../src/lib/rich-text.mjs";

const [app, server] = await Promise.all([
  readFile(new URL("../app.js", import.meta.url), "utf8"),
  readFile(new URL("../server.mjs", import.meta.url), "utf8"),
]);

test("accepting an AI suggestion marks final score pending and triggers recalculation", () => {
  assert.match(app, /selectedSource: choice === "ai" \? "AI_PROPOSAL" : "ORIGINAL"/);
  assert.match(app, /finalRequirementAnalysisStatus: choice === "ai" \? "PENDING" : "STALE"/);
  assert.match(app, /await recalculateFinalScore\(item, text, choice, \{ contentHash: analysisHash, operationId \}\)/);
  assert.match(app, /Score wird berechnet/);
  assert.doesNotMatch(app, /choice === "ai"[\s\S]{0,500}score:\s*100/);
});

test("old or failed final scores cannot pass workflow and approval gates", () => {
  assert.match(app, /selection\?\.finalRequirementAnalysisStatus === "PENDING"/);
  assert.match(app, /selection\?\.finalRequirementAnalysisStatus === "FAILED"/);
  assert.match(app, /scoreStatus === "FAILED" \|\| scoreStatus === "ANALYSIS_FAILED"/);
  assert.match(app, /const finalScore = productFinalScore\(result, selection\)/);
  assert.match(app, /!Number\.isFinite\(finalScore\) \|\| finalScore < PRODUCT_STEP_MIN_SCORE/);
});

test("recalculation is protected by a semantic content hash", () => {
  assert.match(app, /function semanticContentHash/);
  assert.match(app, /finalRequirementContentHash/);
  assert.match(app, /currentSelection\.finalRequirementContentHash !== analysisHash/);
  assert.match(app, /Veraltetes Analyseergebnis verworfen/);
});

test("failed recalculation keeps the final requirement but blocks qualification", () => {
  assert.match(app, /finalRequirementAnalysisStatus = "FAILED"/);
  assert.match(app, /Die AI Suggestion wurde übernommen, der neue Score konnte jedoch nicht berechnet werden/);
  assert.match(app, /selection\.needsFinalAssessment = true/);
  assert.match(app, /delete selection\.previousScore/);
});

test("final score response must map to the active row and contain a numeric score", () => {
  assert.match(app, /updatedResult\.rowNumber = Number\.isFinite\(Number\(updatedResult\.rowNumber\)\) \? Number\(updatedResult\.rowNumber\) : rowNumber/);
  assert.match(app, /Analyse lieferte keinen numerischen Score\./);
  assert.match(app, /selection\.finalRequirementAnalysisStatus = "COMPLETED"[\s\S]*selection\.finalRequirementAnalysisScore = recalculatedScore/);
  assert.match(app, /selection\.finalRequirementAnalysisStatus = "FAILED"[\s\S]*selection\.finalRequirementAnalysisScore = null/);
});

test("formatted semantic content is analyzed as separated plain text without html tags", () => {
  const content = richTextFromPlainText("Das System muss den Benutzer authentifizieren.\n\n- Nach drei Fehlversuchen muss das Konto gesperrt werden.\n- Der Benutzer muss eine Meldung erhalten.");
  const text = richTextToPlainText(content);

  assert.match(text, /\n\n- Nach drei Fehlversuchen/);
  assert.match(text, /\n- Der Benutzer muss/);
  assert.doesNotMatch(text, /<li>|<ul>|<\/p>/);
});

test("project contains no direct positive max score assignment for accepted suggestions", () => {
  assert.doesNotMatch(`${app}\n${server}`, /score\s*[:=]\s*100/);
  assert.doesNotMatch(`${app}\n${server}`, /sourceScore === 100/);
  assert.doesNotMatch(app, /usePreviousScore/);
});

test("product analysis and improvement use one central quality definition", () => {
  const context = productRequirementQualityPromptContext({ uiLanguage: "de" });
  const criterionIds = PRODUCT_REQUIREMENT_QUALITY_CRITERIA.map((criterion) => criterion.id);

  assert.equal(PRODUCT_REQUIREMENT_QUALITY_CRITERIA.reduce((sum, criterion) => sum + criterion.maxPoints, 0), 100);
  assert.deepEqual(context.criteria.map((criterion) => criterion.id), criterionIds);
  assert.match(server, /productRequirementQualityPromptContext\(\{ uiLanguage \}\)/);
  assert.match(server, /qualityDefinition/);
  assert.match(server, /requirementQualityResultSchema\(\)/);
  assert.match(server, /assessProductRequirementQuality\(text\)/);
});

test("product improvement prompt receives current score gaps without trusting generator score", () => {
  assert.match(app, /finalScore: productFinalScore\(result, state\.finalSelections\.get\(Number\(rowNumber\)\)\)/);
  assert.match(app, /finalScoreStatus: productFinalScoreStatus\(/);
  assert.match(app, /issues: displayProductIssues\(result, state\.finalSelections\.get\(Number\(rowNumber\)\)\)/);
  assert.match(server, /improvementContext/);
  assert.match(server, /fulfilledCriteria/);
  assert.match(server, /openCriteria/);
  assert.match(server, /qualityCheck is only a diagnostic prediction and is never the stored score/);
});

test("local product quality assessment penalizes missing facts instead of pretending maximum quality", () => {
  const assessment = assessProductRequirementQuality("Die App soll schnell und intuitiv sein.");

  assert.ok(assessment.score < 100);
  assert.ok(assessment.issues.some((issue) => issue.criterion === "clarity"));
  assert.ok(assessment.issues.some((issue) => issue.criterion === "completeness"));
});

test("final score recalculation has a central quality fallback instead of blocking accepted AI suggestions", () => {
  assert.match(server, /function productFinalQualityFallbackPayload\(requirements\)/);
  assert.match(server, /analysisMode === "final"[\s\S]{0,100}productFinalQualityFallbackPayload\(cleaned\)/);
  assert.match(server, /const assessment = assessProductRequirementQuality\(item\.text\)/);
  assert.match(server, /analysisSource: "local-quality-fallback"/);
});
