export const PRODUCT_REQUIREMENT_QUALITY_CRITERIA = Object.freeze([
  {
    id: "clarity",
    name: "Clarity and understandability",
    description: "The requirement is understandable without avoidable interpretation effort.",
    fulfillmentConditions: [
      "Uses clear Product Requirement wording at business or user-need level.",
      "Identifies the relevant actor, stakeholder, system area, component, or business object where known.",
      "Avoids vague references such as this, it, appropriate, user-friendly, fast, intuitive, or similar unless they are concretely bounded.",
    ],
    maxPoints: 12,
    allowedExceptions: [
      "A Product Requirement may stay solution-neutral and does not need implementation-level component names.",
      "Unknown domain facts must be marked as open information instead of being invented.",
    ],
    aiOptimizationInstruction:
      "Rewrite ambiguous phrases into explicit Product Requirement wording. Preserve the product-level intent and make the actor, context, and expected outcome easy to understand.",
    scoreRule: "Deduct points for vague wording, unclear references, missing actor/context, or wording that needs avoidable interpretation.",
    languageDependencies: "Apply the target/source language consistently; keep technical IDs and product names unchanged.",
  },
  {
    id: "completeness",
    name: "Completeness of product-level intent",
    description: "The requirement contains enough information to derive Software Requirements later.",
    fulfillmentConditions: [
      "States the business or user need, relevant context or trigger, expected outcome, and important constraints when available.",
      "Preserves provided metadata such as IDs, category, subcategory, TechTypes, source IDs, or appliance applicability.",
      "Keeps known conditions and restrictions visible instead of hiding them in generic wording.",
    ],
    maxPoints: 14,
    allowedExceptions: [
      "Do not invent missing thresholds, interfaces, target platforms, response times, responsibilities, or error behavior.",
      "When mandatory domain information is missing, include a clearly marked open point or question if the format allows it.",
    ],
    aiOptimizationInstruction:
      "Add missing context only when it is explicitly present or safely inferable from the provided requirement, metadata, attachments, or analysis findings. Mark unresolved domain gaps as open points.",
    scoreRule: "Deduct points for missing context, outcome, relevant constraints, metadata use, or unresolved domain gaps that are not made visible.",
    languageDependencies: "Open points and user-facing issue explanations must use the requested UI language.",
  },
  {
    id: "testability",
    name: "Testability and verifiability",
    description: "The requirement can later be checked by derived Software Requirements and tests.",
    fulfillmentConditions: [
      "Describes observable or verifiable behavior, outcome, state, data, or business effect.",
      "Avoids purely subjective goals unless they are tied to measurable or externally checkable conditions.",
      "Provides enough basis for later acceptance criteria without embedding Given/When/Then blocks or test steps in the Product Requirement.",
    ],
    maxPoints: 13,
    allowedExceptions: [
      "Product Requirements must not be converted into Software Requirements or detailed test cases.",
      "If measurement data is unknown, expose the missing measurement as an open point instead of fabricating it.",
    ],
    aiOptimizationInstruction:
      "Make the expected result observable and verifiable at Product Requirement level. Keep acceptance criteria, test steps, and Given/When/Then out of Product Requirements.",
    scoreRule: "Deduct points when the outcome cannot be verified, is purely subjective, or lacks any observable result.",
    languageDependencies: "Measurement terms and open questions must be understandable in the artifact language.",
  },
  {
    id: "measurability",
    name: "Measurability and precision",
    description: "The requirement contains concrete, bounded wording where the source context supports it.",
    fulfillmentConditions: [
      "Uses concrete quantities, limits, frequencies, states, data scopes, or conditions when they are known.",
      "Replaces unbounded adjectives with precise descriptions or flagged open points.",
      "Keeps units, numbers, and domain terms consistent with the source material.",
    ],
    maxPoints: 11,
    allowedExceptions: [
      "A missing numeric threshold may remain open if it is not provided in the source context.",
      "Do not add artificial numbers only to improve the score.",
    ],
    aiOptimizationInstruction:
      "Use provided numbers, units, limits, and conditions precisely. If a needed value is missing, state the missing information explicitly instead of inventing it.",
    scoreRule: "Deduct points for unbounded quality terms, missing measurable conditions, invented precision, or inconsistent units.",
    languageDependencies: "Preserve decimal formats, units, IDs, and product terminology exactly as provided.",
  },
  {
    id: "atomicity",
    name: "Atomicity and focus",
    description: "The requirement has a coherent scope and does not mix unrelated independent needs.",
    fulfillmentConditions: [
      "Keeps one coherent business/user goal or product capability per requirement.",
      "Separates independent conditions, variants, or outcomes with clear structure when they belong together.",
      "Avoids mixing multiple unrelated features, actors, or approval decisions in one dense sentence.",
    ],
    maxPoints: 11,
    allowedExceptions: [
      "A Product Requirement may include closely related conditions or constraints when they define one coherent product need.",
      "Do not split the persisted item into multiple requirements unless the surrounding workflow explicitly supports that.",
    ],
    aiOptimizationInstruction:
      "Make the requirement focused and structured. If multiple related aspects remain in one requirement, use clear paragraphs or bullets without turning them into acceptance criteria.",
    scoreRule: "Deduct points for overloaded, multi-goal, or hard-to-derive requirements.",
    languageDependencies: "Keep list and paragraph structure readable in the artifact language.",
  },
  {
    id: "consistency",
    name: "Consistency and contradiction freedom",
    description: "The requirement does not contradict itself, metadata, or provided context.",
    fulfillmentConditions: [
      "Uses terminology consistently with the original requirement, metadata, attachments, and neighboring domain concepts.",
      "Does not introduce conflicting states, actors, values, or responsibilities.",
      "Preserves traceability to the source Product Requirement.",
    ],
    maxPoints: 10,
    allowedExceptions: [
      "If the provided context is contradictory, flag the contradiction instead of silently resolving it.",
      "Do not normalize product names, IDs, or TechTypes into different terms.",
    ],
    aiOptimizationInstruction:
      "Preserve source terminology and resolve only wording-level inconsistencies. Mark factual contradictions as open issues.",
    scoreRule: "Deduct points for contradictory statements, terminology drift, lost traceability, or metadata conflicts.",
    languageDependencies: "Technical identifiers, appliance names, and acronyms are language-independent and must remain unchanged.",
  },
  {
    id: "solution_neutrality",
    name: "Solution neutrality",
    description: "The Product Requirement states the need and outcome without unnecessary implementation design.",
    fulfillmentConditions: [
      "Describes what business/user outcome is needed, not how software must technically implement it.",
      "Avoids unnecessary UI, database, API, algorithm, architecture, or vendor decisions.",
      "Keeps implementation details only when they are explicitly part of the source requirement or domain constraint.",
    ],
    maxPoints: 10,
    allowedExceptions: [
      "Existing source-mandated interfaces, appliances, legal constraints, or platform constraints may be retained.",
      "Do not erase domain constraints merely because they look technical.",
    ],
    aiOptimizationInstruction:
      "Remove unjustified design decisions while preserving explicit domain constraints and product scope.",
    scoreRule: "Deduct points for premature design, invented interfaces, or conversion into a Software Requirement.",
    languageDependencies: "No special language dependency beyond preserving technical terms.",
  },
  {
    id: "feasibility",
    name: "Feasibility and realism",
    description: "The requirement is realistic and bounded enough for later implementation analysis.",
    fulfillmentConditions: [
      "Avoids absolute or impossible claims unless explicitly required.",
      "States relevant constraints, dependencies, or operational boundaries when known.",
      "Does not demand undefined universal behavior across all products, users, devices, or situations.",
    ],
    maxPoints: 8,
    allowedExceptions: [
      "Feasibility may remain partially open when product strategy or domain decisions are missing.",
      "Flag missing feasibility assumptions rather than inventing them.",
    ],
    aiOptimizationInstruction:
      "Bound the requirement to the provided scope and make feasibility-relevant open assumptions visible.",
    scoreRule: "Deduct points for unrealistic, absolute, or unbounded demands and hidden feasibility assumptions.",
    languageDependencies: "Use neutral wording in the selected language for assumptions and open points.",
  },
  {
    id: "format_and_semantic_structure",
    name: "Readable semantic structure",
    description: "The text is structured so reviewers can scan context, need, conditions, and outcome.",
    fulfillmentConditions: [
      "Uses short paragraphs, meaningful line breaks, or bullet lists for related conditions.",
      "Keeps the generated Product Requirement directly usable without explanatory prefaces or self-review text.",
      "Does not write a claimed score, self-assessment, or quality report into the requirement text.",
    ],
    maxPoints: 11,
    allowedExceptions: [
      "A short single paragraph is acceptable for genuinely simple, atomic requirements.",
      "Open points may be listed when domain facts are missing and the workflow allows them.",
    ],
    aiOptimizationInstruction:
      "Produce only the optimized Product Requirement content. Use readable semantic formatting, but do not include a score claim, explanation, or quality self-assessment in the requirement text.",
    scoreRule: "Deduct points for dense unreadable text, decorative formatting, missing semantic structure, or embedded self-scoring.",
    languageDependencies: "Formatting is language-neutral; visible text must follow the target/source language rule.",
  },
]);

