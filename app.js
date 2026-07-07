const DEFAULT_LANGUAGE = "de";
const nativeFetch = window.fetch.bind(window);
window.fetch = (input, init = {}) => nativeFetch(input, { credentials: "include", ...init });

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
  adminOpen: false,
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
  projectId: "",
  projectFileName: "",
  projectSavedSnapshot: "",
  projectDirty: false,
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
  projectSaveTimerId: null,
  projectSaveInFlight: false,
  projectSaveQueued: false,
  projectSavePaused: false,
  projectRevisionAction: "",
  currentUser: null,
  adminUsers: [],
  productApprovers: [],
  productApproversLoading: false,
  productApproversLoaded: false,
  productApproversError: "",
  productApprovalApproverIds: new Set(),
  productApprovalStartedAt: "",
  productApprovalStartedBy: "",
  productApprovalListSearch: "",
  productApprovalStatusFilter: "all",
  productApprovalActiveTab: "comments",
  productApprovalDecisionMode: "",
  changeRequestDialogResolve: null,
  productReviewActiveTab: "final",
  productReviewTechTypeSearch: "",
  productReviewTechTypeFilter: "all",
  loginPasswordVisible: false,
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
const DYNAMIC_UI_TEXT_IDS = new Set([
  "accountUserName",
  "projectHeaderName",
  "projectHeaderDescription",
  "aboutVersion",
  "aboutBuild",
  "aboutTag",
  "aboutBuildDate",
  "aboutRuntimePath",
  "openAiCostTotal",
  "openAiCostDetail",
]);
const USER_ROLE_LABELS = {
  admin: "Admin",
  productRequirementOwner: "Product Requirement Owner",
  softwareRequirementOwner: "Software Requirement Owner",
  e2eTestOwner: "E2E Test Owner",
  productRequirementApprover: "Product Requirement Approver",
  softwareRequirementApprover: "Software Requirement Approver",
  e2eTestApprover: "E2E Test Approver",
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
// Keep user-facing UI copy in this map when adding screens or dialogs so German and English stay in sync.
const UI_TRANSLATIONS = {
  en: {
    "Sprache": "Language",
    "Sprache auswählen": "Select language",
    "AI Engineering Platform": "AI Engineering Platform",
    "Von Produktanforderungen zu umsetzbaren Entwicklungs- und Testartefakten.": "From product requirements to actionable development and test artifacts.",
    "Projekt": "Project",
    "Kein Projekt geöffnet": "No project open",
    "Ungespeicherte Änderungen": "Unsaved changes",
    "Projektstatus": "Project status",
    "OpenAI Kosten": "OpenAI costs",
    "0 Tokens": "0 tokens",
    "0 Tokens geschätzt (Preise nicht konfiguriert)": "0 tokens estimated (prices not configured)",
    niedrig: "low",
    mittel: "medium",
    hoch: "high",
    "Bereit": "Ready",
    "Hauptmenü": "Main menu",
    "Neues Projekt": "New project",
    "Projekt laden": "Open project",
    "Projekt-Historie": "Project history",
    "Projekt löschen": "Delete project",
    "Import": "Import",
    "Datei": "File",
    "Demo: Import aus Windchill": "Demo: Import from Windchill",
    "Windchill Import simulieren": "Simulate Windchill import",
    "Die Windchill-Schnittstelle ist in diesem MVP noch nicht verbunden. Der Import wird simuliert.": "The Windchill interface is not connected in this MVP yet. The import is simulated.",
    "Die Windchill-Schnittstelle ist in diesem MVP noch nicht verbunden. Der Import wird simuliert. Bitte nutze für echte Daten den Dateiimport.": "The Windchill interface is not connected in this MVP yet. The import is simulated. Please use file import for real data.",
    "Die echte Schnittstelle wird später angebunden. Aktuell wird nur ein Demo-Transfer angezeigt.": "The real interface will be connected later. Currently only a demo transfer is shown.",
    "Analyse": "Analysis",
    "Einstellungen": "Settings",
    "PR Analysieren": "Analyze PR",
    "PR analysieren": "Analyze PR",
    "Software Requirements ableiten": "Derive Software Requirements",
    "SR neu ableiten": "Derive SR again",
    "E2E TestCases ableiten": "Derive E2E TestCases",
    "E2E TestCase neu ableiten": "Derive E2E TestCase again",
    "Export": "Export",
    "Simulierte Übergabe an Windchill": "Simulated handoff to Windchill",
    "Noch keine echte Windchill-Verbindung": "No real Windchill connection yet",
    "Hilfe": "Help",
    "OpenAI Nutzung": "OpenAI usage",
    "OpenAI-Kosten schließen": "Close OpenAI costs",
    "Kosten": "Costs",
    "Token-Nutzung": "Token usage",
    "Die Werte beziehen sich auf den aktuellen Projektstand und werden beim Speichern des Projekts mitgesichert.": "The values refer to the current project state and are saved with the project.",
    "Workspace": "Workspace",
    "Arbeitsbereich": "Workspace",
    "Lege ein neues Projekt an oder öffne ein gespeichertes Projekt, um Requirements zu importieren und zu bewerten.": "Create a new project or open a saved project to import and assess requirements.",
    "About": "About",
    "Info": "About",
    "Von Product Requirements zu qualitätsgesicherten Software Requirements, UseCases und Testartefakten.": "From Product Requirements to quality-assured Software Requirements, UseCases, and test artifacts.",
    "Zweck": "Purpose",
    "Miele.DevPilot unterstützt Requirements Engineering durch strukturierte Analyse, Bewertung, Ableitung und Übernahme von Requirements im Projektkontext.": "Miele.DevPilot supports requirements engineering through structured analysis, assessment, derivation, and acceptance of requirements in the project context.",
    "Arbeitsstand": "Current status",
    "Aktuell verfügbar sind PR-Import und Analyse, datenbankgestützte Projekte sowie die Ableitung und Prüfung von SR inklusive Score-Schwelle und Übernahmestatus.": "Currently available: PR import and analysis, database-backed projects, and SR derivation and review including score threshold and acceptance status.",
    "Version": "Version",
    "Autor": "Author",
    "Build-Informationen": "Build information",
    "Build": "Build",
    "Tag": "Tag",
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
    "Simulation: PR würde nach Windchill übertragen. Noch keine echte Windchill-Verbindung.": "Simulation: PR would be transferred to Windchill. No real Windchill connection yet.",
    "PR-Transfer simulieren": "Simulate PR transfer",
    "PR freigeben": "Approve PR",
    "PR freigegeben": "PR approved",
    "PR-Approval konfigurieren": "Configure PR approval",
    "PR-Approval wartet": "PR approval waiting",
    "PR-Approval läuft": "PR approval in progress",
    "PR-Approval abgeschlossen": "PR approval complete",
    "PR-Approval erneut erforderlich": "PR approval required again",
    "Wähle die PR Approver aus und starte den Approval-Prozess, sobald die Product Requirements bereit sind.": "Select the PR approvers and start the approval process once the Product Requirements are ready.",
    "Starte den Approval-Prozess, sobald die Product Requirements bereit sind. Die Approver wählst du im nächsten Schritt aus.": "Start the approval process once the Product Requirements are ready. You select the approvers in the next step.",
    "Approval starten": "Start approval",
    "Approval-Prozess starten": "Start approval process",
    "Approval öffnen": "Open approval",
    "Approval abgeschlossen": "Approval complete",
    "Freigeben": "Approve",
    "Ablehnen": "Disapprove",
    "Ablehnung": "Disapproval",
    "Change Request": "Change request",
    "Ablehnungskommentar *": "Disapproval comment *",
    "Ablehnung senden": "Submit disapproval",
    "Noch nicht gestartet": "Not started yet",
    "Keine PR Approver verfügbar": "No PR approvers available",
    "Keine PR Approver ausgewählt": "No PR approvers selected",
    "PR Approver werden geladen": "Loading PR approvers",
    "PR-Freigabe erfasst": "PR approval recorded",
    "Erneut laden": "Reload",
    "Ausgewählt": "Selected",
    "Wähle mindestens einen PR Approver aus.": "Select at least one PR approver.",
    "Bitte wähle mindestens einen PR Approver aus.": "Please select at least one PR approver.",
    "Keine Requirements im Approval.": "No requirements in approval.",
    "Product Requirements sind während des laufenden Approval-Prozesses gesperrt.": "Product Requirements are locked while the approval process is running.",
    "Product Requirements sind während des Approval-Prozesses gesperrt": "Product Requirements are locked during the approval process",
    "Alle Product Requirements sind freigegeben. Ein neues Approval ist erst nach einer PR-Änderung möglich.": "All Product Requirements are approved. A new approval can only be started after a PR change.",
    "Alle Product Requirements sind bereits freigegeben. Ein neues Approval ist erst nach einer PR-Änderung möglich.": "All Product Requirements are already approved. A new approval can only be started after a PR change.",
    "Ein neues Approval ist erst nach einer Änderung an einem Product Requirement möglich.": "A new approval can only be started after a Product Requirement has changed.",
    "1 geänderte PR muss erneut freigegeben werden.": "1 changed PR must be approved again.",
    "geänderte PR müssen erneut freigegeben werden.": "changed PRs must be approved again.",
    "Alle Product Requirements erfüllen das Gate. Der Approval-Prozess kann gestartet werden.": "All Product Requirements pass the gate. The approval process can be started.",
    "Approval-Prozess kann erst gestartet werden, wenn alle nicht ausgeschlossenen Requirements Score >= 85 haben.": "Approval process cannot be started until all non-excluded Requirements have score >= 85.",
    "Finale Scores fehlen oder sind für ein oder mehrere Requirements veraltet.": "Final scores are missing or stale for one or more Requirements.",
    "Nur Product Requirement Owner können den Approval-Prozess starten.": "Only Product Requirement Owners can start the approval process.",
    "Nur Product Requirement Owner können den PR-Approval-Prozess starten.": "Only Product Requirement Owners can start the PR approval process.",
    "Finalization Gate blocked: mindestens ein Requirement benötigt Nacharbeit oder TechTypes.": "Finalization gate blocked: at least one requirement needs rework or TechTypes.",
    "Finalization Gate not complete: Scores fehlen oder sind veraltet.": "Finalization gate not complete: scores are missing or stale.",
    "Finale Score-Bewertung läuft oder fehlt.": "Final score assessment is running or missing.",
    "Filter aktiv: Requirements mit Score < 85": "Filter active: Requirements with score < 85",
    "Filter beenden": "Clear filter",
    "Status": "Status",
    "Zeile": "Row",
    "Name": "Name",
    "Titel": "Title",
    "ID oder Titel": "ID or title",
    "Requirement": "Requirement",
    "Score": "Score",
    "Quelle": "Source",
    "Hinweise": "Issues",
    "AI-Vorschlag": "AI suggestion",
    "In Freigabe": "In approval",
    "Freigegeben": "Approved",
    "Transferiert": "Transferred",
    "Geändert": "Changed",
    "Kritisch": "Critical",
    "Ausstehend": "Pending",
    "Bereit für Freigabe": "Ready for approval",
    "Bereit für Approval": "Ready for approval",
    "Final freigegeben": "Final approved",
    "Ausgeschlossen": "Excluded",
    "Finalization Gate nicht abgeschlossen": "Finalization gate not complete",
    "Finale Scores fehlen für ein oder mehrere Requirements": "Final scores are missing for one or more Requirements",
    "Der Approval-Prozess kann noch nicht gestartet werden.": "Approval process cannot be started yet.",
    "Offene Kommentare": "Open comments",
    "Benutzermenü": "User menu",
    "Abmelden": "Sign out",
    "Benutzerverwaltung": "User administration",
    "Neuer Benutzer": "New user",
    "Projektauswahl schließen": "Close project selection",
    "Projekt-Historie schließen": "Close project history",
    "Rollen auswählen": "Select roles",
    "Rolle": "Role",
    "Berechtigung": "Permission",
    "Auswahl": "Selection",
    "Name und E-Mail-Adresse für die Anmeldung.": "Name and email address for login.",
    "Product Requirements erstellen und bearbeiten.": "Create and edit Product Requirements.",
    "Software Requirements erstellen und bearbeiten.": "Create and edit Software Requirements.",
    "E2E TestCases erstellen und bearbeiten.": "Create and edit E2E TestCases.",
    "Passwort": "Password",
    "Initiales Passwort": "Initial password",
    "Alle Berechtigungen und Benutzerverwaltung.": "All permissions and user administration.",
    "Passwort anzeigen": "Show password",
    "Passwort verbergen": "Hide password",
    "Metadaten": "Metadata",
    "Requirement Detail": "Requirement detail",
    "Requirement Finalization": "Requirement finalization",
    "Finales Requirement": "Final requirement",
    "Historie": "History",
    "Finales Product Requirement": "Final Product Requirement",
    "Freigabekandidat": "Approval candidate",
    "Dieser Product-Requirement-Kandidat ist für die Freigabe vorbereitet und wird später in der simulierten Zielsystem-Vorschau angezeigt.": "This Product Requirement candidate is prepared for approval and later shown in the simulated target-system preview.",
    "Original-Requirement": "Original requirement",
    "Owner-Aktionen": "Owner actions",
    "Änderungen speichern": "Save changes",
    "Zur Freigabe bereitstellen": "Submit for approval",
    "Freigabeentscheidung": "Approval decision",
    "Approval-Details": "Approval details",
    "Kommentar": "Comment",
    "Kommentare": "Comments",
    "Freigaben": "Approvals",
    "Versionen": "Versions",
    "Entscheidung ausstehend": "Awaiting decision",
    "Keine wesentlichen Hinweise": "No major findings",
    "offener Kommentar": "open comment",
    "offene Kommentare": "open comments",
    "Meine Freigabe erfasst": "My approval recorded",
    "offen": "open",
    "Deine Freigabe wurde fuer dieses Requirement erfasst.": "Your approval has been recorded for this requirement.",
    "Noch keine Freigabe von deinem Approver-Benutzer erfasst.": "No approval from your approver user has been recorded yet.",
    "Freigaben erfasst": "approvals recorded",
    "von": "of",
    "Gestartet": "Started",
    "Laufzeit": "Runtime",
    "verbleibend": "remaining",
    "Alle PR-Freigaben sind abgeschlossen.": "All PR approvals are complete.",
    "Disapprove benötigt einen Pflichtkommentar.": "Disapproval requires a mandatory comment.",
    "Bitte gib einen Kommentar zur Änderung am freigegebenen Requirement ein.": "Please enter a comment for the change to the approved requirement.",
    "Kommentar zur Änderung": "Change comment",
    "Kommentar zur Änderung *": "Change comment *",
    "Bitte dokumentiere, warum das bereits freigegebene Requirement geändert wird.": "Please document why the already approved requirement is being changed.",
    "z. B. Change Request 12345": "e.g. Change Request 12345",
    "Kommentar speichern": "Save comment",
    "Änderungen an freigegebenen Requirements benötigen einen Kommentar.": "Changes to approved requirements require a comment.",
    "Änderung am freigegebenen Requirement": "Change to approved requirement",
    "Manuelle Änderung": "Manual change",
    "Approval-Änderung": "Approval change",
    "TechType-Änderung": "TechType change",
    "AI-unterstützte Änderung": "AI-assisted change",
    "AI-Vorschlag verwendet": "AI suggestion used",
    "Original verwendet": "Original used",
    "Keine Kommentare vorhanden.": "No comments available.",
    "Antwort des Owners": "Owner reply",
    "Antworten": "Reply",
    "Kommentar lösen": "Resolve comment",
    "Gelöst": "Resolved",
    "PR Bearbeitung abgeschlossen": "PR editing complete",
    "PR Bearbeitung offen": "PR editing open",
    "PR Bearbeitung erforderlich": "PR editing required",
    "PR Bearbeitung wartet": "PR editing waiting",
    "PR öffnen": "Open PR",
    "PR bearbeiten": "Edit PR",
    "Approval-Prozess kann gestartet werden.": "Approval process can be started.",
    "Analyse zuerst ausführen.": "Run analysis first.",
    "Nach der Analyse können finale Requirements, Scores und TechTypes bearbeitet werden.": "After analysis, final requirements, scores, and TechTypes can be edited.",
    "Requirements bereit mit Score >=": "Requirements ready with score >=",
    "Requirements bereit für Freigabe": "Requirements ready for approval",
    "mit Nacharbeit": "with rework",
    "ohne TechTypes": "without TechTypes",
    "fehlende Scores": "missing scores",
    "veraltet oder in Berechnung": "stale or calculating",
    "Lade eine Excel-Datei, um Requirements zu prüfen.": "Load an Excel file to review requirements.",
    "Aus Product Requirements ableiten": "Derive from Product Requirements",
    "SR abgeleitet": "SR derived",
    "SR Durchschnitt": "SR average",
    "Kritische SR": "Critical SR",
    "Simulation: SR würde übertragen werden. Noch keine echte Windchill-Verbindung.": "Simulation: SR would be transferred. No real Windchill connection yet.",
    "SR-Transfer simulieren": "Simulate SR transfer",
    "SR freigeben": "Approve SR",
    "SR freigegeben": "SR approved",
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
    "E2E TestCase freigeben": "Approve E2E TestCase",
    "E2E TestCase freigegeben": "E2E TestCase approved",
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
    "Später entscheiden": "Decide later",
    "Score neu berechnen": "Recalculate score",
    "Score bestanden": "Score passed",
    "Nacharbeit erforderlich": "Rework required",
    "Score erfüllt die Voraussetzung für den späteren Approval-Prozess.": "Score meets the prerequisite for the later approval process.",
    "Nacharbeit erforderlich.": "Rework required.",
    "Score neu berechnen erforderlich.": "Score recalculation required.",
    "Score wird berechnet.": "Score is being calculated.",
    "Ausgeschlossene Requirements benötigen keinen Score.": "Excluded requirements do not need a score.",
    "Score wird berechnet...": "Calculating score...",
    "Finales PR gespeichert": "Final PR saved",
    "Requirements werden analysiert": "Requirements are being analyzed",
    "Requirements verarbeitet": "requirements processed",
    "Berechne voraussichtliche Bearbeitungszeit...": "Calculating estimated processing time...",
    "Die Analyse wird vorbereitet.": "Preparing analysis.",
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
    "SR-Qualität": "SR quality",
    "Der übernommene Software-Requirement-Text erreicht den Mindestscore nicht.": "The accepted Software Requirement text does not reach the minimum score.",
    "Präzisiere Systemverhalten, Auslöser, Ergebnis, Testbarkeit und Fehlerbedingungen.": "Clarify system behavior, trigger, result, testability, and error conditions.",
    "SR ausschließen": "Exclude SR",
    "E2E TestCase übernehmen": "Accept E2E TestCase",
    "E2E TestCase prüfen und final übernehmen": "Review and finally accept E2E TestCase",
    "TestCase-Tabelle": "TestCase table",
    "z. B. präzisere Vorbedingungen, konkretere erwartete Ergebnisse, negative Tests ergänzen": "e.g. refine preconditions, make expected results more concrete, add negative tests",
    "E2E-Qualität": "E2E quality",
    "Der übernommene E2E TestCase erreicht den Mindestscore nicht.": "The accepted E2E TestCase does not reach the minimum score.",
    "Präzisiere Vorbedingungen, Testschritte, erwartete Ergebnisse und nachvollziehbare Prüfpunkte.": "Clarify preconditions, test steps, expected results, and traceable checkpoints.",
    "E2E TestCase ausschließen": "Exclude E2E TestCase",
    "Kein Projekt": "No project",
    "In Vorbereitung": "In preparation",
    "Abgeschlossen": "Completed",
    "Verfügbar": "Available",
    "Projekt erforderlich": "Project required",
    "Projekt auswählen": "Select project",
    "Beschreibung": "Description",
    "Geändert": "Changed",
    "Aktion": "Action",
    "Öffnen": "Open",
    "Löschen": "Delete",
    "Zeitpunkt": "Timestamp",
    "Benutzer": "User",
    "Wiederherstellen": "Restore",
    "Projekt verfügbar": "project available",
    "Projekte verfügbar": "projects available",
    "Stand verfügbar": "revision available",
    "Stände verfügbar": "revisions available",
    "Es sind noch keine Projekte in der Datenbank gespeichert.": "No projects have been saved in the database yet.",
    "Für dieses Projekt ist noch keine Historie vorhanden.": "No history exists for this project yet.",
    "Keine Projekte geladen.": "No projects loaded.",
    "Keine Projekte vorhanden.": "No projects available.",
    "Keine Historie geladen.": "No history loaded.",
    "Keine Historie vorhanden.": "No history available.",
    "Projekt konnte nicht geladen werden.": "Project could not be loaded.",
    "Projekt konnte nicht gelöscht werden.": "Project could not be deleted.",
    "Projektliste konnte nicht geladen werden.": "Project list could not be loaded.",
    "Projekt-Historie konnte nicht geladen werden.": "Project history could not be loaded.",
    "Automatisch gespeichert": "Saved automatically",
    "Angelegt": "Created",
    "Wiederhergestellt": "Restored",
    "Projektstand konnte nicht wiederhergestellt werden.": "Project revision could not be restored.",
    "Projekt automatisch gespeichert": "Project saved automatically",
    "aktuell": "current",
    "geöffnet": "open",
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
    "Projekt konnte nicht angelegt werden.": "Project could not be created.",
    "Server erforderlich": "Server required",
    "Server nicht erreichbar": "Server unavailable",
    "Aktueller Schritt": "Current step",
    "Keine Berechtigung": "No permission",
    "Keine Berechtigung zum Laden von Projekten": "No permission to load projects",
    "Nur Admins und Owner-Rollen können Projekte erstellen": "Only admins and owner roles can create projects",
    "Freigabe erforderlich": "Approval required",
    "Transfer-Simulation erforderlich": "Transfer simulation required",
    "abschließen": "complete",
    "muss zuerst abgeschlossen werden": "must be completed first",
    "Product Requirement erst vollständig zuordnen und Quality Gate mit Score >": "Fully assign Product Requirements first and pass the quality gate with score >",
    "Software Requirements zuerst freigeben": "Approve Software Requirements first",
    "SR-Transfer-Simulation zuerst starten": "Start SR transfer simulation first",
    "PR bereit zur Übergabe": "PR ready for handoff",
    "PR-Transfer wartet": "PR transfer waiting",
    "Demo Transfer angezeigt": "Demo transfer shown",
    "Demo Transfer wird angezeigt": "Demo transfer is shown",
    "Analyse, Bearbeitung und Approval müssen vorher abgeschlossen sein.": "Analysis, editing, and approval must be completed first.",
    "Alle nicht ausgeschlossenen Requirements benötigen Score >= 85 und TechTypes.": "All non-excluded Requirements need score >= 85 and TechTypes.",
    "Die Übergabe ist erst nach vollständiger PR-Freigabe möglich.": "Handoff is only possible after full PR approval.",
    "Starte und schließe zuerst den PR-Approval-Prozess ab.": "Start and complete the PR approval process first.",
    "Nur Product Requirement Owner oder Admins können die Transfer-Simulation starten": "Only Product Requirement Owners or admins can start the transfer simulation",
    "Nur Product Requirement Owner oder Admins können die Transfer-Simulation starten.": "Only Product Requirement Owners or admins can start the transfer simulation.",
    "Nur Software Requirement Owner oder Admins können die Transfer-Simulation starten": "Only Software Requirement Owners or admins can start the transfer simulation",
    "Nur Software Requirement Owner oder Admins können die Transfer-Simulation starten.": "Only Software Requirement Owners or admins can start the transfer simulation.",
    "Bitte gib zuerst alle abgeschlossenen Software Requirements frei.": "Please approve all completed Software Requirements first.",
    "PR würde nach Windchill übertragen": "PR would be transferred to Windchill",
    "SR würde übertragen werden": "SR would be transferred",
    "PR-Freigabe ist vor der Transfer-Simulation erforderlich": "PR approval is required before transfer simulation",
    "SR-Freigabe ist vor der Transfer-Simulation erforderlich": "SR approval is required before transfer simulation",
    "Transfer-Simulation ist nach abgeschlossener PR-Finalisierung verfügbar": "Transfer simulation is available after PR finalization is complete",
    "SR-Transfer-Simulation ist nach abgeschlossener SR-Übernahme verfügbar": "SR transfer simulation is available after SR acceptance is complete",
    "Demo-Import aus Windchill ist nur im PR-Schritt verfügbar": "Demo import from Windchill is only available in the PR step",
    "Nur Product Requirement Owner oder Admins können Product Requirements erstellen": "Only Product Requirement Owners or admins can create Product Requirements",
    "Nur Product Requirement Owner oder Admins können Product Requirements bearbeiten": "Only Product Requirement Owners or admins can edit Product Requirements",
    "Nur Software Requirement Owner oder Admins können Software Requirements bearbeiten": "Only Software Requirement Owners or admins can edit Software Requirements",
    "Nur E2E Test Owner oder Admins können E2E TestCases bearbeiten": "Only E2E Test Owners or admins can edit E2E TestCases",
    "Software Requirements können erst im SR-Schritt nach abgeschlossener PR-Finalisierung und Transfer-Simulation abgeleitet werden": "Software Requirements can only be derived in the SR step after PR finalization and transfer simulation are complete",
    "E2E TestCases können erst im E2E-Schritt nach abgeschlossener SR-Übernahme und Transfer-Simulation abgeleitet werden": "E2E TestCases can only be derived in the E2E step after SR acceptance and transfer simulation are complete",
    "PRs wurden bereits analysiert. Nutze die AI-Verbesserung in den einzelnen Requirements.": "PRs have already been analyzed. Use AI improvement in the individual requirements.",
    "Öffne zuerst ein Projekt": "Open a project first",
    "Importiere zuerst eine PR-Datei": "Import a PR file first",
    "Analyse läuft": "Analysis running",
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
    "Starte zuerst die PR-Transfer-Simulation.": "Start the PR transfer simulation first.",
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
    "SR-Transfer-Simulation noch erforderlich": "SR transfer simulation still required",
    "Dateiimport ist nur im PR-Schritt verfügbar": "File import is only available in the PR step",
    "Einstellungen sind nur im PR-Schritt verfügbar": "Settings are only available in the PR step",
    "PR-Analyse ist nur im PR-Schritt verfügbar": "PR analysis is only available in the PR step",
    "Projekt gespeichert": "Project saved",
    "Speichern abgebrochen": "Save canceled",
    "Analyse abgeschlossen": "Analysis complete",
    "Alle verfügbaren Ergebnisse wurden verarbeitet.": "All available results have been processed.",
    "Simulation läuft...": "Simulation running...",
    "Simulation abgeschlossen": "Simulation complete",
    "PR Transfer-Simulation abgeschlossen": "PR transfer simulation complete",
    "SR Transfer-Simulation abgeschlossen": "SR transfer simulation complete",
    "Änderung erkannt": "Change detected",
    "Quelle geändert - neu ableiten erforderlich": "Source changed - derivation required",
    "Software Requirement geändert - TestCase neu ableiten erforderlich": "Software Requirement changed - TestCase derivation required",
    "Bitte starte den lokalen Server und öffne die App über http://localhost:3000. Die Analyse-API ist über file:// nicht verfügbar.": "Please start the local server and open the app at http://localhost:3000. The analysis API is not available via file://.",
    "Bitte starte den lokalen Server und öffne die App über http://localhost:3000.": "Please start the local server and open the app at http://localhost:3000.",
    "Bitte beschreibe, was die AI am Product Requirement verbessern soll.": "Please describe what the AI should improve in the Product Requirement.",
    "Bitte wähle mindestens einen TechType aus.": "Please select at least one TechType.",
    "Die Änderung wurde gespeichert. Bitte prüfe den neu berechneten Score und gib das Requirement anschließend erneut frei.": "The change was saved. Please review the recalculated score and approve the requirement again.",
    "Die Passwörter stimmen nicht überein.": "The passwords do not match.",
    "Benutzer werden geladen...": "Loading users...",
    "Benutzer konnten nicht geladen werden": "Users could not be loaded",
    "Benutzer anlegen": "Create user",
    "Benutzer bearbeiten": "Edit user",
    "Benutzer speichern": "Save user",
    "Benutzer wird gespeichert...": "Saving user...",
    "Benutzer konnte nicht gespeichert werden": "User could not be saved",
    "Benutzer gespeichert": "User saved",
    "Benutzer angelegt": "User created",
    "Benutzer wird gelöscht...": "Deleting user...",
    "Benutzer konnte nicht gelöscht werden": "User could not be deleted",
    "Benutzer gelöscht": "User deleted",
    "Keine Benutzer geladen.": "No users loaded.",
    "Keine Benutzer vorhanden.": "No users available.",
    "Bearbeiten": "Edit",
    "Aktionen für": "Actions for",
    "du": "you",
    "Inaktiv": "Inactive",
    "Passwortwechsel offen": "Password change pending",
    "Aktiv": "Active",
    "Rolle und Kontostatus des Benutzers.": "Role and account status of the user.",
    "Neue Benutzer müssen das Passwort nach der ersten Anmeldung ändern.": "New users must change their password after the first login.",
    "Approver für dieses Projekt auswählen": "Select approvers for this project",
    "Melde dich mit deinem Benutzernamen oder deiner E-Mail-Adresse und Passwort an.": "Sign in with your username or email address and password.",
    "Anmeldung fehlgeschlagen": "Login failed",
    "Passwort konnte nicht geändert werden": "Password could not be changed",
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
  languageSelect: document.querySelector("#languageSelect"),
  newProjectButton: document.querySelector("#newProjectButton"),
  openFileButton: document.querySelector("#openFileButton"),
  openWindchillButton: document.querySelector("#openWindchillButton"),
  openProjectButton: document.querySelector("#openProjectButton"),
  projectHistoryButton: document.querySelector("#projectHistoryButton"),
  adminMenu: document.querySelector("#adminMenu"),
  openUserAdminButton: document.querySelector("#openUserAdminButton"),
  deleteProjectButton: document.querySelector("#deleteProjectButton"),
  accountState: document.querySelector("#accountState"),
  accountUserName: document.querySelector("#accountUserName"),
  accountContextMenu: document.querySelector("#accountContextMenu"),
  logoutButton: document.querySelector("#logoutButton"),
  openAiCostButton: document.querySelector("#openAiCostButton"),
  openAiCostOverlay: document.querySelector("#openAiCostOverlay"),
  openAiCostCloseButton: document.querySelector("#openAiCostCloseButton"),
  aboutButton: document.querySelector("#aboutButton"),
  closeAboutButton: document.querySelector("#closeAboutButton"),
  aboutVersion: document.querySelector("#aboutVersion"),
  aboutBuild: document.querySelector("#aboutBuild"),
  aboutTag: document.querySelector("#aboutTag"),
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
  projectSelectionOverlay: document.querySelector("#projectSelectionOverlay"),
  projectSelectionCloseButton: document.querySelector("#projectSelectionCloseButton"),
  projectSelectionMessage: document.querySelector("#projectSelectionMessage"),
  projectSelectionBody: document.querySelector("#projectSelectionBody"),
  projectHistoryOverlay: document.querySelector("#projectHistoryOverlay"),
  projectHistoryCloseButton: document.querySelector("#projectHistoryCloseButton"),
  projectHistoryMessage: document.querySelector("#projectHistoryMessage"),
  projectHistoryBody: document.querySelector("#projectHistoryBody"),
  productActionBar: document.querySelector("#productActionBar"),
  productAnalyzeAction: document.querySelector("#productAnalyzeAction"),
  productAnalyzeStatus: document.querySelector("#productAnalyzeStatus"),
  productQualityGateCard: document.querySelector("#productQualityGateCard"),
  productQualityGateTitle: document.querySelector("#productQualityGateTitle"),
  productQualityGateSummary: document.querySelector("#productQualityGateSummary"),
  productQualityGateDetail: document.querySelector("#productQualityGateDetail"),
  productQualityGateBadge: document.querySelector("#productQualityGateBadge"),
  productEditButton: document.querySelector("#productEditButton"),
  resultsTable: document.querySelector("#resultsTable"),
  resultsBody: document.querySelector("#resultsBody"),
  productApprovalSearch: document.querySelector("#productApprovalSearch"),
  productApprovalStatusFilter: document.querySelector("#productApprovalStatusFilter"),
  productApprovalListCount: document.querySelector("#productApprovalListCount"),
  productApprovalDetailPanel: document.querySelector("#productApprovalDetailPanel"),
  productApprovalDetailEmpty: document.querySelector("#productApprovalDetailEmpty"),
  productReviewDetailContent: document.querySelector("#productReviewDetailContent"),
  productReviewDetailStatus: document.querySelector("#productReviewDetailStatus"),
  productReviewDetailTitle: document.querySelector("#productReviewDetailTitle"),
  productReviewDetailSubtitle: document.querySelector("#productReviewDetailSubtitle"),
  productReviewDetailScore: document.querySelector("#productReviewDetailScore"),
  productReviewQualityWarning: document.querySelector("#productReviewQualityWarning"),
  productReviewTabs: document.querySelector("#productReviewTabs"),
  productReviewFinalTab: document.querySelector("#productReviewFinalTab"),
  productReviewTechTypesTab: document.querySelector("#productReviewTechTypesTab"),
  productReviewAnalysisTab: document.querySelector("#productReviewAnalysisTab"),
  productReviewHistoryTab: document.querySelector("#productReviewHistoryTab"),
  productReviewFinalChoiceHost: document.querySelector("#productReviewFinalChoiceHost"),
  productReviewFinalText: document.querySelector("#productReviewFinalText"),
  productReviewFinalScore: document.querySelector("#productReviewFinalScore"),
  productReviewFinalScoreStatus: document.querySelector("#productReviewFinalScoreStatus"),
  productReviewFinalScoreHint: document.querySelector("#productReviewFinalScoreHint"),
  productReviewSaveFinalTextButton: document.querySelector("#productReviewSaveFinalTextButton"),
  productReviewRecalculateScoreButton: document.querySelector("#productReviewRecalculateScoreButton"),
  productReviewFinalActionsHost: document.querySelector("#productReviewFinalActionsHost"),
  productReviewTechTypeSearch: document.querySelector("#productReviewTechTypeSearch"),
  productReviewTechTypeFilter: document.querySelector("#productReviewTechTypeFilter"),
  productReviewSelectAllTechTypesButton: document.querySelector("#productReviewSelectAllTechTypesButton"),
  productReviewClearTechTypesButton: document.querySelector("#productReviewClearTechTypesButton"),
  productReviewResetTechTypesButton: document.querySelector("#productReviewResetTechTypesButton"),
  productReviewTechTypesHost: document.querySelector("#productReviewTechTypesHost"),
  productReviewAnalysisHost: document.querySelector("#productReviewAnalysisHost"),
  productReviewHistory: document.querySelector("#productReviewHistory"),
  productApprovalDetailContent: document.querySelector("#productApprovalDetailContent"),
  productApprovalDetailStatus: document.querySelector("#productApprovalDetailStatus"),
  productApprovalDetailTitle: document.querySelector("#productApprovalDetailTitle"),
  productApprovalDetailSubtitle: document.querySelector("#productApprovalDetailSubtitle"),
  productApprovalDetailProgress: document.querySelector("#productApprovalDetailProgress"),
  productApprovalDetailId: document.querySelector("#productApprovalDetailId"),
  productApprovalDetailScore: document.querySelector("#productApprovalDetailScore"),
  productApprovalDetailOwner: document.querySelector("#productApprovalDetailOwner"),
  productApprovalDetailVersion: document.querySelector("#productApprovalDetailVersion"),
  productApprovalDetailMetaStatus: document.querySelector("#productApprovalDetailMetaStatus"),
  productApprovalDetailOpenComments: document.querySelector("#productApprovalDetailOpenComments"),
  productApprovalFinalText: document.querySelector("#productApprovalFinalText"),
  productApprovalOriginalText: document.querySelector("#productApprovalOriginalText"),
  productApprovalOwnerActions: document.querySelector("#productApprovalOwnerActions"),
  productApprovalSaveTextButton: document.querySelector("#productApprovalSaveTextButton"),
  productApprovalSubmitButton: document.querySelector("#productApprovalSubmitButton"),
  productApprovalAiImprovement: document.querySelector("#productApprovalAiImprovement"),
  productApprovalImprovementInstruction: document.querySelector("#productApprovalImprovementInstruction"),
  productApprovalImprovementAttachments: document.querySelector("#productApprovalImprovementAttachments"),
  productApprovalImprovementAttachmentList: document.querySelector("#productApprovalImprovementAttachmentList"),
  productApprovalImproveButton: document.querySelector("#productApprovalImproveButton"),
  productApprovalDecision: document.querySelector("#productApprovalDecision"),
  productApprovalApproveButton: document.querySelector("#productApprovalApproveButton"),
  productApprovalShowDisapproveButton: document.querySelector("#productApprovalShowDisapproveButton"),
  productApprovalDisapproveBox: document.querySelector("#productApprovalDisapproveBox"),
  productApprovalDisapproveComment: document.querySelector("#productApprovalDisapproveComment"),
  productApprovalDisapproveButton: document.querySelector("#productApprovalDisapproveButton"),
  productApprovalTabs: document.querySelector("#productApprovalTabs"),
  productApprovalTabContent: document.querySelector("#productApprovalTabContent"),
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
  softwareSelectionApproveButton: document.querySelector("#softwareSelectionApproveButton"),
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
  e2eSelectionApproveButton: document.querySelector("#e2eSelectionApproveButton"),
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
  approveRequirementButton: document.querySelector("#approveRequirementButton"),
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
  productApprovalBar: document.querySelector("#productApprovalBar"),
  productApprovalTitle: document.querySelector("#productApprovalTitle"),
  productApprovalText: document.querySelector("#productApprovalText"),
  productApproverSummary: document.querySelector("#productApproverSummary"),
  startProductApprovalButton: document.querySelector("#startProductApprovalButton"),
  productApprovalDetailCloseButton: document.querySelector("#productApprovalDetailCloseButton"),
  productApprovalOverlay: document.querySelector("#productApprovalOverlay"),
  productApprovalCloseButton: document.querySelector("#productApprovalCloseButton"),
  productApprovalCancelButton: document.querySelector("#productApprovalCancelButton"),
  productApprovalConfirmButton: document.querySelector("#productApprovalConfirmButton"),
  productApprovalDialogMessage: document.querySelector("#productApprovalDialogMessage"),
  productApprovalSelectedApprovers: document.querySelector("#productApprovalSelectedApprovers"),
  productApprovalApproverList: document.querySelector("#productApprovalApproverList"),
  changeRequestOverlay: document.querySelector("#changeRequestOverlay"),
  changeRequestCloseButton: document.querySelector("#changeRequestCloseButton"),
  changeRequestCancelButton: document.querySelector("#changeRequestCancelButton"),
  changeRequestConfirmButton: document.querySelector("#changeRequestConfirmButton"),
  changeRequestTitle: document.querySelector("#changeRequestTitle"),
  changeRequestDescription: document.querySelector("#changeRequestDescription"),
  changeRequestComment: document.querySelector("#changeRequestComment"),
  changeRequestMessage: document.querySelector("#changeRequestMessage"),
  scoreFilterBar: document.querySelector("#scoreFilterBar"),
  clearScoreFilterButton: document.querySelector("#clearScoreFilterButton"),
  emptyWorkspace: document.querySelector("#emptyWorkspace"),
  aboutPage: document.querySelector("#aboutPage"),
  adminPage: document.querySelector("#adminPage"),
  openCreateUserButton: document.querySelector("#openCreateUserButton"),
  workflowSelector: document.querySelector(".workflow-selector"),
  progressOverlay: document.querySelector("#progressOverlay"),
  progressTitle: document.querySelector("#progressTitle"),
  progressText: document.querySelector("#progressText"),
  progressBar: document.querySelector("#progressBar"),
  progressTimeBar: document.querySelector("#progressTimeBar"),
  progressTimeText: document.querySelector("#progressTimeText"),
  progressDetail: document.querySelector("#progressDetail"),
  loginOverlay: document.querySelector("#loginOverlay"),
  loginForm: document.querySelector("#loginForm"),
  loginIdentifier: document.querySelector("#loginIdentifier"),
  loginPassword: document.querySelector("#loginPassword"),
  loginPasswordToggle: document.querySelector("#loginPasswordToggle"),
  loginMessage: document.querySelector("#loginMessage"),
  passwordChangeOverlay: document.querySelector("#passwordChangeOverlay"),
  passwordChangeForm: document.querySelector("#passwordChangeForm"),
  newPassword: document.querySelector("#newPassword"),
  confirmNewPassword: document.querySelector("#confirmNewPassword"),
  passwordChangeMessage: document.querySelector("#passwordChangeMessage"),
  userDialogOverlay: document.querySelector("#userDialogOverlay"),
  userDialogTitle: document.querySelector("#userDialogTitle"),
  userDialogCloseButton: document.querySelector("#userDialogCloseButton"),
  adminCloseButton: document.querySelector("#adminCloseButton"),
  userForm: document.querySelector("#userForm"),
  userId: document.querySelector("#userId"),
  userName: document.querySelector("#userName"),
  userEmail: document.querySelector("#userEmail"),
  userRoleInputs: [...document.querySelectorAll("input[name='userRoles']")],
  userActive: document.querySelector("#userActive"),
  userPassword: document.querySelector("#userPassword"),
  saveUserButton: document.querySelector("#saveUserButton"),
  resetUserFormButton: document.querySelector("#resetUserFormButton"),
  userAdminMessage: document.querySelector("#userAdminMessage"),
  usersBody: document.querySelector("#usersBody"),
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
  [els.productApprovalImprovementAttachments, els.productApprovalImprovementAttachmentList],
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
  void changeLanguage(els.languageSelect.value);
});
els.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await loginWithEmail();
});
els.loginPasswordToggle.addEventListener("click", () => {
  state.loginPasswordVisible = !state.loginPasswordVisible;
  renderLoginPasswordVisibility();
});
els.passwordChangeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await changeOwnPassword();
});
els.logoutButton.addEventListener("click", async () => {
  closeAccountContextMenu();
  closeMenus();
  await logout();
});
els.accountState.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  openAccountContextMenu();
});
els.accountState.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;

  event.preventDefault();
  openAccountContextMenu();
});
els.openUserAdminButton.addEventListener("click", async () => {
  closeMenus();
  await openUserAdminPage();
});
els.adminCloseButton.addEventListener("click", closeUserAdminPage);
els.openCreateUserButton.addEventListener("click", openCreateUserDialog);
els.userDialogCloseButton.addEventListener("click", closeUserDialog);
els.userDialogOverlay.addEventListener("click", (event) => {
  if (event.target === els.userDialogOverlay) {
    closeUserDialog();
  }
});
els.userForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await saveUserFromForm();
});
els.resetUserFormButton.addEventListener("click", closeUserDialog);
els.usersBody.addEventListener("click", async (event) => {
  const menuButton = event.target.closest("[data-user-menu]");
  if (menuButton) {
    const menu = menuButton.closest(".user-actions")?.querySelector(".user-action-menu");
    const isOpening = menu?.hidden;
    closeUserActionMenus();
    if (menu && isOpening) {
      menu.hidden = false;
      menuButton.setAttribute("aria-expanded", "true");
      positionUserActionMenu(menuButton, menu);
    }
    return;
  }

  const actionButton = event.target.closest("[data-user-action]");
  if (!actionButton) return;

  closeUserActionMenus();
  const userId = actionButton.dataset.userId;
  if (actionButton.dataset.userAction === "edit") {
    editUser(userId);
    return;
  }

  if (actionButton.dataset.userAction === "delete") {
    await deleteUser(userId);
  }
});
els.newProjectButton.addEventListener("click", () => {
  closeMenus();
  if (!ensureMenuButtonAvailable(els.newProjectButton)) return;

  openProjectDialog();
});
els.openFileButton.addEventListener("click", () => {
  closeMenus();
  if (!ensureMenuButtonAvailable(els.openFileButton)) return;

  els.fileInput.click();
});
els.openWindchillButton.addEventListener("click", () => {
  closeMenus();
  alert(translateUiText("Die Windchill-Schnittstelle ist in diesem MVP noch nicht verbunden. Der Import wird simuliert. Bitte nutze für echte Daten den Dateiimport."));
});
els.openProjectButton.addEventListener("click", () => {
  closeMenus();
  if (!ensureMenuButtonAvailable(els.openProjectButton)) return;

  openProjectFile();
});
els.projectHistoryButton.addEventListener("click", async () => {
  closeMenus();
  if (!ensureMenuButtonAvailable(els.projectHistoryButton)) return;

  await openProjectHistoryDialog();
});
els.deleteProjectButton.addEventListener("click", async () => {
  closeMenus();
  await deleteProjectFromAdmin();
});
els.aboutButton.addEventListener("click", () => {
  closeMenus();
  openAboutPage();
});
els.openAiCostButton.addEventListener("click", () => {
  closeMenus();
  openOpenAiCostDialog();
});
els.openAiCostCloseButton.addEventListener("click", closeOpenAiCostDialog);
els.openAiCostOverlay.addEventListener("click", (event) => {
  if (event.target === els.openAiCostOverlay) {
    closeOpenAiCostDialog();
  }
});
els.closeAboutButton.addEventListener("click", closeAboutPage);
els.openSettingsButton.addEventListener("click", () => {
  closeMenus();
  if (!ensureMenuButtonAvailable(els.openSettingsButton)) return;

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
els.projectSelectionCloseButton.addEventListener("click", closeProjectSelectionDialog);
els.projectSelectionOverlay.addEventListener("click", (event) => {
  if (event.target === els.projectSelectionOverlay) {
    closeProjectSelectionDialog();
  }
});
els.projectSelectionBody.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-project-action]");
  if (!button) return;

  const projectId = button.dataset.projectId;
  if (!projectId) return;

  if (button.dataset.projectAction === "open") {
    await loadProjectFromServer(projectId);
    closeProjectSelectionDialog();
    return;
  }

  if (button.dataset.projectAction === "delete") {
    await deleteProjectById(projectId, button.dataset.projectName || "");
  }
});
els.projectHistoryCloseButton.addEventListener("click", closeProjectHistoryDialog);
els.projectHistoryOverlay.addEventListener("click", (event) => {
  if (event.target === els.projectHistoryOverlay) {
    closeProjectHistoryDialog();
  }
});
els.projectHistoryBody.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-revision-action]");
  if (!button) return;

  if (button.dataset.revisionAction === "restore") {
    await restoreProjectRevision(button.dataset.revisionId);
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
els.requirementType.addEventListener("change", () => {
  state.requirementType = els.requirementType.value;
  setProjectRevisionAction(`Requirement-Typ geaendert: ${state.requirementType}`);
  updateProjectActions();
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
els.analyzeButton.addEventListener("click", async () => {
  closeMenus();
  if (!ensureMenuButtonAvailable(els.analyzeButton)) return;

  await analyzeRequirements();
});
els.analyzeProductButton.addEventListener("click", analyzeRequirements);
els.generateSoftwareButton.addEventListener("click", generateSoftwareRequirements);
els.generateSoftwareMenuButton.addEventListener("click", async () => {
  closeMenus();
  if (!ensureMenuButtonAvailable(els.generateSoftwareMenuButton)) return;

  await generateSoftwareRequirements();
});
els.generateE2eButton.addEventListener("click", generateE2eTests);
els.generateE2eMenuButton.addEventListener("click", async () => {
  closeMenus();
  if (!ensureMenuButtonAvailable(els.generateE2eMenuButton)) return;

  await generateE2eTests();
});
els.exportButton.addEventListener("click", () => {
  closeMenus();
  if (!ensureMenuButtonAvailable(els.exportButton)) return;

  simulateActiveWindchillTransfer();
});
els.productEditButton.addEventListener("click", openProductEditDialog);
els.productTransferButton.addEventListener("click", simulateProductWindchillTransfer);
els.startProductApprovalButton.addEventListener("click", handleProductApprovalButtonClick);
els.productApprovalCloseButton.addEventListener("click", closeProductApprovalDialog);
els.productApprovalCancelButton.addEventListener("click", closeProductApprovalDialog);
els.productApprovalConfirmButton.addEventListener("click", startProductApprovalProcess);
els.productApprovalSelectedApprovers.addEventListener("click", handleSelectedProductApproverClick);
els.productApprovalApproverList.addEventListener("click", handleProductApproverListClick);
els.productApprovalApproverList.addEventListener("change", updateProductApprovalConfirmState);
els.productApprovalOverlay.addEventListener("click", (event) => {
  if (event.target === els.productApprovalOverlay) {
    closeProductApprovalDialog();
  }
});
els.changeRequestCloseButton.addEventListener("click", () => closeChangeRequestDialog(null));
els.changeRequestCancelButton.addEventListener("click", () => closeChangeRequestDialog(null));
els.changeRequestConfirmButton.addEventListener("click", confirmChangeRequestDialog);
els.changeRequestComment.addEventListener("input", updateChangeRequestDialogState);
els.changeRequestOverlay.addEventListener("click", (event) => {
  if (event.target === els.changeRequestOverlay) {
    closeChangeRequestDialog(null);
  }
});
els.softwareTransferButton.addEventListener("click", simulateSoftwareWindchillTransfer);
els.criticalIssuesButton.addEventListener("click", activateScoreFilter);
els.clearScoreFilterButton.addEventListener("click", clearScoreFilter);
els.criticalSoftwareIssuesButton.addEventListener("click", activateSoftwareScoreFilter);
els.clearSoftwareScoreFilterButton.addEventListener("click", clearSoftwareScoreFilter);
els.criticalE2eIssuesButton.addEventListener("click", activateE2eScoreFilter);
els.clearE2eScoreFilterButton.addEventListener("click", clearE2eScoreFilter);
els.resultsBody.addEventListener("click", handleResultRowClick);
els.productApprovalSearch.addEventListener("input", handleProductApprovalSearch);
els.productApprovalStatusFilter.addEventListener("change", handleProductApprovalStatusFilter);
els.productReviewTabs.addEventListener("click", handleProductReviewTabClick);
els.productReviewSaveFinalTextButton.addEventListener("click", saveProductReviewFinalText);
els.productReviewRecalculateScoreButton.addEventListener("click", recalculateProductReviewFinalScore);
els.productReviewFinalText.addEventListener("input", markProductReviewFinalTextStale);
els.productReviewFinalChoiceHost.addEventListener("click", handleProductReviewFinalTabClick);
els.productReviewTechTypeSearch.addEventListener("input", handleProductReviewTechTypeFilterChange);
els.productReviewTechTypeFilter.addEventListener("change", handleProductReviewTechTypeFilterChange);
els.productReviewSelectAllTechTypesButton.addEventListener("click", selectAllTechTypesForActiveRequirement);
els.productReviewClearTechTypesButton.addEventListener("click", clearTechTypesForActiveRequirement);
els.productReviewResetTechTypesButton.addEventListener("click", resetTechTypesForActiveRequirement);
els.productApprovalSaveTextButton.addEventListener("click", saveProductApprovalText);
els.productApprovalSubmitButton.addEventListener("click", submitProductRequirementForApproval);
els.productApprovalImproveButton.addEventListener("click", improveProductApprovalRequirementWithAi);
els.productApprovalApproveButton.addEventListener("click", async () => {
  const pendingSave = await savePendingProductApprovalTextChange();
  if (!pendingSave.ok) return;
  if (pendingSave.changed) {
    alert(translateUiText("Die Änderung wurde gespeichert. Bitte prüfe den neu berechneten Score und gib das Requirement anschließend erneut frei."));
    return;
  }
  if (approveProductRequirement(state.activeSelectionRow)) {
    closeProductRequirementDetailDialog();
  }
});
els.productApprovalShowDisapproveButton.addEventListener("click", showProductDisapprovalForm);
els.productApprovalDisapproveComment.addEventListener("input", updateProductDisapprovalSubmitState);
els.productApprovalDisapproveButton.addEventListener("click", disapproveProductRequirement);
els.productApprovalTabs.addEventListener("click", handleProductApprovalTabClick);
els.productApprovalTabContent.addEventListener("click", handleProductApprovalCommentClick);
els.productApprovalDetailCloseButton.addEventListener("click", closeProductRequirementDetailDialog);
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
  selectProductRequirement(Number(row.dataset.rowNumber));
});
els.selectionCloseButton.addEventListener("click", closeSelectionDialog);
els.selectionDeferButton.addEventListener("click", closeActiveProductEditDialog);
els.excludeRequirementButton.addEventListener("click", excludeRequirement);
els.approveRequirementButton.addEventListener("click", handleProductReviewPrimaryAction);
els.selectOriginalButton.addEventListener("click", () => selectFinalText("original"));
els.selectAiButton.addEventListener("click", () => selectFinalText("ai"));
els.prImproveButton.addEventListener("click", improveProductRequirementWithAi);
els.selectAllTechTypesButton.addEventListener("click", selectAllTechTypesForActiveRequirement);
els.techTypeSelectionList.addEventListener("click", handleTechTypeSelectionClick);
els.techTypeSelectionList.addEventListener("change", handleTechTypeSelectionChange);
els.softwareSelectionCloseButton.addEventListener("click", closeSoftwareSelectionDialog);
els.softwareSelectionDeferButton.addEventListener("click", deferSoftwareRequirementSelection);
els.softwareSelectionExcludeButton.addEventListener("click", excludeSoftwareRequirement);
els.softwareSelectionRegenerateButton.addEventListener("click", regenerateSoftwareRequirementFromDialog);
els.softwareSelectionAcceptButton.addEventListener("click", acceptSoftwareRequirement);
els.softwareSelectionApproveButton.addEventListener("click", approveSoftwareRequirement);
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
els.e2eSelectionApproveButton.addEventListener("click", approveE2eTest);
els.e2eImproveButton.addEventListener("click", improveE2eTestWithAi);
els.e2eSelectionOverlay.addEventListener("click", (event) => {
  if (event.target === els.e2eSelectionOverlay) {
    closeE2eSelectionDialog();
  }
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenus();
    closeAccountContextMenu();
    closeUserActionMenus();
  }

  if (event.key === "Escape" && !els.settingsOverlay.hidden) {
    closeSettingsDialog();
  }

  if (event.key === "Escape" && !els.projectOverlay.hidden) {
    closeProjectDialog();
  }

  if (event.key === "Escape" && !els.projectSelectionOverlay.hidden) {
    closeProjectSelectionDialog();
  }

  if (event.key === "Escape" && !els.projectHistoryOverlay.hidden) {
    closeProjectHistoryDialog();
  }

  if (event.key === "Escape" && !els.openAiCostOverlay.hidden) {
    closeOpenAiCostDialog();
  }

  if (event.key === "Escape" && !els.userDialogOverlay.hidden) {
    closeUserDialog();
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

  if (!event.target.closest("#accountState")) {
    closeAccountContextMenu();
  }

  if (!event.target.closest(".user-actions")) {
    closeUserActionMenus();
  }
});

function closeMenus() {
  els.menuDropdowns.forEach((menu) => {
    menu.open = false;
  });
  normalizeMenuButtonStates();
}

function openAccountContextMenu() {
  if (!state.currentUser) return;

  els.accountContextMenu.hidden = false;
}

function closeAccountContextMenu() {
  els.accountContextMenu.hidden = true;
}

function closeUserActionMenus() {
  els.usersBody.querySelectorAll(".user-action-menu").forEach((menu) => {
    menu.hidden = true;
    menu.classList.remove("is-above");
  });
  els.usersBody.querySelectorAll("[data-user-menu]").forEach((button) => {
    button.setAttribute("aria-expanded", "false");
  });
}

function positionUserActionMenu(button, menu) {
  menu.classList.remove("is-above");

  const tableWrap = button.closest(".user-table-wrap");
  if (!tableWrap) return;

  const menuRect = menu.getBoundingClientRect();
  const tableRect = tableWrap.getBoundingClientRect();
  const buttonRect = button.getBoundingClientRect();
  const wouldClipBottom = menuRect.bottom > tableRect.bottom;
  const hasSpaceAbove = buttonRect.top - tableRect.top > menuRect.height + 8;

  if (wouldClipBottom && hasSpaceAbove) {
    menu.classList.add("is-above");
  }
}

async function loadSession() {
  try {
    const response = await fetch(getSessionEndpoint());
    if (!response.ok) {
      state.currentUser = null;
      renderAuthState();
      return;
    }

    const data = await response.json();
    state.currentUser = data.user || null;
    renderAuthState();
  } catch {
    state.currentUser = null;
    renderAuthState();
  }
}

function renderLoginPasswordVisibility() {
  els.loginPassword.type = state.loginPasswordVisible ? "text" : "password";
  els.loginPasswordToggle.setAttribute(
    "aria-label",
    translateUiText(state.loginPasswordVisible ? "Passwort verbergen" : "Passwort anzeigen"),
  );
  els.loginPasswordToggle.classList.toggle("is-visible", state.loginPasswordVisible);
}

async function loginWithEmail() {
  const identifier = els.loginIdentifier.value.trim();
  const password = els.loginPassword.value;
  els.loginMessage.textContent = "";

  try {
    const response = await fetch(getLoginEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      els.loginMessage.textContent = data.error || translateUiText("Anmeldung fehlgeschlagen");
      return;
    }

    state.currentUser = data.user || null;
    resetProductApproverCache();
    els.loginIdentifier.value = "";
    els.loginPassword.value = "";
    renderAuthState();
    void ensureProductApproversLoaded();
  } catch {
    els.loginMessage.textContent = translateUiText("Server nicht erreichbar");
  }
}

function resetProductApproverCache() {
  state.productApprovers = [];
  state.productApproversLoading = false;
  state.productApproversLoaded = false;
  state.productApproversError = "";
}

async function changeOwnPassword() {
  const password = els.newPassword.value;
  const confirmPassword = els.confirmNewPassword.value;
  els.passwordChangeMessage.textContent = "";

  if (password !== confirmPassword) {
    els.passwordChangeMessage.textContent = translateUiText("Die Passwörter stimmen nicht überein.");
    return;
  }

  try {
    const response = await fetch(getChangePasswordEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, confirmPassword }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      els.passwordChangeMessage.textContent = data.error || translateUiText("Passwort konnte nicht geändert werden");
      return;
    }

    state.currentUser = data.user || { ...state.currentUser, mustChangePassword: false };
    els.newPassword.value = "";
    els.confirmNewPassword.value = "";
    renderAuthState();
  } catch {
    els.passwordChangeMessage.textContent = translateUiText("Server nicht erreichbar");
  }
}

