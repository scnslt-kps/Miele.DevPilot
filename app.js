const state = {
  workbook: null,
  sheetName: "",
  rows: [],
  headers: [],
  requirements: [],
  results: [],
  softwareRequirements: [],
  softwareSelections: new Map(),
  e2eTests: [],
  e2eSelections: new Map(),
  finalSelections: new Map(),
  finalScoreUpdates: new Set(),
  activeSelectionRow: null,
  activeSoftwareRequirementId: "",
  activeE2eTestId: "",
  analysisComplete: false,
  generatedIds: false,
  requirementType: "product",
  activeProcessStep: "product",
  aboutOpen: false,
  productWindchillTransferComplete: false,
  productWindchillTransferredAt: "",
  softwareWindchillTransferComplete: false,
  softwareWindchillTransferredAt: "",
  runtimeInfo: null,
  runtimeMock: false,
  openAiCostSummary: null,
  scoreFilterActive: false,
  softwareScoreFilterActive: false,
  e2eScoreFilterActive: false,
  sourceFileName: "",
  projectName: "",
  projectDescription: "",
  projectFileHandle: null,
  projectFileName: "",
};

const PROJECT_FILE_TYPE = "miele-devpilot-project";
const PROJECT_FILE_VERSION = 1;
const ANALYSIS_BATCH_SIZE = 5;
const PRODUCT_STEP_MIN_SCORE = 85;
const LOCAL_SERVER_APP_URL = "http://localhost:3000/Miele.DevPilot/";
const PROCESS_STEP_DEPENDENCIES = {
  product: null,
  software: "product",
  e2e: "software",
  usecase: "software",
  userstory: "usecase",
  "app-test": "usecase",
};
const PROCESS_STEP_LABELS = {
  product: "Product Requirement",
  software: "Software Requirement",
  e2e: "E2E TestCases",
  usecase: "UseCase",
  userstory: "UserStory",
  "app-test": "App TestCase",
};

const els = {
  fileInput: document.querySelector("#fileInput"),
  projectInput: document.querySelector("#projectInput"),
  newProjectButton: document.querySelector("#newProjectButton"),
  openFileButton: document.querySelector("#openFileButton"),
  openProjectButton: document.querySelector("#openProjectButton"),
  saveProjectButton: document.querySelector("#saveProjectButton"),
  saveProjectAsButton: document.querySelector("#saveProjectAsButton"),
  aboutButton: document.querySelector("#aboutButton"),
  closeAboutButton: document.querySelector("#closeAboutButton"),
  aboutVersion: document.querySelector("#aboutVersion"),
  aboutBuild: document.querySelector("#aboutBuild"),
  aboutBuildDate: document.querySelector("#aboutBuildDate"),
  aboutRuntimePath: document.querySelector("#aboutRuntimePath"),
  openAiCostTotal: document.querySelector("#openAiCostTotal"),
  openAiCostDetail: document.querySelector("#openAiCostDetail"),
  openSettingsButton: document.querySelector("#openSettingsButton"),
  fileState: document.querySelector("#fileState"),
  requirementType: document.querySelector("#requirementType"),
  sheetSelect: document.querySelector("#sheetSelect"),
  headerRow: document.querySelector("#headerRow"),
  categoryColumn: document.querySelector("#categoryColumn"),
  subcategoryColumn: document.querySelector("#subcategoryColumn"),
  nameColumn: document.querySelector("#nameColumn"),
  requirementColumn: document.querySelector("#requirementColumn"),
  idColumn: document.querySelector("#idColumn"),
  idFieldRow: document.querySelector("#idFieldRow"),
  autoIdGroup: document.querySelector("#autoIdGroup"),
  idPrefix: document.querySelector("#idPrefix"),
  analyzeButton: document.querySelector("#analyzeButton"),
  generateSoftwareButton: document.querySelector("#generateSoftwareButton"),
  generateSoftwareMenuButton: document.querySelector("#generateSoftwareMenuButton"),
  generateE2eButton: document.querySelector("#generateE2eButton"),
  generateE2eMenuButton: document.querySelector("#generateE2eMenuButton"),
  exportButton: document.querySelector("#exportButton"),
  settingsOverlay: document.querySelector("#settingsOverlay"),
  settingsCloseButton: document.querySelector("#settingsCloseButton"),
  settingsDoneButton: document.querySelector("#settingsDoneButton"),
  projectOverlay: document.querySelector("#projectOverlay"),
  projectCloseButton: document.querySelector("#projectCloseButton"),
  projectCancelButton: document.querySelector("#projectCancelButton"),
  projectCreateButton: document.querySelector("#projectCreateButton"),
  projectName: document.querySelector("#projectName"),
  projectDescription: document.querySelector("#projectDescription"),
  resultsTable: document.querySelector("#resultsTable"),
  resultsBody: document.querySelector("#resultsBody"),
  softwareRequirementsBody: document.querySelector("#softwareRequirementsBody"),
  softwareDerivedMetric: document.querySelector("#softwareDerivedMetric"),
  softwareScoreMetric: document.querySelector("#softwareScoreMetric"),
  softwareIssueMetric: document.querySelector("#softwareIssueMetric"),
  criticalSoftwareIssuesButton: document.querySelector("#criticalSoftwareIssuesButton"),
  softwareTransferBar: document.querySelector("#softwareTransferBar"),
  softwareTransferTitle: document.querySelector("#softwareTransferTitle"),
  softwareTransferText: document.querySelector("#softwareTransferText"),
  softwareTransferButton: document.querySelector("#softwareTransferButton"),
  softwareScoreFilterBar: document.querySelector("#softwareScoreFilterBar"),
  clearSoftwareScoreFilterButton: document.querySelector("#clearSoftwareScoreFilterButton"),
  softwareSelectionOverlay: document.querySelector("#softwareSelectionOverlay"),
  softwareSelectionCloseButton: document.querySelector("#softwareSelectionCloseButton"),
  softwareSelectionDeferButton: document.querySelector("#softwareSelectionDeferButton"),
  softwareSelectionExcludeButton: document.querySelector("#softwareSelectionExcludeButton"),
  softwareSelectionAcceptButton: document.querySelector("#softwareSelectionAcceptButton"),
  softwareSelectionId: document.querySelector("#softwareSelectionId"),
  softwareSelectionSource: document.querySelector("#softwareSelectionSource"),
  softwareSelectionScore: document.querySelector("#softwareSelectionScore"),
  softwareSelectionText: document.querySelector("#softwareSelectionText"),
  softwareSelectionIssues: document.querySelector("#softwareSelectionIssues"),
  e2eTestsBody: document.querySelector("#e2eTestsBody"),
  e2eDerivedMetric: document.querySelector("#e2eDerivedMetric"),
  e2eScoreMetric: document.querySelector("#e2eScoreMetric"),
  e2eIssueMetric: document.querySelector("#e2eIssueMetric"),
  criticalE2eIssuesButton: document.querySelector("#criticalE2eIssuesButton"),
  e2eScoreFilterBar: document.querySelector("#e2eScoreFilterBar"),
  clearE2eScoreFilterButton: document.querySelector("#clearE2eScoreFilterButton"),
  e2eSelectionOverlay: document.querySelector("#e2eSelectionOverlay"),
  e2eSelectionCloseButton: document.querySelector("#e2eSelectionCloseButton"),
  e2eSelectionDeferButton: document.querySelector("#e2eSelectionDeferButton"),
  e2eSelectionExcludeButton: document.querySelector("#e2eSelectionExcludeButton"),
  e2eSelectionAcceptButton: document.querySelector("#e2eSelectionAcceptButton"),
  e2eSelectionId: document.querySelector("#e2eSelectionId"),
  e2eSelectionSource: document.querySelector("#e2eSelectionSource"),
  e2eSelectionScore: document.querySelector("#e2eSelectionScore"),
  e2eSelectionText: document.querySelector("#e2eSelectionText"),
  e2eSelectionIssues: document.querySelector("#e2eSelectionIssues"),
  selectionOverlay: document.querySelector("#selectionOverlay"),
  selectionCloseButton: document.querySelector("#selectionCloseButton"),
  selectionDeferButton: document.querySelector("#selectionDeferButton"),
  excludeRequirementButton: document.querySelector("#excludeRequirementButton"),
  selectOriginalButton: document.querySelector("#selectOriginalButton"),
  selectEditedOriginalButton: document.querySelector("#selectEditedOriginalButton"),
  resetOriginalTextButton: document.querySelector("#resetOriginalTextButton"),
  selectAiButton: document.querySelector("#selectAiButton"),
  selectionId: document.querySelector("#selectionId"),
  selectionName: document.querySelector("#selectionName"),
  selectionGroup: document.querySelector("#selectionGroup"),
  selectionScore: document.querySelector("#selectionScore"),
  selectionOriginalText: document.querySelector("#selectionOriginalText"),
  selectionAiText: document.querySelector("#selectionAiText"),
  selectionIssues: document.querySelector("#selectionIssues"),
  statusPill: document.querySelector("#statusPill"),
  projectHeaderName: document.querySelector("#projectHeaderName"),
  projectHeaderDescription: document.querySelector("#projectHeaderDescription"),
  countMetricLabel: document.querySelector("#countMetricLabel"),
  countMetric: document.querySelector("#countMetric"),
  scoreMetric: document.querySelector("#scoreMetric"),
  issueMetric: document.querySelector("#issueMetric"),
  criticalIssuesButton: document.querySelector("#criticalIssuesButton"),
  productTransferBar: document.querySelector("#productTransferBar"),
  productTransferTitle: document.querySelector("#productTransferTitle"),
  productTransferText: document.querySelector("#productTransferText"),
  productTransferButton: document.querySelector("#productTransferButton"),
  scoreFilterBar: document.querySelector("#scoreFilterBar"),
  clearScoreFilterButton: document.querySelector("#clearScoreFilterButton"),
  emptyWorkspace: document.querySelector("#emptyWorkspace"),
  aboutPage: document.querySelector("#aboutPage"),
  workflowSelector: document.querySelector(".workflow-selector"),
  progressOverlay: document.querySelector("#progressOverlay"),
  progressTitle: document.querySelector("#progressTitle"),
  progressText: document.querySelector("#progressText"),
  progressBar: document.querySelector("#progressBar"),
  progressDetail: document.querySelector("#progressDetail"),
  workflowSteps: [...document.querySelectorAll("[data-process-step]")],
  processPages: [...document.querySelectorAll("[data-process-page]")],
  menuDropdowns: [...document.querySelectorAll(".menu-dropdown")],
};