export const PRODUCT_REQUIREMENT_QUALITY_CRITERIA_MAX_POINTS = Object.freeze(
  PRODUCT_REQUIREMENT_QUALITY_CRITERIA.reduce((criteria, criterion) => ({
    ...criteria,
    [criterion.id]: criterion.maxPoints,
  }), {}),
);

export const PRODUCT_REQUIREMENT_QUALITY_MAX_SCORE = PRODUCT_REQUIREMENT_QUALITY_CRITERIA.reduce(
  (sum, criterion) => sum + criterion.maxPoints,
  0,
);

if (PRODUCT_REQUIREMENT_QUALITY_MAX_SCORE !== 100) {
  throw new Error(`Product Requirement quality criteria must add up to 100, got ${PRODUCT_REQUIREMENT_QUALITY_MAX_SCORE}.`);
}

export function productRequirementQualityDefinition({ uiLanguage = "de" } = {}) {
  return {
    artifactType: "Product Requirement",
    scoringScale: "0-100",
    maximumScore: PRODUCT_REQUIREMENT_QUALITY_MAX_SCORE,
    targetScoreInstruction:
      "The generation and improvement target is content that is expected to receive 100 after independent scoring. Never set, assume, persist, or claim a score of 100 without scoring the actual returned content.",
    hallucinationRule:
      "Missing product facts must not be invented. Improve wording and structure where possible; mark missing domain information as open points or questions when it blocks reliable completion.",
    language: uiLanguage,
    criteria: PRODUCT_REQUIREMENT_QUALITY_CRITERIA,
  };
}