async function logout() {
  try {
    await fetch(getLogoutEndpoint(), { method: "POST" });
  } catch {
    // Local session state is cleared even if the server is unavailable.
  }

  state.currentUser = null;
  state.adminUsers = [];
  resetProductApproverCache();
  closeUserAdminPage();
  renderAuthState();
}

function renderAuthState() {
  const isSignedIn = Boolean(state.currentUser);
  const isAdmin = currentUserHasRole("admin");
  const mustChangePassword = state.currentUser?.mustChangePassword === true;
  els.loginOverlay.hidden = isSignedIn;
  if (!isSignedIn) {
    state.loginPasswordVisible = false;
    renderLoginPasswordVisibility();
  }
  els.passwordChangeOverlay.hidden = !mustChangePassword;
  els.adminMenu.hidden = !isAdmin;
  if (!isAdmin) {
    state.adminOpen = false;
  }
  els.accountState.hidden = !isSignedIn;
  els.accountUserName.textContent = state.currentUser?.name || state.currentUser?.email || "-";
  els.logoutButton.disabled = !isSignedIn;
  closeAccountContextMenu();
  updateProjectActions();
  void ensureProductApproversLoaded();
  if (mustChangePassword) {
    els.newPassword.focus();
    return;
  }

  if (!isSignedIn) {
    els.loginIdentifier.focus();
  }
}

