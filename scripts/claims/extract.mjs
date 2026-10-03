// Text extraction for the claims check. TypeScript's own parser reads .ts and .tsx, so JSX text, JSX
// attributes and object properties are found structurally (not by regex); MDX is read line by line.
import ts from "typescript";
import { UI_ATTRIBUTES, UI_PROPERTIES } from "./policy.mjs";

const lineOf = (sf, node) => sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;

function parse(source, filename) {
  const kind = filename.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  return ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, kind);
}

/** Static text of a literal or template, with `${...}` holes removed. */
function literalText(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) {
    return node.head.text + node.templateSpans.map((span) => span.literal.text).join("");
  }
  return null;
}

const ID_LIKE = /^[a-z0-9][a-z0-9._:/#?=&@%+-]*$/;
const CODE_LIKE = /^[0-9A-Z.]+$/;
const CLAIM_LIKE = /^C-\d+$/;

/** A string is prose unless it is an id, slug, path, URL, claim id or short code. */
export function isProse(text) {
  const value = text.trim();
  if (!/[A-Za-z]/.test(value)) return false;
  if (ID_LIKE.test(value) || CODE_LIKE.test(value) || CLAIM_LIKE.test(value)) return false;
  return !/^([#/@]|https?:)/.test(value);
}

/** Every prose string literal in a content module, with its line. */
export function extractContentStrings(source, filename = "content.ts") {
  const sf = parse(source, filename);
  const found = [];
  const visit = (node) => {
    const text = literalText(node);
    if (text !== null && isProse(text))
      found.push({ text, line: lineOf(sf, node), kind: "string" });
    // Imports and `from` specifiers are module names, not copy.
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) return;
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return found;
}

/**
 * User-visible strings written inline in UI code: JSX text nodes, literal values of aria-label, alt,
 * title, label, description and placeholder props, and metadata-style object properties.
 */
export function extractUiStrings(source, filename = "ui.tsx") {
  const sf = parse(source, filename);
  const found = [];
  const add = (node, text, kind) => {
    if (text.trim())
      found.push({ text: text.trim().replace(/\s+/g, " "), line: lineOf(sf, node), kind });
  };
  const visit = (node) => {
    if (ts.isJsxText(node)) add(node, node.text, "jsx-text");
    else if (
      ts.isJsxAttribute(node) &&
      UI_ATTRIBUTES.has(node.name.getText(sf)) &&
      node.initializer
    ) {
      const init = node.initializer;
      const text = ts.isStringLiteral(init)
        ? init.text
        : ts.isJsxExpression(init) && init.expression
          ? literalText(init.expression)
          : null;
      if (text !== null) add(node, text, "attribute");
    } else if (
      ts.isPropertyAssignment(node) &&
      UI_PROPERTIES.has(node.name.getText(sf).replace(/["']/g, ""))
    ) {
      const text = literalText(node.initializer);
      if (text !== null) add(node, text, "property");
    } else if (
      ts.isVariableDeclaration(node) &&
      node.initializer &&
      node.name.getText(sf) === "alt" &&
      literalText(node.initializer) !== null
    ) {
      add(node, literalText(node.initializer), "property");
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return found;
}

/** Prose lines of an MDX file: markdown syntax, code, imports and comments removed. */
export function extractMdxProse(source) {
  const lines = source.split("\n");
  const found = [];
  let fenced = false;
  lines.forEach((raw, index) => {
    if (/^\s*(```|~~~)/.test(raw)) {
      fenced = !fenced;
      return;
    }
    if (fenced || /^\s*(import|export)\s/.test(raw) || /^\s*\{\/\*.*\*\/\}\s*$/.test(raw)) return;
    const text = raw
      .replace(/\{\/\*.*?\*\/\}/g, "")
      .replace(/^\s*#{1,6}\s+/, "")
      .replace(/^\s*(?:[-*+]|\d+\.)\s+/, "")
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/[`*_>]/g, "")
      .trim();
    if (text) found.push({ text, line: index + 1, kind: "mdx" });
  });
  return found;
}
