#!/usr/bin/env node
// Claims check (D-06): published copy may state only what the claim register covers, in design-intent
// wording, with no numbers, no partner or community names, and no prose written outside src/content.
// Usage: node scripts/check-claims.mjs [root]      (also run by `pnpm check` and CI)
//
// Rules reported as `file:line rule message`: forbidden-pattern, num-figure, proper-noun, denylist,
// no-inline-prose, missing-claims-declaration, unknown-claim, orphan-register-row.
// Demo pages and src/lib/demo (P6) are checked for NUM figures (allowed only under a registered claim
// id in the same file) and for the deny-lists; their inline copy is otherwise expected.
// Two deny-lists apply everywhere: the hashed list of real names (scripts/claims/denylist.hashes.json)
// and the explicit placeholder list (scripts/claims-denylist.json). Findings name the rule, never the
// matched name.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { extractContentStrings, extractMdxProse, extractUiStrings } from "./claims/extract.mjs";
import {
  ALLOWED_TERMS,
  DIGIT_ALLOW,
  FORBIDDEN,
  NUM_FIGURES,
  P4_CLAIM_RANGE,
  PROSE_LETTERS,
  SCAN_DIRS,
} from "./claims/policy.mjs";
import { claimRefs, mdxClaimDeclaration, parseRegister } from "./claims/register.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DENYLIST = path.join(HERE, "claims", "denylist.hashes.json");
const DEFAULT_DENY_TERMS = path.join(HERE, "claims-denylist.json");
const MAX_NGRAM = 4;
const SOURCE_FILE = /\.(ts|tsx|mdx)$/;
const TEST_FILE = /\.(test|spec)\.[jt]sx?$/;

const tokens = (text) => text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
export const hashNgram = (words) =>
  createHash("sha256")
    .update(tokens(words.join(" ")).join(" "))
    .digest("hex");

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return walk(full);
    return SOURCE_FILE.test(name) && !TEST_FILE.test(name) ? [full] : [];
  });
}

const stripPhrases = (text) =>
  ALLOWED_TERMS.phrases.reduce((acc, phrase) => acc.split(phrase).join(" "), text);

