export const RICH_TEXT_FORMAT_VERSION = "miele-rich-text-v1";
export const RICH_TEXT_ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

const BLOCK_TYPES = new Set(["paragraph", "heading", "bulletList", "orderedList"]);
const INLINE_MARKS = new Set(["bold", "italic", "underline", "strike", "code"]);

export function richTextFromPlainText(value = "") {
  const blocks = String(value || "")
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.split("\n"))
    .map((lines) => ({
      type: "paragraph",
      children: lines.flatMap((line, index) => [
        ...(index ? [{ type: "break" }] : []),
        textNode(line),
      ]).filter((node) => node.type === "break" || node.text),
    }))
    .filter((block) => block.children.length);

  return {
    type: "doc",
    version: RICH_TEXT_FORMAT_VERSION,
    content: blocks.length ? blocks : [{ type: "paragraph", children: [textNode("")] }],
  };
}

export function richTextFromHtml(html = "") {
  let sanitized = sanitizeHtml(String(html || ""));
  sanitized = sanitized
    .replace(/<(h[1-3]|p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, tag, inner) => {
      const type = tag.toLowerCase();
      const text = htmlInlineToPlainText(inner);
      if (type === "li") return `\n- ${text}`;
      if (type.startsWith("h")) return `\n\n${text}\n\n`;
      return `\n\n${text}\n\n`;
    })
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  return richTextFromPlainText(decodeHtmlEntities(sanitized).trim());
}

export function normalizeRichTextContent(value, fallbackText = "") {
  const content = value && typeof value === "object" ? value : richTextFromPlainText(fallbackText);
  const blocks = Array.isArray(content.content) ? content.content : [];
  const normalizedBlocks = blocks.map(normalizeBlock).filter(Boolean);
  return {
    type: "doc",
    version: RICH_TEXT_FORMAT_VERSION,
    content: normalizedBlocks.length ? normalizedBlocks : richTextFromPlainText(fallbackText).content,
  };
}

export function richTextToHtml(content) {
  const doc = normalizeRichTextContent(content);
  return doc.content.map(blockToHtml).join("");
}

