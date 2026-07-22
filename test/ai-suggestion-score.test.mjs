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

test("using a product improvement changes only the editable AI suggestion", () => {
  const acceptImprovementSource = app.match(/async function handlePendingProductImprovementAction[\s\S]*?async function selectFinalText/)?.[0] || "";

  assert.match(app, /data-product-improvement-action="accept" class="primary">\$\{escapeHtml\(translateUiText\("Übernehmen"\)\)\}/);
  assert.match(acceptImprovementSource, /applyProductImprovementToAiSuggestion\(pending, result, rowNumber\)/);
  assert.doesNotMatch(acceptImprovementSource, /startAiSuggestionEdit\(\)/);
  assert.doesNotMatch(acceptImprovementSource, /aiSuggestionEditor\.focus\(\)/);
  assert.doesNotMatch(acceptImprovementSource, /upsertResult\(activeImprovement\)/);
  assert.doesNotMatch(acceptImprovementSource, /await recalculateFinalScore/);
  assert.doesNotMatch(acceptImprovementSource, /requestApprovedProductRequirementChangeComment/);
  assert.doesNotMatch(acceptImprovementSource, /finalizedAt = new Date/);
  assert.doesNotMatch(acceptImprovementSource, /finalRequirementAnalysisScore\s*=\s*100/);
});

test("product improvement transfer does not touch final selections or approval state", () => {
  const transferSource = app.match(/function applyProductImprovementToAiSuggestion[\s\S]*?async function requestProductRequirementImprovement/)?.[0] || "";

  assert.match(transferSource, /result\.aiSuggestionContent = content/);
  assert.match(transferSource, /result\.aiSuggestionExpectedScore = Number\.isFinite\(Number\(pending\.expectedScore\)\)/);
  assert.match(transferSource, /result\.aiSuggestionExpectedScoreStatus = "CURRENT"/);
  assert.doesNotMatch(transferSource, /upsertResult/);
  assert.doesNotMatch(transferSource, /state\.finalSelections\.set/);
  assert.doesNotMatch(transferSource, /selectedSource = "MANUAL_EDIT"/);
  assert.doesNotMatch(transferSource, /submittedForApprovalAt/);
});

test("manual AI suggestion edits mark the expected improvement score stale", () => {
  const dirtySource = app.match(/function markAiSuggestionEditorDirty[\s\S]*?function handleAiSuggestionToolbarClick/)?.[0] || "";
  const saveSource = app.match(/async function saveAiSuggestionEdit[\s\S]*?async function cancelAiSuggestionEdit/)?.[0] || "";

  assert.match(dirtySource, /result\.aiSuggestionExpectedScoreStatus = "STALE"/);
  assert.match(dirtySource, /Der voraussichtliche Score kann nach manueller Änderung veraltet sein/);
  assert.match(saveSource, /result\.aiSuggestionExpectedScoreHash !== semanticContentHash\(plainText\)/);
  assert.match(saveSource, /result\.aiSuggestionExpectedScoreStatus = "STALE"/);
});

test("new product improvements use the currently visible AI suggestion as source text", () => {
  const improvementSource = app.match(/async function improveProductRequirementWithAi[\s\S]*?function renderPendingProductImprovement/)?.[0] || "";

  assert.match(app, /function productImprovementBaseText/);
  assert.match(app, /richTextFromEditorElement\(els\.aiSuggestionEditor\)/);
  assert.match(app, /return \{ text: editorText, source: "editable-ai-suggestion" \}/);
  assert.match(improvementSource, /const improvementBase = productImprovementBaseText\(item, result, rowNumber\)/);
  assert.match(improvementSource, /text: currentText/);
});

