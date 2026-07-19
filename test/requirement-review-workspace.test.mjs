import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [app, html, css] = await Promise.all([
  readFile(new URL("../app.js", import.meta.url), "utf8"),
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../styles.css", import.meta.url), "utf8"),
]);

const workspaceHtml = html.match(/<section class="process-page requirement-review-workspace"[\s\S]*?<\/section>\s*<section class="process-page" id="page-software"/)?.[0] || "";

test("provides a full-page requirement review workspace instead of relying on the modal", () => {
  assert.match(html, /id="requirementReviewWorkspace"/);
  assert.match(html, /class="process-page requirement-review-workspace"/);
  assert.match(html, /id="reviewOriginalHost"/);
  assert.match(html, /id="reviewAnalysisHost"/);
  assert.match(html, /id="reviewAiHost"/);
  assert.doesNotMatch(workspaceHtml, /id="reviewFinalHost"/);
  assert.doesNotMatch(workspaceHtml, /id="reviewDecisionHost"/);
  assert.match(css, /\.review-workspace-header\s*\{/);
  assert.match(css, /position:\s*sticky/);
  assert.match(css, /\.review-workspace-grid/);
  assert.match(css, /\.review-decision-card/);
});

test("keeps the review workspace on the dark application theme", () => {
  assert.match(css, /--review-bg:\s*var\(--bg\)/);
  assert.match(css, /--review-panel:\s*var\(--panel\)/);
  assert.match(css, /background:\s*var\(--review-bg\)/);
  assert.match(css, /color:\s*var\(--review-text\)/);
  assert.match(css, /\.requirement-review-workspace \.choice-card/);
  assert.match(css, /\.requirement-review-workspace \.rich-text-editor/);
  assert.match(css, /\.requirement-review-workspace \.analysis-summary-grid/);
  assert.doesNotMatch(css, /\.review-workspace-section,[\s\S]{0,180}background:\s*#fff/);
  assert.match(css, /\.review-decision-card/);
});

test("uses the compact three step workspace flow and sidebar", () => {
  assert.match(workspaceHtml, /data-review-step="suggestion">1\. Prüfen und verbessern/);
  assert.match(workspaceHtml, /data-review-step="final-accept">2\. AI-Vorschlag übernehmen und Score berechnen/);
  assert.match(workspaceHtml, /data-review-step="decision">3\. Entscheidung/);
  assert.doesNotMatch(workspaceHtml, /Finales Requirement<\/h2>/);
  assert.match(css, /grid-template-columns:\s*minmax\(0,\s*1fr\)\s*minmax\(280px,\s*360px\)/);
  assert.doesNotMatch(css, /\.review-workspace-main\s*\{[\s\S]{0,180}grid-template-columns:\s*minmax\(0,\s*1fr\)\s*minmax\(0,\s*1fr\)/);
  assert.match(css, /\.step-pill\s*\{[\s\S]{0,80}display:\s*inline-grid/);
});

test("uses a route-like hash URL and browser navigation for review workspace", () => {
  assert.match(app, /#\/projects\/\$\{projectId\}\/requirements\/\$\{requirementId\}\/review/);
  assert.match(app, /window\.addEventListener\("hashchange", handleReviewRouteFromHash\)/);
  assert.match(app, /handleReviewRouteFromHash\(\)/);
  assert.match(app, /history\.pushState\(\{ reviewRowNumber: rowNumber \}/);
});

test("stores and restores requirement list context after final review actions", () => {
  assert.match(app, /captureRequirementListReturnContext/);
  assert.match(app, /sessionStorage\.setItem\(requirementReviewReturnContextKey\(\)/);
  assert.match(app, /listScrollTop/);
  assert.match(app, /statusFilter/);
  assert.match(app, /scoreFilterActive/);
  assert.match(app, /restoreRequirementListContext/);
  assert.match(app, /focusRequirementRow/);
  assert.match(css, /\.return-highlight/);
});

test("opens requirements through the workspace and mounts existing controls into structured sections", () => {
  assert.match(app, /openRequirementReviewWorkspace\(Number\(row\.dataset\.rowNumber\)\)/);
  assert.match(app, /mountProductReviewWorkspaceControls/);
  assert.match(app, /els\.reviewOriginalHost\.append\(originalCard\)/);
  assert.match(app, /els\.reviewAnalysisHost\.append\(issues\)/);
  assert.match(app, /els\.reviewAiHost\.append\(aiCard\)/);
  assert.doesNotMatch(app, /els\.reviewFinalHost\.append/);
  assert.doesNotMatch(app, /els\.reviewDecisionHost\.append/);
});

test("AI improvement preset buttons remain wired after moving the AI card into the workspace", () => {
  assert.match(app, /els\.reviewAiHost\.addEventListener\("click", handleProductReviewFinalTabClick\)/);
  assert.match(app, /event\.target\.closest\("#aiSuggestionEditButton"\)/);
  assert.match(app, /event\.stopPropagation\(\)/);
  assert.match(app, /startAiSuggestionEdit\(\)/);
  assert.match(app, /function applyAiSuggestionEditorVisibility/);
  assert.match(app, /els\.aiSuggestionEditorPanel\.style\.display = editing \? "grid" : ""/);
  assert.match(app, /state\.aiSuggestionEditingRow = Number\(state\.activeSelectionRow\)/);
  assert.match(app, /applyAiSuggestionEditorVisibility\(true\);[\s\S]{0,120}els\.aiSuggestionSaveButton\.disabled = true/);
  assert.match(app, /event\.target\.closest\("\[data-ai-assist\]"\)/);
  assert.match(app, /syncProductImprovementInstructionFromChips/);
  assert.match(app, /aria-pressed/);
  assert.match(app, /handleProductImprovementInstructionKeydown/);
});

test("weights the AI suggestion workspace toward content and compact actions", () => {
  assert.match(html, /class="ai-suggestion-accept-row"/);
  assert.match(html, /id="selectAiHint"/);
  assert.match(html, />AI-Vorschlag übernehmen<\/button>/);
  assert.match(html, /class="ai-improvement-presets" aria-label="Verbesserungsschwerpunkte"/);
  assert.match(html, /id="prImprovementResult" class="ai-improvement-result" hidden/);
  assert.match(html, /id="prImprovementResetButton"/);
  assert.match(app, /pendingProductImprovement/);
  assert.match(app, /renderPendingProductImprovement/);
  assert.match(app, /data-product-improvement-action="accept"/);
  assert.match(css, /\.requirement-review-workspace #selectionAiText\s*\{[\s\S]{0,180}min-height:\s*min\(34vh,\s*360px\)/);
  assert.match(css, /\.requirement-review-workspace \.ai-improvement-presets button\s*\{[\s\S]{0,160}width:\s*auto/);
  assert.match(css, /\.requirement-review-workspace #selectAiButton,[\s\S]{0,120}width:\s*auto/);
});

test("integrates the per-requirement decision actions into the review sidebar", () => {
  assert.match(workspaceHtml, /review-context-card review-decision-card/);
  assert.match(workspaceHtml, /id="reviewDecisionStatus"/);
  assert.match(workspaceHtml, /id="productReviewFinalActionsHost"/);
  assert.match(html, />Für Approval freigeben<\/button>/);
  assert.match(html, />PR ausschließen<\/button>/);
  assert.match(html, />Später entscheiden<\/button>/);
  assert.match(workspaceHtml, /data-review-step="decision"/);
  assert.match(css, /\.review-decision-card \.selection-actions\s*\{[\s\S]{0,120}display:\s*grid/);
});

test("AI acceptance does not require a confirmation dialog and blocks unsafe states", () => {
  assert.doesNotMatch(app, /await confirmFinalAiSuggestionAcceptance\(\)/);
  assert.match(app, /function productFinalAcceptBlockReason/);
  assert.match(app, /state\.aiSuggestionEditorDirty/);
  assert.match(app, /state\.pendingProductImprovement/);
  assert.match(app, /state\.projectSaveInFlight/);
  assert.match(app, /state\.finalScoreUpdates\.has\(Number\(item\.rowNumber\)\)/);
});

test("AI acceptance stores the saved AI version and recalculates score without forcing approval or 100", () => {
  assert.match(app, /selectedSource:\s*choice === "ai" \? "AI_PROPOSAL"/);
  assert.match(app, /finalizedContentHash:\s*choice === "ai" \? contentHash/);
  assert.match(app, /finalizedSuggestionVersion:/);
  assert.match(app, /finalRequirementAnalysisScore:\s*null/);
  assert.match(app, /finalRequirementAnalysisIssues:\s*\[\]/);
  assert.match(app, /recalculateFinalScore\(item, text, choice, \{ contentHash: analysisHash, operationId \}\)/);
  assert.match(app, /if \(Number\.isFinite\(recalculatedScore\)\) \{/);
  assert.match(app, /selection\.finalRequirementAnalysisScore = recalculatedScore/);
  assert.match(app, /selection\.finalRequirementAnalysisIssues = displayProductIssues\(updatedResult, selection\)/);
  assert.match(app, /function runFinalScoreRecalculation/);
  assert.match(app, /function fetchFinalScoreJson/);
  assert.match(app, /renderProductReviewPanel\(\)/);
  assert.doesNotMatch(app, /else if \(choice === "ai"\) \{\s*await returnToRequirementList/);
  assert.match(app, /approvedAt:\s*""/);
  assert.doesNotMatch(app, /score:\s*100/);
});

test("final score states drive quality gate and rework labels", () => {
  assert.match(app, /FINAL_SCORE_PASSED:\s*"Qualitäts-Gate erfüllt"/);
  assert.match(app, /FINAL_SCORE_FAILED:\s*"Nacharbeit erforderlich"/);
  assert.match(app, /SUBMITTED_FOR_APPROVAL:\s*"Für Approval freigegeben"/);
  assert.match(app, /productApprovalSubmissionBlockReason/);
  assert.match(app, /function productApprovalSubmissionBlockReason[\s\S]*finalScore < PRODUCT_STEP_MIN_SCORE/);
  assert.doesNotMatch(app, /function productApprovalSubmissionBlockReason[\s\S]*finalScore <= PRODUCT_STEP_MIN_SCORE/);
  assert.match(app, /Der aktuelle Score beträgt \{\{score\}\} von 100\. Für die Freigabe zum Approval sind mindestens \{\{minimumScore\}\} Punkte erforderlich\. Nacharbeit erforderlich\./);
  assert.match(app, /FINAL_ANALYSIS_FAILED:\s*"Analyse fehlgeschlagen"/);
  assert.match(app, /FINALIZATION_OPEN:\s*"Noch nicht übernommen"/);
  assert.match(app, /FINAL_REQUIREMENT_SELECTED:\s*"Als Requirement übernommen"/);
  assert.match(app, /qualityGate\.status === "PASSED"/);
});

test("review analysis keeps original score and original issues visible", () => {
  assert.match(app, /function renderRequirementReviewAnalysis/);
  assert.match(app, /Original-Analyse/);
  assert.match(app, /renderCompactAnalysisSummary\(result\)/);
  assert.match(app, /displayProductIssues\(result, null\)/);
  assert.match(css, /\.requirement-review-workspace \.analysis-review-block/);
});

test("saving or cancelling AI suggestion editing restores preview actions", () => {
  assert.match(app, /function finishAiSuggestionEditMode/);
  assert.match(app, /finishAiSuggestionEditMode\(result\);[\s\S]{0,120}renderProductReviewPanel\(\);[\s\S]{0,120}finishAiSuggestionEditMode\(result\);/);
  assert.match(app, /applyAiSuggestionEditorVisibility\(false\)/);
  assert.match(app, /els\.aiSuggestionEditButton\.hidden = !hasSuggestion/);
  assert.match(app, /els\.aiSuggestionSaveButton\.disabled = true/);
  assert.match(app, /els\.selectAiButton\.hidden = editing/);
  assert.match(app, /els\.selectAiHint\.hidden = editing/);
  assert.match(app, /if \(Number\(state\.aiSuggestionEditingRow\) === Number\(rowNumber\)\) return/);
  assert.match(app, /els\.selectAiButton\.hidden = false/);
  assert.doesNotMatch(app.match(/async function saveAiSuggestionEdit[\s\S]*?async function cancelAiSuggestionEdit/)?.[0] || "", /recalculateFinalScore/);
});

test("back to list replaces decide later and preserves return context", () => {
  assert.match(app, /els\.reviewBackButton\.addEventListener\("click", \(\) => returnToRequirementList/);
  assert.match(app, /Speichern und zur Liste/);
  assert.match(app, /Änderungen verwerfen/);
  assert.match(app, /Im Requirement bleiben/);
  assert.match(app, /restoreRequirementListContext/);
  assert.match(app, /focusRequirementRow/);
});

test("successful review submit returns to the requirement list", () => {
  assert.match(app, /async function handleProductReviewPrimaryAction\(\) \{[\s\S]*await submitActiveProductRequirementForApproval\(state\.activeSelectionRow\)[\s\S]*await returnToRequirementList\(\{ focusRow: state\.activeSelectionRow \}\)/);
});

test("keeps the context sidebar sticky and makes history secondary", () => {
  assert.match(css, /\.review-context-sidebar\s*\{[\s\S]{0,180}position:\s*sticky/);
  assert.match(css, /\.review-context-sidebar\s*\{[\s\S]{0,220}max-height:\s*calc\(100dvh - 180px\)/);
  assert.match(html, /review-context-card is-secondary/);
  assert.match(app, /<details class="review-history-details">/);
  assert.match(app, /<summary>\$\{escapeHtml\(translateUiText\("Änderungsverlauf"\)\)\} \(\$\{versions\.length\}\)<\/summary>/);
});

test("includes localized labels for the new workspace", () => {
  assert.match(app, /"Zurück zur Liste": "Back to list"/);
  assert.match(app, /"Requirement Review": "Requirement review"/);
  assert.match(app, /"Original Requirement": "Original requirement"/);
  assert.match(app, /"Nicht berechnet": "Not calculated"/);
  assert.match(app, /"Keine relevanten Qualitätsprobleme erkannt\.": "No relevant quality issues detected\."/);
  assert.match(app, /"Status & Score": "Status & score"/);
  assert.match(app, /"Kommentare & Historie": "Comments & history"/);
  assert.match(app, /"AI-Vorschlag übernehmen": "Accept AI suggestion"/);
  assert.match(app, /"Qualitäts-Gate erfüllt": "Quality gate met"/);
  assert.match(app, /"Nacharbeit erforderlich": "Rework required"/);
});
