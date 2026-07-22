import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [app, server, schema, migration] = await Promise.all([
  readFile(new URL("../app.js", import.meta.url), "utf8"),
  readFile(new URL("../server.mjs", import.meta.url), "utf8"),
  readFile(new URL("../prisma/schema.prisma", import.meta.url), "utf8"),
  readFile(new URL("../prisma/migrations/20260722083000_add_user_workspace_state/migration.sql", import.meta.url), "utf8"),
]);

test("workspace state is stored per user and per project in the database", () => {
  assert.match(schema, /model UserWorkspaceState/);
  assert.match(schema, /userId\s+String/);
  assert.match(schema, /projectId\s+String\?/);
  assert.match(schema, /selectedStatus\s+String\s+@default\("all"\)/);
  assert.match(schema, /selectedCategory\s+String\s+@default\(""\)/);
  assert.match(schema, /selectedSubcategory\s+String\s+@default\(""\)/);
  assert.match(schema, /activeFilters\s+Json\s+@default\("\{}"\)/);
  assert.match(schema, /sortField\s+String\s+@default\(""\)/);
  assert.match(schema, /sortDirection\s+String\s+@default\(""\)/);
  assert.match(schema, /lastRequirementId\s+String\?/);
  assert.match(schema, /@@unique\(\[userId, scopeKey\]\)/);
  assert.match(migration, /CREATE TABLE "UserWorkspaceState"/);
  assert.match(migration, /FOREIGN KEY \("userId"\) REFERENCES "User"\("id"\) ON DELETE CASCADE/);
  assert.match(migration, /FOREIGN KEY \("projectId"\) REFERENCES "Project"\("id"\) ON DELETE CASCADE/);
});

test("workspace state API only reads and writes the signed-in user's state", () => {
  assert.match(server, /pathname === "\/api\/workspace-state"/);
  assert.match(server, /await handleGetWorkspaceState\(res, session\.user\)/);
  assert.match(server, /await handleSaveWorkspaceState\(req, res, session\.user\)/);
  assert.match(server, /where: \{ userId: user\.id \}/);
  assert.match(server, /userId: user\.id/);
  assert.match(server, /findAccessibleProject\(user, projectId\)/);
  assert.match(server, /Project not found/);
});

test("last project restore is skipped when the user deliberately closed it", () => {
  assert.match(app, /await saveWorkspaceStateNow\(\{ projectId: closingProjectId, projectClosed: true \}\)/);
  assert.match(app, /if \(options\.restoreProject && lastProjectId && !closedAt && !hasProject\(\)\)/);
  assert.match(app, /clearTimeout\(state\.workspaceStateSaveTimerId\)/);
});

test("status and list filters are debounced and restored safely", () => {
  assert.match(app, /function scheduleWorkspaceStateSave/);
  assert.match(app, /window\.setTimeout\(\(\) => \{\s*void saveWorkspaceStateNow\(options\);\s*\}, 500\)/);
  assert.match(app, /function applyWorkspaceStateForProject/);
  assert.match(app, /state\.productApprovalStatusFilter = validateWorkspaceStatusFilter/);
  assert.match(app, /state\.productApprovalListSearch = validateWorkspaceSearch/);
  assert.match(app, /state\.scoreFilterActive = filters\.scoreFilterActive === true/);
  assert.match(app, /renderTable\(\)/);
});

test("workspace restore does not recreate unsaved editor content or change requirement domain status", () => {
  const applySource = app.match(/function applyWorkspaceStateForProject[\s\S]*?function validateWorkspaceSearch/)?.[0] || "";

  assert.doesNotMatch(applySource, /productReviewFinalText\.value/);
  assert.doesNotMatch(applySource, /finalSelections\.set/);
  assert.doesNotMatch(applySource, /selection\./);
  assert.doesNotMatch(applySource, /finalRequirement|approvedAt|submittedForApprovalAt|workflowStatus/);
});

test("opening requirements and projects updates only UI workspace state", () => {
  assert.match(app, /openRequirementReviewWorkspace[\s\S]*scheduleWorkspaceStateSave\(\{ projectId: state\.projectId, projectClosed: false \}\)/);
  assert.match(app, /loadProjectFromServer\(projectId, options = \{}\)/);
  assert.match(app, /applyWorkspaceStateForProject\(data\.project\?\.id \|\| projectId\)/);
  assert.match(app, /scheduleWorkspaceStateSave\(\{ projectId: data\.project\?\.id \|\| projectId, projectClosed: false \}\)/);
});
