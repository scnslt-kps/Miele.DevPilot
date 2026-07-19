import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export const PDF_IMPORT_MAX_BYTES = 25 * 1024 * 1024;

const PRODUCT_COLUMNS = [
  ["prId", 0, 100],
  ["category", 100, 170],
  ["subCategory", 170, 220],
  ["name", 220, 290],
  ["description", 290, 440],
  ["appliance", 440, Infinity],
];

const TECHTYPE_COLUMNS = [
  ["appliance", 0, 118],
  ["techType", 118, 184],
  ["materialNumber", 184, 240],
  ["region", 240, 290],
  ["explanation", 290, Infinity],
];

const PRODUCT_HEADER_WORDS = new Set(["pr id", "category", "sub-category", "sub", "catego", "ry", "name", "description", "appliance"]);
const TECHTYPE_HEADER_WORDS = new Set(["appliance", "techtype", "miele", "mat.nr.", "mat.nr", "region", "explanation"]);

export function validatePdfUpload({ fileName, mimeType, size, bytes }) {
  const errors = [];
  const normalizedName = String(fileName || "").trim();
  const normalizedMimeType = String(mimeType || "").trim().toLowerCase();
  const fileSize = Number(size) || 0;

  if (!normalizedName.toLowerCase().endsWith(".pdf")) {
    errors.push("Die Dateiendung muss .pdf sein.");
  }
  if (normalizedMimeType && normalizedMimeType !== "application/pdf") {
    errors.push("Der Dateityp muss application/pdf sein.");
  }
  if (!fileSize) {
    errors.push("Die PDF-Datei ist leer.");
  }
  if (fileSize > PDF_IMPORT_MAX_BYTES) {
    errors.push(`Die PDF-Datei ist groesser als ${Math.round(PDF_IMPORT_MAX_BYTES / 1024 / 1024)} MB.`);
  }
  if (bytes && fileSize >= 5 && !hasPdfSignature(bytes)) {
    errors.push("Die Datei ist kein gültiges PDF.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export async function parseProductRequirementsPdf(buffer, options = {}) {
  const bytes = toPdfBytes(buffer);
  if (!bytes.length) {
    return invalidImport("Die PDF-Datei ist leer.");
  }
  if (!hasPdfSignature(bytes)) {
    return invalidImport("Die Datei ist kein gültiges PDF.");
  }

  let lines;
  try {
    lines = await extractPdfLines(bytes);
  } catch (error) {
    return invalidImport(pdfOpenErrorMessage(error), {
      technicalMessage: error?.message || String(error),
    });
  }

  if (!lines.length) {
    return invalidImport("Das PDF enthält keinen maschinenlesbaren Text. Bitte exportiere das Dokument erneut als textbasiertes PDF.");
  }

  const techTypeLines = sectionLines(lines, "TechType Information", "Product Requirements");
  const productLines = sectionLines(lines, "Product Requirements", "");
  const warnings = [];
  if (!techTypeLines.length) warnings.push("Die Tabelle \"TechType Information\" wurde nicht gefunden. Requirements können ohne automatische TechType-Zuordnung importiert werden.");
  if (!productLines.length) {
    return invalidImport("Die Struktur des PDFs entspricht nicht dem erwarteten Confluence-Exportformat.", { warnings });
  }

  const techTypes = parseTechTypeInformationTable(techTypeLines);
  const productRequirements = parseProductRequirementsTable(productLines);
  const validated = validateAndResolveRequirements(productRequirements, techTypes, warnings);

  return {
    ok: validated.errors === 0 && validated.requirements.length > 0,
    fileName: options.fileName || "",
    format: "pdf",
    requirements: validated.requirements,
    techTypes,
    warnings: validated.importWarnings,
    errors: validated.importErrors,
    ignoredRows: validated.ignoredRows,
    summary: buildImportSummary(validated.requirements, techTypes, validated.importWarnings, validated.importErrors, validated.ignoredRows),
    example: pdfFormatExample(),
  };
}

function toPdfBytes(buffer) {
  if (!buffer) return new Uint8Array();
  if (Buffer.isBuffer(buffer)) return new Uint8Array(buffer);
  if (buffer instanceof Uint8Array) return buffer;
  return new Uint8Array(buffer);
}

function hasPdfSignature(bytes) {
  return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d;
}

function pdfOpenErrorMessage(error) {
  const message = String(error?.message || error || "").toLowerCase();
  if (message.includes("password") || message.includes("encrypted")) return "Das PDF ist kennwortgeschützt.";
  return "Das PDF ist beschädigt und konnte nicht geöffnet werden.";
}

export function normalizePrId(value) {
  return String(value || "")
    .replace(/\s+/g, "")
    .replace(/^([A-Z]+)(\d+)_/i, (_, prefix, number) => `${prefix.toUpperCase()}${number}_`);
}

export function isValidPrId(value) {
  return /^PR\d+_\d+(?:\.\d+)*$/i.test(normalizePrId(value));
}

export function normalizeApplianceKey(value) {
  return cleanBulletPrefix(value)
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function resolveRequirementTechTypes(requirement, techTypes) {
  const lookup = new Map();
  techTypes.forEach((item) => {
    const key = normalizeApplianceKey(item.appliance);
    if (!key) return;
    lookup.set(key, [...(lookup.get(key) || []), item]);
  });

  const warnings = [];
  const resolved = [];
  const seen = new Set();
  requirement.appliances.forEach((appliance) => {
    const matches = lookup.get(normalizeApplianceKey(appliance)) || [];
    if (!matches.length) {
      warnings.push(`Für Appliance "${appliance}" wurden keine passenden TechTypes gefunden.`);
      return;
    }
    matches.forEach((item) => {
      const key = techTypeKey(item);
      if (seen.has(key)) return;
      seen.add(key);
      resolved.push(item);
    });
  });

  return { resolved, warnings };
}

async function extractPdfLines(bytes) {
  const document = await getDocument({ data: bytes, disableWorker: true }).promise;
  const lines = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const lineMap = new Map();
    content.items.forEach((item) => {
      const text = String(item.str || "").trim();
      if (!text || text === "|") return;
      const x = Number(item.transform?.[4]) || 0;
      const y = Math.round(Number(item.transform?.[5]) || 0);
      const row = lineMap.get(y) || [];
      row.push({ x, text });
      lineMap.set(y, row);
    });
    [...lineMap.entries()]
      .sort((first, second) => second[0] - first[0])
      .forEach(([y, items]) => {
        const sorted = items.sort((first, second) => first.x - second.x);
        lines.push({
          pageNumber,
          y,
          items: sorted,
          text: sorted.map((item) => item.text).join(" "),
        });
      });
  }
  return lines;
}

function sectionLines(lines, startHeading, endHeading) {
  const startIndex = lines.findIndex((line) => normalizedLineText(line.text).includes(normalizedLineText(startHeading)));
  if (startIndex < 0) return [];
  const endIndex = endHeading
    ? lines.findIndex((line, index) => index > startIndex && normalizedLineText(line.text).includes(normalizedLineText(endHeading)))
    : -1;
  return lines.slice(startIndex + 1, endIndex > startIndex ? endIndex : undefined);
}

function parseProductRequirementsTable(lines) {
  const requirements = [];
  let current = null;
  let ignoredRows = 0;

  lines.forEach((line) => {
    const cells = lineToCells(line, PRODUCT_COLUMNS);
    if (isIgnorableProductLine(line, cells)) {
      ignoredRows += 1;
      return;
    }

    const startsRequirement = /\bPR\s*\d+_/i.test(cells.prId || "");
    if (startsRequirement) {
      if (current) requirements.push(finalizeProductRequirement(current));
      current = createProductRequirementDraft(line);
    }
    if (!current) {
      ignoredRows += 1;
      return;
    }

    appendDraftField(current, "prId", cells.prId, { compact: true });
    appendDraftField(current, "category", cells.category);
    appendDraftField(current, "subCategory", cells.subCategory);
    appendDraftField(current, "name", cells.name);
    appendDraftField(current, "description", cells.description, { description: true });
    appendDraftField(current, "appliance", cells.appliance);
  });

  if (current) requirements.push(finalizeProductRequirement(current));
  return { requirements, ignoredRows };
}

function parseTechTypeInformationTable(lines) {
  const result = [];
  let current = null;
  const seen = new Set();

  for (const line of lines) {
    if (normalizedLineText(line.text).includes("abbreviation glossary")) break;
    const cells = lineToCells(line, TECHTYPE_COLUMNS);
    if (isIgnorableTechTypeLine(line, cells)) continue;
    const materialText = String(cells.materialNumber || "").replace(/\s+/g, "");
    const hasNewRowShape = Boolean(cells.appliance && cells.techType && (cells.region || materialText.length >= 5));

    if (hasNewRowShape) {
      if (current) pushTechType(result, current, seen);
      current = createTechTypeDraft(line);
      appendDraftField(current, "appliance", cells.appliance);
      appendDraftField(current, "techType", cells.techType);
      appendDraftField(current, "materialNumber", cells.materialNumber, { compact: true });
      appendDraftField(current, "region", cells.region);
      appendDraftField(current, "explanation", cells.explanation, { description: true });
      continue;
    }

    if (!current) continue;
    if (cells.appliance && looksLikeApplianceContinuation(cells.appliance)) {
      appendDraftField(current, "appliance", cells.appliance);
    } else {
      appendDraftField(current, "techType", cells.appliance);
    }
    appendDraftField(current, "techType", cells.techType);
    appendDraftField(current, "materialNumber", cells.materialNumber, { compact: true });
    appendDraftField(current, "region", cells.region);
    appendDraftField(current, "explanation", cells.explanation, { description: true });
  }

  if (current) pushTechType(result, current, seen);
  return result;
}

function validateAndResolveRequirements(parsed, techTypes, importWarnings = []) {
  const importErrors = [];
  const idCounts = new Map();
  parsed.requirements.forEach((item) => {
    const id = normalizePrId(item.id);
    if (!id) return;
    idCounts.set(id, (idCounts.get(id) || 0) + 1);
  });

  const requirements = parsed.requirements.map((item, index) => {
    const errors = [];
    const warnings = [...item.warnings];
    const id = normalizePrId(item.id);
    const appliances = item.appliances.map(cleanBulletPrefix).filter(Boolean);
    let techTypesForRequirement = [];

    if (!id) errors.push("PR ID fehlt.");
    if (id && !isValidPrId(id)) errors.push(`PR ID ${id} ist ungültig.`);
    if (id && idCounts.get(id) > 1) errors.push(`PR ID ${id} ist mehrfach vorhanden.`);
    if (!item.category) errors.push(`${id || `Requirement ${index + 1}`} enthält keine Category.`);
    if (!item.subcategory) errors.push(`${id || `Requirement ${index + 1}`} enthält keine Sub-Category.`);
    if (!item.text) errors.push(`${id || `Requirement ${index + 1}`} enthält keine Description.`);
    if (!item.name) warnings.push(`${id || `Requirement ${index + 1}`} enthält keinen Namen.`);
    if (!appliances.length) warnings.push(`${id || `Requirement ${index + 1}`} enthält keine Appliance-Zuordnung.`);

    if (techTypes.length && appliances.length) {
      const resolution = resolveRequirementTechTypes({ appliances }, techTypes);
      techTypesForRequirement = resolution.resolved;
      warnings.push(...resolution.warnings);
    }
    if (!techTypesForRequirement.length) warnings.push(`${id || `Requirement ${index + 1}`} hat keine TechType-Zuordnung.`);

    return {
      ...item,
      rowNumber: index + 2,
      id,
      sourcePrId: id,
      appliances,
      resolvedTechTypes: techTypesForRequirement,
      techTypes: techTypesForRequirement.map((techType) => techType.designation),
      importStatus: errors.length ? "error" : warnings.length ? "warning" : "ready",
      warnings,
      errors,
    };
  });

  requirements.forEach((item) => {
    item.errors.forEach((error) => importErrors.push(error));
  });

  return {
    requirements,
    importWarnings,
    importErrors,
    ignoredRows: parsed.ignoredRows,
    errors: importErrors.length,
  };
}

function buildImportSummary(requirements, techTypes, warnings, errors, ignoredRows) {
  const applianceGroups = new Set();
  requirements.forEach((requirement) => requirement.appliances.forEach((appliance) => applianceGroups.add(normalizeApplianceKey(appliance))));
  return {
    requirementCount: requirements.length,
    techTypeCount: techTypes.length,
    applianceGroupCount: [...applianceGroups].filter(Boolean).length,
    mappedRequirementCount: requirements.filter((item) => item.techTypes.length).length,
    unmappedRequirementCount: requirements.filter((item) => !item.techTypes.length).length,
    warningRequirementCount: requirements.filter((item) => item.warnings.length).length,
    errorRequirementCount: requirements.filter((item) => item.errors.length).length,
    duplicateRequirementIdCount: duplicateIdCount(requirements),
    ignoredRowCount: ignoredRows,
    warningCount: warnings.length + requirements.reduce((sum, item) => sum + item.warnings.length, 0),
    errorCount: errors.length,
  };
}

function finalizeProductRequirement(draft) {
  const id = normalizePrId(draft.prId.join(""));
  const appliances = draft.appliance
    .flatMap((item) => splitAppliances(normalizePdfField([item])))
    .filter((item, index, list) => list.findIndex((candidate) => normalizeApplianceKey(candidate) === normalizeApplianceKey(item)) === index);
  return {
    rowNumber: draft.sourceLine,
    id,
    sourceId: id,
    category: normalizePdfField(draft.category),
    subcategory: normalizePdfField(draft.subCategory),
    name: normalizePdfField(draft.name),
    text: normalizePdfField(draft.description, { description: true }),
    appliances,
    warnings: [],
    errors: [],
  };
}

function pushTechType(result, draft, seen) {
  const appliance = normalizePdfField(draft.appliance);
  const designation = normalizePdfField(draft.techType);
  if (!appliance || !designation) return;
  const item = {
    appliance,
    valueClass: appliance,
    techType: designation,
    designation,
    materialNumber: normalizeMaterialNumber(draft.materialNumber.join("")),
    region: normalizePdfField(draft.region),
    explanation: normalizePdfField(draft.explanation, { description: true }),
  };
  const key = techTypeKey(item);
  if (seen.has(key)) return;
  seen.add(key);
  result.push(item);
}

function lineToCells(line, columns) {
  const cells = Object.fromEntries(columns.map(([name]) => [name, ""]));
  line.items.forEach((item) => {
    const column = columns.find(([, min, max]) => item.x >= min && item.x < max);
    if (!column) return;
    const name = column[0];
    cells[name] = [cells[name], item.text].filter(Boolean).join(" ");
  });
  return cells;
}

function isIgnorableProductLine(line, cells) {
  const text = normalizedLineText(line.text);
  if (!text || text.includes("product requirements")) return true;
  const headerCellCount = [cells.prId, cells.category, cells.subCategory, cells.name, cells.description, cells.appliance]
    .filter((cell) => PRODUCT_HEADER_WORDS.has(normalizedLineText(cell)))
    .length;
  if (headerCellCount >= 2) return true;
  if (text.includes("abbreviations list") || text.includes("how to read")) return true;
  return false;
}

function isIgnorableTechTypeLine(line, cells) {
  const text = normalizedLineText(line.text);
  if (!text || text.includes("techtype information")) return true;
  const headerCellCount = [cells.appliance, cells.techType, cells.materialNumber, cells.region, cells.explanation]
    .filter((cell) => TECHTYPE_HEADER_WORDS.has(normalizedLineText(cell)))
    .length;
  return headerCellCount >= 2;
}

function appendDraftField(draft, field, value, options = {}) {
  const text = String(value || "").trim();
  if (!text) return;
  if (options.compact) {
    draft[field].push(text.replace(/\s+/g, ""));
    return;
  }
  draft[field].push(text);
}

function createProductRequirementDraft(line) {
  return {
    sourceLine: line.pageNumber * 1000 + line.y,
    prId: [],
    category: [],
    subCategory: [],
    name: [],
    description: [],
    appliance: [],
  };
}

function createTechTypeDraft(line) {
  return {
    sourceLine: line.pageNumber * 1000 + line.y,
    appliance: [],
    techType: [],
    materialNumber: [],
    region: [],
    explanation: [],
  };
}

function normalizePdfField(parts, options = {}) {
  const values = Array.isArray(parts) ? parts : String(parts || "").split(/\n+/);
  const joined = values
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .reduce((acc, part) => mergePdfFragment(acc, part, options), "");
  return joined
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s+([.,;:!?%])/g, "$1")
    .trim();
}

function mergePdfFragment(current, next, options = {}) {
  if (!current) return next;
  if (options.description) return `${current} ${next}`;
  const previousToken = current.match(/([A-Za-zÄÖÜäöüß]+)$/)?.[1] || "";
  const nextToken = next.match(/^([a-zäöüß]+)/)?.[1] || "";
  if (current.endsWith("/") || current.endsWith("&") || (previousToken.length > 0 && previousToken.length <= 7 && nextToken.length > 0)) {
    return `${current}${next}`;
  }
  return `${current} ${next}`;
}

function splitAppliances(value) {
  return String(value || "")
    .split(/\n| {2,}|,\s*|;\s*/)
    .flatMap((part) => {
      const cleaned = cleanBulletPrefix(part);
      if (!cleaned) return [];
      return [cleaned];
    })
    .filter(Boolean)
    .filter((item, index, list) => list.findIndex((candidate) => normalizeApplianceKey(candidate) === normalizeApplianceKey(item)) === index);
}

function cleanBulletPrefix(value) {
  return String(value || "")
    .replace(/^[\s•*·.-]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeMaterialNumber(value) {
  return String(value || "").replace(/\s+/g, "").trim();
}

function normalizedLineText(value) {
  return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function looksLikeApplianceContinuation(value) {
  const text = String(value || "").trim();
  return /^[A-Z]{2,6}$/.test(text);
}

function techTypeKey(item) {
  return [
    normalizeApplianceKey(item.appliance || item.valueClass),
    String(item.designation || item.techType || "").trim().toLowerCase(),
    String(item.materialNumber || "").trim().toLowerCase(),
    String(item.region || "").trim().toLowerCase(),
  ].join("\u0000");
}

function duplicateIdCount(requirements) {
  const counts = new Map();
  requirements.forEach((item) => {
    if (!item.id) return;
    counts.set(item.id, (counts.get(item.id) || 0) + 1);
  });
  return [...counts.values()].filter((count) => count > 1).length;
}

function invalidImport(error, details = {}) {
  return {
    ok: false,
    format: "pdf",
    requirements: [],
    techTypes: [],
    warnings: details.warnings || [],
    errors: [error],
    ignoredRows: 0,
    summary: buildImportSummary([], [], details.warnings || [], [error], 0),
    example: pdfFormatExample(),
    technicalMessage: details.technicalMessage || "",
  };
}

function pdfFormatExample() {
  return {
    type: "text",
    title: "Product Requirement",
    text: [
      "Product Requirement",
      "",
      "PR_ID: PR-001",
      "Category: Bedienung",
      "Sub-Category: Anzeige",
      "Description:",
      "Das Gerät muss den aktuellen Betriebsstatus anzeigen.",
      "",
      "Product Requirement",
      "",
      "PR_ID: PR-002",
      "Category: Sicherheit",
      "Sub-Category: Kinderschutz",
      "Description:",
      "Das Gerät muss eine unbeabsichtigte Bedienung verhindern.",
    ].join("\n"),
    hint: "Bitte exportiere die Product Requirements aus Confluence mit der erwarteten Feldstruktur als textbasiertes PDF.",
  };
}
