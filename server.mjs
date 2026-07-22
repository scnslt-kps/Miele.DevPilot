import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { promisify } from "node:util";
import { parseProductRequirementsPdf, PDF_IMPORT_MAX_BYTES, validatePdfUpload } from "./src/lib/pdf-import.mjs";
import { EXCEL_IMPORT_MAX_BYTES, validateExcelImport } from "./src/lib/import-validation.mjs";
import {
  REQUIREMENT_ATTACHMENT_MAX_BYTES,
  REQUIREMENT_ATTACHMENT_MAX_FILES,
  REQUIREMENT_ATTACHMENT_STORAGE_ROOT,
  RequirementAttachmentStorage,
  contentDispositionAttachment,
  contentDispositionInline,
  validateAttachmentFile,
} from "./src/lib/requirement-attachment-storage.mjs";
import {
  AI_USAGE_ACTIONS,
  AI_USAGE_CAPTURE_STARTED_AT,
  AI_USAGE_PRICING_VERSION,
  buildAiUsageRecord,
  calculateAiUsageCost,
  resolvePricing,
} from "./src/lib/ai-usage.mjs";
import { normalizeProjectRichTextPayload } from "./src/lib/rich-text.mjs";
import {
  assessProductRequirementQuality,
  normalizeProductRequirementQualityResult,
  normalizeProductRequirementScoreBreakdown,
  productRequirementQualityPromptContext,
  productRequirementStructuredOutputSchemaExtension,
  scoreBreakdownJsonSchema,
  validateProductRequirementScoreBreakdown,
} from "./src/lib/product-requirement-quality.mjs";
import { prisma } from "./src/lib/prisma.js";

const root = new URL(".", import.meta.url).pathname;
const execFileAsync = promisify(execFile);
const scryptAsync = promisify(scrypt);

await loadDotEnv();

const port = Number(process.env.PORT || 3000);
const basePath = normalizeBasePath(process.env.BASE_PATH || "");
const legacyUsersFilePath = join(root, "data/users.json");
const attachmentStorage = new RequirementAttachmentStorage({ root: join(root, REQUIREMENT_ATTACHMENT_STORAGE_ROOT) });
const sessionCookieName = "miele_devpilot_session";
const sessions = new Map();
const knownRoles = new Set([
  "admin",
  "productRequirementOwner",
  "softwareRequirementOwner",
  "e2eTestOwner",
  "productRequirementApprover",
  "softwareRequirementApprover",
  "e2eTestApprover",
]);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

const server = createServer(async (req, res) => {
  try {
    setCorsHeaders(req, res);
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

    if (req.method === "GET" && pathname === "/api/session") {
      await handleSession(req, res);
      return;
    }

    if (req.method === "POST" && pathname === "/api/login") {
      await handleLogin(req, res);
      return;
    }

    if (req.method === "POST" && pathname === "/api/logout") {
      await handleLogout(req, res);
      return;
    }

    if (req.method === "POST" && pathname === "/api/change-password") {
      const session = await requireSession(req, res, { allowPasswordChange: true });
      if (!session) return;

      await handleChangePassword(req, res, session.user.id);
      return;
    }

    if (req.method === "GET" && pathname === "/api/users/approvers") {
      const session = await requireSession(req, res);
      if (!session) return;

      if (!userCanLoadApprovers(session.user)) {
        sendJson(res, 403, { error: "Approver list permission required." });
        return;
      }

      await handleListApprovers(res, url.searchParams.get("role"));
      return;
    }

    if (req.method === "GET" && pathname === "/api/users/by-role") {
      const session = await requireSession(req, res);
      if (!session) return;

      if (!userCanLoadProjectRoleUsers(session.user)) {
        sendJson(res, 403, { error: "User list permission required." });
        return;
      }

      await handleListUsersByRole(res, url.searchParams.get("role"));
      return;
    }

    if (pathname.startsWith("/api/admin/")) {
      const session = await requireSession(req, res, { admin: true });
      if (!session) return;

      if (req.method === "GET" && pathname === "/api/admin/users") {
        await handleListUsers(res);
        return;
      }

      if (req.method === "POST" && pathname === "/api/admin/users") {
        await handleCreateUser(req, res);
        return;
      }

      const userIdMatch = pathname.match(/^\/api\/admin\/users\/([^/]+)$/);
      if (userIdMatch && req.method === "PUT") {
        await handleUpdateUser(req, res, userIdMatch[1]);
        return;
      }

      if (userIdMatch && req.method === "DELETE") {
        await handleDeleteUser(res, userIdMatch[1], session.user.id);
        return;
      }

      sendJson(res, 404, { error: "Not found" });
      return;
    }

    if (req.method === "POST" && pathname === "/api/analyze") {
      const session = await requireSession(req, res);
      if (!session) return;

      await handleAnalyze(req, res, session.user);
      return;
    }

    if (req.method === "POST" && pathname === "/api/import/pdf") {
      const session = await requireSession(req, res);
      if (!session) return;

      if (!userHasRole(session.user, "productRequirementOwner")) {
        sendJson(res, 403, { error: "Product Requirement Owner role required." });
        return;
      }

      await handlePdfImport(req, res);
      return;
    }

    if (req.method === "POST" && pathname === "/api/import/excel") {
      const session = await requireSession(req, res);
      if (!session) return;

      if (!userHasRole(session.user, "productRequirementOwner")) {
        sendJson(res, 403, { error: "Product Requirement Owner role required." });
        return;
      }

      await handleExcelImportValidation(req, res);
      return;
    }

    if (req.method === "POST" && pathname === "/api/translate-feedback") {
      const session = await requireSession(req, res);
      if (!session) return;
      await handleTranslateFeedback(req, res, session.user);
      return;
    }

    if (pathname === "/api/workspace-state") {
      const session = await requireSession(req, res);
      if (!session) return;

      if (req.method === "GET") {
        await handleGetWorkspaceState(res, session.user);
        return;
      }

      if (req.method === "PUT") {
        await handleSaveWorkspaceState(req, res, session.user);
        return;
      }

      sendJson(res, 405, { error: "Method not allowed" });
      return;
    }

    if (pathname.startsWith("/api/projects")) {
      const session = await requireSession(req, res);
      if (!session) return;

      if (req.method === "GET" && pathname === "/api/projects") {
        await handleListProjects(res, session.user);
        return;
      }

      if (req.method === "POST" && pathname === "/api/projects") {
        if (!userCanCreateProject(session.user)) {
          sendJson(res, 403, { error: "Project create permission required." });
          return;
        }

        await handleCreateProject(req, res, session.user);
        return;
      }

      const projectIdMatch = pathname.match(/^\/api\/projects\/([^/]+)$/);
      const projectRevisionsMatch = pathname.match(/^\/api\/projects\/([^/]+)\/revisions$/);
      const projectAiUsageMatch = pathname.match(/^\/api\/projects\/([^/]+)\/ai-usage$/);
      const projectAttachmentCountsMatch = pathname.match(/^\/api\/projects\/([^/]+)\/attachment-counts$/);
      const requirementAttachmentsMatch = pathname.match(/^\/api\/projects\/([^/]+)\/requirements\/([^/]+)\/attachments$/);
      const attachmentDownloadMatch = pathname.match(/^\/api\/projects\/([^/]+)\/attachments\/([^/]+)\/download$/);
      const attachmentMatch = pathname.match(/^\/api\/projects\/([^/]+)\/attachments\/([^/]+)$/);

      if (requirementAttachmentsMatch && req.method === "GET") {
        await handleListRequirementAttachments(res, session.user, requirementAttachmentsMatch[1], decodeURIComponent(requirementAttachmentsMatch[2]));
        return;
      }

      if (requirementAttachmentsMatch && req.method === "POST") {
        await handleUploadRequirementAttachments(req, res, session.user, requirementAttachmentsMatch[1], decodeURIComponent(requirementAttachmentsMatch[2]));
        return;
      }

      if (attachmentDownloadMatch && req.method === "GET") {
        await handleDownloadRequirementAttachment(res, session.user, attachmentDownloadMatch[1], attachmentDownloadMatch[2]);
        return;
      }

      if (attachmentMatch && req.method === "DELETE") {
        await handleDeleteRequirementAttachment(res, session.user, attachmentMatch[1], attachmentMatch[2]);
        return;
      }

      if (projectAiUsageMatch && req.method === "GET") {
        await handleProjectAiUsage(res, session.user, projectAiUsageMatch[1], url.searchParams);
        return;
      }

      if (projectRevisionsMatch && req.method === "GET") {
        await handleListProjectRevisions(res, session.user, projectRevisionsMatch[1]);
        return;
      }

      const projectRevisionRestoreMatch = pathname.match(/^\/api\/projects\/([^/]+)\/revisions\/([^/]+)\/restore$/);
      if (projectRevisionRestoreMatch && req.method === "POST") {
        if (!userCanSaveProject(session.user)) {
          sendJson(res, 403, { error: "Project update permission required." });
          return;
        }

        await handleRestoreProjectRevision(res, session.user, projectRevisionRestoreMatch[1], projectRevisionRestoreMatch[2]);
        return;
      }

      if (projectIdMatch && req.method === "GET") {
        await handleGetProject(res, session.user, projectIdMatch[1]);
        return;
      }

      if (projectIdMatch && req.method === "PUT") {
        if (!userCanSaveProject(session.user)) {
          sendJson(res, 403, { error: "Project update permission required." });
          return;
        }

        await handleUpdateProject(req, res, session.user, projectIdMatch[1]);
        return;
      }

      if (projectIdMatch && req.method === "DELETE") {
        if (!userHasRole(session.user, "admin")) {
          sendJson(res, 403, { error: "Admin role required." });
          return;
        }

        await handleDeleteProject(res, projectIdMatch[1]);
        return;
      }

      sendJson(res, 404, { error: "Not found" });
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

async function fetchOpenAiResponses(payload, options = {}) {
  const timeoutMs = Number(options.timeoutMs) || Number(process.env.OPENAI_TIMEOUT_MS) || 90_000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.apiKey || process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`OpenAI request timed out after ${timeoutMs}ms.`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

server.listen(port, () => {
  const appUrl = `http://localhost:${port}${basePath || ""}/`;
  console.log(`Miele.DevPilot is running at ${appUrl}`);
  openAppInBrowser(appUrl).catch((error) => {
    console.warn(`Browser could not be opened automatically. Please open ${appUrl} manually.`, error.message);
  });
});

async function handleSession(req, res) {
  const session = await getSession(req);
  sendJson(res, 200, { user: session?.user || null });
}

async function handleLogin(req, res) {
  const body = await readJsonBody(req, 50_000);
  const identifier = normalizeLoginIdentifier(body.identifier || body.email || body.name);
  const password = String(body.password || "");
  if (!identifier || !password) {
    sendJson(res, 400, { error: "Please enter your name or email address and password." });
    return;
  }

  const users = await loadUsers();
  const user = users.find((item) => userMatchesIdentifier(item, identifier) && item.active !== false);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    sendJson(res, 401, { error: "Invalid login credentials." });
    return;
  }

  const sessionId = randomBytes(32).toString("base64url");
  sessions.set(sessionId, { user: publicUser(user), createdAt: new Date().toISOString() });
  res.setHeader("Set-Cookie", serializeCookie(sessionCookieName, sessionId, cookieOptions()));
  sendJson(res, 200, { user: publicUser(user), passwordChangeRequired: user.mustChangePassword === true });
}

async function handleLogout(req, res) {
  const sessionId = getCookie(req, sessionCookieName);
  if (sessionId) {
    sessions.delete(sessionId);
  }

  res.setHeader("Set-Cookie", serializeCookie(sessionCookieName, "", { ...cookieOptions(), "Max-Age": 0 }));
  sendJson(res, 200, { ok: true });
}

async function handleListUsers(res) {
  const users = await loadUsers();
  sendJson(res, 200, { users: users.map(publicUser) });
}

async function handleListApprovers(res, role) {
  const approverRole = normalizeRoles([role])[0];
  if (!approverRole || !approverRole.endsWith("Approver")) {
    sendJson(res, 400, { error: "Valid approver role required." });
    return;
  }

  const users = await loadUsers();
  sendJson(res, 200, {
    users: users
      .filter((user) => user.active !== false && userHasRole(user, approverRole))
      .map(publicUser),
  });
}

async function handleListUsersByRole(res, role) {
  const userRole = normalizeRoles([role])[0];
  if (!userRole || !userRole.endsWith("Owner")) {
    sendJson(res, 400, { error: "Valid owner role required." });
    return;
  }

  const users = await loadUsers();
  sendJson(res, 200, {
    users: users
      .filter((user) => user.active !== false && userHasRole(user, userRole))
      .map(publicUser),
  });
}

async function handleGetWorkspaceState(res, user) {
  const states = await prisma.userWorkspaceState.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });
  const globalState = states.find((entry) => entry.scopeKey === "global" && !entry.projectId) || null;
  const globalLastProjectId = String(globalState?.activeFilters?.lastProjectId || "");
  const projectIds = [
    ...states.map((entry) => entry.projectId).filter(Boolean),
    globalLastProjectId,
  ].filter(Boolean);
  const accessibleProjects = projectIds.length
    ? await prisma.project.findMany({
        where: {
          id: { in: projectIds },
          ...projectAccessWhere(user),
        },
        select: { id: true },
      })
    : [];
  const accessibleProjectIds = new Set(accessibleProjects.map((project) => project.id));
  const projectStates = states
    .filter((entry) => entry.projectId && accessibleProjectIds.has(entry.projectId))
    .map(workspaceStateSummary);
  const lastProjectId = String(globalState?.activeFilters?.lastProjectId || "");
  const lastProjectStillAccessible = lastProjectId && accessibleProjectIds.has(lastProjectId);

  sendJson(res, 200, {
    global: globalState
      ? {
          ...workspaceStateSummary(globalState),
          lastProjectId: lastProjectStillAccessible ? lastProjectId : "",
        }
      : null,
    projects: projectStates,
  });
}

async function handleSaveWorkspaceState(req, res, user) {
  const body = await readJsonBody(req, 100_000);
  const normalized = normalizeWorkspaceStateInput(body);
  const projectId = normalized.projectId;
  if (projectId) {
    const project = await findAccessibleProject(user, projectId);
    if (!project) {
      sendJson(res, 404, { error: "Project not found." });
      return;
    }
  }

  const scopeKey = projectId ? `project:${projectId}` : "global";
  const saved = await prisma.userWorkspaceState.upsert({
    where: {
      userId_scopeKey: {
        userId: user.id,
        scopeKey,
      },
    },
    update: {
      projectId: projectId || null,
      selectedStatus: normalized.selectedStatus,
      selectedCategory: normalized.selectedCategory,
      selectedSubcategory: normalized.selectedSubcategory,
      activeFilters: normalized.activeFilters,
      sortField: normalized.sortField,
      sortDirection: normalized.sortDirection,
      lastRequirementId: normalized.lastRequirementId || null,
      projectClosedAt: normalized.projectClosedAt,
    },
    create: {
      userId: user.id,
      projectId: projectId || null,
      scopeKey,
      selectedStatus: normalized.selectedStatus,
      selectedCategory: normalized.selectedCategory,
      selectedSubcategory: normalized.selectedSubcategory,
      activeFilters: normalized.activeFilters,
      sortField: normalized.sortField,
      sortDirection: normalized.sortDirection,
      lastRequirementId: normalized.lastRequirementId || null,
      projectClosedAt: normalized.projectClosedAt,
    },
  });

  sendJson(res, 200, { state: workspaceStateSummary(saved) });
}

async function handleChangePassword(req, res, userId) {
  const body = await readJsonBody(req, 50_000);
  const password = String(body.password || "");
  const confirmPassword = String(body.confirmPassword || "");
  if (password.length < 8) {
    sendJson(res, 400, { error: "Please enter a password with at least 8 characters." });
    return;
  }

  if (confirmPassword && password !== confirmPassword) {
    sendJson(res, 400, { error: "Password confirmation does not match." });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    sendJson(res, 404, { error: "User not found." });
    return;
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: await hashPassword(password),
      mustChangePassword: false,
    },
  });
  refreshSessionsForUser(updatedUser);
  sendJson(res, 200, { user: publicUser(updatedUser) });
}

