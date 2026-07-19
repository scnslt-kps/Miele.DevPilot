import { readFile } from "node:fs/promises";
import { Script, createContext } from "node:vm";

export const EXCEL_IMPORT_MAX_BYTES = 20 * 1024 * 1024;
export const EXCEL_IMPORT_MAX_SHEETS = 20;
export const EXCEL_IMPORT_MAX_ROWS = 10000;
export const EXCEL_IMPORT_MAX_CELLS = 250000;

const REQUIRED_EXCEL_COLUMNS = [
  { key: "prId", label: "PR_ID", aliases: ["prid", "pr_id"] },
  { key: "category", label: "Category", aliases: ["category"] },
  { key: "subcategory", label: "Sub-Category", aliases: ["subcategory", "sub-category"] },
  { key: "description", label: "Description", aliases: ["description"] },
];

let xlsxPromise;

export async function validateExcelImport(buffer, metadata = {}) {
  const fileName = String(metadata.fileName || "").trim();
  const mimeType = String(metadata.mimeType || "").trim().toLowerCase();
  const bytes = toBytes(buffer);
  const technicalErrors = validateExcelFileMetadata({ fileName, mimeType, size: bytes.length, bytes });
  if (technicalErrors.length) {
    return invalidExcelImport("Ungültige Datei", technicalErrors);
  }

  let workbook;
  try {
    const XLSX = await loadXlsx();
    workbook = XLSX.read(bytes, {
      type: "buffer",
      cellDates: true,
      cellFormula: false,
      cellHTML: false,
      cellNF: false,
      bookFiles: false,
      bookVBA: false,
    });
    Object.defineProperty(workbook, "__xlsx", { value: XLSX });
  } catch {
    return invalidExcelImport("Datei kann nicht gelesen werden", ["Die Excel-Datei ist beschädigt und konnte nicht geöffnet werden."]);
  }

  const sheetNames = Array.isArray(workbook.SheetNames) ? workbook.SheetNames : [];
  if (!sheetNames.length) {
    return invalidExcelImport("Erwartetes Importformat nicht erkannt", ["Die Arbeitsmappe enthält kein Tabellenblatt."]);
  }
  if (sheetNames.length > EXCEL_IMPORT_MAX_SHEETS) {
    return invalidExcelImport("Ungültige Datei", [`Die Arbeitsmappe enthält mehr als ${EXCEL_IMPORT_MAX_SHEETS} Tabellenblätter.`]);
  }

  const visibleSheetNames = sheetNames.filter((name, index) => !isHiddenSheet(workbook, index));
  const techTypeSheetName = findTechTypeSheetName(visibleSheetNames);
  const candidateSheetNames = visibleSheetNames.filter((name) => name !== techTypeSheetName);
  const validationAttempts = candidateSheetNames.map((sheetName) => validateRequirementSheet(workbook, sheetName));
  const successful = validationAttempts.find((attempt) => attempt.ok);
  if (!successful) {
    const errors = validationAttempts.flatMap((attempt) => attempt.errors).slice(0, 80);
    return invalidExcelImport("Erwartetes Importformat nicht erkannt", errors.length ? errors : ["Das erforderliche Tabellenblatt wurde nicht gefunden."]);
  }

  const techTypes = techTypeSheetName ? parseExcelTechTypes(workbook, techTypeSheetName) : [];
  const applianceWarnings = validateExcelAppliances(successful.requirements, techTypes);
  const warnings = [
    ...(techTypeSheetName ? [] : ["Die Tabelle \"TechType\" wurde nicht gefunden. Requirements können ohne automatische TechType-Zuordnung importiert werden."]),
    ...applianceWarnings,
  ];

  return {
    ok: true,
    valid: true,
    format: "xlsx",
    fileName,
    sheetName: successful.sheetName,
    headerRow: successful.headerIndex + 1,
    columns: successful.columns,
    requirements: successful.requirements,
    techTypes,
    warnings,
    errors: [],
    summary: buildExcelSummary(successful.requirements, techTypes, warnings, []),
    example: excelFormatExample(),
  };
}

export function validateExcelFileMetadata({ fileName, mimeType, size, bytes }) {
  const errors = [];
  const normalizedName = String(fileName || "").trim();
  const lowerName = normalizedName.toLowerCase();
  const fileSize = Number(size) || 0;

  if (!normalizedName) errors.push("Dateiname fehlt.");
  if (!lowerName.endsWith(".xlsx")) {
    errors.push(lowerName.endsWith(".xls") || lowerName.endsWith(".csv")
      ? "Bitte konvertiere die Importdatei in das XLSX-Format."
      : "Die Dateiendung muss .xlsx sein.");
  }
  if (mimeType && ![
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/octet-stream",
    "application/zip",
  ].includes(mimeType)) {
    errors.push("Der Dateityp passt nicht zu einer XLSX-Datei.");
  }
  if (!fileSize) errors.push("Die Excel-Datei ist leer.");
  if (fileSize > EXCEL_IMPORT_MAX_BYTES) {
    errors.push(`Die Excel-Datei ist größer als ${Math.round(EXCEL_IMPORT_MAX_BYTES / 1024 / 1024)} MB.`);
  }
  if (bytes && bytes.length >= 4 && !hasZipSignature(bytes)) {
    errors.push("Die Datei ist keine gültige XLSX-Datei.");
  }

  return errors;
}

