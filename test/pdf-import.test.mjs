import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  isValidPrId,
  normalizeApplianceKey,
  normalizePrId,
  parseProductRequirementsPdf,
  resolveRequirementTechTypes,
  validatePdfUpload,
} from "../src/lib/pdf-import.mjs";

const referencePdfPath = "/Users/klaus-peterschafer/IONOS HiDrive/users/kps8864/temp/DPS-Protocol204_ProductRequirements-150726-075240.pdf";

test("normalizes split PR IDs from PDF text", () => {
  assert.equal(normalizePrId("PR204_1 .1"), "PR204_1.1");
  assert.equal(normalizePrId("PR204_ 3.6.1"), "PR204_3.6.1");
  assert.equal(isValidPrId("PR204_7.10"), true);
});

test("validates PDF upload metadata", () => {
  const pdfBytes = Buffer.from("%PDF-1.7\n");
  assert.deepEqual(validatePdfUpload({ fileName: "requirements.pdf", mimeType: "application/pdf", size: pdfBytes.length, bytes: pdfBytes }).errors, []);
  assert.equal(validatePdfUpload({ fileName: "requirements.txt", mimeType: "text/plain", size: 100 }).valid, false);
  assert.equal(validatePdfUpload({ fileName: "requirements.pdf", mimeType: "application/pdf", size: 0 }).valid, false);
  assert.equal(validatePdfUpload({ fileName: "requirements.pdf", mimeType: "application/pdf", size: 100, bytes: Buffer.from("not a pdf") }).valid, false);
});

test("rejects non-PDF content before parsing", async () => {
  const result = await parseProductRequirementsPdf(Buffer.from("not a pdf"));
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /kein gültiges PDF/);
  assert.ok(result.example?.text.includes("PR_ID: PR-001"));
});

test("resolves appliances with exact normalized matching", () => {
  const techTypes = [
    { appliance: "Yukon", designation: "KFMC 3632 L" },
    { appliance: "Yukon SDR", designation: "KMC 3826 R" },
    { appliance: "Yukon SDF", designation: "FMC 3811 L" },
  ];

  assert.deepEqual(resolveRequirementTechTypes({ appliances: ["Yukon"] }, techTypes).resolved.map((item) => item.designation), ["KFMC 3632 L"]);
  assert.deepEqual(resolveRequirementTechTypes({ appliances: [" Yukon   SDR "] }, techTypes).resolved.map((item) => item.designation), ["KMC 3826 R"]);
  assert.equal(normalizeApplianceKey("• Yukon   SDF"), "yukon sdf");
});

test("parses the reference Product Requirements PDF", async (t) => {
  if (!existsSync(referencePdfPath)) {
    t.skip("Reference PDF is not available in this workspace.");
    return;
  }

  const result = await parseProductRequirementsPdf(await readFile(referencePdfPath), {
    fileName: "DPS-Protocol204_ProductRequirements-150726-075240.pdf",
  });

  assert.equal(result.errors.length, 0);
  assert.equal(result.summary.requirementCount > 0, true);
  assert.equal(result.summary.techTypeCount > 0, true);
  assert.equal(result.summary.unmappedRequirementCount, 0);
  assert.ok(result.requirements.some((item) => item.id === "PR204_1.1"));
  assert.ok(result.techTypes.some((item) => item.appliance === "Yukon"));
  assert.ok(result.techTypes.some((item) => item.appliance === "Yukon SDR"));
  assert.deepEqual(
    resolveRequirementTechTypes({ appliances: ["Yukon"] }, result.techTypes).resolved
      .map((item) => item.appliance)
      .filter((value, index, list) => list.indexOf(value) === index),
    ["Yukon"],
  );
});