async function handleCreateUser(req, res) {
  const body = await readJsonBody(req, 50_000);
  const name = normalizeUserName(body.name);
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  if (!name) {
    sendJson(res, 400, { error: "Please enter a user name." });
    return;
  }

  if (!email) {
    sendJson(res, 400, { error: "Please enter a valid email address." });
    return;
  }

  if (password.length < 8) {
    sendJson(res, 400, { error: "Please enter a password with at least 8 characters." });
    return;
  }

  if (await prisma.user.findUnique({ where: { email } })) {
    sendJson(res, 409, { error: "This email address already exists." });
    return;
  }

  if (await prisma.user.findUnique({ where: { name } })) {
    sendJson(res, 409, { error: "This user name already exists." });
    return;
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      roles: normalizeRoles(body.roles ?? body.role),
      active: body.active !== false,
      passwordHash: await hashPassword(password),
      mustChangePassword: true,
    },
  });
  sendJson(res, 201, { user: publicUser(user) });
}

async function handleUpdateUser(req, res, userId) {
  const body = await readJsonBody(req, 50_000);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    sendJson(res, 404, { error: "User not found." });
    return;
  }

  const name = body.name === undefined ? user.name : normalizeUserName(body.name);
  if (!name) {
    sendJson(res, 400, { error: "Please enter a user name." });
    return;
  }

  const email = body.email === undefined ? user.email : normalizeEmail(body.email);
  if (!email) {
    sendJson(res, 400, { error: "Please enter a valid email address." });
    return;
  }

  const existingEmailUser = await prisma.user.findUnique({ where: { email } });
  if (existingEmailUser && existingEmailUser.id !== user.id) {
    sendJson(res, 409, { error: "This email address already exists." });
    return;
  }

  const existingNameUser = await prisma.user.findUnique({ where: { name } });
  if (existingNameUser && existingNameUser.id !== user.id) {
    sendJson(res, 409, { error: "This user name already exists." });
    return;
  }

  const password = String(body.password || "");
  if (password && password.length < 8) {
    sendJson(res, 400, { error: "Please enter a password with at least 8 characters." });
    return;
  }

  const data = {
    name,
    email,
    roles: normalizeRoles(body.roles ?? body.role ?? user.roles),
    active: body.active !== false,
  };
  if (password) {
    data.passwordHash = await hashPassword(password);
    data.mustChangePassword = true;
  }
  const updatedUser = await prisma.user.update({ where: { id: userId }, data });
  refreshSessionsForUser(updatedUser);
  sendJson(res, 200, { user: publicUser(updatedUser) });
}

async function handleDeleteUser(res, userId, currentUserId) {
  if (userId === currentUserId) {
    sendJson(res, 400, { error: "You cannot delete your own user account while signed in." });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    sendJson(res, 404, { error: "User not found." });
    return;
  }

  await prisma.user.delete({ where: { id: userId } });
  removeSessionsForUser(userId);
  sendJson(res, 200, { ok: true });
}

async function requireSession(req, res, options = {}) {
  const session = await getSession(req);
  if (!session) {
    sendJson(res, 401, { error: "Authentication required." });
    return null;
  }

  if (session.user.mustChangePassword && !options.allowPasswordChange) {
    sendJson(res, 403, { error: "Password change required.", passwordChangeRequired: true });
    return null;
  }

  if (options.admin && !userHasRole(session.user, "admin")) {
    sendJson(res, 403, { error: "Admin role required." });
    return null;
  }

  return session;
}

async function getSession(req) {
  const sessionId = getCookie(req, sessionCookieName);
  if (!sessionId) return null;

  const session = sessions.get(sessionId);
  if (!session) return null;

  const user = await prisma.user.findFirst({
    where: {
      id: session.user.id,
      active: true,
    },
  });
  if (!user) {
    sessions.delete(sessionId);
    return null;
  }

  session.user = publicUser(user);
  return session;
}

async function loadUsers() {
  await importLegacyUsersIfNeeded();
  await bootstrapAdminUsers();
  return prisma.user.findMany({ orderBy: [{ createdAt: "asc" }, { name: "asc" }] });
}

async function importLegacyUsersIfNeeded() {
  const userCount = await prisma.user.count();
  if (userCount > 0) return;

  let users = [];
  try {
    const raw = await readFile(legacyUsersFilePath, "utf8");
    const parsed = JSON.parse(raw);
    users = Array.isArray(parsed.users) ? parsed.users : [];
  } catch {
    users = [];
  }

  const legacyUsers = users.map(normalizeStoredUser).filter(Boolean);
  for (const user of legacyUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        roles: user.roles,
        active: user.active,
        passwordHash: user.passwordHash,
        mustChangePassword: user.mustChangePassword,
      },
      create: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        active: user.active,
        passwordHash: user.passwordHash,
        mustChangePassword: user.mustChangePassword,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
      },
    });
  }
}

async function bootstrapAdminUsers() {
  const adminEmails = String(process.env.ADMIN_EMAIL || process.env.ADMIN_EMAILS || "")
    .split(",")
    .map(normalizeEmail)
    .filter(Boolean);
  const adminName = normalizeUserName(process.env.ADMIN_NAME || "Admin");
  const adminPassword = String(process.env.ADMIN_PASSWORD || "");

  for (const email of adminEmails) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: normalizeUserName(existing.name) || adminName,
          roles: ["admin"],
          active: true,
          passwordHash: existing.passwordHash || (adminPassword ? await hashPassword(adminPassword) : ""),
          mustChangePassword: existing.mustChangePassword === true,
        },
      });
      continue;
    }

    await prisma.user.create({
      data: {
        name: adminName,
        email,
        roles: ["admin"],
        active: true,
        passwordHash: adminPassword ? await hashPassword(adminPassword) : "",
        mustChangePassword: false,
      },
    });
  }
}

function normalizeStoredUser(user) {
  const email = normalizeEmail(user.email);
  if (!email) return null;
  const name = normalizeUserName(user.name) || email.split("@")[0] || "User";

  return {
    id: String(user.id || randomUUID()),
    name,
    email,
    roles: normalizeRoles(user.roles ?? user.role),
    active: user.active !== false,
    passwordHash: typeof user.passwordHash === "string" ? user.passwordHash : "",
    mustChangePassword: user.mustChangePassword === true,
    createdAt: user.createdAt || new Date().toISOString(),
    updatedAt: user.updatedAt || user.createdAt || new Date().toISOString(),
  };
}

function publicUser(user) {
  const roles = normalizeRoles(user.roles ?? user.role);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: roles.includes("admin") ? "admin" : roles[0] || "user",
    roles,
    active: user.active !== false,
    mustChangePassword: user.mustChangePassword === true,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function refreshSessionsForUser(user) {
  for (const session of sessions.values()) {
    if (session.user.id === user.id) {
      session.user = publicUser(user);
    }
  }
}

function removeSessionsForUser(userId) {
  for (const [sessionId, session] of sessions.entries()) {
    if (session.user.id === userId) {
      sessions.delete(sessionId);
    }
  }
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString("base64url");
  const derivedKey = await scryptAsync(password, salt, 64);
  return `scrypt:${salt}:${Buffer.from(derivedKey).toString("base64url")}`;
}

async function verifyPassword(password, passwordHash) {
  const [algorithm, salt, storedHash] = String(passwordHash || "").split(":");
  if (algorithm !== "scrypt" || !salt || !storedHash) return false;

  const derivedKey = await scryptAsync(password, salt, 64);
  const storedBuffer = Buffer.from(storedHash, "base64url");
  const derivedBuffer = Buffer.from(derivedKey);
  if (storedBuffer.length !== derivedBuffer.length) return false;

  return timingSafeEqual(storedBuffer, derivedBuffer);
}

function normalizeLoginIdentifier(value) {
  return String(value || "").trim().toLowerCase();
}

function userMatchesIdentifier(user, identifier) {
  return normalizeEmail(user.email) === identifier || normalizeUserName(user.name).toLowerCase() === identifier;
}

function normalizeUserName(value) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, 120);
}

function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function normalizeRoles(value) {
  const rawRoles = Array.isArray(value) ? value : String(value || "").split(",");
  const roles = rawRoles.map((role) => String(role || "").trim()).filter((role) => knownRoles.has(role));
  return [...new Set(roles)];
}

function normalizeApproverIds(value) {
  const rawIds = Array.isArray(value) ? value : [];
  return [...new Set(rawIds.map((id) => String(id || "").trim()).filter(Boolean))];
}

function userHasRole(user, role) {
  const roles = normalizeRoles(user?.roles ?? user?.role);
  return roles.includes("admin") || roles.includes(role);
}

function userHasAnyRole(user, roles) {
  return roles.some((role) => userHasRole(user, role));
}

function userCanSaveProject(user) {
  return userHasAnyRole(user, [
    "admin",
    "productRequirementOwner",
    "softwareRequirementOwner",
    "e2eTestOwner",
    "productRequirementApprover",
    "softwareRequirementApprover",
    "e2eTestApprover",
  ]);
}

function userCanCreateProject(user) {
  return userHasAnyRole(user, [
    "admin",
    "productRequirementOwner",
    "softwareRequirementOwner",
    "e2eTestOwner",
  ]);
}

function userCanLoadApprovers(user) {
  return userHasAnyRole(user, [
    "admin",
    "productRequirementOwner",
    "softwareRequirementOwner",
    "e2eTestOwner",
  ]);
}

function userCanLoadProjectRoleUsers(user) {
  return userCanCreateProject(user);
}

