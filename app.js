const DEFAULT_LANGUAGE = "de";
const LANGUAGES = {
  de: "Deutsch",
  en: "English",
};

const state = {
  workbook: null,
  sheetName: "",
  rows: [],
  headers: [],
  techTypes: [],
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
  changedProductRequirementRows: new Set(),
  changedSoftwareRequirementIds: new Set(),
  productTransferChangeRows: new Set(),
  softwareTransferChangeIds: new Set(),
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
  language: DEFAULT_LANGUAGE,
  progressStartedAt: 0,
  progressProcessed: 0,
  progressTotal: 0,
  progressBatchNumber: 0,
  progressTotalBatches: 0,
  progressEstimatedRemainingMs: null,
  progressInitialEstimatedMs: null,
  progressTimerId: null,
  progressMode: "",
  progressInputCharCount: 0,
};

const PROJECT_FILE_TYPE = "miele-devpilot-project";
const PROJECT_FILE_VERSION = 1;
const ANALYSIS_BATCH_SIZE = 5;
const PRODUCT_STEP_MIN_SCORE = 85;
const LOCAL_SERVER_APP_URL = "http://localhost:3000/Miele.DevPilot/";
const LEGACY_PR_ANALYSIS_TIMING_STORAGE_KEY = "mieleDevPilot.prAnalysisTiming";
const PROGRESS_TIMING_STORAGE_KEY = "mieleDevPilot.progressTiming";
const LANGUAGE_STORAGE_KEY = "mieleDevPilot.language";
const PROGRESS_TIMING_DEFAULTS = {
  default: { msPerRequirement: 4500, msPer1000Chars: 650, batchOverheadMs: 1200 },
  "pr-analysis": { msPerRequirement: 4500, msPer1000Chars: 650, batchOverheadMs: 1200 },
  "sr-derivation": { msPerRequirement: 7000, msPer1000Chars: 900, batchOverheadMs: 1200 },
  "e2e-derivation": { msPerRequirement: 6500, msPer1000Chars: 850, batchOverheadMs: 1200 },
};
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
const WORKFLOW_STEP_TITLES = {
  de: {
    product: ["1. Product", "Requirement"],
    software: ["2. Software", "Requirement"],
    e2e: ["E2E", "TestCases"],
    usecase: ["UseCase"],
    userstory: ["UserStory"],
    "app-test": ["App TestCase"],
  },
  en: {
    product: ["1. Product", "Requirement"],
    software: ["2. Software", "Requirement"],
    e2e: ["E2E", "TestCases"],
    usecase: ["UseCase"],
    userstory: ["UserStory"],
    "app-test": ["App TestCase"],
  },
};
const UI_TRANSLATIONS = {
  en: {
    "Sprache": "Language",
    "Sprache auswählen": "Select language",
    "AI Engineering Platform": "AI Engineering Platform",
    "Von Produktanforderungen zu umsetzbaren Entwicklungs- und Testartefakten.": "From product requirements to actionable development and test artifacts.",
    "Projekt": "Project",
    "Kein Projekt geöffnet": "No project open",
    "OpenAI Kosten": "OpenAI costs",
    "0 Tokens": "0 tokens",
    "0 Tokens geschätzt (Preise nicht konfiguriert)": "0 tokens estimated (prices not configured)",
    "Bereit": "Ready",
    "Hauptmenü": "Main menu",
    "Neues Projekt": "New project",
    "Projekt laden": "Open project",
    "Projekt speichern": "Save project",
    "Projekt speichern unter...": "Save project as...",
    "Import": "Import",
    "Datei": "File",
    "Requirements aus Windchill laden ist noch nicht verfügbar": "Loading requirements from Windchill is not available yet",
    "Analyse": "Analysis",
    "Einstellungen": "Settings",
    "PR Analysieren": "Analyze PR",
    "PR analysieren": "Analyze PR",
    "Software Requirements ableiten": "Derive Software Requirements",
    "SR neu ableiten": "Derive SR again",
    "E2E TestCases ableiten": "Derive E2E TestCases",
    "E2E TestCase neu ableiten": "Derive E2E TestCase again",
    "Export": "Export",
    "Nach Windchill": "To Windchill",
    "Windchill-Export ist noch nicht verfügbar": "Windchill export is not available yet",
    "Hilfe": "Help",
    "Workspace": "Workspace",
    "Lege ein neues Projekt an oder lade eine Projektdatei, um Requirements zu importieren und zu bewerten.": "Create a new project or open a project file to import and assess requirements.",
    "About": "About",
    "Von Product Requirements zu qualitätsgesicherten Software Requirements, UseCases und Testartefakten.": "From Product Requirements to quality-assured Software Requirements, UseCases, and test artifacts.",
    "Zweck": "Purpose",
    "Miele.DevPilot unterstützt Requirements Engineering durch strukturierte Analyse, Bewertung, Ableitung und Übernahme von Requirements im Projektkontext.": "Miele.DevPilot supports requirements engineering through structured analysis, assessment, derivation, and acceptance of requirements in the project context.",
    "Arbeitsstand": "Current status",
    "Aktuell verfügbar sind PR-Import und Analyse, Projektdateien sowie die Ableitung und Prüfung von SR inklusive Score-Schwelle und Übernahmestatus.": "Currently available: PR import and analysis, project files, and SR derivation and review including score threshold and acceptance status.",
    "Version": "Version",
    "Autor": "Author",
    "Build-Informationen": "Build information",
    "Build": "Build",
    "Stand": "Date",
    "Pfad": "Path",
    "Bei geöffnetem Projekt kannst du auch direkt über den Prozessablauf zurückspringen.": "When a project is open, you can also navigate back directly through the workflow.",
    "Zurück zum Workspace": "Back to workspace",
    "Prozessschritte": "Process steps",
    "Aktueller Schritt": "Current step",
    "Step 1 abschließen": "Complete step 1",
    "Product Requirements": "Product Requirements",
    "Product Requirements analysieren": "Analyze Product Requirements",
    "Requirements": "Requirements",
    "Durchschnitt": "Average",
    "Kritische Hinweise": "Critical issues",
    "PR-Übertragung erforderlich": "PR transfer required",
    "Übertrage die abgeschlossenen Product Requirements nach Windchill, bevor Software Requirements bearbeitet werden können.": "Transfer the completed Product Requirements to Windchill before Software Requirements can be processed.",
    "PRs nach Windchill übertragen": "Transfer PRs to Windchill",
    "Filter aktiv: Requirements mit Score < 85": "Filter active: Requirements with score < 85",
    "Filter beenden": "Clear filter",
    "Status": "Status",
    "Zeile": "Row",
    "Name": "Name",
    "Requirement": "Requirement",
    "Score": "Score",
    "Hinweise": "Issues",
    "AI-Vorschlag": "AI suggestion",
    "Lade eine Excel-Datei, um Requirements zu prüfen.": "Load an Excel file to review requirements.",
    "Aus Product Requirements ableiten": "Derive from Product Requirements",
    "SR abgeleitet": "SR derived",
    "SR Durchschnitt": "SR average",
    "Kritische SR": "Critical SR",
    "SR-Übertragung erforderlich": "SR transfer required",
    "Übertrage die abgeschlossenen Software Requirements nach Windchill, bevor der nächste Prozessschritt verfügbar wird.": "Transfer the completed Software Requirements to Windchill before the next process step becomes available.",
    "SRs nach Windchill übertragen": "Transfer SRs to Windchill",
    "Gefiltert: Software Requirements mit Score < 85": "Filtered: Software Requirements with score < 85",
    "SR-ID": "SR ID",
    "Verwendetes Product Requirement": "Used Product Requirement",
    "Software Requirement": "Software Requirement",
    "Schließe Product Requirements ab, um Software Requirements abzuleiten.": "Complete Product Requirements to derive Software Requirements.",
    "Leite Software Requirement neu ab...": "Deriving Software Requirement again...",
    "SR wird abgeleitet...": "Deriving SR...",
    "Software Requirement neu abgeleitet": "Software Requirement derived again",
    "Software Requirement konnte nicht neu abgeleitet werden": "Software Requirement could not be derived again",
    "Das zugehörige Product Requirement wurde nicht gefunden.": "The related Product Requirement was not found.",
    "Prozessschritt": "Process step",
    "UseCase-Erstellung und Review werden als eigener Arbeitsbereich vorbereitet.": "UseCase creation and review are prepared as a separate workspace.",
    "UserStory-Erstellung und Qualitätsprüfung werden als eigener Arbeitsbereich vorbereitet.": "UserStory creation and quality review are prepared as a separate workspace.",
    "Aus Software Requirements ableiten": "Derive from Software Requirements",
    "E2E TestCases abgeleitet": "E2E TestCases derived",
    "E2E TestCase Durchschnitt": "E2E TestCase average",
    "Kritische E2E TestCases": "Critical E2E TestCases",
    "Gefiltert: E2E TestCases mit Score < 85": "Filtered: E2E TestCases with score < 85",
    "E2E-ID": "E2E ID",
    "Verwendetes Software Requirement": "Used Software Requirement",
    "E2E TestCase": "E2E TestCase",
    "Schließe Software Requirements ab, um E2E TestCases abzuleiten.": "Complete Software Requirements to derive E2E TestCases.",
    "App-TestCase-Erstellung und Prüfung werden als eigener Arbeitsbereich vorbereitet.": "App TestCase creation and review are prepared as a separate workspace.",
    "Import und Analyse konfigurieren": "Configure import and analysis",
    "Einstellungen schließen": "Close settings",
    "Requirement-Typ": "Requirement type",
    "Software Requirements - spaeter verfuegbar": "Software Requirements - available later",
    "Sheet": "Sheet",
    "Header-Zeile": "Header row",
    "Kategorie-Spalte": "Category column",
    "Subkategorie-Spalte": "Subcategory column",
    "Name-Spalte": "Name column",
    "Requirement-Spalte": "Requirement column",
    "ID-Spalte": "ID column",
    "ID-Kennung": "ID prefix",
    "z.B. CRM": "e.g. CRM",
    "TechType Gruppen-Spalte": "TechType group column",
    "TechType Designation-Spalte": "TechType designation column",
    "Nach dem Upload koennen Tabellenblatt, Requirement-Spalten und TechType-Spalten frei gewaehlt werden.": "After upload, the sheet, requirement columns, and TechType columns can be selected freely.",
    "Fertig": "Done",
    "Neues Projekt anlegen": "Create new project",
    "Projekt-Dialog schließen": "Close project dialog",
    "Projektname": "Project name",
    "z.B. Miele.DevPilot Review": "e.g. Miele.DevPilot Review",
    "Kurzbeschreibung": "Short description",
    "Kurze Beschreibung des Projektinhalts": "Short description of the project content",
    "Abbrechen": "Cancel",
    "Projekt anlegen": "Create project",
    "Analyse läuft": "Analysis running",
    "Requirements werden analysiert": "Requirements are being analyzed",
    "Die Analyse wird vorbereitet.": "Preparing analysis.",
    "Zeitfortschritt": "Time progress",
    "Restzeit wird berechnet": "Calculating remaining time",
    "0 von 0 Requirements verarbeitet": "0 of 0 requirements processed",
    "Finalen Requirement-Text auswählen": "Select final requirement text",
    "Text für den finalen Stand festlegen": "Define text for the final state",
    "Dialog schließen": "Close dialog",
    "Gruppe": "Group",
    "Originaltext": "Original text",
    "Original verwenden": "Use original",
    "AI Verbesserung": "AI improvement",
    "Was soll verbessert werden?": "What should be improved?",
    "z. B. klarer formulieren, messbarer machen, atomarer schneiden": "e.g. make clearer, more measurable, more atomic",
    "Anhänge für die Verbesserung": "Attachments for the improvement",
    "Textdateien, CSV, JSON, XML oder Markdown werden als zusätzlicher Kontext berücksichtigt.": "Text files, CSV, JSON, XML, or Markdown are considered as additional context.",
    "Text-, CSV-, JSON-, XML-, Markdown- und Excel-Dateien werden als zusätzlicher Kontext berücksichtigt.": "Text, CSV, JSON, XML, Markdown, and Excel files are considered as additional context.",
    "+ Anhang hinzufügen": "+ Add attachment",
    "AI-Vorschlag verwenden": "Use AI suggestion",
    "Hinweise aus der Analyse": "Issues from analysis",
    "Noch keine Analysehinweise vorhanden.": "No analysis issues available yet.",
    "TechTypes": "TechTypes",
    "Alle TechTypes ausgewählt": "All TechTypes selected",
    "Alle auswählen": "Select all",
    "Requirement ausschließen": "Exclude requirement",
    "Auswahl später treffen": "Decide later",
    "Software Requirement übernehmen": "Accept Software Requirement",
    "SR prüfen und final übernehmen": "Review and finally accept SR",
    "Quelle": "Source",
    "Akzeptanzkriterien": "Acceptance criteria",
    "Keine Akzeptanzkriterien vorhanden.": "No acceptance criteria available.",
    "Keine TechTypes zugeordnet.": "No TechTypes assigned.",
    "z. B. atomarer formulieren, Akzeptanzkriterien präzisieren, Fehlerfall ergänzen": "e.g. make more atomic, refine acceptance criteria, add error case",
    "SR übernehmen": "Accept SR",
    "Kritische Hinweise": "Critical issues",
    "Keine Hinweise vorhanden.": "No issues available.",
    "SR ausschließen": "Exclude SR",
    "E2E TestCase übernehmen": "Accept E2E TestCase",
    "E2E TestCase prüfen und final übernehmen": "Review and finally accept E2E TestCase",
    "TestCase-Tabelle": "TestCase table",
    "z. B. präzisere Vorbedingungen, konkretere erwartete Ergebnisse, negative Tests ergänzen": "e.g. refine preconditions, make expected results more concrete, add negative tests",
    "E2E TestCase ausschließen": "Exclude E2E TestCase",
    "Kein Projekt": "No project",
    "In Vorbereitung": "In preparation",
    "Abgeschlossen": "Completed",
    "Verfügbar": "Available",
    "Projekt erforderlich": "Project required",
    "Git-Version nicht verfügbar": "Git version not available",
    "Nicht verfügbar": "Not available",
    "lokale Änderungen": "local changes",
    "Tokens geschätzt": "tokens estimated",
    "Preise nicht konfiguriert": "prices not configured",
    "Lese Datei...": "Reading file...",
    "Laden abgebrochen": "Loading canceled",
    "Lade Projekt...": "Loading project...",
    "Projekt geladen": "Project loaded",
    "Fehler": "Error",
    "Projekt angelegt": "Project created",
    "Server erforderlich": "Server required",
    "Analysiere...": "Analyzing...",
    "Analyse fertig": "Analysis complete",
    "Keine Requirements in der gewaehlten Spalte gefunden.": "No requirements found in the selected column.",
    "Ohne Kategorie": "No category",
    "Ohne Subkategorie": "No subcategory",
    "Noch kein AI-Vorschlag vorhanden. Bitte zuerst die Analyse ausführen.": "No AI suggestion available yet. Please run the analysis first.",
    "Keine TechTypes erkannt": "No TechTypes detected",
    "Keine TechTypes verfügbar. Prüfe im Datei-Import die TechType-Spalten für Gruppierung und Appliance Designation.": "No TechTypes available. Check the TechType columns for grouping and appliance designation in the file import.",
    "Gruppe ein- oder ausklappen": "Expand or collapse group",
    "Quality Score wird aktualisiert": "Quality score is being updated",
    "Finaler Text noch nicht ausgewählt": "Final text not selected yet",
    "Finale Bewertung erforderlich": "Final assessment required",
    "Requirement ausgeschlossen": "Requirement excluded",
    "Finaler Text ausgewählt": "Final text selected",
    "Bewerte finalen Text...": "Assessing final text...",
    "Final bewertet": "Final text assessed",
    "Keine wesentlichen Hinweise": "No significant issues",
    "Aktualisiert...": "Updating...",
    "Requirements zugeordnet": "Requirements assigned",
    "Übertrage zuerst die Product Requirements nach Windchill.": "Transfer the Product Requirements to Windchill first.",
    "Noch nicht abgeleitet.": "Not derived yet.",
    "Noch keine Software Requirements abgeleitet.": "No Software Requirements derived yet.",
    "Software Requirement noch nicht abgeleitet": "Software Requirement not derived yet",
    "Software Requirement noch nicht übernommen": "Software Requirement not accepted yet",
    "Software Requirement ausgeschlossen": "Software Requirement excluded",
    "Software Requirement abgeleitet": "Software Requirement derived",
    "AI verbessert...": "AI improving...",
    "AI verbessert Product Requirement...": "AI improving Product Requirement...",
    "Product Requirement verbessert": "Product Requirement improved",
    "AI verbessert Software Requirement...": "AI improving Software Requirement...",
    "Software Requirement verbessert": "Software Requirement improved",
    "Leite Software Requirements ab...": "Deriving Software Requirements...",
    "Software Requirements erstellt": "Software Requirements created",
    "Keine übernommenen Software Requirements vorhanden.": "No accepted Software Requirements available.",
    "Gruppierung": "Grouping",
    "Beschreibung": "Description",
    "SR-Referenz": "SR reference",
    "PR-Referenz": "PR reference",
    "Vorbedingungen": "Preconditions",
    "Testdaten": "Test data",
    "Testschritte": "Test steps",
    "Schritt": "Step",
    "E2E TestCase noch nicht abgeleitet": "E2E TestCase not derived yet",
    "E2E TestCase noch nicht übernommen": "E2E TestCase not accepted yet",
    "E2E TestCase ausgeschlossen": "E2E TestCase excluded",
    "E2E TestCase übernommen": "E2E TestCase accepted",
    "AI verbessert E2E TestCase...": "AI improving E2E TestCase...",
    "E2E TestCase verbessert": "E2E TestCase improved",
    "Leite E2E TestCase neu ab...": "Deriving E2E TestCase again...",
    "E2E TestCase wird abgeleitet...": "Deriving E2E TestCase...",
    "E2E TestCase neu abgeleitet": "E2E TestCase derived again",
    "E2E TestCase konnte nicht neu abgeleitet werden": "E2E TestCase could not be derived again",
    "Leite E2E TestCases ab...": "Deriving E2E TestCases...",
    "E2E TestCases erstellt": "E2E TestCases created",
    "Gewählte Software Requirements": "Selected Software Requirements",
    "SR-Übertragung nach Windchill noch erforderlich": "SR transfer to Windchill still required",
    "Projektdatei speichern": "Save project file",
    "Dateiimport ist nur im PR-Schritt verfügbar": "File import is only available in the PR step",
    "Einstellungen sind nur im PR-Schritt verfügbar": "Settings are only available in the PR step",
    "PR-Analyse ist nur im PR-Schritt verfügbar": "PR analysis is only available in the PR step",
    "Projekt gespeichert": "Project saved",
    "Speichern abgebrochen": "Save canceled",
    "Analyse abgeschlossen": "Analysis complete",
    "Alle verfügbaren Ergebnisse wurden verarbeitet.": "All available results have been processed.",
    "Übertrage...": "Transferring...",
    "Übertragung abgeschlossen": "Transfer complete",
    "PRs übertragen": "PRs transferred",
    "SRs übertragen": "SRs transferred",
    "Änderung erkannt": "Change detected",
    "Quelle geändert - neu ableiten erforderlich": "Source changed - derivation required",
    "Software Requirement geändert - TestCase neu ableiten erforderlich": "Software Requirement changed - TestCase derivation required",
    "Aktuellen Arbeitsstand verwerfen und ein neues Projekt anlegen?": "Discard the current work state and create a new project?",
    "Bitte starte den lokalen Server und öffne die App über http://localhost:3000. Die Analyse-API ist über file:// nicht verfügbar.": "Please start the local server and open the app at http://localhost:3000. The analysis API is not available via file://.",
    "Bitte starte den lokalen Server und öffne die App über http://localhost:3000.": "Please start the local server and open the app at http://localhost:3000.",
    "Bitte beschreibe, was die AI am Product Requirement verbessern soll.": "Please describe what the AI should improve in the Product Requirement.",
    "Bitte wähle mindestens einen TechType aus.": "Please select at least one TechType.",
    "Bitte beschreibe, was die AI am Software Requirement verbessern soll.": "Please describe what the AI should improve in the Software Requirement.",
    "Das zugehörige Product Requirement wurde nicht gefunden.": "The associated Product Requirement was not found.",
    "Bitte beschreibe, was die AI am E2E TestCase verbessern soll.": "Please describe what the AI should improve in the E2E TestCase.",
    "Das zugehörige Software Requirement wurde nicht gefunden.": "The associated Software Requirement was not found.",
    "Analyse fehlgeschlagen": "Analysis failed",
    "Finale Bewertung fehlgeschlagen": "Final assessment failed",
    "Product Requirement konnte nicht verbessert werden": "Product Requirement could not be improved",
    "Software Requirement konnte nicht verbessert werden": "Software Requirement could not be improved",
    "Software Requirements konnten nicht abgeleitet werden": "Software Requirements could not be derived",
    "E2E TestCases konnten nicht abgeleitet werden": "E2E TestCases could not be derived",
    "E2E TestCase konnte nicht verbessert werden": "E2E TestCase could not be improved",
  },
};

