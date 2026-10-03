import type { CopyBlock } from "../types";

export type Step = Readonly<{ title: CopyBlock; text: CopyBlock }>;

const step = (id: string, title: string, text: string): Step =>
  Object.freeze({
    title: Object.freeze({ id: `${id}.title`, text: title, claims: Object.freeze(["C-24"]) }),
    text: Object.freeze({ id: `${id}.text`, text, claims: Object.freeze(["C-24"]) }),
  });

// The four steps are a true sequence, so they are numbered (by CSS counters, not by copy).
// Sources: TA 2 (agentic discovery), TA 1 and 2 (durable workflows), TA 3 (wet-lab loop), TA 4 (provenance).
export const HOW_IT_WORKS: readonly Step[] = Object.freeze([
  step(
    "home.how.agentic",
    "Agentic discovery",
    "A scientist submits a query, an objective and constraints. The agent is designed to check access and rights first, retrieve only within the authorized scope, and return ranked hypotheses with their limitations.",
  ),
  step(
    "home.how.screening",
    "Durable screening",
    "Screening requests are designed to run as durable workflows with budgets, bounded retries, cancellation and holds, recording inputs, versions, settings and seeds.",
  ),
  step(
    "home.how.wetlab",
    "Wet-lab loop",
    "Scientists approve assay requests. Results return with raw data, replicates and uncertainty, and only observations a scientist accepts count as evidence.",
  ),
  step(
    "home.how.provenance",
    "Signed provenance",
    "Decisions and records are designed to carry signed, versioned provenance. A ledger layer is an optional extension, and authoritative records stay off-chain.",
  ),
]);
