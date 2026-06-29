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
  const appUrl = `http://localhost:${port}${basePath || ""}/`;
  console.log(`Miele.DevPilot is running at ${appUrl}`);
  openAppInBrowser(appUrl).catch((error) => {
    console.warn(`Browser could not be opened automatically. Please open ${appUrl} manually.`, error.message);
  });
});

async function openAppInBrowser(url) {
  if (process.env.OPEN_BROWSER === "false") return;

  if (process.platform === "darwin") {
    await execFileAsync("open", [url]);
    return;
  }

  if (process.platform === "win32") {
    await execFileAsync("cmd", ["/c", "start", "", url]);
    return;
  }

  await execFileAsync("xdg-open", [url]);
}

async function handleAnalyze(req, res) {
  const body = await readJsonBody(req, 3_000_000);
  const requirementType = body.requirementType || "product";
  if (
    requirementType !== "product" &&
    requirementType !== "software" &&
    requirementType !== "software-improvement" &&
    requirementType !== "e2e" &&
    requirementType !== "e2e-improvement" &&
    requirementType !== "product-improvement"
  ) {
    sendJson(res, 400, { error: "Unsupported requirement type." });
    return;
  }

  const requirements = Array.isArray(body.requirements) ? body.requirements : [];
  const improvementAttachments = cleanImprovementAttachments(body.improvementAttachments);
  const analysisMode = body.analysisMode === "final" ? "final" : "initial";
  const finalChoice = body.finalChoice === "original" ? "original" : "ai";
  const cleaned = requirements
    .map((item) => ({
      rowNumber: Number(item.rowNumber),
      id: String(item.id || "").slice(0, 200),
      sourceId: String(item.sourceId || "").slice(0, 200),
      text: String(item.text || "").trim().slice(0, 6000),
      score: Number(item.score),
      techTypes: Array.isArray(item.techTypes)
        ? item.techTypes.map((techType) => String(techType || "").trim().slice(0, 500)).filter(Boolean)
        : [],
      acceptanceCriteria: Array.isArray(item.acceptanceCriteria)
        ? item.acceptanceCriteria.map((criterion) => String(criterion || "").trim().slice(0, 2000)).filter(Boolean)
        : [],
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

  if (requirementType === "product-improvement") {
    await handleProductImprovement(cleaned[0], String(body.improvementInstruction || "").trim(), improvementAttachments, res);
    return;
  }

  if (requirementType === "software") {
    await handleSoftwareDerivation(cleaned, res);
    return;
  }

  if (requirementType === "software-improvement") {
    await handleSoftwareImprovement(cleaned[0], cleanSoftwareRequirement(body.softwareRequirement), String(body.improvementInstruction || "").trim(), improvementAttachments, res);
    return;
  }

  if (requirementType === "e2e") {
    await handleE2eDerivation(cleaned, res);
    return;
  }

  if (requirementType === "e2e-improvement") {
    await handleE2eImprovement(cleaned[0], cleanE2eTestCase(body.testCase), String(body.improvementInstruction || "").trim(), improvementAttachments, res);
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
                  ? "Re-assess the selected final Product Requirement text for clarity, testability, completeness, atomicity, consistency, solution neutrality, measurability, ambiguity, and suitability as a basis for deriving Software Requirements later. Score the final text as it stands. Do not require or add acceptance criteria. If it is production-ready as a Product Requirement, return score 100 and no issues. Keep rewrittenRequirement identical to the selected final text unless a concrete correction is still required. For final reassessment, set originalScore equal to score and originalIssues equal to issues."
                  : "Assess each Product Requirement for clarity, testability, completeness, atomicity, consistency, solution neutrality, measurability, ambiguity, and suitability as a basis for deriving Software Requirements later. Rewrite the Product Requirement so the generated text addresses the detected weaknesses. Do not include acceptance criteria, Given/When/Then blocks, test steps, or bullet-style verification criteria.",
              scoring:
                "Return originalScore and originalIssues for the original input Product Requirement. Return score, verdict, and issues for the rewrittenRequirement. Score 0-100 where 100 is a high-quality Product Requirement from which high-quality Software Requirements can be derived later. If the rewrittenRequirement addresses all relevant weaknesses, return score 100 and no issues. Severity must be low, medium, or high.",
              languageRules: preserveSourceLanguageInstruction(),
              rewritingRules:
                "The rewrittenRequirement must remain a Product Requirement. Do not turn it into a Software Requirement and do not introduce implementation decisions that are not present in or safely inferable from the Product Requirement. It should describe the user or business need, outcome, scope, and relevant context clearly; remain solution-neutral; be complete enough to derive one or more Software Requirements in a later step; and stay verifiable, measurable, consistent, unambiguous, and as atomic as practical at Product Requirement level. It must not include acceptance criteria, Given/When/Then blocks, test steps, or bullet-style verification criteria. Apply the improvement suggestions internally while rewriting. Report issues only for remaining weaknesses in the rewrittenRequirement.",
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
                      originalScore: { type: "number" },
                      originalIssues: {
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
                    required: ["rowNumber", "id", "originalScore", "originalIssues", "score", "verdict", "issues", "rewrittenRequirement"],
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
    const parsed = JSON.parse(outputText);
    enforceSoftwareScoreRules(parsed, requirements);
    sendJson(res, 200, {
      ...parsed,
      openAiUsage: buildOpenAiUsageSummary(payload),
    });
  } catch (error) {
    console.error("OpenAI returned invalid JSON:", error);
    sendJson(res, 502, {
      error: "OpenAI returned invalid JSON, likely because the response was too long. Please retry with fewer or shorter requirements.",
    });
  }
}

function preserveSourceLanguageInstruction() {
  return "Preserve the source language of each requirement or test case. German input must be improved or derived in German. English input must be improved or derived in English. Do not translate PR, SR, acceptance criteria, E2E descriptions, groups, preconditions, test data, test steps, expected results, issues, suggestions, or rationales into another language unless the user's improvement instruction explicitly asks for a language change. Preserve IDs and technical names unchanged.";
}

function cleanImprovementAttachments(value) {
  if (!Array.isArray(value)) return [];

  return value.slice(0, 5).map((item) => ({
    name: String(item?.name || "Anhang").slice(0, 240),
    type: String(item?.type || "").slice(0, 120),
    size: Number(item?.size) || 0,
    text: String(item?.text || "").slice(0, 12000),
    truncated: Boolean(item?.truncated),
  })).filter((item) => item.name || item.text);
}

function attachmentInstruction(attachments) {
  if (!attachments.length) return "No additional improvement attachments were provided.";

  return "Use the provided improvementAttachments as additional context for the requested improvement. Prefer explicit user instructions over attachment content. Preserve requirement intent and traceability. Do not copy irrelevant attachment text verbatim. If an attachment is marked truncated, use only the available excerpt and do not invent missing content.";
}

async function handleProductImprovement(requirement, improvementInstruction, improvementAttachments, res) {
  if (!requirement?.text) {
    sendJson(res, 400, { error: "Product Requirement is required." });
    return;
  }

  if (!improvementInstruction) {
    sendJson(res, 400, { error: "Improvement instruction is required." });
    return;
  }

  if (process.env.OPENAI_MOCK === "true") {
    const attachmentSuffix = improvementAttachments.length ? ` Anhänge berücksichtigt: ${improvementAttachments.map((item) => item.name).join(", ")}` : "";
    sendJson(res, 200, {
      result: {
        rowNumber: requirement.rowNumber,
        id: requirement.id,
        originalScore: Number(requirement.score) || 90,
        originalIssues: [],
        score: 100,
        verdict: "AI-Verbesserung angewendet",
        issues: [],
        rewrittenRequirement: `${requirement.text} Verbesserungsfokus: ${improvementInstruction}.${attachmentSuffix}`,
      },
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
              "You are a senior product requirements engineer. Improve one Product Requirement according to the user's instruction. Return only valid JSON that matches the schema.",
          },
          {
            role: "user",
            content: JSON.stringify({
              task:
                "Improve the Product Requirement according to the improvement instruction. Preserve the intent, scope, product level, and solution neutrality. Do not turn it into a Software Requirement. Do not add acceptance criteria, Given/When/Then blocks, test steps, or implementation details. Make it clearer, more atomic, measurable, unambiguous, complete, and suitable for deriving Software Requirements. Return no issues when the rewritten requirement is production-ready.",
              languageRules: preserveSourceLanguageInstruction(),
              attachmentRules: attachmentInstruction(improvementAttachments),
              improvementInstruction,
              improvementAttachments,
              requirement,
            }),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "product_requirement_improvement",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                result: requirementQualityResultSchema(),
              },
              required: ["result"],
            },
          },
        },
        max_output_tokens: 8000,
      }),
    });
  } catch (error) {
    console.error("OpenAI product improvement failed:", error);
    sendJson(res, 502, { error: "OpenAI request could not be completed. Check network connectivity and try again." });
    return;
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    sendJson(res, response.status, { error: payload.error?.message || "OpenAI request failed." });
    return;
  }

  const outputText = extractOutputText(payload);
  if (!outputText) {
    sendJson(res, 502, { error: "OpenAI returned no parseable output." });
    return;
  }

  try {
    const parsed = JSON.parse(outputText);
    sendJson(res, 200, {
      ...parsed,
      openAiUsage: buildOpenAiUsageSummary(payload),
    });
  } catch (error) {
    console.error("Could not parse OpenAI product improvement output:", outputText, error);
    sendJson(res, 502, { error: "OpenAI returned invalid JSON." });
  }
}

function issueSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      criterion: { type: "string" },
      severity: { type: "string", enum: ["low", "medium", "high"] },
      explanation: { type: "string" },
      suggestion: { type: "string" },
    },
    required: ["criterion", "severity", "explanation", "suggestion"],
  };
}

function requirementQualityResultSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      rowNumber: { type: "number" },
      id: { type: "string" },
      originalScore: { type: "number" },
      originalIssues: {
        type: "array",
        items: issueSchema(),
      },
      score: { type: "number" },
      verdict: { type: "string" },
      issues: {
        type: "array",
        items: issueSchema(),
      },
      rewrittenRequirement: { type: "string" },
    },
    required: ["rowNumber", "id", "originalScore", "originalIssues", "score", "verdict", "issues", "rewrittenRequirement"],
  };
}

function softwareRequirementSchema() {
  return {
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
      score: { type: "number", minimum: 85, maximum: 100 },
      issues: {
        type: "array",
        items: issueSchema(),
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
  };
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
              "You are a senior software requirements engineer. Derive precise, testable Software Requirements and concrete acceptance criteria from approved Product Requirements so they can be used later for Use Cases and Test Cases. Consider the main flow, alternative flows, and exception flows. Apply the quality criteria of very good Software Requirements: clear, atomic, consistent, feasible, unambiguous, traceable, verifiable, testable, complete, measurable, implementation-aware where necessary, and not design-overprescriptive. Improve the derived SR until it reaches the required quality threshold before returning it. Return only valid JSON that matches the schema.",
          },
          {
            role: "user",
            content: JSON.stringify({
              task:
                "For each Product Requirement, derive one or more Software Requirements that specify observable system behavior, inputs, outputs, constraints, quality constraints, and verification-relevant acceptance criteria. Use the selected techTypes as device applicability context. If a PR applies only to selected appliance designations, keep the SR applicable to those TechTypes and mention device-specific constraints only when they materially affect behavior, interfaces, data, errors, or acceptance criteria. Do not duplicate SRs per TechType unless behavior genuinely differs. Actively check whether the PR contains more than one actor goal, system responsibility, observable behavior, condition, business rule, data object, alternative flow, exception flow, or quality constraint. If it does, split it into multiple atomic SRs. Prefer multiple SRs whenever this is needed to preserve atomicity, clarity, testability, flow coverage, or separation of concerns. Derive only one SR when the PR is truly atomic. Use clear shall-style wording. Preserve traceability to the source Product Requirement. Keep the SR text concise and do not duplicate flow prose in the SR text. Include concrete acceptance criteria that belong directly to the SR and can later be used directly as a basis for Use Cases and Test Cases. Write each SR and its acceptanceCriteria in the same language: German SRs require German acceptance criteria, English SRs require English acceptance criteria. Use happyFlow, alternativeFlows, and exceptionFlows only as structured derivation context. Score each Software Requirement from 85-100. Never return a score below 85. If an initial draft would score below 85, improve the Software Requirement until it reaches at least 85 before returning it. If the source Product Requirement has score 100, every derived Software Requirement for that PR must also have score 100. When deriving multiple SRs from source PR PR_BAROLO_1.1, use IDs such as SR_BAROLO_1.1.1 and SR_BAROLO_1.1.2. Remaining issues may be reported only when they do not reduce the SR below the minimum threshold.",
              scoring:
                "Score 85-100. 100 means excellent SR quality. 85 is the minimum acceptable quality threshold. A source PR with score 100 requires a derived SR with score 100. Evaluate clarity, atomicity, traceability, consistency, completeness, feasibility, testability, measurability, unambiguity, flow coverage, exception handling, acceptance-criteria quality, and suitability for deriving Use Cases and Test Cases.",
              languageRules: preserveSourceLanguageInstruction(),
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
                      score: { type: "number", minimum: 85, maximum: 100 },
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
    sendJson(res, 200, {
      ...JSON.parse(outputText),
      openAiUsage: buildOpenAiUsageSummary(payload),
    });
  } catch (error) {
    console.error("Could not parse OpenAI software output:", outputText, error);
    sendJson(res, 502, { error: "OpenAI returned invalid JSON." });
  }
}

async function handleSoftwareImprovement(sourceRequirement, softwareRequirement, improvementInstruction, improvementAttachments, res) {
  if (!sourceRequirement?.text || !softwareRequirement?.id) {
    sendJson(res, 400, { error: "Product Requirement and Software Requirement are required." });
    return;
  }

  if (!improvementInstruction) {
    sendJson(res, 400, { error: "Improvement instruction is required." });
    return;
  }

  if (process.env.OPENAI_MOCK === "true") {
    const attachmentSuffix = improvementAttachments.length ? ` Anhänge berücksichtigt: ${improvementAttachments.map((item) => item.name).join(", ")}` : "";
    const improved = {
      ...softwareRequirement,
      text: `${softwareRequirement.text || "Das System muss das Verhalten pruefbar bereitstellen."} Verbesserungsfokus: ${improvementInstruction}.${attachmentSuffix}`,
      acceptanceCriteria: Array.isArray(softwareRequirement.acceptanceCriteria) && softwareRequirement.acceptanceCriteria.length
        ? softwareRequirement.acceptanceCriteria
        : ["Gegeben gueltige Ausgangsbedingungen, wenn der Ablauf ausgefuehrt wird, dann ist das erwartete Systemverhalten eindeutig pruefbar."],
      score: Number(sourceRequirement.score) === 100 ? 100 : 96,
      issues: [],
      rationale: "Mock-Verbesserung anhand der angegebenen AI-Vorgabe.",
    };
    sendJson(res, 200, { softwareRequirement: improved });
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
              "You are a senior software requirements engineer. Improve one Software Requirement and its acceptance criteria according to the user's instruction. Return only valid JSON that matches the schema.",
          },
          {
            role: "user",
            content: JSON.stringify({
              task:
                "Improve the provided Software Requirement according to the improvement instruction while preserving traceability to the source Product Requirement. Keep the SR concise, atomic, measurable, unambiguous, feasible, and testable. Improve acceptance criteria so they are concrete, directly assigned to the SR, and written in the same language as the SR. Do not add informal flow prose into the SR text. Score 85-100. If the source Product Requirement has score 100, improve the SR until it is excellent and return score 100 with no remaining quality issues.",
              languageRules: preserveSourceLanguageInstruction(),
              attachmentRules: attachmentInstruction(improvementAttachments),
              improvementInstruction,
              improvementAttachments,
              sourceRequirement,
              softwareRequirement,
            }),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "software_requirement_improvement",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                softwareRequirement: softwareRequirementSchema(),
              },
              required: ["softwareRequirement"],
            },
          },
        },
        max_output_tokens: 10000,
      }),
    });
  } catch (error) {
    console.error("OpenAI software improvement failed:", error);
    sendJson(res, 502, { error: "OpenAI request could not be completed. Check network connectivity and try again." });
    return;
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    sendJson(res, response.status, { error: payload.error?.message || "OpenAI request failed." });
    return;
  }

  const outputText = extractOutputText(payload);
  if (!outputText) {
    sendJson(res, 502, { error: "OpenAI returned no parseable output." });
    return;
  }

  try {
    const parsed = JSON.parse(outputText);
    enforceSoftwareScoreRules({ softwareRequirements: [parsed.softwareRequirement] }, [sourceRequirement]);
    sendJson(res, 200, {
      ...parsed,
      openAiUsage: buildOpenAiUsageSummary(payload),
    });
  } catch (error) {
    console.error("Could not parse OpenAI software improvement output:", outputText, error);
    sendJson(res, 502, { error: "OpenAI returned invalid JSON." });
  }
}

