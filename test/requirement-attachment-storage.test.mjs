import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  REQUIREMENT_ATTACHMENT_MAX_BYTES,
  RequirementAttachmentStorage,
  contentDispositionAttachment,
  contentDispositionInline,
  safeDisplayFileName,
  validateAttachmentFile,
} from "../src/lib/requirement-attachment-storage.mjs";

test("validates supported requirement attachment file signatures", () => {
  const fixtures = [
    ["screenshot.png", "image/png", Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00])],
    ["photo.jpeg", "image/jpeg", Buffer.from([0xff, 0xd8, 0xff, 0x00])],
    ["manual.pdf", "application/pdf", Buffer.from("%PDF-1.7\n")],
    ["spec.doc", "application/msword", oleBuffer()],
    ["matrix.xls", "application/vnd.ms-excel", oleBuffer()],
    ["spec.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", zipBuffer()],
    ["matrix.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", zipBuffer()],
  ];

  for (const [fileName, mimeType, buffer] of fixtures) {
    const result = validateAttachmentFile({ fileName, mimeType, buffer });
    assert.equal(result.valid, true, `${fileName} should be accepted: ${result.errors.join(", ")}`);
    assert.equal(result.mimeType, mimeType);
    assert.equal(result.fileSize, buffer.length);
    assert.match(result.checksum, /^[a-f0-9]{64}$/);
  }
});

test("rejects unsupported, empty, oversized, mismatched and manipulated attachments", () => {
  assert.equal(validateAttachmentFile({
    fileName: "script.exe",
    mimeType: "application/octet-stream",
    buffer: Buffer.from("MZ"),
  }).valid, false);

  assert.equal(validateAttachmentFile({
    fileName: "empty.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.alloc(0),
  }).valid, false);

  assert.equal(validateAttachmentFile({
    fileName: "huge.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.alloc(REQUIREMENT_ATTACHMENT_MAX_BYTES + 1, 0x25),
  }).valid, false);

  assert.equal(validateAttachmentFile({
    fileName: "wrong.png",
    mimeType: "image/jpeg",
    buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
  }).valid, false);

  assert.equal(validateAttachmentFile({
    fileName: "fake.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("not a pdf"),
  }).valid, false);
});

test("sanitizes display names and produces safe content disposition headers", () => {
  assert.equal(safeDisplayFileName("../Ablaufplan ä.pdf\u0000"), "Ablaufplan ä.pdf");
  assert.match(contentDispositionAttachment("Ablaufplan ä.pdf"), /^attachment; filename="Ablaufplan _\.pdf"; filename\*=UTF-8''/);
  assert.match(contentDispositionInline("preview.png"), /^inline; filename="preview\.png"; filename\*=UTF-8''preview\.png$/);
});

test("stores duplicate original names under unique storage keys", async () => {
  const root = await mkdtemp(join(tmpdir(), "miele-attachments-"));
  const storage = new RequirementAttachmentStorage({ root });

  try {
    const first = await storage.save(Buffer.from("%PDF-1.7\n"), {
      projectId: "project-1",
      requirementId: "PR-001",
      extension: ".pdf",
    });
    const second = await storage.save(Buffer.from("%PDF-1.7\n"), {
      projectId: "project-1",
      requirementId: "PR-001",
      extension: ".pdf",
    });

    assert.notEqual(first, second);
    assert.deepEqual(await storage.get(first), Buffer.from("%PDF-1.7\n"));
    assert.deepEqual(await storage.get(second), Buffer.from("%PDF-1.7\n"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

function oleBuffer() {
  return Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0x00]);
}

function zipBuffer() {
  return Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00]);
}