export function productRequirementQualityPromptContext({ uiLanguage = "de" } = {}) {
  const definition = productRequirementQualityDefinition({ uiLanguage });
  return {
    ...definition,
    scoringInstructions: [
      "Evaluate every criterion independently using its scoreRule and maxPoints.",
      "Return originalScoreBreakdown for the original input and scoreBreakdown for the returned rewrittenRequirement. Each object must include one entry for every criterion id with achieved points and maxPoints.",
      "originalScore must be the exact sum of originalScoreBreakdown points.",
      "The total score must be the exact sum of all scoreBreakdown points.",
      "The stored score is only the result of the regular quality assessment of the actual final Product Requirement text.",
      "Do not copy any predicted score from generation, improvement, or qualityCheck fields into the binding score.",
      "A score of 100 is valid only when the actual text fully satisfies all listed criteria and has no remaining issues.",
      "If missing domain information prevents a reliable 100-point result, score the actual text lower and report the missing information as issues.",
    ],
    generationInstructions: [
      "Understand the original Product Requirement and provided metadata.",
      "Apply every criterion from this definition before returning the rewrittenRequirement.",
      "Fix all wording, structure, ambiguity, atomicity, consistency, measurability, and testability gaps that can be fixed from context.",
      "Preserve already correct content and do not lose provided domain facts.",
      "Use neutral open points for missing facts when required; do not invent thresholds, interfaces, responsibilities, platforms, or product behavior.",
      "Return only the optimized Product Requirement content in rewrittenRequirement, not explanations or score claims.",
    ],
    internalSelfCheckProcess: [
      "Draft the Product Requirement.",
      "Check the draft against every criterion id in order.",
      "Revise the draft for each criterion that is not fully satisfied.",
      "Check the complete revised draft again.",
      "Only then return the optimized content and structured issue metadata.",
    ],
  };
}