els.workflowSteps.forEach((step) => {
  step.addEventListener("click", () => setActiveProcessStep(step.dataset.processStep));
});
els.menuDropdowns.forEach((menu) => {
  menu.addEventListener("toggle", () => {
    if (!menu.open) return;

    if (menuRequiresProject(menu) && !hasProject()) {
      menu.open = false;
      setStatus("Projekt erforderlich");
      return;
    }

    els.menuDropdowns.forEach((otherMenu) => {
      if (otherMenu !== menu) {
        otherMenu.open = false;
      }
    });
  });
});
els.newProjectButton.addEventListener("click", () => {
  closeMenus();
  openProjectDialog();
});
els.openFileButton.addEventListener("click", () => {
  if (!hasProject() || state.activeProcessStep !== "product") return;

  closeMenus();
  els.fileInput.click();
});
els.openProjectButton.addEventListener("click", () => {
  closeMenus();
  openProjectFile();
});
els.saveProjectButton.addEventListener("click", async () => {
  closeMenus();
  await saveProjectFile();
});
els.saveProjectAsButton.addEventListener("click", async () => {
  closeMenus();
  await saveProjectFileAs();
});
els.aboutButton.addEventListener("click", () => {
  closeMenus();
  openAboutPage();
});
els.closeAboutButton.addEventListener("click", closeAboutPage);
els.openSettingsButton.addEventListener("click", () => {
  if (state.activeProcessStep !== "product") return;
  openSettingsDialog();
});
els.projectCloseButton.addEventListener("click", closeProjectDialog);
els.projectCancelButton.addEventListener("click", closeProjectDialog);
els.projectCreateButton.addEventListener("click", createProject);
els.projectOverlay.addEventListener("click", (event) => {
  if (event.target === els.projectOverlay) {
    closeProjectDialog();
  }
});
els.settingsCloseButton.addEventListener("click", closeSettingsDialog);
els.settingsDoneButton.addEventListener("click", closeSettingsDialog);
els.settingsOverlay.addEventListener("click", (event) => {
  if (event.target === els.settingsOverlay) {
    closeSettingsDialog();
  }
});
els.fileInput.addEventListener("change", handleFile);
els.projectInput.addEventListener("change", handleProjectFile);
els.requirementType.addEventListener("change", () => {
  state.requirementType = els.requirementType.value;
});
els.sheetSelect.addEventListener("change", () => {
  if (state.workbook) {
    loadSheet(els.sheetSelect.value);
    return;
  }

  state.sheetName = els.sheetSelect.value;
  refreshRequirements();
});
els.headerRow.addEventListener("change", () => {
  if (state.workbook) {
    loadSheet(state.sheetName);
    return;
  }

  refreshRequirements();
});
els.categoryColumn.addEventListener("change", refreshRequirements);
els.subcategoryColumn.addEventListener("change", refreshRequirements);
els.nameColumn.addEventListener("change", refreshRequirements);
els.requirementColumn.addEventListener("change", refreshRequirements);
els.idColumn.addEventListener("change", () => {
  updateAutoIdControls();
  refreshRequirements();
});
els.idPrefix.addEventListener("input", refreshRequirements);
els.analyzeButton.addEventListener("click", analyzeRequirements);
els.generateSoftwareButton.addEventListener("click", generateSoftwareRequirements);
els.generateSoftwareMenuButton.addEventListener("click", async () => {
  closeMenus();
  await generateSoftwareRequirements();
});
els.generateE2eButton.addEventListener("click", generateE2eTests);
els.generateE2eMenuButton.addEventListener("click", async () => {
  closeMenus();
  await generateE2eTests();
});
els.exportButton.addEventListener("click", simulateActiveWindchillTransfer);
els.productTransferButton.addEventListener("click", simulateProductWindchillTransfer);
els.softwareTransferButton.addEventListener("click", simulateSoftwareWindchillTransfer);
els.criticalIssuesButton.addEventListener("click", activateScoreFilter);
els.clearScoreFilterButton.addEventListener("click", clearScoreFilter);
els.criticalSoftwareIssuesButton.addEventListener("click", activateSoftwareScoreFilter);
els.clearSoftwareScoreFilterButton.addEventListener("click", clearSoftwareScoreFilter);
els.criticalE2eIssuesButton.addEventListener("click", activateE2eScoreFilter);
els.clearE2eScoreFilterButton.addEventListener("click", clearE2eScoreFilter);
els.resultsBody.addEventListener("click", handleResultRowClick);
els.softwareRequirementsBody.addEventListener("click", handleSoftwareRowClick);
els.softwareRequirementsBody.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const row = event.target.closest(".software-derived-row");
  if (!row) return;

  event.preventDefault();
  openSoftwareSelectionDialog(row.dataset.softwareId);
});
els.e2eTestsBody.addEventListener("click", handleE2eRowClick);
els.e2eTestsBody.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const row = event.target.closest(".e2e-derived-row");
  if (!row) return;

  event.preventDefault();
  openE2eSelectionDialog(row.dataset.e2eId);
});
els.resultsBody.addEventListener("keydown", (event) => {
  if (!state.analysisComplete) return;
  if (event.key !== "Enter" && event.key !== " ") return;
  const row = event.target.closest(".requirement-row");
  if (!row) return;

  event.preventDefault();
  openSelectionDialog(Number(row.dataset.rowNumber));
});
els.selectionCloseButton.addEventListener("click", closeSelectionDialog);
els.selectionDeferButton.addEventListener("click", closeSelectionDialog);
els.excludeRequirementButton.addEventListener("click", excludeRequirement);
els.selectOriginalButton.addEventListener("click", () => selectFinalText("original"));
els.selectEditedOriginalButton.addEventListener("click", () => selectFinalText("edited-original"));
els.resetOriginalTextButton.addEventListener("click", resetOriginalText);
els.selectAiButton.addEventListener("click", () => selectFinalText("ai"));
els.selectionOverlay.addEventListener("click", (event) => {
  if (event.target === els.selectionOverlay) {
    closeSelectionDialog();
  }
});
els.softwareSelectionCloseButton.addEventListener("click", closeSoftwareSelectionDialog);
els.softwareSelectionDeferButton.addEventListener("click", deferSoftwareRequirementSelection);
els.softwareSelectionExcludeButton.addEventListener("click", excludeSoftwareRequirement);
els.softwareSelectionAcceptButton.addEventListener("click", acceptSoftwareRequirement);
els.softwareSelectionOverlay.addEventListener("click", (event) => {
  if (event.target === els.softwareSelectionOverlay) {
    closeSoftwareSelectionDialog();
  }
});
els.e2eSelectionCloseButton.addEventListener("click", closeE2eSelectionDialog);
els.e2eSelectionDeferButton.addEventListener("click", deferE2eSelection);
els.e2eSelectionExcludeButton.addEventListener("click", excludeE2eTest);
els.e2eSelectionAcceptButton.addEventListener("click", acceptE2eTest);
els.e2eSelectionOverlay.addEventListener("click", (event) => {
  if (event.target === els.e2eSelectionOverlay) {
    closeE2eSelectionDialog();
  }
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenus();
  }

  if (event.key === "Escape" && !els.settingsOverlay.hidden) {
    closeSettingsDialog();
  }

  if (event.key === "Escape" && !els.projectOverlay.hidden) {
    closeProjectDialog();
  }

  if (event.key === "Escape" && !els.selectionOverlay.hidden) {
    closeSelectionDialog();
  }

  if (event.key === "Escape" && !els.softwareSelectionOverlay.hidden) {
    closeSoftwareSelectionDialog();
  }

  if (event.key === "Escape" && !els.e2eSelectionOverlay.hidden) {
    closeE2eSelectionDialog();
  }
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".menu-dropdown")) {
    closeMenus();
  }
});

function closeMenus() {
  els.menuDropdowns.forEach((menu) => {
    menu.open = false;
  });
}

function openAboutPage() {
  state.aboutOpen = true;
  renderAboutPage();
  renderWorkspaceState();
  renderProcessPages();
  setStatus("About");
}

function closeAboutPage() {
  state.aboutOpen = false;
  renderWorkspaceState();
  renderProcessPages();
  setStatus(hasProject() ? "Bereit" : "Kein Projekt");
}

function renderAboutPage() {
  const gitInfo = state.runtimeInfo?.git || {};
  const version = gitInfo.version || "Git-Version nicht verfügbar";
  const commit = gitInfo.commit || "Nicht verfügbar";
  const branch = gitInfo.branch || "Nicht verfügbar";
  const dirtyMarker = gitInfo.dirty ? " (lokale Änderungen)" : "";

  els.aboutVersion.textContent = `Git ${version}${dirtyMarker}`;
  els.aboutBuild.textContent = `${branch} / ${commit}`;
  els.aboutBuildDate.textContent = formatGitDate(gitInfo.date) || document.lastModified || "Nicht verfügbar";
  els.aboutRuntimePath.textContent = window.location.pathname || "/";
}

function setActiveProcessStep(processStep) {
  if (!hasProject()) return;
  if (!processStep) return;
  if (!isProcessStepAvailable(processStep)) {
    setStatus(getLockedStepMessage(processStep));
    updateWorkflowState();
    return;
  }

  const wasAboutOpen = state.aboutOpen;
  state.aboutOpen = false;
  if (processStep === state.activeProcessStep && !wasAboutOpen) return;

  state.activeProcessStep = processStep;
  updateWorkflowState();
  renderProcessPages();
  updateExportAvailability();

  setStatus(processStep === "product" ? "Bereit" : "In Vorbereitung");
}

function updateWorkflowState() {
  renderWorkspaceState();
  if (!hasProject()) return;

  if (!isProcessStepAvailable(state.activeProcessStep)) {
    state.activeProcessStep = "product";
    renderProcessPages();
  }

  els.workflowSteps.forEach((step) => {
    const processStep = step.dataset.processStep;
    const isActive = processStep === state.activeProcessStep;
    const isComplete = isProcessStepComplete(processStep);
    const isLocked = !isProcessStepAvailable(processStep);

    step.classList.toggle("is-active", isActive && !isComplete);
    step.classList.toggle("is-complete", isComplete);
    step.classList.toggle("is-locked", isLocked);
    step.disabled = isLocked;
    step.setAttribute("aria-current", isActive ? "page" : "false");
    step.setAttribute("aria-disabled", isLocked ? "true" : "false");

    const status = step.querySelector("small");
    if (!status) return;

    if (isComplete) {
      status.textContent = "Abgeschlossen";
    } else if (isActive) {
      status.textContent = "Aktueller Schritt";
    } else if (isLocked) {
      status.textContent = getLockedStepShortText(processStep);
    } else {
      status.textContent = "Verfügbar";
    }
  });
}

function renderProcessPages() {
  els.processPages.forEach((page) => {
    const isActive = !state.aboutOpen && hasProject() && page.dataset.processPage === state.activeProcessStep;
    page.hidden = !isActive;
    page.classList.toggle("is-active", isActive);
  });
  renderSoftwarePage();
  renderE2ePage();
}

function hasProject() {
  return Boolean(state.projectName);
}

function renderWorkspaceState() {
  const projectOpen = hasProject();
  renderProjectHeader();
  renderOpenAiCostSummary();
  renderMenuAvailability();
  els.aboutPage.hidden = !state.aboutOpen;
  els.emptyWorkspace.hidden = state.aboutOpen || projectOpen;
  els.workflowSelector.hidden = !projectOpen;
  els.processPages.forEach((page) => {
    if (state.aboutOpen || !projectOpen) {
      page.hidden = true;
      page.classList.remove("is-active");
    }
  });
  updateContextualMenuActions();
}

function renderMenuAvailability() {
  const projectOpen = hasProject();
  els.menuDropdowns.forEach((menu) => {
    const isDisabled = menuRequiresProject(menu) && !projectOpen;
    menu.classList.toggle("is-disabled", isDisabled);
    menu.querySelector("summary")?.setAttribute("aria-disabled", isDisabled ? "true" : "false");
    if (isDisabled) {
      menu.open = false;
    }
  });
}

function menuRequiresProject(menu) {
  return menu.dataset.requiresProject === "true";
}

function renderProjectHeader() {
  els.projectHeaderName.textContent = state.projectName || "Kein Projekt geöffnet";
  els.projectHeaderDescription.textContent = state.projectDescription || "";
  els.projectHeaderDescription.hidden = !state.projectDescription;
}

function renderOpenAiCostSummary() {
  const summary = normalizedOpenAiCostSummary();
  const cost = Number(summary.totalCostUsd) || 0;
  const totalTokens = Number(summary.totalTokens) || 0;
  const isEstimated = summary.estimated !== false;
  const isConfigured = summary.pricingConfigured === true;

  els.openAiCostTotal.textContent = isConfigured || cost > 0 ? formatUsd(cost) : "$0.0000";
  els.openAiCostDetail.textContent = `${formatInteger(totalTokens)} Tokens${isEstimated ? " geschätzt" : ""}${isConfigured ? "" : " (Preise nicht konfiguriert)"}`;
}

function addOpenAiUsage(openAiUsage) {
  if (!openAiUsage || typeof openAiUsage !== "object") return;

  const usage = openAiUsage.usage || {};
  const cost = openAiUsage.cost || {};
  const summary = normalizedOpenAiCostSummary();
  summary.requestCount += 1;
  summary.inputTokens += Number(usage.inputTokens) || 0;
  summary.cachedInputTokens += Number(usage.cachedInputTokens) || 0;
  summary.outputTokens += Number(usage.outputTokens) || 0;
  summary.reasoningOutputTokens += Number(usage.reasoningOutputTokens) || 0;
  summary.totalTokens += Number(usage.totalTokens) || 0;
  summary.totalCostUsd += Number(cost.totalUsd) || 0;
  summary.pricingConfigured = summary.pricingConfigured || cost.pricingConfigured === true;
  summary.estimated = true;
  summary.lastModel = openAiUsage.model || summary.lastModel || "";
  summary.updatedAt = new Date().toISOString();
  state.openAiCostSummary = summary;
  renderOpenAiCostSummary();
  updateProjectActions();
}

function normalizedOpenAiCostSummary(value = state.openAiCostSummary) {
  return {
    requestCount: Number(value?.requestCount) || 0,
    inputTokens: Number(value?.inputTokens) || 0,
    cachedInputTokens: Number(value?.cachedInputTokens) || 0,
    outputTokens: Number(value?.outputTokens) || 0,
    reasoningOutputTokens: Number(value?.reasoningOutputTokens) || 0,
    totalTokens: Number(value?.totalTokens) || 0,
    totalCostUsd: Number(value?.totalCostUsd) || 0,
    pricingConfigured: Boolean(value?.pricingConfigured),
    estimated: value?.estimated !== false,
    lastModel: value?.lastModel || "",
    updatedAt: value?.updatedAt || "",
  };
}

function isProcessStepAvailable(processStep) {
  const previousStep = PROCESS_STEP_DEPENDENCIES[processStep];
  return !previousStep || isProcessStepComplete(previousStep);
}

function isProcessStepComplete(processStep) {
  if (processStep === "product") return isProductStepComplete();
  if (processStep === "software") return isSoftwareStepComplete();
  if (processStep === "e2e") return isE2eQualityReady();
  return false;
}