function userCanAnalyzeRequirementType(user, requirementType) {
  if (requirementType === "product" || requirementType === "product-improvement") {
    return userHasRole(user, "productRequirementOwner");
  }

  if (requirementType === "software" || requirementType === "software-improvement") {
    return userHasRole(user, "softwareRequirementOwner");
  }

  if (requirementType === "e2e" || requirementType === "e2e-improvement") {
    return userHasRole(user, "e2eTestOwner");
  }

  if (requirementType === "usecase" || requirementType === "userstory" || requirementType === "app-test") {
    return userHasAnyRole(user, ["softwareRequirementOwner", "e2eTestOwner"]);
  }

  return false;
}

function getCookie(req, name) {
  const cookies = String(req.headers.cookie || "").split(";");
  for (const cookie of cookies) {
    const [rawName, ...rawValue] = cookie.trim().split("=");
    if (rawName === name) {
      return decodeURIComponent(rawValue.join("="));
    }
  }
  return "";
}

function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  for (const [key, optionValue] of Object.entries(options)) {
    if (optionValue === true) {
      parts.push(key);
    } else if (optionValue !== false && optionValue !== undefined && optionValue !== null) {
      parts.push(`${key}=${optionValue}`);
    }
  }
  return parts.join("; ");
}

function cookieOptions() {
  return {
    Path: `${basePath || "/"}`,
    HttpOnly: true,
    SameSite: "Lax",
  };
}

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

async function handleAnalyze(req, res, user) {
  const body = await readJsonBody(req, 3_000_000);
  const requirementType = body.requirementType || "product";
  if (
    requirementType !== "product" &&
    requirementType !== "software" &&
    requirementType !== "software-improvement" &&
    requirementType !== "e2e" &&
    requirementType !== "e2e-improvement" &&
    requirementType !== "product-improvement" &&
    requirementType !== "usecase" &&
    requirementType !== "userstory" &&
    requirementType !== "app-test"
  ) {
    sendJson(res, 400, { error: "Unsupported requirement type." });
    return;
  }

  if (!userCanAnalyzeRequirementType(user, requirementType)) {
    sendJson(res, 403, { error: "Permission required for this requirement type." });
    return;
  }

  const requirements = Array.isArray(body.requirements) ? body.requirements : [];
  const aiUsageContext = await resolveProjectAiUsageContext(res, user, body.projectId);
  if (body.projectId && !aiUsageContext) return;
  const improvementAttachments = cleanImprovementAttachments(body.improvementAttachments);
  const analysisMode = body.analysisMode === "final" ? "final" : "initial";
  const finalChoice = body.finalChoice === "original" ? "original" : "ai";
  const uiLanguage = normalizeUiLanguage(body.uiLanguage);
  const cleaned = requirements
    .map((item) => ({
      rowNumber: Number(item.rowNumber),
      id: String(item.id || "").slice(0, 200),
      sourceId: String(item.sourceId || "").slice(0, 200),
      name: String(item.name || "").slice(0, 500),
      category: String(item.category || "").slice(0, 500),
      subcategory: String(item.subcategory || "").slice(0, 500),
      text: String(item.text || "").trim().slice(0, 6000),
      score: Number(item.score),
      scoreBreakdown: normalizeProductRequirementScoreBreakdown(item.scoreBreakdown),
      originalScoreBreakdown: normalizeProductRequirementScoreBreakdown(item.originalScoreBreakdown),
      finalScoreBreakdown: normalizeProductRequirementScoreBreakdown(item.finalScoreBreakdown),
      techTypes: Array.isArray(item.techTypes)
        ? item.techTypes.map((techType) => String(techType || "").trim().slice(0, 500)).filter(Boolean)
        : [],
      acceptanceCriteria: Array.isArray(item.acceptanceCriteria)
        ? item.acceptanceCriteria.map((criterion) => String(criterion || "").trim().slice(0, 2000)).filter(Boolean)
        : [],
      issues: Array.isArray(item.issues)
        ? item.issues.map(normalizeIncomingQualityIssue).filter(Boolean)
        : [],
      originalIssues: Array.isArray(item.originalIssues)
        ? item.originalIssues.map(normalizeIncomingQualityIssue).filter(Boolean)
        : [],
      finalScore: Number(item.finalScore),
      finalScoreStatus: String(item.finalScoreStatus || "").slice(0, 80),
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
    await handleProductImprovement(cleaned[0], String(body.improvementInstruction || "").trim(), improvementAttachments, uiLanguage, res, aiUsageContext, {
      iterationAttempt: Math.max(1, Number(body.iterationAttempt) || 1),
      maxAttempts: Math.max(1, Number(body.maxAttempts) || 1),
    });
    return;
  }

  if (requirementType === "software") {
    await handleSoftwareDerivation(cleaned, uiLanguage, res, aiUsageContext);
    return;
  }

  if (requirementType === "software-improvement") {
    await handleSoftwareImprovement(cleaned[0], cleanSoftwareRequirement(body.softwareRequirement), String(body.improvementInstruction || "").trim(), improvementAttachments, uiLanguage, res, aiUsageContext);
    return;
  }

  if (requirementType === "e2e") {
    await handleE2eDerivation(cleaned, uiLanguage, res, aiUsageContext);
    return;
  }

  if (requirementType === "e2e-improvement") {
    await handleE2eImprovement(cleaned[0], cleanE2eTestCase(body.testCase), String(body.improvementInstruction || "").trim(), improvementAttachments, uiLanguage, res, aiUsageContext);
    return;
  }

  if (requirementType === "usecase" || requirementType === "userstory" || requirementType === "app-test") {
    await handleWorkflowArtifactDerivation(requirementType, cleaned, uiLanguage, res, aiUsageContext);
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

  const qualityDefinition = productRequirementQualityPromptContext({ uiLanguage });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    sendJson(res, 500, { error: "OPENAI_API_KEY is not configured on the server." });
    return;
  }

  let response;
  try {
    response = await fetchOpenAiResponses({
        model: process.env.OPENAI_MODEL || "gpt-5.5",
        input: [
          {
            role: "system",
            content:
              "You are a senior requirements engineer. Evaluate and improve Product Requirement quality using the provided central quality definition. Be specific, concise, and practical. Return only valid JSON that matches the schema.",
          },
          {
            role: "user",
            content: JSON.stringify({
              task:
                analysisMode === "final"
                  ? "Re-assess the selected final Product Requirement text against every criterion in qualityDefinition. Score the final text as it stands. Keep rewrittenRequirement identical to the selected final text unless a concrete correction is still required. For final reassessment, set originalScore equal to score and originalIssues equal to issues."
                  : "Assess each Product Requirement against every criterion in qualityDefinition. Rewrite the Product Requirement so the generated text addresses all detected weaknesses that can be fixed without inventing domain facts.",
              scoring:
                "Return originalScore, originalScoreBreakdown, and originalIssues for the original input Product Requirement. Return score, scoreBreakdown, verdict, and issues for the rewrittenRequirement. Score 0-100 by applying qualityDefinition.criteria and qualityDefinition.scoringInstructions to the actual returned text. Each score must be the exact sum of its matching breakdown points. Treat the maximum score as an optimization target, never as a default or claimed generator score. Severity must be low, medium, or high.",
              qualityDefinition,
              languageRules: preserveSourceLanguageInstruction(uiLanguage),
              formattingRules: readableArtifactFormattingInstruction(),
              rewritingRules:
                "The rewrittenRequirement must remain a Product Requirement. Do not turn it into a Software Requirement and do not introduce implementation decisions that are not present in or safely inferable from the Product Requirement. It must not include acceptance criteria, Given/When/Then blocks, test steps, or bullet-style verification criteria. Perform the internal self-check from qualityDefinition before output. Report issues only for remaining weaknesses in the rewrittenRequirement.",
              structuredOutputRules:
                "Populate resolvedIssueKeys, remainingIssueKeys, missingInformation, assumptions, and qualityCheck from the qualityDefinition criterion ids. qualityCheck is a non-binding diagnostic prediction and is never the stored Requirement score.",
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
                  items: requirementQualityResultSchema(),
                },
              },
              required: ["results"],
            },
          },
        },
        max_output_tokens: analysisMode === "final" ? 6000 : 20000,
      }, {
        apiKey,
        timeoutMs: analysisMode === "final" ? Number(process.env.OPENAI_FINAL_SCORE_TIMEOUT_MS) || 15_000 : undefined,
      });
  } catch (error) {
    console.error("OpenAI request failed:", error);
    if (analysisMode === "final") {
      sendJson(res, 200, productFinalQualityFallbackPayload(cleaned));
      return;
    }
    sendJson(res, 502, { error: "OpenAI request could not be completed. Check network connectivity and try again." });
    return;
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (analysisMode === "final") {
      sendJson(res, 200, productFinalQualityFallbackPayload(cleaned));
      return;
    }
    sendJson(res, response.status, {
      error: payload.error?.message || "OpenAI request failed.",
    });
    return;
  }

  if (payload.status === "incomplete") {
    if (analysisMode === "final") {
      sendJson(res, 200, productFinalQualityFallbackPayload(cleaned));
      return;
    }
    sendJson(res, 502, {
      error: "OpenAI response was incomplete. Please retry with fewer or shorter requirements.",
    });
    return;
  }

  const outputText = extractOutputText(payload);
  if (!outputText) {
    if (analysisMode === "final") {
      sendJson(res, 200, productFinalQualityFallbackPayload(cleaned));
      return;
    }
    sendJson(res, 502, { error: "OpenAI returned no parseable output." });
    return;
  }

  try {
    const parsed = JSON.parse(outputText);
    if (Array.isArray(parsed.results)) {
      parsed.results = parsed.results.map(normalizeProductRequirementQualityResult);
    }
    enforceProductRequirementScoreBreakdownRules(parsed);
    enforceSoftwareScoreRules(parsed, requirements);
    await recordProjectAiUsage(aiUsageContext, payload, analysisMode === "final" ? AI_USAGE_ACTIONS.SCORE_RECALCULATION : AI_USAGE_ACTIONS.PRODUCT_REQUIREMENT_ANALYSIS);
    sendJson(res, 200, {
      ...parsed,
      openAiUsage: buildOpenAiUsageSummary(payload),
    });
  } catch (error) {
    console.error("OpenAI returned invalid JSON:", error);
    if (analysisMode === "final") {
      sendJson(res, 200, productFinalQualityFallbackPayload(cleaned));
      return;
    }
    sendJson(res, 502, {
      error: "OpenAI returned invalid JSON, likely because the response was too long. Please retry with fewer or shorter requirements.",
    });
  }
}

function productFinalQualityFallbackPayload(requirements) {
  return {
    results: requirements.map((item) => {
      const assessment = assessProductRequirementQuality(item.text);
      return normalizeProductRequirementQualityResult({
        rowNumber: item.rowNumber,
        id: item.id,
        originalScore: assessment.score,
        originalIssues: assessment.issues,
        originalScoreBreakdown: assessment.scoreBreakdown,
        scoreBreakdown: assessment.scoreBreakdown,
        score: assessment.score,
        verdict: assessment.verdict,
        issues: assessment.issues,
        rewrittenRequirement: item.text,
        resolvedIssueKeys: [],
        remainingIssueKeys: assessment.issues.map((issue) => issue.criterion),
        missingInformation: assessment.issues
          .filter((issue) => issue.criterion === "completeness" || issue.criterion === "measurability")
          .map((issue) => issue.suggestion),
        assumptions: [],
        qualityCheck: [],
      });
    }),
    analysisSource: "local-quality-fallback",
  };
}

async function handleTranslateFeedback(req, res, user) {
  const body = await readJsonBody(req, 900_000);
  const uiLanguage = normalizeUiLanguage(body.uiLanguage);
  const aiUsageContext = await resolveProjectAiUsageContext(res, user, body.projectId);
  if (body.projectId && !aiUsageContext) return;
  const requirements = normalizeFeedbackTranslationRequirements(body);
  const legacyItems = !requirements.length && Array.isArray(body.items)
    ? [
        {
          requirementId: "legacy",
          analysisHash: "legacy",
          issues: body.items
            .map((item, index) => ({
              id: String(item?.id || index).slice(0, 160),
              severity: String(item?.severity || "").slice(0, 40),
              criterion: String(item?.criterion || "").slice(0, 1000),
              explanation: String(item?.explanation || "").slice(0, 3000),
              suggestion: String(item?.suggestion || "").slice(0, 3000),
            }))
            .filter((item) => item.criterion || item.explanation || item.suggestion),
        },
      ].filter((item) => item.issues.length)
    : [];
  const translationRequirements = requirements.length ? requirements : legacyItems;

  if (!translationRequirements.length) {
    sendJson(res, 200, { requirements: [], items: [] });
    return;
  }

  if (process.env.OPENAI_MOCK === "true") {
    sendJson(res, 200, {
      locale: uiLanguage,
      requirements: translationRequirements,
      items: translationRequirements.flatMap((requirement) => requirement.issues),
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
              "Translate requirements-engineering quality feedback. Return only valid JSON that matches the schema. Preserve IDs, product names, technical identifiers, numbers, units, and acronyms. Do not add new feedback.",
          },
          {
            role: "user",
            content: JSON.stringify({
              targetLanguage: uiLanguageName(uiLanguage),
              locale: uiLanguage,
              instructions:
                "Translate explanation and suggestion into the target language. Preserve every requirementId, analysisHash, issue id, severity, and criterion exactly. Keep criterion unchanged when it is a machine-readable key such as atomicity, uniqueness, completeness, clarity, consistency, testability, or measurability. Return the same number of requirements and the same number of issues for each requirement. Keep the meaning concise and professional. Do not translate severity enum values, IDs, or technical names.",
              requirements: translationRequirements,
            }),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "translated_quality_feedback",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                locale: { type: "string" },
                requirements: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      requirementId: { type: "string" },
                      analysisHash: { type: "string" },
                      issues: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: false,
                          properties: {
                            id: { type: "string" },
                            severity: { type: "string" },
                            criterion: { type: "string" },
                            explanation: { type: "string" },
                            suggestion: { type: "string" },
                          },
                          required: ["id", "severity", "criterion", "explanation", "suggestion"],
                        },
                      },
                    },
                    required: ["requirementId", "analysisHash", "issues"],
                  },
                },
              },
              required: ["locale", "requirements"],
            },
          },
        },
        max_output_tokens: 12000,
      }),
    });
  } catch (error) {
    console.error("OpenAI feedback translation failed:", error);
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
    const translatedRequirements = Array.isArray(parsed.requirements) ? parsed.requirements : [];
    await recordProjectAiUsage(aiUsageContext, payload, AI_USAGE_ACTIONS.TRANSLATION);
    sendJson(res, 200, {
      locale: normalizeUiLanguage(parsed.locale || uiLanguage),
      requirements: translatedRequirements,
      items: translatedRequirements.flatMap((requirement) => Array.isArray(requirement.issues) ? requirement.issues : []),
      openAiUsage: buildOpenAiUsageSummary(payload),
    });
  } catch (error) {
    console.error("Could not parse OpenAI feedback translation output:", outputText, error);
    sendJson(res, 502, { error: "OpenAI returned invalid JSON." });
  }
}