export function productRequirementStructuredOutputSchemaExtension() {
  return {
    resolvedIssueKeys: {
      type: "array",
      items: { type: "string" },
    },
    remainingIssueKeys: {
      type: "array",
      items: { type: "string" },
    },
    missingInformation: {
      type: "array",
      items: { type: "string" },
    },
    assumptions: {
      type: "array",
      items: { type: "string" },
    },
    qualityCheck: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          criterionId: { type: "string" },
          status: { type: "string", enum: ["fulfilled", "partial", "missing", "not_applicable"] },
          note: { type: "string" },
        },
        required: ["criterionId", "status", "note"],
      },
    },
    scoreBreakdown: scoreBreakdownJsonSchema(),
  };
}

export function scoreBreakdownJsonSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: PRODUCT_REQUIREMENT_QUALITY_CRITERIA.reduce((properties, criterion) => {
      properties[criterion.id] = {
        type: "object",
        additionalProperties: false,
        properties: {
          points: { type: "number" },
          maxPoints: { type: "number" },
        },
        required: ["points", "maxPoints"],
      };
      return properties;
    }, {}),
    required: PRODUCT_REQUIREMENT_QUALITY_CRITERIA.map((criterion) => criterion.id),
  };
}

export function normalizeProductRequirementScoreBreakdown(scoreBreakdown) {
  if (!scoreBreakdown || typeof scoreBreakdown !== "object" || Array.isArray(scoreBreakdown)) return null;

  const normalized = {};
  for (const criterion of PRODUCT_REQUIREMENT_QUALITY_CRITERIA) {
    const entry = scoreBreakdown[criterion.id];
    const points = Number(entry?.points);
    const maxPoints = Number(entry?.maxPoints);
    if (!Number.isFinite(points) || !Number.isFinite(maxPoints)) return null;
    normalized[criterion.id] = {
      points,
      maxPoints,
    };
  }
  return normalized;
}

export function validateProductRequirementScoreBreakdown(scoreBreakdown, totalScore) {
  const normalized = normalizeProductRequirementScoreBreakdown(scoreBreakdown);
  if (!normalized) {
    throw new Error("Score breakdown is missing or incomplete.");
  }

  let sum = 0;
  for (const criterion of PRODUCT_REQUIREMENT_QUALITY_CRITERIA) {
    const entry = normalized[criterion.id];
    if (entry.maxPoints !== criterion.maxPoints) {
      throw new Error(`Score breakdown maxPoints for ${criterion.id} must be ${criterion.maxPoints}.`);
    }
    if (entry.points < 0) {
      throw new Error(`Score breakdown points for ${criterion.id} must not be negative.`);
    }
    if (entry.points > criterion.maxPoints) {
      throw new Error(`Score breakdown points for ${criterion.id} must not exceed ${criterion.maxPoints}.`);
    }
    sum += entry.points;
  }

  const numericTotalScore = Number(totalScore);
  if (!Number.isFinite(numericTotalScore) || numericTotalScore < 0 || numericTotalScore > PRODUCT_REQUIREMENT_QUALITY_MAX_SCORE) {
    throw new Error("Score must be a number between 0 and 100.");
  }
  if (Math.abs(sum - numericTotalScore) > Number.EPSILON) {
    throw new Error(`Score breakdown total ${sum} does not match score ${numericTotalScore}.`);
  }

  return normalized;
}

export function normalizeProductRequirementQualityResult(result = {}) {
  const originalScoreBreakdown = normalizeProductRequirementScoreBreakdown(result.originalScoreBreakdown);
  const scoreBreakdown = normalizeProductRequirementScoreBreakdown(result.scoreBreakdown);
  return {
    ...result,
    resolvedIssueKeys: Array.isArray(result.resolvedIssueKeys) ? result.resolvedIssueKeys.map(String) : [],
    remainingIssueKeys: Array.isArray(result.remainingIssueKeys) ? result.remainingIssueKeys.map(String) : [],
    missingInformation: Array.isArray(result.missingInformation) ? result.missingInformation.map(String) : [],
    assumptions: Array.isArray(result.assumptions) ? result.assumptions.map(String) : [],
    qualityCheck: Array.isArray(result.qualityCheck)
      ? result.qualityCheck.map((item) => ({
          criterionId: String(item?.criterionId || ""),
          status: ["fulfilled", "partial", "missing", "not_applicable"].includes(item?.status) ? item.status : "partial",
          note: String(item?.note || ""),
        })).filter((item) => item.criterionId)
      : [],
    ...(originalScoreBreakdown ? { originalScoreBreakdown } : {}),
    ...(scoreBreakdown ? { scoreBreakdown } : {}),
  };
}