function enforceSoftwareScoreRules(payload, sourceRequirements) {
  if (!Array.isArray(payload?.softwareRequirements)) return;

  const sourcesByRow = new Map(sourceRequirements.map((item) => [Number(item.rowNumber), item]));
  const sourcesById = new Map(sourceRequirements.map((item) => [String(item.id || ""), item]));
  payload.softwareRequirements.forEach((item, index) => {
    const source =
      sourcesByRow.get(Number(item.sourceRowNumber)) ||
      sourcesById.get(String(item.sourceId || "")) ||
      sourceRequirements[index] ||
      {};
    const sourceScore = Number(source.score);
    const score = Number(item.score);

    if (sourceScore === 100) {
      item.score = 100;
      item.issues = [];
      return;
    }

    if (!Number.isFinite(score) || score < 85) {
      item.score = 85;
    } else if (score > 100) {
      item.score = 100;
    }
  });
}

function enforceE2eScoreRules(payload, sourceRequirements) {
  if (!Array.isArray(payload?.e2eTests)) return;

  const sourcesById = new Map(sourceRequirements.map((item) => [String(item.id || ""), item]));
  payload.e2eTests.forEach((item) => {
    const source = sourcesById.get(String(item.sourceId || "")) || {};
    const sourceScore = Number(source.score);
    const score = Number(item.score);

    if (sourceScore === 100) {
      item.score = 100;
      item.issues = [];
      return;
    }

    if (!Number.isFinite(score) || score <= 85) {
      item.score = 86;
    } else if (score > 100) {
      item.score = 100;
    }
  });
}