function getLockedStepMessage(processStep) {
  const previousStep = PROCESS_STEP_DEPENDENCIES[processStep];
  if (!previousStep) return "";

  if (previousStep === "product") {
    if (isProductQualityReady() && !state.productWindchillTransferComplete) {
      return "Product Requirements zuerst nach Windchill übertragen";
    }

    return `Product Requirement erst vollständig zuordnen und Score >= ${PRODUCT_STEP_MIN_SCORE} erreichen`;
  }

  if (previousStep === "software" && isSoftwareQualityReady() && !state.softwareWindchillTransferComplete) {
    return "Software Requirements zuerst nach Windchill übertragen";
  }

  return `${PROCESS_STEP_LABELS[previousStep]} muss zuerst abgeschlossen werden`;
}

function getLockedStepShortText(processStep) {
  const previousStep = PROCESS_STEP_DEPENDENCIES[processStep];
  if (!previousStep) return "";

  if (previousStep === "product") {
    if (isProductQualityReady() && !state.productWindchillTransferComplete) {
      return "Windchill-Übertragung erforderlich";
    }

    return `Score >= ${PRODUCT_STEP_MIN_SCORE} erforderlich`;
  }

  if (previousStep === "software" && isSoftwareQualityReady() && !state.softwareWindchillTransferComplete) {
    return "Windchill-Übertragung erforderlich";
  }

  return `${PROCESS_STEP_LABELS[previousStep]} abschließen`;
}

function isProductStepComplete() {
  return isProductQualityReady() && state.productWindchillTransferComplete;
}

function isProductQualityReady() {
  const progress = getProductStepProgress();
  return progress.allAssigned && progress.averageScore >= PRODUCT_STEP_MIN_SCORE && state.finalScoreUpdates.size === 0;
}

function getProductStepProgress() {
  const excludedRows = getExcludedRows();
  const scores = getIncludedScores(excludedRows);
  const assignedCount = state.requirements.filter((requirement) =>
    state.finalSelections.has(Number(requirement.rowNumber)),
  ).length;
  const allAssigned =
    state.requirements.length > 0 &&
    assignedCount === state.requirements.length &&
    state.requirements.every((requirement) => state.finalSelections.has(Number(requirement.rowNumber)));
  const averageScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  return { assignedCount, allAssigned, averageScore };
}

function getExcludedRows() {
  return new Set(
    [...state.finalSelections.entries()]
      .filter(([, selection]) => selection.choice === "excluded")
      .map(([rowNumber]) => Number(rowNumber)),
  );
}

function getIncludedScores(excludedRows = getExcludedRows()) {
  return state.results
    .filter((result) => !excludedRows.has(Number(result.rowNumber)))
    .map((result) => Number(result.score))
    .filter(Number.isFinite);
}

async function handleFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  setStatus("Lese Datei...");
  els.fileState.textContent = file.name;
  state.sourceFileName = file.name;
  const buffer = await file.arrayBuffer();
  state.workbook = XLSX.read(buffer, { type: "array", cellDates: true });

  els.sheetSelect.innerHTML = "";
  for (const name of state.workbook.SheetNames) {
    els.sheetSelect.append(new Option(name, name));
  }

  els.sheetSelect.disabled = false;
  els.headerRow.disabled = false;
  els.sheetSelect.value = state.workbook.SheetNames[0];
  loadSheet(state.workbook.SheetNames[0]);
  openSettingsDialog();
}

async function handleProjectFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  await loadProjectFile(file, null);
  event.target.value = "";
}

async function openProjectFile() {
  if ("showOpenFilePicker" in window) {
    try {
      const [handle] = await window.showOpenFilePicker({
        multiple: false,
        types: [projectFilePickerType()],
      });
      const file = await handle.getFile();
      await loadProjectFile(file, handle);
      return;
    } catch (error) {
      if (error?.name === "AbortError") {
        setStatus("Laden abgebrochen");
        return;
      }

      console.warn("Projekt-Dateidialog nicht verfügbar, nutze Eingabe-Fallback.", error);
    }
  }

  els.projectInput.click();
}

async function loadProjectFile(file, handle) {
  try {
    setStatus("Lade Projekt...");
    const payload = JSON.parse(await file.text());
    loadProjectPayload(payload, file.name, handle);
    setStatus("Projekt geladen");
  } catch (error) {
    setStatus("Fehler");
    alert(`Projektdatei konnte nicht geladen werden: ${error.message}`);
  }
}

function openSettingsDialog() {
  els.settingsOverlay.hidden = false;
}

function closeSettingsDialog() {
  els.settingsOverlay.hidden = true;
}

function openProjectDialog() {
  els.projectName.value = state.projectName;
  els.projectDescription.value = state.projectDescription;
  els.projectOverlay.hidden = false;
  els.projectName.focus();
}

function closeProjectDialog() {
  els.projectOverlay.hidden = true;
}

function createProject() {
  const projectName = els.projectName.value.trim();
  if (!projectName) {
    els.projectName.focus();
    return;
  }

  const hasWork = state.requirements.length || state.results.length || state.projectName;
  if (hasWork && !confirm("Aktuellen Arbeitsstand verwerfen und ein neues Projekt anlegen?")) {
    return;
  }

  resetProjectState({
    projectName,
    projectDescription: els.projectDescription.value.trim(),
  });
  closeProjectDialog();
  setStatus("Projekt angelegt");
}

function resetProjectState({ projectName, projectDescription }) {
  state.workbook = null;
  state.sheetName = "Projekt";
  state.rows = [];
  state.headers = [];
  state.requirements = [];
  state.results = [];
  state.softwareRequirements = [];
  state.softwareSelections = new Map();
  state.e2eTests = [];
  state.e2eSelections = new Map();
  state.finalSelections = new Map();
  state.finalScoreUpdates = new Set();
  state.activeSelectionRow = null;
  state.analysisComplete = false;
  state.generatedIds = false;
  state.requirementType = "product";
  state.activeProcessStep = "product";
  state.openAiCostSummary = null;
  state.scoreFilterActive = false;
  state.softwareScoreFilterActive = false;
  state.e2eScoreFilterActive = false;
  state.productWindchillTransferComplete = false;
  state.productWindchillTransferredAt = "";
  state.softwareWindchillTransferComplete = false;
  state.softwareWindchillTransferredAt = "";
  state.sourceFileName = "";
  state.projectName = projectName;
  state.projectDescription = projectDescription;
  state.projectFileHandle = null;
  state.projectFileName = "";

  els.fileState.textContent = `${projectName} (Projekt)`;
  els.sheetSelect.innerHTML = "";
  els.sheetSelect.append(new Option(state.sheetName, state.sheetName));
  els.sheetSelect.value = state.sheetName;
  els.sheetSelect.disabled = true;
  els.headerRow.value = "1";
  els.headerRow.disabled = true;
  state.headers = [];
  fillColumnSelects();
  els.analyzeButton.disabled = true;
  updateProjectActions();
  updateExportAvailability();
  renderWorkspaceState();
  renderProcessPages();
  renderTable();
  renderMetrics();
}

function loadSheet(sheetName) {
  if (!state.workbook || !sheetName) return;

  state.sheetName = sheetName;
  els.sheetSelect.value = sheetName;
  const worksheet = state.workbook.Sheets[sheetName];
  state.rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

  const headerIndex = Math.max(Number(els.headerRow.value || 1) - 1, 0);
  state.headers = (state.rows[headerIndex] || []).map((header, index) => {
    const label = String(header || "").trim();
    return label || `Spalte ${columnName(index)}`;
  });

  fillColumnSelects();
  refreshRequirements();
}

function fillColumnSelects() {
  els.categoryColumn.innerHTML = "";
  els.subcategoryColumn.innerHTML = "";
  els.nameColumn.innerHTML = "";
  els.requirementColumn.innerHTML = "";
  els.idColumn.innerHTML = "";
  els.categoryColumn.append(new Option("Keine Kategorie-Spalte", ""));
  els.subcategoryColumn.append(new Option("Keine Subkategorie-Spalte", ""));
  els.nameColumn.append(new Option("Keine Name-Spalte", ""));
  els.idColumn.append(new Option("Keine ID-Spalte", ""));

  state.headers.forEach((header, index) => {
    const label = `${columnName(index)} - ${header}`;
    els.categoryColumn.append(new Option(label, String(index)));
    els.subcategoryColumn.append(new Option(label, String(index)));
    els.nameColumn.append(new Option(label, String(index)));
    els.requirementColumn.append(new Option(label, String(index)));
    els.idColumn.append(new Option(label, String(index)));
  });

  const guessedRequirement = guessColumn(["requirement", "anforderung", "beschreibung", "description", "text"]);
  const guessedCategory = guessColumn(["kategorie", "category", "bereich", "gruppe"]);
  const guessedSubcategory = guessColumn(["subkategorie", "subcategory", "unterkategorie", "untergruppe"]);
  const guessedName = guessColumn(["name", "titel", "title", "summary", "bezeichnung"]);
  const guessedId = guessColumn(["id", "key", "nummer", "nr"]);

  els.categoryColumn.value = columnValueOrDefault(guessedCategory, 0);
  els.subcategoryColumn.value = columnValueOrDefault(guessedSubcategory, 1);
  els.nameColumn.value = columnValueOrDefault(guessedName, 2);
  els.requirementColumn.value = String(guessedRequirement >= 0 ? guessedRequirement : Math.max(0, Math.min(3, state.headers.length - 1)));
  els.idColumn.value = guessedId >= 0 ? String(guessedId) : "";
  const hasHeaders = state.headers.length > 0;
  els.categoryColumn.disabled = !hasHeaders;
  els.subcategoryColumn.disabled = !hasHeaders;
  els.nameColumn.disabled = !hasHeaders;
  els.requirementColumn.disabled = !hasHeaders;
  els.idColumn.disabled = !hasHeaders;
  els.idPrefix.disabled = !hasHeaders;
  updateAutoIdControls();
}

function refreshRequirements() {
  state.requirements = buildRequirementsFromCurrentConfig();
  state.results = [];
  state.softwareRequirements = [];
  state.softwareSelections = new Map();
  state.e2eTests = [];
  state.e2eSelections = new Map();
  state.finalSelections = new Map();
  state.finalScoreUpdates = new Set();
  state.scoreFilterActive = false;
  state.softwareScoreFilterActive = false;
  state.e2eScoreFilterActive = false;
  state.productWindchillTransferComplete = false;
  state.productWindchillTransferredAt = "";
  state.softwareWindchillTransferComplete = false;
  state.softwareWindchillTransferredAt = "";
  state.analysisComplete = false;
  els.analyzeButton.disabled = state.requirements.length === 0;
  updateProjectActions();
  updateExportAvailability();
  renderTable();
  renderMetrics();
  setStatus(`${state.requirements.length} Requirements`);
}

function buildRequirementsFromCurrentConfig() {
  const headerIndex = Math.max(Number(els.headerRow.value || 1) - 1, 0);
  const textIndex = Number(els.requirementColumn.value || 0);
  const categoryIndex = selectIndex(els.categoryColumn.value);
  const subcategoryIndex = selectIndex(els.subcategoryColumn.value);
  const nameIndex = selectIndex(els.nameColumn.value);
  const idValue = els.idColumn.value;
  const idIndex = idValue === "" ? -1 : Number(idValue);

  const requirements = state.rows
    .slice(headerIndex + 1)
    .map((row, offset) => ({
      rowNumber: headerIndex + offset + 2,
      category: categoryIndex >= 0 ? String(row[categoryIndex] || "").trim() : "",
      subcategory: subcategoryIndex >= 0 ? String(row[subcategoryIndex] || "").trim() : "",
      name: nameIndex >= 0 ? String(row[nameIndex] || "").trim() : "",
      id: idIndex >= 0 ? String(row[idIndex] || "").trim() : "",
      text: String(row[textIndex] || "").trim(),
    }))
    .filter((item) => item.text);

  const shouldGenerateIds = idIndex < 0 || !requirements.some((item) => item.id);
  state.generatedIds = shouldGenerateIds;
  setAutoIdVisible(shouldGenerateIds);
  return shouldGenerateIds ? withGeneratedIds(requirements, els.idPrefix.value) : requirements;
}

