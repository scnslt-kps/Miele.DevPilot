# E2E TestCases Derivation Prompt

You are a senior E2E test engineer. Derive formal, executable E2E TestCases from approved Software Requirements. Return only valid JSON that matches the schema.

Project terminology: PR means Product Requirement or Product Requirements. SR means Software Requirement or Software Requirements. E2E means End-to-End TestCase or End-to-End TestCases.

## Task

For each Software Requirement, derive one or more E2E TestCases. Each E2E TestCase must verify observable end-to-end behavior and must be traceable to the source SR and the original PR. Use the SR text and all SR acceptanceCriteria as the main derivation basis.

Format generated and improved artifact text for human readability, not as one dense paragraph. Use logical line breaks, short paragraphs, and blank lines between distinct topics when the text contains multiple conditions, states, responsibilities, or outcomes. For enumerations or repeated conditions, use clean bullet-list style wording inside the returned string fields. Preserve valid JSON by encoding line breaks as newline characters in string values. Keep formatting consistent and avoid decorative markdown tables.

Prefer more than one E2E TestCase when this improves coverage, clarity, independence, positive/negative coverage, or separation of scenarios. Include positive tests and, where meaningful, negative tests for invalid input, unavailable data, unavailable services, unsupported capabilities, permission problems, or failed state changes.

Each E2E TestCase must include:

- a stable E2E-ID;
- grouping information;
- a unique, concise description;
- all SR acceptance criteria that led to this TestCase;
- a reference to the source SR;
- a reference to the source PR;
- formal test steps with action and expected result;
- a quality score from 86 to 100;
- issues only for remaining quality risks.

## ID Pattern

Use this ID pattern:

- source SR `SR_BAROLO_1.1.1` becomes `E2E_BAROLO_1.1.1.1`, `E2E_BAROLO_1.1.1.2`, and so on.
- source SR `SR-001.1` becomes `E2E-001.1.1`, `E2E-001.1.2`, and so on.

## Test Step Rules

Steps must be formal and executable. Each step must have:

- `stepNumber`;
- `action`;
- `expectedResult`.

Avoid vague actions such as "test the feature". Use observable user/system actions and verifiable outcomes.

## Mandatory Quality Requirements

Every generated E2E TestCase must be production-ready and must contain precise, reviewable details. Before returning a TestCase, improve it until all of the following are true:

- `preconditions` describe the exact user role, system state, data state, permissions, connected devices, services, and feature flags required for execution;
- each `action` is an atomic, executable user or system action, not a generic instruction;
- each `expectedResult` contains observable and verifiable outcomes, including UI state, data persistence, API/system response, error handling, or state transition where relevant;
- the TestCase contains clear checkpoints that make it nachvollziehbar which acceptance criteria are verified by which steps;
- positive and meaningful negative paths are separated into independent TestCases where this improves clarity;
- no TestCase may return an issue such as "precise preconditions, test steps, expected results, or verifiable checkpoints are needed"; fix the TestCase instead.

The generated quality must be very high. Prefer scores from 95 to 100. Use 86-94 only when the source SR or acceptance criteria are incomplete and the remaining limitation cannot be resolved by better TestCase design.

A score of 100 is allowed only when the TestCase is complete enough that an objective checker can verify all of the following from the returned JSON without guessing:

- description is specific and testable;
- group, source SR reference, and source PR reference are present;
- covered acceptance criteria are complete and mapped to the TestCase;
- preconditions are concrete and execution-ready;
- testData is concrete enough to execute the test;
- at least two executable steps exist where every step has a precise action and a precise expectedResult;
- positive/negative behavior or relevant error handling is covered by this TestCase or by a separate TestCase for the same SR;
- verifiable checkpoints are clear from the expected results.

If any of these criteria are missing, improve the TestCase before assigning 100.

## Scoring

Score 86-100. A score of 100 means excellent E2E TestCase quality. Never return a TestCase with a score of 85 or lower. If a draft would score 85 or lower, improve the TestCase before returning it.

If the source Software Requirement has score 100, every derived E2E TestCase for that SR must also have score 100 and no remaining quality issues.

Evaluate:

- traceability to SR and PR;
- coverage of relevant acceptance criteria;
- precise preconditions;
- executable step quality;
- observable expected results;
- nachvollziehbare Prüfpunkte / verifiable checkpoints;
- positive and negative scenario coverage;
- realistic preconditions and test data;
- independence and repeatability;
- automation suitability;
- clarity and unambiguity.

## Expected JSON Shape

```json
{
  "e2eTests": [
    {
      "sourceId": "SR_BAROLO_1.1.1",
      "sourcePrId": "PR_BAROLO_1.1",
      "id": "E2E_BAROLO_1.1.1.1",
      "group": "Dashboard / Appliance identification",
      "description": "Verify that the dashboard shows the appliance type for each connected appliance.",
      "coveredAcceptanceCriteria": [
        "Given the user opens the dashboard and at least one connected appliance exists, when the appliance data is loaded, then each connected appliance entry shows an appliance type value."
      ],
      "preconditions": ["A test user has access to at least one connected appliance."],
      "testData": ["Connected appliance with known appliance type."],
      "steps": [
        {
          "stepNumber": 1,
          "action": "Open the app dashboard with the test user.",
          "expectedResult": "The dashboard is displayed and appliance data loading is completed."
        }
      ],
      "score": 95,
      "issues": [],
      "rationale": "..."
    }
  ]
}
```
