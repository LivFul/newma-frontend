import type { CopyBlock } from "../types";
import type { EcosystemEntry } from "./registry";

const block = (id: string, text: string, claims: readonly string[] = []): CopyBlock =>
  Object.freeze({ id, text, claims: Object.freeze([...claims]) });

const ALL_PAGES = ["C-40", "C-41", "C-42", "C-43", "C-44", "C-45"] as const;

export const DETAIL_COPY = Object.freeze({
  relatedHeading: block("detail.related.heading", "Other components", ["C-48"]),
  fitHeading: block("detail.fit.heading", "How it fits the platform"),
  descriptionHeading: block("detail.description.heading", "Description", ALL_PAGES),
  functionsHeading: block("detail.functions.heading", "Designed functions", ALL_PAGES),
  handoffHeading: block("detail.handoff.heading", "Handoff", ALL_PAGES),
  proposed: block(
    "detail.proposed",
    "This page describes a proposed architecture. It is not evidence of an existing deployment.",
    ALL_PAGES,
  ),
  demoHeading: block("detail.demo.heading", "Explore the demo"),
  demoCta: block("detail.demo.cta", "Explore the demo", ["C-47"]),
  ogAlt: block("detail.og.alt", "A NEWMA ecosystem component", ["C-50"]),
  signIn: block("detail.demo.signin", "Opens Demo sign-in.", ["C-47"]),
  backToEcosystem: block("detail.back.ecosystem", "Back to ecosystem", ["C-48"]),
});

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

export const detailTitle = (entry: EcosystemEntry): string =>
  `${entry.title} \u2014 NEWMA ecosystem`;