async function analyzeRequirements() {
  const endpoint = getAnalyzeEndpoint();
  if (!endpoint) {
    setStatus("Server erforderlich");
    alert("Bitte starte den lokalen Server und öffne die App über http://localhost:3000. Die Analyse-API ist über file:// nicht verfügbar.");
    return;
  }

  setStatus("Analysiere...");
  els.analyzeButton.disabled = true;
  state.finalSelections = new Map();
  state.finalScoreUpdates = new Set();
  state.scoreFilterActive = false;
  state.analysisComplete = false;
  updateExportAvailability();
  showProgress(state.requirements.length);

  try {
    const results = [];
    const totalBatches = Math.ceil(state.requirements.length / ANALYSIS_BATCH_SIZE);

    for (let index = 0; index < state.requirements.length; index += ANALYSIS_BATCH_SIZE) {
      const batchNumber = Math.floor(index / ANALYSIS_BATCH_SIZE) + 1;
      const batch = state.requirements.slice(index, index + ANALYSIS_BATCH_SIZE);
      setStatus(`Analysiere ${batchNumber}/${totalBatches}`);
      updateProgress({
        processed: results.length,
        total: state.requirements.length,
        batchNumber,
        totalBatches,
      });

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirementType: state.requirementType, requirements: batch }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Analyse fehlgeschlagen");
      }

      addOpenAiUsage(data.openAiUsage);
      results.push(...(Array.isArray(data.results) ? data.results : []));
      state.results = results;
      renderTable();
      renderMetrics();
      updateProgress({
        processed: results.length,
        total: state.requirements.length,
        batchNumber,
        totalBatches,
      });
    }

    setStatus("Analyse fertig");
    state.analysisComplete = true;
    completeProgress(state.results.length);
    updateProjectActions();
    updateExportAvailability();
  } catch (error) {
    setStatus("Fehler");
    hideProgress();
    alert(error.message);
  } finally {
    updateProjectActions();
    renderTable();
    renderMetrics();
  }
}

function renderTable() {
  els.resultsTable.classList.toggle("analysis-complete", state.analysisComplete);
  const resultByRow = new Map(state.results.map((result) => [Number(result.rowNumber), result]));
  const criticalRows = getCriticalScoreRows();
  const rows = state.scoreFilterActive
    ? state.requirements.filter((requirement) => criticalRows.has(Number(requirement.rowNumber)))
    : state.requirements;

  if (!rows.length) {
    const message = state.scoreFilterActive
      ? `Keine Requirements mit Score unter ${PRODUCT_STEP_MIN_SCORE} gefunden.`
      : "Keine Requirements in der gewaehlten Spalte gefunden.";
    els.resultsBody.innerHTML = `<tr><td colspan="${visibleResultColumnCount()}" class="empty">${message}</td></tr>`;
    return;
  }

  els.resultsBody.innerHTML = groupedRequirements(rows)
    .map((entry) => {
      if (entry.type === "group") {
        return `
          <tr class="group-row">
            <td colspan="${visibleResultColumnCount()}">
              <span class="group-title">${escapeHtml(entry.category)}</span>
              <span class="group-separator">/</span>
              <span>${escapeHtml(entry.subcategory)}</span>
              <span class="group-count">${entry.count} Requirements</span>
            </td>
          </tr>
        `;
      }

      const item = entry.item;
      const result = resultByRow.get(item.rowNumber);
      const score = result ? Number(result.score) : null;
      const selection = state.finalSelections.get(Number(item.rowNumber));
      const isUpdatingFinalScore = state.finalScoreUpdates.has(Number(item.rowNumber));
      const isSelected = Boolean(selection);
      const isExcluded = selection?.choice === "excluded";
      const status = decisionStatus(selection, score, isUpdatingFinalScore);
      return `
        <tr class="requirement-row ${isSelected ? "final-selected-row" : ""} ${isExcluded ? "excluded-row" : ""} ${isUpdatingFinalScore ? "updating-row" : ""}" data-row-number="${item.rowNumber}" tabindex="0">
          <td class="decision-cell">
            <span class="decision-icon ${status.className}" aria-label="${escapeHtml(status.label)}">
              ${status.icon}
            </span>
          </td>
          <td>${item.rowNumber}</td>
          <td>${escapeHtml(item.id || "-")}</td>
          <td>${escapeHtml(item.name || item.id || "-")}</td>
          <td class="${selection?.choice === "original" || selection?.choice === "edited-original" ? "selected-text" : ""} ${isExcluded ? "excluded-text" : ""}">${escapeHtml(item.text)}</td>
          <td>${renderScoreCell(result, score, isSelected, isExcluded, isUpdatingFinalScore)}</td>
          <td>${result ? renderIssues(result.issues) : "-"}</td>
          <td class="${selection?.choice === "ai" ? "selected-text" : ""} ${isExcluded ? "excluded-text" : ""}">${result ? escapeHtml(result.rewrittenRequirement || "") : "-"}</td>
        </tr>
      `;
    })
    .join("");
}

function groupedRequirements(rows) {
  const entries = [];
  let currentKey = "";
  let currentGroup = null;

  rows.forEach((item) => {
    const category = item.category || "Ohne Kategorie";
    const subcategory = item.subcategory || "Ohne Subkategorie";
    const key = `${category}\u0000${subcategory}`;

    if (key !== currentKey) {
      currentKey = key;
      currentGroup = { type: "group", category, subcategory, count: 0 };
      entries.push(currentGroup);
    }

    currentGroup.count += 1;
    entries.push({ type: "item", item });
  });

  return entries;
}

function visibleResultColumnCount() {
  return state.analysisComplete ? 8 : 7;
}

function handleResultRowClick(event) {
  if (!state.analysisComplete) return;

  const row = event.target.closest(".requirement-row");
  if (!row) return;

  openSelectionDialog(Number(row.dataset.rowNumber));
}

function openSelectionDialog(rowNumber) {
  const item = state.requirements.find((requirement) => Number(requirement.rowNumber) === rowNumber);
  if (!item) return;

  const result = state.results.find((entry) => Number(entry.rowNumber) === rowNumber);
  state.activeSelectionRow = rowNumber;

  els.selectionId.textContent = item.id || "-";
  els.selectionName.textContent = item.name || item.id || "-";
  els.selectionGroup.textContent = `${item.category || "Ohne Kategorie"} / ${item.subcategory || "Ohne Subkategorie"}`;
  els.selectionScore.textContent = result?.score ?? "-";
  els.selectionOriginalText.value = item.text;
  els.selectionAiText.textContent = result?.rewrittenRequirement || "Noch kein AI-Vorschlag vorhanden. Bitte zuerst die Analyse ausführen.";
  els.selectAiButton.disabled = !result?.rewrittenRequirement;
  els.selectionIssues.innerHTML = result ? renderIssues(result.issues) : "Noch keine Analysehinweise vorhanden.";
  els.selectionOverlay.hidden = false;
}

function closeSelectionDialog() {
  state.activeSelectionRow = null;
  els.selectionOverlay.hidden = true;
}

function excludeRequirement() {
  const rowNumber = state.activeSelectionRow;
  if (!rowNumber) return;

  state.finalSelections.set(Number(rowNumber), {
    choice: "excluded",
    text: "",
    excluded: true,
  });
  state.softwareRequirements = [];
  state.softwareSelections = new Map();
  state.e2eTests = [];
  state.e2eSelections = new Map();
  resetProductWindchillTransfer();
  resetSoftwareWindchillTransfer();
  closeSelectionDialog();
  renderTable();
  renderMetrics();
  renderSoftwarePage();
  updateExportAvailability();
}

function resetOriginalText() {
  const rowNumber = state.activeSelectionRow;
  if (!rowNumber) return;

  const item = state.requirements.find((requirement) => Number(requirement.rowNumber) === rowNumber);
  if (!item) return;

  els.selectionOriginalText.value = item.text;
  els.selectionOriginalText.focus();
}

async function selectFinalText(choice) {
  const rowNumber = state.activeSelectionRow;
  if (!rowNumber) return;

  const item = state.requirements.find((requirement) => Number(requirement.rowNumber) === rowNumber);
  const result = state.results.find((entry) => Number(entry.rowNumber) === rowNumber);
  const text =
    choice === "ai"
      ? result?.rewrittenRequirement
      : choice === "edited-original"
        ? els.selectionOriginalText.value.trim()
        : item?.text;

  if (!item || !text) return;

  state.finalSelections.set(Number(rowNumber), { choice, text });
  state.softwareRequirements = [];
  state.softwareSelections = new Map();
  state.e2eTests = [];
  state.e2eSelections = new Map();
  resetProductWindchillTransfer();
  resetSoftwareWindchillTransfer();
  closeSelectionDialog();
  renderTable();
  renderMetrics();
  renderSoftwarePage();
  updateExportAvailability();
  await recalculateFinalScore(item, text, choice);
}

function decisionStatus(selection, score, isUpdatingFinalScore = false) {
  if (isUpdatingFinalScore) {
    return {
      className: "updating",
      icon: '<span class="inline-spinner" aria-hidden="true"></span>',
      label: "Quality Score wird aktualisiert",
    };
  }

  if (!selection) {
    return {
      className: "pending",
      icon: "?",
      label: "Finaler Text noch nicht ausgewählt",
    };
  }

  if (selection.choice === "excluded") {
    return {
      className: "excluded",
      icon: "×",
      label: "Requirement ausgeschlossen",
    };
  }

  if (isCriticalScore(score)) {
    return {
      className: "critical",
      icon: "!",
      label: `Finaler Score unter ${PRODUCT_STEP_MIN_SCORE}`,
    };
  }

  return {
    className: "selected",
    icon: "&#10003;",
    label: "Finaler Text ausgewählt",
  };
}

async function recalculateFinalScore(item, finalText, choice) {
  const endpoint = getAnalyzeEndpoint();
  if (!endpoint) return;

  const rowNumber = Number(item.rowNumber);
  state.finalScoreUpdates.add(rowNumber);
  setStatus("Bewerte finalen Text...");
  renderTable();
  updateExportAvailability();

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        analysisMode: "final",
        finalChoice: choice,
        requirementType: state.requirementType,
        requirements: [
          {
            ...item,
            text: finalText,
          },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Finale Bewertung fehlgeschlagen");
    }

    addOpenAiUsage(data.openAiUsage);
    const updatedResult = Array.isArray(data.results) ? data.results[0] : null;
    if (updatedResult) {
      upsertResult(updatedResult);
      renderTable();
      renderMetrics();
    }

    setStatus("Final bewertet");
  } catch (error) {
    setStatus("Fehler");
    alert(error.message);
  } finally {
    state.finalScoreUpdates.delete(rowNumber);
    renderTable();
    renderMetrics();
    updateExportAvailability();
  }
}

function upsertResult(result) {
  const rowNumber = Number(result.rowNumber);
  const index = state.results.findIndex((entry) => Number(entry.rowNumber) === rowNumber);

  if (index >= 0) {
    state.results[index] = result;
    return;
  }

  state.results.push(result);
}

function renderIssues(issues = []) {
  if (!issues.length) return "Keine wesentlichen Hinweise";
  return `
    <ul class="issue-list">
      ${issues
        .map(
          (issue) => `
            <li>
              <span class="severity">${escapeHtml(issue.severity)} / ${escapeHtml(issue.criterion)}</span><br />
              ${escapeHtml(issue.explanation)}<br />
              ${escapeHtml(issue.suggestion)}
            </li>
          `,
        )
        .join("")}
    </ul>
  `;
}

function renderScoreCell(result, score, isSelected, isExcluded, isUpdatingFinalScore) {
  if (isExcluded) return "-";

  if (isUpdatingFinalScore) {
    const currentScore = result ? renderScoreValue(score, isSelected, "score-stale") : "";
    return `
      <span class="score-update">
        <span class="inline-spinner" aria-hidden="true"></span>
        <span>${currentScore || "Aktualisiert..."}</span>
      </span>
    `;
  }

  return result ? renderScoreValue(score, isSelected) : "-";
}

function renderScoreValue(score, isSelected, extraClass = "") {
  const critical = isSelected && isCriticalScore(score);
  return `
    <span class="score-wrap">
      <span class="score ${scoreClass(score)} ${extraClass}">${score}</span>
      ${critical ? `<span class="score-alert" title="Score unter ${PRODUCT_STEP_MIN_SCORE}" aria-label="Score unter ${PRODUCT_STEP_MIN_SCORE}">!</span>` : ""}
    </span>
  `;
}

function renderMetrics() {
  const progress = getProductStepProgress();
  const scores = getIncludedScores();
  const criticalScoreCount = getCriticalScoreRows().size;
  const productReady = isProductQualityReady();

  els.countMetric.textContent = state.analysisComplete
    ? `${progress.assignedCount} / ${state.requirements.length}`
    : String(state.requirements.length);
  els.countMetricLabel.textContent = state.analysisComplete ? "Requirements zugeordnet" : "Requirements";
  els.scoreMetric.textContent = scores.length ? String(progress.averageScore) : "-";
  els.issueMetric.textContent = String(criticalScoreCount);
  els.criticalIssuesButton.disabled = criticalScoreCount === 0;
  els.criticalIssuesButton.classList.toggle("is-active", state.scoreFilterActive);
  els.scoreFilterBar.hidden = !state.scoreFilterActive;
  renderProductTransferState(productReady);
  updateWorkflowState();
  renderSoftwarePage();
  renderE2ePage();
}