async function openUserAdminPage() {
  if (!currentUserHasRole("admin")) return;

  state.aboutOpen = false;
  state.adminOpen = true;
  renderWorkspaceState();
  renderProcessPages();
  closeUserDialog();
  await loadAdminUsers();
}

function closeUserAdminPage() {
  state.adminOpen = false;
  els.userAdminMessage.textContent = "";
  renderWorkspaceState();
  renderProcessPages();
}

async function loadAdminUsers() {
  els.userAdminMessage.textContent = translateUiText("Benutzer werden geladen...");
  try {
    const response = await fetch(getAdminUsersEndpoint());
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      els.userAdminMessage.textContent = data.error || translateUiText("Benutzer konnten nicht geladen werden");
      return;
    }

    state.adminUsers = Array.isArray(data.users) ? data.users : [];
    renderUserTable();
    els.userAdminMessage.textContent = "";
  } catch {
    els.userAdminMessage.textContent = translateUiText("Server nicht erreichbar");
  }
}

function openCreateUserDialog() {
  resetUserForm();
  els.userDialogTitle.textContent = translateUiText("Benutzer anlegen");
  els.saveUserButton.textContent = translateUiText("Benutzer speichern");
  els.userPassword.required = true;
  els.userPassword.placeholder = "Mindestens 8 Zeichen";
  els.userDialogOverlay.hidden = false;
  els.userName.focus();
}

function closeUserDialog() {
  els.userDialogOverlay.hidden = true;
}