function validateRequirementSheet(workbook, sheetName) {
  const XLSX = workbook.__xlsx;
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "", raw: false });
  const usedRows = rows.filter((row) => row.some((cell) => hasValue(cell)));
  if (!usedRows.length) return { ok: false, sheetName, errors: [`Tabellenblatt "${sheetName}": Das Tabellenblatt enthält keine Daten.`] };
  if (rows.length > EXCEL_IMPORT_MAX_ROWS) return { ok: false, sheetName, errors: [`Tabellenblatt "${sheetName}": Die Tabelle enthält mehr als ${EXCEL_IMPORT_MAX_ROWS} Zeilen.`] };
  const cellCount = rows.reduce((sum, row) => sum + row.length, 0);
  if (cellCount > EXCEL_IMPORT_MAX_CELLS) return { ok: false, sheetName, errors: [`Tabellenblatt "${sheetName}": Die Tabelle enthält zu viele Zellen.`] };

  const headerIndex = findHeaderIndex(rows);
  if (headerIndex < 0) {
    return { ok: false, sheetName, errors: [`Tabellenblatt "${sheetName}": Die Kopfzeile ist nicht eindeutig erkennbar.`] };
  }

  const headers = rows[headerIndex].map((header) => String(header || "").trim());
  const columnErrors = [];
  const columns = {};
  for (const required of REQUIRED_EXCEL_COLUMNS) {
    const indexes = headers
      .map((header, index) => (required.aliases.includes(normalizeColumnName(header)) ? index : -1))
      .filter((index) => index >= 0);
    if (!indexes.length) columnErrors.push(`Tabellenblatt "${sheetName}": Die Pflichtspalte '${required.label}' fehlt.`);
    if (indexes.length > 1) columnErrors.push(`Tabellenblatt "${sheetName}": Die Spalte '${required.label}' ist mehrfach vorhanden.`);
    if (indexes.length === 1) columns[required.key] = indexes[0];
  }
  if (columnErrors.length) return { ok: false, sheetName, errors: columnErrors };

  const dataRows = rows.slice(headerIndex + 1);
  const requirements = [];
  const errors = [];
  const seenIds = new Map();
  dataRows.forEach((row, offset) => {
    const rowNumber = headerIndex + offset + 2;
    const isEmpty = row.every((cell) => !hasValue(cell));
    if (isEmpty) return;

    const prId = cellText(row[columns.prId]);
    const category = cellText(row[columns.category]);
    const subcategory = cellText(row[columns.subcategory]);
    const description = cellText(row[columns.description]);
    const rowErrors = [];
    if (!prId) rowErrors.push(`Tabellenblatt "${sheetName}", Zeile ${rowNumber}, Spalte PR_ID: PR_ID fehlt.`);
    if (!category) rowErrors.push(`Tabellenblatt "${sheetName}", Zeile ${rowNumber}, Spalte Category: Category fehlt.`);
    if (!subcategory) rowErrors.push(`Tabellenblatt "${sheetName}", Zeile ${rowNumber}, Spalte Sub-Category: Sub-Category fehlt.`);
    if (!description) rowErrors.push(`Tabellenblatt "${sheetName}", Zeile ${rowNumber}, Spalte Description: Description fehlt.`);
    if (prId && seenIds.has(prId)) rowErrors.push(`Tabellenblatt "${sheetName}", Zeile ${rowNumber}: PR_ID '${prId}' ist innerhalb der Datei doppelt vorhanden.`);

    if (prId) seenIds.set(prId, rowNumber);
    errors.push(...rowErrors);
    requirements.push({
      rowNumber,
      id: prId,
      category,
      subcategory,
      text: description,
      sourceId: prId,
      name: cellText(row[headers.findIndex((header) => ["name", "title"].includes(normalizeColumnName(header)))]) || prId,
      appliances: applianceValues(row, headers),
    });
  });

  if (!requirements.length) errors.push(`Tabellenblatt "${sheetName}": Es wurden keine Product Requirements gefunden.`);
  return {
    ok: errors.length === 0 && requirements.length > 0,
    sheetName,
    headerIndex,
    columns,
    requirements,
    errors,
  };
}