function renderSoftwarePage() {
  if (!els.softwareRequirementsBody) return;

  const finalProductRequirements = getFinalProductRequirements();
  const softwareScores = getSoftwareScores();
  const criticalSoftwareCount = getCriticalSoftwareRequirements().length;
  els.softwareDerivedMetric.textContent = `${getSoftwareDerivedCount()} / ${finalProductRequirements.length}`;
  els.softwareScoreMetric.textContent = softwareScores.length
    ? String(Math.round(softwareScores.reduce((sum, score) => sum + score, 0) / softwareScores.length))
    : "-";
  els.softwareIssueMetric.textContent = String(criticalSoftwareCount);
  els.criticalSoftwareIssuesButton.disabled = criticalSoftwareCount === 0;
  els.criticalSoftwareIssuesButton.classList.toggle("is-active", state.softwareScoreFilterActive);
  els.softwareScoreFilterBar.hidden = !state.softwareScoreFilterActive;
  renderSoftwareTransferState();
  els.generateSoftwareButton.disabled = !hasProject() || !isProductStepComplete() || state.finalScoreUpdates.size > 0;

  if (!isProductStepComplete()) {
    els.softwareScoreFilterBar.hidden = true;
    els.softwareRequirementsBody.innerHTML =
      `<tr><td colspan="5" class="empty">${isProductQualityReady() ? "Übertrage zuerst die Product Requirements nach Windchill." : "Schließe Product Requirements ab, um Software Requirements abzuleiten."}</td></tr>`;
    return;
  }

  const softwareBySourceRow = new Map();
  state.softwareRequirements.forEach((item) => {
    const rowNumber = Number(item.sourceRowNumber);
    const entries = softwareBySourceRow.get(rowNumber) || [];
    entries.push(item);
    softwareBySourceRow.set(rowNumber, entries);
  });

  const rows = [];
  let pendingGroup = null;

  groupedRequirements(finalProductRequirements).forEach((entry) => {
    if (entry.type === "group") {
      pendingGroup = entry;
      return;
    }

    const source = entry.item;
    const allSoftwareRequirements = softwareBySourceRow.get(Number(source.rowNumber)) || [];
    const softwareRequirements = state.softwareScoreFilterActive
      ? allSoftwareRequirements.filter((item) => isCriticalScore(Number(item.score)))
      : allSoftwareRequirements;
    if (state.softwareScoreFilterActive && !softwareRequirements.length) return;

    const displayRequirements = softwareRequirements.length
      ? softwareRequirements
      : [
          {
            id: buildSoftwareRequirementId(source),
            sourceId: source.id,
            text: "",
            score: null,
            pending: true,
          },
        ];

    if (pendingGroup) {
      rows.push(`
        <tr class="group-row">
          <td colspan="5">
            <span class="group-title">${escapeHtml(pendingGroup.category)}</span>
            <span class="group-separator">/</span>
            <span>${escapeHtml(pendingGroup.subcategory)}</span>
            <span class="group-count">${pendingGroup.count} Product Requirements</span>
          </td>
        </tr>
      `);
      pendingGroup = null;
    }

    rows.push(
      ...displayRequirements.map(
        (item) => {
          const status = softwareDecisionStatus(item);
          const softwareId = item.id || buildSoftwareRequirementId(source);
          const selection = state.softwareSelections.get(String(softwareId));
          const isExcluded = selection?.excluded === true;
          return `
          <tr class="software-derived-row${item.pending ? " software-pending-row" : ""} ${isExcluded ? "excluded-row" : ""}" data-software-id="${escapeHtml(softwareId)}" tabindex="0">
            <td class="decision-cell">
              <span class="decision-icon ${status.className}" aria-label="${escapeHtml(status.label)}">
                ${status.icon}
              </span>
            </td>
            <td>${escapeHtml(softwareId)}</td>
            <td>
              <strong>${escapeHtml(source.name || source.id || "Product Requirement")}</strong><br />
              ${escapeHtml(source.text)}
            </td>
            <td>${item.pending ? '<span class="muted-cell">Noch nicht abgeleitet.</span>' : renderSoftwareRequirementContent(item)}</td>
            <td>${item.pending ? "-" : renderSoftwareScoreCell(item, isExcluded)}</td>
          </tr>
        `;
        },
      ),
    );
  });

  const emptyMessage = state.softwareScoreFilterActive
    ? `Keine Software Requirements mit Score unter ${PRODUCT_STEP_MIN_SCORE} gefunden.`
    : "Noch keine Software Requirements abgeleitet.";
  els.softwareRequirementsBody.innerHTML = rows.length
    ? rows.join("")
    : `<tr><td colspan="5" class="empty">${emptyMessage}</td></tr>`;
}

function getSoftwareScores() {
  return state.softwareRequirements
    .filter((item) => {
      const selection = state.softwareSelections.get(String(item.id || ""));
      return selection?.excluded !== true;
    })
    .map((item) => Number(item.score))
    .filter(Number.isFinite);
}

function getSoftwareDerivedCount() {
  const sourceRows = state.softwareRequirements
    .map((item) => Number(item.sourceRowNumber))
    .filter(Number.isFinite);

  return sourceRows.length ? new Set(sourceRows).size : state.softwareRequirements.length;
}

function renderSoftwareRequirementContent(item) {
  return `
    ${escapeHtml(item.text || "")}
    ${renderFlowSection("Akzeptanzkriterien", item.acceptanceCriteria)}
    <div class="informal-flow-block">
      <span>Informeller Flow-Kontext</span>
      ${renderFlowSection("Main Flow", item.happyFlow)}
      ${renderFlowSection("Alternative Flows", item.alternativeFlows)}
      ${renderFlowSection("Exception Flows", item.exceptionFlows)}
    </div>
  `;
}

function renderFlowSection(title, value) {
  const items = Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];
  if (!items.length) return "";

  return `
    <div class="flow-section">
      <span>${escapeHtml(title)}</span>
      <ul>
        ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    </div>
  `;
}

function renderSoftwareScoreCell(item, isExcluded = false) {
  if (isExcluded) return "-";

  const score = Number(item.score);
  if (!Number.isFinite(score)) return "-";

  const issues = Array.isArray(item.issues) ? item.issues : [];
  return `
    ${renderScoreValue(score, isCriticalScore(score))}
    ${item.rationale ? `<p class="score-rationale">${escapeHtml(item.rationale)}</p>` : ""}
    ${issues.length ? renderIssues(issues) : ""}
  `;
}

function softwareDecisionStatus(item) {
  if (item.pending) {
    return {
      className: "empty",
      icon: "",
      label: "Software Requirement noch nicht abgeleitet",
    };
  }

  const selection = state.softwareSelections.get(String(item.id || ""));
  if (!selection) {
    return {
      className: "pending",
      icon: "?",
      label: "Software Requirement noch nicht übernommen",
    };
  }

  if (selection.excluded) {
    return {
      className: "excluded",
      icon: "×",
      label: "Software Requirement ausgeschlossen",
    };
  }

  const score = Number(item.score);
  if (isCriticalScore(score)) {
    return {
      className: "critical",
      icon: "!",
      label: `Software Requirement Score unter ${PRODUCT_STEP_MIN_SCORE}`,
    };
  }

  return {
    className: "selected",
    icon: "&#10003;",
    label: "Software Requirement abgeleitet",
  };
}

function handleSoftwareRowClick(event) {
  const row = event.target.closest(".software-derived-row");
  if (!row) return;

  openSoftwareSelectionDialog(row.dataset.softwareId);
}

function openSoftwareSelectionDialog(softwareId) {
  const item = state.softwareRequirements.find((entry) => String(entry.id || "") === String(softwareId || ""));
  if (!item) return;

  state.activeSoftwareRequirementId = item.id || "";
  const selection = state.softwareSelections.get(String(item.id || ""));
  const text = selection?.text || item.text || "";

  els.softwareSelectionId.textContent = item.id || "-";
  els.softwareSelectionSource.textContent = item.sourceId || "-";
  els.softwareSelectionScore.textContent = item.score ?? "-";
  els.softwareSelectionText.value = text;
  els.softwareSelectionIssues.innerHTML = item.issues?.length ? renderIssues(item.issues) : "Keine Hinweise vorhanden.";
  els.softwareSelectionOverlay.hidden = false;
}

function closeSoftwareSelectionDialog() {
  state.activeSoftwareRequirementId = "";
  els.softwareSelectionOverlay.hidden = true;
}

function deferSoftwareRequirementSelection() {
  const softwareId = state.activeSoftwareRequirementId;
  if (softwareId) {
    state.softwareSelections.delete(String(softwareId));
  }

  resetSoftwareWindchillTransfer();
  closeSoftwareSelectionDialog();
  renderSoftwarePage();
  updateExportAvailability();
}

function acceptSoftwareRequirement() {
  const softwareId = state.activeSoftwareRequirementId;
  if (!softwareId) return;

  const item = state.softwareRequirements.find((entry) => String(entry.id || "") === String(softwareId));
  const text = els.softwareSelectionText.value.trim();
  if (!item || !text) return;

  const updatedScore = scoreAcceptedSoftwareRequirement(item, text);
  item.text = text;
  item.score = updatedScore;
  if (isCriticalScore(updatedScore) && (!Array.isArray(item.issues) || !item.issues.length)) {
    item.issues = [
      {
        criterion: "SR-Qualität",
        severity: "medium",
        explanation: "Der übernommene Software-Requirement-Text erreicht den Mindestscore nicht.",
        suggestion: "Präzisiere Systemverhalten, Auslöser, Ergebnis, Testbarkeit und Fehlerbedingungen.",
      },
    ];
  }

  state.softwareSelections.set(String(item.id || ""), {
    text,
    score: updatedScore,
    excluded: false,
    acceptedAt: new Date().toISOString(),
  });
  state.e2eTests = [];
  state.e2eSelections = new Map();
  state.e2eScoreFilterActive = false;

  resetSoftwareWindchillTransfer();
  closeSoftwareSelectionDialog();
  renderSoftwarePage();
  updateExportAvailability();
}

function excludeSoftwareRequirement() {
  const softwareId = state.activeSoftwareRequirementId;
  if (!softwareId) return;

  const item = state.softwareRequirements.find((entry) => String(entry.id || "") === String(softwareId));
  if (!item) return;

  state.softwareSelections.set(String(item.id || ""), {
    text: item.text || "",
    score: Number(item.score),
    excluded: true,
    acceptedAt: new Date().toISOString(),
  });
  state.e2eTests = [];
  state.e2eSelections = new Map();
  state.e2eScoreFilterActive = false;

  resetSoftwareWindchillTransfer();
  closeSoftwareSelectionDialog();
  renderSoftwarePage();
  updateExportAvailability();
}

function isSoftwareStepComplete() {
  return isSoftwareQualityReady() && state.softwareWindchillTransferComplete;
}

function isSoftwareQualityReady() {
  if (!state.softwareRequirements.length) return false;

  return state.softwareRequirements.every((item) => {
    const selection = state.softwareSelections.get(String(item.id || ""));
    if (!selection) return false;
    if (selection.excluded) return true;
    return !isCriticalScore(Number(item.score));
  });
}

function scoreAcceptedSoftwareRequirement(item, text) {
  if (state.runtimeMock) {
    return randomInteger(86, 99);
  }

  const originalText = String(item.text || "").trim();
  const normalizedText = text.trim();
  if (normalizedText.length < 40) return 70;
  if (originalText && normalizedText === originalText) return Number(item.score) || 0;

  const qualitySignals = [
    /system/i,
    /muss|shall|must/i,
    /wenn|falls|when|if/i,
    /fehler|exception|ungueltig|invalid/i,
    /pruef|test|verifiz|verify/i,
  ];
  const signalScore = qualitySignals.filter((pattern) => pattern.test(normalizedText)).length;
  return signalScore >= 4 ? Math.max(Number(item.score) || 0, 85) : Math.min(Number(item.score) || 84, 84);
}

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getFinalProductRequirements() {
  return state.requirements
    .map((requirement) => {
      const selection = state.finalSelections.get(Number(requirement.rowNumber));
      if (!selection || selection.excluded) return null;
      const result = state.results.find((entry) => Number(entry.rowNumber) === Number(requirement.rowNumber));

      return {
        rowNumber: Number(requirement.rowNumber),
        id: requirement.id,
        name: requirement.name,
        category: requirement.category,
        subcategory: requirement.subcategory,
        text: selection.text || requirement.text,
        score: Number(result?.score),
      };
    })
    .filter(Boolean);
}

async function generateSoftwareRequirements() {
  const endpoint = getAnalyzeEndpoint();
  if (!endpoint) {
    setStatus("Server erforderlich");
    alert("Bitte starte den lokalen Server und öffne die App über http://localhost:3000.");
    return;
  }

  const requirements = getFinalProductRequirements();
  if (!requirements.length || !isProductStepComplete()) return;

  setStatus("Leite Software Requirements ab...");
  els.generateSoftwareButton.disabled = true;
  els.generateSoftwareMenuButton.disabled = true;
  showProgress(requirements.length);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requirementType: "software", requirements }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Software Requirements konnten nicht abgeleitet werden");
    }

    addOpenAiUsage(data.openAiUsage);
    state.softwareRequirements = normalizeSoftwareRequirements(
      Array.isArray(data.softwareRequirements) ? data.softwareRequirements : [],
      requirements,
    );
    state.softwareSelections = new Map();
    state.e2eTests = [];
    state.e2eSelections = new Map();
    state.softwareScoreFilterActive = false;
    state.e2eScoreFilterActive = false;
    resetSoftwareWindchillTransfer();
    setStatus("Software Requirements erstellt");
    completeProgress(state.softwareRequirements.length);
  } catch (error) {
    setStatus("Fehler");
    hideProgress();
    alert(error.message);
  } finally {
    renderSoftwarePage();
    updateWorkflowState();
    updateContextualMenuActions();
  }
}