async function handleE2eDerivation(requirements, res) {
  if (process.env.OPENAI_MOCK === "true") {
    sendJson(res, 200, {
      e2eTests: requirements.map((item, index) => mockE2eTest(item, index)),
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
              "You are a senior E2E test engineer. Derive formal, executable E2E TestCases from approved Software Requirements. Return only valid JSON that matches the schema.",
          },
          {
            role: "user",
            content: JSON.stringify({
              task:
                "For each Software Requirement, derive one or more E2E TestCases. Use the SR text, all SR acceptanceCriteria, and selected techTypes as the main derivation basis. Treat techTypes as the appliance designation applicability context and reflect device-specific preconditions, test data, or expected behavior only when relevant. Each TestCase must include E2E-ID, grouping information, a unique concise description, all acceptance criteria that led to this TestCase, reference to the source SR, reference to the source PR, and formal test steps. Prefer more than one TestCase when this improves coverage, independence, positive/negative coverage, or scenario separation. Include positive tests and, where meaningful, negative tests for invalid input, unavailable data, unavailable services, unsupported capabilities, permission problems, or failed state changes. Each TestCase must be production-ready: preconditions must precisely describe user role, system state, data state, permissions, connected devices, services, and feature flags required for execution; each action must be atomic and executable; each expectedResult must contain observable and verifiable outcomes such as UI state, data persistence, API/system response, error handling, or state transition. Include nachvollziehbare Prüfpunkte by making it clear which acceptance criteria are verified by the steps. Never return an issue that asks to precise preconditions, test steps, expected results, or verifiable checkpoints; fix the TestCase before returning it. Score each TestCase from 86-100, prefer 95-100, and never return a score of 85 or lower. Assign score 100 only when the returned JSON objectively contains a specific description, group, source SR, source PR, covered acceptance criteria, concrete preconditions, concrete test data, at least two executable steps with precise actions and expected results, clear verifiable checkpoints, and positive/negative behavior or relevant error handling. If the source Software Requirement has score 100, every derived E2E TestCase for that SR must be improved until it satisfies these 100-point criteria, then receive score 100 and no remaining quality issues.",
              languageRules: preserveSourceLanguageInstruction(),
              idRules:
                "Use this pattern: source SR SR_BAROLO_1.1.1 becomes E2E_BAROLO_1.1.1.1, E2E_BAROLO_1.1.1.2, and so on. Source SR SR-001.1 becomes E2E-001.1.1, E2E-001.1.2, and so on.",
              scoring:
                "Score 86-100. A score of 100 means excellent E2E TestCase quality and must be calculable from the returned structure, not merely asserted. Prefer scores from 95 to 100. Use 86-94 only when the source SR or acceptance criteria are incomplete and the remaining limitation cannot be resolved by better TestCase design. Never return a TestCase with score 85 or lower; improve the TestCase until it reaches at least 86. If the source SR has score 100, improve the derived E2E TestCase until it is complete enough to receive a calculable score of 100. Evaluate traceability to SR and PR, coverage of relevant acceptance criteria, precise preconditions, executable step quality, observable expected results, verifiable checkpoints, positive and negative scenario coverage, realistic preconditions and test data, independence, repeatability, automation suitability, clarity, and unambiguity.",
              requirements,
            }),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "e2e_testcases_derivation",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                e2eTests: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      sourceId: { type: "string" },
                      sourcePrId: { type: "string" },
                      id: { type: "string" },
                      group: { type: "string" },
                      description: { type: "string" },
                      coveredAcceptanceCriteria: {
                        type: "array",
                        items: { type: "string" },
                      },
                      preconditions: {
                        type: "array",
                        items: { type: "string" },
                      },
                      testData: {
                        type: "array",
                        items: { type: "string" },
                      },
                      steps: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: false,
                          properties: {
                            stepNumber: { type: "number" },
                            action: { type: "string" },
                            expectedResult: { type: "string" },
                          },
                          required: ["stepNumber", "action", "expectedResult"],
                        },
                      },
                      score: { type: "number", minimum: 86, maximum: 100 },
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
                      "sourceId",
                      "sourcePrId",
                      "id",
                      "group",
                      "description",
                      "coveredAcceptanceCriteria",
                      "preconditions",
                      "testData",
                      "steps",
                      "score",
                      "issues",
                      "rationale",
                    ],
                  },
                },
              },
              required: ["e2eTests"],
            },
          },
        },
        max_output_tokens: 20000,
      }),
    });
  } catch (error) {
    console.error("OpenAI E2E derivation failed:", error);
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
    const parsed = JSON.parse(outputText);
    enforceE2eScoreRules(parsed, requirements);
    sendJson(res, 200, {
      ...parsed,
      openAiUsage: buildOpenAiUsageSummary(payload),
    });
  } catch (error) {
    console.error("Could not parse OpenAI E2E output:", outputText, error);
    sendJson(res, 502, { error: "OpenAI returned invalid JSON." });
  }
}

