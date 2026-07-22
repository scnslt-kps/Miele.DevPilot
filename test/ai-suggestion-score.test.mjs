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
  assert.match(app, /const finalScore = productFinalScore\(result, selection\)/);
  assert.match(app, /const finalScoreStatus = productFinalScoreStatus\(/);
  assert.match(app, /issues: displayProductIssues\(result, selection\)/);
  assert.match(app, /scoreBreakdown: activeScoreBreakdown/);
  assert.match(app, /finalScoreBreakdown: selection\?\.finalRequirementAnalysisScoreBreakdown/);
  assert.match(server, /improvementContext/);
  assert.match(server, /currentCriterionScores/);
  assert.match(server, /scoreGaps/);
  assert.match(server, /targetScoreInstruction/);
  assert.match(server, /fulfilledCriteria/);
  assert.match(server, /openCriteria/);
  assert.match(server, /100\/100/);
  assert.match(server, /qualityCheck is only a diagnostic prediction and is never the stored score/);
});

test("using a product improvement changes only the editable draft", () => {
  const acceptImprovementSource = app.match(/async function handlePendingProductImprovementAction[\s\S]*?async function selectFinalText/)?.[0] || "";

  assert.match(app, /data-product-improvement-action="accept" class="primary">\$\{escapeHtml\(translateUiText\("In Bearbeitung übernehmen"\)\)\}/);
  assert.match(acceptImprovementSource, /applyProductImprovementToEditingDraft\(pending, item, rowNumber\)/);
  assert.match(acceptImprovementSource, /els\.productReviewFinalText\?\.focus\(\)/);
  assert.doesNotMatch(acceptImprovementSource, /upsertResult\(activeImprovement\)/);
  assert.doesNotMatch(acceptImprovementSource, /await recalculateFinalScore/);
  assert.doesNotMatch(acceptImprovementSource, /requestApprovedProductRequirementChangeComment/);
  assert.doesNotMatch(acceptImprovementSource, /finalizedAt = new Date/);
  assert.doesNotMatch(acceptImprovementSource, /finalRequirementAnalysisScore\s*=\s*100/);
});

test("product improvement draft transfer keeps the original AI suggestion as a separate reference", () => {
  const transferSource = app.match(/function applyProductImprovementToEditingDraft[\s\S]*?async function requestProductRequirementImprovement/)?.[0] || "";

  assert.match(transferSource, /applyRichTextToFinalSelection\(selection, richTextFromPlainText\(improvedText\), "manual"\)/);
  assert.match(transferSource, /selectedSource = "MANUAL_EDIT"/);
  assert.doesNotMatch(transferSource, /upsertResult/);
  assert.doesNotMatch(transferSource, /aiSuggestionContentForResult/);
});

test("draft transfer marks score as stale and clears old final score data", () => {
  const transferSource = app.match(/function applyProductImprovementToEditingDraft[\s\S]*?async function requestProductRequirementImprovement/)?.[0] || "";

  assert.match(transferSource, /needsFinalAssessment = true/);
  assert.match(transferSource, /finalRequirementAnalysisStatus = "STALE"/);
  assert.match(transferSource, /finalRequirementAnalysisHash = ""/);
  assert.match(transferSource, /finalRequirementAnalysisScore = null/);
  assert.match(transferSource, /finalRequirementAnalysisScoreBreakdown = null/);
  assert.match(transferSource, /finalizedAt = ""/);
});

test("new product improvements prefer the current editable draft as source text", () => {
  const improvementSource = app.match(/async function improveProductRequirementWithAi[\s\S]*?function renderPendingProductImprovement/)?.[0] || "";

  assert.match(app, /function productImprovementBaseText/);
  assert.match(app, /return \{ text: editorText, source: "editing" \}/);
  assert.match(improvementSource, /const improvementBase = productImprovementBaseText\(item, result, rowNumber\)/);
  assert.match(improvementSource, /text: currentText/);
});

test("product improvement status dialog exposes generation, check, rescore, and optimization steps", () => {
  assert.match(app, /function productImprovementProgressSteps/);
  assert.match(app, /"Verbesserung wird erstellt"/);
  assert.match(app, /"Qualitätskriterien werden überprüft"/);
  assert.match(app, /"Score wird neu berechnet"/);
  assert.match(app, /"Verbleibende Qualitätsdefizite werden optimiert"/);
});

test("manual draft changes are confirmed before a preview replaces the editor", () => {
  const acceptImprovementSource = app.match(/async function handlePendingProductImprovementAction[\s\S]*?async function selectFinalText/)?.[0] || "";

  assert.match(app, /function productReviewFinalDraftChangedSinceImprovement/);
  assert.match(acceptImprovementSource, /productReviewFinalDraftChangedSinceImprovement\(pending\)/);
  assert.match(acceptImprovementSource, /Der aktuelle Bearbeitungsstand enthält Änderungen/);
  assert.match(acceptImprovementSource, /Bearbeitungsstand ersetzen\?/);
});

test("new product improvement translation keys are present", () => {
  assert.match(app, /"Verbesserung wird erstellt": "Creating improvement"/);
  assert.match(app, /"Qualitätskriterien werden überprüft": "Checking quality criteria"/);
  assert.match(app, /"Score wird neu berechnet": "Recalculating score"/);
  assert.match(app, /"Verbleibende Qualitätsdefizite werden optimiert": "Optimizing remaining quality deficits"/);
  assert.match(app, /"Verbleibende Punktabzüge:": "Remaining point deductions:"/);
  assert.match(app, /"In Bearbeitung übernehmen": "Use for editing"/);
  assert.match(app, /"Die Verbesserung wurde in den Bearbeitungsstand übernommen und kann weiter angepasst werden\.": "The improvement was copied into the editing draft and can be adjusted further\."/);
  assert.match(app, /"Bearbeitungsstand ersetzen\?": "Replace editing draft\?"/);
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