function normalizeFeedbackTranslationRequirements(body) {
  if (!Array.isArray(body.requirements)) return [];

  return body.requirements
    .slice(0, 20)
    .map((requirement) => ({
      requirementId: String(requirement?.requirementId || "").slice(0, 240),
      analysisHash: String(requirement?.analysisHash || "").slice(0, 120),
      issues: Array.isArray(requirement?.issues)
        ? requirement.issues
            .slice(0, 30)
            .map((issue) => ({
              id: String(issue?.id || "").slice(0, 160),
              severity: String(issue?.severity || "").slice(0, 40),
              criterion: String(issue?.criterion || "").slice(0, 1000),
              explanation: String(issue?.explanation || "").slice(0, 3000),
              suggestion: String(issue?.suggestion || "").slice(0, 3000),
            }))
            .filter((issue) => issue.id && (issue.explanation || issue.suggestion))
        : [],
    }))
    .filter((requirement) => requirement.requirementId && requirement.analysisHash && requirement.issues.length);
}

function normalizeUiLanguage(value) {
  return value === "en" ? "en" : "de";
}

function uiLanguageName(language) {
  return language === "en" ? "English" : "German";
}

function preserveSourceLanguageInstruction(uiLanguage = "de") {
  return `Preserve the source language of each requirement or test case for PR text, SR text, acceptance criteria, E2E descriptions, groups, preconditions, test data, test steps, and expected results. German source artifacts must remain German; English source artifacts must remain English. However, write user-facing quality feedback text fields in ${uiLanguageName(uiLanguage)}: explanation, suggestion, verdict, rationale, and any remaining issue descriptions. Keep criterion as a language-neutral lowercase key where possible, for example atomicity, uniqueness, completeness, clarity, consistency, testability, measurability, ambiguity, or feasibility. Keep severity enum values exactly low, medium, or high. Preserve IDs and technical names unchanged.`;
}

function readableArtifactFormattingInstruction() {
  return "Format generated and improved artifact text for human readability, not as one dense paragraph. Use logical line breaks, short paragraphs, and blank lines between distinct topics when the text contains multiple conditions, states, responsibilities, or outcomes. For enumerations or repeated conditions, use clean bullet-list style wording inside the returned string fields. Preserve valid JSON by encoding line breaks as newline characters in string values. Keep formatting consistent and avoid decorative markdown tables. Do not add acceptance criteria, Given/When/Then blocks, test steps, or verification bullet lists where the task explicitly forbids them.";
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

async function handlePdfImport(req, res) {
  let body;
  try {
    body = await readJsonBody(req, Math.ceil(PDF_IMPORT_MAX_BYTES * 1.45));
  } catch {
    sendJson(res, 400, { error: "Die PDF-Anfrage konnte nicht gelesen werden." });
    return;
  }

  const fileName = String(body.fileName || "");
  const mimeType = String(body.mimeType || "");
  const rawBase64 = String(body.data || "");
  let buffer;
  try {
    buffer = Buffer.from(rawBase64, "base64");
  } catch {
    sendJson(res, 400, { error: "Die PDF-Datei konnte nicht dekodiert werden." });
    return;
  }

  const validation = validatePdfUpload({ fileName, mimeType, size: buffer.length, bytes: buffer });
  if (!validation.valid) {
    sendJson(res, 400, { error: validation.errors.join(" "), errors: validation.errors, category: "Ungültige Datei" });
    return;
  }

  const startedAt = Date.now();
  console.info(JSON.stringify({
    event: "pdf_import_started",
    format: "pdf",
    fileSize: buffer.length,
  }));

  const result = await parseProductRequirementsPdf(buffer, { fileName });
  console.info(JSON.stringify({
    event: result.errors.length ? "pdf_import_completed_with_findings" : "pdf_import_completed",
    format: "pdf",
    durationMs: Date.now() - startedAt,
    requirements: result.summary.requirementCount,
    techTypes: result.summary.techTypeCount,
    warnings: result.summary.warningCount,
    errors: result.summary.errorCount,
  }));

  if (result.errors.length || Number(result.summary?.errorCount) > 0 || Number(result.summary?.errorRequirementCount) > 0) {
    sendJson(res, 422, {
      ...result,
      category: result.requirements.length ? "Fehlende Pflichtfelder" : "Erwartetes Importformat nicht erkannt",
      error: result.errors.slice(0, 3).join(" ") || "Die Struktur des PDFs entspricht nicht dem erwarteten Confluence-Exportformat.",
    });
    return;
  }

  sendJson(res, 200, result);
}

async function handleExcelImportValidation(req, res) {
  let body;
  try {
    body = await readJsonBody(req, Math.ceil(EXCEL_IMPORT_MAX_BYTES * 1.45));
  } catch {
    sendJson(res, 400, {
      error: "Die Excel-Anfrage konnte nicht gelesen werden.",
      errors: ["Die Excel-Anfrage konnte nicht gelesen werden."],
      category: "Datei kann nicht gelesen werden",
    });
    return;
  }

  const fileName = String(body.fileName || "");
  const mimeType = String(body.mimeType || "");
  const rawBase64 = String(body.data || "");
  let buffer;
  try {
    buffer = Buffer.from(rawBase64, "base64");
  } catch {
    sendJson(res, 400, {
      error: "Die Excel-Datei konnte nicht dekodiert werden.",
      errors: ["Die Excel-Datei konnte nicht dekodiert werden."],
      category: "Datei kann nicht gelesen werden",
    });
    return;
  }

  const startedAt = Date.now();
  const result = await validateExcelImport(buffer, { fileName, mimeType });
  console.info(JSON.stringify({
    event: result.ok ? "excel_import_validation_completed" : "excel_import_validation_failed",
    format: "xlsx",
    durationMs: Date.now() - startedAt,
    requirements: result.summary?.requirementCount || 0,
    warnings: result.summary?.warningCount || 0,
    errors: result.summary?.errorCount || 0,
  }));

  if (!result.ok) {
    sendJson(res, 422, {
      ...result,
      error: result.errors.slice(0, 3).join(" "),
    });
    return;
  }

  sendJson(res, 200, result);
}

async function handleProductImprovement(requirement, improvementInstruction, improvementAttachments, uiLanguage, res, aiUsageContext = null, options = {}) {
  if (!requirement?.text) {
    sendJson(res, 400, { error: "Product Requirement is required." });
    return;
  }

  if (!improvementInstruction) {
    sendJson(res, 400, { error: "Improvement instruction is required." });
    return;
  }

  if (process.env.OPENAI_MOCK === "true") {
    const rewrittenRequirement = sanitizeProductImprovementRequirementText(`${requirement.text}\n\n${improvementInstruction}.`);
    const originalAssessment = assessProductRequirementQuality(requirement.text);
    const assessment = assessProductRequirementQuality(rewrittenRequirement);
    sendJson(res, 200, {
      result: {
        rowNumber: requirement.rowNumber,
        id: requirement.id,
        originalScore: originalAssessment.score,
        originalIssues: originalAssessment.issues,
        originalScoreBreakdown: originalAssessment.scoreBreakdown,
        scoreBreakdown: assessment.scoreBreakdown,
        score: assessment.score,
        verdict: assessment.verdict,
        issues: assessment.issues,
        rewrittenRequirement,
        resolvedIssueKeys: [],
        remainingIssueKeys: assessment.issues.map((issue) => issue.criterion),
        missingInformation: [],
        assumptions: [],
        qualityCheck: [],
      },
    });
    return;
  }

  const qualityDefinition = productRequirementQualityPromptContext({ uiLanguage });
  const knownIssues = [
    ...(Array.isArray(requirement.issues) ? requirement.issues : []),
    ...(Array.isArray(requirement.originalIssues) ? requirement.originalIssues : []),
  ];
  const uniqueKnownIssues = [...new Map(knownIssues.map((issue) => [
    `${issue.criterion}:${issue.explanation}:${issue.suggestion}`,
    issue,
  ])).values()];
  const activeScoreBreakdown = requirement.finalScoreBreakdown || requirement.scoreBreakdown || requirement.originalScoreBreakdown || null;
  const currentCriterionScores = qualityDefinition.criteria.map((criterion) => {
    const entry = activeScoreBreakdown?.[criterion.id] || {};
    const points = Number(entry.points);
    const currentPoints = Number.isFinite(points) ? points : null;
    return {
      criterionId: criterion.id,
      maxPoints: criterion.maxPoints,
      currentPoints,
      missingPoints: currentPoints == null ? null : Math.max(0, criterion.maxPoints - currentPoints),
      status: currentPoints == null ? "unknown" : currentPoints >= criterion.maxPoints ? "fulfilled" : "needs_improvement",
    };
  });
  const scoreGaps = currentCriterionScores.filter((entry) => entry.missingPoints == null || entry.missingPoints > 0);
  const improvementContext = {
    currentRequirementContent: requirement.text,
    currentRequirementVersion: requirement.sourceId || requirement.id || requirement.rowNumber || "",
    originalRequirement: requirement.text,
    category: requirement.category || "",
    subcategory: requirement.subcategory || "",
    requirementName: requirement.name || "",
    currentScore: Number.isFinite(Number(requirement.finalScore)) ? Number(requirement.finalScore) : Number(requirement.score),
    maximumScore: qualityDefinition.maximumScore,
    targetScore: qualityDefinition.maximumScore,
    targetScoreInstruction: "Try to create a fachlich korrektes Product Requirement that should receive 100/100 in the independent scoring. Do not claim, store, or force this score.",
    iterationAttempt: Math.max(1, Number(options.iterationAttempt) || 1),
    maxAttempts: Math.max(1, Number(options.maxAttempts) || 1),
    finalScoreStatus: requirement.finalScoreStatus || "",
    currentCriterionScores,
    scoreGaps,
    fulfilledCriteria: qualityDefinition.criteria
      .filter((criterion) => {
        const scoreEntry = currentCriterionScores.find((entry) => entry.criterionId === criterion.id);
        if (scoreEntry && scoreEntry.status !== "fulfilled") return false;
        return !uniqueKnownIssues.some((issue) => String(issue.criterion || "").toLowerCase().includes(criterion.id));
      })
      .map((criterion) => criterion.id),
    openCriteria: [
      ...new Set([
        ...scoreGaps.map((entry) => entry.criterionId),
        ...uniqueKnownIssues.map((issue) => issue.criterion).filter(Boolean),
      ]),
    ],
    analysisFindings: uniqueKnownIssues,
  };
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
              "You are a senior product requirements engineer. Improve one Product Requirement against the provided central quality definition and the actual current score findings. Return only valid JSON that matches the schema.",
          },
          {
            role: "user",
            content: JSON.stringify({
              task:
                "Improve the Product Requirement according to the improvement instruction, improvementContext, and every criterion in qualityDefinition. The explicit optimization target is a fachlich korrektes Requirement that should independently score 100/100. Use all nine quality criteria and their maxPoints exactly as provided. Resolve all current score gaps that can be resolved by rewriting, especially criteria listed in improvementContext.scoreGaps and openCriteria. Preserve already fulfilled criteria, intent, scope, category/subcategory relevance, product level, solution neutrality, formatting that carries meaning, and all factual information. Do not turn it into a Software Requirement. Do not add acceptance criteria, Given/When/Then blocks, test steps, or implementation details. Never invent facts, thresholds, interfaces, responsibilities, platforms, or product behavior to reach 100/100, and never claim a binding score. The result.rewrittenRequirement field must contain only the optimized Product Requirement text itself. It must not contain headings or sections such as Verbesserungen, Hinweise, Begründung, Optimierungen, Erwarteter Score, Score, Qualitätskriterien, criteria, markdown code fences, introductory comments, closing comments, quality explanations, score explanations, issue lists, or single-criterion ratings. Put diagnostics only into the structured diagnostic fields.",
              qualityDefinition,
              improvementContext,
              languageRules: preserveSourceLanguageInstruction(uiLanguage),
              formattingRules: readableArtifactFormattingInstruction(),
              attachmentRules: attachmentInstruction(improvementAttachments),
              missingInformationRules:
                "Distinguish fixable wording/structure gaps from missing domain facts. If a needed threshold, response time, target platform, responsibility, error behavior, interface, or system state is absent from the provided context, mark it in missingInformation or as an open point in rewrittenRequirement when needed. Never fabricate it to reach the target score.",
              internalSelfCheck:
                "Before returning, internally check the draft against every qualityDefinition criterion in order: clarity, completeness, testability, measurability, atomicity, consistency, solution_neutrality, feasibility, and format_and_semantic_structure. Revise any criterion that is partial or missing, then check the complete draft again. Protect criteria that are already fulfilled from regression. Return the optimized rewrittenRequirement plus structured diagnostics. qualityCheck is only a diagnostic prediction and is never the stored score. Never include qualityCheck, score, issues, missingInformation, assumptions, or explanatory labels inside rewrittenRequirement.",
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
    if (parsed.result) {
      parsed.result = normalizeProductRequirementQualityResult(parsed.result);
      parsed.result.rewrittenRequirement = sanitizeProductImprovementRequirementText(parsed.result.rewrittenRequirement);
      enforceProductRequirementScoreBreakdownRules({ results: [parsed.result] });
    }
    await recordProjectAiUsage(aiUsageContext, payload, AI_USAGE_ACTIONS.IMPROVEMENT_SUGGESTION);
    sendJson(res, 200, {
      ...parsed,
      openAiUsage: buildOpenAiUsageSummary(payload),
    });
  } catch (error) {
    console.error("Could not parse OpenAI product improvement output:", outputText, error);
    sendJson(res, 502, { error: "OpenAI returned invalid JSON." });
  }
}

function sanitizeProductImprovementRequirementText(value) {
  const forbiddenHeadingPattern = /^[-*]?\s*(verbesserungen|hinweise|begründung|begruendung|optimierungen|erwarteter score|expected score|score|qualitätskriterien|qualitaetskriterien|quality criteria|criteria|bewertung)\s*:/i;
  return String(value || "")
    .replace(/```[a-zA-Z0-9_-]*\n?/g, "")
    .replace(/```/g, "")
    .split(/\r?\n/)
    .filter((line) => !forbiddenHeadingPattern.test(line.trim()))
    .join("\n")
    .trim();
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

function normalizeIncomingQualityIssue(issue) {
  if (!issue || typeof issue !== "object") return null;
  const severity = ["low", "medium", "high"].includes(issue.severity) ? issue.severity : "medium";
  return {
    criterion: String(issue.criterion || "").slice(0, 200),
    severity,
    explanation: String(issue.explanation || "").slice(0, 2000),
    suggestion: String(issue.suggestion || "").slice(0, 2000),
  };
}

function requirementQualityResultSchema() {
  const structuredOutputFields = productRequirementStructuredOutputSchemaExtension();
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
      originalScoreBreakdown: scoreBreakdownJsonSchema(),
      scoreBreakdown: scoreBreakdownJsonSchema(),
      score: { type: "number" },
      verdict: { type: "string" },
      issues: {
        type: "array",
        items: issueSchema(),
      },
      rewrittenRequirement: { type: "string" },
      ...structuredOutputFields,
    },
    required: [
      "rowNumber",
      "id",
      "originalScore",
      "originalIssues",
      "originalScoreBreakdown",
      "scoreBreakdown",
      "score",
      "verdict",
      "issues",
      "rewrittenRequirement",
      "resolvedIssueKeys",
      "remainingIssueKeys",
      "missingInformation",
      "assumptions",
      "qualityCheck",
    ],
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

async function handleCreateProject(req, res, user) {
  const body = await readJsonBody(req, 75_000_000);
  const data = parseProjectPayload(body);
  if (data.error) {
    sendJson(res, data.status, { error: data.error });
    return;
  }

  const project = await createNewProject(user, data, body.action || "created");
  sendJson(res, 201, {
    project: projectSummary(project),
    projectId: project.id,
  });
}

async function handleListProjects(res, user) {
  const projects = await prisma.project.findMany({
    where: projectAccessWhere(user),
    include: {
      owner: true,
      members: true,
    },
    orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
  });

  sendJson(res, 200, { projects: projects.map(projectSummary) });
}

async function handleGetProject(res, user, projectId) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ...projectAccessWhere(user),
    },
  });

  if (!project) {
    sendJson(res, 404, { error: "Project not found." });
    return;
  }

  sendJson(res, 200, {
    project: projectSummary(project),
    payload: project.content,
  });
}