export function richTextToPlainText(content) {
  const doc = normalizeRichTextContent(content);
  return doc.content.map(blockToPlainText).join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function sanitizeHtml(html = "") {
  return String(html || "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\s*(script|style|iframe|object|embed|form|input|button|textarea|select|meta|link)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed|form|input|button|textarea|select|meta|link)[^>]*\/?\s*>/gi, "")
    .replace(/\s(?:style|class|id|on[a-z]+)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/<a\b([^>]*)>/gi, (_, attributes) => {
      const href = extractHref(attributes);
      return href ? `<a href="${escapeHtmlAttribute(href)}">` : "<a>";
    })
    .replace(/<\/?([a-z0-9]+)(?:\s[^>]*)?>/gi, (tag, name) => {
      const normalized = name.toLowerCase();
      if (["p", "h1", "h2", "h3", "strong", "b", "em", "i", "u", "s", "strike", "ul", "ol", "li", "a", "br", "code"].includes(normalized)) {
        if (/^<a\b/i.test(tag)) return tag;
        return tag.startsWith("</") ? `</${normalized}>` : `<${normalized}>`;
      }
      return "";
    });
}

export function toPdfBlocks(content) {
  const doc = normalizeRichTextContent(content);
  return doc.content.map((block) => ({
    type: block.type,
    level: block.level || 0,
    text: blockToPlainText(block),
    runs: inlineToRuns(block.children || []),
  }));
}

export function toDocx(content) {
  const doc = normalizeRichTextContent(content);
  return doc.content.map((block) => ({
    type: block.type,
    style: block.type === "heading" ? `Heading${block.level}` : block.type,
    runs: inlineToRuns(block.children || []),
    items: Array.isArray(block.items) ? block.items.map((item) => inlineToRuns(item.children || [])) : [],
  }));
}

export function toExcelRichText(content) {
  return {
    text: richTextToExcelPlainText(content),
    html: richTextToHtml(content),
    richTextRuns: inlineToRuns(normalizeRichTextContent(content).content.flatMap((block) => block.children || [])),
  };
}

export function richTextToExcelPlainText(content) {
  const doc = normalizeRichTextContent(content);
  return doc.content.map((block) => {
    if (block.type === "bulletList") {
      return block.items.map((item) => `• ${inlineToPlainText(item.children || [])}`).join("\n");
    }
    if (block.type === "orderedList") {
      return block.items.map((item, index) => `${index + 1}. ${inlineToPlainText(item.children || [])}`).join("\n");
    }
    return inlineToPlainText(block.children || []);
  }).join("\n\n").trim();
}

export function mapRichTextToWindchill(content, capabilities = {}) {
  const doc = normalizeRichTextContent(content);
  if (capabilities.html === true) {
    return { format: "html", value: richTextToHtml(doc), version: RICH_TEXT_FORMAT_VERSION };
  }
  if (capabilities.structured === true) {
    return { format: "structured", value: doc, version: RICH_TEXT_FORMAT_VERSION };
  }
  return { format: "plainText", value: richTextToPlainText(doc), version: RICH_TEXT_FORMAT_VERSION };
}

export function normalizeProjectRichTextPayload(payload, userId = "") {
  const next = structuredCloneSafe(payload);
  const results = Array.isArray(next?.state?.results) ? next.state.results : [];
  for (const result of results) {
    normalizeAiSuggestionFields(result, userId);
  }
  const selections = Array.isArray(next?.state?.finalSelections) ? next.state.finalSelections : [];
  for (const selection of selections) {
    normalizeFinalSelectionRichTextFields(selection);
  }
  return next;
}

export function normalizeAiSuggestionFields(result, userId = "") {
  const baseText = String(result.rewrittenRequirement || result.aiSuggestionPlainText || "");
  const content = normalizeRichTextContent(result.aiSuggestionContent, baseText);
  result.aiSuggestionContent = content;
  result.aiSuggestionHtml = richTextToHtml(content);
  result.aiSuggestionPlainText = richTextToPlainText(content);
  result.aiSuggestionFormatVersion = RICH_TEXT_FORMAT_VERSION;
  if (!result.rewrittenRequirement) result.rewrittenRequirement = result.aiSuggestionPlainText;
  if (!result.aiSuggestionGeneratedAt && result.rewrittenRequirement) result.aiSuggestionGeneratedAt = new Date().toISOString();
  if (result.aiSuggestionEdited && !result.aiSuggestionEditedByUserId && userId) result.aiSuggestionEditedByUserId = userId;
  return result;
}

export function normalizeFinalSelectionRichTextFields(selection) {
  const content = normalizeRichTextContent(selection.finalRequirementContent, selection.text || "");
  selection.finalRequirementContent = content;
  selection.finalRequirementHtml = richTextToHtml(content);
  selection.finalRequirementPlainText = richTextToPlainText(content);
  selection.finalRequirementFormatVersion = RICH_TEXT_FORMAT_VERSION;
  selection.text = selection.finalRequirementPlainText;
  return selection;
}

function normalizeBlock(block) {
  if (!block || typeof block !== "object" || !BLOCK_TYPES.has(block.type)) return null;
  if (block.type === "heading") {
    const level = Math.min(Math.max(Number(block.level) || 1, 1), 3);
    return { type: "heading", level, children: normalizeInline(block.children) };
  }
  if (block.type === "bulletList" || block.type === "orderedList") {
    const items = (Array.isArray(block.items) ? block.items : []).map((item) => ({
      type: "listItem",
      children: normalizeInline(item?.children),
    })).filter((item) => item.children.length);
    return items.length ? { type: block.type, items } : null;
  }
  return { type: "paragraph", children: normalizeInline(block.children) };
}

function normalizeInline(children) {
  const nodes = Array.isArray(children) ? children : [];
  return nodes.map((node) => {
    if (node?.type === "break") return { type: "break" };
    const text = String(node?.text || "");
    const marks = (Array.isArray(node?.marks) ? node.marks : []).filter((mark) => INLINE_MARKS.has(mark));
    const link = sanitizeUrl(node?.link || "");
    return { text, ...(marks.length ? { marks } : {}), ...(link ? { link } : {}) };
  }).filter((node) => node.type === "break" || node.text);
}

function blockToHtml(block) {
  if (block.type === "heading") return `<h${block.level}>${inlineToHtml(block.children || [])}</h${block.level}>`;
  if (block.type === "bulletList" || block.type === "orderedList") {
    const tag = block.type === "bulletList" ? "ul" : "ol";
    return `<${tag}>${block.items.map((item) => `<li>${inlineToHtml(item.children || [])}</li>`).join("")}</${tag}>`;
  }
  return `<p>${inlineToHtml(block.children || [])}</p>`;
}

function blockToPlainText(block) {
  if (block.type === "bulletList") return block.items.map((item) => `• ${inlineToPlainText(item.children || [])}`).join("\n");
  if (block.type === "orderedList") return block.items.map((item, index) => `${index + 1}. ${inlineToPlainText(item.children || [])}`).join("\n");
  return inlineToPlainText(block.children || []);
}

function inlineToHtml(children) {
  return children.map((node) => {
    if (node.type === "break") return "<br>";
    let html = escapeHtml(node.text || "");
    for (const mark of node.marks || []) {
      if (mark === "bold") html = `<strong>${html}</strong>`;
      if (mark === "italic") html = `<em>${html}</em>`;
      if (mark === "underline") html = `<u>${html}</u>`;
      if (mark === "strike") html = `<s>${html}</s>`;
      if (mark === "code") html = `<code>${html}</code>`;
    }
    if (node.link) html = `<a href="${escapeHtmlAttribute(node.link)}">${html}</a>`;
    return html;
  }).join("");
}

function inlineToPlainText(children) {
  return children.map((node) => node.type === "break" ? "\n" : String(node.text || "")).join("");
}

function inlineToRuns(children) {
  return children.map((node) => node.type === "break"
    ? { break: true }
    : {
      text: node.text || "",
      bold: node.marks?.includes("bold") || false,
      italic: node.marks?.includes("italic") || false,
      underline: node.marks?.includes("underline") || false,
      strike: node.marks?.includes("strike") || false,
      code: node.marks?.includes("code") || false,
      link: node.link || "",
    });
}

function textNode(text) {
  return { text: String(text || "") };
}

function extractHref(attributes = "") {
  const match = String(attributes || "").match(/\shref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  return sanitizeUrl(match?.[1] || match?.[2] || match?.[3] || "");
}

function sanitizeUrl(value = "") {
  const text = String(value || "").trim();
  if (!text) return "";
  try {
    const parsed = new URL(text, "https://example.invalid");
    if (parsed.origin === "https://example.invalid" && !text.startsWith("/")) return "";
    return RICH_TEXT_ALLOWED_PROTOCOLS.has(parsed.protocol) ? text : "";
  } catch {
    return "";
  }
}

function htmlInlineToPlainText(value) {
  return decodeHtmlEntities(String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, ""));
}

function decodeHtmlEntities(value) {
  return String(value || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtmlAttribute(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value || {}));
}