const els = {
  fileInput: document.querySelector("#fileInput"),
  projectInput: document.querySelector("#projectInput"),
  languageSelect: document.querySelector("#languageSelect"),
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
  techTypeValueClassColumn: document.querySelector("#techTypeValueClassColumn"),
  techTypeDesignationColumn: document.querySelector("#techTypeDesignationColumn"),
  analyzeButton: document.querySelector("#analyzeButton"),
  analyzeProductButton: document.querySelector("#analyzeProductButton"),
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
  softwareSelectionRegenerateButton: document.querySelector("#softwareSelectionRegenerateButton"),
  softwareSelectionAcceptButton: document.querySelector("#softwareSelectionAcceptButton"),
  softwareSelectionId: document.querySelector("#softwareSelectionId"),
  softwareSelectionSource: document.querySelector("#softwareSelectionSource"),
  softwareSelectionScore: document.querySelector("#softwareSelectionScore"),
  softwareSelectionText: document.querySelector("#softwareSelectionText"),
  softwareImprovementInstruction: document.querySelector("#softwareImprovementInstruction"),
  softwareImprovementAttachments: document.querySelector("#softwareImprovementAttachments"),
  softwareImprovementAttachmentList: document.querySelector("#softwareImprovementAttachmentList"),
  softwareImproveButton: document.querySelector("#softwareImproveButton"),
  softwareSelectionAcceptanceCriteriaTitle: document.querySelector("#softwareSelectionAcceptanceCriteriaTitle"),
  softwareSelectionAcceptanceCriteria: document.querySelector("#softwareSelectionAcceptanceCriteria"),
  softwareSelectionTechTypes: document.querySelector("#softwareSelectionTechTypes"),
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
  e2eSelectionRegenerateButton: document.querySelector("#e2eSelectionRegenerateButton"),
  e2eSelectionAcceptButton: document.querySelector("#e2eSelectionAcceptButton"),
  e2eSelectionId: document.querySelector("#e2eSelectionId"),
  e2eSelectionSource: document.querySelector("#e2eSelectionSource"),
  e2eSelectionScore: document.querySelector("#e2eSelectionScore"),
  e2eSelectionText: document.querySelector("#e2eSelectionText"),
  e2eImprovementInstruction: document.querySelector("#e2eImprovementInstruction"),
  e2eImprovementAttachments: document.querySelector("#e2eImprovementAttachments"),
  e2eImprovementAttachmentList: document.querySelector("#e2eImprovementAttachmentList"),
  e2eImproveButton: document.querySelector("#e2eImproveButton"),
  e2eSelectionTable: document.querySelector("#e2eSelectionTable"),
  e2eSelectionTechTypes: document.querySelector("#e2eSelectionTechTypes"),
  e2eSelectionIssues: document.querySelector("#e2eSelectionIssues"),
  selectionOverlay: document.querySelector("#selectionOverlay"),
  selectionCloseButton: document.querySelector("#selectionCloseButton"),
  selectionDeferButton: document.querySelector("#selectionDeferButton"),
  excludeRequirementButton: document.querySelector("#excludeRequirementButton"),
  selectOriginalButton: document.querySelector("#selectOriginalButton"),
  selectAiButton: document.querySelector("#selectAiButton"),
  selectionId: document.querySelector("#selectionId"),
  selectionName: document.querySelector("#selectionName"),
  selectionGroup: document.querySelector("#selectionGroup"),
  selectionScore: document.querySelector("#selectionScore"),
  selectionOriginalText: document.querySelector("#selectionOriginalText"),
  selectionAiText: document.querySelector("#selectionAiText"),
  techTypeSelectionPanel: document.querySelector("#techTypeSelectionPanel"),
  techTypeSelectionSummary: document.querySelector("#techTypeSelectionSummary"),
  techTypeSelectionList: document.querySelector("#techTypeSelectionList"),
  selectAllTechTypesButton: document.querySelector("#selectAllTechTypesButton"),
  prImprovementInstruction: document.querySelector("#prImprovementInstruction"),
  prImprovementAttachments: document.querySelector("#prImprovementAttachments"),
  prImprovementAttachmentList: document.querySelector("#prImprovementAttachmentList"),
  prImproveButton: document.querySelector("#prImproveButton"),
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
  progressTimeBar: document.querySelector("#progressTimeBar"),
  progressTimeText: document.querySelector("#progressTimeText"),
  progressDetail: document.querySelector("#progressDetail"),
  workflowSteps: [...document.querySelectorAll("[data-process-step]")],
  processPages: [...document.querySelectorAll("[data-process-page]")],
  menuDropdowns: [...document.querySelectorAll(".menu-dropdown")],
};

const nativeAlert = window.alert.bind(window);
const nativeConfirm = window.confirm.bind(window);
window.alert = (message) => nativeAlert(translateUiText(message));
window.confirm = (message) => nativeConfirm(translateUiText(message));

