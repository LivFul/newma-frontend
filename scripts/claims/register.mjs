// Claim register and content matrix parsing. The register is the table under "## Claim register" in
// PROGRESS.md; a row looks like `| C-20 | surface | claim | source | status |`.

const REGISTER_HEADING = /^##\s+Claim register\s*$/;
const NEXT_HEADING = /^##\s+/;
const ROW = /^\|\s*(C-(\d+))\s*\|/;
export const CLAIM_ID = /\bC-\d{2}\b/g;

/** @returns {Map<string, { line: number; number: number; status: string }>} */
export function parseRegister(text) {
  const rows = new Map();
  let inside = false;
  text.split("\n").forEach((raw, index) => {
    if (REGISTER_HEADING.test(raw)) inside = true;
    else if (inside && NEXT_HEADING.test(raw)) inside = false;
    if (!inside) return;
    const match = ROW.exec(raw);
    if (!match) return;
    const cells = raw.split("|").map((cell) => cell.trim());
    rows.set(match[1], {
      line: index + 1,
      number: Number(match[2]),
      status: cells[cells.length - 2] ?? "",
    });
  });
  return rows;
}

/** @returns {{ id: string; line: number }[]} every claim id mentioned in the text. */
export function claimRefs(text) {
  return text
    .split("\n")
    .flatMap((raw, index) =>
      [...raw.matchAll(CLAIM_ID)].map((match) => ({ id: match[0], line: index + 1 })),
    );
}

/** Ids declared by an MDX `{/* claims: C-40, C-47 *\/}` comment, or null when there is none. */
export function mdxClaimDeclaration(text) {
  const match = /\{\/\*\s*claims:\s*([^*]*?)\s*\*\/\}/.exec(text);
  return match ? [...match[1].matchAll(CLAIM_ID)].map((m) => m[0]) : null;
}