function activateScoreFilter() {
  if (!getCriticalScoreRows().size) return;

  state.scoreFilterActive = true;
  renderTable();
  renderMetrics();
  setStatus(`Filter: Score < ${PRODUCT_STEP_MIN_SCORE}`);
}

function activateSoftwareScoreFilter() {
  if (!getCriticalSoftwareRequirements().length) return;

  state.softwareScoreFilterActive = true;
  renderSoftwarePage();
  setStatus(`SR-Filter: Score < ${PRODUCT_STEP_MIN_SCORE}`);
}

function normalizeSoftwareRequirements(softwareRequirements, sourceRequirements) {
  const sourcesByRow = new Map(sourceRequirements.map((item) => [Number(item.rowNumber), item]));
  const sourcesById = new Map(sourceRequirements.map((item) => [String(item.id || ""), item]));

  return softwareRequirements.map((item, index) => {
    const source =
      sourcesByRow.get(Number(item.sourceRowNumber)) ||
      sourcesById.get(String(item.sourceId || "")) ||
      sourceRequirements[index] ||
      {};

    return {
      ...item,
      sourceRowNumber: Number(item.sourceRowNumber) || Number(source.rowNumber) || index + 1,
      sourceId: item.sourceId || source.id || "",
      id: buildSoftwareRequirementId(source, index),
    };
  });
}

function buildSoftwareRequirementId(source, index = 0) {
  const sourceId = String(source?.id || "").trim();
  if (sourceId) {
    if (/^PR(?=[_-])/i.test(sourceId)) {
      return sourceId.replace(/^PR/i, "SR");
    }

    if (/^PR\b/i.test(sourceId)) {
      return sourceId.replace(/^PR/i, "SR");
    }
  }

  const prefix = normalizeIdPart(els.idPrefix?.value || state.projectName || "REQ") || "REQ";
  const rowNumber = Number(source?.rowNumber);
  return `SR_${prefix}_${Number.isFinite(rowNumber) ? rowNumber : index + 1}`;
}

function clearScoreFilter() {
  state.scoreFilterActive = false;
  renderTable();
  renderMetrics();
  setStatus(state.analysisComplete ? "Analyse fertig" : `${state.requirements.length} Requirements`);
}

function clearSoftwareScoreFilter() {
  state.softwareScoreFilterActive = false;
  renderSoftwarePage();
  setStatus(state.softwareRequirements.length ? "Software Requirements erstellt" : "Software Requirements");
}

function getCriticalSoftwareRequirements() {
  return state.softwareRequirements.filter((item) => {
    const selection = state.softwareSelections.get(String(item.id || ""));
    return selection && !selection.excluded && isCriticalScore(Number(item.score));
  });
}

function renderE2ePage() {
  if (!els.e2eTestsBody) return;

  const finalSoftwareRequirements = getFinalSoftwareRequirements();
  const e2eScores = getE2eScores();
  const criticalE2eCount = getCriticalE2eTests().length;
  els.e2eDerivedMetric.textContent = `${getE2eDerivedCount()} / ${finalSoftwareRequirements.length}`;
  els.e2eScoreMetric.textContent = e2eScores.length
    ? String(Math.round(e2eScores.reduce((sum, score) => sum + score, 0) / e2eScores.length))
    : "-";
  els.e2eIssueMetric.textContent = String(criticalE2eCount);
  els.criticalE2eIssuesButton.disabled = criticalE2eCount === 0;
  els.criticalE2eIssuesButton.classList.toggle("is-active", state.e2eScoreFilterActive);
  els.e2eScoreFilterBar.hidden = !state.e2eScoreFilterActive;
  els.generateE2eButton.disabled = !hasProject() || !isSoftwareStepComplete();

  if (!finalSoftwareRequirements.length) {
    els.e2eScoreFilterBar.hidden = true;
    els.e2eTestsBody.innerHTML =
      `<tr><td colspan="5" class="empty">Schließe Software Requirements ab, um E2E TestCases abzuleiten.</td></tr>`;
    return;
  }

  const e2eBySourceId = new Map();
  state.e2eTests.forEach((item) => {
    const sourceId = String(item.sourceId || "");
    const entries = e2eBySourceId.get(sourceId) || [];
    entries.push(item);
    e2eBySourceId.set(sourceId, entries);
  });

  const rows = [];
  finalSoftwareRequirements.forEach((source) => {
    const allTests = e2eBySourceId.get(String(source.id || "")) || [];
    const tests = state.e2eScoreFilterActive
      ? allTests.filter((item) => isCriticalScore(Number(item.score)))
      : allTests;
    if (state.e2eScoreFilterActive && !tests.length) return;

    const displayTests = tests.length
      ? tests
      : [
          {
            id: buildE2eTestId(source),
            sourceId: source.id,
            text: "",
            score: null,
            pending: true,
          },
        ];

    rows.push(
      ...displayTests.map((item) => {
        const status = e2eDecisionStatus(item);
        const e2eId = item.id || buildE2eTestId(source);
        const selection = state.e2eSelections.get(String(e2eId));
        const isExcluded = selection?.excluded === true;
        return `
          <tr class="e2e-derived-row${item.pending ? " software-pending-row" : ""} ${isExcluded ? "excluded-row" : ""}" data-e2e-id="${escapeHtml(e2eId)}" tabindex="0">
            <td class="decision-cell">
              <span class="decision-icon ${status.className}" aria-label="${escapeHtml(status.label)}">
                ${status.icon}
              </span>
            </td>
            <td>${escapeHtml(e2eId)}</td>
            <td>
              <strong>${escapeHtml(source.id || "Software Requirement")}</strong><br />
              ${escapeHtml(source.text)}
            </td>
            <td>${item.pending ? '<span class="muted-cell">Noch nicht abgeleitet.</span>' : renderE2eContent(item)}</td>
            <td>${item.pending ? "-" : renderE2eScoreCell(item, isExcluded)}</td>
          </tr>
        `;
      }),
    );
  });

  if (!isSoftwareStepComplete() && rows.length) {
    rows.unshift(`
      <tr class="group-row">
        <td colspan="5">
          <span class="group-title">Gewählte Software Requirements</span>
          <span class="group-count">SR-Übertragung nach Windchill noch erforderlich</span>
        </td>
      </tr>
    `);
  }

  const emptyMessage = state.e2eScoreFilterActive
    ? `Keine E2E TestCases mit Score unter ${PRODUCT_STEP_MIN_SCORE} gefunden.`
    : "Keine übernommenen Software Requirements vorhanden.";
  els.e2eTestsBody.innerHTML = rows.length
    ? rows.join("")
    : `<tr><td colspan="5" class="empty">${emptyMessage}</td></tr>`;
}

function getFinalSoftwareRequirements() {
  return state.softwareRequirements
    .map((item) => {
      const selection = state.softwareSelections.get(String(item.id || ""));
      if (!selection || selection.excluded) return null;

      return {
        sourceRowNumber: Number(item.sourceRowNumber),
        sourceId: item.sourceId || "",
        id: item.id || "",
        text: selection.text || item.text || "",
        score: Number(selection.score),
      };
    })
    .filter(Boolean);
}

function getE2eScores() {
  return state.e2eTests
    .filter((item) => {
      const selection = state.e2eSelections.get(String(item.id || ""));
      return selection?.excluded !== true;
    })
    .map((item) => Number(item.score))
    .filter(Number.isFinite);
}

function getE2eDerivedCount() {
  const sourceIds = state.e2eTests.map((item) => String(item.sourceId || "")).filter(Boolean);
  return sourceIds.length ? new Set(sourceIds).size : state.e2eTests.length;
}

function renderE2eContent(item) {
  return `
    ${escapeHtml(item.text || "")}
    ${renderFlowSection("Testschritte", item.steps)}
    ${renderFlowSection("Erwartete Ergebnisse", item.expectedResults)}
    ${renderFlowSection("Testdaten", item.testData)}
    ${renderFlowSection("Vorbedingungen", item.preconditions)}
  `;
}

function renderE2eScoreCell(item, isExcluded = false) {
  if (isExcluded) return "-";

  const score = Number(item.score);
  if (!Number.isFinite(score)) return "-";

  const issues = Array.isArray(item.issues) ? item.issues : [];
  return `
    ${renderScoreValue(score, isCriticalScore(score))}
    ${item.rationale ? `<p class="score-rationale">${escapeHtml(item.rationale)}</p>` : ""}
    ${issues.length ? renderIssues(issues) : ""}
  `;
}

function e2eDecisionStatus(item) {
  if (item.pending) {
    return {
      className: "empty",
      icon: "",
      label: "E2E TestCase noch nicht abgeleitet",
    };
  }

  const selection = state.e2eSelections.get(String(item.id || ""));
  if (!selection) {
    return {
      className: "pending",
      icon: "?",
      label: "E2E TestCase noch nicht übernommen",
    };
  }

  if (selection.excluded) {
    return {
      className: "excluded",
      icon: "×",
      label: "E2E TestCase ausgeschlossen",
    };
  }

  const score = Number(item.score);
  if (isCriticalScore(score)) {
    return {
      className: "critical",
      icon: "!",
      label: `E2E TestCase Score unter ${PRODUCT_STEP_MIN_SCORE}`,
    };
  }

  return {
    className: "selected",
    icon: "&#10003;",
    label: "E2E TestCase übernommen",
  };
}

function handleE2eRowClick(event) {
  const row = event.target.closest(".e2e-derived-row");
  if (!row) return;

  openE2eSelectionDialog(row.dataset.e2eId);
}

function openE2eSelectionDialog(e2eId) {
  const item = state.e2eTests.find((entry) => String(entry.id || "") === String(e2eId || ""));
  if (!item) return;

  state.activeE2eTestId = item.id || "";
  const selection = state.e2eSelections.get(String(item.id || ""));
  const text = selection?.text || item.text || "";

  els.e2eSelectionId.textContent = item.id || "-";
  els.e2eSelectionSource.textContent = item.sourceId || "-";
  els.e2eSelectionScore.textContent = item.score ?? "-";
  els.e2eSelectionText.value = text;
  els.e2eSelectionIssues.innerHTML = item.issues?.length ? renderIssues(item.issues) : "Keine Hinweise vorhanden.";
  els.e2eSelectionOverlay.hidden = false;
}

function closeE2eSelectionDialog() {
  state.activeE2eTestId = "";
  els.e2eSelectionOverlay.hidden = true;
}

function deferE2eSelection() {
  const e2eId = state.activeE2eTestId;
  if (e2eId) {
    state.e2eSelections.delete(String(e2eId));
  }

  closeE2eSelectionDialog();
  renderE2ePage();
  updateWorkflowState();
}

function acceptE2eTest() {
  const e2eId = state.activeE2eTestId;
  if (!e2eId) return;

  const item = state.e2eTests.find((entry) => String(entry.id || "") === String(e2eId));
  const text = els.e2eSelectionText.value.trim();
  if (!item || !text) return;

  const updatedScore = scoreAcceptedE2eTest(item, text);
  item.text = text;
  item.score = updatedScore;
  if (isCriticalScore(updatedScore) && (!Array.isArray(item.issues) || !item.issues.length)) {
    item.issues = [
      {
        criterion: "E2E-Qualität",
        severity: "medium",
        explanation: "Der übernommene E2E TestCase erreicht den Mindestscore nicht.",
        suggestion: "Präzisiere Vorbedingungen, Testschritte, erwartete Ergebnisse und nachvollziehbare Prüfpunkte.",
      },
    ];
  }

  state.e2eSelections.set(String(item.id || ""), {
    text,
    score: updatedScore,
    excluded: false,
    acceptedAt: new Date().toISOString(),
  });

  closeE2eSelectionDialog();
  renderE2ePage();
  updateWorkflowState();
}

function excludeE2eTest() {
  const e2eId = state.activeE2eTestId;
  if (!e2eId) return;

  const item = state.e2eTests.find((entry) => String(entry.id || "") === String(e2eId));
  if (!item) return;

  state.e2eSelections.set(String(item.id || ""), {
    text: item.text || "",
    score: Number(item.score),
    excluded: true,
    acceptedAt: new Date().toISOString(),
  });

  closeE2eSelectionDialog();
  renderE2ePage();
  updateWorkflowState();
}