async function handleE2eImprovement(sourceRequirement, testCase, improvementInstruction, improvementAttachments, res) {
  if (!sourceRequirement?.text || !testCase?.id) {
    sendJson(res, 400, { error: "Software Requirement and E2E TestCase are required." });
    return;
  }

  if (!improvementInstruction) {
    sendJson(res, 400, { error: "Improvement instruction is required." });
    return;
  }

  if (process.env.OPENAI_MOCK === "true") {
    const attachmentSuffix = improvementAttachments.length ? ` Anhänge berücksichtigt: ${improvementAttachments.map((item) => item.name).join(", ")}` : "";
    const improved = {
      ...testCase,
      description: `${testCase.description || testCase.text || "E2E TestCase"} Verbesserungsfokus: ${improvementInstruction}.${attachmentSuffix}`,
      preconditions: [
        ...(Array.isArray(testCase.preconditions) ? testCase.preconditions : []),
        "Alle benoetigten Testdaten, Berechtigungen und Systemdienste sind eindeutig vorbereitet.",
      ],
      steps: Array.isArray(testCase.steps) && testCase.steps.length
        ? testCase.steps
        : [
            {
              stepNumber: 1,
              action: "Fuehre den beschriebenen E2E Ablauf mit vorbereiteten Testdaten aus.",
              expectedResult: "Das erwartete Ergebnis ist beobachtbar, pruefbar und dem Akzeptanzkriterium eindeutig zugeordnet.",
            },
          ],
      score: Number(sourceRequirement.score) === 100 ? 100 : 96,
      issues: [],
      rationale: "Mock-Verbesserung anhand der angegebenen AI-Vorgabe.",
    };
    sendJson(res, 200, { e2eTest: improved });
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
              "You are a senior E2E test engineer. Improve an existing E2E TestCase according to the user's instruction. Return only valid JSON that matches the schema.",
          },
          {
            role: "user",
            content: JSON.stringify({
              task:
                "Improve the provided E2E TestCase while preserving its ID, source SR reference, source PR reference, and traceability. Apply the improvement instruction fully. The returned TestCase must be production-ready: precise preconditions, atomic executable actions, observable expected results, clear verifiable checkpoints, realistic test data, and direct coverage of the relevant acceptance criteria. If the instruction asks for additional coverage, split or enrich steps only within this TestCase when it remains coherent; otherwise improve clarity and completeness. Never return an issue asking for more precise preconditions, test steps, expected results, or checkpoints; fix the TestCase instead. Score 86-100, prefer 95-100. Assign score 100 only when the returned JSON objectively contains a specific description, group, source SR, source PR, covered acceptance criteria, concrete preconditions, concrete test data, at least two executable steps with precise actions and expected results, clear verifiable checkpoints, and positive/negative behavior or relevant error handling. If the source SR has score 100, improve the E2E TestCase until it satisfies these 100-point criteria, then return score 100 and no remaining quality issues.",
              languageRules: preserveSourceLanguageInstruction(),
              attachmentRules: attachmentInstruction(improvementAttachments),
              improvementInstruction,
              improvementAttachments,
              sourceRequirement,
              testCase,
            }),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "e2e_testcase_improvement",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                e2eTest: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    sourceId: { type: "string" },
                    sourcePrId: { type: "string" },
                    id: { type: "string" },
                    group: { type: "string" },
                    description: { type: "string" },
                    coveredAcceptanceCriteria: {
                      type: "array",
                      items: { type: "string" },
                    },
                    preconditions: {
                      type: "array",
                      items: { type: "string" },
                    },
                    testData: {
                      type: "array",
                      items: { type: "string" },
                    },
                    steps: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                          stepNumber: { type: "number" },
                          action: { type: "string" },
                          expectedResult: { type: "string" },
                        },
                        required: ["stepNumber", "action", "expectedResult"],
                      },
                    },
                    score: { type: "number", minimum: 86, maximum: 100 },
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
                    "sourceId",
                    "sourcePrId",
                    "id",
                    "group",
                    "description",
                    "coveredAcceptanceCriteria",
                    "preconditions",
                    "testData",
                    "steps",
                    "score",
                    "issues",
                    "rationale",
                  ],
                },
              },
              required: ["e2eTest"],
            },
          },
        },
        max_output_tokens: 12000,
      }),
    });
  } catch (error) {
    console.error("OpenAI E2E improvement failed:", error);
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
    const parsed = JSON.parse(outputText);
    enforceE2eScoreRules({ e2eTests: [parsed.e2eTest] }, [sourceRequirement]);
    sendJson(res, 200, {
      ...parsed,
      openAiUsage: buildOpenAiUsageSummary(payload),
    });
  } catch (error) {
    console.error("Could not parse OpenAI E2E improvement output:", outputText, error);
    sendJson(res, 502, { error: "OpenAI returned invalid JSON." });
  }
}

