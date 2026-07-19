import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  RICH_TEXT_FORMAT_VERSION,
  mapRichTextToWindchill,
  normalizeProjectRichTextPayload,
  normalizeRichTextContent,
  richTextFromHtml,
  richTextFromPlainText,
  richTextToHtml,
  richTextToPlainText,
  sanitizeHtml,
  toDocx,
  toExcelRichText,
  toPdfBlocks,
} from "../src/lib/rich-text.mjs";

test("normalizes legacy plain text AI suggestions into rich text content", () => {
  const content = richTextFromPlainText("Erste Zeile\nzweite Zeile\n\nNeuer Absatz");

  assert.equal(content.version, RICH_TEXT_FORMAT_VERSION);
  assert.equal(content.content.length, 2);
  assert.match(richTextToHtml(content), /<p>Erste Zeile<br>zweite Zeile<\/p>/);
  assert.equal(richTextToPlainText(content), "Erste Zeile\nzweite Zeile\n\nNeuer Absatz");
});

test("keeps supported formatting for html, pdf, docx, excel and windchill mappings", () => {
  const content = normalizeRichTextContent({
    type: "doc",
    content: [
      { type: "heading", level: 2, children: [{ text: "Titel", marks: ["bold"] }] },
      { type: "paragraph", children: [
        { text: "Link", marks: ["italic", "underline"], link: "https://example.com" },
        { type: "break" },
        { text: "Code", marks: ["code"] },
      ] },
      { type: "bulletList", items: [{ children: [{ text: "Punkt", marks: ["strike"] }] }] },
      { type: "orderedList", items: [{ children: [{ text: "Erster" }] }] },
    ],
  });

  assert.match(richTextToHtml(content), /<h2><strong>Titel<\/strong><\/h2>/);
  assert.match(richTextToHtml(content), /<a href="https:\/\/example\.com"><u><em>Link<\/em><\/u><\/a>/);
  assert.match(richTextToPlainText(content), /• Punkt/);
  assert.equal(toPdfBlocks(content)[0].type, "heading");
  assert.equal(toDocx(content)[0].style, "Heading2");
  assert.match(toExcelRichText(content).text, /1\. Erster/);
  assert.equal(mapRichTextToWindchill(content, { html: true }).format, "html");
  assert.equal(mapRichTextToWindchill(content).format, "plainText");
});

test("sanitizes pasted Word/web html and removes unsafe active content", () => {
  const dirty = `
    <p class="MsoNormal" style="font-size:18pt;color:red" onclick="alert(1)"><b>Fett</b> <span style="font-family:Arial">Text</span></p>
    <script>alert(1)</script>
    <iframe src="https://evil.example"></iframe>
    <a href="javascript:alert(1)" onmouseover="x()">bad</a>
    <a href="mailto:test@example.com">mail</a>
  `;
  const clean = sanitizeHtml(dirty);

  assert.doesNotMatch(clean, /script|iframe|onclick|style|javascript:/i);
  assert.match(clean, /<b>Fett<\/b>/);
  assert.match(clean, /<a>bad<\/a>/);
  assert.match(clean, /<a href="mailto:test@example.com">mail<\/a>/);
});

test("migrates project AI and final requirement fields without dropping legacy text", () => {
  const payload = normalizeProjectRichTextPayload({
    type: "miele-devpilot-project",
    state: {
      results: [{ rowNumber: 1, rewrittenRequirement: "Legacy AI" }],
      finalSelections: [{ rowNumber: 1, text: "Legacy final" }],
    },
  }, "user-1");

  assert.equal(payload.state.results[0].aiSuggestionPlainText, "Legacy AI");
  assert.equal(payload.state.results[0].aiSuggestionFormatVersion, RICH_TEXT_FORMAT_VERSION);
  assert.match(payload.state.results[0].aiSuggestionHtml, /Legacy AI/);
  assert.equal(payload.state.finalSelections[0].finalRequirementPlainText, "Legacy final");
  assert.equal(payload.state.finalSelections[0].finalRequirementFormatVersion, RICH_TEXT_FORMAT_VERSION);
});

test("parses sanitized html paste into plain text fallback", () => {
  const content = richTextFromHtml("<h1>Head</h1><ul><li><strong>One</strong></li></ul><img src=x><script>x</script>");

  assert.equal(richTextToPlainText(content), "Head\n\n- One");
  assert.doesNotMatch(richTextToHtml(content), /script|img/i);
});

test("wires rich text editor UI, permissions, regeneration warning, translations and export usage", async () => {
  const [app, html, css] = await Promise.all([
    readFile(new URL("../app.js", import.meta.url), "utf8"),
    readFile(new URL("../index.html", import.meta.url), "utf8"),
    readFile(new URL("../styles.css", import.meta.url), "utf8"),
  ]);

  assert.match(html, /id="aiSuggestionEditor"/);
  assert.match(html, /data-rich-command="bold"/);
  assert.match(html, /data-rich-command="italic"/);
  assert.match(html, /data-rich-command="underline"/);
  assert.match(html, /data-rich-block="h1"/);
  assert.match(html, /data-rich-command="insertUnorderedList"/);
  assert.match(html, /data-rich-command="insertOrderedList"/);
  assert.match(html, /data-rich-command="createLink"/);

  assert.match(app, /startAiSuggestionEdit/);
  assert.match(app, /saveAiSuggestionEdit/);
  assert.match(app, /cancelAiSuggestionEdit/);
  assert.match(app, /handleAiSuggestionEditorPaste/);
  assert.match(app, /sanitizeRichTextHtml/);
  assert.match(app, /aiSuggestionEdited/);
  assert.match(app, /Neugenerierung werden diese Änderungen ersetzt/);
  assert.match(app, /applyRichTextToFinalSelection/);
  assert.match(app, /mapRichTextToWindchill/);
  assert.match(app, /richTextToExcelPlainText/);
  assert.match(app, /els\.selectionAiEditMeta\.hidden = !editMeta/);
  assert.match(app, /"Fett": "Bold"/);
  assert.match(app, /"Link entfernen": "Remove link"/);
  assert.match(css, /\.choice-card \.rich-text-preview :where\(p, h1, h2, h3, ul, ol, li, blockquote, pre\)/);
  assert.match(css, /\.choice-card \.rich-text-preview p,[\s\S]*?margin:\s*0 0 0\.75em/);
  assert.match(css, /\.choice-card \.rich-text-preview li,[\s\S]*?display:\s*list-item/);
});