function isE2eQualityReady() {
  if (!state.e2eTests.length) return false;

  return state.e2eTests.every((item) => {
    const selection = state.e2eSelections.get(String(item.id || ""));
    if (!selection) return false;
    if (selection.excluded) return true;
    return !isCriticalScore(Number(item.score));
  });
}

function scoreAcceptedE2eTest(item, text) {
  if (state.runtimeMock) {
    return randomInteger(86, 99);
  }

  const originalText = String(item.text || "").trim();
  const normalizedText = text.trim();
  if (normalizedText.length < 40) return 70;
  if (originalText && normalizedText === originalText) return Number(item.score) || 0;

  const qualitySignals = [
    /given|gegeben|vorbeding/i,
    /when|wenn|schritt|step/i,
    /then|dann|erwart/i,
    /fehler|exception|invalid|ungueltig/i,
    /e2e|end.to.end|test/i,
  ];
  const signalScore = qualitySignals.filter((pattern) => pattern.test(normalizedText)).length;
  return signalScore >= 4 ? Math.max(Number(item.score) || 0, 85) : Math.min(Number(item.score) || 84, 84);
}

async function generateE2eTests() {
  const endpoint = getAnalyzeEndpoint();
  if (!endpoint) {
    setStatus("Server erforderlich");
    alert("Bitte starte den lokalen Server und öffne die App über http://localhost:3000.");
    return;
  }

  const requirements = getFinalSoftwareRequirements();
  if (!requirements.length || !isSoftwareStepComplete()) return;

  setStatus("Leite E2E TestCases ab...");
  els.generateE2eButton.disabled = true;
  els.generateE2eMenuButton.disabled = true;
  showProgress(requirements.length);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requirementType: "e2e", requirements }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "E2E TestCases konnten nicht abgeleitet werden");
    }

    addOpenAiUsage(data.openAiUsage);
    state.e2eTests = normalizeE2eTests(Array.isArray(data.e2eTests) ? data.e2eTests : [], requirements);
    state.e2eSelections = new Map();
    state.e2eScoreFilterActive = false;
    setStatus("E2E TestCases erstellt");
    completeProgress(state.e2eTests.length);
  } catch (error) {
    setStatus("Fehler");
    hideProgress();
    alert(error.message);
  } finally {
    renderE2ePage();
    updateWorkflowState();
    updateContextualMenuActions();
  }
}

function normalizeE2eTests(e2eTests, sourceRequirements) {
  const sourcesById = new Map(sourceRequirements.map((item) => [String(item.id || ""), item]));

  return e2eTests.map((item, index) => {
    const source = sourcesById.get(String(item.sourceId || "")) || sourceRequirements[index] || {};

    return {
      ...item,
      sourceId: item.sourceId || source.id || "",
      id: item.id || buildE2eTestId(source, index),
    };
  });
}

function buildE2eTestId(source, index = 0) {
  const sourceId = String(source?.id || "").trim();
  if (sourceId) {
    if (/^SR(?=[_-])/i.test(sourceId)) {
      return sourceId.replace(/^SR/i, "E2E");
    }

    if (/^SR\b/i.test(sourceId)) {
      return sourceId.replace(/^SR/i, "E2E");
    }
  }

  const prefix = normalizeIdPart(els.idPrefix?.value || state.projectName || "REQ") || "REQ";
  return `E2E_${prefix}_${index + 1}`;
}

function activateE2eScoreFilter() {
  if (!getCriticalE2eTests().length) return;

  state.e2eScoreFilterActive = true;
  renderE2ePage();
  setStatus(`E2E-Filter: Score < ${PRODUCT_STEP_MIN_SCORE}`);
}

function clearE2eScoreFilter() {
  state.e2eScoreFilterActive = false;
  renderE2ePage();
  setStatus(state.e2eTests.length ? "E2E TestCases erstellt" : "E2E TestCases");
}

function getCriticalE2eTests() {
  return state.e2eTests.filter((item) => {
    const selection = state.e2eSelections.get(String(item.id || ""));
    return selection && !selection.excluded && isCriticalScore(Number(item.score));
  });
}

function getCriticalScoreRows(excludedRows = getExcludedRows()) {
  return new Set(
    state.results
      .filter((result) => !excludedRows.has(Number(result.rowNumber)))
      .filter((result) => state.finalSelections.has(Number(result.rowNumber)))
      .filter((result) => isCriticalScore(Number(result.score)))
      .map((result) => Number(result.rowNumber)),
  );
}

function isCriticalScore(score) {
  return Number.isFinite(score) && score < PRODUCT_STEP_MIN_SCORE;
}

function updateExportAvailability() {
  const canTransferProduct = hasProject() && state.activeProcessStep === "product" && isProductQualityReady();
  const canTransferSoftware = hasProject() && state.activeProcessStep === "software" && isSoftwareQualityReady();

  if (state.activeProcessStep === "software") {
    els.exportButton.disabled = !canTransferSoftware || state.softwareWindchillTransferComplete;
    els.exportButton.title = state.softwareWindchillTransferComplete
      ? "Software Requirements wurden simuliert nach Windchill übertragen"
      : canTransferSoftware
        ? "Software Requirements simuliert nach Windchill übertragen"
        : "SR-Übertragung ist nach abgeschlossener SR-Übernahme verfügbar";
    updateWorkflowState();
    return;
  }

  els.exportButton.disabled = !canTransferProduct || state.productWindchillTransferComplete;
  els.exportButton.title = state.productWindchillTransferComplete
    ? "Product Requirements wurden simuliert nach Windchill übertragen"
    : canTransferProduct
      ? "Product Requirements simuliert nach Windchill übertragen"
      : "PR-Übertragung ist nach abgeschlossener PR-Bewertung verfügbar";
  updateWorkflowState();
}

function renderProductTransferState(productReady = isProductQualityReady()) {
  if (!els.productTransferBar) return;

  els.productTransferBar.hidden = !hasProject() || !state.analysisComplete || !productReady;
  els.productTransferBar.classList.toggle("is-complete", state.productWindchillTransferComplete);
  els.productTransferTitle.textContent = state.productWindchillTransferComplete
    ? "PRs nach Windchill übertragen"
    : "PR-Übertragung erforderlich";
  els.productTransferText.textContent = state.productWindchillTransferComplete
    ? `Simulierte Übertragung abgeschlossen${state.productWindchillTransferredAt ? `: ${new Date(state.productWindchillTransferredAt).toLocaleString()}` : "."}`
    : "Übertrage die abgeschlossenen Product Requirements nach Windchill, bevor Software Requirements bearbeitet werden können.";
  els.productTransferButton.disabled = state.productWindchillTransferComplete;
  els.productTransferButton.textContent = state.productWindchillTransferComplete
    ? "Übertragung abgeschlossen"
    : "PRs nach Windchill übertragen";
}

async function simulateProductWindchillTransfer() {
  if (!isProductQualityReady()) {
    alert(`Bitte schließe zuerst alle PR mit Score >= ${PRODUCT_STEP_MIN_SCORE} ab.`);
    return;
  }

  if (state.productWindchillTransferComplete) return;

  setStatus("Übertrage PRs nach Windchill...");
  els.exportButton.disabled = true;
  els.productTransferButton.disabled = true;
  els.productTransferButton.textContent = "Übertrage...";
  await delay(900);
  state.productWindchillTransferComplete = true;
  state.productWindchillTransferredAt = new Date().toISOString();
  setStatus("PRs übertragen");
  renderMetrics();
  updateExportAvailability();
  updateWorkflowState();
}

function renderSoftwareTransferState() {
  if (!els.softwareTransferBar) return;

  const softwareReady = isSoftwareQualityReady();
  els.softwareTransferBar.hidden = !hasProject() || !state.softwareRequirements.length || !softwareReady;
  els.softwareTransferBar.classList.toggle("is-complete", state.softwareWindchillTransferComplete);
  els.softwareTransferTitle.textContent = state.softwareWindchillTransferComplete
    ? "SRs nach Windchill übertragen"
    : "SR-Übertragung erforderlich";
  els.softwareTransferText.textContent = state.softwareWindchillTransferComplete
    ? `Simulierte Übertragung abgeschlossen${state.softwareWindchillTransferredAt ? `: ${new Date(state.softwareWindchillTransferredAt).toLocaleString()}` : "."}`
    : "Übertrage die abgeschlossenen Software Requirements nach Windchill, bevor der nächste Prozessschritt verfügbar wird.";
  els.softwareTransferButton.disabled = state.softwareWindchillTransferComplete;
  els.softwareTransferButton.textContent = state.softwareWindchillTransferComplete
    ? "Übertragung abgeschlossen"
    : "SRs nach Windchill übertragen";
}

async function simulateSoftwareWindchillTransfer() {
  if (!isSoftwareQualityReady()) {
    alert(`Bitte übernimm oder schließe zuerst alle SR ab. Übernommene SR benötigen Score >= ${PRODUCT_STEP_MIN_SCORE}.`);
    return;
  }

  if (state.softwareWindchillTransferComplete) return;

  setStatus("Übertrage SRs nach Windchill...");
  els.exportButton.disabled = true;
  els.softwareTransferButton.disabled = true;
  els.softwareTransferButton.textContent = "Übertrage...";
  await delay(900);
  state.softwareWindchillTransferComplete = true;
  state.softwareWindchillTransferredAt = new Date().toISOString();
  setStatus("SRs übertragen");
  renderSoftwarePage();
  updateExportAvailability();
  updateWorkflowState();
}

function simulateActiveWindchillTransfer() {
  if (state.activeProcessStep === "software") {
    return simulateSoftwareWindchillTransfer();
  }

  return simulateProductWindchillTransfer();
}

function resetProductWindchillTransfer() {
  state.productWindchillTransferComplete = false;
  state.productWindchillTransferredAt = "";
}

function resetSoftwareWindchillTransfer() {
  state.softwareWindchillTransferComplete = false;
  state.softwareWindchillTransferredAt = "";
}

function updateProjectActions() {
  const canSaveProject = Boolean(state.projectName || state.requirements.length);
  els.saveProjectButton.disabled = !canSaveProject;
  els.saveProjectButton.title = "Projektdatei speichern";
  els.saveProjectAsButton.disabled = !canSaveProject;
  updateContextualMenuActions();
}

function updateContextualMenuActions() {
  const projectOpen = hasProject();
  const isProductStep = state.activeProcessStep === "product";
  const isSoftwareStep = state.activeProcessStep === "software";
  const isE2eStep = state.activeProcessStep === "e2e";
  const canUseProductActions = projectOpen && isProductStep;
  const canDeriveSoftware =
    projectOpen && isSoftwareStep && isProductStepComplete() && state.finalScoreUpdates.size === 0;
  const canDeriveE2e = projectOpen && isE2eStep && isSoftwareStepComplete();

  els.openFileButton.disabled = !canUseProductActions;
  els.openFileButton.title = canUseProductActions ? "" : "Dateiimport ist nur im PR-Schritt verfügbar";
  els.openSettingsButton.disabled = !canUseProductActions;
  els.openSettingsButton.title = canUseProductActions ? "" : "Einstellungen sind nur im PR-Schritt verfügbar";
  els.analyzeButton.textContent = "PR Analysieren";
  els.analyzeButton.disabled = !canUseProductActions || state.requirements.length === 0;
  els.analyzeButton.title = canUseProductActions ? "" : "PR-Analyse ist nur im PR-Schritt verfügbar";
  els.generateSoftwareMenuButton.disabled = !canDeriveSoftware;
  els.generateSoftwareMenuButton.title = canDeriveSoftware
    ? ""
    : "Software Requirements können erst im SR-Schritt nach abgeschlossener PR-Zuordnung und Windchill-Übertragung abgeleitet werden";
  els.generateE2eMenuButton.disabled = !canDeriveE2e;
  els.generateE2eMenuButton.title = canDeriveE2e
    ? ""
    : "E2E TestCases können erst im E2E-Schritt nach abgeschlossener SR-Übernahme und Windchill-Übertragung abgeleitet werden";
}

async function saveProjectFile() {
  await saveProjectWithDialog();
}

async function saveProjectFileAs() {
  await saveProjectWithDialog();
}

async function saveProjectWithDialog() {
  if (!state.projectName && !state.requirements.length) return;

  const payload = createProjectPayload();
  const content = JSON.stringify(payload, null, 2);

  if ("showSaveFilePicker" in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: projectFileName(),
        types: [projectFilePickerType()],
      });
      await writeProjectContentToHandle(handle, content);
      state.projectFileHandle = handle;
      state.projectFileName = handle.name || projectFileName();
      updateProjectActions();
      setStatus("Projekt gespeichert");
      return;
    } catch (error) {
      if (error?.name === "AbortError") {
        setStatus("Speichern abgebrochen");
        return;
      }

      console.warn("Browser-Dateidialog nicht verfügbar, versuche lokalen Serverdialog.", error);
    }
  }

  const serverSaved = await saveProjectViaServerDialog(content);
  if (serverSaved) return;

  downloadProjectFile(content);
  setStatus("Projekt gespeichert");
}

