import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { basename, extname, join, normalize } from "node:path";
import { promisify } from "node:util";

const root = new URL(".", import.meta.url).pathname;
const execFileAsync = promisify(execFile);

await loadDotEnv();

const port = Number(process.env.PORT || 3000);
const basePath = normalizeBasePath(process.env.BASE_PATH || "");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

const server = createServer(async (req, res) => {
  try {
    setCorsHeaders(res);
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    let pathname = url.pathname;

    if (basePath) {
      if (pathname === basePath) {
        res.writeHead(308, { Location: `${basePath}/` });
        res.end();
        return;
      }

      if (!pathname.startsWith(`${basePath}/`)) {
        sendJson(res, 404, { error: "Not found" });
        return;
      }

      pathname = pathname.slice(basePath.length) || "/";
    }

    if (req.method === "POST" && pathname === "/api/analyze") {
      await handleAnalyze(req, res);
      return;
    }

    if (req.method === "POST" && pathname === "/api/save-project") {
      await handleSaveProject(req, res);
      return;
    }

    if (req.method === "GET" && pathname === "/api/runtime") {
      sendJson(res, 200, {
        mock: process.env.OPENAI_MOCK === "true",
        git: await getGitVersionInfo(),
      });
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      sendJson(res, 405, { error: "Method not allowed" });
      return;
    }

    await serveStatic(pathname, res, req.method === "HEAD");
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: "Unexpected server error" });
  }
});

server.listen(port, () => {
  console.log(`Miele.DevPilot is running at http://localhost:${port}${basePath || ""}/`);
});

