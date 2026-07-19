import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Script, createContext } from "node:vm";
import test from "node:test";
import { validateExcelImport } from "../src/lib/import-validation.mjs";

const XLSX = await loadXlsxForTest();

test("accepts a valid XLSX product requirements import", async () => {
  const result = await validateExcelImport(createWorkbookBuffer([
    ["PR_ID", "Category", "Sub-Category", "Description"],
    ["PR-001", "Bedienung", "Anzeige", "Das Gerät muss den aktuellen Betriebsstatus anzeigen."],
    ["PR-002", "Sicherheit", "Kinderschutz", "Das Gerät muss eine unbeabsichtigte Bedienung verhindern."],
  ]), {
    fileName: "requirements.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  assert.equal(result.ok, true);
  assert.equal(result.summary.requirementCount, 2);
  assert.equal(result.summary.uniqueRequirementIdCount, 2);
  assert.equal(result.columns.prId, 0);
  assert.equal(result.columns.description, 3);
});

test("rejects unsupported Excel extension and manipulated XLSX content", async () => {
  const extensionResult = await validateExcelImport(Buffer.from("not an xlsx"), {
    fileName: "requirements.xls",
    mimeType: "application/vnd.ms-excel",
  });
  assert.equal(extensionResult.ok, false);
  assert.match(extensionResult.errors.join("\n"), /XLSX-Format/);

  const signatureResult = await validateExcelImport(Buffer.from("not an xlsx"), {
    fileName: "requirements.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  assert.equal(signatureResult.ok, false);
  assert.match(signatureResult.errors.join("\n"), /keine gültige XLSX-Datei/);
});

test("rejects empty workbook and missing or duplicated required columns", async () => {
  const emptyResult = await validateExcelImport(createWorkbookBuffer([]), {
    fileName: "empty.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  assert.equal(emptyResult.ok, false);

  const missingResult = await validateExcelImport(createWorkbookBuffer([
    ["PR_ID", "Category", "Description"],
    ["PR-001", "Bedienung", "Text"],
  ]), { fileName: "missing.xlsx" });
  assert.equal(missingResult.ok, false);
  assert.match(missingResult.errors.join("\n"), /Sub-Category/);

  const duplicateColumnResult = await validateExcelImport(createWorkbookBuffer([
    ["PR_ID", "PR_ID", "Category", "Sub-Category", "Description"],
    ["PR-001", "PR-001", "Bedienung", "Anzeige", "Text"],
  ]), { fileName: "duplicate-column.xlsx" });
  assert.equal(duplicateColumnResult.ok, false);
  assert.match(duplicateColumnResult.errors.join("\n"), /mehrfach vorhanden/);
});

test("rejects empty required fields and duplicate PR_ID values", async () => {
  const result = await validateExcelImport(createWorkbookBuffer([
    ["PR_ID", "Category", "Sub-Category", "Description"],
    ["PR-001", "Bedienung", "Anzeige", ""],
    ["PR-001", "Sicherheit", "Kinderschutz", "Text"],
  ]), { fileName: "invalid-rows.xlsx" });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /Description fehlt/);
  assert.match(result.errors.join("\n"), /doppelt vorhanden/);
});

test("reports unknown appliance mapping as warning without blocking otherwise valid import", async () => {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
    ["PR_ID", "Category", "Sub-Category", "Description", "Appliance"],
    ["PR-001", "Bedienung", "Anzeige", "Text", "Yukon-X"],
  ]), "Product Requirements");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
    ["ValueClass", "ApplianceDesignation"],
    ["Yukon", "KFMC 3632 L"],
  ]), "TechType");

  const result = await validateExcelImport(XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }), {
    fileName: "appliance-warning.xlsx",
  });

  assert.equal(result.ok, true);
  assert.match(result.warnings.join("\n"), /Yukon-X/);
});

function createWorkbookBuffer(rows) {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), "Product Requirements");
  return XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
}

async function loadXlsxForTest() {
  const source = await readFile(new URL("../vendor/xlsx.full.min.js", import.meta.url), "utf8");
  const module = { exports: {} };
  const context = createContext({ module, exports: module.exports, console, setTimeout, clearTimeout, Buffer });
  new Script(source, { filename: "vendor/xlsx.full.min.js" }).runInContext(context);
  return module.exports;
}