async function saveUserFromForm() {
  const userId = els.userId.value;
  const payload = {
    name: els.userName.value.trim(),
    email: els.userEmail.value.trim(),
    roles: selectedUserRoles(),
    active: els.userActive.checked,
  };
  if (els.userPassword.value) {
    payload.password = els.userPassword.value;
  }
  const endpoint = userId ? getAdminUserEndpoint(userId) : getAdminUsersEndpoint();

  els.userAdminMessage.textContent = translateUiText("Benutzer wird gespeichert...");
  try {
    const response = await fetch(endpoint, {
      method: userId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      els.userAdminMessage.textContent = data.error || translateUiText("Benutzer konnte nicht gespeichert werden");
      return;
    }

    resetUserForm();
    closeUserDialog();
    await loadAdminUsers();
    els.userAdminMessage.textContent = translateUiText(userId ? "Benutzer gespeichert" : "Benutzer angelegt");
  } catch {
    els.userAdminMessage.textContent = translateUiText("Server nicht erreichbar");
  }
}

function resetUserForm() {
  els.userId.value = "";
  els.userName.value = "";
  els.userEmail.value = "";
  setSelectedUserRoles([]);
  els.userActive.checked = true;
  els.userPassword.value = "";
  els.userPassword.required = true;
  els.userPassword.placeholder = "Mindestens 8 Zeichen";
  els.saveUserButton.textContent = translateUiText("Benutzer speichern");
}

function selectedUserRoles() {
  return els.userRoleInputs.filter((input) => input.checked).map((input) => input.value);
}

function setSelectedUserRoles(roles) {
  const selectedRoles = new Set(normalizeClientRoles(roles));
  els.userRoleInputs.forEach((input) => {
    input.checked = selectedRoles.has(input.value);
  });
}

function normalizeClientRoles(value) {
  const roles = Array.isArray(value) ? value : String(value || "").split(",");
  return [...new Set(roles.map((role) => String(role || "").trim()).filter((role) => USER_ROLE_LABELS[role]))];
}

function formatRoleList(value) {
  const roles = normalizeClientRoles(value);
  if (!roles.length) return "Keine Rolle";
  if (roles.includes("admin")) return "Admin";
  return roles.map((role) => USER_ROLE_LABELS[role]).join(", ");
}

function currentUserHasRole(role) {
  const roles = normalizeClientRoles(state.currentUser?.roles ?? state.currentUser?.role);
  return roles.includes("admin") || roles.includes(role);
}

function currentUserHasExplicitRole(role) {
  const roles = normalizeClientRoles(state.currentUser?.roles ?? state.currentUser?.role);
  return roles.includes(role);
}

function currentUserHasAnyRole(roles) {
  return roles.some((role) => currentUserHasRole(role));
}

function canCreateProject() {
  return currentUserHasAnyRole(["admin", "productRequirementOwner", "softwareRequirementOwner", "e2eTestOwner"]);
}

function canLoadProject() {
  return currentUserHasAnyRole([
    "admin",
    "productRequirementOwner",
    "softwareRequirementOwner",
    "e2eTestOwner",
    "productRequirementApprover",
    "softwareRequirementApprover",
    "e2eTestApprover",
  ]);
}

function canSaveProject() {
  return canLoadProject();
}

function canEditProductRequirements() {
  return currentUserHasRole("productRequirementOwner");
}

function canModifyProductRequirements() {
  return canEditProductRequirements() && !isProductApprovalLocked();
}

function isProductApprovalLocked() {
  return isProductApprovalStarted() && !isProductQualityReady() && !hasChangedProductRequirements();
}

function productApprovalLockedMessage() {
  return isProductApprovalLocked()
    ? "Product Requirements sind während des laufenden Approval-Prozesses gesperrt."
    : "Nur Product Requirement Owner oder Admins können Product Requirements bearbeiten.";
}

function canEditSoftwareRequirements() {
  return currentUserHasRole("softwareRequirementOwner");
}

function canEditE2eTests() {
  return currentUserHasRole("e2eTestOwner");
}

function canApproveProductRequirements() {
  return currentUserHasRole("productRequirementApprover");
}

function canApproveSoftwareRequirements() {
  return currentUserHasRole("softwareRequirementApprover");
}

function canApproveE2eTests() {
  return currentUserHasRole("e2eTestApprover");
}

function currentApprovalUserName() {
  return state.currentUser?.name || state.currentUser?.email || "Unbekannter Benutzer";
}

function normalizeApproverIds(ids) {
  return [...new Set((Array.isArray(ids) ? ids : [...ids || []]).map((id) => String(id || "").trim()).filter(Boolean))];
}

async function ensureProductApproversLoaded(options = {}) {
  if (options.force) {
    state.productApproversLoaded = false;
    state.productApproversError = "";
  }
  if (!state.currentUser || state.productApproversLoaded || state.productApproversLoading || !canCreateProject()) return;

  const endpoint = getApproversEndpoint("productRequirementApprover");
  if (!endpoint) return;

  state.productApproversLoading = true;
  state.productApproversError = "";
  renderProductApprovalState();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const cacheSeparator = endpoint.includes("?") ? "&" : "?";
    const response = await fetch(`${endpoint}${cacheSeparator}_=${Date.now()}`, {
      cache: "no-store",
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      state.productApproversError = data.error || "PR Approver konnten nicht geladen werden";
      return;
    }

    state.productApprovers = Array.isArray(data.users) ? data.users : [];
  } catch (error) {
    state.productApproversError =
      error?.name === "AbortError" ? "PR Approver konnten nicht geladen werden" : "Server nicht erreichbar";
  } finally {
    clearTimeout(timeoutId);
    state.productApproversLoading = false;
    state.productApproversLoaded = true;
    renderProductApprovalDialog();
    renderProductApprovalState();
    renderMetrics();
  }
}

function editUser(userId) {
  const user = state.adminUsers.find((item) => item.id === userId);
  if (!user) return;

  els.userDialogTitle.textContent = translateUiText("Benutzer bearbeiten");
  els.userId.value = user.id;
  els.userName.value = user.name || "";
  els.userEmail.value = user.email;
  setSelectedUserRoles(normalizeClientRoles(user.roles ?? user.role));
  els.userActive.checked = user.active !== false;
  els.userPassword.value = "";
  els.userPassword.required = false;
  els.userPassword.placeholder = "Leer lassen, um Passwort beizubehalten";
  els.saveUserButton.textContent = translateUiText("Änderungen speichern");
  els.userDialogOverlay.hidden = false;
  els.userName.focus();
}

async function deleteUser(userId) {
  const user = state.adminUsers.find((item) => item.id === userId);
  if (!user) return;
  if (!window.confirm(`Benutzer ${user.email} löschen?`)) return;

  els.userAdminMessage.textContent = translateUiText("Benutzer wird gelöscht...");
  try {
    const response = await fetch(getAdminUserEndpoint(userId), { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      els.userAdminMessage.textContent = data.error || translateUiText("Benutzer konnte nicht gelöscht werden");
      return;
    }

    resetUserForm();
    await loadAdminUsers();
    els.userAdminMessage.textContent = translateUiText("Benutzer gelöscht");
  } catch {
    els.userAdminMessage.textContent = translateUiText("Server nicht erreichbar");
  }
}

function renderUserTable() {
  if (!state.adminUsers.length) {
    els.usersBody.innerHTML = `<tr><td colspan="5">${escapeHtml(translateUiText("Keine Benutzer vorhanden."))}</td></tr>`;
    return;
  }

  els.usersBody.innerHTML = state.adminUsers
    .map((user) => {
      const statusText = user.active === false ? "Inaktiv" : user.mustChangePassword ? "Passwortwechsel offen" : "Aktiv";
      const statusClass = user.active === false ? "status-inactive" : user.mustChangePassword ? "status-pending" : "status-active";
      const roleText = formatRoleList(user.roles ?? user.role);
      const isCurrentUser = user.id === state.currentUser?.id;
      return `
        <tr>
          <td>${escapeHtml(user.name || "-")}${isCurrentUser ? ` <span class="muted-cell">(${escapeHtml(translateUiText("du"))})</span>` : ""}</td>
          <td>${escapeHtml(user.email)}</td>
          <td><span class="role-pill">${escapeHtml(roleText)}</span></td>
          <td><span class="${statusClass}">${escapeHtml(translateUiText(statusText))}</span></td>
          <td>
            <div class="user-actions">
              <button class="user-action-trigger" type="button" data-user-menu data-user-id="${escapeHtml(user.id)}" aria-expanded="false" aria-label="${escapeHtml(translateUiText("Aktionen für"))} ${escapeHtml(user.name || user.email)}">•••</button>
              <div class="user-action-menu" hidden>
                <button type="button" data-user-action="edit" data-user-id="${escapeHtml(user.id)}">${escapeHtml(translateUiText("Bearbeiten"))}</button>
                <button type="button" data-user-action="delete" data-user-id="${escapeHtml(user.id)}" ${isCurrentUser ? "disabled" : ""}>${escapeHtml(translateUiText("Löschen"))}</button>
              </div>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

function openAboutPage() {
  state.aboutOpen = true;
  state.adminOpen = false;
  renderAboutPage();
  renderWorkspaceState();
  renderProcessPages();
}

function closeAboutPage() {
  state.aboutOpen = false;
  renderWorkspaceState();
  renderProcessPages();
}

function renderAboutPage() {
  const gitInfo = state.runtimeInfo?.git || {};
  const version = gitInfo.version || "Git-Version nicht verfügbar";
  const commit = gitInfo.commit || "Nicht verfügbar";
  const branch = gitInfo.branch || "Nicht verfügbar";
  const tag = gitInfo.tag || "Nicht verfügbar";
  const dirtyMarker = gitInfo.dirty ? " (lokale Änderungen)" : "";

  els.aboutVersion.textContent = `App ${version}${dirtyMarker}`;
  els.aboutBuild.textContent = `${branch} / ${commit}`;
  els.aboutTag.textContent = tag;
  els.aboutBuildDate.textContent = formatGitDate(gitInfo.date) || document.lastModified || "Nicht verfügbar";
  els.aboutRuntimePath.textContent = window.location.pathname || "/";
}

function setActiveProcessStep(processStep) {
  if (!hasProject()) return;
  if (!processStep) return;
  if (!isProcessStepAvailable(processStep)) {
    updateWorkflowState();
    return;
  }

  const wasAboutOpen = state.aboutOpen;
  state.aboutOpen = false;
  state.adminOpen = false;
  if (processStep === state.activeProcessStep && !wasAboutOpen) return;

  state.activeProcessStep = processStep;
  updateWorkflowState();
  renderProcessPages();
  updateExportAvailability();
  setProjectRevisionAction(`Prozessschritt geoeffnet: ${PROCESS_STEP_LABELS[processStep] || processStep}`);
  updateProjectActions();
}

function updateWorkflowState() {
  renderWorkspaceState();
  if (!hasProject()) return;

  if (!isProcessStepAvailable(state.activeProcessStep)) {
    state.activeProcessStep = firstAvailableProcessStep();
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
      status.textContent = translateUiText("Abgeschlossen");
    } else if (isActive) {
      status.textContent = translateUiText("Aktueller Schritt");
    } else if (isLocked) {
      status.textContent = translateUiText(getLockedStepShortText(processStep));
    } else {
      status.textContent = translateUiText("Verfügbar");
    }
  });
  renderWorkflowTranslations();
}

function renderProcessPages() {
  els.processPages.forEach((page) => {
    const isActive = !state.aboutOpen && !state.adminOpen && hasProject() && page.dataset.processPage === state.activeProcessStep;
    page.hidden = !isActive;
    page.classList.toggle("is-active", isActive);
  });
  renderSoftwarePage();
  renderE2ePage();
}

function hasProject() {
  return Boolean(projectDisplayName() || state.projectDescription || state.requirements.length);
}

function renderWorkspaceState() {
  const projectOpen = hasProject();
  renderProjectHeader();
  renderOpenAiCostSummary();
  renderMenuAvailability();
  els.aboutPage.hidden = !state.aboutOpen;
  els.adminPage.hidden = !state.adminOpen;
  els.emptyWorkspace.hidden = state.aboutOpen || state.adminOpen || projectOpen;
  els.workflowSelector.hidden = !projectOpen || state.adminOpen;
  els.processPages.forEach((page) => {
    if (state.aboutOpen || state.adminOpen || !projectOpen) {
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
  updateProjectDirtyState();
  const dirtyMarker = state.projectDirty ? " *" : "";
  const displayName = projectDisplayName();
  els.projectHeaderName.textContent = displayName ? `${displayName}${dirtyMarker}` : translateUiText("Kein Projekt geöffnet");
  els.projectHeaderName.title = state.projectDirty ? translateUiText("Ungespeicherte Änderungen") : "";
  els.projectHeaderDescription.textContent = state.projectDescription || "";
  els.projectHeaderDescription.hidden = !state.projectDescription;
  renderProjectStatusLine();
}

function projectStatusText(name = projectDisplayName()) {
  const displayName = String(name || "").trim();
  return displayName ? `${displayName} (${translateUiText("Projekt")})` : translateUiText("Kein Projekt geöffnet");
}

function renderProjectStatusLine() {
  if (!els.fileState) return;
  if (!hasProject()) {
    els.fileState.textContent = translateUiText("Kein Projekt geöffnet");
    return;
  }

  const currentText = String(els.fileState.textContent || "");
  if (state.sourceFileName && currentText === state.sourceFileName) return;
  els.fileState.textContent = projectStatusText();
}

function updateProjectDirtyState() {
  if (!hasProject()) {
    state.projectDirty = false;
    return;
  }

  state.projectDirty = !state.projectSavedSnapshot || currentProjectSnapshot() !== state.projectSavedSnapshot;
}

function markProjectSaved() {
  state.projectSavedSnapshot = currentProjectSnapshot();
  state.projectDirty = false;
  renderProjectHeader();
}

function currentProjectSnapshot() {
  const payload = createProjectPayload();
  delete payload.savedAt;
  return JSON.stringify(payload);
}

function renderOpenAiCostSummary() {
  const summary = normalizedOpenAiCostSummary();
  const cost = Number(summary.totalCostUsd) || 0;
  const totalTokens = Number(summary.totalTokens) || 0;
  const isEstimated = summary.estimated !== false;
  const isConfigured = summary.pricingConfigured === true;
  const tokenLabel = currentLanguage() === "en" ? "tokens" : "Tokens";
  const estimatedLabel = currentLanguage() === "en" ? " estimated" : " geschätzt";
  const unconfiguredLabel = currentLanguage() === "en" ? " (prices not configured)" : " (Preise nicht konfiguriert)";

  els.openAiCostTotal.textContent = isConfigured || cost > 0 ? formatUsd(cost) : "$0.0000";
  els.openAiCostDetail.textContent = `${formatInteger(totalTokens)} ${tokenLabel}${isEstimated ? estimatedLabel : ""}${isConfigured ? "" : unconfiguredLabel}`;
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
  if (!canAccessProcessStep(processStep)) return false;

  const previousStep = PROCESS_STEP_DEPENDENCIES[processStep];
  return !previousStep || isProcessStepComplete(previousStep);
}

function firstAvailableProcessStep() {
  return Object.keys(PROCESS_STEP_DEPENDENCIES).find((processStep) => isProcessStepAvailable(processStep)) || "";
}

function canAccessProcessStep(processStep) {
  if (currentUserHasRole("admin")) return true;
  if (processStep === "product") return canEditProductRequirements() || canApproveProductRequirements();
  if (processStep === "software") return canEditSoftwareRequirements() || canApproveSoftwareRequirements();
  if (processStep === "e2e") return canEditE2eTests() || canApproveE2eTests();
  return false;
}

function isProcessStepComplete(processStep) {
  if (processStep === "product") return isProductStepComplete();
  if (processStep === "software") return isSoftwareStepComplete();
  if (processStep === "e2e") return isE2eQualityReady();
  return false;
}

function getLockedStepMessage(processStep) {
  if (!canAccessProcessStep(processStep)) {
    return "Keine Berechtigung für diesen Prozessbereich";
  }

  const previousStep = PROCESS_STEP_DEPENDENCIES[processStep];
  if (!previousStep) return "";

  if (previousStep === "product") {
    if (isProductApprovalPending()) {
      return isProductApprovalStarted()
        ? "Product Requirements zuerst freigeben"
        : "PR-Approval-Prozess zuerst starten";
    }

    if (isProductReadyForTransferSimulation() && !state.productWindchillTransferComplete) {
      return "PR-Transfer-Simulation zuerst starten";
    }

    return `Product Requirement erst vollständig zuordnen und Quality Gate mit Score > ${PRODUCT_STEP_MIN_SCORE} bestehen`;
  }

  if (previousStep === "software" && isSoftwareApprovalPending()) {
    return "Software Requirements zuerst freigeben";
  }

  if (previousStep === "software" && isSoftwareQualityReady() && !state.softwareWindchillTransferComplete) {
    return "SR-Transfer-Simulation zuerst starten";
  }

  return `${PROCESS_STEP_LABELS[previousStep]} muss zuerst abgeschlossen werden`;
}

function getLockedStepShortText(processStep) {
  if (!canAccessProcessStep(processStep)) {
    return "Keine Berechtigung";
  }

  const previousStep = PROCESS_STEP_DEPENDENCIES[processStep];
  if (!previousStep) return "";

  if (previousStep === "product") {
    if (isProductApprovalPending()) {
      return isProductApprovalStarted() ? "Freigabe erforderlich" : "Approval starten";
    }

    if (isProductReadyForTransferSimulation() && !state.productWindchillTransferComplete) {
      return "Transfer-Simulation erforderlich";
    }

    return `Score > ${PRODUCT_STEP_MIN_SCORE} erforderlich`;
  }

  if (previousStep === "software" && isSoftwareApprovalPending()) {
    return "Freigabe erforderlich";
  }

  if (previousStep === "software" && isSoftwareQualityReady() && !state.softwareWindchillTransferComplete) {
    return "Transfer-Simulation erforderlich";
  }

  return `${PROCESS_STEP_LABELS[previousStep]} abschließen`;
}

function isProductStepComplete() {
  return isProductReadyForTransferSimulation() && state.productWindchillTransferComplete;
}

function isProductQualityReady() {
  return isProductReadyForApproval() && hasApprovedFinalProductSelections();
}

function isProductReadyForTransferSimulation() {
  return isProductReadyForApproval();
}

function isProductReadyForApproval() {
  const progress = getProductStepProgress();
  const qualityGate = getProductQualityGate();
  return (
    progress.allAssigned &&
    progress.includedCount > 0 &&
    qualityGate.status === "PASSED" &&
    !hasPendingFinalProductAssessments() &&
    state.finalScoreUpdates.size === 0
  );
}

function getProductQualityGate(requirements = state.requirements) {
  const resultByRow = new Map(state.results.map((result) => [Number(result.rowNumber), result]));
  const totalRequirements = requirements.length;
  let excludedRequirements = 0;
  let finalizedRequirements = 0;
  let readyRequirements = 0;
  let missingScoreRequirements = 0;
  let staleScoreRequirements = 0;
  let failedScoreRequirements = 0;
  let missingTechTypeRequirements = 0;

  requirements.forEach((requirement) => {
    const rowNumber = Number(requirement.rowNumber);
    const result = resultByRow.get(rowNumber);
    const selection = state.finalSelections.get(rowNumber);
    if (selection?.choice === "excluded") {
      excludedRequirements += 1;
      return;
    }

    const scoreStatus = productFinalScoreStatus(result, selection, state.finalScoreUpdates.has(rowNumber));
    const techTypes = selectedTechTypesForRequirement(requirement, selection);
    if (!selection?.text) {
      missingScoreRequirements += 1;
      return;
    }
    finalizedRequirements += 1;

    if (scoreStatus === "CALCULATING" || scoreStatus === "STALE") {
      staleScoreRequirements += 1;
      return;
    }

    if (scoreStatus === "MISSING") {
      missingScoreRequirements += 1;
      return;
    }

    if (scoreStatus === "FAILED") {
      failedScoreRequirements += 1;
      return;
    }

    if (!techTypes.length) {
      missingTechTypeRequirements += 1;
      return;
    }

    readyRequirements += 1;
  });

  const includedRequirements = totalRequirements - excludedRequirements;
  const status =
    !state.analysisComplete || totalRequirements === 0 || missingScoreRequirements > 0 || staleScoreRequirements > 0
      ? "NOT_CHECKED"
      : failedScoreRequirements > 0 || missingTechTypeRequirements > 0 || readyRequirements < includedRequirements
        ? "BLOCKED"
        : "PASSED";

  return {
    status,
    totalRequirements,
    excludedRequirements,
    finalizedRequirements,
    readyRequirements,
    passedRequirements: readyRequirements,
    blockedRequirements: failedScoreRequirements + missingTechTypeRequirements,
    missingScoreRequirements,
    staleScoreRequirements,
    failedScoreRequirements,
    missingTechTypeRequirements,
  };
}

function productQualityGateScore(requirement, resultByRow = new Map(state.results.map((result) => [Number(result.rowNumber), result]))) {
  const rowNumber = Number(requirement?.rowNumber);
  const result = resultByRow.get(rowNumber);
  const selection = state.finalSelections.get(rowNumber);
  if (!result || !selection || selection.needsFinalAssessment) return null;

  const score = Number(displayProductScore(result, selection, {
    usePreviousScore: state.finalScoreUpdates.has(rowNumber),
  }));
  return Number.isFinite(score) ? score : null;
}

function isProductQualityGateBlockingScore(score) {
  return Number.isFinite(Number(score)) && Number(score) < PRODUCT_STEP_MIN_SCORE;
}

function isProductApprovalPending() {
  return isProductReadyForApproval() && !hasApprovedFinalProductSelections();
}

function hasApprovedFinalProductSelections() {
  if (hasChangedProductRequirements()) return false;

  return state.requirements.length > 0 && state.requirements.every((requirement) => {
    const selection = state.finalSelections.get(Number(requirement.rowNumber));
    return isProductSelectionApproved(selection);
  });
}

function hasChangedProductRequirements() {
  return state.changedProductRequirementRows.size > 0;
}

function isProductApprovalStarted() {
  return getRequiredProductApproverIds().length > 0;
}

function getRequiredProductApproverIds() {
  return normalizeApproverIds(state.productApprovalApproverIds);
}

function currentProductApproverSlotId() {
  const currentUserId = String(state.currentUser?.id || "");
  const requiredApproverIds = getRequiredProductApproverIds();
  if (currentUserId && requiredApproverIds.includes(currentUserId)) return currentUserId;
  return "";
}

function productApprovalRecords(selection) {
  return Array.isArray(selection?.approvals) ? selection.approvals : [];
}

function productApprovalComments(selection) {
  if (!selection) return [];
  if (!Array.isArray(selection.comments)) selection.comments = [];
  return selection.comments;
}

function productApprovalVersions(selection) {
  if (!selection) return [];
  if (!Array.isArray(selection.versions)) selection.versions = [];
  return selection.versions;
}

function countOpenDisapprovalComments(selection) {
  return productApprovalComments(selection).filter((comment) => comment.type === "disapproval" && comment.resolved !== true).length;
}

function hasProductApprovalFrom(selection, approverId) {
  return productApprovalRecords(selection).some((approval) =>
    String(approval.userId || "") === String(approverId || "") && approval.approvedAt,
  );
}

function countProductApprovals(selection) {
  const requiredApproverIds = getRequiredProductApproverIds();
  const approvedApproverIds = new Set(
    productApprovalRecords(selection)
      .filter((approval) => approval.approvedAt)
      .map((approval) => String(approval.userId || ""))
      .filter((approverId) => requiredApproverIds.includes(approverId)),
  );
  return approvedApproverIds.size;
}

function latestProductSelectionChangeTime(selection) {
  return productApprovalVersions(selection).reduce((latest, version) => {
    const timestamp = Date.parse(version?.changedAt || "");
    return Number.isFinite(timestamp) ? Math.max(latest, timestamp) : latest;
  }, 0);
}

function productSelectionApprovalTime(selection) {
  const timestamps = productApprovalRecords(selection)
    .map((approval) => Date.parse(approval?.approvedAt || ""))
    .filter(Number.isFinite);
  const finalApprovedAt = Date.parse(selection?.approvedAt || "");
  if (Number.isFinite(finalApprovedAt)) timestamps.push(finalApprovedAt);
  return timestamps.length ? Math.min(...timestamps) : 0;
}

function reconcileProductChangeStateFromHistory() {
  if (!isProductApprovalStarted() && !state.productWindchillTransferComplete) return;

  const transferTime = Date.parse(state.productWindchillTransferredAt || "");
  state.finalSelections.forEach((selection, rowNumber) => {
    if (!selection || selection.choice === "excluded") return;

    const changedAt = latestProductSelectionChangeTime(selection);
    if (!changedAt) return;

    const approvalTime = productSelectionApprovalTime(selection);
    const changedAfterApproval = isProductApprovalStarted() && approvalTime > 0 && changedAt > approvalTime;
    const changedAfterTransfer = Number.isFinite(transferTime) && changedAt > transferTime;
    if (!changedAfterApproval && !changedAfterTransfer) return;

    clearApproval(selection);
    markProductRequirementChanged(rowNumber);
  });
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
    .map((result) => Number(productVisibleScore(
      result,
      state.finalSelections.get(Number(result.rowNumber)),
      state.finalScoreUpdates.has(Number(result.rowNumber)),
    )))
    .filter(Number.isFinite);
}

async function handleFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const shouldCreateProjectFromFile = !hasProject();
  if (shouldCreateProjectFromFile) {
    resetProjectState({
      projectName: projectNameFromSourceFile(file.name),
      projectDescription: "",
    });
  }

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
  if (shouldCreateProjectFromFile) {
    setProjectRevisionAction(`Datei importiert: ${file.name}`);
    await createProjectInDatabase();
  } else {
    setProjectRevisionAction(`Datei importiert: ${file.name}`);
    updateProjectActions();
  }
  event.target.value = "";
  openSettingsDialog();
}

async function openProjectFile() {
  if (!canLoadProject()) return;

  const projects = await fetchProjectList();
  if (!projects) return;
  openProjectSelectionDialog(projects);
}

function openProjectSelectionDialog(projects) {
  renderProjectSelection(projects);
  els.projectSelectionOverlay.hidden = false;
}

function closeProjectSelectionDialog() {
  els.projectSelectionOverlay.hidden = true;
}

function renderProjectSelection(projects) {
  const canDeleteProjects = currentUserHasRole("admin");
  els.projectSelectionMessage.textContent = projects.length
    ? projectAvailabilityText(projects.length)
    : translateUiText("Es sind noch keine Projekte in der Datenbank gespeichert.");

  if (!projects.length) {
    els.projectSelectionBody.innerHTML = `<tr><td colspan="4" class="empty">${escapeHtml(translateUiText("Keine Projekte vorhanden."))}</td></tr>`;
    return;
  }

  els.projectSelectionBody.innerHTML = projects
    .map((project) => {
      const isCurrentProject = project.id === state.projectId;
      const projectName = project.name || "Miele.DevPilot";
      return `
        <tr>
          <td>
            <strong>${escapeHtml(projectName)}</strong>
            ${isCurrentProject ? ` <span class="muted-cell">(${escapeHtml(translateUiText("geöffnet"))})</span>` : ""}
          </td>
          <td>${escapeHtml(project.description || "-")}</td>
          <td>${escapeHtml(formatProjectDate(project.updatedAt || project.createdAt))}</td>
          <td>
            <div class="project-row-actions">
              <button type="button" data-project-action="open" data-project-id="${escapeHtml(project.id)}">${escapeHtml(translateUiText("Öffnen"))}</button>
              ${
                canDeleteProjects
                  ? `<button type="button" class="danger-text-button" data-project-action="delete" data-project-id="${escapeHtml(project.id)}" data-project-name="${escapeHtml(projectName)}">${escapeHtml(translateUiText("Löschen"))}</button>`
                  : ""
              }
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

function projectAvailabilityText(count) {
  return `${count} ${translateUiText(count === 1 ? "Projekt verfügbar" : "Projekte verfügbar")}`;
}

async function loadProjectFromServer(projectId) {
  const endpoint = getProjectEndpoint(projectId);
  if (!endpoint) return;

  try {
    state.projectSavePaused = true;
    const response = await fetch(endpoint);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      alert(data.error || translateUiText("Projekt konnte nicht geladen werden."));
      return;
    }

    loadProjectPayload(data.payload, `${data.project?.name || "Miele.DevPilot"}.mdp`, data.project?.id);
  } catch (error) {
    alert(`${translateUiText("Projekt konnte nicht geladen werden.")}: ${error.message}`);
  } finally {
    state.projectSavePaused = false;
  }
}

async function deleteProjectFromAdmin() {
  if (!currentUserHasRole("admin")) return;

  const projects = await fetchProjectList();
  if (!projects) return;
  openProjectSelectionDialog(projects);
}

async function deleteProjectById(projectId, projectName = "") {
  if (!currentUserHasRole("admin")) return;

  const displayName = projectName || "Projekt";
  if (!confirm(`Projekt "${displayName}" wirklich löschen?`)) {
    return;
  }

  try {
    const response = await fetch(getProjectEndpoint(projectId), { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      alert(data.error || translateUiText("Projekt konnte nicht gelöscht werden."));
      return;
    }

    if (state.projectId === projectId) {
      clearOpenProject();
    }
    const projects = await fetchProjectList();
    if (projects) {
      renderProjectSelection(projects);
    }
  } catch (error) {
    console.warn("Projekt konnte nicht gelöscht werden.", error);
  }
}

async function fetchProjectList() {
  const endpoint = getProjectsEndpoint();
  if (!endpoint) return null;

  try {
    const response = await fetch(endpoint);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      alert(data.error || translateUiText("Projektliste konnte nicht geladen werden."));
      return null;
    }

    return Array.isArray(data.projects) ? data.projects : [];
  } catch (error) {
    console.warn("Projektliste konnte nicht geladen werden.", error);
    return null;
  }
}

async function openProjectHistoryDialog() {
  if (!state.projectId) return;

  const revisions = await fetchProjectRevisions();
  if (!revisions) return;

  renderProjectHistory(revisions);
  els.projectHistoryOverlay.hidden = false;
}

function closeProjectHistoryDialog() {
  els.projectHistoryOverlay.hidden = true;
}

async function fetchProjectRevisions() {
  const endpoint = getProjectRevisionsEndpoint(state.projectId);
  if (!endpoint) return null;

  try {
    const response = await fetch(endpoint);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      alert(data.error || translateUiText("Projekt-Historie konnte nicht geladen werden."));
      return null;
    }

    return Array.isArray(data.revisions) ? data.revisions : [];
  } catch (error) {
    console.warn("Projekt-Historie konnte nicht geladen werden.", error);
    return null;
  }
}

function renderProjectHistory(revisions) {
  els.projectHistoryMessage.textContent = revisions.length
    ? revisionAvailabilityText(revisions.length)
    : translateUiText("Für dieses Projekt ist noch keine Historie vorhanden.");

  if (!revisions.length) {
    els.projectHistoryBody.innerHTML = `<tr><td colspan="4" class="empty">${escapeHtml(translateUiText("Keine Historie vorhanden."))}</td></tr>`;
    return;
  }

  els.projectHistoryBody.innerHTML = revisions
    .map((revision, index) => {
      const isLatest = index === 0;
      return `
        <tr>
          <td>
            ${escapeHtml(formatProjectDate(revision.createdAt))}
            ${isLatest ? ` <span class="muted-cell">(${escapeHtml(translateUiText("aktuell"))})</span>` : ""}
          </td>
          <td>${escapeHtml(formatRevisionAction(revision.action))}</td>
          <td>${escapeHtml(revision.userName || "-")}</td>
          <td>
            <div class="project-row-actions">
              <button type="button" data-revision-action="restore" data-revision-id="${escapeHtml(revision.id)}" ${isLatest ? "disabled" : ""}>${escapeHtml(translateUiText("Wiederherstellen"))}</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

function revisionAvailabilityText(count) {
  return `${count} ${translateUiText(count === 1 ? "Stand verfügbar" : "Stände verfügbar")}`;
}

async function restoreProjectRevision(revisionId) {
  if (!state.projectId || !revisionId) return;

  const endpoint = getProjectRevisionRestoreEndpoint(state.projectId, revisionId);
  if (!endpoint) return;

  try {
    state.projectSavePaused = true;
    const response = await fetch(endpoint, { method: "POST" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      alert(data.error || translateUiText("Projektstand konnte nicht wiederhergestellt werden."));
      return;
    }

    loadProjectPayload(data.payload, `${data.project?.name || "Miele.DevPilot"}.mdp`, data.project?.id);
    const revisions = await fetchProjectRevisions();
    if (revisions) {
      renderProjectHistory(revisions);
    }
  } catch (error) {
    console.warn("Projektstand konnte nicht wiederhergestellt werden.", error);
  } finally {
    state.projectSavePaused = false;
  }
}

function formatRevisionAction(action) {
  const labels = {
    created: translateUiText("Angelegt"),
    autosave: translateUiText("Automatisch gespeichert"),
    restored: translateUiText("Wiederhergestellt"),
  };

  return translateUiText(labels[action] || action || "Automatisch gespeichert");
}

function setProjectRevisionAction(action) {
  const label = String(action || "").trim();
  if (!label) return;

  state.projectRevisionAction = label;
}

function projectRevisionTargetLabel(item, fallback = "Requirement") {
  const candidates = [
    item?.id,
    item?.sourceId,
    item?.sourcePrId,
    item?.name,
    Number.isFinite(Number(item?.rowNumber)) ? `Zeile ${Number(item.rowNumber)}` : "",
    Number.isFinite(Number(item?.sourceRowNumber)) ? `Zeile ${Number(item.sourceRowNumber)}` : "",
  ];
  const value = candidates.map((candidate) => String(candidate || "").trim()).find(Boolean);

  return value || fallback;
}

function projectRevisionActionFor(action, item, fallback = "Requirement") {
  return `${action}: ${projectRevisionTargetLabel(item, fallback)}`;
}

function clearOpenProject() {
  clearTimeout(state.projectSaveTimerId);
  state.projectSavePaused = true;
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
  state.generatedIds = false;
  state.projectId = "";
  state.projectName = "";
  state.projectDescription = "";
  state.projectFileName = "";
  state.projectSavedSnapshot = "";
  state.projectDirty = false;
  state.projectSaveInFlight = false;
  state.projectSaveQueued = false;
  state.projectRevisionAction = "";
  state.sourceFileName = "";
  state.analysisComplete = false;
  state.activeProcessStep = "product";
  state.activeSelectionRow = null;
  resetProjectApprovalState();
  els.fileState.textContent = projectStatusText("");
  renderWorkspaceState();
  renderProductApprovalPanel();
  renderProductApprovalState();
  updateProjectActions();
  state.projectSavePaused = false;
}

function resetProjectApprovalState() {
  state.activeSelectionRow = null;
  state.productApprovalApproverIds = new Set();
  state.productApprovalStartedAt = "";
  state.productApprovalStartedBy = "";
  state.productApprovalListSearch = "";
  state.productApprovalStatusFilter = "all";
  state.productApprovalActiveTab = "comments";
  state.productApprovalDecisionMode = "";
  state.productReviewActiveTab = "final";
  state.productReviewTechTypeSearch = "";
  state.productReviewTechTypeFilter = "all";
  if (els.productApprovalSearch) els.productApprovalSearch.value = "";
  if (els.productApprovalStatusFilter) els.productApprovalStatusFilter.value = "all";
  if (els.productApprovalDisapproveComment) els.productApprovalDisapproveComment.value = "";
  if (els.productReviewTechTypeSearch) els.productReviewTechTypeSearch.value = "";
  if (els.productReviewTechTypeFilter) els.productReviewTechTypeFilter.value = "all";
}

function openSettingsDialog() {
  els.settingsOverlay.hidden = false;
}

function closeSettingsDialog() {
  els.settingsOverlay.hidden = true;
}

function openProjectDialog() {
  if (!canCreateProject()) return;

  els.projectName.value = state.projectName;
  els.projectDescription.value = state.projectDescription;
  els.projectOverlay.hidden = false;
  els.projectName.focus();
}

function closeProjectDialog() {
  els.projectOverlay.hidden = true;
}

function openOpenAiCostDialog() {
  renderOpenAiCostSummary();
  els.openAiCostOverlay.hidden = false;
}

function closeOpenAiCostDialog() {
  els.openAiCostOverlay.hidden = true;
}

async function createProject() {
  if (!canCreateProject()) return;

  const projectName = els.projectName.value.trim();
  if (!projectName) {
    els.projectName.focus();
    return;
  }

  resetProjectState({
    projectName,
    projectDescription: els.projectDescription.value.trim(),
  });

  const created = await createProjectInDatabase();
  if (!created) return;

  closeProjectDialog();
}

function resetProjectState({ projectName, projectDescription }) {
  clearTimeout(state.projectSaveTimerId);
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
  state.projectId = "";
  state.projectFileName = "";
  state.projectSavedSnapshot = "";
  state.projectDirty = true;
  state.projectSaveInFlight = false;
  state.projectSaveQueued = false;
  state.projectRevisionAction = "";
  resetProjectApprovalState();

  els.fileState.textContent = projectStatusText(projectName);
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
  setMenuButtonAvailability(els.analyzeButton, false, "Importiere zuerst eine PR-Datei");
  els.analyzeProductButton.disabled = true;
  updateProjectActions();
  updateExportAvailability();
  renderWorkspaceState();
  renderProcessPages();
  renderTable();
  renderProductApprovalPanel();
  renderProductApprovalState();
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
  if (!canModifyProductRequirements()) return;

  state.requirements = buildRequirementsFromCurrentConfig();
  setProjectRevisionAction(`Import konfiguriert: ${state.requirements.length} PR`);
  state.results = [];
  state.softwareRequirements = [];
  state.softwareSelections = new Map();
  state.e2eTests = [];
  state.e2eSelections = new Map();
  state.finalSelections = new Map();
  state.finalScoreUpdates = new Set();
  resetProjectApprovalState();
  state.scoreFilterActive = false;
  state.softwareScoreFilterActive = false;
  state.e2eScoreFilterActive = false;
  state.productWindchillTransferComplete = false;
  state.productWindchillTransferredAt = "";
  state.softwareWindchillTransferComplete = false;
  state.softwareWindchillTransferredAt = "";
  state.analysisComplete = false;
  updateProjectActions();
  updateExportAvailability();
  renderTable();
  renderProductApprovalPanel();
  renderMetrics();
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
  if (!canEditProductRequirements()) {
    alert("Nur Product Requirement Owner oder Admins können Product Requirements analysieren.");
    return;
  }

  const endpoint = getAnalyzeEndpoint();
  if (!endpoint) {
    alert("Bitte starte den lokalen Server und öffne die App über http://localhost:3000. Die Analyse-API ist über file:// nicht verfügbar.");
    return;
  }

  setMenuButtonAvailability(els.analyzeButton, false, "Analyse läuft");
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
      updateProgress({
        processed: results.length,
        total: state.requirements.length,
        batchNumber,
        totalBatches,
      });

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirementType: state.requirementType, uiLanguage: selectedUiLanguage(), requirements: batch }),
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

    state.analysisComplete = true;
    seedProductApprovalSelectionsFromAi();
    completeProgress(state.results.length);
    setProjectRevisionAction(`PR analysiert: ${state.results.length} Requirements`);
    updateProjectActions();
    updateExportAvailability();
  } catch (error) {
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
  const baseRows = state.scoreFilterActive
    ? state.requirements.filter((requirement) => criticalRows.has(Number(requirement.rowNumber)))
    : state.requirements;
  const rows = filteredProductApprovalRows(baseRows, resultByRow);
  renderProductApprovalListCount(rows.length, baseRows.length);

  if (!rows.length) {
    const message = state.scoreFilterActive
      ? `Keine Requirements mit Score unter ${PRODUCT_STEP_MIN_SCORE} gefunden.`
      : state.productApprovalListSearch || state.productApprovalStatusFilter !== "all"
        ? "Keine Requirements fuer den aktuellen Filter gefunden."
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
      const rowNumber = Number(item.rowNumber);
      const result = resultByRow.get(item.rowNumber);
      const selection = state.finalSelections.get(rowNumber);
      const isUpdatingFinalScore = state.finalScoreUpdates.has(rowNumber);
      const score = result ? productVisibleScore(result, selection, isUpdatingFinalScore) : null;
      const isSelected = Boolean(selection);
      const isExcluded = selection?.choice === "excluded";
      const rowIndex = state.requirements.findIndex((requirement) => Number(requirement.rowNumber) === rowNumber) + 1;
      const issues = displayProductIssues(result, selection);
      const openComments = countOpenDisapprovalComments(selection);
      const gateState = productRequirementQualityGateState(item, resultByRow);
      const processState = productRequirementProcessState(item, result, selection, isUpdatingFinalScore);
      return `
          <tr class="requirement-row approval-list-row ${state.activeSelectionRow === rowNumber ? "is-active-row" : ""} ${isExcluded ? "excluded-row" : ""} ${isUpdatingFinalScore ? "updating-row" : ""} process-${processState} quality-${gateState}" data-row-number="${item.rowNumber}" tabindex="0">
          <td class="approval-index-cell">${rowIndex}/${state.requirements.length}</td>
          <td>${escapeHtml(item.id || "-")}</td>
          <td>
            <span class="approval-list-title">${escapeHtml(item.name || item.id || `Zeile ${rowNumber}`)}</span>
          </td>
          <td>${renderProductQualityScoreCell(result, score, isExcluded, isUpdatingFinalScore)}</td>
          <td>${escapeHtml(productReviewSourceLabel(selection))}</td>
          <td>${renderProductProcessCell(processState, selection)}</td>
          <td>${escapeHtml(productTechTypeSummary(item, selection))}</td>
          <td>${renderProductFindingSummary(issues, openComments)}</td>
        </tr>
      `;
    })
    .join("");
}

function filteredProductApprovalRows(rows, resultByRow) {
  const search = state.productApprovalListSearch.trim().toLowerCase();
  const statusFilter = state.productApprovalStatusFilter;

  return rows.filter((requirement) => {
    const rowNumber = Number(requirement.rowNumber);
    const result = resultByRow.get(rowNumber);
    const selection = state.finalSelections.get(rowNumber);
    if (selection?.choice === "excluded") {
      return statusFilter === "all";
    }
    const searchText = [
      requirement.id,
      requirement.name,
      requirement.category,
      requirement.subcategory,
    ].join(" ").toLowerCase();
    if (search && !searchText.includes(search)) return false;

    if (statusFilter === "all") return true;
    const processState = productRequirementProcessState(
      requirement,
      result,
      selection,
      state.finalScoreUpdates.has(rowNumber),
    );
    if (statusFilter === "approved") return processState === "approved";
    if (statusFilter === "transferred") return processState === "transferred";
    if (statusFilter === "changed") return processState === "changed";
    return processState === statusFilter;
  });
}

function renderProductApprovalListCount(visibleCount, totalCount) {
  if (!els.productApprovalListCount) return;

  els.productApprovalListCount.textContent = visibleCount === totalCount
    ? `${visibleCount} Requirements`
    : `${visibleCount} / ${totalCount} Requirements`;
}

function renderProductStatusBadge(status) {
  return `<span class="status-badge ${escapeHtml(status.className)}" title="${escapeHtml(translateUiText(status.label))}">${escapeHtml(translateUiText(productStatusShortLabel(status)))}</span>`;
}

function productStatusShortLabel(status) {
  if (status.className === "approved") return "Freigegeben";
  if (status.className === "critical") return "Kritisch";
  if (status.className === "excluded") return "Ausgeschlossen";
  if (status.className === "updating") return "Aktualisiert...";
  if (status.className === "selected") return "Bereit";
  return "Ausstehend";
}

function productInitialScore(result) {
  if (!result) return null;
  const score = Number(result.originalScore);
  return Number.isFinite(score) ? score : Number(result.score);
}

function productVisibleScore(result, selection, isUpdatingFinalScore = false) {
  if (!result) return null;
  const score = Number(displayProductScore(result, selection, {
    usePreviousScore: isUpdatingFinalScore || Boolean(selection?.needsFinalAssessment),
  }));
  return Number.isFinite(score) ? score : null;
}

function productFinalScore(result, selection) {
  if (!result || !selection || selection.choice === "excluded" || selection.needsFinalAssessment) return null;
  const score = Number(displayProductScore(result, selection));
  return Number.isFinite(score) ? score : null;
}

function productFinalScoreStatus(result, selection, isUpdatingFinalScore = false) {
  if (selection?.choice === "excluded") return "EXCLUDED";
  if (isUpdatingFinalScore) return "CALCULATING";
  if (!selection?.text) return "MISSING";
  if (selection.needsFinalAssessment) return "STALE";

  const score = productFinalScore(result, selection);
  if (!Number.isFinite(score)) return "MISSING";
  return score >= PRODUCT_STEP_MIN_SCORE ? "PASSED" : "FAILED";
}

function productFinalizationState(requirement, result, selection, isUpdatingFinalScore = false) {
  if (selection?.choice === "excluded") return "EXCLUDED";
  if (!state.analysisComplete) return "IMPORTED";
  if (!selection) return result ? "FINALIZATION_OPEN" : "ANALYZED";

  const scoreStatus = productFinalScoreStatus(result, selection, isUpdatingFinalScore);
  if (scoreStatus === "CALCULATING") return "FINAL_SCORE_PENDING";
  if (scoreStatus === "STALE" || scoreStatus === "MISSING") return "FINAL_SCORE_PENDING";
  if (scoreStatus === "FAILED") return "FINAL_SCORE_FAILED";
  if (!selectedTechTypesForRequirement(requirement, selection).length) return "FINAL_REQUIREMENT_SELECTED";
  if (selection.finalizedAt) return "READY_FOR_APPROVAL";
  return "FINAL_SCORE_PASSED";
}

function productReviewSourceLabel(selection) {
  const source = productReviewSource(selection);
  const labels = {
    ORIGINAL: "Original",
    AI_PROPOSAL: "AI Proposal",
    MANUAL_EDIT: "Manual Edit",
    AI_ASSISTED_EDIT: "AI Assisted",
    EXCLUDED: "Ausgeschlossen",
    OPEN: "-",
  };
  return labels[source] || labels.OPEN;
}

function productReviewSource(selection) {
  if (!selection) return "OPEN";
  if (selection.choice === "excluded") return "EXCLUDED";
  if (selection.selectedSource) return selection.selectedSource;
  if (selection.choice === "original") return "ORIGINAL";
  if (selection.choice === "ai") return "AI_PROPOSAL";
  if (selection.choice === "manual") return "MANUAL_EDIT";
  return "OPEN";
}

function productTechTypeSummary(requirement, selection) {
  if (selection?.choice === "excluded") return "Nicht erforderlich";
  const selected = selectedTechTypesForRequirement(requirement, selection);
  const total = state.techTypes.length;
  if (!total) return "Keine TechTypes";
  return `${selected.length}/${total}`;
}

function productRequirementProcessState(requirement, result, selection, isUpdatingFinalScore = false) {
  if (selection?.choice === "excluded") return "excluded";
  if (state.changedProductRequirementRows.has(Number(requirement?.rowNumber))) return "changed";
  if (state.productWindchillTransferComplete && isProductSelectionApproved(selection)) return "transferred";
  if (isProductSelectionApproved(selection)) return "approved";
  if (isProductApprovalStarted()) return "in-approval";
  if (!state.analysisComplete || !result) return "analysis";

  const finalizationStatus = productFinalizationState(requirement, result, selection, isUpdatingFinalScore);
  if (finalizationStatus === "READY_FOR_APPROVAL" || finalizationStatus === "FINAL_SCORE_PASSED") return "ready";
  return "editing";
}

function renderProductProcessBadge(status) {
  const labels = {
    analysis: "Analyse",
    editing: "Bearbeitung",
    ready: "Bereit für Freigabe",
    "in-approval": "In Freigabe",
    approved: "Freigegeben",
    transferred: "Transferiert",
    changed: "Geändert",
    excluded: "Ausgeschlossen",
  };
  const className =
    status === "approved" || status === "transferred"
      ? "approved"
      : status === "excluded"
        ? "excluded"
        : status === "changed"
          ? "critical"
        : status === "editing"
          ? "selected"
          : status === "in-approval"
            ? "pending"
            : "updating";
  return `<span class="status-badge ${className}">${escapeHtml(translateUiText(labels[status] || labels.analysis))}</span>`;
}

function renderProductProcessCell(status, selection) {
  return `
    <div class="product-process-cell">
      ${renderProductProcessBadge(status)}
      ${renderProductApprovalProgress(selection)}
    </div>
  `;
}

function renderProductFindingSummary(issues, openComments) {
  const issueText = issues.length ? displayIssueField(issues[0], "explanation") : translateUiText("Keine wesentlichen Hinweise");
  const commentBadge = openComments
    ? `<span class="open-comments-badge">${openComments} ${escapeHtml(translateUiText(openComments === 1 ? "offener Kommentar" : "offene Kommentare"))}</span>`
    : "";
  return `
    <span class="finding-summary" title="${escapeHtml(issueText)}">${escapeHtml(issueText)}</span>
    ${commentBadge}
  `;
}

function productRequirementQualityGateState(requirement, resultByRow) {
  const selection = state.finalSelections.get(Number(requirement?.rowNumber));
  if (selection?.choice === "excluded") return "excluded";
  const score = productQualityGateScore(requirement, resultByRow);
  if (!Number.isFinite(score)) return "missing";
  return score >= PRODUCT_STEP_MIN_SCORE ? "passed" : "rework";
}

function renderProductQualityScoreCell(result, score, isExcluded, isUpdatingFinalScore) {
  if (!Number.isFinite(Number(score)) && !isUpdatingFinalScore) return `<span class="muted-cell">-</span>`;
  const rendered = renderScoreCell(result, score, true, isExcluded, isUpdatingFinalScore);
  if (!result || isExcluded || isUpdatingFinalScore || !isProductQualityGateBlockingScore(score)) return rendered;

  return rendered;
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
  return 8;
}

function seedProductApprovalSelectionsFromAi() {
  state.results.forEach((result) => {
    const rowNumber = Number(result.rowNumber);
    const requirement = state.requirements.find((item) => Number(item.rowNumber) === rowNumber);
    const text = requirement?.text || "";
    if (!requirement || !text || state.finalSelections.has(rowNumber)) return;

    state.finalSelections.set(rowNumber, {
      choice: "original",
      selectedSource: "ORIGINAL",
      text,
      techTypes: selectedTechTypesForRequirement(requirement, null),
      approvedAt: "",
      approvedBy: "",
      approvals: [],
      comments: [],
      versions: [
        {
          version: 1,
          text,
          changedAt: new Date().toISOString(),
          changedBy: "Import",
          reason: "Initial Original Requirement",
        },
      ],
    });
  });
}

function migrateProductApprovalSelections() {
  if (!state.analysisComplete || !state.results.length) return;

  seedProductApprovalSelectionsFromAi();
  state.finalSelections.forEach((selection, rowNumber) => {
    const result = state.results.find((entry) => Number(entry.rowNumber) === Number(rowNumber));
    const requirement = state.requirements.find((item) => Number(item.rowNumber) === Number(rowNumber));
    if (
      selection?.choice === "ai" &&
      selection?.selectedSource === "AI_PROPOSAL" &&
      !selection.finalizedAt &&
      !selection.approvedAt &&
      !productApprovalRecords(selection).length &&
      requirement?.text
    ) {
      selection.choice = "original";
      selection.selectedSource = "ORIGINAL";
      selection.text = requirement.text;
      delete selection.previousScore;
      selection.needsFinalAssessment = false;
      selection.versions = [
        {
          version: 1,
          text: requirement.text,
          changedAt: new Date().toISOString(),
          changedBy: "Migration",
          reason: "Initial Original Requirement",
        },
      ];
    }
    if (!Array.isArray(selection.comments)) selection.comments = [];
    if (!Array.isArray(selection.approvals)) selection.approvals = [];
    if (!Array.isArray(selection.versions) || !selection.versions.length) {
      selection.versions = [
        {
          version: 1,
          text: selection.text || "",
          changedAt: new Date().toISOString(),
          changedBy: "Migration",
          reason: "Initial approval version",
        },
      ];
    }
  });
}

function renderProductApprovalProgress(selection) {
  if (!isProductApprovalStarted()) return "";

  const requiredCount = getRequiredProductApproverIds().length;
  if (!requiredCount) return "";

  const approvedCount = countProductApprovals(selection);
  const openComments = countOpenDisapprovalComments(selection);
  const currentApproverId = currentProductApproverSlotId();
  const currentApproverApproved = currentApproverId && hasProductApprovalFrom(selection, currentApproverId);
  const fullyApproved = approvedCount >= requiredCount && openComments === 0;
  const label = openComments
    ? `${approvedCount}/${requiredCount} ${translateUiText("Freigaben")} · ${openComments} ${translateUiText("offen")}`
    : `${approvedCount}/${requiredCount} ${translateUiText("Freigaben")}`;
  const title = currentApproverApproved
    ? translateUiText("Deine Freigabe wurde fuer dieses Requirement erfasst.")
    : translateUiText("Noch keine Freigabe von deinem Approver-Benutzer erfasst.");
  const className = fullyApproved ? "is-complete" : currentApproverApproved ? "is-own-approved" : "is-pending";
  const ownApproval = currentApproverApproved
    ? `<span class="approval-own-marker">${escapeHtml(translateUiText("Meine Freigabe erfasst"))}</span>`
    : "";

  return `
    <span class="approval-progress-mini ${className}" title="${escapeHtml(title)}">${escapeHtml(label)}</span>
    ${ownApproval}
  `;
}

function handleResultRowClick(event) {
  if (!state.analysisComplete) return;

  const row = event.target.closest(".requirement-row");
  if (!row) return;

  selectProductRequirement(Number(row.dataset.rowNumber));
}

function selectProductRequirement(rowNumber) {
  state.activeSelectionRow = Number(rowNumber);
  state.productApprovalDecisionMode = "";
  renderTable();
  renderProductApprovalPanel();
}

function handleProductApprovalSearch(event) {
  state.productApprovalListSearch = event.target.value || "";
  renderTable();
}

function handleProductApprovalStatusFilter(event) {
  state.productApprovalStatusFilter = event.target.value || "all";
  renderTable();
}

function handleProductApprovalTabClick(event) {
  const button = event.target.closest("[data-approval-tab]");
  if (!button) return;

  state.productApprovalActiveTab = button.dataset.approvalTab || "comments";
  renderProductApprovalPanel();
}

function openSelectionDialog(rowNumber) {
  const item = state.requirements.find((requirement) => Number(requirement.rowNumber) === rowNumber);
  if (!item) return;

  const result = state.results.find((entry) => Number(entry.rowNumber) === rowNumber);
  const score = result ? productVisibleScore(result, state.finalSelections.get(rowNumber), state.finalScoreUpdates.has(rowNumber)) : null;
  state.activeSelectionRow = rowNumber;

  els.selectionId.textContent = item.id || "-";
  els.selectionName.textContent = item.name || item.id || "-";
  els.selectionGroup.textContent = `${item.category || "Ohne Kategorie"} / ${item.subcategory || "Ohne Subkategorie"}`;
  els.selectionScore.textContent = Number.isFinite(Number(score)) ? String(score) : "-";
  els.selectionOriginalText.textContent = item.text;
  els.selectionAiText.textContent = result?.rewrittenRequirement || "Noch kein AI-Vorschlag vorhanden. Bitte zuerst die Analyse ausführen.";
  els.prImprovementInstruction.value = "";
  els.prImprovementAttachments.value = "";
  renderImprovementAttachmentList(els.prImprovementAttachments, els.prImprovementAttachmentList);
  renderTechTypeSelection(item, state.finalSelections.get(rowNumber));
  const canEditProduct = canModifyProductRequirements();
  els.selectOriginalButton.disabled = !canEditProduct;
  els.selectOriginalButton.hidden = true;
  els.selectAiButton.disabled = !canEditProduct || !result?.rewrittenRequirement;
  els.selectAiButton.title = isProductQualityGateBlockingScore(score)
    ? "Dieser Vorschlag kann vorbereitet werden, blockiert den Approval-Start aber weiter, solange der Score 85 oder niedriger ist."
    : "";
  els.excludeRequirementButton.disabled = !canEditProduct;
  els.prImproveButton.disabled = !canEditProduct;
  els.approveRequirementButton.disabled = !canApproveProductRequirement(rowNumber);
  els.approveRequirementButton.textContent = translateUiText(productApprovalButtonText(rowNumber));
  els.selectionIssues.innerHTML = result
    ? renderIssues(displayProductIssues(result, state.finalSelections.get(rowNumber)))
    : "Noch keine Analysehinweise vorhanden.";
  els.selectionOverlay.hidden = false;
}

function closeSelectionDialog() {
  els.selectionOverlay.hidden = true;
}

function closeActiveProductEditDialog() {
  closeSelectionDialog();
  closeProductRequirementDetailDialog();
}

function closeProductRequirementDetailDialog() {
  if (!els.productApprovalDetailPanel) return;

  els.productApprovalDetailPanel.hidden = true;
  state.activeSelectionRow = null;
  state.productApprovalDecisionMode = "";
  renderTable();
}

function openProductEditDialog() {
  if (!state.analysisComplete || !state.requirements.length) return;

  const currentRow = state.requirements.some((item) => Number(item.rowNumber) === Number(state.activeSelectionRow))
    ? Number(state.activeSelectionRow)
    : Number(state.requirements[0].rowNumber);
  selectProductRequirement(currentRow);
}

function renderProductApprovalPanel() {
  if (!els.productApprovalDetailPanel) return;

  const hasActiveRequirement = state.analysisComplete && Boolean(state.activeSelectionRow);
  els.productApprovalDetailPanel.hidden = !hasActiveRequirement;
  if (els.productApprovalDetailPanel.hidden) return;

  if (!isProductApprovalStarted()) {
    renderProductReviewPanel();
    return;
  }

  const rowNumber = Number(state.activeSelectionRow);
  const requirement = state.requirements.find((item) => Number(item.rowNumber) === rowNumber);
  const selection = state.finalSelections.get(rowNumber);
  const result = state.results.find((entry) => Number(entry.rowNumber) === rowNumber);
  els.productReviewDetailContent.hidden = true;
  if (!requirement || !selection) {
    els.productApprovalDetailEmpty.hidden = false;
    els.productApprovalDetailContent.hidden = true;
    return;
  }

  const score = productVisibleScore(result, selection, state.finalScoreUpdates.has(rowNumber));
  const openDisapprovals = countOpenDisapprovalComments(selection);
  const fullyApproved = isProductSelectionFullyApproved(selection) && openDisapprovals === 0;
  const requiredApproverIds = getRequiredProductApproverIds();
  const approvedCount = countProductApprovals(selection);
  const versions = productApprovalVersions(selection);
  const statusLabel = fullyApproved ? translateUiText("Final freigegeben") : translateUiText("Bereit für Freigabe");
  const canEdit = canReviseProductApprovalRequirement(rowNumber);
  const canApprove = canApproveProductRequirement(rowNumber);
  const canDisapprove = canDisapproveProductRequirement(rowNumber);
  els.productApprovalDetailEmpty.hidden = true;
  els.productApprovalDetailContent.hidden = false;
  els.productApprovalDetailStatus.textContent = statusLabel;
  els.productApprovalDetailStatus.className = `status-badge ${fullyApproved ? "approved" : "pending"}`;
  els.productApprovalDetailTitle.textContent = requirement.name || requirement.id || `Zeile ${rowNumber}`;
  els.productApprovalDetailSubtitle.textContent = requirement.id || `Zeile ${rowNumber}`;
  els.productApprovalDetailProgress.textContent = `${approvedCount} / ${requiredApproverIds.length}`;
  els.productApprovalDetailId.textContent = requirement.id || "-";
  els.productApprovalDetailScore.textContent = Number.isFinite(Number(score)) ? String(score) : "-";
  els.productApprovalDetailOwner.textContent = state.productApprovalStartedBy || state.projectName || currentApprovalUserName();
  els.productApprovalDetailVersion.textContent = versions.length ? `v${versions.length}` : "v1";
  els.productApprovalDetailMetaStatus.textContent = statusLabel;
  els.productApprovalDetailOpenComments.textContent = String(openDisapprovals);
  els.productApprovalFinalText.value = selection.text || result?.rewrittenRequirement || requirement.text || "";
  els.productApprovalFinalText.disabled = !canEdit;
  els.productApprovalOriginalText.textContent = requirement.text || "-";
  els.productApprovalOwnerActions.hidden = !canEdit;
  els.productApprovalSaveTextButton.disabled = !canEdit;
  els.productApprovalSubmitButton.disabled = !canEdit;
  els.productApprovalAiImprovement.hidden = !canEdit;
  els.productApprovalImprovementInstruction.disabled = !canEdit;
  els.productApprovalImprovementAttachments.disabled = !canEdit;
  els.productApprovalImproveButton.disabled = !canEdit;
  els.productApprovalDecision.hidden = !canApproveProductRequirements();
  els.productApprovalApproveButton.disabled = !canApprove || openDisapprovals > 0;
  els.productApprovalShowDisapproveButton.disabled = !canDisapprove;
  els.productApprovalDisapproveBox.hidden = state.productApprovalDecisionMode !== "disapprove";
  els.productApprovalDisapproveComment.disabled = !canDisapprove;
  updateProductDisapprovalSubmitState();
  renderProductApprovalTabs(selection);
}

function renderProductReviewPanel() {
  ensureProductReviewToolsInSidebar();
  const rowNumber = Number(state.activeSelectionRow);
  const item = state.requirements.find((requirement) => Number(requirement.rowNumber) === rowNumber);
  if (!item) {
    els.productApprovalDetailEmpty.hidden = false;
    els.productReviewDetailContent.hidden = true;
    els.productApprovalDetailContent.hidden = true;
    return;
  }

  const result = state.results.find((entry) => Number(entry.rowNumber) === rowNumber);
  const selection = state.finalSelections.get(rowNumber);
  els.productApprovalDetailEmpty.hidden = true;
  els.productApprovalDetailContent.hidden = true;
  els.productReviewDetailContent.hidden = false;
  els.productReviewDetailTitle.textContent = item.name || item.id || `Zeile ${rowNumber}`;
  els.productReviewDetailSubtitle.textContent = `${item.id || "Ohne ID"} · ${item.category || "Ohne Kategorie"} / ${item.subcategory || "Ohne Subkategorie"}`;
  const isUpdatingFinalScore = state.finalScoreUpdates.has(rowNumber);
  const visibleScore = productVisibleScore(result, selection, isUpdatingFinalScore);
  const finalScore = productFinalScore(result, selection);
  const finalScoreStatus = productFinalScoreStatus(result, selection, isUpdatingFinalScore);
  const finalizationStatus = productFinalizationState(item, result, selection, isUpdatingFinalScore);
  els.productReviewDetailStatus.textContent = productFinalizationStatusLabel(finalizationStatus);
  els.productReviewDetailStatus.className = `status-badge ${productFinalizationStatusClass(finalizationStatus)}`;
  els.productReviewDetailScore.textContent = Number.isFinite(visibleScore) ? `Score ${visibleScore}` : "Score -";
  els.productReviewDetailScore.classList.toggle("is-blocking-score", finalScoreStatus === "FAILED");
  els.productReviewQualityWarning.hidden = finalScoreStatus !== "FAILED" && finalScoreStatus !== "STALE" && finalScoreStatus !== "MISSING";

  els.selectionId.textContent = item.id || "-";
  els.selectionName.textContent = item.name || item.id || "-";
  els.selectionGroup.textContent = `${item.category || "Ohne Kategorie"} / ${item.subcategory || "Ohne Subkategorie"}`;
  els.selectionScore.textContent = Number.isFinite(visibleScore) ? String(visibleScore) : "-";
  els.selectionOriginalText.textContent = item.text;
  els.selectionAiText.textContent = result?.rewrittenRequirement || "Noch kein AI-Vorschlag vorhanden. Bitte zuerst die Analyse ausführen.";
  els.productReviewFinalText.value = selection?.text || result?.rewrittenRequirement || "";
  els.productReviewFinalText.disabled = true;
  els.productReviewFinalScore.textContent = Number.isFinite(visibleScore) ? `Score ${visibleScore}` : "Score -";
  els.productReviewFinalScoreStatus.textContent = finalScoreStatus;
  els.productReviewFinalScoreStatus.className = `quality-badge ${productFinalScoreStatusClass(finalScoreStatus)}`;
  els.productReviewFinalScoreHint.textContent = productFinalScoreHint(finalScoreStatus);
  els.productReviewSaveFinalTextButton.disabled = true;
  els.productReviewRecalculateScoreButton.disabled = true;
  renderTechTypeSelection(item, selection);
  applyProductReviewTechTypeFilter();
  const canEditProduct = canModifyProductRequirements();
  els.selectOriginalButton.disabled = true;
  els.selectOriginalButton.hidden = true;
  els.selectAiButton.disabled = !canEditProduct || !result?.rewrittenRequirement;
  els.excludeRequirementButton.disabled = !canEditProduct;
  els.prImproveButton.disabled = !canEditProduct;
  els.approveRequirementButton.hidden = false;
  els.approveRequirementButton.textContent = translateUiText("PR freigeben");
  els.approveRequirementButton.disabled =
    !canEditProduct ||
    isUpdatingFinalScore ||
    !selection?.text?.trim() ||
    !selectedTechTypesForRequirement(item, selection).length;
  els.selectionDeferButton.hidden = false;
  els.selectionDeferButton.textContent = translateUiText("Später entscheiden");
  const initialScore = productInitialScore(result);
  els.selectionIssues.innerHTML = result
    ? `
      <div class="analysis-summary-grid">
        <div><span>Score</span><strong>${Number.isFinite(visibleScore) ? visibleScore : Number.isFinite(initialScore) ? initialScore : "-"}</strong></div>
        <div><span>Score Status</span><strong>${escapeHtml(finalScoreStatus)}</strong></div>
        <div><span>Finalization</span><strong>${escapeHtml(productFinalizationStatusLabel(finalizationStatus))}</strong></div>
      </div>
      ${renderIssues(displayProductIssues(result, selection))}
    `
    : "Noch keine Analysehinweise vorhanden.";
  renderProductReviewHistory(selection);
}

function ensureProductReviewToolsInSidebar() {
  if (els.productReviewFinalChoiceHost?.dataset.mounted === "true") return;

  const nodes = [
    els.selectionId.closest(".selection-meta"),
    els.selectionOriginalText.closest(".selection-grid"),
  ].filter(Boolean);
  nodes.forEach((node) => els.productReviewFinalChoiceHost.append(node));
  const originalCard = els.selectionOriginalText.closest(".choice-card");
  if (originalCard) originalCard.append(els.selectionIssues.closest(".selection-issues"));
  els.productReviewFinalActionsHost.append(els.excludeRequirementButton.closest(".selection-actions"));
  els.productReviewFinalChoiceHost.dataset.mounted = "true";
}

function renderProductReviewTabs() {
  const activeTab = state.productReviewActiveTab || "final";
  const tabMap = {
    final: els.productReviewFinalTab,
    techtypes: els.productReviewTechTypesTab,
    analysis: els.productReviewAnalysisTab,
    history: els.productReviewHistoryTab,
  };
  els.productReviewTabs.querySelectorAll("[data-review-tab]").forEach((button) => {
    const isActive = button.dataset.reviewTab === activeTab;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });
  Object.entries(tabMap).forEach(([tab, element]) => {
    if (element) element.hidden = tab !== activeTab;
  });
}

function productFinalizationStatusLabel(status) {
  const labels = {
    IMPORTED: "Importiert",
    ANALYZED: "Analysiert",
    FINALIZATION_OPEN: "Finalisierung offen",
    FINAL_REQUIREMENT_SELECTED: "Finales Requirement gewählt",
    FINAL_SCORE_PENDING: "Score neu berechnen",
    FINAL_SCORE_PASSED: "Score bestanden",
    FINAL_SCORE_FAILED: "Nacharbeit erforderlich",
    EXCLUDED: "Ausgeschlossen",
    READY_FOR_APPROVAL: "Für Approval vorbereitet",
  };
  return translateUiText(labels[status] || status);
}

function productFinalizationStatusClass(status) {
  if (status === "READY_FOR_APPROVAL" || status === "FINAL_SCORE_PASSED") return "approved";
  if (status === "FINAL_SCORE_FAILED") return "critical";
  if (status === "EXCLUDED") return "excluded";
  return "pending";
}

function productFinalScoreStatusClass(status) {
  if (status === "PASSED") return "passed";
  if (status === "FAILED") return "rework";
  return "missing";
}

function productFinalScoreHint(status) {
  if (status === "PASSED") return translateUiText("Score erfüllt die Voraussetzung für den späteren Approval-Prozess.");
  if (status === "FAILED") return translateUiText("Nacharbeit erforderlich.");
  if (status === "STALE") return translateUiText("Score neu berechnen erforderlich.");
  if (status === "CALCULATING") return translateUiText("Score wird berechnet.");
  if (status === "EXCLUDED") return translateUiText("Ausgeschlossene Requirements benötigen keinen Score.");
  return translateUiText("Score neu berechnen erforderlich.");
}

function renderProductReviewHistory(selection) {
  const versions = productApprovalVersions(selection);
  els.productReviewHistory.innerHTML = versions.length
    ? versions
        .slice()
        .reverse()
        .map((version) => `
          <article class="approval-history-entry">
            <strong>${escapeHtml(version.reason || "Änderung")}</strong>
            <small>${escapeHtml(version.changedBy || "-")} · ${escapeHtml(new Date(version.changedAt || Date.now()).toLocaleString())}</small>
            ${version.text ? `<p>${escapeHtml(version.text)}</p>` : ""}
          </article>
        `)
        .join("")
    : `<p class="muted-cell">Noch keine Finalisierungshistorie vorhanden.</p>`;
}

function renderProductApprovalTabs(selection) {
  const activeTab = state.productApprovalActiveTab || "comments";
  els.productApprovalTabs.querySelectorAll("[data-approval-tab]").forEach((button) => {
    const isActive = button.dataset.approvalTab === activeTab;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  if (activeTab === "approvals") {
    els.productApprovalTabContent.innerHTML = renderProductApprovalApprovals(selection);
    return;
  }

  if (activeTab === "versions") {
    els.productApprovalTabContent.innerHTML = renderProductApprovalHistory(selection);
    return;
  }

  els.productApprovalTabContent.innerHTML = renderProductApprovalComments(selection);
}

function showProductDisapprovalForm() {
  state.productApprovalDecisionMode = "disapprove";
  renderProductApprovalPanel();
  els.productApprovalDisapproveComment.focus();
}

function updateProductDisapprovalSubmitState() {
  if (!els.productApprovalDisapproveButton) return;

  const rowNumber = Number(state.activeSelectionRow);
  const hasComment = Boolean(els.productApprovalDisapproveComment.value.trim());
  els.productApprovalDisapproveButton.disabled = !canDisapproveProductRequirement(rowNumber) || !hasComment;
}

function submitProductRequirementForApproval() {
  const rowNumber = Number(state.activeSelectionRow);
  if (!state.finalSelections.has(rowNumber) || !canReviseProductApprovalRequirement(rowNumber)) return;

  setProjectRevisionAction("PR erneut zur Freigabe bereitgestellt");
  renderProductApprovalPanel();
  updateProjectActions();
}

async function handleProductReviewPrimaryAction() {
  if (isProductApprovalStarted()) {
    if (approveProductRequirement(state.activeSelectionRow)) {
      closeActiveProductEditDialog();
    }
    return;
  }

  await finalizeProductRequirement();
}

function handleProductReviewTabClick(event) {
  const button = event.target.closest("[data-review-tab]");
  if (!button) return;

  state.productReviewActiveTab = button.dataset.reviewTab || "final";
  renderProductReviewPanel();
}

function handleProductReviewFinalTabClick(event) {
  const assistButton = event.target.closest("[data-ai-assist]");
  if (!assistButton) return;

  els.prImprovementInstruction.value = assistButton.dataset.aiAssist || "";
  void improveProductRequirementWithAi();
}

function markProductReviewFinalTextStale() {
  const selection = ensureActiveProductSelection("manual");
  if (!selection || !canModifyProductRequirements()) return;

  selection.text = els.productReviewFinalText.value;
  selection.choice = "manual";
  selection.selectedSource = "MANUAL_EDIT";
  selection.needsFinalAssessment = true;
  selection.finalizedAt = "";
  els.productReviewFinalScoreStatus.textContent = "STALE";
  els.productReviewFinalScoreStatus.className = "quality-badge missing";
  els.productReviewFinalScoreHint.textContent = "Score neu berechnen erforderlich.";
  updateProjectActions();
}

async function saveProductReviewFinalText() {
  const selection = ensureActiveProductSelection("manual");
  if (!selection || !canModifyProductRequirements()) return;

  const text = els.productReviewFinalText.value.trim();
  if (!text) {
    alert("Finales Product Requirement darf nicht leer sein.");
    return;
  }
  if (text === selection.text) return;

  const changeComment = await requestApprovedProductRequirementChangeComment(
    state.activeSelectionRow,
    "Manuelle Änderung",
  );
  if (changeComment === null) return;

  selection.text = text;
  selection.choice = selection.choice || "manual";
  selection.selectedSource = selection.selectedSource || "MANUAL_EDIT";
  selection.needsFinalAssessment = true;
  selection.finalizedAt = "";
  addProductReviewHistory(selection, productChangeHistoryReason("Manuelle Änderung", changeComment), text);
  invalidateProductRequirementAfterChange(state.activeSelectionRow);
  setProjectRevisionAction("Finales PR gespeichert");
  renderTable();
  renderProductReviewPanel();
  renderMetrics();
  updateProjectActions();
}

async function recalculateProductReviewFinalScore() {
  const rowNumber = Number(state.activeSelectionRow);
  const item = state.requirements.find((requirement) => Number(requirement.rowNumber) === rowNumber);
  const selection = state.finalSelections.get(rowNumber);
  if (!item || !selection?.text || !canModifyProductRequirements()) return;

  addProductReviewHistory(selection, "Score-Neuberechnung gestartet", selection.text);
  await recalculateFinalScore(item, selection.text, selection.choice || "manual");
  const updatedSelection = state.finalSelections.get(rowNumber);
  if (updatedSelection) {
    addProductReviewHistory(updatedSelection, "Score neu berechnet", updatedSelection.text);
  }
  renderProductReviewPanel();
}

async function finalizeProductRequirement() {
  const rowNumber = Number(state.activeSelectionRow);
  const item = state.requirements.find((requirement) => Number(requirement.rowNumber) === rowNumber);
  const selection = state.finalSelections.get(rowNumber);
  if (!item || !selection || !canModifyProductRequirements()) return;

  if (!selection.text?.trim()) {
    alert("Bitte lege zuerst ein finales Product Requirement fest.");
    return;
  }
  if (!selectedTechTypesForRequirement(item, selection).length) {
    alert("Bitte wähle mindestens einen TechType aus.");
    return;
  }

  els.approveRequirementButton.disabled = true;
  els.approveRequirementButton.textContent = "Score wird berechnet...";
  if (selection.needsFinalAssessment) {
    addProductReviewHistory(selection, "Score-Neuberechnung gestartet", selection.text);
    await recalculateFinalScore(item, selection.text, selection.choice || "manual");
  }

  const updatedResult = state.results.find((entry) => Number(entry.rowNumber) === rowNumber);
  const updatedSelection = state.finalSelections.get(rowNumber);
  const finalScore = productFinalScore(updatedResult, updatedSelection);
  if (!updatedSelection || !Number.isFinite(finalScore) || finalScore < PRODUCT_STEP_MIN_SCORE) {
    alert(`Requirement kann erst mit Score >= ${PRODUCT_STEP_MIN_SCORE} fertiggestellt werden.`);
    renderProductReviewPanel();
    return;
  }

  const selectionToFinalize = updatedSelection;
  selectionToFinalize.finalizedAt = new Date().toISOString();
  addProductReviewHistory(selectionToFinalize, "Requirement fertiggestellt", selectionToFinalize.text);
  setProjectRevisionAction(projectRevisionActionFor("PR finalisiert", item, "PR"));
  closeActiveProductEditDialog();
  renderTable();
  renderMetrics();
  updateProjectActions();
}

function ensureActiveProductSelection(choice = "manual") {
  const rowNumber = Number(state.activeSelectionRow);
  if (!rowNumber) return null;
  let selection = state.finalSelections.get(rowNumber);
  if (selection) return selection;

  const item = state.requirements.find((requirement) => Number(requirement.rowNumber) === rowNumber);
  if (!item) return null;
  selection = {
    choice,
    selectedSource: "MANUAL_EDIT",
    text: "",
    techTypes: selectedTechTypesForRequirement(item, null),
    approvedAt: "",
    approvedBy: "",
    approvals: [],
    comments: [],
    versions: [],
    needsFinalAssessment: true,
  };
  state.finalSelections.set(rowNumber, selection);
  return selection;
}

function addProductReviewHistory(selection, reason, text = selection?.text || "") {
  if (!selection) return;
  selection.versions = productApprovalVersions(selection);
  selection.versions.push({
    version: selection.versions.length + 1,
    text,
    changedAt: new Date().toISOString(),
    changedBy: currentApprovalUserName(),
    reason,
  });
}

function productSelectionHasApproval(selection) {
  return Boolean(selection?.approvedAt) || productApprovalRecords(selection).some((approval) => approval?.approvedAt);
}

async function requestApprovedProductRequirementChangeComment(rowNumber, changeType = "Änderung") {
  const selection = state.finalSelections.get(Number(rowNumber));
  if (!productSelectionHasApproval(selection)) return "";

  const commentText = await openChangeRequestDialog(changeType);
  const normalizedComment = String(commentText || "").trim();
  if (!normalizedComment) {
    return null;
  }

  addProductChangeRequestComment(selection, normalizedComment, changeType);
  return normalizedComment;
}

function openChangeRequestDialog(changeType = "Änderung") {
  return new Promise((resolve) => {
    if (state.changeRequestDialogResolve) {
      state.changeRequestDialogResolve(null);
    }

    state.changeRequestDialogResolve = resolve;
    els.changeRequestTitle.textContent = translateUiText("Änderung am freigegebenen Requirement");
    els.changeRequestDescription.textContent = translateUiText("Bitte dokumentiere, warum das bereits freigegebene Requirement geändert wird.");
    els.changeRequestComment.value = changeType ? `Change Request - ${translateUiText(changeType)}` : "Change Request";
    els.changeRequestMessage.textContent = "";
    els.changeRequestOverlay.hidden = false;
    updateChangeRequestDialogState();
    window.setTimeout(() => {
      els.changeRequestComment.focus();
      els.changeRequestComment.select();
    }, 0);
  });
}

function closeChangeRequestDialog(value) {
  if (els.changeRequestOverlay) {
    els.changeRequestOverlay.hidden = true;
  }
  const resolve = state.changeRequestDialogResolve;
  state.changeRequestDialogResolve = null;
  if (resolve) resolve(value);
}

function updateChangeRequestDialogState() {
  if (!els.changeRequestConfirmButton) return;

  const hasComment = Boolean(els.changeRequestComment.value.trim());
  els.changeRequestConfirmButton.disabled = !hasComment;
  if (hasComment) {
    els.changeRequestMessage.textContent = "";
  }
}

function confirmChangeRequestDialog() {
  const comment = els.changeRequestComment.value.trim();
  if (!comment) {
    els.changeRequestMessage.textContent = translateUiText("Änderungen an freigegebenen Requirements benötigen einen Kommentar.");
    updateChangeRequestDialogState();
    return;
  }

  closeChangeRequestDialog(comment);
}

function addProductChangeRequestComment(selection, text, changeType = "Änderung") {
  if (!selection || !text) return;

  selection.comments = productApprovalComments(selection);
  selection.comments.push({
    id: crypto.randomUUID(),
    type: "change-request",
    changeType,
    text,
    authorId: state.currentUser?.id || "",
    authorName: currentApprovalUserName(),
    createdAt: new Date().toISOString(),
    resolved: false,
    replies: [],
  });
}

function productChangeHistoryReason(reason, changeComment) {
  const normalizedComment = String(changeComment || "").trim();
  return normalizedComment ? `${reason}: ${normalizedComment}` : reason;
}

function handleProductReviewTechTypeFilterChange(event) {
  if (event.target === els.productReviewTechTypeSearch) {
    state.productReviewTechTypeSearch = event.target.value || "";
  } else {
    state.productReviewTechTypeFilter = event.target.value || "all";
  }
  applyProductReviewTechTypeFilter();
}

function applyProductReviewTechTypeFilter() {
  const search = state.productReviewTechTypeSearch.trim().toLowerCase();
  const filter = state.productReviewTechTypeFilter;
  els.techTypeSelectionList.querySelectorAll("[data-techtype-designation]").forEach((input) => {
    const label = input.closest("label");
    const text = String(input.dataset.techtypeDesignation || "").toLowerCase();
    const matchesSearch = !search || text.includes(search);
    const matchesFilter =
      filter === "all" ||
      (filter === "selected" && input.checked) ||
      (filter === "unselected" && !input.checked);
    if (label) label.hidden = !matchesSearch || !matchesFilter;
  });
}

function clearTechTypesForActiveRequirement() {
  if (!canModifyProductRequirements()) return;

  els.techTypeSelectionList.querySelectorAll("input[type='checkbox']").forEach((input) => {
    input.checked = false;
    input.indeterminate = false;
  });
  syncTechTypeGroupCheckboxes();
  renderTechTypeSummary(0);
  void persistActiveRequirementTechTypes();
}

function resetTechTypesForActiveRequirement() {
  if (!canModifyProductRequirements()) return;

  const selected = new Set(allTechTypeDesignations());
  els.techTypeSelectionList.querySelectorAll("[data-techtype-designation]").forEach((input) => {
    input.checked = selected.has(input.dataset.techtypeDesignation);
  });
  syncTechTypeGroupCheckboxes();
  renderTechTypeSummary(selected.size);
  void persistActiveRequirementTechTypes();
}

function canReviseProductApprovalRequirement(rowNumber = state.activeSelectionRow) {
  if (!isProductApprovalStarted()) return false;
  if (!state.finalSelections.has(Number(rowNumber))) return false;
  if (state.productWindchillTransferComplete) return canEditProductRequirements();
  return canEditProductRequirements() || Boolean(currentProductApproverSlotId());
}

async function saveProductApprovalText() {
  await savePendingProductApprovalTextChange();
}

async function savePendingProductApprovalTextChange() {
  const rowNumber = Number(state.activeSelectionRow);
  const selection = state.finalSelections.get(rowNumber);
  if (!selection || !canReviseProductApprovalRequirement(rowNumber)) return { ok: false, changed: false };

  const nextText = els.productApprovalFinalText.value.trim();
  if (!nextText) {
    alert("Der Requirement-Text darf nicht leer sein.");
    return { ok: false, changed: false };
  }
  if (nextText === selection.text) return { ok: true, changed: false };

  const updatedSelection = await applyProductApprovalTextChange(rowNumber, nextText, {
    choice: "manual",
    selectedSource: "MANUAL_EDIT",
    historyReason: "Approval-Änderung",
    revisionAction: "PR-Text im Approval geaendert",
  });
  if (!updatedSelection) return { ok: false, changed: false };
  return { ok: true, changed: true };
}

async function applyProductApprovalTextChange(rowNumber, nextText, options = {}) {
  const item = state.requirements.find((requirement) => Number(requirement.rowNumber) === Number(rowNumber));
  const selection = state.finalSelections.get(Number(rowNumber));
  if (!item || !selection) return null;

  const changeComment = await requestApprovedProductRequirementChangeComment(
    rowNumber,
    options.historyReason || "Approval-Änderung",
  );
  if (changeComment === null) return null;

  selection.text = nextText;
  selection.choice = options.choice || selection.choice || "manual";
  selection.selectedSource = options.selectedSource || selection.selectedSource || "MANUAL_EDIT";
  selection.needsFinalAssessment = true;
  selection.finalizedAt = "";
  addProductReviewHistory(
    selection,
    productChangeHistoryReason(options.historyReason || "Approval-Änderung", changeComment),
    nextText,
  );
  invalidateProductRequirementAfterChange(rowNumber);
  setProjectRevisionAction(projectRevisionActionFor(options.revisionAction || "PR im Approval geaendert", item, "PR"));
  renderTable();
  renderProductApprovalPanel();
  renderMetrics();
  updateProjectActions();
  await recalculateFinalScore(item, nextText, selection.choice || "manual");
  const updatedSelection = state.finalSelections.get(Number(rowNumber));
  if (updatedSelection) {
    addProductReviewHistory(updatedSelection, "Score neu berechnet", updatedSelection.text);
  }
  renderProductApprovalPanel();
  updateProjectActions();
  return updatedSelection;
}

async function improveProductApprovalRequirementWithAi() {
  const rowNumber = Number(state.activeSelectionRow);
  if (!canReviseProductApprovalRequirement(rowNumber)) return;

  const endpoint = getAnalyzeEndpoint();
  if (!endpoint) {
    alert("Bitte starte den lokalen Server und öffne die App über http://localhost:3000.");
    return;
  }

  const item = state.requirements.find((requirement) => Number(requirement.rowNumber) === Number(rowNumber));
  const result = state.results.find((entry) => Number(entry.rowNumber) === Number(rowNumber));
  const instruction = els.productApprovalImprovementInstruction.value.trim();
  const currentText = els.productApprovalFinalText.value.trim();
  if (!item || !currentText || !instruction) {
    alert("Bitte beschreibe, was die AI am Product Requirement verbessern soll.");
    return;
  }

  const previousStatus = els.productApprovalImproveButton.textContent;
  els.productApprovalImproveButton.disabled = true;
  els.productApprovalSaveTextButton.disabled = true;
  els.productApprovalImproveButton.textContent = "AI verbessert...";

  try {
    const improvementAttachments = await readImprovementAttachments(els.productApprovalImprovementAttachments);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requirementType: "product-improvement",
        uiLanguage: selectedUiLanguage(),
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
    const improvedText = improved?.rewrittenRequirement || improved?.text || "";
    if (!improvedText) return;

    upsertResult({
      ...improved,
      rowNumber,
      id: item.id || improved.id || "",
      rewrittenRequirement: improvedText,
      originalScore: result?.originalScore ?? improved.originalScore ?? improved.score,
      originalIssues: result?.originalIssues || improved.originalIssues || [],
    });
    els.productApprovalFinalText.value = improvedText;
    els.productApprovalImprovementInstruction.value = "";
    els.productApprovalImprovementAttachments.value = "";
    renderImprovementAttachmentList(
      els.productApprovalImprovementAttachments,
      els.productApprovalImprovementAttachmentList,
    );
    await applyProductApprovalTextChange(rowNumber, improvedText, {
      choice: "ai",
      selectedSource: "AI_ASSISTED_EDIT",
      historyReason: "AI-unterstützte Approval-Änderung",
      revisionAction: "AI-Vorschlag fuer PR im Approval erstellt",
    });
  } catch (error) {
    alert(error.message);
  } finally {
    els.productApprovalImproveButton.disabled = !canReviseProductApprovalRequirement(rowNumber);
    els.productApprovalSaveTextButton.disabled = !canReviseProductApprovalRequirement(rowNumber);
    els.productApprovalImproveButton.textContent = previousStatus;
  }
}

function canDisapproveProductRequirement(rowNumber) {
  if (!isProductApprovalStarted() || !canApproveProductRequirements()) return false;
  return Boolean(currentProductApproverSlotId()) && Boolean(state.finalSelections.get(Number(rowNumber)));
}

function disapproveProductRequirement() {
  const rowNumber = Number(state.activeSelectionRow);
  const selection = state.finalSelections.get(rowNumber);
  if (!selection || !canDisapproveProductRequirement(rowNumber)) return;

  const text = els.productApprovalDisapproveComment.value.trim();
  if (!text) {
    alert("Disapprove benötigt einen Pflichtkommentar.");
    return;
  }

  selection.approvals = productApprovalRecords(selection).filter(
    (approval) => String(approval.userId || "") !== String(currentProductApproverSlotId()),
  );
  selection.approvedAt = "";
  selection.approvedBy = "";
  selection.comments = productApprovalComments(selection);
  selection.comments.push({
    id: crypto.randomUUID(),
    type: "disapproval",
    text,
    authorId: state.currentUser?.id || "",
    authorName: currentApprovalUserName(),
    createdAt: new Date().toISOString(),
    resolved: false,
    replies: [],
  });
  els.productApprovalDisapproveComment.value = "";
  state.productApprovalDecisionMode = "";
  setProjectRevisionAction("PR disapproved");
  renderTable();
  renderProductApprovalPanel();
  renderMetrics();
  updateProjectActions();
  closeProductRequirementDetailDialog();
}

function handleProductApprovalCommentClick(event) {
  const replyButton = event.target.closest("[data-comment-reply]");
  const resolveButton = event.target.closest("[data-comment-resolve]");
  if (!replyButton && !resolveButton) return;

  const rowNumber = Number(state.activeSelectionRow);
  const selection = state.finalSelections.get(rowNumber);
  if (!selection) return;

  if (replyButton) {
    event.preventDefault();
    const comment = productApprovalComments(selection).find((item) => item.id === replyButton.dataset.commentReply);
    if (!comment || !canEditProductRequirements()) return;
    const input = replyButton.closest(".approval-comment")?.querySelector("[data-comment-reply-text]");
    const text = input?.value.trim() || "";
    if (!text) {
      input?.focus();
      return;
    }
    comment.replies = Array.isArray(comment.replies) ? comment.replies : [];
    comment.replies.push({
      text,
      authorId: state.currentUser?.id || "",
      authorName: currentApprovalUserName(),
      createdAt: new Date().toISOString(),
    });
    comment.resolved = true;
    comment.resolvedAt = new Date().toISOString();
    comment.resolvedBy = currentApprovalUserName();
    updateFinalProductApproval(selection);
    setProjectRevisionAction("PR-Approval-Kommentar beantwortet");
  }

  if (resolveButton) {
    const comment = productApprovalComments(selection).find((item) => item.id === resolveButton.dataset.commentResolve);
    if (!comment || !canResolveProductApprovalComment(comment)) return;
    comment.resolved = true;
    comment.resolvedAt = new Date().toISOString();
    comment.resolvedBy = currentApprovalUserName();
    updateFinalProductApproval(selection);
    setProjectRevisionAction("PR-Approval-Kommentar geloest");
  }

  renderProductApprovalPanel();
  renderTable();
  renderMetrics();
  updateProjectActions();
}

function renderProductApprovalComments(selection) {
  const comments = productApprovalComments(selection);
  if (!comments.length) return `<p class="muted-cell">${escapeHtml(translateUiText("Keine Kommentare vorhanden."))}</p>`;

  return comments
    .map((comment) => `
      <article class="approval-comment ${comment.resolved ? "is-resolved" : ""}" data-comment-id="${escapeHtml(comment.id)}">
        <div>
          <strong>${escapeHtml(comment.authorName || "Approver")}</strong>
          <small>${escapeHtml(new Date(comment.createdAt || Date.now()).toLocaleString())}</small>
        </div>
        <span class="approver-chip">${escapeHtml(translateUiText(productApprovalCommentTypeLabel(comment)))}</span>
        <p>${escapeHtml(comment.text || "")}</p>
        ${(Array.isArray(comment.replies) ? comment.replies : [])
          .map((reply) => `
            <div class="approval-reply">
              <strong>${escapeHtml(reply.authorName || "Owner")}</strong>
              <small>${escapeHtml(new Date(reply.createdAt || Date.now()).toLocaleString())}</small>
              <p>${escapeHtml(reply.text || "")}</p>
            </div>
          `)
          .join("")}
        ${isActionableProductApprovalComment(comment) && comment.resolved ? `<span class="approver-chip">${escapeHtml(translateUiText("Gelöst"))}</span>` : ""}
        ${isActionableProductApprovalComment(comment) && canEditProductRequirements() && !comment.resolved ? `
          <textarea data-comment-reply-text="${escapeHtml(comment.id)}" rows="2" placeholder="${escapeHtml(translateUiText("Antwort des Owners"))}"></textarea>
          <button type="button" data-comment-reply="${escapeHtml(comment.id)}">${escapeHtml(translateUiText("Antworten"))}</button>
        ` : ""}
        ${isActionableProductApprovalComment(comment) && canResolveProductApprovalComment(comment) && !comment.resolved ? `
          <button type="button" data-comment-resolve="${escapeHtml(comment.id)}">${escapeHtml(translateUiText("Kommentar lösen"))}</button>
        ` : ""}
      </article>
    `)
    .join("");
}

function productApprovalCommentTypeLabel(comment) {
  if (comment?.type === "change-request") return "Change Request";
  if (comment?.type === "disapproval") return "Ablehnung";
  return "Kommentar";
}

function isActionableProductApprovalComment(comment) {
  return comment?.type === "disapproval";
}

function canResolveProductApprovalComment(comment) {
  if (!comment || comment.resolved) return false;
  return String(comment.authorId || "") === String(state.currentUser?.id || "");
}

function renderProductApprovalApprovals(selection) {
  const requiredApproverIds = getRequiredProductApproverIds();
  if (!requiredApproverIds.length) return `<p class="muted-cell">${escapeHtml(translateUiText("Keine PR Approver ausgewählt"))}</p>`;

  const approvals = productApprovalRecords(selection);
  return `
    <div class="approval-status-list">
      ${requiredApproverIds
        .map((approverId) => {
          const approver = productApprovalApproverById(approverId);
          const approval = approvals.find((item) => String(item.userId || "") === String(approverId));
          const hasApproved = Boolean(approval?.approvedAt);
          const label = translateUiText(hasApproved ? "Freigegeben" : "Ausstehend");
          return `
            <article class="approval-status-item">
              <div>
                <strong>${escapeHtml(approver?.name || approver?.email || approverId)}</strong>
                <small>${hasApproved ? escapeHtml(new Date(approval.approvedAt).toLocaleString()) : escapeHtml(translateUiText("Entscheidung ausstehend"))}</small>
              </div>
              <span class="status-badge ${hasApproved ? "approved" : "pending"}">${escapeHtml(label)}</span>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function productApprovalApproverById(approverId) {
  return state.productApprovers.find((user) => String(user.id || "") === String(approverId || ""));
}

function renderProductApprovalHistory(selection) {
  const versions = productApprovalVersions(selection);
  if (!versions.length) return `<p class="muted-cell">${escapeHtml(translateUiText("Keine Historie vorhanden."))}</p>`;

  return versions
    .slice()
    .reverse()
    .map((version) => `
      <article class="approval-history-entry">
        <strong>Version ${Number(version.version) || "-"}</strong>
        <small>${escapeHtml(version.changedBy || "-")} · ${escapeHtml(new Date(version.changedAt || Date.now()).toLocaleString())}</small>
        <p>${escapeHtml(version.reason || "")}</p>
      </article>
    `)
    .join("");
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
  const canEditProduct = canModifyProductRequirements();
  els.selectAllTechTypesButton.disabled = !canEditProduct;
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
              <input type="checkbox" data-techtype-group="${escapeHtml(group.valueClass)}" ${groupChecked ? "checked" : ""} ${canEditProduct ? "" : "disabled"} />
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
                    <input type="checkbox" data-techtype-designation="${escapeHtml(item.designation)}" data-techtype-designation-group="${escapeHtml(item.valueClass)}" ${selected.has(item.designation) ? "checked" : ""} ${canEditProduct ? "" : "disabled"} />
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

function arraysHaveSameValues(first = [], second = []) {
  if (first.length !== second.length) return false;

  const normalizedFirst = [...first].map(String).sort();
  const normalizedSecond = [...second].map(String).sort();
  return normalizedFirst.every((value, index) => value === normalizedSecond[index]);
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
  void persistActiveRequirementTechTypes();
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
  if (!canModifyProductRequirements()) {
    alert(productApprovalLockedMessage());
    return;
  }

  els.techTypeSelectionList.querySelectorAll("input[type='checkbox']").forEach((input) => {
    input.checked = true;
    input.indeterminate = false;
  });
  syncTechTypeGroupCheckboxes();
  renderTechTypeSummary(state.techTypes.length);
  void persistActiveRequirementTechTypes();
}

async function persistActiveRequirementTechTypes() {
  if (!canModifyProductRequirements()) return;

  const rowNumber = state.activeSelectionRow;
  if (!rowNumber) return;

  const item = state.requirements.find((requirement) => Number(requirement.rowNumber) === Number(rowNumber));
  if (!item) return;

  const techTypes = currentTechTypeSelection();
  const selection = state.finalSelections.get(Number(rowNumber));
  if (!selection) return;
  const previousTechTypes = selectedTechTypesForRequirement(item, selection);
  if (arraysHaveSameValues(previousTechTypes, techTypes)) return;

  const changeComment = await requestApprovedProductRequirementChangeComment(rowNumber, "TechType-Änderung");
  if (changeComment === null) {
    renderProductApprovalPanel();
    return;
  }

  item.techTypes = techTypes;
  selection.techTypes = techTypes;
  selection.finalizedAt = "";
  addProductReviewHistory(
    selection,
    productChangeHistoryReason("TechType-Änderung", changeComment),
    `${techTypes.length} TechTypes ausgewählt`,
  );
  invalidateProductRequirementAfterChange(rowNumber);
  updateExportAvailability();
  setProjectRevisionAction(projectRevisionActionFor("TechTypes fuer PR geaendert", item, "PR"));
  renderProductApprovalPanel();
  updateProjectActions();
}

async function excludeRequirement() {
  if (!canModifyProductRequirements()) {
    alert(productApprovalLockedMessage());
    return;
  }

  const rowNumber = state.activeSelectionRow;
  if (!rowNumber) return;

  const item = state.requirements.find((requirement) => Number(requirement.rowNumber) === Number(rowNumber));
  const exclusionReason = prompt("Bitte gib einen Ausschlussgrund an.");
  if (!exclusionReason || !exclusionReason.trim()) {
    alert("Ausgeschlossene Requirements benötigen einen Ausschlussgrund.");
    return;
  }
  const changeComment = await requestApprovedProductRequirementChangeComment(rowNumber, "Requirement ausgeschlossen");
  if (changeComment === null) return;
  state.finalSelections.set(Number(rowNumber), {
    choice: "excluded",
    selectedSource: "EXCLUDED",
    text: "",
    excluded: true,
    exclusionReason: exclusionReason.trim(),
    finalizedAt: new Date().toISOString(),
    approvedAt: "",
    approvedBy: "",
    approvals: [],
    versions: [
      {
        version: 1,
        text: exclusionReason.trim(),
        changedAt: new Date().toISOString(),
        changedBy: currentApprovalUserName(),
        reason: productChangeHistoryReason("Requirement ausgeschlossen", changeComment),
      },
    ],
    comments: state.finalSelections.get(Number(rowNumber))?.comments || [],
  });
  invalidateProductRequirementAfterChange(rowNumber);
  closeSelectionDialog();
  renderTable();
  renderProductApprovalPanel();
  renderMetrics();
  renderSoftwarePage();
  updateExportAvailability();
  setProjectRevisionAction(projectRevisionActionFor("PR ausgeschlossen", item, "PR"));
  updateProjectActions();
}

async function improveProductRequirementWithAi() {
  if (!canModifyProductRequirements()) {
    alert(productApprovalLockedMessage());
    return;
  }

  const endpoint = getAnalyzeEndpoint();
  if (!endpoint) {
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
  const previousVisibleScore = result ? productVisibleScore(
    result,
    state.finalSelections.get(Number(rowNumber)),
    state.finalScoreUpdates.has(Number(rowNumber)),
  ) : null;
  const previousStatus = els.prImproveButton.textContent;
  els.prImproveButton.disabled = true;
  els.selectAiButton.disabled = true;
  els.prImproveButton.textContent = "AI verbessert...";

  try {
    const improvementAttachments = await readImprovementAttachments(els.prImprovementAttachments);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requirementType: "product-improvement",
        uiLanguage: selectedUiLanguage(),
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

    const improvedText = improved.rewrittenRequirement || currentText;
    const selection = ensureActiveProductSelection("ai");
    const changeComment = await requestApprovedProductRequirementChangeComment(rowNumber, "AI-unterstützte Änderung");
    if (changeComment === null) return;

    upsertResult({
      ...improved,
      rowNumber: Number(rowNumber),
      id: item.id || improved.id || "",
      originalScore: result?.originalScore ?? improved.originalScore ?? improved.score,
      originalIssues: result?.originalIssues || improved.originalIssues || [],
    });
    els.selectionAiText.textContent = improved.rewrittenRequirement || currentText;
    els.selectionScore.textContent = Number.isFinite(Number(previousVisibleScore))
      ? String(previousVisibleScore)
      : String(displayProductScore(improved, state.finalSelections.get(Number(rowNumber))) ?? "-");
    els.selectionIssues.innerHTML = renderIssues(displayProductIssues(improved, state.finalSelections.get(Number(rowNumber))));
    if (selection) {
      selection.choice = "ai";
      selection.selectedSource = "AI_ASSISTED_EDIT";
      selection.text = improvedText;
      selection.previousScore = previousVisibleScore;
      selection.needsFinalAssessment = true;
      selection.finalizedAt = "";
      addProductReviewHistory(
        selection,
        productChangeHistoryReason("AI-unterstützte Änderung", changeComment),
        selection.text,
      );
      invalidateProductRequirementAfterChange(rowNumber);
    }
  els.selectAiButton.disabled = false;
  els.prImprovementInstruction.value = "";
  els.prImprovementAttachments.value = "";
  renderImprovementAttachmentList(els.prImprovementAttachments, els.prImprovementAttachmentList);
  renderTable();
    renderProductApprovalPanel();
    renderMetrics();
    setProjectRevisionAction(projectRevisionActionFor("AI-Vorschlag fuer PR erstellt", item, "PR"));
    updateProjectActions();
  } catch (error) {
    alert(error.message);
  } finally {
    els.prImproveButton.disabled = false;
    els.selectAiButton.disabled = !state.results.find((entry) => Number(entry.rowNumber) === Number(rowNumber))?.rewrittenRequirement;
    els.prImproveButton.textContent = previousStatus;
  }
}

async function selectFinalText(choice) {
  if (!canModifyProductRequirements()) {
    alert(productApprovalLockedMessage());
    return;
  }

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

  const previousSelection = state.finalSelections.get(Number(rowNumber));
  const changeComment = await requestApprovedProductRequirementChangeComment(
    rowNumber,
    choice === "ai" ? "AI-Vorschlag verwendet" : "Original verwendet",
  );
  if (changeComment === null) return;
  const existingComments = previousSelection ? productApprovalComments(previousSelection) : [];

  state.finalSelections.set(Number(rowNumber), {
    choice,
    selectedSource: choice === "ai" ? "AI_PROPOSAL" : "ORIGINAL",
    text,
    techTypes: currentTechTypeSelection(),
    previousScore: result ? productVisibleScore(
      result,
      state.finalSelections.get(Number(rowNumber)),
      state.finalScoreUpdates.has(Number(rowNumber)),
    ) : null,
    needsFinalAssessment: true,
    finalizedAt: "",
    approvedAt: "",
    approvedBy: "",
    approvals: [],
    comments: existingComments,
    versions: [
      {
        version: 1,
        text,
        changedAt: new Date().toISOString(),
        changedBy: currentApprovalUserName(),
        reason: productChangeHistoryReason(
          choice === "ai" ? "AI-Vorschlag verwendet" : "Original verwendet",
          changeComment,
        ),
      },
    ],
  });
  invalidateProductRequirementAfterChange(rowNumber, { clearApproval: false });

  if (choice === "ai") {
    const previousLabel = els.selectAiButton.textContent;
    els.selectAiButton.disabled = true;
    els.selectAiButton.textContent = "Score wird berechnet...";
    addProductReviewHistory(state.finalSelections.get(Number(rowNumber)), "Score-Neuberechnung gestartet", text);
    const recalculatedScore = await recalculateFinalScore(item, text, choice);
    const updatedSelection = state.finalSelections.get(Number(rowNumber));
    if (updatedSelection && Number.isFinite(Number(recalculatedScore))) {
      addProductReviewHistory(updatedSelection, "Score und Findings neu berechnet", updatedSelection.text);
    }
    els.selectAiButton.textContent = previousLabel;
  }

  closeSelectionDialog();
  renderTable();
  renderProductApprovalPanel();
  renderMetrics();
  renderSoftwarePage();
  updateExportAvailability();
  setProjectRevisionAction(
    projectRevisionActionFor(choice === "ai" ? "AI-Vorschlag uebernommen" : "Original uebernommen", item, "PR"),
  );
  updateProjectActions();
}

function canApproveProductRequirement(rowNumber) {
  if (!canApproveProductRequirements() || !isProductApprovalStarted()) return false;

  const selection = state.finalSelections.get(Number(rowNumber));
  const approverSlotId = currentProductApproverSlotId();
  if (!selection || selection.needsFinalAssessment || !approverSlotId) return false;
  if (hasProductApprovalFrom(selection, approverSlotId)) return false;
  if (countOpenDisapprovalComments(selection) > 0) return false;
  if (selection.choice !== "excluded" && isProductQualityGateBlockingScore(displayProductScore(
    state.results.find((entry) => Number(entry.rowNumber) === Number(rowNumber)),
    selection,
  ))) {
    return false;
  }

  return true;
}

function productApprovalButtonText(rowNumber) {
  const selection = state.finalSelections.get(Number(rowNumber));
  const approverSlotId = currentProductApproverSlotId();
  if (selection && approverSlotId && hasProductApprovalFrom(selection, approverSlotId)) return "PR-Freigabe erfasst";
  if (selection && isProductSelectionApproved(selection)) return "PR freigegeben";
  return "PR freigeben";
}

function isProductSelectionApproved(selection) {
  if (!selection || countOpenDisapprovalComments(selection) > 0) return false;
  if (isProductSelectionFullyApproved(selection)) return true;
  return Boolean(selection.approvedAt);
}

function isProductSelectionFullyApproved(selection) {
  const requiredApproverIds = getRequiredProductApproverIds();
  return (
    requiredApproverIds.length > 0 &&
    countOpenDisapprovalComments(selection) === 0 &&
    requiredApproverIds.every((approverId) => hasProductApprovalFrom(selection, approverId))
  );
}

function approveProductRequirement(rowNumber = state.activeSelectionRow) {
  if (!canApproveProductRequirement(rowNumber)) {
    alert("Nur die konfigurierten PR Approver können abgeschlossene Product Requirements freigeben.");
    return false;
  }

  const selection = state.finalSelections.get(Number(rowNumber));
  const approverSlotId = currentProductApproverSlotId();
  selection.approvals = productApprovalRecords(selection).filter((approval) => String(approval.userId || "") !== String(approverSlotId));
  selection.approvals.push({
    userId: approverSlotId,
    name: currentApprovalUserName(),
    approvedAt: new Date().toISOString(),
  });
  updateFinalProductApproval(selection);
  if (isProductSelectionApproved(selection)) {
    state.changedProductRequirementRows.delete(Number(rowNumber));
  }
  renderTable();
  renderMetrics();
  renderProductApprovalPanel();
  updateExportAvailability();
  const item = state.requirements.find((requirement) => Number(requirement.rowNumber) === Number(rowNumber));
  setProjectRevisionAction(projectRevisionActionFor("PR freigegeben", item, "PR"));
  updateProjectActions();
  return true;
}

function clearApproval(selection) {
  if (!selection) return;
  selection.approvedAt = "";
  selection.approvedBy = "";
  selection.approvals = [];
}

function updateFinalProductApproval(selection) {
  if (!selection) return;
  if (isProductSelectionFullyApproved(selection)) {
    selection.approvedAt = new Date().toISOString();
    selection.approvedBy = "Alle konfigurierten PR Approver";
    return;
  }

  selection.approvedAt = "";
  selection.approvedBy = "";
}

function approvalLabel(baseLabel, selection) {
  const approvedAt = selection?.approvedAt ? new Date(selection.approvedAt).toLocaleString() : "";
  const approvedBy = selection?.approvedBy || "";
  if (approvedAt && approvedBy) return `${baseLabel} von ${approvedBy} am ${approvedAt}`;
  if (approvedAt) return `${baseLabel} am ${approvedAt}`;
  return baseLabel;
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
    if (isProductSelectionFullyApproved(selection)) {
      return {
        className: "approved",
        icon: "&#10003;",
        label: productApprovalStatusLabel("Requirement ausgeschlossen und freigegeben", selection),
      };
    }

    return {
      className: "excluded",
      icon: "×",
      label: "Requirement ausgeschlossen - Freigabe offen",
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

  if (!isProductSelectionFullyApproved(selection)) {
    if (!isProductApprovalStarted()) {
      return {
        className: "selected",
        icon: "&#10003;",
        label: "Bereit für Freigabe",
      };
    }

    return {
      className: "pending",
      icon: "?",
      label: productApprovalStatusLabel("Requirement wartet auf Freigabe", selection),
    };
  }

  return {
    className: "approved",
    icon: "&#10003;",
    label: productApprovalStatusLabel("Requirement freigegeben", selection),
  };
}

function productApprovalStatusLabel(baseLabel, selection) {
  const requiredCount = getRequiredProductApproverIds().length;
  if (!requiredCount) return baseLabel;

  return `${baseLabel} (${countProductApprovals(selection)}/${requiredCount})`;
}

async function recalculateFinalScore(item, finalText, choice) {
  const endpoint = getAnalyzeEndpoint();
  const rowNumber = Number(item.rowNumber);
  state.finalScoreUpdates.add(rowNumber);
  if (!endpoint) {
    state.finalScoreUpdates.delete(rowNumber);
    updateExportAvailability();
    return null;
  }

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
        uiLanguage: selectedUiLanguage(),
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
      let recalculatedScore = null;
      if (selection) {
        delete selection.needsFinalAssessment;
        delete selection.previousScore;
        recalculatedScore = Number(displayProductScore(updatedResult, selection));
      }
      renderTable();
      renderMetrics();
      return Number.isFinite(recalculatedScore) ? recalculatedScore : null;
    }

  } catch (error) {
    alert(error.message);
    return null;
  } finally {
    state.finalScoreUpdates.delete(rowNumber);
    renderTable();
    renderMetrics();
    updateExportAvailability();
    updateProjectActions();
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
              <span class="severity">${escapeHtml(formatIssueField(issue.severity))} / ${escapeHtml(displayIssueField(issue, "criterion"))}</span><br />
              ${escapeHtml(displayIssueField(issue, "explanation"))}<br />
              ${escapeHtml(displayIssueField(issue, "suggestion"))}
            </li>
          `,
        )
        .join("")}
    </ul>
  `;
}

function formatIssueField(value) {
  return translateUiText(value || "-");
}

function displayIssueField(issue, field) {
  const language = currentLanguage();
  const translated = issue?._translations?.[language]?.[field];
  return formatIssueField(translated || issue?.[field] || "-");
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

  if (!selection || selection.choice === "original") {
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

  if (!isProductSelectionFullyApproved(selection)) {
    return Array.isArray(result.originalIssues) && result.originalIssues.length
      ? result.originalIssues
      : Array.isArray(result.issues)
        ? result.issues
        : [];
  }

  return Array.isArray(result.issues) ? result.issues : [];
}

function renderMetrics() {
  const progress = getProductStepProgress();
  const scores = getIncludedScores();
  const criticalScoreCount = getCriticalScoreRows().size;
  const productReady = isProductReadyForTransferSimulation();

  els.countMetric.textContent = state.analysisComplete
    ? `${progress.assignedCount} / ${state.requirements.length}`
    : String(state.requirements.length);
  els.countMetricLabel.textContent = state.analysisComplete ? "Requirements zugeordnet" : "Requirements";
  els.scoreMetric.textContent = scores.length ? String(progress.averageScore) : "-";
  els.issueMetric.textContent = String(criticalScoreCount);
  els.criticalIssuesButton.disabled = criticalScoreCount === 0;
  els.criticalIssuesButton.classList.toggle("is-active", state.scoreFilterActive);
  els.scoreFilterBar.hidden = !state.scoreFilterActive;
  renderProductAnalyzeState();
  renderProductQualityGate();
  renderProductApprovalState();
  renderProductTransferState(productReady);
  updateWorkflowState();
  renderSoftwarePage();
  renderE2ePage();
}

function renderProductAnalyzeState() {
  if (!els.productActionBar) return;

  const projectOpen = hasProject();
  const canAnalyzeProduct = projectOpen && state.requirements.length > 0 && canModifyProductRequirements() && !state.analysisComplete;
  els.productActionBar.hidden = !projectOpen;
  if (!projectOpen) return;

  els.productAnalyzeAction.classList.toggle("is-complete", state.analysisComplete);
  els.productAnalyzeAction.classList.toggle("is-blocked", !state.analysisComplete && !canAnalyzeProduct);
  els.productAnalyzeStatus.textContent = state.analysisComplete
    ? `${state.results.length}/${state.requirements.length} Requirements analysiert.`
    : state.requirements.length
      ? "Bereit zur Bewertung der importierten Requirements."
      : "Importiere zuerst Product Requirements.";
  els.productAnalyzeAction.title = els.productAnalyzeStatus.textContent;
  els.analyzeProductButton.hidden = false;
  els.analyzeProductButton.textContent = state.analysisComplete ? "Analysiert" : "PR analysieren";
  els.analyzeProductButton.disabled = !canAnalyzeProduct;
}

function renderProductQualityGate() {
  if (!els.productQualityGateCard) return;

  const gate = getProductQualityGate();
  const canEdit = state.analysisComplete && state.requirements.length > 0 && canModifyProductRequirements();
  els.productQualityGateCard.hidden = !hasProject();
  if (els.productQualityGateCard.hidden) return;

  els.productQualityGateCard.classList.toggle("is-passed", gate.status === "PASSED");
  els.productQualityGateCard.classList.toggle("is-blocked", gate.status === "BLOCKED");
  els.productQualityGateCard.classList.toggle("is-not-checked", gate.status === "NOT_CHECKED");
  els.productQualityGateBadge.className = `status-badge ${
    gate.status === "PASSED" ? "approved" : gate.status === "BLOCKED" ? "critical" : "pending"
  }`;
  els.productQualityGateBadge.textContent = gate.status.replace("_", " ");
  els.productEditButton.disabled = !canEdit;
  els.productEditButton.title = canEdit
    ? ""
    : state.analysisComplete
      ? productApprovalLockedMessage()
      : "PR-Bearbeitung ist nach der Analyse verfügbar.";

  if (gate.status === "PASSED") {
    els.productQualityGateTitle.textContent = translateUiText("PR Bearbeitung abgeschlossen");
    els.productQualityGateSummary.textContent = `${gate.readyRequirements}/${gate.totalRequirements - gate.excludedRequirements} ${translateUiText("Requirements bereit mit Score >=")} ${PRODUCT_STEP_MIN_SCORE}`;
    els.productQualityGateDetail.textContent = translateUiText("Approval-Prozess kann gestartet werden.");
    els.productQualityGateCard.title = `${els.productQualityGateSummary.textContent} ${els.productQualityGateDetail.textContent}`;
    els.productEditButton.textContent = translateUiText("PR öffnen");
    return;
  }

  if (gate.status === "BLOCKED") {
    els.productQualityGateTitle.textContent = translateUiText("PR Bearbeitung offen");
    els.productQualityGateSummary.textContent = `${gate.readyRequirements}/${gate.totalRequirements - gate.excludedRequirements} ${translateUiText("Requirements bereit für Freigabe")}`;
    els.productQualityGateDetail.textContent = `${gate.failedScoreRequirements} ${translateUiText("mit Nacharbeit")}, ${gate.missingTechTypeRequirements} ${translateUiText("ohne TechTypes")}. ${translateUiText("Approval-Prozess kann erst gestartet werden, wenn alle nicht ausgeschlossenen Requirements Score >= 85 haben.")}`;
    els.productQualityGateCard.title = `${els.productQualityGateSummary.textContent} ${els.productQualityGateDetail.textContent}`;
    els.productEditButton.textContent = translateUiText("PR bearbeiten");
    return;
  }

  els.productQualityGateTitle.textContent = translateUiText(state.analysisComplete ? "PR Bearbeitung erforderlich" : "PR Bearbeitung wartet");
  els.productQualityGateSummary.textContent = state.analysisComplete
    ? translateUiText("Finale Scores fehlen oder sind für ein oder mehrere Requirements veraltet.")
    : translateUiText("Analyse zuerst ausführen.");
  els.productQualityGateDetail.textContent = state.analysisComplete
    ? `${gate.missingScoreRequirements} ${translateUiText("fehlende Scores")}, ${gate.staleScoreRequirements} ${translateUiText("veraltet oder in Berechnung")}.`
    : translateUiText("Nach der Analyse können finale Requirements, Scores und TechTypes bearbeitet werden.");
  els.productQualityGateCard.title = `${els.productQualityGateSummary.textContent} ${els.productQualityGateDetail.textContent}`;
  els.productEditButton.textContent = translateUiText("PR bearbeiten");
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
  els.generateSoftwareButton.disabled =
    !hasProject() || !canEditSoftwareRequirements() || !isProductStepComplete() || state.finalScoreUpdates.size > 0;

  if (!isProductStepComplete()) {
    els.softwareScoreFilterBar.hidden = true;
    const productStepMessage = isProductReadyForTransferSimulation()
      ? "Starte zuerst die PR-Transfer-Simulation."
      : isProductApprovalPending()
      ? isProductApprovalStarted()
        ? "Gib zuerst die Product Requirements frei."
        : "Starte zuerst den PR-Approval-Prozess."
      : "Schließe Product Requirements ab, um Software Requirements abzuleiten.";
    els.softwareRequirementsBody.innerHTML =
      `<tr><td colspan="5" class="empty">${productStepMessage}</td></tr>`;
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
    if (selection.approvedAt) {
      return {
        className: "approved",
        icon: "&#10003;",
        label: approvalLabel("Software Requirement ausgeschlossen und freigegeben", selection),
      };
    }

    return {
      className: "excluded",
      icon: "×",
      label: "Software Requirement ausgeschlossen - Freigabe offen",
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

  if (!selection.approvedAt) {
    return {
      className: "pending",
      icon: "?",
      label: "Software Requirement wartet auf Freigabe",
    };
  }

  return {
    className: "approved",
    icon: "&#10003;",
    label: approvalLabel("Software Requirement freigegeben", selection),
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
  els.softwareSelectionApproveButton.disabled = !canApproveSoftwareRequirement(item);
  els.softwareSelectionApproveButton.textContent = translateUiText(selection?.approvedAt ? "SR freigegeben" : "SR freigeben");
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
  const item = state.softwareRequirements.find((entry) => String(entry.id || "") === String(softwareId || ""));
  setProjectRevisionAction(projectRevisionActionFor("SR-Auswahl zurueckgestellt", item, "SR"));
  updateProjectActions();
}

function canApproveSoftwareRequirement(item) {
  if (!canApproveSoftwareRequirements() || !item || isSoftwareRequirementImpacted(item)) return false;

  const selection = state.softwareSelections.get(String(item.id || ""));
  if (!selection || selection.approvedAt) return false;
  if (selection.excluded) return true;

  return !isCriticalScore(Number(item.score));
}

function approveSoftwareRequirement() {
  const softwareId = state.activeSoftwareRequirementId;
  const item = state.softwareRequirements.find((entry) => String(entry.id || "") === String(softwareId || ""));
  if (!canApproveSoftwareRequirement(item)) {
    alert("Nur Software Requirement Approver oder Admins können abgeschlossene Software Requirements freigeben.");
    return;
  }

  const selection = state.softwareSelections.get(String(item.id || ""));
  selection.approvedAt = new Date().toISOString();
  selection.approvedBy = currentApprovalUserName();
  closeSoftwareSelectionDialog();
  renderSoftwarePage();
  updateExportAvailability();
  updateWorkflowState();
  setProjectRevisionAction(projectRevisionActionFor("SR freigegeben", item, "SR"));
  updateProjectActions();
}

async function regenerateSoftwareRequirementFromDialog() {
  const endpoint = getAnalyzeEndpoint();
  if (!endpoint) {
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

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requirementType: "software", uiLanguage: selectedUiLanguage(), requirements: [sourceRequirement] }),
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
    setProjectRevisionAction(projectRevisionActionFor("SR neu abgeleitet", activeRequirement, "SR"));
    updateProjectActions();
  } catch (error) {
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

  try {
    const improvementAttachments = await readImprovementAttachments(els.softwareImprovementAttachments);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requirementType: "software-improvement",
        uiLanguage: selectedUiLanguage(),
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
    state.softwareSelections.delete(String(item.id || ""));

    els.softwareSelectionScore.textContent = item.score ?? "-";
    els.softwareSelectionText.value = item.text || "";
    const acceptanceCriteriaLabel = acceptanceCriteriaLabelForSoftwareRequirement(item);
    els.softwareSelectionAcceptanceCriteriaTitle.textContent = acceptanceCriteriaLabel;
    els.softwareSelectionAcceptanceCriteria.innerHTML = renderAcceptanceCriteriaList(item.acceptanceCriteria, acceptanceCriteriaLabel);
    els.softwareSelectionTechTypes.innerHTML = renderReadOnlyTechTypes(item.techTypes);
    els.softwareSelectionIssues.innerHTML = item.issues.length ? renderIssues(item.issues) : "Keine Hinweise vorhanden.";
    els.softwareSelectionApproveButton.disabled = true;
    els.softwareSelectionApproveButton.textContent = translateUiText("SR freigeben");
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
    setProjectRevisionAction(projectRevisionActionFor("AI-Vorschlag fuer SR erstellt", item, "SR"));
    updateProjectActions();
  } catch (error) {
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
        criterion: translateUiText("SR-Qualität"),
        severity: "medium",
        explanation: translateUiText("Der übernommene Software-Requirement-Text erreicht den Mindestscore nicht."),
        suggestion: translateUiText("Präzisiere Systemverhalten, Auslöser, Ergebnis, Testbarkeit und Fehlerbedingungen."),
      },
    ];
  }

  const wasImpacted = isSoftwareRequirementImpacted(item);
  state.softwareSelections.set(String(item.id || ""), {
    text,
    score: updatedScore,
    excluded: false,
    acceptedAt: new Date().toISOString(),
    approvedAt: "",
    approvedBy: "",
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
  setProjectRevisionAction(projectRevisionActionFor("SR uebernommen", item, "SR"));
  updateProjectActions();
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
    approvedAt: "",
    approvedBy: "",
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
  setProjectRevisionAction(projectRevisionActionFor("SR ausgeschlossen", item, "SR"));
  updateProjectActions();
}

function isSoftwareStepComplete() {
  return isSoftwareQualityReady() && state.softwareWindchillTransferComplete;
}

function isSoftwareQualityReady() {
  return isSoftwareReadyForApproval() && state.softwareRequirements.every((item) => {
    const selection = state.softwareSelections.get(String(item.id || ""));
    return Boolean(selection?.approvedAt);
  });
}

function isSoftwareReadyForApproval() {
  if (!state.softwareRequirements.length) return false;

  return state.softwareRequirements.every((item) => {
    if (isSoftwareRequirementImpacted(item)) return false;
    const selection = state.softwareSelections.get(String(item.id || ""));
    if (!selection) return false;
    if (selection.excluded) return true;
    return !isCriticalScore(Number(item.score));
  });
}

function isSoftwareApprovalPending() {
  return isSoftwareReadyForApproval() && !isSoftwareQualityReady();
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
  if (!canEditSoftwareRequirements()) {
    alert("Nur Software Requirement Owner oder Admins können Software Requirements bearbeiten.");
    return;
  }

  const endpoint = getAnalyzeEndpoint();
  if (!endpoint) {
    alert("Bitte starte den lokalen Server und öffne die App über http://localhost:3000.");
    return;
  }

  const requirements = getFinalProductRequirements();
  if (!requirements.length || !isProductStepComplete()) return;

  els.generateSoftwareButton.disabled = true;
  setMenuButtonAvailability(els.generateSoftwareMenuButton, false, "Software Requirements werden abgeleitet");
  await showProgress(requirements.length, { requirements, mode: "sr-derivation", batchSize: ANALYSIS_BATCH_SIZE });

  try {
    const rawSoftwareRequirements = [];
    const totalBatches = Math.ceil(requirements.length / ANALYSIS_BATCH_SIZE);
    let processed = 0;
    const keepExistingE2eTests = state.softwareWindchillTransferComplete && state.e2eTests.length > 0;

    for (let index = 0; index < requirements.length; index += ANALYSIS_BATCH_SIZE) {
      const batchNumber = Math.floor(index / ANALYSIS_BATCH_SIZE) + 1;
      const batch = requirements.slice(index, index + ANALYSIS_BATCH_SIZE);
      updateProgress({
        processed,
        total: requirements.length,
        batchNumber,
        totalBatches,
      });

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirementType: "software", uiLanguage: selectedUiLanguage(), requirements: batch }),
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
    completeProgress(requirements.length);
    setProjectRevisionAction(`Software Requirements abgeleitet: ${state.softwareRequirements.length} SR`);
    updateProjectActions();
  } catch (error) {
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
}

function activateSoftwareScoreFilter() {
  if (!getCriticalSoftwareRequirements().length) return;

  state.softwareScoreFilterActive = true;
  renderSoftwarePage();
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
}

function clearSoftwareScoreFilter() {
  state.softwareScoreFilterActive = false;
  renderSoftwarePage();
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
  els.generateE2eButton.disabled = !hasProject() || !canEditE2eTests() || !isSoftwareStepComplete();

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
          <span class="group-count">${isSoftwareApprovalPending() ? "SR-Freigabe noch erforderlich" : "SR-Transfer-Simulation noch erforderlich"}</span>
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
    if (selection.approvedAt) {
      return {
        className: "approved",
        icon: "&#10003;",
        label: approvalLabel("E2E TestCase ausgeschlossen und freigegeben", selection),
      };
    }

    return {
      className: "excluded",
      icon: "×",
      label: "E2E TestCase ausgeschlossen - Freigabe offen",
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

  if (!selection.approvedAt) {
    return {
      className: "pending",
      icon: "?",
      label: "E2E TestCase wartet auf Freigabe",
    };
  }

  return {
    className: "approved",
    icon: "&#10003;",
    label: approvalLabel("E2E TestCase freigegeben", selection),
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
  els.e2eSelectionApproveButton.disabled = !canApproveE2eTest(item);
  els.e2eSelectionApproveButton.textContent = translateUiText(selection?.approvedAt ? "E2E TestCase freigegeben" : "E2E TestCase freigeben");
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
  const item = state.e2eTests.find((entry) => String(entry.id || "") === String(e2eId || ""));
  setProjectRevisionAction(projectRevisionActionFor("E2E-Auswahl zurueckgestellt", item, "E2E TestCase"));
  updateProjectActions();
}

function canApproveE2eTest(item) {
  if (!canApproveE2eTests() || !item || isE2eTestImpacted(item)) return false;

  const selection = state.e2eSelections.get(String(item.id || ""));
  if (!selection || selection.approvedAt) return false;
  if (selection.excluded) return true;

  return !isCriticalScore(Number(selection.score));
}

function approveE2eTest() {
  const e2eId = state.activeE2eTestId;
  const item = state.e2eTests.find((entry) => String(entry.id || "") === String(e2eId || ""));
  if (!canApproveE2eTest(item)) {
    alert("Nur E2E Test Approver oder Admins können abgeschlossene E2E TestCases freigeben.");
    return;
  }

  const selection = state.e2eSelections.get(String(item.id || ""));
  selection.approvedAt = new Date().toISOString();
  selection.approvedBy = currentApprovalUserName();
  closeE2eSelectionDialog();
  renderE2ePage();
  updateWorkflowState();
  setProjectRevisionAction(projectRevisionActionFor("E2E TestCase freigegeben", item, "E2E TestCase"));
  updateProjectActions();
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

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requirementType: "e2e", uiLanguage: selectedUiLanguage(), requirements: [sourceRequirement] }),
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
    setProjectRevisionAction(projectRevisionActionFor("E2E TestCase neu abgeleitet", activeTest, "E2E TestCase"));
    updateProjectActions();
  } catch (error) {
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

  try {
    const improvementAttachments = await readImprovementAttachments(els.e2eImprovementAttachments);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requirementType: "e2e-improvement",
        uiLanguage: selectedUiLanguage(),
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
    state.e2eSelections.delete(String(item.id || ""));

    els.e2eSelectionScore.textContent = item.score ?? "-";
    els.e2eSelectionText.value = item.description || item.text || "";
    els.e2eSelectionTable.innerHTML = renderE2eTestCaseTable(item);
    els.e2eSelectionTechTypes.innerHTML = renderReadOnlyTechTypes(item.techTypes);
    els.e2eSelectionIssues.innerHTML = item.issues.length ? renderIssues(item.issues) : "Keine Hinweise vorhanden.";
    els.e2eSelectionApproveButton.disabled = true;
    els.e2eSelectionApproveButton.textContent = translateUiText("E2E TestCase freigeben");
    els.e2eImprovementInstruction.value = "";
    els.e2eImprovementAttachments.value = "";
    renderImprovementAttachmentList(els.e2eImprovementAttachments, els.e2eImprovementAttachmentList);
    renderE2ePage();
    updateWorkflowState();
    setProjectRevisionAction(projectRevisionActionFor("AI-Vorschlag fuer E2E TestCase erstellt", item, "E2E TestCase"));
    updateProjectActions();
  } catch (error) {
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
        criterion: translateUiText("E2E-Qualität"),
        severity: "medium",
        explanation: translateUiText("Der übernommene E2E TestCase erreicht den Mindestscore nicht."),
        suggestion: translateUiText("Präzisiere Vorbedingungen, Testschritte, erwartete Ergebnisse und nachvollziehbare Prüfpunkte."),
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
    approvedAt: "",
    approvedBy: "",
  });
  if (wasImpacted && areE2eTestsForSourceDecided(item)) {
    state.changedSoftwareRequirementIds.delete(String(item.sourceId || ""));
  }

  closeE2eSelectionDialog();
  renderE2ePage();
  updateWorkflowState();
  setProjectRevisionAction(projectRevisionActionFor("E2E TestCase uebernommen", item, "E2E TestCase"));
  updateProjectActions();
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
    approvedAt: "",
    approvedBy: "",
  });
  if (wasImpacted && areE2eTestsForSourceDecided(item)) {
    state.changedSoftwareRequirementIds.delete(String(item.sourceId || ""));
  }

  closeE2eSelectionDialog();
  renderE2ePage();
  updateWorkflowState();
  setProjectRevisionAction(projectRevisionActionFor("E2E TestCase ausgeschlossen", item, "E2E TestCase"));
  updateProjectActions();
}

function isE2eQualityReady() {
  if (!state.e2eTests.length) return false;

  return state.e2eTests.every((item) => {
    if (isE2eTestImpacted(item)) return false;
    const selection = state.e2eSelections.get(String(item.id || ""));
    if (!selection) return false;
    if (selection.excluded) return Boolean(selection.approvedAt);
    return !isCriticalScore(Number(selection.score)) && Boolean(selection.approvedAt);
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
  if (!canEditE2eTests()) {
    alert("Nur E2E Test Owner oder Admins können E2E TestCases bearbeiten.");
    return;
  }

  const endpoint = getAnalyzeEndpoint();
  if (!endpoint) {
    alert("Bitte starte den lokalen Server und öffne die App über http://localhost:3000.");
    return;
  }

  const requirements = getFinalSoftwareRequirements();
  if (!requirements.length || !isSoftwareStepComplete()) return;

  els.generateE2eButton.disabled = true;
  setMenuButtonAvailability(els.generateE2eMenuButton, false, "E2E TestCases werden abgeleitet");
  await showProgress(requirements.length, { requirements, mode: "e2e-derivation", batchSize: ANALYSIS_BATCH_SIZE });

  try {
    const rawE2eTests = [];
    const totalBatches = Math.ceil(requirements.length / ANALYSIS_BATCH_SIZE);
    let processed = 0;

    for (let index = 0; index < requirements.length; index += ANALYSIS_BATCH_SIZE) {
      const batchNumber = Math.floor(index / ANALYSIS_BATCH_SIZE) + 1;
      const batch = requirements.slice(index, index + ANALYSIS_BATCH_SIZE);
      updateProgress({
        processed,
        total: requirements.length,
        batchNumber,
        totalBatches,
      });

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirementType: "e2e", uiLanguage: selectedUiLanguage(), requirements: batch }),
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
    completeProgress(requirements.length);
    setProjectRevisionAction(`E2E TestCases abgeleitet: ${state.e2eTests.length} TestCases`);
    updateProjectActions();
  } catch (error) {
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
}

function clearE2eScoreFilter() {
  state.e2eScoreFilterActive = false;
  renderE2ePage();
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
      .filter((result) => isCriticalScore(Number(productVisibleScore(
        result,
        state.finalSelections.get(Number(result.rowNumber)),
        state.finalScoreUpdates.has(Number(result.rowNumber)),
      ))))
      .map((result) => Number(result.rowNumber)),
  );
}

function isCriticalScore(score) {
  return Number.isFinite(score) && score < PRODUCT_STEP_MIN_SCORE;
}

function markProductRequirementChanged(rowNumber) {
  const normalizedRowNumber = Number(rowNumber);
  if (!Number.isFinite(normalizedRowNumber)) return;

  state.changedProductRequirementRows.add(normalizedRowNumber);
  state.productTransferChangeRows.add(normalizedRowNumber);
  clearReDerivedE2eFlagsForProductRow(normalizedRowNumber);
  state.productWindchillTransferComplete = false;
  state.productWindchillTransferredAt = "";
  updateWorkflowState();
}

function invalidateProductRequirementAfterChange(rowNumber, options = {}) {
  const normalizedRowNumber = Number(rowNumber);
  if (!Number.isFinite(normalizedRowNumber)) return;

  const selection = state.finalSelections.get(normalizedRowNumber);
  if (options.clearApproval !== false) {
    clearApproval(selection);
  }

  if (isProductApprovalStarted() || state.productWindchillTransferComplete || state.productTransferChangeRows.size) {
    markProductRequirementChanged(normalizedRowNumber);
  }

  if (!state.productWindchillTransferComplete && !state.productTransferChangeRows.size) {
    state.softwareRequirements = [];
    state.softwareSelections = new Map();
    state.e2eTests = [];
    state.e2eSelections = new Map();
    resetProductWindchillTransfer();
    resetSoftwareWindchillTransfer();
  } else {
    resetSoftwareWindchillTransfer();
  }
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
  const canTransferProduct =
    hasProject() &&
    state.activeProcessStep === "product" &&
    isProductReadyForTransferSimulation() &&
    !isProductApprovalPending() &&
    canEditProductRequirements();
  const canTransferSoftware =
    hasProject() && state.activeProcessStep === "software" && isSoftwareQualityReady() && canEditSoftwareRequirements();

  if (state.activeProcessStep === "software") {
    setMenuButtonAvailability(
      els.exportButton,
      canTransferSoftware && !state.softwareWindchillTransferComplete,
      state.softwareWindchillTransferComplete
        ? "Simulation abgeschlossen"
        : canTransferSoftware
          ? "SR würde übertragen werden"
          : isSoftwareApprovalPending()
            ? "SR-Freigabe ist vor der Transfer-Simulation erforderlich"
          : canEditSoftwareRequirements()
            ? "SR-Transfer-Simulation ist nach abgeschlossener SR-Übernahme verfügbar"
            : "Nur Software Requirement Owner oder Admins können die Transfer-Simulation starten",
    );
    updateWorkflowState();
    return;
  }

  setMenuButtonAvailability(
    els.exportButton,
    canTransferProduct && !state.productWindchillTransferComplete,
    state.productWindchillTransferComplete
      ? "Simulation abgeschlossen"
      : canTransferProduct
        ? "PR würde nach Windchill übertragen"
        : isProductApprovalPending()
          ? "PR-Freigabe ist vor der Transfer-Simulation erforderlich"
        : canEditProductRequirements()
          ? "Transfer-Simulation ist nach abgeschlossener PR-Finalisierung verfügbar"
          : "Nur Product Requirement Owner oder Admins können die Transfer-Simulation starten",
  );
  updateWorkflowState();
}

function renderProductApprovalState() {
  if (!els.productApprovalBar) return;

  const readyForApproval = isProductReadyForApproval();
  const qualityGate = getProductQualityGate();
  const started = isProductApprovalStarted();
  const approved = hasApprovedFinalProductSelections();
  const changedCount = state.changedProductRequirementRows.size;
  const canStartOrOpenApproval = !approved && readyForApproval;
  els.productApprovalBar.hidden = !hasProject();
  if (els.productApprovalBar.hidden) return;

  els.productApprovalBar.classList.toggle("is-started", started && !approved);
  els.productApprovalBar.classList.toggle("is-complete", approved);
  els.productApprovalBar.classList.toggle("is-blocked", !approved && !started && qualityGate.status !== "PASSED");
  els.productApprovalTitle.textContent = translateUiText(
    approved
      ? "PR-Approval abgeschlossen"
      : changedCount
        ? "PR-Approval erneut erforderlich"
        : started
          ? "PR-Approval läuft"
          : "PR-Approval wartet",
  );
  els.productApprovalText.textContent = approved
    ? translateUiText("Alle Product Requirements sind freigegeben. Ein neues Approval ist erst nach einer PR-Änderung möglich.")
    : changedCount
      ? changedProductApprovalText(changedCount)
      : started
        ? productApprovalProgressText()
        : translateUiText(productApprovalStartHint(qualityGate));
  els.productApprovalBar.title = els.productApprovalText.textContent;
  els.startProductApprovalButton.hidden = false;
  els.startProductApprovalButton.textContent = translateUiText(
    approved ? "Approval abgeschlossen" : started ? "Approval öffnen" : "Approval-Prozess starten",
  );
  els.startProductApprovalButton.disabled =
    approved || !state.requirements.length || !canEditProductRequirements() || (!started && !canStartOrOpenApproval);
  els.startProductApprovalButton.title = approved
    ? translateUiText("Ein neues Approval ist erst nach einer Änderung an einem Product Requirement möglich.")
    : els.startProductApprovalButton.disabled && !started
      ? translateUiText(productApprovalStartBlockReason(qualityGate))
      : "";
  renderProductApproverSummary(started);
}

function changedProductApprovalText(changedCount) {
  if (changedCount === 1) return translateUiText("1 geänderte PR muss erneut freigegeben werden.");
  return `${changedCount} ${translateUiText("geänderte PR müssen erneut freigegeben werden.")}`;
}

function productApprovalStartHint(qualityGate = getProductQualityGate()) {
  if (qualityGate.status === "PASSED") {
    return "Alle Product Requirements erfüllen das Gate. Der Approval-Prozess kann gestartet werden.";
  }
  if (qualityGate.status === "BLOCKED") {
    return "Approval-Prozess kann erst gestartet werden, wenn alle nicht ausgeschlossenen Requirements Score >= 85 haben.";
  }
  return "Finale Scores fehlen oder sind für ein oder mehrere Requirements veraltet.";
}

function productApprovalStartBlockReason(qualityGate = getProductQualityGate()) {
  if (!canEditProductRequirements()) return "Nur Product Requirement Owner können den Approval-Prozess starten.";
  if (qualityGate.status === "BLOCKED") return "Finalization Gate blocked: mindestens ein Requirement benötigt Nacharbeit oder TechTypes.";
  if (qualityGate.status === "NOT_CHECKED") return "Finalization Gate not complete: Scores fehlen oder sind veraltet.";
  if (hasPendingFinalProductAssessments()) return "Finale Score-Bewertung läuft oder fehlt.";
  return "";
}

function handleProductApprovalButtonClick() {
  if (isProductApprovalStarted()) {
    focusProductApprovalPanel();
    return;
  }

  void openProductApprovalDialog();
}

function renderProductApproverSummary(started) {
  if (!els.productApproverSummary) return;

  const selectedApproverIds = new Set(getRequiredProductApproverIds());
  const approvers = state.productApprovers.filter((user) => currentUserHasRole("admin") || user.active !== false);

  if (!started) {
    els.productApproverSummary.innerHTML = `<span class="approver-chip">${escapeHtml(translateUiText("Noch nicht gestartet"))}</span>`;
    return;
  }

  const selectedApprovers = approvers.filter((user) => selectedApproverIds.has(String(user.id)));
  const knownApproverIds = new Set(selectedApprovers.map((user) => String(user.id)));
  const missingApproverIds = [...selectedApproverIds].filter((id) => !knownApproverIds.has(String(id)));
  const chips = [
    ...selectedApprovers.map((user) => approverChipLabel(user)),
    ...missingApproverIds.map((id) => `Unbekannter Approver (${id.slice(0, 8)}...)`),
  ];
  els.productApproverSummary.innerHTML = chips.length
    ? chips.map((label) => `<span class="approver-chip">${escapeHtml(label)}</span>`).join("")
    : `<span class="approver-chip">${escapeHtml(translateUiText("Keine PR Approver ausgewählt"))}</span>`;
}

function approverChipLabel(user) {
  if (!user) return "Unbekannter Approver";
  if (user.name && user.email) return `${user.name} (${user.email})`;
  return user.name || user.email || "Unbenannter Approver";
}

async function openProductApprovalDialog() {
  if (!canEditProductRequirements()) {
    alert("Nur Product Requirement Owner können den PR-Approval-Prozess starten.");
    return;
  }

  const qualityGate = getProductQualityGate();
  if (qualityGate.status !== "PASSED" || !isProductReadyForApproval()) {
    alert(productApprovalStartBlockReason(qualityGate) || `Bitte finalisiere zuerst alle PR mit Score >= ${PRODUCT_STEP_MIN_SCORE}.`);
    return;
  }

  state.productApproversLoaded = false;
  state.productApproversError = "";
  els.productApprovalOverlay.hidden = false;
  renderProductApprovalDialog();
  await ensureProductApproversLoaded({ force: true });
  renderProductApprovalDialog();
}

function closeProductApprovalDialog() {
  els.productApprovalOverlay.hidden = true;
  els.productApprovalDialogMessage.textContent = "";
}

function focusProductApprovalPanel() {
  if (!isProductApprovalStarted()) return;

  if (!state.activeSelectionRow && state.requirements.length) {
    state.activeSelectionRow = Number(state.requirements[0].rowNumber);
  }
  renderTable();
  renderProductApprovalPanel();
  if (!els.productApprovalDetailPanel.hidden) {
    els.productApprovalDetailPanel.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}

function renderProductApprovalDialog() {
  if (!els.productApprovalApproverList) return;

  if (state.productApproversLoading) {
    els.productApprovalDialogMessage.textContent = translateUiText("PR Approver werden geladen");
    els.productApprovalApproverList.innerHTML = "";
    renderProductApprovalSelectedApprovers([]);
    els.productApprovalConfirmButton.disabled = true;
    return;
  }

  if (state.productApproversError) {
    els.productApprovalDialogMessage.textContent = translateUiText(state.productApproversError);
    els.productApprovalApproverList.innerHTML = `
      <button type="button" data-reload-product-approvers>${escapeHtml(translateUiText("Erneut laden"))}</button>
    `;
    renderProductApprovalSelectedApprovers([]);
    els.productApprovalConfirmButton.disabled = true;
    return;
  }

  const selectedApproverIds = new Set(getRequiredProductApproverIds());
  const approvers = state.productApprovers.filter((user) => user.active !== false);
  els.productApprovalDialogMessage.textContent = approvers.length
    ? translateUiText("Wähle mindestens einen PR Approver aus.")
    : translateUiText("Keine PR Approver verfügbar");
  els.productApprovalApproverList.innerHTML = approvers.length
    ? approvers
        .map((user) => {
          const isSelected = selectedApproverIds.has(String(user.id));
          const displayName = user.name || user.email || "Unbenannter Approver";
          const email = user.email && user.email !== displayName ? user.email : "";
          return `
          <label class="approval-approver-option${isSelected ? " is-selected" : ""}">
            <input type="checkbox" data-product-approver-id="${escapeHtml(user.id)}" ${isSelected ? "checked" : ""} ${canEditProductRequirements() ? "" : "disabled"} />
            <span class="approval-approver-check" aria-hidden="true"></span>
            <span class="approval-approver-copy">
              <strong>${escapeHtml(displayName)}</strong>
              ${email ? `<small>${escapeHtml(email)}</small>` : ""}
              <small>${escapeHtml(formatRoleList(user.roles ?? user.role))}</small>
            </span>
          </label>
        `;
        })
        .join("")
    : `<span class="approver-chip">${escapeHtml(translateUiText("Keine PR Approver verfügbar"))}</span>`;
  updateProductApprovalConfirmState();
}

function productApprovalUserLabel(user) {
  return user?.name || user?.email || "Unbenannter Approver";
}

function handleProductApproverListClick(event) {
  const reloadButton = event.target.closest("[data-reload-product-approvers]");
  if (!reloadButton) return;

  state.productApproversLoaded = false;
  state.productApproversError = "";
  renderProductApprovalDialog();
  void ensureProductApproversLoaded({ force: true });
}

function handleSelectedProductApproverClick(event) {
  const removeButton = event.target.closest("[data-remove-product-approver-id]");
  if (!removeButton || !canEditProductRequirements()) return;

  const approverId = String(removeButton.dataset.removeProductApproverId || "");
  const approverInput = [...els.productApprovalApproverList.querySelectorAll("[data-product-approver-id]")]
    .find((input) => String(input.dataset.productApproverId || "") === approverId);
  if (approverInput) {
    approverInput.checked = false;
    updateProductApprovalConfirmState();
  }
}

function selectedProductApprovalDialogApproverIds() {
  return [...els.productApprovalApproverList.querySelectorAll("[data-product-approver-id]")]
    .filter((input) => input.checked)
    .map((input) => String(input.dataset.productApproverId || ""))
    .filter(Boolean);
}

function renderProductApprovalSelectedApprovers(selectedApproverIds) {
  if (!els.productApprovalSelectedApprovers) return;

  const approverById = new Map(state.productApprovers.map((user) => [String(user.id), user]));
  if (!selectedApproverIds.length) {
    els.productApprovalSelectedApprovers.innerHTML = `
      <span class="approval-selected-empty">${escapeHtml(translateUiText("Noch keine Approver ausgewählt."))}</span>
    `;
    return;
  }

  els.productApprovalSelectedApprovers.innerHTML = selectedApproverIds
    .map((approverId) => {
      const user = approverById.get(String(approverId));
      const label = user ? productApprovalUserLabel(user) : `Approver ${String(approverId).slice(0, 8)}`;
      return `
        <button
          class="approval-selected-chip"
          type="button"
          data-remove-product-approver-id="${escapeHtml(approverId)}"
          title="${escapeHtml(translateUiText("Approver entfernen"))}"
          ${canEditProductRequirements() ? "" : "disabled"}
        >
          <span>${escapeHtml(label)}</span>
          <strong aria-hidden="true">×</strong>
        </button>
      `;
    })
    .join("");
}

function updateProductApprovalConfirmState() {
  els.productApprovalApproverList.querySelectorAll(".approval-approver-option").forEach((option) => {
    const input = option.querySelector("[data-product-approver-id]");
    option.classList.toggle("is-selected", Boolean(input?.checked));
  });

  const selectedApproverIds = selectedProductApprovalDialogApproverIds();
  const selectedCount = selectedApproverIds.length;
  renderProductApprovalSelectedApprovers(selectedApproverIds);
  els.productApprovalConfirmButton.disabled =
    state.productApproversLoading || Boolean(state.productApproversError) || selectedCount === 0;
  if (!state.productApproversLoading && !state.productApproversError) {
    els.productApprovalDialogMessage.textContent = selectedCount
      ? `${selectedCount} PR Approver ausgewählt.`
      : translateUiText("Wähle mindestens einen PR Approver aus.");
  }
}

function productApprovalProgressText() {
  const requiredCount = getRequiredProductApproverIds().length;
  const totalRequiredApprovals = state.requirements.length * requiredCount;
  const completedApprovals = state.requirements.reduce((sum, requirement) => {
    const selection = state.finalSelections.get(Number(requirement.rowNumber));
    return sum + countProductApprovals(selection);
  }, 0);
  const approvalScope = `${state.requirements.length} Requirements x ${requiredCount} Approver`;
  const startedAt = state.productApprovalStartedAt
    ? ` ${translateUiText("Gestartet")}: ${new Date(state.productApprovalStartedAt).toLocaleString()}.`
    : "";
  const completeText = totalRequiredApprovals > 0 && completedApprovals >= totalRequiredApprovals
    ? ` ${translateUiText("Alle PR-Freigaben sind abgeschlossen.")}`
    : "";
  return `${completedApprovals} ${translateUiText("von")} ${totalRequiredApprovals} ${translateUiText("Freigaben erfasst")} (${approvalScope}).${completeText}${startedAt}`;
}

function startProductApprovalProcess() {
  if (hasApprovedFinalProductSelections()) {
    alert("Alle Product Requirements sind bereits freigegeben. Ein neues Approval ist erst nach einer PR-Änderung möglich.");
    return;
  }

  if (isProductApprovalStarted()) {
    closeProductApprovalDialog();
    focusProductApprovalPanel();
    return;
  }

  if (!canEditProductRequirements()) {
    alert("Nur Product Requirement Owner können den PR-Approval-Prozess starten.");
    return;
  }

  const qualityGate = getProductQualityGate();
  if (qualityGate.status !== "PASSED" || !isProductReadyForApproval()) {
    alert(productApprovalStartBlockReason(qualityGate) || `Bitte finalisiere zuerst alle PR mit Score >= ${PRODUCT_STEP_MIN_SCORE}.`);
    return;
  }

  const selectedApproverIds = normalizeApproverIds(selectedProductApprovalDialogApproverIds());
  if (!selectedApproverIds.length) {
    alert("Bitte wähle mindestens einen PR Approver aus.");
    return;
  }

  state.productApprovalApproverIds = new Set(selectedApproverIds);
  state.productApprovalStartedAt = new Date().toISOString();
  state.productApprovalStartedBy = currentApprovalUserName();
  state.finalSelections.forEach((selection) => clearApproval(selection));
  if (!state.activeSelectionRow && state.requirements.length) {
    state.activeSelectionRow = Number(state.requirements[0].rowNumber);
  }
  closeProductApprovalDialog();
  renderTable();
  renderProductApprovalPanel();
  renderMetrics();
  updateExportAvailability();
  setProjectRevisionAction("PR-Approval gestartet");
  updateProjectActions();
}

function renderProductTransferState(productReady = isProductReadyForTransferSimulation()) {
  if (!els.productTransferBar) return;

  const approvalPending = isProductApprovalPending();
  const transferReady = productReady && !approvalPending;
  els.productTransferBar.hidden = !hasProject();
  els.productTransferBar.classList.toggle("is-complete", state.productWindchillTransferComplete);
  els.productTransferBar.classList.toggle("is-blocked", !state.productWindchillTransferComplete && !transferReady);
  els.productTransferTitle.textContent = state.productWindchillTransferComplete
    ? translateUiText("Simulation abgeschlossen")
    : transferReady
      ? translateUiText("PR bereit zur Übergabe")
      : translateUiText("PR-Transfer wartet");
  els.productTransferText.textContent = state.productWindchillTransferComplete
    ? `${translateUiText("Demo Transfer angezeigt")}${state.productWindchillTransferredAt ? `: ${new Date(state.productWindchillTransferredAt).toLocaleString()}` : "."}`
    : !state.analysisComplete
      ? translateUiText("Analyse, Bearbeitung und Approval müssen vorher abgeschlossen sein.")
      : !productReady
        ? translateUiText("Alle nicht ausgeschlossenen Requirements benötigen Score >= 85 und TechTypes.")
        : approvalPending
          ? isProductApprovalStarted()
            ? `${productApprovalProgressText()} ${translateUiText("Die Übergabe ist erst nach vollständiger PR-Freigabe möglich.")}`
            : translateUiText("Starte und schließe zuerst den PR-Approval-Prozess ab.")
          : translateUiText("Simulation: PR würde nach Windchill übertragen. Noch keine echte Windchill-Verbindung.");
  els.productTransferBar.title = els.productTransferText.textContent;
  els.productTransferButton.disabled = state.productWindchillTransferComplete || !canEditProductRequirements() || !transferReady;
  els.productTransferButton.title = state.productWindchillTransferComplete
    ? translateUiText("Simulation abgeschlossen")
    : !canEditProductRequirements()
      ? translateUiText("Nur Product Requirement Owner oder Admins können die Transfer-Simulation starten")
      : approvalPending
        ? translateUiText("PR-Freigabe ist vor der Transfer-Simulation erforderlich")
        : "";
  els.productTransferButton.textContent = state.productWindchillTransferComplete
    ? translateUiText("Simulation abgeschlossen")
    : translateUiText("PR-Transfer simulieren");
}

async function simulateProductWindchillTransfer() {
  if (!canEditProductRequirements()) {
    alert(translateUiText("Nur Product Requirement Owner oder Admins können die Transfer-Simulation starten."));
    return;
  }

  if (!isProductReadyForTransferSimulation()) {
    alert(`Bitte finalisiere zuerst alle PR mit Score >= ${PRODUCT_STEP_MIN_SCORE} und ausgewählten TechTypes.`);
    return;
  }

  if (isProductApprovalPending()) {
    alert("Bitte starte und schließe zuerst den PR-Approval-Prozess ab. Danach kann die Windchill-Übergabe simuliert werden.");
    return;
  }

  if (state.productWindchillTransferComplete) return;

  setMenuButtonAvailability(els.exportButton, false, "Demo Transfer wird angezeigt");
  els.productTransferButton.disabled = true;
  els.productTransferButton.textContent = translateUiText("Simulation läuft...");
  await delay(900);
  state.productWindchillTransferComplete = true;
  state.productWindchillTransferredAt = new Date().toISOString();
  state.productTransferChangeRows = new Set();
  renderMetrics();
  updateExportAvailability();
  updateWorkflowState();
  setProjectRevisionAction("PR Transfer-Simulation abgeschlossen");
  updateProjectActions();
}

function renderSoftwareTransferState() {
  if (!els.softwareTransferBar) return;

  const softwareReady = isSoftwareQualityReady();
  els.softwareTransferBar.hidden = !hasProject() || !state.softwareRequirements.length || !softwareReady;
  els.softwareTransferBar.classList.toggle("is-complete", state.softwareWindchillTransferComplete);
  els.softwareTransferTitle.textContent = state.softwareWindchillTransferComplete
    ? translateUiText("Simulation abgeschlossen")
    : translateUiText("Simulierte Übergabe an Windchill");
  els.softwareTransferText.textContent = state.softwareWindchillTransferComplete
    ? `${translateUiText("Demo Transfer angezeigt")}${state.softwareWindchillTransferredAt ? `: ${new Date(state.softwareWindchillTransferredAt).toLocaleString()}` : "."}`
    : translateUiText("Simulation: SR würde übertragen werden. Noch keine echte Windchill-Verbindung.");
  els.softwareTransferButton.disabled = state.softwareWindchillTransferComplete || !canEditSoftwareRequirements();
  els.softwareTransferButton.textContent = state.softwareWindchillTransferComplete
    ? translateUiText("Simulation abgeschlossen")
    : translateUiText("SR-Transfer simulieren");
}

async function simulateSoftwareWindchillTransfer() {
  if (!canEditSoftwareRequirements()) {
    alert(translateUiText("Nur Software Requirement Owner oder Admins können die Transfer-Simulation starten."));
    return;
  }

  if (!isSoftwareQualityReady()) {
    alert(isSoftwareApprovalPending()
      ? translateUiText("Bitte gib zuerst alle abgeschlossenen Software Requirements frei.")
      : `Bitte übernimm oder schließe zuerst alle SR ab. Übernommene SR benötigen Score >= ${PRODUCT_STEP_MIN_SCORE}.`);
    return;
  }

  if (state.softwareWindchillTransferComplete) return;

  setMenuButtonAvailability(els.exportButton, false, "Demo Transfer wird angezeigt");
  els.softwareTransferButton.disabled = true;
  els.softwareTransferButton.textContent = translateUiText("Simulation läuft...");
  await delay(900);
  state.softwareWindchillTransferComplete = true;
  state.softwareWindchillTransferredAt = new Date().toISOString();
  state.softwareTransferChangeIds = new Set();
  renderSoftwarePage();
  updateExportAvailability();
  updateWorkflowState();
  setProjectRevisionAction("SR Transfer-Simulation abgeschlossen");
  updateProjectActions();
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
  updateProjectDirtyState();
  scheduleProjectAutoSave();
  updateContextualMenuActions();
}

function updateContextualMenuActions() {
  const projectOpen = hasProject();
  const isProductStep = state.activeProcessStep === "product";
  const isSoftwareStep = state.activeProcessStep === "software";
  const isE2eStep = state.activeProcessStep === "e2e";
  const canEditProduct = canEditProductRequirements();
  const canModifyProduct = canModifyProductRequirements();
  const canEditSoftware = canEditSoftwareRequirements();
  const canEditE2e = canEditE2eTests();
  const canUseProductActions = projectOpen && isProductStep && canModifyProduct;
  const canImportFile = isProductStep && canModifyProduct;
  const canAnalyzeProduct = canUseProductActions && !state.analysisComplete && state.requirements.length > 0;
  const canDeriveSoftware =
    projectOpen && isSoftwareStep && canEditSoftware && isProductStepComplete() && state.finalScoreUpdates.size === 0;
  const canDeriveE2e = projectOpen && isE2eStep && canEditE2e && isSoftwareStepComplete();

  setMenuButtonAvailability(
    els.newProjectButton,
    canCreateProject(),
    canCreateProject() ? "" : "Nur Admins und Owner-Rollen können Projekte erstellen",
  );
  setMenuButtonAvailability(
    els.openProjectButton,
    canLoadProject(),
    canLoadProject() ? "" : "Keine Berechtigung zum Laden von Projekten",
  );
  setMenuButtonAvailability(
    els.projectHistoryButton,
    projectOpen && canLoadProject(),
    projectOpen ? "" : "Öffne zuerst ein Projekt",
  );
  setMenuButtonAvailability(
    els.openFileButton,
    canImportFile,
    canImportFile
      ? ""
      : canEditProduct
        ? isProductApprovalLocked()
          ? "Product Requirements sind während des Approval-Prozesses gesperrt"
          : "Dateiimport ist nur im PR-Schritt verfügbar"
        : "Nur Product Requirement Owner oder Admins können Product Requirements erstellen",
  );
  setMenuButtonAvailability(
    els.openWindchillButton,
    projectOpen && isProductStep,
    projectOpen && isProductStep
      ? "Die Windchill-Schnittstelle ist in diesem MVP noch nicht verbunden. Der Import wird simuliert."
      : "Demo-Import aus Windchill ist nur im PR-Schritt verfügbar",
  );
  setMenuButtonAvailability(
    els.openSettingsButton,
    canUseProductActions,
    canUseProductActions
      ? ""
      : canEditProduct
        ? isProductApprovalLocked()
          ? "Product Requirements sind während des Approval-Prozesses gesperrt"
          : "Einstellungen sind nur im PR-Schritt verfügbar"
        : "Nur Product Requirement Owner oder Admins können Product Requirements bearbeiten",
  );
  els.analyzeButton.textContent = "PR Analysieren";
  els.analyzeButton.hidden = state.analysisComplete;
  setMenuButtonAvailability(
    els.analyzeButton,
    canAnalyzeProduct,
    state.analysisComplete
      ? "PRs wurden bereits analysiert. Nutze die AI-Verbesserung in den einzelnen Requirements."
      : canUseProductActions
      ? ""
      : canEditProduct
        ? isProductApprovalLocked()
          ? "Product Requirements sind während des Approval-Prozesses gesperrt"
          : "PR-Analyse ist nur im PR-Schritt verfügbar"
        : "Nur Product Requirement Owner oder Admins können Product Requirements bearbeiten",
  );
  els.analyzeProductButton.hidden = false;
  els.analyzeProductButton.disabled = !canAnalyzeProduct;
  els.analyzeProductButton.title = els.analyzeButton.title;
  setMenuButtonAvailability(
    els.generateSoftwareMenuButton,
    canDeriveSoftware,
    canDeriveSoftware
      ? ""
      : canEditSoftware
        ? "Software Requirements können erst im SR-Schritt nach abgeschlossener PR-Finalisierung und Transfer-Simulation abgeleitet werden"
        : "Nur Software Requirement Owner oder Admins können Software Requirements bearbeiten",
  );
  setMenuButtonAvailability(
    els.generateE2eMenuButton,
    canDeriveE2e,
    canDeriveE2e
      ? ""
      : canEditE2e
        ? "E2E TestCases können erst im E2E-Schritt nach abgeschlossener SR-Übernahme und Transfer-Simulation abgeleitet werden"
        : "Nur E2E Test Owner oder Admins können E2E TestCases bearbeiten",
  );
  normalizeMenuButtonStates();
}

function setMenuButtonAvailability(button, isAvailable, title = "") {
  if (!button) return;

  button.disabled = false;
  button.removeAttribute("disabled");
  button.setAttribute("aria-disabled", isAvailable ? "false" : "true");
  button.title = translateUiText(title);
}

function normalizeMenuButtonStates() {
  document.querySelectorAll(".menu-popover button").forEach((button) => {
    button.disabled = false;
    button.removeAttribute("disabled");
    if (!button.hasAttribute("aria-disabled")) {
      button.setAttribute("aria-disabled", "false");
    }
  });
}

function ensureMenuButtonAvailable(button) {
  if (button?.getAttribute("aria-disabled") !== "true") return true;

  return false;
}

async function createProjectInDatabase() {
  const endpoint = getProjectsEndpoint();
  if (!endpoint) {
    alert("Bitte starte den lokalen Server und öffne die App über http://localhost:3000.");
    return false;
  }

  state.projectSavePaused = true;
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: createProjectPayload(),
        action: "Projekt angelegt",
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      alert(data.error || "Projekt konnte nicht angelegt werden.");
      return false;
    }

    state.projectId = data.projectId || data.project?.id || state.projectId;
    state.projectFileName = projectFileName();
    markProjectSaved();
    updateProjectActions();
    return true;
  } catch (error) {
    console.warn("Projekt konnte nicht angelegt werden.", error);
    return false;
  } finally {
    state.projectSavePaused = false;
  }
}

function scheduleProjectAutoSave() {
  if (state.projectSavePaused || !state.projectId || !state.projectDirty) return;
  if (!canSaveProject()) return;
  if (state.projectSaveInFlight) {
    state.projectSaveQueued = true;
    return;
  }

  clearTimeout(state.projectSaveTimerId);
  state.projectSaveTimerId = setTimeout(() => {
    void saveCurrentProjectToDatabase();
  }, 600);
}

async function saveCurrentProjectToDatabase() {
  if (state.projectSavePaused || !state.projectId || !state.projectDirty) return false;

  const endpoint = getProjectEndpoint(state.projectId);
  if (!endpoint) return false;

  if (state.projectSaveInFlight) {
    state.projectSaveQueued = true;
    return false;
  }

  state.projectSaveInFlight = true;
  const revisionAction = state.projectRevisionAction || "Projekt automatisch gespeichert";
  try {
    const response = await fetch(endpoint, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: createProjectPayload(),
        action: revisionAction,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.warn("Projekt konnte nicht automatisch gespeichert werden.", data.error || response.statusText);
      return false;
    }

    state.projectId = data.projectId || data.project?.id || state.projectId;
    markProjectSaved();
    if (state.projectRevisionAction === revisionAction) {
      state.projectRevisionAction = "";
    }
    return true;
  } catch (error) {
    console.warn("Projekt konnte nicht automatisch gespeichert werden.", error);
    return false;
  } finally {
    state.projectSaveInFlight = false;
    if (state.projectSaveQueued) {
      state.projectSaveQueued = false;
      scheduleProjectAutoSave();
    }
  }
}

function createProjectPayload() {
  return {
    type: PROJECT_FILE_TYPE,
    version: PROJECT_FILE_VERSION,
    savedAt: new Date().toISOString(),
    project: {
      name: projectDisplayName() || "Miele.DevPilot",
      description: state.projectDescription,
      id: state.projectId,
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
      productApprovalApproverIds: getRequiredProductApproverIds(),
      productApprovalStartedAt: state.productApprovalStartedAt,
      productApprovalStartedBy: state.productApprovalStartedBy,
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

function loadProjectPayload(payload, fileName, projectId = "") {
  if (!payload || payload.type !== PROJECT_FILE_TYPE) {
    throw new Error("Unbekanntes Projektformat");
  }

  if (payload.version !== PROJECT_FILE_VERSION) {
    throw new Error(`Nicht unterstützte Projektversion: ${payload.version}`);
  }

  const source = payload.source || {};
  if (!Array.isArray(source.rows) || !Array.isArray(source.headers)) {
    throw new Error("Projekt enthält keine gültigen Quelldaten");
  }

  resetProjectApprovalState();
  state.workbook = null;
  state.rows = source.rows;
  state.headers = source.headers.map((header) => String(header || ""));
  state.techTypes = Array.isArray(source.techTypes) ? source.techTypes : [];
  state.sheetName = source.sheetName || "Projekt";
  state.sourceFileName = source.fileName || fileName;
  const projectMetadata = projectMetadataFromPayload(payload, fileName, state.sourceFileName);
  state.projectName = projectMetadata.name;
  state.projectDescription = projectMetadata.description;
  state.projectId = projectId || payload.project?.id || "";
  state.projectFileName = fileName || "";
  state.projectRevisionAction = "";
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
        approvedAt: selection.approvedAt || "",
        approvedBy: selection.approvedBy || "",
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
        approvedAt: selection.approvedAt || "",
        approvedBy: selection.approvedBy || "",
      },
    ]),
  );
  state.finalSelections = new Map(
    (Array.isArray(payload.state?.finalSelections) ? payload.state.finalSelections : []).map((selection) => [
      Number(selection.rowNumber),
      {
        choice: selection.choice,
        selectedSource: selection.selectedSource || "",
        text: selection.text || "",
        ...(Array.isArray(selection.techTypes) ? { techTypes: selection.techTypes } : {}),
        excluded: Boolean(selection.excluded),
        exclusionReason: selection.exclusionReason || "",
        finalizedAt: selection.finalizedAt || "",
        approvedAt: selection.approvedAt || "",
        approvedBy: selection.approvedBy || "",
        approvals: Array.isArray(selection.approvals) ? selection.approvals : [],
        comments: Array.isArray(selection.comments) ? selection.comments : [],
        versions: Array.isArray(selection.versions) ? selection.versions : [],
      },
    ]),
  );
  state.productApprovalApproverIds = new Set(
    normalizeApproverIds(Array.isArray(payload.state?.productApprovalApproverIds) ? payload.state.productApprovalApproverIds : []),
  );
  state.productApprovalStartedAt = payload.state?.productApprovalStartedAt || "";
  state.productApprovalStartedBy = payload.state?.productApprovalStartedBy || "";
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
  reconcileProductChangeStateFromHistory();
  state.activeProcessStep = payload.state?.activeProcessStep || "product";
  state.language = LANGUAGES[payload.state?.language] ? payload.state.language : DEFAULT_LANGUAGE;
  document.documentElement.lang = state.language;
  els.languageSelect.value = state.language;

  els.fileState.textContent = projectStatusText(projectDisplayName() || fileName || "Miele.DevPilot");
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
  migrateProductApprovalSelections();
  state.generatedIds = Boolean(payload.state?.generatedIds);
  setAutoIdVisible(state.generatedIds);
  setMenuButtonAvailability(
    els.analyzeButton,
    state.requirements.length > 0 && canEditProductRequirements(),
    state.requirements.length > 0 ? "" : "Importiere zuerst Product Requirements",
  );
  els.analyzeProductButton.disabled = state.requirements.length === 0;
  updateProjectActions();
  updateExportAvailability();
  renderWorkspaceState();
  renderProcessPages();
  renderTable();
  renderMetrics();
  markProjectSaved();
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
  const rawName = projectDisplayName() || "Miele.DevPilot";
  const baseName = rawName.replace(/\.[^.]+$/, "").replace(/[^a-z0-9._-]+/gi, "-") || "Miele.DevPilot";
  return `${baseName}.mdp`;
}

function projectDisplayName() {
  return firstNonEmptyString(state.projectName, projectNameFromFile(state.projectFileName), projectNameFromSource());
}

function projectMetadataFromPayload(payload, fileName, sourceFileName) {
  const project = payload.project || {};
  return {
    name: firstNonEmptyString(project.name, project.projectName, project.title, payload.projectName, payload.name, payload.title, projectNameFromFile(fileName), projectNameFromFile(sourceFileName)),
    description: firstNonEmptyString(project.description, project.projectDescription, payload.projectDescription, payload.description),
  };
}

function firstNonEmptyString(...values) {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }

  return "";
}

function projectNameFromSource() {
  if (!state.sourceFileName) return "";
  return state.sourceFileName.replace(/\.[^.]+$/, "");
}

function projectNameFromSourceFile(fileName) {
  const name = String(fileName || "").trim();
  return name ? name.replace(/\.[^.]+$/, "") : "Miele.DevPilot";
}

function projectNameFromFile(fileName) {
  const name = String(fileName || "").trim();
  if (!name) return "";
  return name.replace(/\.mdp$|\.miele-devpilot\.json$|\.json$/i, "");
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

function selectedUiLanguage() {
  return currentLanguage();
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
    [/^Simulated transfer completed: (.+)$/, "Simulation abgeschlossen: $1"],
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
    [/^Simulation abgeschlossen: (.+)$/, "Simulated transfer completed: $1"],
    [/^Sprache geaendert: (.+)$/, "Language changed: $1"],
    [/^Sprache geändert: (.+)$/, "Language changed: $1"],
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
    renderProcessPages();
    renderTable();
    renderMetrics();
    renderOpenAiCostSummary();
    renderAboutPage();
  }
  scheduleApplyTranslations();
  updateProjectActions();
}

async function changeLanguage(language) {
  const nextLanguage = LANGUAGES[language] ? language : DEFAULT_LANGUAGE;
  setProjectRevisionAction(`Sprache geaendert: ${LANGUAGES[nextLanguage]}`);
  setLanguage(nextLanguage);

  const translated = await translateExistingFeedback(nextLanguage);
  if (!translated) return;

  renderWorkspaceState();
  renderProcessPages();
  renderTable();
  renderMetrics();
  renderAboutPage();
  scheduleApplyTranslations();
}

async function translateExistingFeedback(targetLanguage) {
  const endpoint = getFeedbackTranslationEndpoint();
  if (!endpoint) return false;

  const entries = collectFeedbackTranslationEntries(targetLanguage);
  if (!entries.length) return false;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uiLanguage: targetLanguage,
        items: entries.map((entry) => ({
          id: entry.id,
          criterion: entry.issue.criterion || "",
          explanation: entry.issue.explanation || "",
          suggestion: entry.issue.suggestion || "",
        })),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Hinweise konnten nicht übersetzt werden");
    }

    addOpenAiUsage(data.openAiUsage);
    const translationsById = new Map((Array.isArray(data.items) ? data.items : []).map((item) => [String(item.id), item]));
    entries.forEach((entry) => {
      const translated = translationsById.get(entry.id);
      if (!translated) return;

      entry.issue._translations = entry.issue._translations || {};
      entry.issue._translations[targetLanguage] = {
        criterion: translated.criterion || entry.issue.criterion || "",
        explanation: translated.explanation || entry.issue.explanation || "",
        suggestion: translated.suggestion || entry.issue.suggestion || "",
      };
    });

    return true;
  } catch (error) {
    console.warn("Feedback translation failed:", error);
    return false;
  }
}

function collectFeedbackTranslationEntries(targetLanguage) {
  const entries = [];
  let index = 0;
  const addIssues = (issues) => {
    if (!Array.isArray(issues)) return;

    issues.forEach((issue) => {
      if (!issue || typeof issue !== "object") return;
      if (issue._translations?.[targetLanguage]) return;
      if (!issue.criterion && !issue.explanation && !issue.suggestion) return;

      entries.push({
        id: String(index++),
        issue,
      });
    });
  };

  state.results.forEach((result) => {
    addIssues(result.originalIssues);
    addIssues(result.issues);
  });
  state.softwareRequirements.forEach((item) => addIssues(item.issues));
  state.e2eTests.forEach((item) => addIssues(item.issues));

  return entries;
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
    renderProjectHeader();
    renderOpenAiCostSummary();
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
  if (DYNAMIC_UI_TEXT_IDS.has(element.id)) return true;
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

function getAnalyzeEndpoint() {
  return getApiEndpoint("api/analyze");
}

function getProjectsEndpoint() {
  return getApiEndpoint("api/projects");
}

function getProjectEndpoint(projectId) {
  return getApiEndpoint(`api/projects/${encodeURIComponent(projectId)}`);
}

function getProjectRevisionsEndpoint(projectId) {
  return getApiEndpoint(`api/projects/${encodeURIComponent(projectId)}/revisions`);
}

function getProjectRevisionRestoreEndpoint(projectId, revisionId) {
  return getApiEndpoint(`api/projects/${encodeURIComponent(projectId)}/revisions/${encodeURIComponent(revisionId)}/restore`);
}

function getFeedbackTranslationEndpoint() {
  return getApiEndpoint("api/translate-feedback");
}

function getRuntimeEndpoint() {
  return getApiEndpoint("api/runtime");
}

function getSessionEndpoint() {
  return getApiEndpoint("api/session");
}

function getLoginEndpoint() {
  return getApiEndpoint("api/login");
}

function getLogoutEndpoint() {
  return getApiEndpoint("api/logout");
}

function getChangePasswordEndpoint() {
  return getApiEndpoint("api/change-password");
}

function getAdminUsersEndpoint() {
  return getApiEndpoint("api/admin/users");
}

function getApproversEndpoint(role) {
  return getApiEndpoint(`api/users/approvers?role=${encodeURIComponent(role)}`);
}

function getAdminUserEndpoint(userId) {
  return getApiEndpoint(`api/admin/users/${encodeURIComponent(userId)}`);
}

function getApiEndpoint(path) {
  if (window.location.protocol === "file:") {
    return new URL(path, LOCAL_SERVER_APP_URL).href;
  }

  const url = new URL(path, window.location.href);
  return `${url.pathname}${url.search}`;
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

function formatProjectDate(value) {
  return formatGitDate(value) || "-";
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
  els.progressTitle.textContent = translateUiText("Requirements werden analysiert");
  els.progressText.textContent = translateUiText("Berechne voraussichtliche Bearbeitungszeit...");
  els.progressBar.style.width = "0%";
  els.progressTimeBar.style.width = "0%";
  els.progressTimeText.textContent = translateUiText("Restzeit wird berechnet");
  renderProgressDetail();
  state.progressEstimatedRemainingMs = await calculateInitialProgressEstimate(total, options);
  state.progressInitialEstimatedMs = state.progressEstimatedRemainingMs;
  renderProgressDetail();
  els.progressText.textContent = translateUiText("Die Analyse wird vorbereitet.");
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
  els.progressText.textContent = translateUiText(`Batch ${batchNumber} von ${totalBatches} wird verarbeitet.`);
  els.progressBar.style.width = `${percent}%`;
  renderProgressDetail();
}

function completeProgress(processed) {
  clearProgressTimer();
  rememberProgressTiming(Date.now() - state.progressStartedAt);
  els.progressTitle.textContent = translateUiText("Analyse abgeschlossen");
  els.progressText.textContent = translateUiText("Alle verfügbaren Ergebnisse wurden verarbeitet.");
  els.progressBar.style.width = "100%";
  els.progressTimeBar.style.width = "100%";
  els.progressTimeText.textContent = translateUiText("Abgeschlossen");
  els.progressDetail.textContent = translateUiText(`${processed} Requirements analysiert · Dauer ${formatDuration(Date.now() - state.progressStartedAt)}`);
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
  const remainingText = remaining == null ? translateUiText("Restzeit wird berechnet") : translateUiText(`Restzeit ca. ${formatDuration(remaining)}`);
  const batchText = totalBatches > 1
    ? ` · Batch ${Math.min(batchNumber || 1, totalBatches)} ${translateUiText("von")} ${totalBatches}`
    : "";
  els.progressDetail.textContent = `${processed} ${translateUiText("von")} ${total} ${translateUiText("Requirements verarbeitet")}${batchText} · ${translateUiText("Laufzeit")} ${formatDuration(elapsed)} · ${remainingText}`;
  renderProgressTimeBar(elapsed, remaining);
}

function renderProgressTimeBar(elapsed, remaining) {
  if (remaining == null || !state.progressInitialEstimatedMs) {
    els.progressTimeBar.style.width = "0%";
    els.progressTimeText.textContent = translateUiText("Restzeit wird berechnet");
    return;
  }

  const totalTime = Math.max(elapsed + remaining, state.progressInitialEstimatedMs, 1);
  const percent = Math.max(0, Math.min(100, Math.round((elapsed / totalTime) * 100)));
  els.progressTimeBar.style.width = `${percent}%`;
  els.progressTimeText.textContent = `${percent}% · ${formatDuration(remaining)} ${translateUiText("verbleibend")}`;
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

Promise.allSettled([loadRuntimeInfo(), loadSession()]).finally(() => {
  setupTranslationObserver();
  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  state.language = LANGUAGES[storedLanguage] ? storedLanguage : DEFAULT_LANGUAGE;
  document.documentElement.lang = state.language;
  els.languageSelect.value = state.language;
  renderAuthState();
  renderWorkspaceState();
  renderProcessPages();
  updateProjectActions();
  renderMetrics();
  scheduleApplyTranslations();
});