async function handleAnalyze(req, res) {
  const body = await readJsonBody(req);
  const requirementType = body.requirementType || "product";
  if (requirementType !== "product" && requirementType !== "software") {
    sendJson(res, 400, { error: "Unsupported requirement type." });
    return;
  }

  const requirements = Array.isArray(body.requirements) ? body.requirements : [];
  const analysisMode = body.analysisMode === "final" ? "final" : "initial";
  const finalChoice = body.finalChoice === "original" ? "original" : "ai";
  const cleaned = requirements
    .map((item) => ({
      rowNumber: Number(item.rowNumber),
      id: String(item.id || "").slice(0, 200),
      text: String(item.text || "").trim().slice(0, 6000),
    }))
    .filter((item) => item.text);

  if (!cleaned.length) {
    sendJson(res, 400, { error: "No requirements were provided." });
    return;
  }

  if (cleaned.length > 25) {
    sendJson(res, 400, { error: "Please analyze 25 requirements or fewer per batch." });
    return;
  }

  if (requirementType === "software") {
    await handleSoftwareDerivation(cleaned, res);
    return;
  }

  if (process.env.OPENAI_MOCK === "true") {
    sendJson(res, 200, {
      results: cleaned.map((item) => {
        if (analysisMode !== "final") return mockAnalyzeRequirement(item);
        return finalChoice === "original" ? mockAnalyzeRequirement(item) : mockFinalizeRequirement(item);
      }),
    });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    sendJson(res, 500, { error: "OPENAI_API_KEY is not configured on the server." });
    return;
  }

  let response;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.5",
        input: [
          {
            role: "system",
            content:
              "You are a senior requirements engineer. Evaluate and improve Product Requirement quality in German or English so high-quality Software Requirements can be derived later. Be specific, concise, and practical. Return only valid JSON that matches the schema.",
          },
          {
            role: "user",
            content: JSON.stringify({
              task:
                analysisMode === "final"
                  ? "Re-assess the selected final Product Requirement text for clarity, testability, completeness, atomicity, consistency, solution neutrality, measurability, ambiguity, concrete acceptance criteria, and suitability as a basis for deriving Software Requirements later. Score the final text as it stands. If it is production-ready as a Product Requirement, return score 100 and no issues. Keep rewrittenRequirement identical to the selected final text unless a concrete correction is still required."
                  : "Assess each Product Requirement for clarity, testability, completeness, atomicity, consistency, solution neutrality, measurability, ambiguity, and suitability as a basis for deriving Software Requirements later. Provide improvement suggestions and a rewritten Product Requirement with concrete acceptance criteria.",
              scoring:
                "Score 0-100 where 100 is a high-quality Product Requirement from which high-quality Software Requirements can be derived later. Severity must be low, medium, or high.",
              rewritingRules:
                "The rewrittenRequirement must remain a Product Requirement. Do not turn it into a Software Requirement and do not introduce implementation decisions that are not present in or safely inferable from the Product Requirement. It should describe the user or business need, outcome, scope, and relevant context clearly; remain solution-neutral; be complete enough to derive one or more Software Requirements in a later step; stay verifiable, measurable, consistent, unambiguous, and as atomic as practical at Product Requirement level; and include concrete acceptance criteria in the same text, preferably as short Given/When/Then or bullet-style criteria. If acceptance criteria are missing, vague, not testable, or insufficient for deriving later Software Requirements, report that as an issue.",
              requirements: cleaned,
            }),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "requirements_quality_report",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                results: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      rowNumber: { type: "number" },
                      id: { type: "string" },
                      score: { type: "number" },
                      verdict: { type: "string" },
                      issues: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: false,
                          properties: {
                            criterion: { type: "string" },
                            severity: { type: "string", enum: ["low", "medium", "high"] },
                            explanation: { type: "string" },
                            suggestion: { type: "string" },
                          },
                          required: ["criterion", "severity", "explanation", "suggestion"],
                        },
                      },
                      rewrittenRequirement: { type: "string" },
                    },
                    required: ["rowNumber", "id", "score", "verdict", "issues", "rewrittenRequirement"],
                  },
                },
              },
              required: ["results"],
            },
          },
        },
        max_output_tokens: 20000,
      }),
    });
  } catch (error) {
    console.error("OpenAI request failed:", error);
    sendJson(res, 502, { error: "OpenAI request could not be completed. Check network connectivity and try again." });
    return;
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    sendJson(res, response.status, {
      error: payload.error?.message || "OpenAI request failed.",
    });
    return;
  }

  if (payload.status === "incomplete") {
    sendJson(res, 502, {
      error: "OpenAI response was incomplete. Please retry with fewer or shorter requirements.",
    });
    return;
  }

  const outputText = extractOutputText(payload);
  if (!outputText) {
    sendJson(res, 502, { error: "OpenAI returned no parseable output." });
    return;
  }

  try {
    sendJson(res, 200, JSON.parse(outputText));
  } catch (error) {
    console.error("OpenAI returned invalid JSON:", error);
    sendJson(res, 502, {
      error: "OpenAI returned invalid JSON, likely because the response was too long. Please retry with fewer or shorter requirements.",
    });
  }
}

async function handleSaveProject(req, res) {
  if (process.platform !== "darwin") {
    sendJson(res, 501, { error: "Native save dialog is only available on macOS." });
    return;
  }

  const body = await readJsonBody(req, 25_000_000);
  const content = typeof body.content === "string" ? body.content : "";
  if (!content) {
    sendJson(res, 400, { error: "No project content was provided." });
    return;
  }

  const defaultName = normalizeProjectFileName(body.fileName || "Miele.DevPilot.mdp");
  let targetPath;
  try {
    targetPath = await chooseSavePath(defaultName);
  } catch (error) {
    if (isAppleScriptCancel(error)) {
      sendJson(res, 499, { canceled: true });
      return;
    }

    console.error(error);
    sendJson(res, 500, { error: "Save dialog could not be opened." });
    return;
  }

  const finalPath = targetPath.toLowerCase().endsWith(".mdp") ? targetPath : `${targetPath}.mdp`;
  await writeFile(finalPath, content, "utf8");
  sendJson(res, 200, { fileName: basename(finalPath), path: finalPath });
}