async function handleListProjectRevisions(res, user, projectId) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ...projectAccessWhere(user),
    },
  });

  if (!project) {
    sendJson(res, 404, { error: "Project not found." });
    return;
  }

  const revisions = await prisma.projectRevision.findMany({
    where: { projectId },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 80,
  });

  sendJson(res, 200, { revisions: revisions.map(projectRevisionSummary) });
}

async function handleProjectAiUsage(res, user, projectId, searchParams) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ...projectAccessWhere(user),
    },
    select: { id: true },
  });

  if (!project) {
    sendJson(res, 404, { error: "Project not found." });
    return;
  }

  const backfill = await backfillProjectAiUsageCosts(projectId);
  const filters = projectAiUsageFilters(projectId, searchParams);
  const page = Math.max(Number(searchParams.get("page")) || 1, 1);
  const pageSize = Math.min(Math.max(Number(searchParams.get("pageSize")) || 25, 1), 100);
  const currentMonthStart = new Date();
  currentMonthStart.setUTCDate(1);
  currentMonthStart.setUTCHours(0, 0, 0, 0);

  const [summaryRows, monthRows, actionRows, modelRows, periodRows, records, totalRecords] = await Promise.all([
    prisma.projectAiUsage.aggregate({
      where: filters.where,
      _count: { _all: true },
      _sum: {
        inputTokens: true,
        cachedInputTokens: true,
        outputTokens: true,
        totalTokens: true,
        inputCost: true,
        outputCost: true,
        cachedInputCost: true,
        totalCost: true,
      },
      _max: { createdAt: true },
    }),
    prisma.projectAiUsage.aggregate({
      where: {
        ...filters.where,
        createdAt: { gte: currentMonthStart },
      },
      _sum: { totalCost: true },
    }),
    prisma.projectAiUsage.groupBy({
      by: ["action"],
      where: filters.where,
      _count: { _all: true },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        totalTokens: true,
        inputCost: true,
        outputCost: true,
        cachedInputCost: true,
        totalCost: true,
      },
      orderBy: { _sum: { totalCost: "desc" } },
    }),
    prisma.projectAiUsage.groupBy({
      by: ["model"],
      where: filters.where,
      _count: { _all: true },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        totalTokens: true,
        totalCost: true,
      },
      orderBy: { _sum: { totalCost: "desc" } },
    }),
    prisma.$queryRaw`
      SELECT date_trunc('month', "createdAt") AS period,
             count(*)::int AS calls,
             coalesce(sum("inputTokens"), 0)::int AS "inputTokens",
             coalesce(sum("outputTokens"), 0)::int AS "outputTokens",
             coalesce(sum("totalTokens"), 0)::int AS "totalTokens",
             coalesce(sum("inputCost"), 0)::text AS "inputCost",
             coalesce(sum("outputCost"), 0)::text AS "outputCost",
             coalesce(sum("cachedInputCost"), 0)::text AS "cachedInputCost",
             coalesce(sum("totalCost"), 0)::text AS "totalCost"
      FROM "ProjectAiUsage"
      WHERE "projectId" = ${projectId}
      GROUP BY period
      ORDER BY period DESC
      LIMIT 24
    `,
    prisma.projectAiUsage.findMany({
      where: filters.where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.projectAiUsage.count({ where: filters.where }),
  ]);

  const statusCounts = await prisma.projectAiUsage.groupBy({
    by: ["status"],
    where: { projectId },
    _count: { _all: true },
  });

  sendJson(res, 200, {
    captureStartedAt: AI_USAGE_CAPTURE_STARTED_AT,
    currency: "USD",
    pricingVersion: AI_USAGE_PRICING_VERSION,
    backfill,
    summary: {
      requestCount: summaryRows._count._all,
      inputTokens: summaryRows._sum.inputTokens || 0,
      cachedInputTokens: summaryRows._sum.cachedInputTokens || 0,
      outputTokens: summaryRows._sum.outputTokens || 0,
      totalTokens: summaryRows._sum.totalTokens || 0,
      totalCost: decimalToString(summaryRows._sum.totalCost),
      currentMonthCost: decimalToString(monthRows._sum.totalCost),
      lastCallAt: summaryRows._max.createdAt,
      incompleteCount: statusCounts
        .filter((item) => item.status !== "captured")
        .reduce((sum, item) => sum + item._count._all, 0),
    },
    breakdowns: {
      byAction: actionRows.map(projectAiUsageGroupSummary("action")),
      byModel: modelRows.map(projectAiUsageGroupSummary("model")),
      byPeriod: periodRows.map((row) => ({
        key: row.period instanceof Date ? row.period.toISOString().slice(0, 7) : String(row.period || ""),
        requestCount: Number(row.calls) || 0,
        inputTokens: Number(row.inputTokens) || 0,
        outputTokens: Number(row.outputTokens) || 0,
        totalTokens: Number(row.totalTokens) || 0,
        inputCost: decimalToString(row.inputCost),
        outputCost: decimalToString(row.outputCost),
        cachedInputCost: decimalToString(row.cachedInputCost),
        totalCost: decimalToString(row.totalCost),
      })),
    },
    filters: {
      actions: actionRows.map((item) => item.action).filter(Boolean),
      models: modelRows.map((item) => item.model).filter(Boolean),
      statuses: statusCounts.map((item) => item.status).filter(Boolean),
    },
    records: records.map(projectAiUsageSummary),
    pagination: {
      page,
      pageSize,
      totalRecords,
      totalPages: Math.max(Math.ceil(totalRecords / pageSize), 1),
    },
  });
}

async function handleListRequirementAttachments(res, user, projectId, requirementId) {
  const project = await findAccessibleProject(user, projectId);
  if (!project || !projectRequirementExists(project.content, requirementId)) {
    sendJson(res, 404, { error: "Requirement not found." });
    return;
  }

  const attachments = await prisma.projectRequirementAttachment.findMany({
    where: { projectId, requirementId },
    include: { uploadedBy: true },
    orderBy: { uploadedAt: "desc" },
  });
  sendJson(res, 200, { attachments: attachments.map(attachmentSummary) });
}

async function handleProjectAttachmentCounts(res, user, projectId) {
  const project = await findAccessibleProject(user, projectId);
  if (!project) {
    sendJson(res, 404, { error: "Project not found." });
    return;
  }

  const validRequirementIds = new Set((Array.isArray(project.content?.state?.requirements) ? project.content.state.requirements : [])
    .map(requirementStableId)
    .filter(Boolean));
  const rows = await prisma.projectRequirementAttachment.groupBy({
    by: ["requirementId"],
    where: { projectId },
    _count: { _all: true },
  });
  sendJson(res, 200, {
    counts: Object.fromEntries(rows
      .filter((row) => validRequirementIds.has(row.requirementId))
      .map((row) => [row.requirementId, row._count._all])),
  });
}