function cleanE2eTestCase(value) {
  const item = value && typeof value === "object" ? value : {};
  return {
    sourceId: String(item.sourceId || "").slice(0, 200),
    sourcePrId: String(item.sourcePrId || "").slice(0, 200),
    id: String(item.id || "").slice(0, 200),
    group: String(item.group || "").trim().slice(0, 500),
    description: String(item.description || item.text || "").trim().slice(0, 6000),
    coveredAcceptanceCriteria: Array.isArray(item.coveredAcceptanceCriteria)
      ? item.coveredAcceptanceCriteria.map((entry) => String(entry || "").trim().slice(0, 2000)).filter(Boolean)
      : [],
    preconditions: Array.isArray(item.preconditions)
      ? item.preconditions.map((entry) => String(entry || "").trim().slice(0, 2000)).filter(Boolean)
      : [],
    testData: Array.isArray(item.testData)
      ? item.testData.map((entry) => String(entry || "").trim().slice(0, 2000)).filter(Boolean)
      : [],
    steps: Array.isArray(item.steps)
      ? item.steps
          .map((step, index) => ({
            stepNumber: Number(step?.stepNumber) || index + 1,
            action: String(step?.action || step || "").trim().slice(0, 2000),
            expectedResult: String(step?.expectedResult || "").trim().slice(0, 2000),
          }))
          .filter((step) => step.action || step.expectedResult)
      : [],
    score: Number(item.score),
    issues: Array.isArray(item.issues) ? item.issues.slice(0, 20) : [],
    rationale: String(item.rationale || "").trim().slice(0, 3000),
  };
}

