import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [schema, migration, server, app, html] = await Promise.all([
  readFile(new URL("../prisma/schema.prisma", import.meta.url), "utf8"),
  readFile(new URL("../prisma/migrations/20260716093000_add_requirement_attachments/migration.sql", import.meta.url), "utf8"),
  readFile(new URL("../server.mjs", import.meta.url), "utf8"),
  readFile(new URL("../app.js", import.meta.url), "utf8"),
  readFile(new URL("../index.html", import.meta.url), "utf8"),
]);

test("defines requirement attachment persistence with project cascade and uploader auditing", () => {
  assert.match(schema, /model ProjectRequirementAttachment \{/);
  assert.match(schema, /projectId\s+String/);
  assert.match(schema, /requirementId\s+String/);
  assert.match(schema, /storageKey\s+String\s+@unique/);
  assert.match(schema, /uploadedByUserId\s+String\?/);
  assert.match(schema, /@relation\(fields: \[projectId\], references: \[id\], onDelete: Cascade\)/);
  assert.match(schema, /@@index\(\[projectId, requirementId\]\)/);

  assert.match(migration, /CREATE TABLE "ProjectRequirementAttachment"/);
  assert.match(migration, /ON DELETE CASCADE/);
  assert.match(migration, /ON DELETE SET NULL/);
});

test("exposes authorized upload, list, download, delete and count routes", () => {
  assert.match(server, /handleListRequirementAttachments/);
  assert.match(server, /handleProjectAttachmentCounts/);
  assert.match(server, /handleUploadRequirementAttachments/);
  assert.match(server, /handleDownloadRequirementAttachment/);
  assert.match(server, /handleDeleteRequirementAttachment/);
  assert.match(server, /findAuthorizedAttachment/);
  assert.match(server, /userCanEditRequirementAttachments/);
  assert.match(server, /cleanupRemovedRequirementAttachments/);
  assert.match(server, /projectRequirementExists/);
  assert.match(server, /X-Content-Type-Options": "nosniff"/);
  assert.match(server, /Cache-Control": "private, no-store"/);
});

test("wires requirement attachment UI with localized labels and client validation", () => {
  assert.match(html, /id="requirementAttachmentsSection"/);
  assert.match(html, /id="requirementAttachmentInput"/);
  assert.match(html, /accept="\.png,\.jpg,\.jpeg,\.pdf,\.doc,\.docx,\.xls,\.xlsx/);

  assert.match(app, /renderRequirementAttachmentBadge/);
  assert.match(app, /renderRequirementAttachmentsSection/);
  assert.match(app, /handleRequirementAttachmentInputChange/);
  assert.match(app, /handleRequirementAttachmentListClick/);
  assert.match(app, /validateRequirementAttachmentFiles/);
  assert.match(app, /"Anhänge": "Attachments"/);
  assert.match(app, /"Dateien hinzufügen": "Add files"/);
  assert.match(app, /"Datei herunterladen": "Download file"/);
  assert.match(app, /"Datei löschen": "Delete file"/);
});