async function handleUploadRequirementAttachments(req, res, user, projectId, requirementId) {
  if (!userCanEditRequirementAttachments(user)) {
    sendJson(res, 403, { error: "Attachment upload permission required." });
    return;
  }

  const project = await findAccessibleProject(user, projectId);
  if (!project || !projectRequirementExists(project.content, requirementId)) {
    sendJson(res, 404, { error: "Requirement not found." });
    return;
  }

  let body;
  try {
    body = await readJsonBody(req, Math.ceil(REQUIREMENT_ATTACHMENT_MAX_BYTES * REQUIREMENT_ATTACHMENT_MAX_FILES * 1.45));
  } catch {
    sendJson(res, 400, { error: "Attachment request could not be read." });
    return;
  }

  const files = Array.isArray(body.files) ? body.files.slice(0, REQUIREMENT_ATTACHMENT_MAX_FILES) : [];
  if (!files.length) {
    sendJson(res, 400, { error: "No attachment files provided." });
    return;
  }
  if (Array.isArray(body.files) && body.files.length > REQUIREMENT_ATTACHMENT_MAX_FILES) {
    sendJson(res, 400, { error: `Maximal ${REQUIREMENT_ATTACHMENT_MAX_FILES} Dateien pro Upload-Vorgang.` });
    return;
  }

  const preparedFiles = [];
  for (const file of files) {
    const buffer = Buffer.from(String(file.data || ""), "base64");
    const validation = validateAttachmentFile({
      fileName: file.fileName,
      mimeType: String(file.mimeType || ""),
      buffer,
    });
    if (!validation.valid) {
      sendJson(res, 400, { error: validation.errors[0], errors: validation.errors });
      return;
    }
    preparedFiles.push({
      buffer,
      validation,
      description: String(file.description || "").trim().slice(0, 500),
    });
  }

  const createdAttachments = [];
  const savedKeys = [];
  try {
    for (const preparedFile of preparedFiles) {
      const storageKey = await attachmentStorage.save(preparedFile.buffer, {
        projectId,
        requirementId,
        extension: preparedFile.validation.extension,
      });
      savedKeys.push(storageKey);
      const attachment = await prisma.projectRequirementAttachment.create({
        data: {
          projectId,
          requirementId,
          originalFileName: preparedFile.validation.originalFileName,
          storageKey,
          mimeType: preparedFile.validation.mimeType,
          fileSize: preparedFile.validation.fileSize,
          uploadedByUserId: user.id,
          description: preparedFile.description,
          checksum: preparedFile.validation.checksum,
        },
        include: { uploadedBy: true },
      });
      createdAttachments.push(attachment);
    }
  } catch (error) {
    console.error("Requirement attachment upload failed:", { projectId, requirementId, error: error.message });
    await Promise.allSettled(savedKeys.map((storageKey) => attachmentStorage.delete(storageKey)));
    if (createdAttachments.length) {
      await prisma.projectRequirementAttachment.deleteMany({
        where: { id: { in: createdAttachments.map((attachment) => attachment.id) } },
      });
    }
    sendJson(res, 500, { error: "Der Anhang konnte nicht gespeichert werden. Bitte versuche es erneut." });
    return;
  }

  sendJson(res, 201, { attachments: createdAttachments.map(attachmentSummary) });
}

async function handleDownloadRequirementAttachment(res, user, projectId, attachmentId) {
  const attachment = await findAuthorizedAttachment(user, projectId, attachmentId);
  if (!attachment) {
    sendJson(res, 404, { error: "Der Anhang wurde nicht gefunden." });
    return;
  }

  let buffer;
  try {
    buffer = await attachmentStorage.get(attachment.storageKey);
  } catch {
    sendJson(res, 404, { error: "Der Anhang wurde nicht gefunden." });
    return;
  }

  res.writeHead(200, {
    "Content-Type": attachment.mimeType,
    "Content-Length": buffer.length,
    "Content-Disposition": attachment.mimeType.startsWith("image/")
      ? contentDispositionInline(attachment.originalFileName)
      : contentDispositionAttachment(attachment.originalFileName),
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, no-store",
  });
  res.end(buffer);
}

async function handleDeleteRequirementAttachment(res, user, projectId, attachmentId) {
  if (!userCanEditRequirementAttachments(user)) {
    sendJson(res, 403, { error: "Attachment delete permission required." });
    return;
  }

  const attachment = await findAuthorizedAttachment(user, projectId, attachmentId);
  if (!attachment) {
    sendJson(res, 404, { error: "Der Anhang wurde nicht gefunden." });
    return;
  }

  try {
    await attachmentStorage.delete(attachment.storageKey);
    await prisma.projectRequirementAttachment.delete({ where: { id: attachment.id } });
  } catch (error) {
    console.error("Requirement attachment delete failed:", { projectId, attachmentId, error: error.message });
    sendJson(res, 500, { error: "Der Anhang konnte nicht gelöscht werden." });
    return;
  }

  sendJson(res, 200, { ok: true });
}

async function handleUpdateProject(req, res, user, projectId) {
  const body = await readJsonBody(req, 75_000_000);
  const data = parseProjectPayload(body, projectId);
  if (data.error) {
    sendJson(res, data.status, { error: data.error });
    return;
  }

  const existingProject = await prisma.project.findFirst({
    where: {
      id: projectId,
      ...projectAccessWhere(user),
    },
  });

  if (!existingProject) {
    sendJson(res, 404, { error: "Project not found." });
    return;
  }

  const attachmentsCleaned = await cleanupRemovedRequirementAttachments(projectId, existingProject.content, data.content);
  if (!attachmentsCleaned) {
    sendJson(res, 500, { error: "Projektanhänge konnten nicht bereinigt werden." });
    return;
  }

  const project = await prisma.$transaction(async (tx) => {
    const updatedProject = await tx.project.update({
      where: { id: projectId },
      data: {
        name: data.name,
        description: data.description,
        content: data.content,
      },
    });
    await tx.projectRevision.create({
      data: {
        projectId,
        userId: user.id,
        action: normalizeRevisionAction(body.action || "autosave"),
        content: data.content,
      },
    });
    await syncProjectApprovalMembers(tx, projectId, data.content, existingProject.ownerId);
    await pruneProjectRevisions(tx, projectId);
    return updatedProject;
  });

  sendJson(res, 200, {
    project: projectSummary(project),
    projectId: project.id,
  });
}

async function handleRestoreProjectRevision(res, user, projectId, revisionId) {
  const existingProject = await prisma.project.findFirst({
    where: {
      id: projectId,
      ...projectAccessWhere(user),
    },
  });

  if (!existingProject) {
    sendJson(res, 404, { error: "Project not found." });
    return;
  }

  const revision = await prisma.projectRevision.findFirst({
    where: {
      id: revisionId,
      projectId,
    },
  });

  if (!revision) {
    sendJson(res, 404, { error: "Project revision not found." });
    return;
  }

  const data = parseProjectPayload({ content: revision.content }, projectId);
  if (data.error) {
    sendJson(res, data.status, { error: data.error });
    return;
  }

  const attachmentsCleaned = await cleanupRemovedRequirementAttachments(projectId, existingProject.content, data.content);
  if (!attachmentsCleaned) {
    sendJson(res, 500, { error: "Projektanhänge konnten nicht bereinigt werden." });
    return;
  }

  const project = await prisma.$transaction(async (tx) => {
    const restoredProject = await tx.project.update({
      where: { id: projectId },
      data: {
        name: data.name,
        description: data.description,
        content: data.content,
      },
    });
    await tx.projectRevision.create({
      data: {
        projectId,
        userId: user.id,
        action: "Projektstand wiederhergestellt",
        content: data.content,
      },
    });
    await syncProjectApprovalMembers(tx, projectId, data.content, existingProject.ownerId);
    await pruneProjectRevisions(tx, projectId);
    return restoredProject;
  });

  sendJson(res, 200, {
    project: projectSummary(project),
    projectId: project.id,
    payload: project.content,
  });
}

async function handleDeleteProject(res, projectId) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    sendJson(res, 404, { error: "Project not found." });
    return;
  }

  const attachments = await prisma.projectRequirementAttachment.findMany({
    where: { projectId },
    select: { storageKey: true },
  });
  try {
    await Promise.all(attachments.map((attachment) => attachmentStorage.delete(attachment.storageKey)));
  } catch (error) {
    console.error("Project attachment cleanup failed:", { projectId, error: error.message });
    sendJson(res, 500, { error: "Project attachments could not be deleted." });
    return;
  }

  await prisma.project.delete({ where: { id: projectId } });
  sendJson(res, 200, { ok: true });
}

async function createNewProject(user, data, action = "created") {
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        id: data.id,
        name: data.name,
        description: data.description,
        content: data.content,
        ownerId: user.id,
        members: {
          create: {
            userId: user.id,
            role: "owner",
          },
        },
      },
    });
    await tx.projectRevision.create({
      data: {
        projectId: project.id,
        userId: user.id,
        action: normalizeRevisionAction(action),
        content: data.content,
      },
    });
    await syncProjectApprovalMembers(tx, project.id, data.content, user.id);
    return project;
  });
}

async function syncProjectApprovalMembers(tx, projectId, content, ownerId = "") {
  const productRequirementOwnerId = String(content?.project?.productRequirementOwnerId || "").trim();
  const approverIds = normalizeApproverIds(
    Array.isArray(content?.state?.productApprovalApproverIds)
      ? content.state.productApprovalApproverIds
      : [],
  ).filter((approverId) => approverId && approverId !== ownerId && approverId !== productRequirementOwnerId);

  if (productRequirementOwnerId && productRequirementOwnerId !== ownerId) {
    await tx.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId,
          userId: productRequirementOwnerId,
        },
      },
      update: {
        role: "productRequirementOwner",
      },
      create: {
        projectId,
        userId: productRequirementOwnerId,
        role: "productRequirementOwner",
      },
    });
  }

  await Promise.all(approverIds.map((approverId) =>
    tx.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId,
          userId: approverId,
        },
      },
      update: {
        role: "productRequirementApprover",
      },
      create: {
        projectId,
        userId: approverId,
        role: "productRequirementApprover",
      },
    }),
  ));
}

function projectAccessWhere(user) {
  if (userHasRole(user, "admin")) return {};

  return {
    OR: [
      { ownerId: user.id },
      {
        members: {
          some: {
            userId: user.id,
          },
        },
      },
      {
        content: {
          path: ["state", "productApprovalApproverIds"],
          array_contains: [user.id],
        },
      },
      {
        content: {
          path: ["project", "productRequirementOwnerId"],
          equals: user.id,
        },
      },
    ],
  };
}

async function findAccessibleProject(user, projectId) {
  return prisma.project.findFirst({
    where: {
      id: projectId,
      ...projectAccessWhere(user),
    },
  });
}

function projectRequirementExists(content, requirementId) {
  const id = String(requirementId || "");
  return projectRequirementIds(content).includes(id);
}

function projectRequirementIds(content) {
  const requirements = Array.isArray(content?.state?.requirements) ? content.state.requirements : [];
  return requirements.map(requirementStableId).filter(Boolean);
}

function requirementStableId(requirement) {
  return String(requirement?.id || requirement?.sourceId || requirement?.rowNumber || "").trim();
}

async function cleanupRemovedRequirementAttachments(projectId, previousContent, nextContent) {
  const nextRequirementIds = new Set(projectRequirementIds(nextContent));
  const removedRequirementIds = projectRequirementIds(previousContent).filter((requirementId) => !nextRequirementIds.has(requirementId));
  if (!removedRequirementIds.length) return true;

  const attachments = await prisma.projectRequirementAttachment.findMany({
    where: {
      projectId,
      requirementId: { in: removedRequirementIds },
    },
    select: { id: true, storageKey: true },
  });
  if (!attachments.length) return true;

  try {
    await Promise.all(attachments.map((attachment) => attachmentStorage.delete(attachment.storageKey)));
    await prisma.projectRequirementAttachment.deleteMany({
      where: { id: { in: attachments.map((attachment) => attachment.id) } },
    });
    return true;
  } catch (error) {
    console.error("Removed requirement attachment cleanup failed:", { projectId, error: error.message });
    return false;
  }
}

function userCanEditRequirementAttachments(user) {
  return userHasAnyRole(user, ["admin", "productRequirementOwner"]);
}

async function findAuthorizedAttachment(user, projectId, attachmentId) {
  const project = await findAccessibleProject(user, projectId);
  if (!project) return null;
  const attachment = await prisma.projectRequirementAttachment.findFirst({
    where: {
      id: attachmentId,
      projectId,
    },
    include: { uploadedBy: true },
  });
  if (!attachment || !projectRequirementExists(project.content, attachment.requirementId)) return null;
  return attachment;
}

function attachmentSummary(attachment) {
  return {
    id: attachment.id,
    projectId: attachment.projectId,
    requirementId: attachment.requirementId,
    originalFileName: attachment.originalFileName,
    mimeType: attachment.mimeType,
    fileSize: attachment.fileSize,
    uploadedAt: attachment.uploadedAt,
    uploadedByUserId: attachment.uploadedByUserId || "",
    uploadedByName: attachment.uploadedBy?.name || attachment.uploadedBy?.email || "",
    description: attachment.description || "",
    checksum: attachment.checksum || "",
  };
}

async function resolveProjectAiUsageContext(res, user, projectId) {
  const id = String(projectId || "").trim();
  if (!id) return null;

  const project = await prisma.project.findFirst({
    where: {
      id,
      ...projectAccessWhere(user),
    },
    select: { id: true },
  });

  if (!project) {
    sendJson(res, 404, { error: "Project not found." });
    return null;
  }

  return {
    projectId: project.id,
    userId: user.id,
  };
}