async function handleSoftwareDerivation(requirements, res) {
  if (process.env.OPENAI_MOCK === "true") {
    sendJson(res, 200, {
      softwareRequirements: requirements.map((item, index) => mockSoftwareRequirement(item, index)),
    });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    sendJson(res, 500, { error: "OPENAI_API_KEY is not configured on the server." });
    return;
  }

  let response;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.5",
        input: [
          {
            role: "system",
            content:
              "You are a senior software requirements engineer. Derive precise, testable Software Requirements and concrete acceptance criteria from approved Product Requirements so they can be used later for Use Cases and Test Cases. Consider the main flow, alternative flows, and exception flows. If relevant PR information is missing, ambiguous, not measurable, or not testable, report it as a quality issue. Apply the quality criteria of very good Software Requirements: clear, atomic, consistent, feasible, unambiguous, traceable, verifiable, testable, complete, measurable, implementation-aware where necessary, and not design-overprescriptive. Return only valid JSON that matches the schema.",
          },
          {
            role: "user",
            content: JSON.stringify({
              task:
                "For each Product Requirement, derive one Software Requirement that specifies observable system behavior, inputs, outputs, constraints, quality constraints, and verification-relevant acceptance criteria. Use clear shall-style wording. Preserve traceability to the source Product Requirement. Include main flow, alternative flows, exception flows, and concrete acceptance criteria that can later be used directly as a basis for Use Cases and Test Cases. Score each Software Requirement from 0-100. A score of 85 or higher means the Software Requirement is good enough to be used as a basis for later Use Cases and Test Cases. If the score is below 85, include concrete quality issues and improvement suggestions. If the source PR is not sufficiently testable, include this in issues and reduce the score accordingly.",
              scoring:
                "Score 0-100. 100 means excellent SR quality. 85 is the minimum acceptable quality threshold. Evaluate clarity, atomicity, traceability, consistency, completeness, feasibility, testability, measurability, unambiguity, flow coverage, exception handling, acceptance-criteria quality, and suitability for deriving Use Cases and Test Cases.",
              requirements,
            }),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "software_requirements_derivation",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                softwareRequirements: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      sourceRowNumber: { type: "number" },
                      sourceId: { type: "string" },
                      id: { type: "string" },
                      text: { type: "string" },
                      happyFlow: { type: "string" },
                      alternativeFlows: {
                        type: "array",
                        items: { type: "string" },
                      },
                      exceptionFlows: {
                        type: "array",
                        items: { type: "string" },
                      },
                      acceptanceCriteria: {
                        type: "array",
                        items: { type: "string" },
                      },
                      score: { type: "number" },
                      issues: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: false,
                          properties: {
                            criterion: { type: "string" },
                            severity: { type: "string", enum: ["low", "medium", "high"] },
                            explanation: { type: "string" },
                            suggestion: { type: "string" },
                          },
                          required: ["criterion", "severity", "explanation", "suggestion"],
                        },
                      },
                      rationale: { type: "string" },
                    },
                    required: [
                      "sourceRowNumber",
                      "sourceId",
                      "id",
                      "text",
                      "happyFlow",
                      "alternativeFlows",
                      "exceptionFlows",
                      "acceptanceCriteria",
                      "score",
                      "issues",
                      "rationale",
                    ],
                  },
                },
              },
              required: ["softwareRequirements"],
            },
          },
        },
        max_output_tokens: 20000,
      }),
    });
  } catch (error) {
    console.error("OpenAI software derivation failed:", error);
    sendJson(res, 502, { error: "OpenAI request could not be completed. Check network connectivity and try again." });
    return;
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    sendJson(res, response.status, {
      error: payload.error?.message || "OpenAI request failed.",
    });
    return;
  }

  const outputText = extractOutputText(payload);
  if (!outputText) {
    sendJson(res, 502, { error: "OpenAI returned no parseable output." });
    return;
  }

  try {
    sendJson(res, 200, JSON.parse(outputText));
  } catch (error) {
    console.error("Could not parse OpenAI software output:", outputText, error);
    sendJson(res, 502, { error: "OpenAI returned invalid JSON." });
  }
}

function isAppleScriptCancel(error) {
  const message = `${error?.message || ""}\n${error?.stderr || ""}`;
  return error?.code === 1 && (message.includes("-128") || message.includes("User canceled"));
}