async function saveProjectViaServerDialog(content) {
  const endpoint = getSaveProjectEndpoint();
  if (!endpoint) return false;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: projectFileName(),
        content,
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (data.canceled) {
      setStatus("Speichern abgebrochen");
      return true;
    }

    if (!response.ok) {
      return false;
    }

    state.projectFileName = data.fileName || projectFileName();
    state.projectFileHandle = null;
    updateProjectActions();
    setStatus("Projekt gespeichert");
    return true;
  } catch (error) {
    console.warn("Lokaler Speicherdialog nicht verfügbar, nutze Download-Fallback.", error);
    return false;
  }
}

async function writeProjectContentToHandle(handle, content) {
  const writable = await handle.createWritable();
  await writable.write(content);
  await writable.close();
}

function projectFilePickerType() {
  return {
    description: "Miele.DevPilot",
    accept: {
      "application/json": [".mdp"],
    },
  };
}

function createProjectPayload() {
  return {
    type: PROJECT_FILE_TYPE,
    version: PROJECT_FILE_VERSION,
    savedAt: new Date().toISOString(),
    project: {
      name: state.projectName || projectNameFromSource(),
      description: state.projectDescription,
    },
    source: {
      fileName: state.sourceFileName,
      sheetName: state.sheetName,
      rows: state.rows,
      headers: state.headers,
    },
    config: getCurrentImportConfig(),
    state: {
      requirements: state.requirements,
      results: state.results,
      softwareRequirements: state.softwareRequirements,
      softwareSelections: [...state.softwareSelections.entries()].map(([id, selection]) => ({
        id,
        ...selection,
      })),
      e2eTests: state.e2eTests,
      e2eSelections: [...state.e2eSelections.entries()].map(([id, selection]) => ({
        id,
        ...selection,
      })),
      finalSelections: [...state.finalSelections.entries()].map(([rowNumber, selection]) => ({
        rowNumber: Number(rowNumber),
        ...selection,
      })),
      analysisComplete: state.analysisComplete,
      generatedIds: state.generatedIds,
      activeProcessStep: state.activeProcessStep,
      openAiCostSummary: normalizedOpenAiCostSummary(),
      productWindchillTransferComplete: state.productWindchillTransferComplete,
      productWindchillTransferredAt: state.productWindchillTransferredAt,
      softwareWindchillTransferComplete: state.softwareWindchillTransferComplete,
      softwareWindchillTransferredAt: state.softwareWindchillTransferredAt,
    },
  };
}

function downloadProjectFile(content) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = projectFileName();
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function loadProjectPayload(payload, fileName, handle = null) {
  if (!payload || payload.type !== PROJECT_FILE_TYPE) {
    throw new Error("Unbekanntes Projektformat");
  }

  if (payload.version !== PROJECT_FILE_VERSION) {
    throw new Error(`Nicht unterstützte Projektversion: ${payload.version}`);
  }

  const source = payload.source || {};
  if (!Array.isArray(source.rows) || !Array.isArray(source.headers)) {
    throw new Error("Projektdatei enthält keine gültigen Quelldaten");
  }

  state.workbook = null;
  state.rows = source.rows;
  state.headers = source.headers.map((header) => String(header || ""));
  state.sheetName = source.sheetName || "Projekt";
  state.sourceFileName = source.fileName || fileName;
  state.projectName = payload.project?.name || projectNameFromFile(fileName);
  state.projectDescription = payload.project?.description || "";
  state.projectFileHandle = handle;
  state.projectFileName = fileName || "";
  state.results = Array.isArray(payload.state?.results) ? payload.state.results : [];
  state.softwareRequirements = Array.isArray(payload.state?.softwareRequirements) ? payload.state.softwareRequirements : [];
  state.softwareSelections = new Map(
    (Array.isArray(payload.state?.softwareSelections) ? payload.state.softwareSelections : []).map((selection) => [
      String(selection.id || ""),
      {
        text: selection.text || "",
        score: Number(selection.score),
        excluded: Boolean(selection.excluded),
        acceptedAt: selection.acceptedAt || "",
      },
    ]),
  );
  state.e2eTests = Array.isArray(payload.state?.e2eTests) ? payload.state.e2eTests : [];
  state.e2eSelections = new Map(
    (Array.isArray(payload.state?.e2eSelections) ? payload.state.e2eSelections : []).map((selection) => [
      String(selection.id || ""),
      {
        text: selection.text || "",
        score: Number(selection.score),
        excluded: Boolean(selection.excluded),
        acceptedAt: selection.acceptedAt || "",
      },
    ]),
  );
  state.finalSelections = new Map(
    (Array.isArray(payload.state?.finalSelections) ? payload.state.finalSelections : []).map((selection) => [
      Number(selection.rowNumber),
      {
        choice: selection.choice,
        text: selection.text || "",
        excluded: Boolean(selection.excluded),
      },
    ]),
  );
  state.finalScoreUpdates = new Set();
  state.openAiCostSummary = normalizedOpenAiCostSummary(payload.state?.openAiCostSummary);
  state.scoreFilterActive = false;
  state.softwareScoreFilterActive = false;
  state.e2eScoreFilterActive = false;
  state.productWindchillTransferComplete = Boolean(payload.state?.productWindchillTransferComplete);
  state.productWindchillTransferredAt = payload.state?.productWindchillTransferredAt || "";
  state.softwareWindchillTransferComplete = Boolean(payload.state?.softwareWindchillTransferComplete);
  state.softwareWindchillTransferredAt = payload.state?.softwareWindchillTransferredAt || "";
  state.analysisComplete = Boolean(payload.state?.analysisComplete || state.results.length);
  state.activeProcessStep = payload.state?.activeProcessStep || "product";

  els.fileState.textContent = state.projectName ? `${state.projectName} (Projekt)` : fileName;
  els.sheetSelect.innerHTML = "";
  els.sheetSelect.append(new Option(state.sheetName, state.sheetName));
  els.sheetSelect.value = state.sheetName;
  els.sheetSelect.disabled = false;
  els.headerRow.disabled = false;
  fillColumnSelects();
  applyImportConfig(payload.config || {});

  state.requirements = Array.isArray(payload.state?.requirements)
    ? payload.state.requirements
    : buildRequirementsFromCurrentConfig();
  state.generatedIds = Boolean(payload.state?.generatedIds);
  setAutoIdVisible(state.generatedIds);
  els.analyzeButton.disabled = state.requirements.length === 0;
  updateProjectActions();
  updateExportAvailability();
  renderWorkspaceState();
  renderProcessPages();
  renderTable();
  renderMetrics();
}

function getCurrentImportConfig() {
  return {
    requirementType: state.requirementType,
    sheetName: state.sheetName,
    headerRow: els.headerRow.value,
    categoryColumn: els.categoryColumn.value,
    subcategoryColumn: els.subcategoryColumn.value,
    nameColumn: els.nameColumn.value,
    requirementColumn: els.requirementColumn.value,
    idColumn: els.idColumn.value,
    idPrefix: els.idPrefix.value,
  };
}

function applyImportConfig(config) {
  state.requirementType = config.requirementType || "product";
  els.requirementType.value = state.requirementType;
  els.headerRow.value = config.headerRow || "1";
  setSelectValue(els.categoryColumn, config.categoryColumn);
  setSelectValue(els.subcategoryColumn, config.subcategoryColumn);
  setSelectValue(els.nameColumn, config.nameColumn);
  setSelectValue(els.requirementColumn, config.requirementColumn);
  setSelectValue(els.idColumn, config.idColumn);
  els.idPrefix.value = config.idPrefix || "REQ";
  updateAutoIdControls();
}

function setSelectValue(select, value) {
  const nextValue = value == null ? "" : String(value);
  select.value = [...select.options].some((option) => option.value === nextValue) ? nextValue : "";
}

function projectFileName() {
  const rawName = state.projectName || state.sourceFileName || "Miele.DevPilot";
  const baseName = rawName.replace(/\.[^.]+$/, "").replace(/[^a-z0-9._-]+/gi, "-") || "Miele.DevPilot";
  return `${baseName}.mdp`;
}

function projectNameFromSource() {
  if (!state.sourceFileName) return "Miele.DevPilot";
  return state.sourceFileName.replace(/\.[^.]+$/, "");
}

function projectNameFromFile(fileName) {
  return String(fileName || "Miele.DevPilot").replace(/\.mdp$|\.miele-devpilot\.json$|\.json$/i, "");
}

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function formatUsd(value) {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(amount);
}

function formatInteger(value) {
  return new Intl.NumberFormat("de-DE", {
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function guessColumn(needles) {
  return state.headers.findIndex((header) => needles.some((needle) => header.toLowerCase().includes(needle)));
}

function updateAutoIdControls() {
  setAutoIdVisible(els.idColumn.value === "" && state.headers.length > 0);
}

function setAutoIdVisible(isVisible) {
  els.autoIdGroup.hidden = !isVisible;
  els.idPrefix.disabled = !isVisible;
  els.idFieldRow.classList.toggle("has-auto-id", isVisible);
}

function withGeneratedIds(requirements, rawPrefix) {
  const prefix = normalizeIdPart(rawPrefix) || "REQ";
  const groupNumbers = new Map();
  const requirementNumbers = new Map();

  return requirements.map((requirement) => {
    const category = requirement.category || "Ohne Kategorie";
    const subcategory = requirement.subcategory || "Ohne Subkategorie";
    const groupKey = `${category}\u0000${subcategory}`;

    if (!groupNumbers.has(groupKey)) {
      groupNumbers.set(groupKey, groupNumbers.size + 1);
      requirementNumbers.set(groupKey, 0);
    }

    const categoryNumber = groupNumbers.get(groupKey);
    const requirementNumber = requirementNumbers.get(groupKey) + 1;
    requirementNumbers.set(groupKey, requirementNumber);

    return {
      ...requirement,
      id: `PR_${prefix}_${categoryNumber}.${requirementNumber}`,
    };
  });
}

function normalizeIdPart(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function columnValueOrDefault(guessedIndex, defaultIndex) {
  if (guessedIndex >= 0) return String(guessedIndex);
  if (defaultIndex >= 0 && defaultIndex < state.headers.length) return String(defaultIndex);
  return "";
}

function selectIndex(value) {
  return value === "" ? -1 : Number(value);
}

function columnName(index) {
  let name = "";
  let number = index + 1;
  while (number > 0) {
    const modulo = (number - 1) % 26;
    name = String.fromCharCode(65 + modulo) + name;
    number = Math.floor((number - modulo) / 26);
  }
  return name;
}

function scoreClass(score) {
  if (score >= 80) return "good";
  if (score >= 55) return "warn";
  return "bad";
}

function setStatus(text) {
  els.statusPill.textContent = text;
}

function getAnalyzeEndpoint() {
  return getApiEndpoint("api/analyze");
}

function getSaveProjectEndpoint() {
  return getApiEndpoint("api/save-project");
}

function getRuntimeEndpoint() {
  return getApiEndpoint("api/runtime");
}

function getApiEndpoint(path) {
  if (window.location.protocol === "file:") {
    return new URL(path, LOCAL_SERVER_APP_URL).href;
  }

  return new URL(path, window.location.href).pathname;
}

async function loadRuntimeInfo() {
  try {
    const response = await fetch(getRuntimeEndpoint());
    if (!response.ok) return;
    const data = await response.json();
    state.runtimeInfo = data;
    state.runtimeMock = Boolean(data.mock);
  } catch {
    state.runtimeInfo = null;
    state.runtimeMock = false;
  }
}

function formatGitDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function showProgress(total) {
  els.progressOverlay.hidden = false;
  els.progressTitle.textContent = "Requirements werden analysiert";
  els.progressText.textContent = "Die Analyse wird vorbereitet.";
  els.progressBar.style.width = "0%";
  els.progressDetail.textContent = `0 von ${total} Requirements verarbeitet`;
}

function updateProgress({ processed, total, batchNumber, totalBatches }) {
  const percent = total > 0 ? Math.round((processed / total) * 100) : 0;
  els.progressText.textContent = `Batch ${batchNumber} von ${totalBatches} wird verarbeitet.`;
  els.progressBar.style.width = `${percent}%`;
  els.progressDetail.textContent = `${processed} von ${total} Requirements verarbeitet`;
}

function completeProgress(processed) {
  els.progressTitle.textContent = "Analyse abgeschlossen";
  els.progressText.textContent = "Alle verfügbaren Ergebnisse wurden verarbeitet.";
  els.progressBar.style.width = "100%";
  els.progressDetail.textContent = `${processed} Requirements analysiert`;
  window.setTimeout(hideProgress, 900);
}

function hideProgress() {
  els.progressOverlay.hidden = true;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

loadRuntimeInfo().finally(() => {
  renderWorkspaceState();
  renderProcessPages();
  updateProjectActions();
  renderMetrics();
});