function cleanSoftwareRequirement(value) {
  const item = value && typeof value === "object" ? value : {};
  return {
    sourceRowNumber: Number(item.sourceRowNumber),
    sourceId: String(item.sourceId || "").slice(0, 200),
    id: String(item.id || "").slice(0, 200),
    text: String(item.text || "").trim().slice(0, 6000),
    happyFlow: String(item.happyFlow || "").trim().slice(0, 3000),
    alternativeFlows: Array.isArray(item.alternativeFlows)
      ? item.alternativeFlows.map((entry) => String(entry || "").trim().slice(0, 2000)).filter(Boolean)
      : [],
    exceptionFlows: Array.isArray(item.exceptionFlows)
      ? item.exceptionFlows.map((entry) => String(entry || "").trim().slice(0, 2000)).filter(Boolean)
      : [],
    acceptanceCriteria: Array.isArray(item.acceptanceCriteria)
      ? item.acceptanceCriteria.map((entry) => String(entry || "").trim().slice(0, 2000)).filter(Boolean)
      : [],
    score: Number(item.score),
    issues: Array.isArray(item.issues) ? item.issues.slice(0, 20) : [],
    rationale: String(item.rationale || "").trim().slice(0, 3000),
  };
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
  const tag = await readGitValue(["describe", "--tags", "--abbrev=0"]);
  const [description, commitsSinceTag, commit, branch, date, dirty] = await Promise.all([
    readGitValue(["describe", "--tags", "--always", "--dirty"]),
    tag ? readGitValue(["rev-list", "--count", `${tag}..HEAD`]) : "",
    readGitValue(["rev-parse", "--short", "HEAD"]),
    readGitValue(["branch", "--show-current"]),
    readGitValue(["log", "-1", "--format=%cI"]),
    readGitValue(["status", "--short"]),
  ]);
  const build = Number(commitsSinceTag);
  const formattedBuild = Number.isFinite(build) ? String(build).padStart(4, "0") : "0000";
  const appVersion = tag && Number.isFinite(build) ? `${tag}.${formattedBuild}` : description || commit || "Nicht verfuegbar";

  return {
    version: appVersion,
    tag: tag || "Nicht verfuegbar",
    build: formattedBuild,
    gitDescription: description || commit || "Nicht verfuegbar",
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

function buildOpenAiUsageSummary(payload) {
  const usage = payload?.usage || {};
  const inputTokens = Number(usage.input_tokens) || 0;
  const outputTokens = Number(usage.output_tokens) || 0;
  const totalTokens = Number(usage.total_tokens) || inputTokens + outputTokens;
  const cachedInputTokens = Number(usage.input_tokens_details?.cached_tokens) || 0;
  const reasoningOutputTokens = Number(usage.output_tokens_details?.reasoning_tokens) || 0;
  const uncachedInputTokens = Math.max(inputTokens - cachedInputTokens, 0);
  const inputUsdPer1m = envNumber("OPENAI_INPUT_USD_PER_1M_TOKENS");
  const cachedInputUsdPer1m = envNumber("OPENAI_CACHED_INPUT_USD_PER_1M_TOKENS");
  const outputUsdPer1m = envNumber("OPENAI_OUTPUT_USD_PER_1M_TOKENS");
  const pricingConfigured =
    Number.isFinite(inputUsdPer1m) || Number.isFinite(cachedInputUsdPer1m) || Number.isFinite(outputUsdPer1m);
  const inputUsd = (uncachedInputTokens / 1_000_000) * (Number.isFinite(inputUsdPer1m) ? inputUsdPer1m : 0);
  const cachedInputUsd =
    (cachedInputTokens / 1_000_000) * (Number.isFinite(cachedInputUsdPer1m) ? cachedInputUsdPer1m : Number.isFinite(inputUsdPer1m) ? inputUsdPer1m : 0);
  const outputUsd = (outputTokens / 1_000_000) * (Number.isFinite(outputUsdPer1m) ? outputUsdPer1m : 0);

  return {
    model: payload?.model || process.env.OPENAI_MODEL || "gpt-5.5",
    usage: {
      inputTokens,
      cachedInputTokens,
      outputTokens,
      reasoningOutputTokens,
      totalTokens,
    },
    cost: {
      currency: "USD",
      estimated: true,
      pricingConfigured,
      inputUsd,
      cachedInputUsd,
      outputUsd,
      totalUsd: inputUsd + cachedInputUsd + outputUsd,
    },
  };
}

function envNumber(name) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : NaN;
}

function mockAnalyzeRequirement(item) {
  const vagueWords = ["schnell", "einfach", "intuitiv", "angemessen", "performant"];
  const lower = item.text.toLowerCase();
  const detectedIssues = [];

  for (const word of vagueWords) {
    if (lower.includes(word)) {
      detectedIssues.push({
        criterion: "Eindeutigkeit",
        severity: "medium",
        explanation: `Der Begriff "${word}" ist ohne messbaren Grenzwert interpretierbar.`,
        suggestion: "Ergaenze eine konkrete Messgroesse, Zielwert und Messkontext.",
      });
    }
  }

  if (!lower.includes("wenn") && !lower.includes("falls") && !lower.includes("bei ")) {
    detectedIssues.push({
      criterion: "Vollstaendigkeit",
      severity: "low",
      explanation: "Der ausloesende Kontext oder die Bedingung ist nicht klar beschrieben.",
      suggestion: "Formuliere den relevanten Zustand, Nutzerkontext oder Trigger.",
    });
  }

  const rewrittenRequirement = detectedIssues.length
    ? `${item.text} Der relevante Nutzer- oder Geschaeftskontext, das erwartete Ergebnis und die messbare fachliche Zielsetzung sind so beschrieben, dass daraus spaeter konkrete Software Requirements ohne zusaetzliche Interpretation abgeleitet werden koennen.`
    : item.text;

  return {
    rowNumber: item.rowNumber,
    id: item.id,
    originalScore: Math.max(45, 90 - detectedIssues.length * 18),
    originalIssues: detectedIssues,
    score: 100,
    verdict: detectedIssues.length ? "Verbesserter Product-Requirement-Vorschlag ohne verbleibende Hinweise" : "Solide formuliert",
    issues: [],
    rewrittenRequirement,
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
  const sourceScore = Number(item.score);
  const score = sourceScore === 100 ? 100 : 90;
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
    score,
    issues: [],
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

function mockE2eTest(item, index) {
  const sourceId = item.id || `SR-${index + 1}`;
  const sourcePrId = item.sourceId || "";
  return {
    sourceId,
    sourcePrId,
    id: buildMockE2eTestId(sourceId, index),
    group: "E2E / Mock-Szenario",
    description: `Vollstaendigen Nutzerablauf fuer ${sourceId} pruefen`,
    text: `Vollstaendigen Nutzerablauf fuer ${sourceId} pruefen`,
    coveredAcceptanceCriteria: Array.isArray(item.acceptanceCriteria) && item.acceptanceCriteria.length
      ? item.acceptanceCriteria
      : ["Das erwartete Systemverhalten ist anhand des Software Requirements verifizierbar."],
    preconditions: [
      "Ein berechtigter Benutzer ist verfuegbar.",
      "Das System ist erreichbar und benoetigte Testdaten sind vorbereitet.",
    ],
    testData: [
      "Gueltige Eingaben fuer den Happy Path.",
      "Ungueltige oder fehlende Pflichtangaben fuer relevante Fehlerpruefungen.",
    ],
    steps: [
      {
        stepNumber: 1,
        action: "Benutzer startet den im Software Requirement beschriebenen Ablauf.",
        expectedResult: "Der Ablauf wird gestartet und die benoetigte Ausgangssituation ist sichtbar.",
      },
      {
        stepNumber: 2,
        action: "Benutzer fuehrt die benoetigten Eingaben und Aktionen aus.",
        expectedResult: "Das System verarbeitet die Eingaben und zeigt das erwartete Ergebnis nachvollziehbar an.",
      },
      {
        stepNumber: 3,
        action: "Benutzer fuehrt eine ungueltige oder nicht verfuegbare Variante aus, sofern diese fachlich relevant ist.",
        expectedResult: "Das System behandelt den negativen Fall kontrolliert und zeigt keine widerspruechlichen Ergebnisse.",
      },
    ],
    score: 91,
    issues: [],
    rationale: `Abgeleitet aus dem finalen Software Requirement: ${item.text.slice(0, 180)}`,
  };
}

function buildMockE2eTestId(sourceId, index) {
  const suffix = ".1";
  if (/^SR(?=[_-])/i.test(sourceId)) {
    return `${sourceId.replace(/^SR/i, "E2E")}${suffix}`;
  }

  if (/^SR\b/i.test(sourceId)) {
    return `${sourceId.replace(/^SR/i, "E2E")}${suffix}`;
  }

  return `E2E-${String(index + 1).padStart(3, "0")}${suffix}`;
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