async function serveStatic(pathname, res, headOnly = false) {
  const requested = pathname === "/" ? "/index.html" : pathname;
  const safePath = normalize(decodeURIComponent(requested)).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(root, safePath);

  if (!filePath.startsWith(root)) {
    sendJson(res, 403, { error: "Forbidden" });
    return;
  }

  try {
    const data = await readFile(filePath);
    res.writeHead(200, { "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream" });
    res.end(headOnly ? undefined : data);
  } catch {
    sendJson(res, 404, { error: "Not found" });
  }
}

function readJsonBody(req, maxBytes = 1_000_000) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > maxBytes) {
        reject(new Error("Request body is too large."));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(data || "{}"));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

async function getGitVersionInfo() {
  const [description, commit, branch, date, dirty] = await Promise.all([
    readGitValue(["describe", "--tags", "--always", "--dirty"]),
    readGitValue(["rev-parse", "--short", "HEAD"]),
    readGitValue(["branch", "--show-current"]),
    readGitValue(["log", "-1", "--format=%cI"]),
    readGitValue(["status", "--short"]),
  ]);

  return {
    version: description || commit || "Nicht verfuegbar",
    commit: commit || "Nicht verfuegbar",
    branch: branch || "Nicht verfuegbar",
    date: date || "",
    dirty: Boolean(dirty),
  };
}

async function readGitValue(args) {
  try {
    const { stdout } = await execFileAsync("git", ["-C", root, ...args]);
    return stdout.trim();
  } catch {
    return "";
  }
}

async function chooseSavePath(defaultName) {
  const { stdout } = await execFileAsync("osascript", [
    "-e",
    "on run argv",
    "-e",
    "set defaultName to item 1 of argv",
    "-e",
    "set chosenFile to choose file name with prompt \"Miele.DevPilot Projekt speichern\" default name defaultName",
    "-e",
    "return POSIX path of chosenFile",
    "-e",
    "end run",
    defaultName,
  ]);

  return stdout.trim();
}

function normalizeProjectFileName(value) {
  const name = basename(String(value || "Miele.DevPilot.mdp")).replace(/[/:]/g, "-").trim() || "Miele.DevPilot.mdp";
  return name.toLowerCase().endsWith(".mdp") ? name : `${name}.mdp`;
}

function extractOutputText(payload) {
  if (typeof payload.output_text === "string") {
    return payload.output_text;
  }

  for (const item of payload.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        return content.text;
      }
    }
  }

  return "";
}

function mockAnalyzeRequirement(item) {
  const vagueWords = ["schnell", "einfach", "intuitiv", "angemessen", "performant"];
  const lower = item.text.toLowerCase();
  const issues = [];

  for (const word of vagueWords) {
    if (lower.includes(word)) {
      issues.push({
        criterion: "Eindeutigkeit",
        severity: "medium",
        explanation: `Der Begriff "${word}" ist ohne messbaren Grenzwert interpretierbar.`,
        suggestion: "Ergaenze eine konkrete Messgroesse, Zielwert und Messkontext.",
      });
    }
  }

  if (!lower.includes("wenn") && !lower.includes("falls") && !lower.includes("bei ")) {
    issues.push({
      criterion: "Vollstaendigkeit",
      severity: "low",
      explanation: "Der ausloesende Kontext oder die Bedingung ist nicht klar beschrieben.",
      suggestion: "Formuliere den relevanten Zustand, Nutzerkontext oder Trigger.",
    });
  }

  return {
    rowNumber: item.rowNumber,
    id: item.id,
    score: Math.max(45, 90 - issues.length * 18),
    verdict: issues.length ? "Verbesserungsbedarf" : "Solide formuliert",
    issues,
    rewrittenRequirement: issues.length
      ? `${item.text} Akzeptanzkriterien: 1. Der relevante Nutzer- oder Geschaeftskontext ist beschrieben. 2. Das erwartete Ergebnis ist messbar und pruefbar. 3. Aus dem Product Requirement koennen spaeter konkrete Software Requirements ohne zusaetzliche Interpretation abgeleitet werden.`
      : item.text,
  };
}

