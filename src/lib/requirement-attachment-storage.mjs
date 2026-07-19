import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, isAbsolute, join, normalize, relative } from "node:path";

export const REQUIREMENT_ATTACHMENT_MAX_BYTES = 25 * 1024 * 1024;
export const REQUIREMENT_ATTACHMENT_MAX_FILES = 10;
export const REQUIREMENT_ATTACHMENT_STORAGE_ROOT = "data/requirement-attachments";

export const REQUIREMENT_ATTACHMENT_TYPES = new Map([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".pdf", "application/pdf"],
  [".doc", "application/msword"],
  [".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  [".xls", "application/vnd.ms-excel"],
  [".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
]);

export class RequirementAttachmentStorage {
  constructor({ root }) {
    this.root = root;
  }

  async save(buffer, { projectId, requirementId, extension }) {
    const storageKey = [
      sanitizeStoragePart(projectId),
      sanitizeStoragePart(requirementId),
      `${Date.now()}-${randomUUID()}${extension}`,
    ].join("/");
    const path = this.pathForKey(storageKey);
    await mkdir(join(this.root, sanitizeStoragePart(projectId), sanitizeStoragePart(requirementId)), { recursive: true });
    await writeFile(path, buffer, { flag: "wx", mode: 0o600 });
    return storageKey;
  }

  async get(storageKey) {
    return readFile(this.pathForKey(storageKey));
  }

  async delete(storageKey) {
    await rm(this.pathForKey(storageKey), { force: false });
  }

  pathForKey(storageKey) {
    const safeKey = String(storageKey || "").split("/").map(sanitizeStoragePart).join("/");
    const path = normalize(join(this.root, safeKey));
    const rootPath = normalize(this.root);
    const relativePath = relative(rootPath, path);
    if (relativePath === "" || relativePath.startsWith("..") || isAbsolute(relativePath)) {
      throw new Error("Invalid storage key.");
    }
    return path;
  }
}

export function validateAttachmentFile({ fileName, mimeType, buffer }) {
  const originalFileName = safeDisplayFileName(fileName);
  const extension = fileExtension(originalFileName);
  const expectedMimeType = REQUIREMENT_ATTACHMENT_TYPES.get(extension);
  const size = buffer?.length || 0;
  const errors = [];

  if (!originalFileName) errors.push("Dateiname fehlt.");
  if (!expectedMimeType) errors.push(`Die Datei '${originalFileName || "Anhang"}' wird nicht unterstützt. Erlaubt sind PNG, JPEG, PDF, Word und Excel.`);
  if (expectedMimeType && mimeType && mimeType !== expectedMimeType) {
    errors.push(`Die Datei '${originalFileName}' wird nicht unterstützt. Erlaubt sind PNG, JPEG, PDF, Word und Excel.`);
  }
  if (!size) errors.push(`Die Datei '${originalFileName || "Anhang"}' ist leer.`);
  if (size > REQUIREMENT_ATTACHMENT_MAX_BYTES) errors.push(`Die Datei '${originalFileName}' ist größer als 25 MB.`);
  if (expectedMimeType && size && !matchesFileSignature(buffer, expectedMimeType)) {
    errors.push(`Die Datei '${originalFileName}' wird nicht unterstützt. Erlaubt sind PNG, JPEG, PDF, Word und Excel.`);
  }

  return {
    valid: errors.length === 0,
    errors,
    originalFileName,
    extension,
    mimeType: expectedMimeType || String(mimeType || ""),
    fileSize: size,
    checksum: size ? createHash("sha256").update(buffer).digest("hex") : "",
  };
}

export function safeDisplayFileName(value) {
  return basename(String(value || "").replace(/[\u0000-\u001f\u007f]/g, "")).trim().slice(0, 240);
}

export function contentDispositionAttachment(fileName) {
  return contentDisposition("attachment", fileName);
}

export function contentDispositionInline(fileName) {
  return contentDisposition("inline", fileName);
}

function contentDisposition(disposition, fileName) {
  const safeName = safeDisplayFileName(fileName) || "attachment";
  const fallback = safeName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `${disposition}; filename="${fallback}"; filename*=UTF-8''${encodeRFC5987ValueChars(safeName)}`;
}

function matchesFileSignature(buffer, mimeType) {
  if (mimeType === "image/png") return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  if (mimeType === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === "application/pdf") return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
  if (mimeType === "application/msword" || mimeType === "application/vnd.ms-excel") return hasOleSignature(buffer);
  if (mimeType.includes("openxmlformats")) return hasZipSignature(buffer);
  return false;
}

function hasOleSignature(buffer) {
  return buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0;
}

function hasZipSignature(buffer) {
  return buffer[0] === 0x50 && buffer[1] === 0x4b && [0x03, 0x05, 0x07].includes(buffer[2]);
}

function fileExtension(fileName) {
  const match = String(fileName || "").toLowerCase().match(/\.[a-z0-9]+$/);
  return match ? match[0] : "";
}

function sanitizeStoragePart(value) {
  return String(value || "").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "item";
}

function encodeRFC5987ValueChars(value) {
  return encodeURIComponent(value).replace(/['()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}