function parseExcelTechTypes(workbook, sheetName) {
  const XLSX = workbook.__xlsx;
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "", raw: false });
  const headerIndex = rows.findIndex((row) =>
    row.some((cell) => normalizeColumnName(cell) === "valueclass") ||
    row.some((cell) => normalizeColumnName(cell) === "appliancedesignation"));
  if (headerIndex < 0) return [];
  const headers = rows[headerIndex].map(normalizeColumnName);
  const valueClassIndex = headers.indexOf("valueclass");
  const designationIndex = headers.indexOf("appliancedesignation");
  if (valueClassIndex < 0 || designationIndex < 0) return [];
  const seen = new Set();
  return rows.slice(headerIndex + 1)
    .map((row) => ({
      valueClass: cellText(row[valueClassIndex]) || "Ohne Gruppe",
      designation: cellText(row[designationIndex]),
    }))
    .filter((item) => item.designation)
    .filter((item) => {
      const key = `${item.valueClass}\u0000${item.designation}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function validateExcelAppliances(requirements, techTypes) {
  if (!techTypes.length) return [];
  const lookup = new Map();
  techTypes.forEach((techType) => {
    const key = normalizeApplianceKey(techType.valueClass);
    if (!key) return;
    lookup.set(key, (lookup.get(key) || 0) + 1);
  });
  return requirements.flatMap((requirement) =>
    requirement.appliances
      .filter((appliance) => appliance && lookup.get(normalizeApplianceKey(appliance)) !== 1)
      .map((appliance) => `Zeile ${requirement.rowNumber}: Für Appliance '${appliance}' wurde keine eindeutige Zuordnung gefunden.`));
}

function findHeaderIndex(rows) {
  return rows.findIndex((row) => {
    const normalized = row.map(normalizeColumnName);
    const matchedRequiredColumns = REQUIRED_EXCEL_COLUMNS.filter((required) =>
      normalized.some((header) => required.aliases.includes(header)));
    return matchedRequiredColumns.length >= 2;
  });
}

function applianceValues(row, headers) {
  const indexes = headers
    .map((header, index) => (/appliance|techtype|valueclass/i.test(normalizeColumnName(header)) ? index : -1))
    .filter((index) => index >= 0);
  return indexes.flatMap((index) => cellText(row[index]).split(/\n|,|;/).map((item) => item.trim()).filter(Boolean));
}

function buildExcelSummary(requirements, techTypes, warnings, errors) {
  return {
    requirementCount: requirements.length,
    uniqueRequirementIdCount: new Set(requirements.map((item) => item.id).filter(Boolean)).size,
    categoryCount: new Set(requirements.map((item) => item.category).filter(Boolean)).size,
    techTypeCount: techTypes.length,
    warningCount: warnings.length,
    errorCount: errors.length,
  };
}

function invalidExcelImport(category, errors) {
  return {
    ok: false,
    valid: false,
    format: "xlsx",
    category,
    requirements: [],
    techTypes: [],
    warnings: [],
    errors,
    summary: buildExcelSummary([], [], [], errors),
    example: excelFormatExample(),
  };
}

function excelFormatExample() {
  return {
    type: "table",
    columns: ["PR_ID", "Category", "Sub-Category", "Description"],
    rows: [
      ["PR-001", "Bedienung", "Anzeige", "Das Gerät muss den aktuellen Betriebsstatus anzeigen."],
      ["PR-002", "Sicherheit", "Kinderschutz", "Das Gerät muss eine unbeabsichtigte Bedienung verhindern."],
    ],
    hint: "Die Bezeichnungen der Pflichtspalten müssen exakt mit dem Beispiel übereinstimmen.",
  };
}

async function loadXlsx() {
  if (!xlsxPromise) {
    xlsxPromise = readFile(new URL("../../vendor/xlsx.full.min.js", import.meta.url), "utf8").then((source) => {
      const module = { exports: {} };
      const context = createContext({ module, exports: module.exports, console, setTimeout, clearTimeout, Buffer });
      new Script(source, { filename: "vendor/xlsx.full.min.js" }).runInContext(context);
      const XLSX = module.exports;
      if (!XLSX?.read) throw new Error("XLSX library could not be loaded.");
      return XLSX;
    });
  }
  const XLSX = await xlsxPromise;
  return XLSX;
}

function isHiddenSheet(workbook, index) {
  return Boolean(workbook.Workbook?.Sheets?.[index]?.Hidden);
}

function findTechTypeSheetName(sheetNames) {
  return sheetNames.find((name) => normalizeColumnName(name) === "techtype") ||
    sheetNames.find((name) => normalizeColumnName(name).includes("techtype")) ||
    "";
}

function toBytes(buffer) {
  if (!buffer) return Buffer.alloc(0);
  if (Buffer.isBuffer(buffer)) return buffer;
  if (buffer instanceof Uint8Array) return Buffer.from(buffer);
  return Buffer.from(buffer);
}

function hasZipSignature(bytes) {
  return bytes[0] === 0x50 && bytes[1] === 0x4b && [0x03, 0x05, 0x07].includes(bytes[2]) && [0x04, 0x06, 0x08].includes(bytes[3]);
}

function normalizeColumnName(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function hasValue(value) {
  return cellText(value).length > 0;
}

function cellText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeApplianceKey(value) {
  return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
}