els.workflowSteps.forEach((step) => {
  step.addEventListener("click", () => setActiveProcessStep(step.dataset.processStep));
});
[
  [els.prImprovementAttachments, els.prImprovementAttachmentList],
  [els.softwareImprovementAttachments, els.softwareImprovementAttachmentList],
  [els.e2eImprovementAttachments, els.e2eImprovementAttachmentList],
].forEach(([input, list]) => {
  input?.addEventListener("change", () => renderImprovementAttachmentList(input, list));
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
els.languageSelect.addEventListener("change", () => {
  setLanguage(els.languageSelect.value);
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
els.techTypeValueClassColumn.addEventListener("change", refreshTechTypesFromSettings);
els.techTypeDesignationColumn.addEventListener("change", refreshTechTypesFromSettings);
els.analyzeButton.addEventListener("click", analyzeRequirements);
els.analyzeProductButton.addEventListener("click", analyzeRequirements);
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
els.selectAiButton.addEventListener("click", () => selectFinalText("ai"));
els.prImproveButton.addEventListener("click", improveProductRequirementWithAi);
els.selectAllTechTypesButton.addEventListener("click", selectAllTechTypesForActiveRequirement);
els.techTypeSelectionList.addEventListener("click", handleTechTypeSelectionClick);
els.techTypeSelectionList.addEventListener("change", handleTechTypeSelectionChange);
els.selectionOverlay.addEventListener("click", (event) => {
  if (event.target === els.selectionOverlay) {
    closeSelectionDialog();
  }
});
els.softwareSelectionCloseButton.addEventListener("click", closeSoftwareSelectionDialog);
els.softwareSelectionDeferButton.addEventListener("click", deferSoftwareRequirementSelection);
els.softwareSelectionExcludeButton.addEventListener("click", excludeSoftwareRequirement);
els.softwareSelectionRegenerateButton.addEventListener("click", regenerateSoftwareRequirementFromDialog);
els.softwareSelectionAcceptButton.addEventListener("click", acceptSoftwareRequirement);
els.softwareImproveButton.addEventListener("click", improveSoftwareRequirementWithAi);
els.softwareSelectionOverlay.addEventListener("click", (event) => {
  if (event.target === els.softwareSelectionOverlay) {
    closeSoftwareSelectionDialog();
  }
});
els.e2eSelectionCloseButton.addEventListener("click", closeE2eSelectionDialog);
els.e2eSelectionDeferButton.addEventListener("click", deferE2eSelection);
els.e2eSelectionExcludeButton.addEventListener("click", excludeE2eTest);
els.e2eSelectionRegenerateButton.addEventListener("click", regenerateE2eTestFromDialog);
els.e2eSelectionAcceptButton.addEventListener("click", acceptE2eTest);
els.e2eImproveButton.addEventListener("click", improveE2eTestWithAi);
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
    const hasChange = hasWorkflowChange(processStep);
    step.classList.toggle("has-change", hasChange);
    step.title = hasChange ? translateUiText("Änderung erkannt") : "";
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
  renderWorkflowTranslations();
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
  return (
    progress.allAssigned &&
    progress.includedCount > 0 &&
    progress.criticalCount === 0 &&
    !hasPendingFinalProductAssessments() &&
    state.finalScoreUpdates.size === 0
  );
}

function hasPendingFinalProductAssessments() {
  return [...state.finalSelections.values()].some((selection) => selection?.needsFinalAssessment);
}

function getProductStepProgress() {
  const excludedRows = getExcludedRows();
  const scores = getIncludedScores(excludedRows);
  const criticalCount = getCriticalScoreRows(excludedRows).size;
  const assignedCount = state.requirements.filter((requirement) =>
    state.finalSelections.has(Number(requirement.rowNumber)),
  ).length;
  const allAssigned =
    state.requirements.length > 0 &&
    assignedCount === state.requirements.length &&
    state.requirements.every((requirement) => state.finalSelections.has(Number(requirement.rowNumber)));
  const averageScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  return { assignedCount, allAssigned, averageScore, includedCount: scores.length, criticalCount };
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
    .map((result) => Number(displayProductScore(result, state.finalSelections.get(Number(result.rowNumber)))))
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
  fillTechTypeColumnSelects();
  state.techTypes = extractTechTypesFromWorkbook(state.workbook);

  els.sheetSelect.innerHTML = "";
  const techTypeSheet = techTypeSheetName(state.workbook);
  const requirementSheetNames = state.workbook.SheetNames.filter((name) => name !== techTypeSheet);
  const selectableSheetNames = requirementSheetNames.length ? requirementSheetNames : state.workbook.SheetNames;
  for (const name of selectableSheetNames) {
    els.sheetSelect.append(new Option(name, name));
  }

  els.sheetSelect.disabled = false;
  els.headerRow.disabled = false;
  const requirementSheetName = selectableSheetNames[0];
  els.sheetSelect.value = requirementSheetName;
  loadSheet(requirementSheetName);
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
  state.techTypes = [];
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
  state.changedProductRequirementRows = new Set();
  state.changedSoftwareRequirementIds = new Set();
  state.productTransferChangeRows = new Set();
  state.softwareTransferChangeIds = new Set();
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
  state.techTypes = [];
  fillColumnSelects();
  fillTechTypeColumnSelects();
  els.analyzeButton.disabled = true;
  els.analyzeProductButton.disabled = true;
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

function extractTechTypesFromWorkbook(workbook) {
  const sheetName = techTypeSheetName(workbook);
  if (!sheetName) return [];

  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
  const headerIndex = techTypeHeaderIndex(rows);
  if (headerIndex < 0) return [];

  const headers = rows[headerIndex].map(normalizeHeaderName);
  const valueClassIndex = techTypeColumnIndex(els.techTypeValueClassColumn.value, headers, "valueclass");
  const designationIndex = techTypeColumnIndex(els.techTypeDesignationColumn.value, headers, "appliancedesignation");
  if (valueClassIndex < 0 || designationIndex < 0) return [];
  const seen = new Set();

  return rows
    .slice(headerIndex + 1)
    .map((row) => ({
      valueClass: String(row[valueClassIndex] || "").trim() || "Ohne Gruppe",
      designation: String(row[designationIndex] || "").trim(),
    }))
    .filter((item) => item.designation)
    .filter((item) => {
      const key = `${item.valueClass}\u0000${item.designation}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function fillTechTypeColumnSelects() {
  els.techTypeValueClassColumn.innerHTML = "";
  els.techTypeDesignationColumn.innerHTML = "";

  const sheetName = techTypeSheetName(state.workbook);
  const worksheet = sheetName ? state.workbook.Sheets[sheetName] : null;
  const rows = worksheet ? XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }) : [];
  const headerIndex = techTypeHeaderIndex(rows);
  const headers = headerIndex >= 0 ? rows[headerIndex] : [];

  if (!sheetName) {
    els.techTypeValueClassColumn.append(new Option("Kein TechType-Sheet gefunden", ""));
    els.techTypeDesignationColumn.append(new Option("Kein TechType-Sheet gefunden", ""));
  } else if (!headers.length) {
    els.techTypeValueClassColumn.append(new Option("Keine Spalten im TechType-Sheet gefunden", ""));
    els.techTypeDesignationColumn.append(new Option("Keine Spalten im TechType-Sheet gefunden", ""));
  }

  headers.forEach((header, index) => {
    const label = `${columnName(index)} - ${String(header || "").trim() || `Spalte ${columnName(index)}`}`;
    els.techTypeValueClassColumn.append(new Option(label, String(index)));
    els.techTypeDesignationColumn.append(new Option(label, String(index)));
  });

  const hasTechTypeColumns = headers.length > 0;
  els.techTypeValueClassColumn.disabled = !hasTechTypeColumns;
  els.techTypeDesignationColumn.disabled = !hasTechTypeColumns;
  if (!hasTechTypeColumns) return;

  const normalizedHeaders = headers.map(normalizeHeaderName);
  const valueClassIndex = normalizedHeaders.indexOf("valueclass");
  const designationIndex = normalizedHeaders.indexOf("appliancedesignation");
  els.techTypeValueClassColumn.value = String(valueClassIndex >= 0 ? valueClassIndex : 0);
  els.techTypeDesignationColumn.value = String(designationIndex >= 0 ? designationIndex : Math.min(1, headers.length - 1));
}

function techTypeSheetName(workbook) {
  if (!Array.isArray(workbook?.SheetNames)) return "";

  return (
    workbook.SheetNames.find((name) => normalizeHeaderName(name) === "techtype") ||
    workbook.SheetNames.find((name) => normalizeHeaderName(name).includes("techtype")) ||
    ""
  );
}

function techTypeHeaderIndex(rows) {
  if (!Array.isArray(rows) || !rows.length) return -1;

  const detectedIndex = rows.findIndex((row) =>
    row.some((cell) => normalizeHeaderName(cell) === "valueclass") ||
    row.some((cell) => normalizeHeaderName(cell) === "appliancedesignation"),
  );
  if (detectedIndex >= 0) return detectedIndex;

  return rows.findIndex((row) => row.some((cell) => String(cell || "").trim()));
}

function techTypeColumnIndex(selectedValue, headers, fallbackHeaderName) {
  const index = Number(selectedValue);
  if (Number.isInteger(index) && index >= 0) return index;

  const fallbackIndex = headers.indexOf(fallbackHeaderName);
  return fallbackIndex >= 0 ? fallbackIndex : -1;
}

function refreshTechTypesFromSettings() {
  if (!state.workbook) return;

  state.techTypes = extractTechTypesFromWorkbook(state.workbook);
  assignDefaultTechTypesToRequirements();
  refreshRequirements();
}

function assignDefaultTechTypesToRequirements() {
  const techTypes = allTechTypeDesignations();
  if (!techTypes.length) return;

  state.requirements = state.requirements.map((requirement) => ({
    ...requirement,
    techTypes: Array.isArray(requirement.techTypes) && requirement.techTypes.length ? requirement.techTypes : techTypes,
  }));
}

function normalizeHeaderName(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function allTechTypeDesignations() {
  return state.techTypes.map((item) => item.designation);
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
  els.analyzeProductButton.disabled = state.requirements.length === 0;
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
      techTypes: allTechTypeDesignations(),
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
  els.analyzeProductButton.disabled = true;
  state.finalSelections = new Map();
  state.finalScoreUpdates = new Set();
  state.scoreFilterActive = false;
  state.analysisComplete = false;
  updateExportAvailability();
  await showProgress(state.requirements.length, { requirements: state.requirements, mode: "pr-analysis", batchSize: ANALYSIS_BATCH_SIZE });

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
      const selection = state.finalSelections.get(Number(item.rowNumber));
      const isUpdatingFinalScore = state.finalScoreUpdates.has(Number(item.rowNumber));
      const score = result ? displayProductScore(result, selection, { usePreviousScore: isUpdatingFinalScore }) : null;
      const issues = result ? displayProductIssues(result, selection) : [];
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
          <td class="${selection?.choice === "original" ? "selected-text" : ""} ${isExcluded ? "excluded-text" : ""}">${escapeHtml(item.text)}</td>
          <td>${renderScoreCell(result, score, isSelected, isExcluded, isUpdatingFinalScore)}</td>
          <td>${result ? renderIssues(issues) : "-"}</td>
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
  els.selectionScore.textContent = result ? displayProductScore(result, state.finalSelections.get(rowNumber)) : "-";
  els.selectionOriginalText.textContent = item.text;
  els.selectionAiText.textContent = result?.rewrittenRequirement || "Noch kein AI-Vorschlag vorhanden. Bitte zuerst die Analyse ausführen.";
  els.prImprovementInstruction.value = "";
  els.prImprovementAttachments.value = "";
  renderImprovementAttachmentList(els.prImprovementAttachments, els.prImprovementAttachmentList);
  renderTechTypeSelection(item, state.finalSelections.get(rowNumber));
  els.selectAiButton.disabled = !result?.rewrittenRequirement;
  els.selectionIssues.innerHTML = result
    ? renderIssues(displayProductIssues(result, state.finalSelections.get(rowNumber)))
    : "Noch keine Analysehinweise vorhanden.";
  els.selectionOverlay.hidden = false;
}

function closeSelectionDialog() {
  state.activeSelectionRow = null;
  els.selectionOverlay.hidden = true;
}

function renderTechTypeSelection(requirement, selection) {
  if (!state.techTypes.length) {
    els.techTypeSelectionPanel.hidden = false;
    els.selectAllTechTypesButton.disabled = true;
    els.techTypeSelectionSummary.textContent = "Keine TechTypes erkannt";
    els.techTypeSelectionList.innerHTML = `
      <p class="techtype-empty">
        Keine TechTypes verfügbar. Prüfe im Datei-Import die TechType-Spalten für Gruppierung und Appliance Designation.
      </p>
    `;
    return;
  }

  els.techTypeSelectionPanel.hidden = false;
  els.selectAllTechTypesButton.disabled = false;
  const selected = new Set(selectedTechTypesForRequirement(requirement, selection));
  const groups = groupedTechTypes();
  els.techTypeSelectionList.innerHTML = groups
    .map((group) => {
      const groupSelectedCount = group.items.filter((item) => selected.has(item.designation)).length;
      const groupChecked = groupSelectedCount === group.items.length;
      return `
        <details class="techtype-group" open>
          <summary>
            <label class="techtype-group-select">
              <input type="checkbox" data-techtype-group="${escapeHtml(group.valueClass)}" ${groupChecked ? "checked" : ""} />
              <span>${escapeHtml(group.valueClass)}</span>
            </label>
            <small>${groupSelectedCount} / ${group.items.length}</small>
            <button class="techtype-toggle" type="button" data-techtype-toggle aria-label="Gruppe ein- oder ausklappen"></button>
          </summary>
          <div class="techtype-options">
            ${group.items
              .map((item, index) => {
                const designation = item.designation || `TechType ${index + 1}`;
                return `
                  <label>
                    <input type="checkbox" data-techtype-designation="${escapeHtml(item.designation)}" data-techtype-designation-group="${escapeHtml(item.valueClass)}" ${selected.has(item.designation) ? "checked" : ""} />
                    <span title="${escapeHtml(designation)}">${escapeHtml(designation)}</span>
                  </label>
                `;
              })
              .join("")}
          </div>
        </details>
      `;
    })
    .join("");
  syncTechTypeGroupCheckboxes();
  renderTechTypeSummary(selected.size);
}

function groupedTechTypes() {
  const groups = new Map();
  state.techTypes.forEach((item) => {
    const entries = groups.get(item.valueClass) || [];
    entries.push(item);
    groups.set(item.valueClass, entries);
  });

  return [...groups.entries()].map(([valueClass, items]) => ({ valueClass, items }));
}

function selectedTechTypesForRequirement(requirement, selection) {
  const selected = Array.isArray(selection?.techTypes)
    ? selection.techTypes
    : Array.isArray(requirement?.techTypes)
      ? requirement.techTypes
      : allTechTypeDesignations();
  const available = new Set(allTechTypeDesignations());
  return selected.filter((item) => available.has(item));
}

function currentTechTypeSelection() {
  if (!state.techTypes.length) return [];

  return [...els.techTypeSelectionList.querySelectorAll("[data-techtype-designation]")]
    .filter((input) => input.checked)
    .map((input) => input.dataset.techtypeDesignation)
    .filter(Boolean);
}

function renderTechTypeSummary(selectedCount = currentTechTypeSelection().length) {
  const total = state.techTypes.length;
  els.techTypeSelectionSummary.textContent =
    selectedCount === total
      ? `Alle ${total} TechTypes ausgewählt`
      : `${selectedCount} von ${total} TechTypes ausgewählt`;
}

function handleTechTypeSelectionChange(event) {
  const groupInput = event.target.closest("[data-techtype-group]");
  if (groupInput) {
    const group = groupInput.dataset.techtypeGroup;
    els.techTypeSelectionList
      .querySelectorAll("[data-techtype-designation]")
      .forEach((input) => {
        if (input.dataset.techtypeDesignationGroup === group) {
          input.checked = groupInput.checked;
        }
      });
  }

  syncTechTypeGroupCheckboxes();
  renderTechTypeSummary();
  persistActiveRequirementTechTypes();
}

function handleTechTypeSelectionClick(event) {
  const toggleButton = event.target.closest("[data-techtype-toggle]");
  if (toggleButton) {
    event.preventDefault();
    event.stopPropagation();
    const group = toggleButton.closest(".techtype-group");
    if (group) group.open = !group.open;
    return;
  }

  if (event.target.closest(".techtype-group-select")) {
    event.stopPropagation();
  }
}

function syncTechTypeGroupCheckboxes() {
  els.techTypeSelectionList.querySelectorAll("[data-techtype-group]").forEach((groupInput) => {
    const group = groupInput.dataset.techtypeGroup;
    const items = [...els.techTypeSelectionList.querySelectorAll("[data-techtype-designation]")].filter((input) => {
      return input.dataset.techtypeDesignationGroup === group;
    });
    const selectedCount = items.filter((input) => input.checked).length;
    groupInput.checked = items.length > 0 && selectedCount === items.length;
    groupInput.indeterminate = selectedCount > 0 && selectedCount < items.length;
    const count = groupInput.closest("summary")?.querySelector("small");
    if (count) count.textContent = `${selectedCount} / ${items.length}`;
  });
}

function selectAllTechTypesForActiveRequirement() {
  els.techTypeSelectionList.querySelectorAll("input[type='checkbox']").forEach((input) => {
    input.checked = true;
    input.indeterminate = false;
  });
  syncTechTypeGroupCheckboxes();
  renderTechTypeSummary(state.techTypes.length);
  persistActiveRequirementTechTypes();
}

function persistActiveRequirementTechTypes() {
  const rowNumber = state.activeSelectionRow;
  if (!rowNumber) return;

  const item = state.requirements.find((requirement) => Number(requirement.rowNumber) === Number(rowNumber));
  if (!item) return;

  const techTypes = currentTechTypeSelection();
  item.techTypes = techTypes;
  const selection = state.finalSelections.get(Number(rowNumber));
  if (!selection) return;

  selection.techTypes = techTypes;
  if (state.productWindchillTransferComplete) {
    markProductRequirementChanged(rowNumber);
  } else {
    state.softwareRequirements = [];
    state.softwareSelections = new Map();
    state.e2eTests = [];
    state.e2eSelections = new Map();
    resetProductWindchillTransfer();
    resetSoftwareWindchillTransfer();
  }
  updateExportAvailability();
}

function excludeRequirement() {
  const rowNumber = state.activeSelectionRow;
  if (!rowNumber) return;

  state.finalSelections.set(Number(rowNumber), {
    choice: "excluded",
    text: "",
    excluded: true,
  });
  if (state.productWindchillTransferComplete) {
    markProductRequirementChanged(rowNumber);
  } else {
    state.softwareRequirements = [];
    state.softwareSelections = new Map();
    state.e2eTests = [];
    state.e2eSelections = new Map();
    resetProductWindchillTransfer();
    resetSoftwareWindchillTransfer();
  }
  closeSelectionDialog();
  renderTable();
  renderMetrics();
  renderSoftwarePage();
  updateExportAvailability();
}

async function improveProductRequirementWithAi() {
  const endpoint = getAnalyzeEndpoint();
  if (!endpoint) {
    setStatus("Server erforderlich");
    alert("Bitte starte den lokalen Server und öffne die App über http://localhost:3000.");
    return;
  }

  const rowNumber = state.activeSelectionRow;
  const item = state.requirements.find((requirement) => Number(requirement.rowNumber) === Number(rowNumber));
  const result = state.results.find((entry) => Number(entry.rowNumber) === Number(rowNumber));
  const instruction = els.prImprovementInstruction.value.trim();
  if (!item || !instruction) {
    alert("Bitte beschreibe, was die AI am Product Requirement verbessern soll.");
    return;
  }

  const currentText = result?.rewrittenRequirement || item.text;
  const previousStatus = els.prImproveButton.textContent;
  els.prImproveButton.disabled = true;
  els.selectAiButton.disabled = true;
  els.prImproveButton.textContent = "AI verbessert...";
  setStatus("AI verbessert Product Requirement...");

  try {
    const improvementAttachments = await readImprovementAttachments(els.prImprovementAttachments);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requirementType: "product-improvement",
        improvementInstruction: instruction,
        improvementAttachments,
        requirements: [
          {
            ...item,
            text: currentText,
            score: result?.score,
          },
        ],
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Product Requirement konnte nicht verbessert werden");
    }

    addOpenAiUsage(data.openAiUsage);
    const improved = data.result || data.results?.[0];
    if (!improved) return;

    upsertResult({
      ...improved,
      rowNumber: Number(rowNumber),
      id: item.id || improved.id || "",
      originalScore: result?.originalScore ?? improved.originalScore ?? improved.score,
      originalIssues: result?.originalIssues || improved.originalIssues || [],
    });
    els.selectionAiText.textContent = improved.rewrittenRequirement || currentText;
    els.selectionScore.textContent = displayProductScore(improved, state.finalSelections.get(Number(rowNumber)));
    els.selectionIssues.innerHTML = renderIssues(displayProductIssues(improved, state.finalSelections.get(Number(rowNumber))));
  els.selectAiButton.disabled = false;
  els.prImprovementInstruction.value = "";
  els.prImprovementAttachments.value = "";
  renderImprovementAttachmentList(els.prImprovementAttachments, els.prImprovementAttachmentList);
  renderTable();
    renderMetrics();
    setStatus("Product Requirement verbessert");
  } catch (error) {
    setStatus("Fehler");
    alert(error.message);
  } finally {
    els.prImproveButton.disabled = false;
    els.selectAiButton.disabled = !state.results.find((entry) => Number(entry.rowNumber) === Number(rowNumber))?.rewrittenRequirement;
    els.prImproveButton.textContent = previousStatus;
  }
}

async function selectFinalText(choice) {
  const rowNumber = state.activeSelectionRow;
  if (!rowNumber) return;

  const item = state.requirements.find((requirement) => Number(requirement.rowNumber) === rowNumber);
  const result = state.results.find((entry) => Number(entry.rowNumber) === rowNumber);
  const text =
    choice === "ai"
      ? result?.rewrittenRequirement
      : item?.text;

  if (!item || !text) return;
  if (state.techTypes.length && !currentTechTypeSelection().length) {
    alert("Bitte wähle mindestens einen TechType aus.");
    return;
  }

  state.finalSelections.set(Number(rowNumber), {
    choice,
    text,
    techTypes: currentTechTypeSelection(),
    previousScore: result ? displayProductScore(result, state.finalSelections.get(Number(rowNumber))) : null,
    needsFinalAssessment: true,
  });
  state.finalScoreUpdates.add(Number(rowNumber));
  if (state.productWindchillTransferComplete) {
    markProductRequirementChanged(rowNumber);
  } else {
    state.softwareRequirements = [];
    state.softwareSelections = new Map();
    state.e2eTests = [];
    state.e2eSelections = new Map();
    resetProductWindchillTransfer();
    resetSoftwareWindchillTransfer();
  }
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

  if (selection.needsFinalAssessment) {
    return {
      className: "pending",
      icon: "?",
      label: "Finale Bewertung erforderlich",
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
  const rowNumber = Number(item.rowNumber);
  state.finalScoreUpdates.add(rowNumber);
  if (!endpoint) {
    state.finalScoreUpdates.delete(rowNumber);
    updateExportAvailability();
    return;
  }

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
      const selection = state.finalSelections.get(rowNumber);
      if (selection) {
        delete selection.needsFinalAssessment;
      }
      renderTable();
      renderMetrics();
    }

    setStatus("Final bewertet");
  } catch (error) {
    setStatus("Fehler");
    alert(error.message);
  } finally {
    state.finalScoreUpdates.delete(rowNumber);
    const selection = state.finalSelections.get(rowNumber);
    if (selection && "previousScore" in selection) {
      delete selection.previousScore;
    }
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
  if (!issues.length) return translateUiText("Keine wesentlichen Hinweise");
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

async function readImprovementAttachments(input) {
  const files = [...(input?.files || [])];
  if (!files.length) return [];

  const maxFiles = 5;
  const selectedFiles = files.slice(0, maxFiles);
  const attachments = [];
  for (const file of selectedFiles) {
    attachments.push(await readImprovementAttachment(file));
  }

  if (files.length > maxFiles) {
    attachments.push({
      name: "Hinweis",
      type: "system",
      size: 0,
      text: `Es wurden ${files.length - maxFiles} weitere Anhänge ignoriert. Maximal ${maxFiles} Anhänge werden pro Verbesserung berücksichtigt.`,
      truncated: false,
    });
  }

  return attachments;
}

async function readImprovementAttachment(file) {
  const maxChars = 8000;
  const textReadable = isTextReadableAttachment(file);
  const excelReadable = isExcelAttachment(file);
  const base = {
    name: file.name || "Anhang",
    type: file.type || "",
    size: Number(file.size) || 0,
    text: "",
    truncated: false,
  };

  if (excelReadable) {
    const text = await readExcelAttachmentText(file, maxChars);
    return {
      ...base,
      text: text.value,
      truncated: text.truncated,
    };
  }

  if (!textReadable) {
    return {
      ...base,
      text: "Der Anhang wurde als Datei referenziert. Der Inhalt konnte im Browser nicht als Text gelesen werden.",
    };
  }

  const text = await file.text();
  return {
    ...base,
    text: text.slice(0, maxChars),
    truncated: text.length > maxChars,
  };
}

function isTextReadableAttachment(file) {
  const name = String(file?.name || "").toLowerCase();
  const type = String(file?.type || "").toLowerCase();
  return (
    type.startsWith("text/") ||
    type.includes("json") ||
    type.includes("xml") ||
    /\.(txt|md|markdown|csv|json|xml|yaml|yml|log)$/i.test(name)
  );
}

function isExcelAttachment(file) {
  const name = String(file?.name || "").toLowerCase();
  const type = String(file?.type || "").toLowerCase();
  return (
    type.includes("spreadsheet") ||
    type.includes("excel") ||
    /\.(xlsx|xls)$/i.test(name)
  );
}

async function readExcelAttachmentText(file, maxChars) {
  if (!window.XLSX) {
    return {
      value: "Die Excel-Datei konnte nicht gelesen werden, weil die XLSX-Bibliothek nicht verfügbar ist.",
      truncated: false,
    };
  }

  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
  const sheetTexts = [];
  for (const sheetName of workbook.SheetNames.slice(0, 5)) {
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }).slice(0, 80);
    const csv = rows
      .map((row) => row.map((cell) => String(cell ?? "").replace(/\s+/g, " ").trim()).join("; "))
      .filter((row) => row.trim())
      .join("\n");
    sheetTexts.push(`Sheet: ${sheetName}\n${csv || "(leer)"}`);
  }

  const value = sheetTexts.join("\n\n");
  return {
    value: value.slice(0, maxChars),
    truncated: value.length > maxChars || workbook.SheetNames.length > 5,
  };
}

function renderImprovementAttachmentList(input, list) {
  if (!list) return;

  const files = [...(input?.files || [])];
  if (!files.length) {
    list.innerHTML = "";
    return;
  }

  list.innerHTML = files
    .slice(0, 5)
    .map((file) => `
      <span class="attachment-chip" title="${escapeHtml(file.name)}">
        <span class="attachment-chip-icon" aria-hidden="true">${isExcelAttachment(file) ? "XLS" : "TXT"}</span>
        <span class="attachment-chip-name">${escapeHtml(file.name)}</span>
        <small>${formatFileSize(file.size)}</small>
      </span>
    `)
    .join("");
}

function formatFileSize(value) {
  const bytes = Number(value) || 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

function displayProductScore(result, selection = null, options = {}) {
  if (!result) return null;
  if (options.usePreviousScore) {
    const previousScore = Number(selection?.previousScore);
    if (Number.isFinite(previousScore)) return previousScore;
  }

  if (!selection) {
    const originalScore = Number(result.originalScore);
    return Number.isFinite(originalScore) ? originalScore : Number(result.score);
  }

  return Number(result.score);
}

function displayProductIssues(result, selection = null) {
  if (!result) return [];
  if (!selection) {
    return Array.isArray(result.originalIssues) ? result.originalIssues : Array.isArray(result.issues) ? result.issues : [];
  }

  return Array.isArray(result.issues) ? result.issues : [];
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
  const acceptanceCriteriaLabel = acceptanceCriteriaLabelForSoftwareRequirement(item);
  return `
    <p class="software-requirement-text">${escapeHtml(item.text || "")}</p>
    ${renderFlowSection(acceptanceCriteriaLabel, item.acceptanceCriteria)}
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

function renderAcceptanceCriteriaList(value, label = "Akzeptanzkriterien") {
  const items = Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];
  if (!items.length) {
    return label === "Acceptance criteria" ? "No acceptance criteria available." : "Keine Akzeptanzkriterien vorhanden.";
  }

  return `
    <ul class="acceptance-criteria-list">
      ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
    </ul>
  `;
}

function renderReadOnlyTechTypes(value) {
  const items = Array.isArray(value) ? value.filter(Boolean) : [];
  if (!items.length) return "Keine TechTypes zugeordnet.";

  return `
    <div class="readonly-techtype-list">
      ${items.map((item) => `<span title="${escapeHtml(item)}">${escapeHtml(item)}</span>`).join("")}
    </div>
  `;
}

function acceptanceCriteriaLabelForSoftwareRequirement(item) {
  const criteria = Array.isArray(item?.acceptanceCriteria) ? item.acceptanceCriteria.join(" ") : String(item?.acceptanceCriteria || "");
  return isLikelyEnglishText(`${item?.text || ""} ${criteria}`)
    ? "Acceptance criteria"
    : "Akzeptanzkriterien";
}

function isLikelyEnglishText(value) {
  const text = String(value || "").toLowerCase();
  const englishHits = (text.match(/\b(the|shall|must|when|then|given|user|system|if|and|or|not|available|display|select|enter)\b/g) || []).length;
  const germanHits = (text.match(/\b(der|die|das|muss|soll|wenn|dann|gegeben|benutzer|system|nicht|und|oder|verfügbar|anzeigen|auswählen|eingeben)\b/g) || []).length;
  return englishHits > germanHits;
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

  if (isSoftwareRequirementImpacted(item)) {
    return {
      className: "changed",
      icon: "!",
      label: "Quelle geändert - neu ableiten erforderlich",
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
  els.softwareImprovementInstruction.value = "";
  els.softwareImprovementAttachments.value = "";
  renderImprovementAttachmentList(els.softwareImprovementAttachments, els.softwareImprovementAttachmentList);
  const isImpacted = isSoftwareRequirementImpacted(item);
  els.softwareSelectionRegenerateButton.hidden = !isImpacted;
  els.softwareSelectionRegenerateButton.disabled = !isImpacted;
  const acceptanceCriteriaLabel = acceptanceCriteriaLabelForSoftwareRequirement(item);
  els.softwareSelectionAcceptanceCriteriaTitle.textContent = acceptanceCriteriaLabel;
  els.softwareSelectionAcceptanceCriteria.innerHTML = renderAcceptanceCriteriaList(item.acceptanceCriteria, acceptanceCriteriaLabel);
  els.softwareSelectionTechTypes.innerHTML = renderReadOnlyTechTypes(item.techTypes);
  els.softwareSelectionIssues.innerHTML = item.issues?.length ? renderIssues(item.issues) : "Keine Hinweise vorhanden.";
  els.softwareSelectionOverlay.hidden = false;
}

function closeSoftwareSelectionDialog() {
  state.activeSoftwareRequirementId = "";
  els.softwareSelectionOverlay.hidden = true;
}

function findSourceProductRequirementForSoftware(item) {
  return getFinalProductRequirements().find(
    (requirement) =>
      Number(requirement.rowNumber) === Number(item?.sourceRowNumber) ||
      String(requirement.id || "") === String(item?.sourceId || ""),
  );
}

function hasSameSoftwareSource(item, sourceRequirement) {
  if (!item || !sourceRequirement) return false;
  const sourceRowNumber = Number(sourceRequirement.rowNumber);
  if (Number.isFinite(sourceRowNumber) && Number(item.sourceRowNumber) === sourceRowNumber) return true;

  const sourceId = String(sourceRequirement.id || "");
  return Boolean(sourceId) && String(item.sourceId || "") === sourceId;
}

function areSoftwareRequirementsForSourceDecided(item) {
  const sourceRowNumber = Number(item?.sourceRowNumber);
  const sourceId = String(item?.sourceId || "");
  return state.softwareRequirements
    .filter((entry) => {
      if (Number.isFinite(sourceRowNumber) && Number(entry.sourceRowNumber) === sourceRowNumber) return true;
      return Boolean(sourceId) && String(entry.sourceId || "") === sourceId;
    })
    .every((entry) => state.softwareSelections.has(String(entry.id || "")));
}

function deferSoftwareRequirementSelection() {
  const softwareId = state.activeSoftwareRequirementId;
  if (softwareId) {
    state.softwareSelections.delete(String(softwareId));
  }

  if (state.softwareWindchillTransferComplete) {
    markSoftwareRequirementChanged(softwareId);
  } else {
    resetSoftwareWindchillTransfer();
  }
  closeSoftwareSelectionDialog();
  renderSoftwarePage();
  updateExportAvailability();
}

async function regenerateSoftwareRequirementFromDialog() {
  const endpoint = getAnalyzeEndpoint();
  if (!endpoint) {
    setStatus("Server erforderlich");
    alert("Bitte starte den lokalen Server und öffne die App über http://localhost:3000.");
    return;
  }

  const softwareId = state.activeSoftwareRequirementId;
  const item = state.softwareRequirements.find((entry) => String(entry.id || "") === String(softwareId || ""));
  if (!item || !isSoftwareRequirementImpacted(item)) return;

  const sourceRequirement = findSourceProductRequirementForSoftware(item);
  if (!sourceRequirement) {
    alert("Das zugehörige Product Requirement wurde nicht gefunden.");
    return;
  }

  const previousButtonText = els.softwareSelectionRegenerateButton.textContent;
  els.softwareSelectionRegenerateButton.disabled = true;
  els.softwareSelectionAcceptButton.disabled = true;
  els.softwareImproveButton.disabled = true;
  els.softwareSelectionRegenerateButton.textContent = translateUiText("SR wird abgeleitet...");
  setStatus("Leite Software Requirement neu ab...");

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requirementType: "software", requirements: [sourceRequirement] }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Software Requirement konnte nicht neu abgeleitet werden");
    }

    addOpenAiUsage(data.openAiUsage);
    const rawSoftwareRequirements = Array.isArray(data.softwareRequirements) ? data.softwareRequirements : [];
    const regeneratedRequirements = normalizeSoftwareRequirements(rawSoftwareRequirements, [sourceRequirement]);
    if (!regeneratedRequirements.length) {
      throw new Error("Software Requirement konnte nicht neu abgeleitet werden");
    }

    const firstAffectedIndex = state.softwareRequirements.findIndex((entry) =>
      hasSameSoftwareSource(entry, sourceRequirement),
    );
    const affectedRequirements = state.softwareRequirements.filter((entry) =>
      hasSameSoftwareSource(entry, sourceRequirement),
    );
    affectedRequirements.forEach((entry) => {
      state.softwareSelections.delete(String(entry.id || ""));
      state.changedSoftwareRequirementIds.delete(String(entry.id || ""));
      state.softwareTransferChangeIds.delete(String(entry.id || ""));
    });

    const remainingRequirements = state.softwareRequirements.filter(
      (entry) => !hasSameSoftwareSource(entry, sourceRequirement),
    );
    const insertIndex = firstAffectedIndex >= 0 ? firstAffectedIndex : remainingRequirements.length;
    state.softwareRequirements = [
      ...remainingRequirements.slice(0, insertIndex),
      ...regeneratedRequirements,
      ...remainingRequirements.slice(insertIndex),
    ];

    state.softwareScoreFilterActive = false;
    resetSoftwareWindchillTransfer();
    state.softwareTransferChangeIds = new Set(regeneratedRequirements.map((entry) => String(entry.id || "")).filter(Boolean));
    const activeRequirement = regeneratedRequirements[0];
    state.activeSoftwareRequirementId = activeRequirement.id || "";
    els.softwareSelectionId.textContent = activeRequirement.id || "-";
    els.softwareSelectionSource.textContent = activeRequirement.sourceId || "-";
    els.softwareSelectionScore.textContent = activeRequirement.score ?? "-";
    els.softwareSelectionText.value = activeRequirement.text || "";
    els.softwareSelectionRegenerateButton.hidden = true;
    const acceptanceCriteriaLabel = acceptanceCriteriaLabelForSoftwareRequirement(activeRequirement);
    els.softwareSelectionAcceptanceCriteriaTitle.textContent = acceptanceCriteriaLabel;
    els.softwareSelectionAcceptanceCriteria.innerHTML = renderAcceptanceCriteriaList(activeRequirement.acceptanceCriteria, acceptanceCriteriaLabel);
    els.softwareSelectionTechTypes.innerHTML = renderReadOnlyTechTypes(activeRequirement.techTypes);
    els.softwareSelectionIssues.innerHTML = activeRequirement.issues?.length ? renderIssues(activeRequirement.issues) : "Keine Hinweise vorhanden.";
    els.softwareImprovementInstruction.value = "";
    els.softwareImprovementAttachments.value = "";
    renderImprovementAttachmentList(els.softwareImprovementAttachments, els.softwareImprovementAttachmentList);
    renderSoftwarePage();
    renderE2ePage();
    updateExportAvailability();
    updateWorkflowState();
    updateContextualMenuActions();
    setStatus("Software Requirement neu abgeleitet");
  } catch (error) {
    setStatus("Fehler");
    alert(error.message);
  } finally {
    els.softwareSelectionRegenerateButton.disabled = false;
    els.softwareSelectionAcceptButton.disabled = false;
    els.softwareImproveButton.disabled = false;
    els.softwareSelectionRegenerateButton.textContent = previousButtonText;
  }
}

async function improveSoftwareRequirementWithAi() {
  const endpoint = getAnalyzeEndpoint();
  if (!endpoint) {
    setStatus("Server erforderlich");
    alert("Bitte starte den lokalen Server und öffne die App über http://localhost:3000.");
    return;
  }

  const softwareId = state.activeSoftwareRequirementId;
  const item = state.softwareRequirements.find((entry) => String(entry.id || "") === String(softwareId || ""));
  const instruction = els.softwareImprovementInstruction.value.trim();
  if (!item || !instruction) {
    alert("Bitte beschreibe, was die AI am Software Requirement verbessern soll.");
    return;
  }

  const sourceRequirement = getFinalProductRequirements().find(
    (requirement) =>
      Number(requirement.rowNumber) === Number(item.sourceRowNumber) ||
      String(requirement.id || "") === String(item.sourceId || ""),
  );
  if (!sourceRequirement) {
    alert("Das zugehörige Product Requirement wurde nicht gefunden.");
    return;
  }

  const previousStatus = els.softwareImproveButton.textContent;
  els.softwareImproveButton.disabled = true;
  els.softwareSelectionAcceptButton.disabled = true;
  els.softwareImproveButton.textContent = "AI verbessert...";
  setStatus("AI verbessert Software Requirement...");

  try {
    const improvementAttachments = await readImprovementAttachments(els.softwareImprovementAttachments);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requirementType: "software-improvement",
        improvementInstruction: instruction,
        improvementAttachments,
        requirements: [sourceRequirement],
        softwareRequirement: {
          ...item,
          text: els.softwareSelectionText.value.trim() || item.text || "",
        },
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Software Requirement konnte nicht verbessert werden");
    }

    addOpenAiUsage(data.openAiUsage);
    const improved = data.softwareRequirement || {};
    Object.assign(item, {
      ...improved,
      id: item.id,
      sourceRowNumber: Number(item.sourceRowNumber),
      sourceId: item.sourceId,
      category: item.category,
      subcategory: item.subcategory,
      techTypes: Array.isArray(item.techTypes) ? item.techTypes : [],
      text: improved.text || item.text || "",
      acceptanceCriteria: Array.isArray(improved.acceptanceCriteria) ? improved.acceptanceCriteria : item.acceptanceCriteria || [],
      score: Number(improved.score),
      issues: Array.isArray(improved.issues) ? improved.issues : [],
    });

    els.softwareSelectionScore.textContent = item.score ?? "-";
    els.softwareSelectionText.value = item.text || "";
    const acceptanceCriteriaLabel = acceptanceCriteriaLabelForSoftwareRequirement(item);
    els.softwareSelectionAcceptanceCriteriaTitle.textContent = acceptanceCriteriaLabel;
    els.softwareSelectionAcceptanceCriteria.innerHTML = renderAcceptanceCriteriaList(item.acceptanceCriteria, acceptanceCriteriaLabel);
    els.softwareSelectionTechTypes.innerHTML = renderReadOnlyTechTypes(item.techTypes);
    els.softwareSelectionIssues.innerHTML = item.issues.length ? renderIssues(item.issues) : "Keine Hinweise vorhanden.";
    els.softwareImprovementInstruction.value = "";
    els.softwareImprovementAttachments.value = "";
    renderImprovementAttachmentList(els.softwareImprovementAttachments, els.softwareImprovementAttachmentList);
    if (state.softwareWindchillTransferComplete) {
      markSoftwareRequirementChanged(item.id);
    } else {
      state.e2eTests = [];
      state.e2eSelections = new Map();
      state.e2eScoreFilterActive = false;
      resetSoftwareWindchillTransfer();
    }
    renderSoftwarePage();
    renderE2ePage();
    updateWorkflowState();
    setStatus("Software Requirement verbessert");
  } catch (error) {
    setStatus("Fehler");
    alert(error.message);
  } finally {
    els.softwareImproveButton.disabled = false;
    els.softwareSelectionAcceptButton.disabled = false;
    els.softwareImproveButton.textContent = previousStatus;
  }
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

  const wasImpacted = isSoftwareRequirementImpacted(item);
  state.softwareSelections.set(String(item.id || ""), {
    text,
    score: updatedScore,
    excluded: false,
    acceptedAt: new Date().toISOString(),
  });
  if (wasImpacted && areSoftwareRequirementsForSourceDecided(item)) {
    state.changedProductRequirementRows.delete(Number(item.sourceRowNumber));
  }
  if (wasImpacted && state.e2eTests.length) {
    state.changedSoftwareRequirementIds.add(String(item.id || ""));
  }

  if (state.softwareWindchillTransferComplete) {
    markSoftwareRequirementChanged(item.id);
  } else if (wasImpacted && state.e2eTests.length) {
    resetSoftwareWindchillTransfer();
    state.softwareTransferChangeIds.add(String(item.id || ""));
  } else {
    state.e2eTests = [];
    state.e2eSelections = new Map();
    state.e2eScoreFilterActive = false;
    resetSoftwareWindchillTransfer();
  }
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
  if (state.softwareWindchillTransferComplete) {
    markSoftwareRequirementChanged(item.id);
  } else {
    state.e2eTests = [];
    state.e2eSelections = new Map();
    state.e2eScoreFilterActive = false;
    resetSoftwareWindchillTransfer();
  }
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
    if (isSoftwareRequirementImpacted(item)) return false;
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
  return signalScore >= 4 ? Math.max(Number(item.score) || 0, 86) : Math.min(Number(item.score) || 84, 84);
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
        techTypes: selectedTechTypesForRequirement(requirement, selection),
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
  await showProgress(requirements.length, { requirements, mode: "sr-derivation", batchSize: ANALYSIS_BATCH_SIZE });

  try {
    const rawSoftwareRequirements = [];
    const totalBatches = Math.ceil(requirements.length / ANALYSIS_BATCH_SIZE);
    let processed = 0;
    const keepExistingE2eTests = state.softwareWindchillTransferComplete && state.e2eTests.length > 0;

    for (let index = 0; index < requirements.length; index += ANALYSIS_BATCH_SIZE) {
      const batchNumber = Math.floor(index / ANALYSIS_BATCH_SIZE) + 1;
      const batch = requirements.slice(index, index + ANALYSIS_BATCH_SIZE);
      setStatus(`Leite Software Requirements ab ${batchNumber}/${totalBatches}`);
      updateProgress({
        processed,
        total: requirements.length,
        batchNumber,
        totalBatches,
      });

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirementType: "software", requirements: batch }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Software Requirements konnten nicht abgeleitet werden");
      }

      addOpenAiUsage(data.openAiUsage);
      rawSoftwareRequirements.push(...(Array.isArray(data.softwareRequirements) ? data.softwareRequirements : []));
      processed += batch.length;
      updateProgress({
        processed,
        total: requirements.length,
        batchNumber,
        totalBatches,
      });
    }

    state.softwareRequirements = normalizeSoftwareRequirements(
      rawSoftwareRequirements,
      requirements,
    );
    state.softwareSelections = new Map();
    if (!keepExistingE2eTests) {
      state.e2eTests = [];
      state.e2eSelections = new Map();
    }
    requirements.forEach((requirement) => state.changedProductRequirementRows.delete(Number(requirement.rowNumber)));
    state.changedSoftwareRequirementIds = keepExistingE2eTests
      ? new Set(state.softwareRequirements.map((item) => String(item.id || "")).filter(Boolean))
      : new Set();
    state.softwareScoreFilterActive = false;
    state.e2eScoreFilterActive = false;
    resetSoftwareWindchillTransfer();
    state.softwareTransferChangeIds = new Set(state.softwareRequirements.map((item) => String(item.id || "")).filter(Boolean));
    setStatus("Software Requirements erstellt");
    completeProgress(requirements.length);
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
  const normalized = softwareRequirements.map((item, index) => {
    const source =
      sourcesByRow.get(Number(item.sourceRowNumber)) ||
      sourcesById.get(String(item.sourceId || "")) ||
      sourceRequirements[index] ||
      {};

    return {
      ...item,
      sourceRowNumber: Number(item.sourceRowNumber) || Number(source.rowNumber) || index + 1,
      sourceId: item.sourceId || source.id || "",
      category: item.category || source.category || "",
      subcategory: item.subcategory || source.subcategory || "",
      techTypes: Array.isArray(item.techTypes) && item.techTypes.length
        ? item.techTypes
        : Array.isArray(source.techTypes)
          ? source.techTypes
          : [],
      source,
    };
  });
  const countBySource = new Map();
  normalized.forEach((item) => {
    const sourceKey = softwareSourceKey(item);
    countBySource.set(sourceKey, (countBySource.get(sourceKey) || 0) + 1);
  });

  const indexBySource = new Map();
  return normalized.map((item, index) => {
    const sourceKey = softwareSourceKey(item);
    const sourceIndex = (indexBySource.get(sourceKey) || 0) + 1;
    indexBySource.set(sourceKey, sourceIndex);
    const source =
      sourcesByRow.get(Number(item.sourceRowNumber)) ||
      sourcesById.get(String(item.sourceId || "")) ||
      item.source ||
      {};

    const { source: _source, ...softwareRequirement } = item;
    return {
      ...softwareRequirement,
      id: buildSoftwareRequirementId(source, {
        fallbackIndex: index,
        sourceIndex,
        sourceCount: countBySource.get(sourceKey) || 1,
      }),
    };
  });
}

function softwareSourceKey(item) {
  return String(item.sourceRowNumber || item.sourceId || item.source?.rowNumber || item.source?.id || "");
}

function buildSoftwareRequirementId(source, options = {}) {
  const fallbackIndex = Number(options.fallbackIndex) || 0;
  const sourceIndex = Number(options.sourceIndex) || 1;
  const sourceId = String(source?.id || "").trim();
  const suffix = `.${sourceIndex}`;
  if (sourceId) {
    if (/^PR(?=[_-])/i.test(sourceId)) {
      return `${sourceId.replace(/^PR/i, "SR")}${suffix}`;
    }

    if (/^PR\b/i.test(sourceId)) {
      return `${sourceId.replace(/^PR/i, "SR")}${suffix}`;
    }
  }

  const prefix = normalizeIdPart(els.idPrefix?.value || state.projectName || "REQ") || "REQ";
  const rowNumber = Number(source?.rowNumber);
  return `SR_${prefix}_${Number.isFinite(rowNumber) ? rowNumber : fallbackIndex + 1}${suffix}`;
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
  let pendingGroup = null;

  groupedRequirements(finalSoftwareRequirements).forEach((entry) => {
    if (entry.type === "group") {
      pendingGroup = entry;
      return;
    }

    const source = entry.item;
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

    if (pendingGroup) {
      rows.push(`
        <tr class="group-row">
          <td colspan="5">
            <span class="group-title">${escapeHtml(pendingGroup.category)}</span>
            <span class="group-separator">/</span>
            <span>${escapeHtml(pendingGroup.subcategory)}</span>
            <span class="group-count">${pendingGroup.count} Software Requirements</span>
          </td>
        </tr>
      `);
      pendingGroup = null;
    }

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
      const sourceProductRequirement = state.requirements.find(
        (requirement) =>
          Number(requirement.rowNumber) === Number(item.sourceRowNumber) ||
          String(requirement.id || "") === String(item.sourceId || ""),
      );

      return {
        sourceRowNumber: Number(item.sourceRowNumber),
        sourceId: item.sourceId || "",
        id: item.id || "",
        category: item.category || sourceProductRequirement?.category || "",
        subcategory: item.subcategory || sourceProductRequirement?.subcategory || "",
        text: selection.text || item.text || "",
        acceptanceCriteria: Array.isArray(item.acceptanceCriteria) ? item.acceptanceCriteria : [],
        techTypes: Array.isArray(item.techTypes) ? item.techTypes : [],
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
    .map((item) => Number(displayE2eScore(item)))
    .filter(Number.isFinite);
}

function getE2eDerivedCount() {
  const sourceIds = state.e2eTests.map((item) => String(item.sourceId || "")).filter(Boolean);
  return sourceIds.length ? new Set(sourceIds).size : state.e2eTests.length;
}

function renderE2eContent(item) {
  return `
    ${item.group ? `<p class="e2e-group-label"><span>Gruppierung</span>${escapeHtml(item.group)}</p>` : ""}
    <p class="software-requirement-text">${escapeHtml(item.description || item.text || "")}</p>
  `;
}

function renderE2eScoreCell(item, isExcluded = false) {
  if (isExcluded) return "-";

  const score = Number(displayE2eScore(item));
  if (!Number.isFinite(score)) return "-";

  const issues = Array.isArray(item.issues) ? item.issues : [];
  return `
    ${renderScoreValue(score, isCriticalScore(score))}
    ${item.rationale ? `<p class="score-rationale">${escapeHtml(item.rationale)}</p>` : ""}
    ${issues.length ? renderIssues(issues) : ""}
  `;
}

function renderE2eTestCaseTable(item) {
  return `
    <div class="e2e-table-scroll">
      <table class="e2e-testcase-table">
        <tbody>
          <tr>
            <th>E2E-ID</th>
            <td>${escapeHtml(item.id || "-")}</td>
          </tr>
          <tr>
            <th>Gruppierung</th>
            <td>${escapeHtml(item.group || "-")}</td>
          </tr>
          <tr>
            <th>Beschreibung</th>
            <td>${escapeHtml(item.description || item.text || "-")}</td>
          </tr>
          <tr>
            <th>Akzeptanzkriterien</th>
            <td>${renderPlainList(item.coveredAcceptanceCriteria || item.acceptanceCriteria)}</td>
          </tr>
          <tr>
            <th>SR-Referenz</th>
            <td>${escapeHtml(item.sourceId || "-")}</td>
          </tr>
          <tr>
            <th>PR-Referenz</th>
            <td>${escapeHtml(item.sourcePrId || "-")}</td>
          </tr>
          <tr>
            <th>Vorbedingungen</th>
            <td>${renderPlainList(item.preconditions)}</td>
          </tr>
          <tr>
            <th>Testdaten</th>
            <td>${renderPlainList(item.testData)}</td>
          </tr>
          <tr>
            <th>Testschritte</th>
            <td>${renderE2eSteps(item.steps)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

function renderPlainList(value) {
  const items = Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];
  if (!items.length) return "-";

  return `<ul class="acceptance-criteria-list">${items.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}</ul>`;
}

function renderE2eSteps(steps) {
  const items = Array.isArray(steps) ? steps.filter(Boolean) : [];
  if (!items.length) return "-";

  return `
    <ol class="e2e-step-list">
      ${items
        .map((step, index) => {
          if (typeof step === "string") {
            return `<li>${escapeHtml(step)}</li>`;
          }

          return `
            <li>
              <strong>${escapeHtml(step.action || `Schritt ${step.stepNumber || index + 1}`)}</strong>
              <span>${escapeHtml(step.expectedResult || "")}</span>
            </li>
          `;
        })
        .join("")}
    </ol>
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

  if (isE2eTestImpacted(item)) {
    return {
      className: "changed",
      icon: "!",
      label: "Software Requirement geändert - TestCase neu ableiten erforderlich",
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

  const score = Number(displayE2eScore(item));
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

function displayE2eScore(item) {
  const selection = state.e2eSelections.get(String(item?.id || ""));
  const selectionScore = Number(selection?.score);
  return Number.isFinite(selectionScore) ? selectionScore : Number(item?.score);
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
  const text = selection?.text || item.description || item.text || "";

  els.e2eSelectionId.textContent = item.id || "-";
  els.e2eSelectionSource.textContent = item.sourceId || "-";
  els.e2eSelectionScore.textContent = item.score ?? "-";
  els.e2eSelectionText.value = text;
  els.e2eImprovementInstruction.value = "";
  els.e2eImprovementAttachments.value = "";
  renderImprovementAttachmentList(els.e2eImprovementAttachments, els.e2eImprovementAttachmentList);
  const isImpacted = isE2eTestImpacted(item);
  els.e2eSelectionRegenerateButton.hidden = !isImpacted;
  els.e2eSelectionRegenerateButton.disabled = !isImpacted;
  els.e2eSelectionTable.innerHTML = renderE2eTestCaseTable(item);
  els.e2eSelectionTechTypes.innerHTML = renderReadOnlyTechTypes(item.techTypes);
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

function findSourceSoftwareRequirementForE2e(item) {
  return getFinalSoftwareRequirements().find((requirement) => String(requirement.id || "") === String(item?.sourceId || ""));
}

function hasSameE2eSource(item, sourceRequirement) {
  const sourceId = String(sourceRequirement?.id || "");
  return Boolean(sourceId) && String(item?.sourceId || "") === sourceId;
}

function areE2eTestsForSourceDecided(item) {
  const sourceId = String(item?.sourceId || "");
  if (!sourceId) return false;
  return state.e2eTests
    .filter((entry) => String(entry.sourceId || "") === sourceId)
    .every((entry) => state.e2eSelections.has(String(entry.id || "")));
}

async function regenerateE2eTestFromDialog() {
  const endpoint = getAnalyzeEndpoint();
  if (!endpoint) {
    setStatus("Server erforderlich");
    alert("Bitte starte den lokalen Server und öffne die App über http://localhost:3000.");
    return;
  }

  const e2eId = state.activeE2eTestId;
  const item = state.e2eTests.find((entry) => String(entry.id || "") === String(e2eId || ""));
  if (!item || !isE2eTestImpacted(item)) return;

  const sourceRequirement = findSourceSoftwareRequirementForE2e(item);
  if (!sourceRequirement) {
    alert("Das zugehörige Software Requirement wurde nicht gefunden.");
    return;
  }

  const previousButtonText = els.e2eSelectionRegenerateButton.textContent;
  els.e2eSelectionRegenerateButton.disabled = true;
  els.e2eSelectionAcceptButton.disabled = true;
  els.e2eImproveButton.disabled = true;
  els.e2eSelectionRegenerateButton.textContent = translateUiText("E2E TestCase wird abgeleitet...");
  setStatus("Leite E2E TestCase neu ab...");

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requirementType: "e2e", requirements: [sourceRequirement] }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "E2E TestCase konnte nicht neu abgeleitet werden");
    }

    addOpenAiUsage(data.openAiUsage);
    const rawE2eTests = Array.isArray(data.e2eTests) ? data.e2eTests : [];
    const regeneratedTests = normalizeE2eTests(rawE2eTests, [sourceRequirement]).map((testCase) => ({
      ...testCase,
      isReDerivedFromChangedSource: true,
    }));
    if (!regeneratedTests.length) {
      throw new Error("E2E TestCase konnte nicht neu abgeleitet werden");
    }

    const firstAffectedIndex = state.e2eTests.findIndex((entry) => hasSameE2eSource(entry, sourceRequirement));
    const affectedTests = state.e2eTests.filter((entry) => hasSameE2eSource(entry, sourceRequirement));
    affectedTests.forEach((entry) => state.e2eSelections.delete(String(entry.id || "")));

    const remainingTests = state.e2eTests.filter((entry) => !hasSameE2eSource(entry, sourceRequirement));
    const insertIndex = firstAffectedIndex >= 0 ? firstAffectedIndex : remainingTests.length;
    state.e2eTests = [
      ...remainingTests.slice(0, insertIndex),
      ...regeneratedTests,
      ...remainingTests.slice(insertIndex),
    ];

    const activeTest = regeneratedTests[0];
    state.activeE2eTestId = activeTest.id || "";
    els.e2eSelectionId.textContent = activeTest.id || "-";
    els.e2eSelectionSource.textContent = activeTest.sourceId || "-";
    els.e2eSelectionScore.textContent = activeTest.score ?? "-";
    els.e2eSelectionText.value = activeTest.description || activeTest.text || "";
    els.e2eSelectionTable.innerHTML = renderE2eTestCaseTable(activeTest);
    els.e2eSelectionTechTypes.innerHTML = renderReadOnlyTechTypes(activeTest.techTypes);
    els.e2eSelectionIssues.innerHTML = activeTest.issues?.length ? renderIssues(activeTest.issues) : "Keine Hinweise vorhanden.";
    els.e2eImprovementInstruction.value = "";
    els.e2eImprovementAttachments.value = "";
    renderImprovementAttachmentList(els.e2eImprovementAttachments, els.e2eImprovementAttachmentList);
    renderE2ePage();
    updateWorkflowState();
    updateContextualMenuActions();
    setStatus("E2E TestCase neu abgeleitet");
  } catch (error) {
    setStatus("Fehler");
    alert(error.message);
  } finally {
    els.e2eSelectionRegenerateButton.disabled = false;
    els.e2eSelectionAcceptButton.disabled = false;
    els.e2eImproveButton.disabled = false;
    els.e2eSelectionRegenerateButton.textContent = previousButtonText;
  }
}

async function improveE2eTestWithAi() {
  const endpoint = getAnalyzeEndpoint();
  if (!endpoint) {
    setStatus("Server erforderlich");
    alert("Bitte starte den lokalen Server und öffne die App über http://localhost:3000.");
    return;
  }

  const e2eId = state.activeE2eTestId;
  const item = state.e2eTests.find((entry) => String(entry.id || "") === String(e2eId || ""));
  const instruction = els.e2eImprovementInstruction.value.trim();
  if (!item || !instruction) {
    alert("Bitte beschreibe, was die AI am E2E TestCase verbessern soll.");
    return;
  }

  const sourceRequirement = getFinalSoftwareRequirements().find((requirement) => String(requirement.id || "") === String(item.sourceId || ""));
  if (!sourceRequirement) {
    alert("Das zugehörige Software Requirement wurde nicht gefunden.");
    return;
  }

  const previousStatus = els.e2eImproveButton.textContent;
  els.e2eImproveButton.disabled = true;
  els.e2eSelectionAcceptButton.disabled = true;
  els.e2eImproveButton.textContent = "AI verbessert...";
  setStatus("AI verbessert E2E TestCase...");

  try {
    const improvementAttachments = await readImprovementAttachments(els.e2eImprovementAttachments);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requirementType: "e2e-improvement",
        improvementInstruction: instruction,
        improvementAttachments,
        requirements: [sourceRequirement],
        testCase: {
          ...item,
          description: els.e2eSelectionText.value.trim() || item.description || item.text || "",
        },
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "E2E TestCase konnte nicht verbessert werden");
    }

    addOpenAiUsage(data.openAiUsage);
    const improved = data.e2eTest || {};
    Object.assign(item, {
      ...improved,
      id: item.id,
      sourceId: item.sourceId,
      sourcePrId: improved.sourcePrId || item.sourcePrId,
      techTypes: Array.isArray(item.techTypes) ? item.techTypes : [],
      description: improved.description || improved.text || item.description || item.text || "",
      text: improved.description || improved.text || item.text || "",
      score: Number(improved.score),
      issues: Array.isArray(improved.issues) ? improved.issues : [],
    });

    els.e2eSelectionScore.textContent = item.score ?? "-";
    els.e2eSelectionText.value = item.description || item.text || "";
    els.e2eSelectionTable.innerHTML = renderE2eTestCaseTable(item);
    els.e2eSelectionTechTypes.innerHTML = renderReadOnlyTechTypes(item.techTypes);
    els.e2eSelectionIssues.innerHTML = item.issues.length ? renderIssues(item.issues) : "Keine Hinweise vorhanden.";
    els.e2eImprovementInstruction.value = "";
    els.e2eImprovementAttachments.value = "";
    renderImprovementAttachmentList(els.e2eImprovementAttachments, els.e2eImprovementAttachmentList);
    renderE2ePage();
    updateWorkflowState();
    setStatus("E2E TestCase verbessert");
  } catch (error) {
    setStatus("Fehler");
    alert(error.message);
  } finally {
    els.e2eImproveButton.disabled = false;
    els.e2eSelectionAcceptButton.disabled = false;
    els.e2eImproveButton.textContent = previousStatus;
  }
}

function acceptE2eTest() {
  const e2eId = state.activeE2eTestId;
  if (!e2eId) return;

  const item = state.e2eTests.find((entry) => String(entry.id || "") === String(e2eId));
  const text = els.e2eSelectionText.value.trim();
  if (!item || !text) return;

  const updatedScore = scoreAcceptedE2eTest(item, text);
  item.description = text;
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
  } else if (!isCriticalScore(updatedScore) && Array.isArray(item.issues)) {
    item.issues = item.issues.filter((issue) => issue.criterion !== "E2E-Qualität");
  }

  const wasImpacted = isE2eTestImpacted(item);
  state.e2eSelections.set(String(item.id || ""), {
    text,
    description: text,
    score: updatedScore,
    excluded: false,
    acceptedAt: new Date().toISOString(),
  });
  if (wasImpacted && areE2eTestsForSourceDecided(item)) {
    state.changedSoftwareRequirementIds.delete(String(item.sourceId || ""));
  }

  closeE2eSelectionDialog();
  renderE2ePage();
  updateWorkflowState();
}

function excludeE2eTest() {
  const e2eId = state.activeE2eTestId;
  if (!e2eId) return;

  const item = state.e2eTests.find((entry) => String(entry.id || "") === String(e2eId));
  if (!item) return;

  const wasImpacted = isE2eTestImpacted(item);
  state.e2eSelections.set(String(item.id || ""), {
    text: item.description || item.text || "",
    description: item.description || item.text || "",
    score: Number(item.score),
    excluded: true,
    acceptedAt: new Date().toISOString(),
  });
  if (wasImpacted && areE2eTestsForSourceDecided(item)) {
    state.changedSoftwareRequirementIds.delete(String(item.sourceId || ""));
  }

  closeE2eSelectionDialog();
  renderE2ePage();
  updateWorkflowState();
}

function isE2eQualityReady() {
  if (!state.e2eTests.length) return false;

  return state.e2eTests.every((item) => {
    if (isE2eTestImpacted(item)) return false;
    const selection = state.e2eSelections.get(String(item.id || ""));
    if (!selection) return false;
    if (selection.excluded) return true;
    return !isCriticalScore(Number(selection.score));
  });
}

function scoreAcceptedE2eTest(item, text) {
  const currentScore = Number(item.score) || 0;
  if (state.runtimeMock) {
    return Math.max(currentScore, randomInteger(86, 99));
  }

  const normalizedText = text.trim();
  const assessmentText = buildE2eQualityAssessmentText({ ...item, description: normalizedText, text: normalizedText });
  if (assessmentText.length < 160) return Math.max(currentScore, 70);

  const steps = Array.isArray(item.steps) ? item.steps : [];
  const preconditions = Array.isArray(item.preconditions) ? item.preconditions : [];
  const testData = Array.isArray(item.testData) ? item.testData : [];
  const coveredAcceptanceCriteria = Array.isArray(item.coveredAcceptanceCriteria) ? item.coveredAcceptanceCriteria : [];
  const completeSteps = steps.filter((step) => String(step?.action || "").trim().length >= 18 && String(step?.expectedResult || "").trim().length >= 18);
  const hasNegativeCoverage = /negative|invalid|ungueltig|ungültig|fehler|error|exception|nicht verfuegbar|nicht verfügbar|permission|berechtigung/i.test(assessmentText);
  const hasCheckpoints = /akzeptanzkriter|acceptance criter|prüfpunkt|pruefpunkt|checkpoint|verifiz|verify|expected result|erwart/i.test(assessmentText);
  const hasReferences = Boolean(item.sourceId) && Boolean(item.sourcePrId);
  const structureScore = [
    normalizedText.length >= 60,
    Boolean(item.group),
    hasReferences,
    coveredAcceptanceCriteria.length > 0,
    preconditions.length > 0,
    testData.length > 0,
    steps.length >= 2,
    completeSteps.length === steps.length && steps.length > 0,
    hasCheckpoints,
    hasNegativeCoverage,
  ].filter(Boolean).length;

  let calculatedScore = 84;
  if (structureScore >= 10) {
    calculatedScore = 100;
  } else if (structureScore >= 8) {
    calculatedScore = 95;
  } else if (structureScore >= 6) {
    calculatedScore = 86;
  }

  return Math.min(100, Math.max(currentScore, calculatedScore));
}

function buildE2eQualityAssessmentText(item) {
  const stepText = (Array.isArray(item.steps) ? item.steps : [])
    .map((step) => `${step?.stepNumber || ""} ${step?.action || step || ""} ${step?.expectedResult || ""}`)
    .join(" ");
  const listText = [
    item.id,
    item.sourceId,
    item.sourcePrId,
    item.group,
    item.description || item.text,
    ...(Array.isArray(item.coveredAcceptanceCriteria) ? item.coveredAcceptanceCriteria : []),
    ...(Array.isArray(item.preconditions) ? item.preconditions : []),
    ...(Array.isArray(item.testData) ? item.testData : []),
    stepText,
    item.rationale,
  ];

  return listText.map((entry) => String(entry || "")).join(" ").trim();
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
  await showProgress(requirements.length, { requirements, mode: "e2e-derivation", batchSize: ANALYSIS_BATCH_SIZE });

  try {
    const rawE2eTests = [];
    const totalBatches = Math.ceil(requirements.length / ANALYSIS_BATCH_SIZE);
    let processed = 0;

    for (let index = 0; index < requirements.length; index += ANALYSIS_BATCH_SIZE) {
      const batchNumber = Math.floor(index / ANALYSIS_BATCH_SIZE) + 1;
      const batch = requirements.slice(index, index + ANALYSIS_BATCH_SIZE);
      setStatus(`Leite E2E TestCases ab ${batchNumber}/${totalBatches}`);
      updateProgress({
        processed,
        total: requirements.length,
        batchNumber,
        totalBatches,
      });

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirementType: "e2e", requirements: batch }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "E2E TestCases konnten nicht abgeleitet werden");
      }

      addOpenAiUsage(data.openAiUsage);
      rawE2eTests.push(...(Array.isArray(data.e2eTests) ? data.e2eTests : []));
      processed += batch.length;
      updateProgress({
        processed,
        total: requirements.length,
        batchNumber,
        totalBatches,
      });
    }

    state.e2eTests = normalizeE2eTests(rawE2eTests, requirements);
    state.e2eSelections = new Map();
    requirements.forEach((requirement) => state.changedSoftwareRequirementIds.delete(String(requirement.id || "")));
    state.e2eScoreFilterActive = false;
    setStatus("E2E TestCases erstellt");
    completeProgress(requirements.length);
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
  const normalized = e2eTests.map((item, index) => {
    const source = sourcesById.get(String(item.sourceId || "")) || sourceRequirements[index] || {};

    return {
      ...item,
      sourceId: item.sourceId || source.id || "",
      sourcePrId: item.sourcePrId || source.sourceId || "",
      coveredAcceptanceCriteria:
        Array.isArray(item.coveredAcceptanceCriteria) && item.coveredAcceptanceCriteria.length
          ? item.coveredAcceptanceCriteria
          : Array.isArray(source.acceptanceCriteria)
            ? source.acceptanceCriteria
            : [],
      techTypes: Array.isArray(item.techTypes) && item.techTypes.length
        ? item.techTypes
        : Array.isArray(source.techTypes)
          ? source.techTypes
          : [],
      description: item.description || item.text || "",
      source,
    };
  });
  const countBySource = new Map();
  normalized.forEach((item) => {
    const key = String(item.sourceId || item.source?.id || "");
    countBySource.set(key, (countBySource.get(key) || 0) + 1);
  });
  const indexBySource = new Map();

  return normalized.map((item, index) => {
    const key = String(item.sourceId || item.source?.id || "");
    const source = sourcesById.get(String(item.sourceId || "")) || item.source || sourceRequirements[index] || {};
    const sourceIndex = (indexBySource.get(key) || 0) + 1;
    indexBySource.set(key, sourceIndex);
    const { source: _source, ...testCase } = item;
    return {
      ...testCase,
      id: buildE2eTestId(source, {
        fallbackIndex: index,
        sourceIndex,
        sourceCount: countBySource.get(key) || 1,
      }),
    };
  });
}

function buildE2eTestId(source, options = {}) {
  const fallbackIndex = Number(options.fallbackIndex) || 0;
  const sourceIndex = Number(options.sourceIndex) || 1;
  const sourceCount = Number(options.sourceCount) || 1;
  const sourceId = String(source?.id || "").trim();
  const suffix = sourceCount > 1 ? `.${sourceIndex}` : "";
  if (sourceId) {
    if (/^SR(?=[_-])/i.test(sourceId)) {
      return `${sourceId.replace(/^SR/i, "E2E")}${suffix}`;
    }

    if (/^SR\b/i.test(sourceId)) {
      return `${sourceId.replace(/^SR/i, "E2E")}${suffix}`;
    }
  }

  const prefix = normalizeIdPart(els.idPrefix?.value || state.projectName || "REQ") || "REQ";
  return `E2E_${prefix}_${fallbackIndex + 1}${suffix}`;
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
    return selection && !selection.excluded && isCriticalScore(Number(displayE2eScore(item)));
  });
}