async function recordProjectAiUsage(context, payload, action) {
  if (!context?.projectId) return null;

  const record = buildAiUsageRecord({
    payload,
    action: action || AI_USAGE_ACTIONS.OTHER_AI_PROCESSING,
    projectId: context.projectId,
    userId: context.userId,
    env: process.env,
  });

  try {
    if (record.providerRequestId) {
      const existing = await prisma.projectAiUsage.findUnique({
        where: { providerRequestId: record.providerRequestId },
        select: { id: true },
      });
      if (existing) return existing;
    }

    return await prisma.projectAiUsage.create({ data: record });
  } catch (error) {
    console.error("Project AI usage could not be stored:", {
      projectId: context.projectId,
      action: record.action,
      model: record.model,
      providerRequestId: record.providerRequestId,
      status: record.status,
      error: error.message,
    });
    return null;
  }
}

function workflowArtifactAiUsageAction(requirementType) {
  if (requirementType === "usecase") return AI_USAGE_ACTIONS.USE_CASE_GENERATION;
  if (requirementType === "userstory") return AI_USAGE_ACTIONS.USER_STORY_GENERATION;
  if (requirementType === "app-test") return AI_USAGE_ACTIONS.APP_TESTCASE_GENERATION;
  return AI_USAGE_ACTIONS.OTHER_AI_PROCESSING;
}

function parseProjectPayload(body, fallbackProjectId = "") {
  const rawContent = body.content ?? body.payload;
  const payload = typeof rawContent === "string" ? parseJson(rawContent) : rawContent;
  if (!payload || typeof payload !== "object") {
    return { status: 400, error: "Project content is not valid JSON." };
  }

  if (payload.type !== "miele-devpilot-project") {
    return { status: 400, error: "Unsupported project format." };
  }

  const validationError = validateProjectApprovalState(payload);
  if (validationError) {
    return { status: 400, error: validationError };
  }

  const id = String(fallbackProjectId || body.projectId || payload.project?.id || randomUUID()).trim();
  const name = normalizeProjectName(body.name || payload.project?.name || "Miele.DevPilot");
  const description = String(body.description ?? payload.project?.description ?? "").trim().slice(0, 2000);
  const normalizedPayload = normalizeProjectRichTextPayload(payload, body.userId || "");
  const content = {
    ...normalizedPayload,
    project: {
      ...(normalizedPayload.project || {}),
      id,
      name,
      description,
    },
  };

  return {
    id,
    name,
    description,
    content,
  };
}

function validateProjectApprovalState(payload) {
  const projectState = payload.state || {};
  const requirements = Array.isArray(projectState.requirements) ? projectState.requirements : [];
  const selections = Array.isArray(projectState.finalSelections) ? projectState.finalSelections : [];
  const requiredApproverIds = new Set(
    (Array.isArray(projectState.productApprovalApproverIds) ? projectState.productApprovalApproverIds : [])
      .map((id) => String(id || ""))
      .filter(Boolean),
  );
  const approvalStarted = Boolean(projectState.productApprovalStartedAt);
  if (approvalStarted && !requiredApproverIds.size) {
    return "PR approval requires at least one approver.";
  }

  const requirementRows = new Set(requirements.map((item) => Number(item.rowNumber)).filter(Number.isFinite));
  for (const selection of selections) {
    const rowNumber = Number(selection.rowNumber);
    if (!requirementRows.has(rowNumber)) {
      return "PR approval references an unknown requirement.";
    }

    const approvals = Array.isArray(selection.approvals) ? selection.approvals : [];
    for (const approval of approvals) {
      const userId = String(approval.userId || "");
      if (!requiredApproverIds.has(userId)) {
        return "PR approval contains an approval from a non-required approver.";
      }
      if (!approval.approvedAt) {
        return "PR approval entries require a timestamp.";
      }
    }

    const comments = Array.isArray(selection.comments) ? selection.comments : [];
    for (const comment of comments) {
      if (comment?.type === "disapproval" && !String(comment.text || "").trim()) {
        return "Disapproval comments require text.";
      }
    }

    const openDisapprovals = comments.some((comment) => comment?.type === "disapproval" && comment.resolved !== true);
    const fullyApproved =
      requiredApproverIds.size > 0 &&
      [...requiredApproverIds].every((approverId) =>
        approvals.some((approval) => String(approval.userId || "") === approverId && approval.approvedAt),
      );
    if (selection.approvedAt && (!fullyApproved || openDisapprovals)) {
      return "A PR can be final approved only after all required approvals and no open disapproval comments.";
    }
  }

  return "";
}

function parseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function normalizeRevisionAction(value) {
  return String(value || "autosave").trim().slice(0, 180) || "autosave";
}

function projectSummary(project) {
  return {
    id: project.id,
    name: project.name,
    description: project.description || "",
    ownerId: project.ownerId,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

function normalizeWorkspaceStateInput(body = {}) {
  const activeFilters = body.activeFilters && typeof body.activeFilters === "object" && !Array.isArray(body.activeFilters)
    ? body.activeFilters
    : {};
  const projectClosedAt = body.projectClosed === true
    ? new Date()
    : body.projectClosedAt
      ? new Date(body.projectClosedAt)
      : null;
  return {
    projectId: String(body.projectId || "").trim().slice(0, 200),
    selectedStatus: normalizeWorkspaceToken(body.selectedStatus || "all", 80) || "all",
    selectedCategory: String(body.selectedCategory || "").trim().slice(0, 500),
    selectedSubcategory: String(body.selectedSubcategory || "").trim().slice(0, 500),
    activeFilters: normalizeWorkspaceActiveFilters(activeFilters),
    sortField: normalizeWorkspaceToken(body.sortField || "", 80),
    sortDirection: ["asc", "desc"].includes(body.sortDirection) ? body.sortDirection : "",
    lastRequirementId: String(body.lastRequirementId || "").trim().slice(0, 500),
    projectClosedAt: projectClosedAt && Number.isFinite(projectClosedAt.getTime()) ? projectClosedAt : null,
  };
}

function normalizeWorkspaceActiveFilters(activeFilters) {
  return {
    search: String(activeFilters.search || "").trim().slice(0, 500),
    scoreFilterActive: activeFilters.scoreFilterActive === true,
    activeProcessStep: normalizeWorkspaceToken(activeFilters.activeProcessStep || "product", 80) || "product",
    productReviewActiveTab: normalizeWorkspaceToken(activeFilters.productReviewActiveTab || "final", 80) || "final",
    lastProjectId: String(activeFilters.lastProjectId || "").trim().slice(0, 200),
    projectOpen: activeFilters.projectOpen === true,
  };
}

function normalizeWorkspaceToken(value, maxLength) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_.:-]/g, "")
    .slice(0, maxLength);
}

function workspaceStateSummary(entry) {
  return {
    projectId: entry.projectId || "",
    selectedStatus: entry.selectedStatus || "all",
    selectedCategory: entry.selectedCategory || "",
    selectedSubcategory: entry.selectedSubcategory || "",
    activeFilters: entry.activeFilters && typeof entry.activeFilters === "object" ? entry.activeFilters : {},
    sortField: entry.sortField || "",
    sortDirection: entry.sortDirection || "",
    lastRequirementId: entry.lastRequirementId || "",
    projectClosedAt: entry.projectClosedAt || null,
    updatedAt: entry.updatedAt,
  };
}

function projectRevisionSummary(revision) {
  return {
    id: revision.id,
    projectId: revision.projectId,
    action: revision.action,
    userId: revision.userId,
    userName: revision.user?.name || revision.user?.email || "",
    createdAt: revision.createdAt,
  };
}

function projectAiUsageFilters(projectId, searchParams) {
  const where = { projectId };
  const from = parseFilterDate(searchParams.get("from"));
  const to = parseFilterDate(searchParams.get("to"));
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lte = to;
  }

  for (const key of ["action", "model", "status"]) {
    const value = String(searchParams.get(key) || "").trim();
    if (value) where[key] = value;
  }

  return { where };
}

function projectAiUsageGroupSummary(keyName) {
  return (row) => ({
    key: row[keyName],
    requestCount: row._count._all,
    inputTokens: row._sum.inputTokens || 0,
    outputTokens: row._sum.outputTokens || 0,
    totalTokens: row._sum.totalTokens || 0,
    inputCost: decimalToString(row._sum.inputCost),
    outputCost: decimalToString(row._sum.outputCost),
    cachedInputCost: decimalToString(row._sum.cachedInputCost),
    totalCost: decimalToString(row._sum.totalCost),
  });
}

async function backfillProjectAiUsageCosts(projectId) {
  const records = await prisma.projectAiUsage.findMany({
    where: {
      projectId,
      OR: [
        { status: "price_unavailable" },
        { resolvedModel: "" },
      ],
    },
    take: 500,
  });
  const summary = {
    checked: records.length,
    recalculated: 0,
    notCalculable: 0,
    reasons: {},
  };

  for (const record of records) {
    const hasUsage = Number(record.inputTokens) > 0 || Number(record.outputTokens) > 0 || Number(record.totalTokens) > 0;
    if (!hasUsage) {
      summary.notCalculable += 1;
      summary.reasons.missing_usage = (summary.reasons.missing_usage || 0) + 1;
      await prisma.projectAiUsage.update({
        where: { id: record.id },
        data: { status: "missing_usage", errorType: "missing_usage" },
      });
      continue;
    }

    const usage = {
      hasUsage: true,
      inputTokens: Number(record.inputTokens) || 0,
      outputTokens: Number(record.outputTokens) || 0,
      cachedInputTokens: Number(record.cachedInputTokens) || 0,
      totalTokens: Number(record.totalTokens) || (Number(record.inputTokens) || 0) + (Number(record.outputTokens) || 0),
    };
    const pricing = resolvePricing(record.model, process.env, record.createdAt);
    const cost = calculateAiUsageCost(usage, pricing);
    if (cost.status !== "captured") {
      const reason = pricing ? "cost_calculation_failed" : "pricing_model_not_found";
      summary.notCalculable += 1;
      summary.reasons[reason] = (summary.reasons[reason] || 0) + 1;
      await prisma.projectAiUsage.update({
        where: { id: record.id },
        data: {
          status: "price_unavailable",
          errorType: reason,
          pricingVersion: cost.pricingVersion || AI_USAGE_PRICING_VERSION,
        },
      });
      continue;
    }

    await prisma.projectAiUsage.update({
      where: { id: record.id },
      data: aiUsageCostUpdateData(cost),
    });
    summary.recalculated += 1;
  }

  return summary;
}

function aiUsageCostUpdateData(cost) {
  return {
    inputCost: cost.inputCost,
    outputCost: cost.outputCost,
    cachedInputCost: cost.cachedInputCost,
    totalCost: cost.totalCost,
    currency: "USD",
    status: "captured",
    errorType: null,
    pricingVersion: cost.pricingVersion || AI_USAGE_PRICING_VERSION,
    resolvedModel: cost.resolvedModel || "",
    inputPriceUsdPer1m: cost.inputUsdPer1m || "0.00000000",
    cachedInputPriceUsdPer1m: cost.cachedInputUsdPer1m || "0.00000000",
    outputPriceUsdPer1m: cost.outputUsdPer1m || "0.00000000",
    pricingSource: cost.pricingSource || "",
    pricingEffectiveFrom: cost.pricingEffectiveFrom ? new Date(cost.pricingEffectiveFrom) : null,
    pricingEffectiveUntil: cost.pricingEffectiveUntil ? new Date(cost.pricingEffectiveUntil) : null,
  };
}

function projectAiUsageSummary(record) {
  return {
    id: record.id,
    projectId: record.projectId,
    userId: record.userId || "",
    action: record.action,
    model: record.model,
    inputTokens: record.inputTokens,
    outputTokens: record.outputTokens,
    cachedInputTokens: record.cachedInputTokens,
    reasoningTokens: record.reasoningTokens,
    totalTokens: record.totalTokens,
    inputCost: decimalToString(record.inputCost),
    outputCost: decimalToString(record.outputCost),
    cachedInputCost: decimalToString(record.cachedInputCost),
    totalCost: decimalToString(record.totalCost),
    currency: record.currency,
    status: record.status,
    errorType: record.errorType || "",
    pricingVersion: record.pricingVersion,
    resolvedModel: record.resolvedModel || "",
    inputPriceUsdPer1m: decimalToString(record.inputPriceUsdPer1m),
    cachedInputPriceUsdPer1m: decimalToString(record.cachedInputPriceUsdPer1m),
    outputPriceUsdPer1m: decimalToString(record.outputPriceUsdPer1m),
    pricingSource: record.pricingSource || "",
    pricingEffectiveFrom: record.pricingEffectiveFrom || null,
    pricingEffectiveUntil: record.pricingEffectiveUntil || null,
    createdAt: record.createdAt,
  };
}

