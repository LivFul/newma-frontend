import type { CopyBlock } from "../types";
import type { EcosystemEntry } from "./registry";

const block = (id: string, text: string, claims: readonly string[] = []): CopyBlock =>
  Object.freeze({ id, text, claims: Object.freeze([...claims]) });

const ALL_PAGES = ["C-40", "C-41", "C-42", "C-43", "C-44", "C-45"] as const;

// Fixed headings and sentences shared by the six detail pages.
export const DETAIL_COPY = Object.freeze({
  fitHeading: block("detail.fit.heading", "How it fits the platform"),
  proposed: block(
    "detail.proposed",
    "This page describes a proposed architecture. It is not evidence of an existing deployment.",
    ALL_PAGES,
  ),
  sourcesHeading: block("detail.sources.heading", "Sources"),
  demoHeading: block("detail.demo.heading", "See it in the demo"),
  demoCta: block("detail.demo.cta", "See it in the demo", ["C-47"]),
  signIn: block("detail.demo.signin", "Opens Demo sign-in.", ["C-47"]),
});

/** What the demo block says after "Opens Demo sign-in." (claim C-47). */
export function demoInstruction(entry: EcosystemEntry): string {
  const { href, workflow } = entry.demo;
  return href === "/demo"
    ? `After signing in, you land on the demo dashboard (${href}).`
    : `After signing in, choose ${workflow} (${href}) from the demo dashboard.`;
}

export function demoLabelsSentence(entry: EcosystemEntry): string | null {
  const { labels } = entry.demo;
  return labels.length === 0 ? null : `In the demo this is labelled ${labels.join(", ")}.`;
}