function getCriticalScoreRows(excludedRows = getExcludedRows()) {
  return new Set(
    state.results
      .filter((result) => !excludedRows.has(Number(result.rowNumber)))
      .filter((result) => state.finalSelections.has(Number(result.rowNumber)))
      .filter((result) => isCriticalScore(Number(displayProductScore(result, state.finalSelections.get(Number(result.rowNumber))))))
      .map((result) => Number(result.rowNumber)),
  );
}

function isCriticalScore(score) {
  return Number.isFinite(score) && score < PRODUCT_STEP_MIN_SCORE;
}

function markProductRequirementChanged(rowNumber) {
  const normalizedRowNumber = Number(rowNumber);
  if (!Number.isFinite(normalizedRowNumber) || !state.productWindchillTransferComplete) return;

  state.changedProductRequirementRows.add(normalizedRowNumber);
  state.productTransferChangeRows.add(normalizedRowNumber);
  clearReDerivedE2eFlagsForProductRow(normalizedRowNumber);
  state.productWindchillTransferComplete = false;
  updateWorkflowState();
}

function markSoftwareRequirementChanged(softwareId) {
  const normalizedId = String(softwareId || "");
  if (!normalizedId || !state.softwareWindchillTransferComplete) return;

  state.changedSoftwareRequirementIds.add(normalizedId);
  state.softwareTransferChangeIds.add(normalizedId);
  clearReDerivedE2eFlagsForSoftwareId(normalizedId);
  state.softwareWindchillTransferComplete = false;
  updateWorkflowState();
}