function mockFinalizeRequirement(item) {
  return {
    rowNumber: item.rowNumber,
    id: item.id,
    score: 100,
    verdict: "Finaler Text ausgewaehlt",
    issues: [],
    rewrittenRequirement: item.text,
  };
}

function mockSoftwareRequirement(item, index) {
  const sourceId = item.id || `PR-${item.rowNumber || index + 1}`;
  const isCritical = index % 4 === 3;
  return {
    sourceRowNumber: item.rowNumber,
    sourceId,
    id: buildMockSoftwareRequirementId(sourceId, index),
    text: `Das System muss das Product Requirement "${sourceId}" durch eine pruefbare Systemfunktion unterstuetzen. Ausloeser, Eingabedaten, Systemreaktion und erwartetes Ergebnis muessen nachvollziehbar protokolliert und anhand definierter Akzeptanzkriterien verifizierbar sein.`,
    happyFlow:
      "Der berechtigte Benutzer startet den vorgesehenen Ablauf mit vollstaendigen und gueltigen Eingaben. Das System verarbeitet die Eingaben, stellt das erwartete Ergebnis bereit und dokumentiert den Status nachvollziehbar.",
    alternativeFlows: [
      "Falls optionale Informationen fehlen, verwendet das System definierte Standardwerte oder fordert die fehlenden Angaben gezielt nach.",
      "Falls mehrere gueltige Bearbeitungswege moeglich sind, fuehrt das System den Benutzer konsistent durch die gewaehlte Variante.",
    ],
    exceptionFlows: [
      "Falls Pflichtangaben ungueltig oder unvollstaendig sind, bricht das System die Verarbeitung kontrolliert ab und zeigt eine konkrete, handlungsorientierte Fehlermeldung.",
      "Falls ein benoetigter Dienst nicht verfuegbar ist, sichert das System den aktuellen Bearbeitungsstand und meldet den Fehler nachvollziehbar.",
    ],
    acceptanceCriteria: [
      "Gegeben vollstaendige und gueltige Eingaben, wenn der Benutzer den Ablauf startet, dann stellt das System das erwartete Ergebnis nachvollziehbar bereit.",
      "Gegeben ungueltige Pflichtangaben, wenn die Verarbeitung gestartet wird, dann verhindert das System die Verarbeitung und zeigt eine konkrete Fehlermeldung.",
      "Gegeben ein technischer Fehler, wenn die Verarbeitung nicht abgeschlossen werden kann, dann bleibt der Bearbeitungsstand nachvollziehbar und der Fehler wird protokolliert.",
    ],
    score: isCritical ? 78 : 90,
    issues: isCritical
      ? [
          {
            criterion: "Testbarkeit",
            severity: "medium",
            explanation:
              "Der Mock markiert dieses Software Requirement absichtlich als noch nicht ausreichend konkret, damit die Score-Warnung getestet werden kann.",
            suggestion:
              "Ergaenze messbare Akzeptanzkriterien, konkrete Systemreaktionen und eindeutige Fehlerbedingungen.",
          },
        ]
      : [],
    rationale: `Abgeleitet aus dem finalen Product Requirement: ${item.text.slice(0, 180)}`,
  };
}

function buildMockSoftwareRequirementId(sourceId, index) {
  if (/^PR(?=[_-])/i.test(sourceId)) {
    return sourceId.replace(/^PR/i, "SR");
  }

  if (/^PR\b/i.test(sourceId)) {
    return sourceId.replace(/^PR/i, "SR");
  }

  return `SR-${String(index + 1).padStart(3, "0")}`;
}

async function loadDotEnv() {
  if (process.env.OPENAI_API_KEY) {
    return;
  }

  try {
    const env = await readFile(join(root, ".env.local"), "utf8");
    for (const line of env.split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2];
      }
    }
  } catch {
    // Local env files are optional. The request handler reports missing keys.
  }
}

function normalizeBasePath(value) {
  const trimmed = String(value || "").trim().replace(/\/+$/, "");
  if (!trimmed || trimmed === "/") {
    return "";
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}
