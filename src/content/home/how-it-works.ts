import type { CopyBlock } from "../types";

export type Step = Readonly<{ title: CopyBlock; text: CopyBlock }>;

const step = (id: string, title: string, text: string): Step =>
  Object.freeze({
    title: Object.freeze({ id: `${id}.title`, text: title, claims: Object.freeze(["C-24"]) }),
    text: Object.freeze({ id: `${id}.text`, text, claims: Object.freeze(["C-24"]) }),
  });

export const HOW_IT_WORKS: readonly Step[] = Object.freeze([
  step(
    "home.how.define",
    "Define the research question",
    "Set the scientific objective, permitted uses and project constraints. Begin with knowledge and materials authorized for the intended research.",
  ),
  step(
    "home.how.prioritize",
    "Prioritize what to test",
    "Use curated chemistry and approved computational methods to rank hypotheses, with supporting sources, reproducibility records and explicit uncertainty.",
  ),
  step(
    "home.how.test",
    "Test under scientific supervision",
    "Scientists review and approve experiments. Laboratory results return with material identity, protocols, controls and raw data for assessment.",
  ),
  step(
    "home.how.record",
    "Build a traceable evidence record",
    "Connect reviewed observations to their sources, materials and decisions. Use accepted findings, including negative results, to inform subsequent research.",
  ),
]);