function clearReDerivedE2eFlagsForProductRow(rowNumber) {
  const sourceIds = new Set(
    state.softwareRequirements
      .filter((item) => Number(item.sourceRowNumber) === Number(rowNumber))
      .map((item) => String(item.id || ""))
      .filter(Boolean),
  );
  state.e2eTests.forEach((item) => {
    if (sourceIds.has(String(item.sourceId || ""))) {
      item.isReDerivedFromChangedSource = false;
    }
  });
}

function clearReDerivedE2eFlagsForSoftwareId(softwareId) {
  const normalizedId = String(softwareId || "");
  state.e2eTests.forEach((item) => {
    if (String(item.sourceId || "") === normalizedId) {
      item.isReDerivedFromChangedSource = false;
    }
  });
}

function isSoftwareRequirementImpacted(item) {
  if (!item || item.pending) return false;
  return state.changedProductRequirementRows.has(Number(item.sourceRowNumber));
}

function isE2eTestImpacted(item) {
  if (!item || item.pending) return false;
  if (item.isReDerivedFromChangedSource) {
    return !state.e2eSelections.has(String(item.id || ""));
  }
  const sourceId = String(item.sourceId || "");
  if (state.changedSoftwareRequirementIds.has(sourceId)) return true;

  const sourceRequirement = state.softwareRequirements.find((entry) => String(entry.id || "") === sourceId);
  return isSoftwareRequirementImpacted(sourceRequirement);
}

