import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const appSource = await readFile(new URL("../app.js", import.meta.url), "utf8");
const indexSource = await readFile(new URL("../index.html", import.meta.url), "utf8");
const serverSource = await readFile(new URL("../server.mjs", import.meta.url), "utf8");

test("analysis review title and approval warning are internationalized", () => {
  assert.match(appSource, /"Hinweise aus der Analyse": "Issues from analysis"/);
  assert.match(appSource, /"Nacharbeit erforderlich: Dieses Requirement blockiert den Approval-Start, weil der Score unter \{\{minimumScore\}\}/);
  assert.doesNotMatch(indexSource, /Nacharbeit erforderlich: Dieses Requirement blockiert den Approval-Start/);
});

test("analysis severity, criteria, and status labels have translation keys", () => {
  assert.match(appSource, /niedrig: "low"/);
  assert.match(appSource, /mittel: "medium"/);
  assert.match(appSource, /hoch: "high"/);
  assert.match(appSource, /"Atomarität": "Atomicity"/);
  assert.match(appSource, /"Vollständigkeit": "Completeness"/);
  assert.match(appSource, /"FAILED": "Failed"/);
  assert.match(appSource, /"STALE": "Recalculation required"/);
});

test("language changes rerender the review and guard stale translation responses", () => {
  assert.match(appSource, /renderProductApprovalPanel\(\);/);
  assert.match(appSource, /feedbackTranslationRequestId/);
  assert.match(appSource, /feedbackTranslationInFlight\.has\(targetLanguage\)/);
  assert.match(appSource, /currentLanguage\(\) !== nextLanguage/);
});

test("analysis prompt keeps machine-readable keys language-neutral", () => {
  assert.match(serverSource, /Keep criterion as a language-neutral lowercase key/);
  assert.match(serverSource, /Keep severity enum values exactly low, medium, or high/);
  assert.match(serverSource, /Translate explanation and suggestion into the target language/);
});

test("feedback translation uses stable requirement batches instead of flat array indexes", () => {
  assert.match(appSource, /stableRequirementAnalysisId/);
  assert.match(appSource, /normalizeIssueIds/);
  assert.match(appSource, /analysisIssueSetHash/);
  assert.match(appSource, /requirements: pending\.map\(feedbackTranslationPayloadForEntry\)/);
  assert.doesNotMatch(appSource, /id: String\(index\+\+\)/);
  assert.doesNotMatch(serverSource, /\.slice\(0, 100\)/);
});

test("feedback translation validates complete requirement responses before merging", () => {
  assert.match(appSource, /function validateFeedbackTranslation/);
  assert.match(appSource, /issue count mismatch/);
  assert.match(appSource, /wrong requirement id/);
  assert.match(appSource, /changed severity/);
  assert.match(appSource, /empty explanation/);
  assert.match(appSource, /empty suggestion/);
  assert.match(appSource, /mergeFeedbackTranslation/);
});

test("feedback translation has batching, retry, progress, and stale-response protection", () => {
  assert.match(appSource, /FEEDBACK_TRANSLATION_BATCH_SIZE = 10/);
  assert.match(appSource, /FEEDBACK_TRANSLATION_MAX_ATTEMPTS = 3/);
  assert.match(appSource, /state\.feedbackTranslationRequestId !== requestId/);
  assert.match(appSource, /feedbackTranslationProgressText/);
  assert.match(appSource, /analysis_feedback_translation_completed/);
});

test("project close action is only available with an active project and uses central reset", () => {
  assert.match(indexSource, /id="closeProjectButton"[^>]*hidden/);
  assert.match(appSource, /closeProjectButton: document\.querySelector\("#closeProjectButton"\)/);
  assert.match(appSource, /async function closeActiveProject\(\)/);
  assert.match(appSource, /if \(!hasProject\(\)\) return false/);
  assert.match(appSource, /els\.closeProjectButton\.hidden = !projectOpen/);
  assert.match(appSource, /clearOpenProject\(\)/);
});

test("project close warns on dirty state without deleting project data", () => {
  const closeFunctionBody = appSource.match(/async function closeActiveProject\(\) \{[\s\S]*?\n\}/)?.[0] || "";
  assert.match(appSource, /updateProjectDirtyState\(\)/);
  assert.match(appSource, /state\.projectDirty/);
  assert.match(appSource, /"Projekt schließen\?"/);
  assert.match(appSource, /"Trotzdem schließen"/);
  assert.match(appSource, /window\.localStorage\.removeItem\("activeProjectId"\)/);
  assert.doesNotMatch(closeFunctionBody, /method: "DELETE"/);
});