function parseFilterDate(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function decimalToString(value) {
  return value === null || value === undefined ? "0.00000000" : String(value);
}

async function pruneProjectRevisions(tx, projectId) {
  const staleRevisions = await tx.projectRevision.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    skip: 80,
    select: { id: true },
  });

  if (!staleRevisions.length) return;

  await tx.projectRevision.deleteMany({
    where: {
      id: {
        in: staleRevisions.map((revision) => revision.id),
      },
    },
  });
}

async function handleSoftwareDerivation(requirements, uiLanguage, res, aiUsageContext = null) {
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
              languageRules: preserveSourceLanguageInstruction(uiLanguage),
              formattingRules: readableArtifactFormattingInstruction(),
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
    await recordProjectAiUsage(aiUsageContext, payload, AI_USAGE_ACTIONS.SOFTWARE_REQUIREMENT_GENERATION);
    sendJson(res, 200, {
      ...JSON.parse(outputText),
      openAiUsage: buildOpenAiUsageSummary(payload),
    });
  } catch (error) {
    console.error("Could not parse OpenAI software output:", outputText, error);
    sendJson(res, 502, { error: "OpenAI returned invalid JSON." });
  }
}

async function handleSoftwareImprovement(sourceRequirement, softwareRequirement, improvementInstruction, improvementAttachments, uiLanguage, res, aiUsageContext = null) {
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
      text: `${softwareRequirement.text || "Das System muss das Verhalten pruefbar bereitstellen."}\n\nVerbesserungsfokus:\n- ${improvementInstruction}.${attachmentSuffix ? `\n- ${attachmentSuffix.trim()}` : ""}`,
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
              languageRules: preserveSourceLanguageInstruction(uiLanguage),
              formattingRules: readableArtifactFormattingInstruction(),
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
    await recordProjectAiUsage(aiUsageContext, payload, AI_USAGE_ACTIONS.IMPROVEMENT_SUGGESTION);
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

  payload.softwareRequirements.forEach((item) => {
    const score = Number(item.score);

    if (!Number.isFinite(score) || score < 85) {
      item.score = 85;
    } else if (score > 100) {
      item.score = Math.min(score, 100);
    }
  });
}

function enforceProductRequirementScoreBreakdownRules(payload) {
  if (!Array.isArray(payload?.results)) return;

  payload.results.forEach((item) => {
    item.originalScoreBreakdown = validateProductRequirementScoreBreakdown(item.originalScoreBreakdown, item.originalScore);
    item.scoreBreakdown = validateProductRequirementScoreBreakdown(item.scoreBreakdown, item.score);
  });
}

function enforceE2eScoreRules(payload, sourceRequirements) {
  if (!Array.isArray(payload?.e2eTests)) return;

  payload.e2eTests.forEach((item) => {
    const score = Number(item.score);

    if (!Number.isFinite(score) || score <= 85) {
      item.score = 86;
    } else if (score > 100) {
      item.score = Math.min(score, 100);
    }
  });
}

async function handleE2eDerivation(requirements, uiLanguage, res, aiUsageContext = null) {
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
              languageRules: preserveSourceLanguageInstruction(uiLanguage),
              formattingRules: readableArtifactFormattingInstruction(),
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
    await recordProjectAiUsage(aiUsageContext, payload, AI_USAGE_ACTIONS.E2E_TESTCASE_GENERATION);
    sendJson(res, 200, {
      ...parsed,
      openAiUsage: buildOpenAiUsageSummary(payload),
    });
  } catch (error) {
    console.error("Could not parse OpenAI E2E output:", outputText, error);
    sendJson(res, 502, { error: "OpenAI returned invalid JSON." });
  }
}

async function handleE2eImprovement(sourceRequirement, testCase, improvementInstruction, improvementAttachments, uiLanguage, res, aiUsageContext = null) {
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
      description: `${testCase.description || testCase.text || "E2E TestCase"}\n\nVerbesserungsfokus:\n- ${improvementInstruction}.${attachmentSuffix ? `\n- ${attachmentSuffix.trim()}` : ""}`,
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
              languageRules: preserveSourceLanguageInstruction(uiLanguage),
              formattingRules: readableArtifactFormattingInstruction(),
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
    await recordProjectAiUsage(aiUsageContext, payload, AI_USAGE_ACTIONS.IMPROVEMENT_SUGGESTION);
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

async function handleWorkflowArtifactDerivation(requirementType, requirements, uiLanguage, res, aiUsageContext = null) {
  const config = workflowArtifactConfig(requirementType);
  if (!config) {
    sendJson(res, 400, { error: "Unsupported workflow artifact type." });
    return;
  }

  if (process.env.OPENAI_MOCK === "true") {
    sendJson(res, 200, {
      [config.responseKey]: requirements.map((item, index) => mockWorkflowArtifact(config, item, index)),
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
            content: `${config.systemPrompt} Return only valid JSON that matches the schema.`,
          },
          {
            role: "user",
            content: JSON.stringify({
              task: config.task,
              languageRules: preserveSourceLanguageInstruction(uiLanguage),
              formattingRules: readableArtifactFormattingInstruction(),
              requirements,
            }),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: `${config.type}_derivation`,
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                [config.responseKey]: {
                  type: "array",
                  items: workflowArtifactSchema(),
                },
              },
              required: [config.responseKey],
            },
          },
        },
        max_output_tokens: 16000,
      }),
    });
  } catch (error) {
    console.error(`OpenAI ${config.label} derivation failed:`, error);
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
    await recordProjectAiUsage(aiUsageContext, payload, workflowArtifactAiUsageAction(requirementType));
    sendJson(res, 200, {
      ...parsed,
      openAiUsage: buildOpenAiUsageSummary(payload),
    });
  } catch (error) {
    console.error(`Could not parse OpenAI ${config.label} output:`, outputText, error);
    sendJson(res, 502, { error: "OpenAI returned invalid JSON." });
  }
}

function workflowArtifactSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      sourceId: { type: "string" },
      sourcePrId: { type: "string" },
      id: { type: "string" },
      title: { type: "string" },
      description: { type: "string" },
      details: {
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
      "sourceId",
      "sourcePrId",
      "id",
      "title",
      "description",
      "details",
      "acceptanceCriteria",
      "score",
      "issues",
      "rationale",
    ],
  };
}

function workflowArtifactConfig(requirementType) {
  const configs = {
    usecase: {
      type: "usecase",
      label: "UseCase",
      responseKey: "useCases",
      idPrefix: "UC",
      systemPrompt: "You are a senior business analyst and requirements engineer. Derive precise UseCases from approved Software Requirements.",
      task:
        "Derive one or more UseCases for each Software Requirement. Include actor goal, trigger, preconditions, main flow, alternative or exception flows, postconditions, acceptance criteria, traceability to the source Software Requirement and source Product Requirement, and a quality score from 85-100.",
    },
    userstory: {
      type: "userstory",
      label: "UserStory",
      responseKey: "userStories",
      idPrefix: "US",
      systemPrompt: "You are a senior product owner. Derive implementation-ready UserStories from approved UseCases.",
      task:
        "Derive one or more UserStories for each UseCase. Use the format and content needed for backlog refinement: role, goal, benefit, concise story text, INVEST-quality acceptance criteria, traceability to the source UseCase and source Product Requirement, and a quality score from 85-100.",
    },
    "app-test": {
      type: "app_test",
      label: "App TestCase",
      responseKey: "appTests",
      idPrefix: "AT",
      systemPrompt: "You are a senior application test engineer. Derive executable App TestCases from approved UseCases.",
      task:
        "Derive one or more App TestCases for each UseCase. Include scenario title, test objective, preconditions, test data, executable steps, expected results, acceptance criteria coverage, traceability to the source UseCase and source Product Requirement, and a quality score from 85-100.",
    },
  };

  return configs[requirementType] || null;
}

function mockWorkflowArtifact(config, item, index) {
  const sourceId = item.id || `${config.idPrefix}-SOURCE-${index + 1}`;
  return {
    sourceId,
    sourcePrId: item.sourcePrId || item.sourceId || "",
    id: buildMockWorkflowArtifactId(config.idPrefix, sourceId, index),
    title: `${config.label} fuer ${sourceId}`,
    description: `${config.label} leitet das relevante Verhalten aus "${sourceId}" nachvollziehbar ab.`,
    details: [
      "Ausloeser, beteiligte Rolle und erwarteter Zielzustand sind beschrieben.",
      "Hauptablauf, Abweichungen und pruefbare Ergebnisse sind als Review-Basis vorbereitet.",
    ],
    acceptanceCriteria: [
      "Der fachliche Ablauf ist eindeutig nachvollziehbar.",
      "Die Ableitung bleibt zur Quelle rueckverfolgbar.",
      "Die Kriterien sind als Basis fuer Review und Test verwendbar.",
    ],
    score: 92,
    issues: [],
    rationale: `Mock-${config.label} abgeleitet aus: ${item.text.slice(0, 180)}`,
  };
}

function buildMockWorkflowArtifactId(prefix, sourceId, index) {
  const normalizedSourceId = String(sourceId || "").trim();
  if (normalizedSourceId) {
    return `${prefix}_${normalizedSourceId.replace(/^(SR|UC|US|E2E|PR)[_-]?/i, "").replace(/[^a-z0-9.]+/gi, "_")}.${index + 1}`;
  }

  return `${prefix}-${String(index + 1).padStart(3, "0")}`;
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
    res.writeHead(200, {
      "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
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

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  res.setHeader("Access-Control-Allow-Origin", origin || "*");
  if (origin) {
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,POST,PUT,DELETE,OPTIONS");
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

function normalizeProjectName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\.[^.]+$/, "")
    .slice(0, 160) || "Miele.DevPilot";
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
    ? `${item.text}\n\nDer relevante Nutzer- oder Geschaeftskontext, das erwartete Ergebnis und die messbare fachliche Zielsetzung sind so beschrieben, dass daraus spaeter konkrete Software Requirements ohne zusaetzliche Interpretation abgeleitet werden koennen.`
    : item.text;

  const originalAssessment = mockRequirementQualityAssessment(item.text);
  const assessment = mockRequirementQualityAssessment(rewrittenRequirement);
  return {
    rowNumber: item.rowNumber,
    id: item.id,
    originalScore: originalAssessment.score,
    originalIssues: originalAssessment.issues.length ? originalAssessment.issues : detectedIssues,
    originalScoreBreakdown: originalAssessment.scoreBreakdown,
    scoreBreakdown: assessment.scoreBreakdown,
    score: assessment.score,
    verdict: assessment.verdict,
    issues: assessment.issues,
    rewrittenRequirement,
    resolvedIssueKeys: detectedIssues.map((issue) => issue.criterion),
    remainingIssueKeys: assessment.issues.map((issue) => issue.criterion),
    missingInformation: assessment.issues
      .filter((issue) => issue.criterion === "completeness" || issue.criterion === "measurability")
      .map((issue) => issue.suggestion),
    assumptions: [],
    qualityCheck: [],
  };
}

function mockFinalizeRequirement(item) {
  const assessment = mockRequirementQualityAssessment(item.text);
  return {
    rowNumber: item.rowNumber,
    id: item.id,
    originalScore: assessment.score,
    originalIssues: assessment.issues,
    originalScoreBreakdown: assessment.scoreBreakdown,
    scoreBreakdown: assessment.scoreBreakdown,
    score: assessment.score,
    verdict: assessment.verdict,
    issues: assessment.issues,
    rewrittenRequirement: item.text,
    resolvedIssueKeys: [],
    remainingIssueKeys: assessment.issues.map((issue) => issue.criterion),
    missingInformation: assessment.issues
      .filter((issue) => issue.criterion === "completeness" || issue.criterion === "measurability")
      .map((issue) => issue.suggestion),
    assumptions: [],
    qualityCheck: [],
  };
}

function mockRequirementQualityAssessment(text) {
  return assessProductRequirementQuality(text);
}

function mockSoftwareRequirement(item, index) {
  const sourceId = item.id || `PR-${item.rowNumber || index + 1}`;
  const score = 90;
  return {
    sourceRowNumber: item.rowNumber,
    sourceId,
    id: buildMockSoftwareRequirementId(sourceId, index),
    text: `Das System muss das Product Requirement "${sourceId}" durch eine pruefbare Systemfunktion unterstuetzen.\n\nDabei muessen folgende Aspekte nachvollziehbar abgedeckt sein:\n- Ausloeser und relevante Eingabedaten,\n- Systemreaktion und erwartetes Ergebnis,\n- Protokollierung und Verifizierbarkeit anhand definierter Akzeptanzkriterien.`,
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
  try {
    const env = await readFile(join(root, ".env.local"), "utf8");
    for (const line of env.split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = stripEnvQuotes(match[2]);
      }
    }
  } catch {
    // Local env files are optional. The request handler reports missing keys.
  }
}

function stripEnvQuotes(value) {
  const trimmed = String(value || "").trim();
  if ((trimmed.startsWith("\"") && trimmed.endsWith("\"")) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function normalizeBasePath(value) {
  const trimmed = String(value || "").trim().replace(/\/+$/, "");
  if (!trimmed || trimmed === "/") {
    return "";
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}