export function assessProductRequirementQuality(text) {
  const source = String(text || "");
  const normalized = source.toLowerCase();
  const issues = [];
  const addIssue = (criterion, severity, explanation, suggestion) => {
    issues.push({ criterion, severity, explanation, suggestion });
  };

  if (source.trim().length < 80) {
    addIssue(
      "completeness",
      "medium",
      "Der Requirement-Text ist fuer eine belastbare Ableitung noch zu knapp.",
      "Ergaenze Kontext, erwartetes Ergebnis, bekannte Bedingungen und relevante Einschraenkungen.",
    );
  }

  if (!/(muss|shall|should|soll)/i.test(source)) {
    addIssue(
      "clarity",
      "medium",
      "Die verbindliche Anforderung ist sprachlich nicht eindeutig markiert.",
      "Formuliere die Anforderung mit muss, soll oder shall.",
    );
  }

  if (!/(wenn|falls|bei |after|before|during|when|if)/i.test(source)) {
    addIssue(
      "completeness",
      "low",
      "Der ausloesende Kontext oder die Bedingung ist nicht klar beschrieben.",
      "Beschreibe den relevanten Nutzerkontext, Zustand oder Trigger.",
    );
  }

  if (!/(mindestens|maximal|innerhalb|prozent|%|\d+|measur|within|minimum|maximum|at least|no more than)/i.test(source)) {
    addIssue(
      "measurability",
      "low",
      "Ein messbarer Zielwert, Rahmen oder pruefbarer Zustand fehlt.",
      "Nutze bekannte Messgroessen, Zielwerte, Zustaende oder markiere fehlende Werte als offene Information.",
    );
  }

  if (/(schnell|einfach|intuitiv|angemessen|performant|user-friendly|fast|simple|appropriate|intuitive)/i.test(source)) {
    addIssue(
      "clarity",
      "medium",
      "Der Text enthaelt unbestimmte oder subjektive Begriffe.",
      "Ersetze unbestimmte Begriffe durch konkrete, aus dem Kontext ableitbare Bedingungen.",
    );
  }

  if (/(api|database|sql|react|frontend|backend|algorithmus|algorithm|endpoint)/i.test(source) && !/(vorgegeben|provided|existing|schnittstelle|interface)/i.test(source)) {
    addIssue(
      "solution_neutrality",
      "low",
      "Der Text kann unnoetige Implementierungsdetails enthalten.",
      "Formuliere den Bedarf loesungsneutral, sofern diese technischen Details nicht fachlich vorgegeben sind.",
    );
  }

  const scoreBreakdown = calculateProductRequirementScoreBreakdown(issues);
  return {
    score: Object.values(scoreBreakdown).reduce((sum, entry) => sum + entry.points, 0),
    verdict: issues.length ? "Finale Bewertung mit offenen Hinweisen" : "Finaler Text erfuellt die Qualitaetskriterien",
    issues,
    scoreBreakdown,
  };
}

function calculateProductRequirementScoreBreakdown(issues) {
  const breakdown = {};
  for (const criterion of PRODUCT_REQUIREMENT_QUALITY_CRITERIA) {
    breakdown[criterion.id] = {
      points: criterion.maxPoints,
      maxPoints: criterion.maxPoints,
    };
  }

  for (const issue of issues) {
    const entry = breakdown[issue.criterion];
    if (!entry) continue;
    const deduction = issue.severity === "high" ? 5 : issue.severity === "medium" ? 3 : 2;
    entry.points = Math.max(0, entry.points - deduction);
  }

  return breakdown;
}