function hasDerivedSoftwareChange() {
  return state.softwareRequirements.some((item) => {
    if (!item || item.pending) return false;
    if (isSoftwareRequirementImpacted(item)) return true;
    return state.softwareTransferChangeIds.has(String(item.id || ""));
  });
}

function hasDerivedE2eChange() {
  return state.e2eTests.some((item) => {
    if (!item || item.pending) return false;
    return isE2eTestImpacted(item);
  });
}

function hasWorkflowChange(processStep) {
  if (processStep === "product") return state.productTransferChangeRows.size > 0;
  if (processStep === "software") {
    return hasDerivedSoftwareChange();
  }
  if (processStep === "e2e") {
    return hasDerivedE2eChange();
  }
  return false;
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
  state.productTransferChangeRows = new Set();
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
  state.softwareTransferChangeIds = new Set();
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
  state.productTransferChangeRows = new Set();
}

function resetSoftwareWindchillTransfer() {
  state.softwareWindchillTransferComplete = false;
  state.softwareWindchillTransferredAt = "";
  state.softwareTransferChangeIds = new Set();
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
  els.analyzeProductButton.disabled = !canUseProductActions || state.requirements.length === 0;
  els.analyzeProductButton.title = canUseProductActions ? "" : "PR-Analyse ist nur im PR-Schritt verfügbar";
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
      techTypes: state.techTypes,
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
      language: currentLanguage(),
      openAiCostSummary: normalizedOpenAiCostSummary(),
      productWindchillTransferComplete: state.productWindchillTransferComplete,
      productWindchillTransferredAt: state.productWindchillTransferredAt,
      softwareWindchillTransferComplete: state.softwareWindchillTransferComplete,
      softwareWindchillTransferredAt: state.softwareWindchillTransferredAt,
      changedProductRequirementRows: [...state.changedProductRequirementRows],
      changedSoftwareRequirementIds: [...state.changedSoftwareRequirementIds],
      productTransferChangeRows: [...state.productTransferChangeRows],
      softwareTransferChangeIds: [...state.softwareTransferChangeIds],
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
  state.techTypes = Array.isArray(source.techTypes) ? source.techTypes : [];
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
        description: selection.description || selection.text || "",
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
        ...(Array.isArray(selection.techTypes) ? { techTypes: selection.techTypes } : {}),
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
  state.changedProductRequirementRows = new Set(
    (Array.isArray(payload.state?.changedProductRequirementRows) ? payload.state.changedProductRequirementRows : [])
      .map(Number)
      .filter(Number.isFinite),
  );
  state.changedSoftwareRequirementIds = new Set(
    (Array.isArray(payload.state?.changedSoftwareRequirementIds) ? payload.state.changedSoftwareRequirementIds : [])
      .map((id) => String(id || ""))
      .filter(Boolean),
  );
  state.productTransferChangeRows = new Set(
    (Array.isArray(payload.state?.productTransferChangeRows) ? payload.state.productTransferChangeRows : [])
      .map(Number)
      .filter(Number.isFinite),
  );
  state.softwareTransferChangeIds = new Set(
    (Array.isArray(payload.state?.softwareTransferChangeIds) ? payload.state.softwareTransferChangeIds : [])
      .map((id) => String(id || ""))
      .filter(Boolean),
  );
  state.analysisComplete = Boolean(payload.state?.analysisComplete || state.results.length);
  state.activeProcessStep = payload.state?.activeProcessStep || "product";
  state.language = LANGUAGES[payload.state?.language] ? payload.state.language : DEFAULT_LANGUAGE;
  document.documentElement.lang = state.language;
  els.languageSelect.value = state.language;

  els.fileState.textContent = state.projectName ? `${state.projectName} (Projekt)` : fileName;
  els.sheetSelect.innerHTML = "";
  els.sheetSelect.append(new Option(state.sheetName, state.sheetName));
  els.sheetSelect.value = state.sheetName;
  els.sheetSelect.disabled = false;
  els.headerRow.disabled = false;
  fillColumnSelects();
  fillTechTypeColumnSelects();
  applyImportConfig(payload.config || {});

  state.requirements = Array.isArray(payload.state?.requirements)
    ? payload.state.requirements
    : buildRequirementsFromCurrentConfig();
  state.generatedIds = Boolean(payload.state?.generatedIds);
  setAutoIdVisible(state.generatedIds);
  els.analyzeButton.disabled = state.requirements.length === 0;
  els.analyzeProductButton.disabled = state.requirements.length === 0;
  updateProjectActions();
  updateExportAvailability();
  renderWorkspaceState();
  renderProcessPages();
  renderTable();
  renderMetrics();
  scheduleApplyTranslations();
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
    techTypeValueClassColumn: els.techTypeValueClassColumn.value,
    techTypeDesignationColumn: els.techTypeDesignationColumn.value,
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
  if (config.techTypeValueClassColumn != null && config.techTypeValueClassColumn !== "") {
    setSelectValue(els.techTypeValueClassColumn, config.techTypeValueClassColumn);
  }
  if (config.techTypeDesignationColumn != null && config.techTypeDesignationColumn !== "") {
    setSelectValue(els.techTypeDesignationColumn, config.techTypeDesignationColumn);
  }
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
  return new Intl.NumberFormat(currentLanguage() === "en" ? "en-US" : "de-DE", {
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
  if (score >= PRODUCT_STEP_MIN_SCORE) return "good";
  if (score >= 55) return "warn";
  return "bad";
}

let isApplyingTranslations = false;
let translationObserver = null;
let translationTimerId = null;

function currentLanguage() {
  return LANGUAGES[state.language] ? state.language : DEFAULT_LANGUAGE;
}

function translateUiText(value, language = currentLanguage()) {
  const text = String(value ?? "");
  const normalizedText = normalizeUiText(text);
  if (!normalizedText) return text;
  if (language === DEFAULT_LANGUAGE) return translateDefaultUiText(normalizedText);

  const dictionary = UI_TRANSLATIONS[language] || {};
  if (dictionary[normalizedText]) return dictionary[normalizedText];

  return translateUiPattern(normalizedText, dictionary);
}

function translateDefaultUiText(text) {
  const normalizedText = normalizeUiText(text);
  for (const dictionary of Object.values(UI_TRANSLATIONS)) {
    const match = Object.entries(dictionary).find(([, translated]) => normalizeUiText(translated) === normalizedText);
    if (match) return match[0];
  }

  return translateDefaultUiPattern(normalizedText);
}

function normalizeUiText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function translateDefaultUiPattern(text) {
  const replacements = [
    [/^(\d[\d.,]*) tokens$/, "$1 Tokens"],
    [/^(\d[\d.,]*) tokens estimated$/, "$1 Tokens geschätzt"],
    [/^(\d[\d.,]*) tokens \(prices not configured\)$/, "$1 Tokens (Preise nicht konfiguriert)"],
    [/^(\d[\d.,]*) tokens estimated \(prices not configured\)$/, "$1 Tokens geschätzt (Preise nicht konfiguriert)"],
    [/^All (\d+) TechTypes selected$/, "Alle $1 TechTypes ausgewählt"],
    [/^(\d+) of (\d+) TechTypes selected$/, "$1 von $2 TechTypes ausgewählt"],
    [/^No requirements with score below (\d+) found\.$/, "Keine Requirements mit Score unter $1 gefunden."],
    [/^No Software Requirements with score below (\d+) found\.$/, "Keine Software Requirements mit Score unter $1 gefunden."],
    [/^No E2E TestCases with score below (\d+) found\.$/, "Keine E2E TestCases mit Score unter $1 gefunden."],
    [/^Final score below (\d+)$/, "Finaler Score unter $1"],
    [/^Software Requirement score below (\d+)$/, "Software Requirement Score unter $1"],
    [/^E2E TestCase score below (\d+)$/, "E2E TestCase Score unter $1"],
    [/^Score below (\d+)$/, "Score unter $1"],
    [/^Score >= (\d+) required$/, "Score >= $1 erforderlich"],
    [/^Filter: score < (\d+)$/, "Filter: Score < $1"],
    [/^SR filter: score < (\d+)$/, "SR-Filter: Score < $1"],
    [/^E2E filter: score < (\d+)$/, "E2E-Filter: Score < $1"],
    [/^Batch (\d+) of (\d+) is being processed\.$/, "Batch $1 von $2 wird verarbeitet."],
    [/^(\d+) of (\d+) requirements processed$/, "$1 von $2 Requirements verarbeitet"],
    [/^(\d+) requirements analyzed · Duration (.+)$/, "$1 Requirements analysiert · Dauer $2"],
    [/^Remaining approx\. (.+)$/, "Restzeit ca. $1"],
    [/^(.+) remaining$/, "$1 verbleibend"],
    [/^Simulated transfer completed: (.+)$/, "Simulierte Übertragung abgeschlossen: $1"],
    [/^Project file could not be loaded: (.+)$/, "Projektdatei konnte nicht geladen werden: $1"],
    [/^Please complete all PRs with score >= (\d+) first\.$/, "Bitte schließe zuerst alle PR mit Score >= $1 ab."],
    [
      /^Please accept or close all SRs first\. Accepted SRs require score >= (\d+)\.$/,
      "Bitte übernimm oder schließe zuerst alle SR ab. Übernommene SR benötigen Score >= $1.",
    ],
  ];

  for (const [pattern, replacement] of replacements) {
    if (pattern.test(text)) return text.replace(pattern, replacement);
  }

  return text;
}

function translateUiPattern(text, dictionary) {
  const replacements = [
    [/^(\d[\d.,]*) Tokens$/, "$1 tokens"],
    [/^(\d[\d.,]*) Tokens geschätzt$/, "$1 tokens estimated"],
    [/^(\d[\d.,]*) Tokens \(Preise nicht konfiguriert\)$/, "$1 tokens (prices not configured)"],
    [/^(\d[\d.,]*) Tokens geschätzt \(Preise nicht konfiguriert\)$/, "$1 tokens estimated (prices not configured)"],
    [/^Alle (\d+) TechTypes ausgewählt$/, "All $1 TechTypes selected"],
    [/^(\d+) von (\d+) TechTypes ausgewählt$/, "$1 of $2 TechTypes selected"],
    [/^(\d+) Requirements$/, "$1 Requirements"],
    [/^(\d+) Product Requirements$/, "$1 Product Requirements"],
    [/^(\d+) Software Requirements$/, "$1 Software Requirements"],
    [/^Keine Requirements mit Score unter (\d+) gefunden\.$/, "No requirements with score below $1 found."],
    [/^Keine Software Requirements mit Score unter (\d+) gefunden\.$/, "No Software Requirements with score below $1 found."],
    [/^Keine E2E TestCases mit Score unter (\d+) gefunden\.$/, "No E2E TestCases with score below $1 found."],
    [/^Finaler Score unter (\d+)$/, "Final score below $1"],
    [/^Software Requirement Score unter (\d+)$/, "Software Requirement score below $1"],
    [/^E2E TestCase Score unter (\d+)$/, "E2E TestCase score below $1"],
    [/^Score unter (\d+)$/, "Score below $1"],
    [/^Score >= (\d+) erforderlich$/, "Score >= $1 required"],
    [/^Filter: Score < (\d+)$/, "Filter: score < $1"],
    [/^SR-Filter: Score < (\d+)$/, "SR filter: score < $1"],
    [/^E2E-Filter: Score < (\d+)$/, "E2E filter: score < $1"],
    [/^Batch (\d+) von (\d+) wird verarbeitet\.$/, "Batch $1 of $2 is being processed."],
    [/^(\d+) von (\d+) Requirements verarbeitet$/, "$1 of $2 requirements processed"],
    [
      /^(\d+) von (\d+) Requirements verarbeitet · Laufzeit (.+) · Restzeit ca\. (.+)$/,
      "$1 of $2 requirements processed · Runtime $3 · Remaining approx. $4",
    ],
    [
      /^(\d+) von (\d+) Requirements verarbeitet · Batch (\d+) von (\d+) · Laufzeit (.+) · Restzeit ca\. (.+)$/,
      "$1 of $2 requirements processed · Batch $3 of $4 · Runtime $5 · Remaining approx. $6",
    ],
    [
      /^(\d+) von (\d+) Requirements verarbeitet · Laufzeit (.+) · Restzeit wird berechnet$/,
      "$1 of $2 requirements processed · Runtime $3 · Calculating remaining time",
    ],
    [
      /^(\d+) von (\d+) Requirements verarbeitet · Batch (\d+) von (\d+) · Laufzeit (.+) · Restzeit wird berechnet$/,
      "$1 of $2 requirements processed · Batch $3 of $4 · Runtime $5 · Calculating remaining time",
    ],
    [/^(\d+) Requirements analysiert · Dauer (.+)$/, "$1 requirements analyzed · Duration $2"],
    [/^Restzeit ca\. (.+)$/, "Remaining approx. $1"],
    [/^(.+) verbleibend$/, "$1 remaining"],
    [/^Simulierte Übertragung abgeschlossen: (.+)$/, "Simulated transfer completed: $1"],
    [/^Projektdatei konnte nicht geladen werden: (.+)$/, "Project file could not be loaded: $1"],
    [/^Bitte schließe zuerst alle PR mit Score >= (\d+) ab\.$/, "Please complete all PRs with score >= $1 first."],
    [
      /^Bitte übernimm oder schließe zuerst alle SR ab\. Übernommene SR benötigen Score >= (\d+)\.$/,
      "Please accept or close all SRs first. Accepted SRs require score >= $1.",
    ],
  ];

  for (const [pattern, replacement] of replacements) {
    if (pattern.test(text)) return text.replace(pattern, replacement);
  }

  return dictionary[text] || text;
}

function translateHtml(html) {
  if (currentLanguage() === DEFAULT_LANGUAGE || !html) return html;

  const template = document.createElement("template");
  template.innerHTML = html;
  translateNode(template.content);
  return template.innerHTML;
}

function setLanguage(language, options = {}) {
  const nextLanguage = LANGUAGES[language] ? language : DEFAULT_LANGUAGE;
  state.language = nextLanguage;
  document.documentElement.lang = nextLanguage;
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
  if (els.languageSelect.value !== nextLanguage) {
    els.languageSelect.value = nextLanguage;
  }

  if (!options.skipRender) {
    renderWorkspaceState();
    renderOpenAiCostSummary();
    renderAboutPage();
  }
  scheduleApplyTranslations();
  updateProjectActions();
}

function setupTranslationObserver() {
  if (translationObserver) {
    translationObserver.disconnect();
    translationObserver = null;
  }
}

function applyTranslations() {
  isApplyingTranslations = true;
  try {
    translateKnownUiElements();
    translateStaticSelectOptions();
  } finally {
    isApplyingTranslations = false;
  }
}

function scheduleApplyTranslations() {
  if (translationTimerId) {
    window.clearTimeout(translationTimerId);
  }

  translationTimerId = window.setTimeout(() => {
    translationTimerId = null;
    applyTranslations();
  }, 0);
}

function translateKnownUiElements() {
  renderWorkflowTranslations();
  document
    .querySelectorAll("button, summary, h1, h2, h3, p, dt, th, span, small, strong, label")
    .forEach((element) => {
      if (shouldSkipUiTextElement(element)) return;
      const original = element.dataset.i18nOriginalText || element.textContent;
      element.dataset.i18nOriginalText = original;
      element.textContent = translateUiText(original);
    });

  document.querySelectorAll("[title], [placeholder], [aria-label]").forEach((element) => {
    translateElementAttributes(element);
  });
}

function shouldSkipUiTextElement(element) {
  if (!element || element.closest("tbody")) return true;
  if (element.closest(".workflow-step")) return true;
  if (element.closest(".attachment-list")) return true;
  if (element.closest("textarea, input, select, option, script, style")) return true;
  if (element.closest(".readonly-requirement-text, .software-requirement-text, .issue-list, .acceptance-criteria-list, .readonly-techtype-list")) return true;
  if ([...element.childNodes].some((node) => node.nodeType === Node.ELEMENT_NODE)) return true;
  return !element.textContent.trim();
}

function renderWorkflowTranslations() {
  const language = currentLanguage();
  const titles = WORKFLOW_STEP_TITLES[language] || WORKFLOW_STEP_TITLES[DEFAULT_LANGUAGE];
  els.workflowSteps.forEach((step) => {
    const processStep = step.dataset.processStep;
    const title = titles[processStep] || WORKFLOW_STEP_TITLES[DEFAULT_LANGUAGE][processStep] || [];
    const titleElement = step.querySelector("span");
    if (titleElement && title.length) {
      titleElement.replaceChildren(...title.flatMap((part, index) => {
        const nodes = [];
        if (index > 0) nodes.push(document.createElement("br"));
        nodes.push(document.createTextNode(part));
        return nodes;
      }));
    }

    const statusElement = step.querySelector("small");
    if (statusElement) {
      statusElement.textContent = translateUiText(statusElement.textContent);
    }
  });
}

function translateNode(node) {
  if (!node) return;
  if (node.nodeType === Node.TEXT_NODE) {
    translateTextNode(node);
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;

  if (node.nodeType === Node.ELEMENT_NODE) {
    translateElementAttributes(node);
  }

  node.childNodes.forEach((child) => translateNode(child));
}

function translateTextNode(node) {
  if (!node || !node.nodeValue.trim()) return;
  const parent = node.parentElement;
  if (parent && ["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "SELECT", "OPTION"].includes(parent.tagName)) return;
  if (parent?.closest("tbody")) return;

  const original = node.__i18nOriginal ?? node.nodeValue;
  node.__i18nOriginal = original;
  node.nodeValue = translateUiText(original);
}

function translateElementAttributes(element) {
  if (!element?.getAttribute) return;
  ["title", "placeholder", "aria-label"].forEach((attribute) => {
    if (!element.hasAttribute(attribute)) return;
    const dataKey = `i18nOriginal${attribute.replace(/(^|-)([a-z])/g, (_match, _dash, char) => char.toUpperCase())}`;
    const original = element.dataset[dataKey] ?? element.getAttribute(attribute);
    element.dataset[dataKey] = original;
    element.setAttribute(attribute, translateUiText(original));
  });
}

function translateStaticSelectOptions() {
  [els.requirementType].filter(Boolean).forEach((select) => {
    [...select.options].forEach((option) => {
      const original = option.dataset.i18nOriginalText || option.textContent;
      option.dataset.i18nOriginalText = original;
      option.textContent = translateUiText(original);
    });
  });
}

function setStatus(text) {
  els.statusPill.textContent = translateUiText(text);
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

  return new Intl.DateTimeFormat(currentLanguage() === "en" ? "en-US" : "de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

async function showProgress(total, options = {}) {
  clearProgressTimer();
  state.progressStartedAt = Date.now();
  state.progressProcessed = 0;
  state.progressTotal = total;
  state.progressBatchNumber = 0;
  state.progressTotalBatches = progressTotalBatches(total, options);
  state.progressEstimatedRemainingMs = null;
  state.progressInitialEstimatedMs = null;
  state.progressMode = options.mode || "";
  state.progressInputCharCount = countProgressInputChars(options.requirements);
  els.progressOverlay.hidden = false;
  els.progressTitle.textContent = "Requirements werden analysiert";
  els.progressText.textContent = "Berechne voraussichtliche Bearbeitungszeit...";
  els.progressBar.style.width = "0%";
  els.progressTimeBar.style.width = "0%";
  els.progressTimeText.textContent = "Restzeit wird berechnet";
  renderProgressDetail();
  state.progressEstimatedRemainingMs = await calculateInitialProgressEstimate(total, options);
  state.progressInitialEstimatedMs = state.progressEstimatedRemainingMs;
  renderProgressDetail();
  els.progressText.textContent = "Die Analyse wird vorbereitet.";
  state.progressTimerId = window.setInterval(tickProgressCountdown, 1000);
}

function updateProgress({ processed, total, batchNumber, totalBatches }) {
  state.progressProcessed = processed;
  state.progressTotal = total;
  state.progressBatchNumber = batchNumber;
  state.progressTotalBatches = totalBatches;
  const measuredRemainingMs = estimateRemainingMs({ processed, total, batchNumber, totalBatches });
  if (measuredRemainingMs != null) {
    state.progressEstimatedRemainingMs = measuredRemainingMs;
  }
  const percent = progressPercent({ processed, total, batchNumber, totalBatches });
  els.progressText.textContent = `Batch ${batchNumber} von ${totalBatches} wird verarbeitet.`;
  els.progressBar.style.width = `${percent}%`;
  renderProgressDetail();
}

function completeProgress(processed) {
  clearProgressTimer();
  rememberProgressTiming(Date.now() - state.progressStartedAt);
  els.progressTitle.textContent = "Analyse abgeschlossen";
  els.progressText.textContent = "Alle verfügbaren Ergebnisse wurden verarbeitet.";
  els.progressBar.style.width = "100%";
  els.progressTimeBar.style.width = "100%";
  els.progressTimeText.textContent = "Abgeschlossen";
  els.progressDetail.textContent = `${processed} Requirements analysiert · Dauer ${formatDuration(Date.now() - state.progressStartedAt)}`;
  window.setTimeout(hideProgress, 900);
}

function hideProgress() {
  clearProgressTimer();
  els.progressOverlay.hidden = true;
}

function tickProgressCountdown() {
  if (els.progressOverlay.hidden) return;
  if (state.progressEstimatedRemainingMs == null) return;

  state.progressEstimatedRemainingMs = Math.max(state.progressEstimatedRemainingMs - 1000, 0);
  renderProgressDetail();
}

function renderProgressDetail() {
  const processed = Number(state.progressProcessed) || 0;
  const total = Number(state.progressTotal) || 0;
  const batchNumber = Number(state.progressBatchNumber) || 0;
  const totalBatches = Number(state.progressTotalBatches) || 0;
  const elapsed = state.progressStartedAt ? Date.now() - state.progressStartedAt : 0;
  const remaining = state.progressEstimatedRemainingMs;
  const remainingText = remaining == null ? "Restzeit wird berechnet" : `Restzeit ca. ${formatDuration(remaining)}`;
  const batchText = totalBatches > 1
    ? ` · Batch ${Math.min(batchNumber || 1, totalBatches)} von ${totalBatches}`
    : "";
  els.progressDetail.textContent = `${processed} von ${total} Requirements verarbeitet${batchText} · Laufzeit ${formatDuration(elapsed)} · ${remainingText}`;
  renderProgressTimeBar(elapsed, remaining);
}

function renderProgressTimeBar(elapsed, remaining) {
  if (remaining == null || !state.progressInitialEstimatedMs) {
    els.progressTimeBar.style.width = "0%";
    els.progressTimeText.textContent = "Restzeit wird berechnet";
    return;
  }

  const totalTime = Math.max(elapsed + remaining, state.progressInitialEstimatedMs, 1);
  const percent = Math.max(0, Math.min(100, Math.round((elapsed / totalTime) * 100)));
  els.progressTimeBar.style.width = `${percent}%`;
  els.progressTimeText.textContent = `${percent}% · ${formatDuration(remaining)} verbleibend`;
}

function estimateRemainingMs({ processed, total, totalBatches }) {
  if (!state.progressStartedAt || total <= 0) return null;
  if (processed >= total) return 0;

  const elapsed = Date.now() - state.progressStartedAt;
  if (totalBatches > 1) {
    const completedBatches = completedProgressBatches(processed, total, totalBatches);
    if (completedBatches <= 0) return null;

    const averageMsPerBatch = elapsed / completedBatches;
    return Math.max(Math.round(averageMsPerBatch * (totalBatches - completedBatches)), 0);
  }

  if (processed <= 0) return null;

  const averageMsPerItem = elapsed / processed;
  return Math.max(Math.round(averageMsPerItem * (total - processed)), 0);
}

function progressTotalBatches(total, options = {}) {
  if (!options.batchSize) return 0;

  return Math.max(Math.ceil((Number(total) || 0) / Number(options.batchSize)), 1);
}

function completedProgressBatches(processed, total, totalBatches) {
  if (processed >= total) return totalBatches;

  return Math.min(Math.floor(Math.max(processed, 0) / ANALYSIS_BATCH_SIZE), totalBatches);
}

function progressPercent({ processed, total, batchNumber, totalBatches }) {
  if (total <= 0) return 0;

  if (totalBatches > 1) {
    const completedBatches = completedProgressBatches(processed, total, totalBatches);
    const currentBatchHint = processed < total && batchNumber > completedBatches ? 0.08 : 0;
    const batchProgress = Math.min(completedBatches + currentBatchHint, totalBatches);
    return Math.max(0, Math.min(100, Math.round((batchProgress / totalBatches) * 100)));
  }

  return Math.max(0, Math.min(100, Math.round((processed / total) * 100)));
}

function calculateInitialProgressEstimate(total, options = {}) {
  const requirements = Array.isArray(options.requirements) ? options.requirements : [];
  const mode = options.mode || "default";
  const defaults = getProgressTimingDefaults(mode);
  const storedTiming = readStoredProgressTiming(mode);
  const totalChars = countProgressInputChars(requirements);
  const msPerRequirement = storedTiming?.msPerRequirement || defaults.msPerRequirement;
  const msPer1000Chars = storedTiming?.msPer1000Chars || defaults.msPer1000Chars;
  const batchOverheadMs = Math.ceil(Math.max(total, 1) / ANALYSIS_BATCH_SIZE) * defaults.batchOverheadMs;
  const countEstimate = total * msPerRequirement;
  const charEstimate = (totalChars / 1000) * msPer1000Chars;
  const historicalEstimate =
    storedTiming?.averageTotalMs && storedTiming?.averageRequirementCount
      ? storedTiming.averageTotalMs * (Math.max(total, 1) / Math.max(storedTiming.averageRequirementCount, 1))
      : null;
  const learnedEstimate =
    historicalEstimate == null ? countEstimate + charEstimate : (countEstimate + charEstimate) * 0.7 + historicalEstimate * 0.3;
  const estimatedMs = Math.round(learnedEstimate + batchOverheadMs);

  return new Promise((resolve) => {
    window.setTimeout(() => {
      resolve(Math.max(estimatedMs, total > 0 ? 1000 : 0));
    }, 250);
  });
}

function rememberProgressTiming(elapsedMs) {
  const mode = state.progressMode || "default";
  const requirementCount = Number(state.progressTotal) || 0;
  if (!mode || !requirementCount || !elapsedMs || requirementCount <= 0 || elapsedMs <= 0) return;

  const charCount = Number(state.progressInputCharCount) || 0;
  const defaults = getProgressTimingDefaults(mode);
  const current = readStoredProgressTiming(mode);
  const measuredMsPerRequirement = elapsedMs / requirementCount;
  const previousMsPerRequirement = current?.msPerRequirement || measuredMsPerRequirement;
  const msPerRequirement = Math.round(previousMsPerRequirement * 0.65 + measuredMsPerRequirement * 0.35);
  const measuredMsPer1000Chars = charCount > 0 ? elapsedMs / Math.max(charCount / 1000, 1) : defaults.msPer1000Chars;
  const previousMsPer1000Chars = current?.msPer1000Chars || defaults.msPer1000Chars;
  const msPer1000Chars = Math.round(previousMsPer1000Chars * 0.85 + measuredMsPer1000Chars * 0.15);
  const averageTotalMs = Math.round((current?.averageTotalMs || elapsedMs) * 0.65 + elapsedMs * 0.35);
  const averageRequirementCount = Number(((current?.averageRequirementCount || requirementCount) * 0.65 + requirementCount * 0.35).toFixed(2));
  const samples = Math.min((Number(current?.samples) || 0) + 1, 9999);

  try {
    const allTimings = readStoredProgressTimings();
    allTimings[mode] = {
      samples,
      msPerRequirement,
      msPer1000Chars,
      averageTotalMs,
      averageRequirementCount,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(
      PROGRESS_TIMING_STORAGE_KEY,
      JSON.stringify(allTimings),
    );
  } catch {
    // Timing history is only a convenience for future estimates.
  }
}

function readStoredProgressTiming(mode = "default") {
  const timings = readStoredProgressTimings();
  const timing = timings[mode] || timings.default || migrateLegacyProgressTiming(mode);
  if (!timing || typeof timing !== "object") return null;

  return {
    samples: Number(timing.samples) || 0,
    msPerRequirement: Number(timing.msPerRequirement) || 0,
    msPer1000Chars: Number(timing.msPer1000Chars) || 0,
    averageTotalMs: Number(timing.averageTotalMs) || 0,
    averageRequirementCount: Number(timing.averageRequirementCount) || 0,
  };
}

function readStoredProgressTimings() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(PROGRESS_TIMING_STORAGE_KEY) || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    return parsed;
  } catch {
    return {};
  }
}

function migrateLegacyProgressTiming(mode) {
  if (mode !== "pr-analysis") return null;

  try {
    const parsed = JSON.parse(window.localStorage.getItem(LEGACY_PR_ANALYSIS_TIMING_STORAGE_KEY) || "null");
    if (!parsed || typeof parsed !== "object") return null;

    return {
      samples: 1,
      msPerRequirement: Number(parsed.msPerRequirement) || 0,
      msPer1000Chars: Number(parsed.msPer1000Chars) || 0,
    };
  } catch {
    return null;
  }
}

function getProgressTimingDefaults(mode) {
  return PROGRESS_TIMING_DEFAULTS[mode] || PROGRESS_TIMING_DEFAULTS.default;
}

function countProgressInputChars(requirements) {
  if (!Array.isArray(requirements)) return 0;

  return requirements.reduce((sum, item) => {
    const acceptanceCriteria = Array.isArray(item.acceptanceCriteria) ? item.acceptanceCriteria.join(" ") : item.acceptanceCriteria || "";
    return sum + String(item.text || "").length + String(item.description || "").length + String(acceptanceCriteria).length;
  }, 0);
}

function clearProgressTimer() {
  if (!state.progressTimerId) return;

  window.clearInterval(state.progressTimerId);
  state.progressTimerId = null;
}

function formatDuration(ms) {
  const totalSeconds = Math.max(Math.ceil((Number(ms) || 0) / 1000), 0);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) return `${seconds}s`;

  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
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
  setupTranslationObserver();
  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  state.language = LANGUAGES[storedLanguage] ? storedLanguage : DEFAULT_LANGUAGE;
  document.documentElement.lang = state.language;
  els.languageSelect.value = state.language;
  renderWorkspaceState();
  renderProcessPages();
  updateProjectActions();
  renderMetrics();
  scheduleApplyTranslations();
});