test("product improvement preview is scored independently against the displayed text", () => {
  const scoringSource = app.match(/async function scoreProductImprovementPreview[\s\S]*?function markProductReviewFinalTextStale/)?.[0] || "";
  const renderSource = app.match(/function renderPendingProductImprovement[\s\S]*?function clearPendingProductImprovement/)?.[0] || "";

  assert.match(app, /expectedScore: expected\.score/);
  assert.match(app, /expectedScoreBreakdown: expected\.scoreBreakdown/);
  assert.match(app, /expectedAssessmentHash: expected\.assessmentHash/);
  assert.match(scoringSource, /analysisMode: "final"/);
  assert.match(scoringSource, /contentVersion: assessmentHash/);
  assert.match(scoringSource, /text: improvedText/);
  assert.match(scoringSource, /scoreBreakdown: normalizeScoreBreakdown\(assessed\.scoreBreakdown\)/);
  assert.doesNotMatch(renderSource, /renderIssues\(pending\.expectedIssues/);
  assert.doesNotMatch(renderSource, /Voraussichtliche Bewertung/);
});

test("product improvement status dialog exposes generation, check, expected score, and optimization steps", () => {
  assert.match(app, /function productImprovementProgressSteps/);
  assert.match(app, /"Verbesserung wird erstellt"/);
  assert.match(app, /"Qualitätskriterien werden geprüft"/);
  assert.match(app, /"Voraussichtlicher Score wird berechnet"/);
  assert.match(app, /"Verbesserung wird weiter optimiert"/);
});

test("further optimization uses the current preview and preserves it on errors", () => {
  const acceptImprovementSource = app.match(/async function handlePendingProductImprovementAction[\s\S]*?async function selectFinalText/)?.[0] || "";

  assert.match(acceptImprovementSource, /const currentImprovementText = String\(pending\.improved\?\.rewrittenRequirement \|\| ""\)\.trim\(\)/);
  assert.match(acceptImprovementSource, /text: currentImprovementText/);
  assert.match(acceptImprovementSource, /nextAttempt > PRODUCT_IMPROVEMENT_MAX_ATTEMPTS/);
  assert.match(acceptImprovementSource, /state\.pendingProductImprovement = \{/);
  assert.match(acceptImprovementSource, /catch \(error\)[\s\S]*renderPendingProductImprovement\(\)/);
});

test("new product improvement translation keys are present", () => {
  assert.match(app, /"Verbesserung wird erstellt": "Creating improvement"/);
  assert.match(app, /"Qualitätskriterien werden geprüft": "Checking quality criteria"/);
  assert.match(app, /"Qualitätskriterien werden überprüft": "Checking quality criteria"/);
  assert.match(app, /"Voraussichtlicher Score wird berechnet": "Calculating expected score"/);
  assert.match(app, /"Voraussichtlicher Score": "Expected score"/);
  assert.match(app, /"Verteilung des voraussichtlichen Scores": "Expected score distribution"/);
  assert.match(app, /"Optimieren": "Optimize"/);
  assert.match(app, /"Weiter optimieren": "Optimize further"/);
  assert.match(app, /"Verbleibende Qualitätsdefizite werden optimiert": "Optimizing remaining quality deficits"/);
  assert.match(app, /"Verbleibende Punktabzüge:": "Remaining point deductions:"/);
  assert.match(app, /"In Bearbeitung übernehmen": "Use for editing"/);
  assert.match(app, /"Die Verbesserung wurde in den Bearbeitungsstand übernommen und kann weiter angepasst werden\.": "The improvement was copied into the editing draft and can be adjusted further\."/);
  assert.match(app, /"Der aktuelle AI-Vorschlag wird als Requirement-Inhalt übernommen und neu bewertet\. Offene Editor-Änderungen werden dabei berücksichtigt\.": "The current AI suggestion will be accepted as the requirement content and reassessed\. Open editor changes are included\."/);
});

test("product improvement text is sanitized and never carries visible diagnostics", () => {
  assert.match(app, /function cleanGeneratedImprovementText/);
  assert.match(app, /forbiddenHeadingPattern/);
  assert.match(app, /cleanGeneratedImprovementText\(improved\.rewrittenRequirement \|\| currentText\)/);
  assert.match(server, /function sanitizeProductImprovementRequirementText/);
  assert.match(server, /parsed\.result\.rewrittenRequirement = sanitizeProductImprovementRequirementText\(parsed\.result\.rewrittenRequirement\)/);
  assert.match(server, /The result\.rewrittenRequirement field must contain only the optimized Product Requirement text itself/);
  assert.match(server, /Never include qualityCheck, score, issues, missingInformation, assumptions, or explanatory labels inside rewrittenRequirement/);
});

test("accepting the final AI suggestion uses the current editor content", () => {
  const acceptSource = app.match(/async function selectFinalText[\s\S]*?function productApprovalSubmissionBlockReason/)?.[0] || "";

  assert.match(app, /function currentAiSuggestionContentForAcceptance/);
  assert.match(acceptSource, /currentAiSuggestionContentForAcceptance\(result, rowNumber, \{ updateResult: true \}\)/);
  assert.doesNotMatch(acceptSource, /Number\(state\.aiSuggestionEditingRow\) === Number\(rowNumber\)\) return/);
  assert.match(acceptSource, /await recalculateFinalScore\(item, text, choice, \{ contentHash: analysisHash, operationId \}\)/);
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