function properNounHit(text) {
  const allowed = new Set(ALLOWED_TERMS.words);
  const cleaned = stripPhrases(text).replace(/['’]s\b/g, "");
  return cleaned.split(/(?<=[.!?])\s+/).some((sentence) => {
    const words = [...sentence.matchAll(/[A-Za-z][A-Za-z0-9'’-]*/g)].map((m) => m[0]);
    return words.slice(1).some((word) => /^[A-Z]/.test(word) && !allowed.has(word));
  });
}

const hasSequence = (words, phrase) =>
  phrase.length > 0 &&
  words.some((_, i) => phrase.every((word, offset) => words[i + offset] === word));

/** True when the text holds a whole-word, case-insensitive match of an explicit deny-list term. */
function termsHit(text, terms) {
  const words = tokens(text);
  return terms.some((term) => hasSequence(words, tokens(term)));
}

/** The first NUM figure kind in the text, or null. */
const numFigure = (text) => NUM_FIGURES.find(({ test }) => test.test(text)) ?? null;

function denylistHit(text, { deny, terms }) {
  if (termsHit(text, terms)) return true;
  if (deny.size === 0) return false;
  const words = tokens(text);
  for (let n = 1; n <= MAX_NGRAM; n += 1) {
    for (let i = 0; i + n <= words.length; i += 1) {
      if (
        deny.has(
          createHash("sha256")
            .update(words.slice(i, i + n).join(" "))
            .digest("hex"),
        )
      )
        return true;
    }
  }
  return false;
}

/** All prose rules for one extracted string. */
function checkText(entry, file, deny, findings) {
  const report = (rule, message) => findings.push({ file, line: entry.line, rule, message });
  const figure = numFigure(entry.text);
  if (figure) report("num-figure", `${figure.message}; copy may not state one`);
  for (const { id, test, message } of FORBIDDEN) {
    if (id === "digit" && DIGIT_ALLOW.has(entry.text)) continue;
    if (test.test(entry.text)) report("forbidden-pattern", `${id}: ${message}`);
  }
  if (properNounHit(entry.text)) {
    report(
      "proper-noun",
      "capitalised proper noun outside the allowed list (scripts/claims/policy.mjs)",
    );
  }
  if (denylistHit(entry.text, deny)) report("denylist", "matches the deny-list of real names");
}

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
const rel = (root, file) => path.relative(root, file).split(path.sep).join("/");

function scanContent(root, deny, findings, refs) {
  let strings = 0;
  for (const dir of SCAN_DIRS.content) {
    for (const file of walk(path.join(root, dir))) {
      const text = readFileSync(file, "utf8");
      const name = rel(root, file);
      const isMdx = file.endsWith(".mdx");
      const prose = isMdx ? extractMdxProse(text) : extractContentStrings(text, file);
      strings += prose.length;
      prose.forEach((entry) => checkText(entry, name, deny, findings));
      const fileRefs = claimRefs(text);
      refs.push(...fileRefs.map((r) => ({ ...r, file: name })));
      const declared = isMdx ? mdxClaimDeclaration(text) !== null : fileRefs.length > 0;
      if ((isMdx || prose.length > 0) && !declared) {
        findings.push({
          file: name,
          line: 1,
          rule: "missing-claims-declaration",
          message: isMdx
            ? "MDX file needs a {/* claims: C-nn */} comment"
            : "content file has prose but no claim id",
        });
      }
    }
  }
  return strings;
}

function scanUi(root, deny, findings) {
  let strings = 0;
  for (const dir of SCAN_DIRS.ui) {
    for (const file of walk(path.join(root, dir)).filter((f) => !f.endsWith(".mdx"))) {
      const name = rel(root, file);
      for (const entry of extractUiStrings(readFileSync(file, "utf8"), file)) {
        strings += 1;
        if (PROSE_LETTERS.test(entry.text)) {
          findings.push({
            file: name,
            line: entry.line,
            rule: "no-inline-prose",
            message: `${entry.kind} text must come from src/content, not be written inline`,
          });
        }
        checkText(entry, name, deny, findings);
      }
    }
  }
  return strings;
}

const demoStrings = (source, file) =>
  file.endsWith(".tsx") ? extractUiStrings(source, file) : extractContentStrings(source, file);

/** Demo pages: a NUM figure needs a registered claim id in the same file; listed names never pass. */
function scanDemo(root, deny, findings, refs) {
  let strings = 0;
  for (const dir of SCAN_DIRS.demo) {
    for (const file of walk(path.join(root, dir)).filter((f) => !f.endsWith(".mdx"))) {
      const text = readFileSync(file, "utf8");
      const name = rel(root, file);
      const fileRefs = claimRefs(text);
      refs.push(...fileRefs.map((r) => ({ ...r, file: name })));
      for (const entry of demoStrings(text, file)) {
        strings += 1;
        const report = (rule, message) =>
          findings.push({ file: name, line: entry.line, rule, message });
        const figure = numFigure(entry.text);
        if (figure && fileRefs.length === 0) {
          report("num-figure", `${figure.message}; cite a claim id in this file (// claims: C-nn)`);
        }
        if (denylistHit(entry.text, deny))
          report("denylist", "matches the deny-list of real names");
      }
    }
  }
  return strings;
}

function checkClaims({ root, registerPath, matrixPath }, refs, findings) {
  const registerFile = path.join(root, registerPath);
  const register = existsSync(registerFile)
    ? parseRegister(readFileSync(registerFile, "utf8"))
    : new Map();
  const matrixFile = path.join(root, matrixPath);
  const matrixRefs = existsSync(matrixFile)
    ? claimRefs(readFileSync(matrixFile, "utf8")).map((r) => ({ ...r, file: matrixPath }))
    : [];
  const all = [...refs, ...matrixRefs];
  for (const ref of all) {
    if (!register.has(ref.id)) {
      findings.push({
        file: ref.file,
        line: ref.line,
        rule: "unknown-claim",
        message: `${ref.id} is not in the claim register`,
      });
    }
  }
  const referenced = new Set(all.map((r) => r.id));
  for (const [id, row] of register) {
    const inRange = row.number >= P4_CLAIM_RANGE.min && row.number <= P4_CLAIM_RANGE.max;
    if (inRange && !referenced.has(id)) {
      findings.push({
        file: registerPath,
        line: row.line,
        rule: "orphan-register-row",
        message: `${id} is in the register but no content file or matrix row references it`,
      });
    }
  }
  return register.size;
}

/**
 * @param {{ root: string; denylist?: string[]; denyTerms?: string[]; registerPath?: string; matrixPath?: string }} options
 * @returns {{ ok: boolean; findings: { file: string; line: number; rule: string; message: string }[]; stats: object }}
 */
export function runClaimsCheck({
  root,
  denylist,
  denyTerms,
  registerPath = "PROGRESS.md",
  matrixPath = "docs/CONTENT_MATRIX.md",
}) {
  const deny = {
    deny: new Set(denylist ?? readJson(DEFAULT_DENYLIST)),
    terms: denyTerms ?? readJson(DEFAULT_DENY_TERMS).terms,
  };
  const findings = [];
  const refs = [];
  const contentStrings = scanContent(root, deny, findings, refs);
  const uiStrings = scanUi(root, deny, findings) + scanDemo(root, deny, findings, refs);
  const registerRows = checkClaims({ root, registerPath, matrixPath }, refs, findings);
  return {
    ok: findings.length === 0,
    findings,
    stats: { contentStrings, uiStrings, registerRows },
  };
}

function main() {
  const root = path.resolve(process.argv[2] ?? process.cwd());
  const { ok, findings, stats } = runClaimsCheck({ root });
  for (const f of findings) process.stderr.write(`${f.file}:${f.line} ${f.rule} ${f.message}\n`);
  if (!ok) {
    process.stderr.write(`claims:check: ${findings.length} finding(s)\n`);
    process.exit(1);
  }
  process.stdout.write(
    `claims:check: ok (${stats.contentStrings} content strings, ${stats.uiStrings} UI strings, ${stats.registerRows} register rows)\n`,
  );
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) main();
