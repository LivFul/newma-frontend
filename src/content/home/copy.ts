import type { CopyBlock } from "../types";

// Homepage copy (D-06). Agent-drafted from the source documents and approved or edited by the user at
// CP-2. Every block names the claim-register rows (PROGRESS.md) that cover it; an empty list is only
// for structural labels of four words or fewer. Wording is design intent ("is designed to",
// "proposed"): the sources say deployment and performance are unverified (assumption A-P4-19).
const block = (id: string, text: string, claims: readonly string[] = []): CopyBlock =>
  Object.freeze({ id, text, claims: Object.freeze([...claims]) });

export const HERO = Object.freeze({
  // [Recommendation] A-P4-20: adapted from PRD 1.1.
  title: block(
    "home.hero.title",
    "From authorized knowledge to evidence-backed discovery decisions",
    ["C-20"],
  ),
  lede: block(
    "home.hero.lede",
    "NEWMA is a proposed platform that connects authorized ethnobotanical knowledge and authenticated botanical materials to computational prioritization, controlled experiments and scientist-approved observations, while keeping source attribution, confidentiality and benefit obligations attached.",
    ["C-20"],
  ),
  disclaimer: block(
    "home.hero.disclaimer",
    "The demo uses synthetic data and is not evidence of scientific performance, deployment or compliance.",
    ["C-21"],
  ),
  demoCta: block("home.hero.cta.demo", "See the demo", ["C-21"]),
  howCta: block("home.hero.cta.how", "How it works"),
});

export const PRODUCT = Object.freeze({
  heading: block("home.product.heading", "What NEWMA is"),
  what: block(
    "home.product.what",
    "NEWMA is proposed as a hybrid computational and experimental platform for ethnobotanical drug discovery.",
    ["C-22"],
  ),
  problemHeading: block("home.product.problem.heading", "The problem it addresses"),
  problem: block(
    "home.product.problem",
    "Discovery decisions stall because knowledge, physical material, chemical identity and biological evidence are hard to connect reliably.",
    ["C-23"],
  ),
  howHeading: block("home.product.how.heading", "How it works"),
  guardrail: block(
    "home.product.guardrail",
    "Computational outputs remain hypotheses. Scientists approve experimental work and advancement.",
    ["C-24"],
  ),
  demoCta: block("home.product.cta.demo", "See the demo", ["C-21"]),
  personasHeading: block("home.product.personas.heading", "Who it is for"),
  supportingRoles: block(
    "home.product.personas.supporting",
    "Supporting roles include tenant administrators, scientific approvers, data stewards, legal reviewers and security operators.",
    ["C-25"],
  ),
});

export const COMPONENTS_INDEX = Object.freeze({
  heading: block("home.components.heading", "The six components"),
  intro: block(
    "home.components.intro",
    "Each component has its own page, with the sources it is drawn from.",
    ["C-48"],
  ),
});

export const ABOUT = Object.freeze({
  heading: block("home.about.heading", "About LivFul"),
});

// Meta description of the home page (claim C-50, derived: no new claim).
export const HOME_META = Object.freeze({
  // Default for any route that sets no metadata of its own (the 404 page).
  defaultDescription: block(
    "home.meta.default",
    "NEWMA is a proposed ethnobotanical drug-discovery platform by LivFul.",
    ["C-50"],
  ),
  title: block("home.meta.title", "NEWMA \u2014 evidence-led discovery from authorized knowledge", [
    "C-50",
  ]),
  ogAlt: block(
    "home.meta.ogalt",
    "NEWMA, a proposed platform for evidence-led ethnobotanical discovery",
    ["C-50"],
  ),
  description: block(
    "home.meta.description",
    "NEWMA is a proposed platform that connects authorized ethnobotanical knowledge to computational prioritization and scientist-approved experiments.",
    ["C-50"],
  ),
});

export const OFFLINE = Object.freeze({
  title: block("home.offline.title", "You are offline"),
  body: block(
    "home.offline.body",
    "NEWMA cannot reach the network right now. Reconnect to continue, or return to the last page you visited.",
    ["C-21"],
  ),
});
