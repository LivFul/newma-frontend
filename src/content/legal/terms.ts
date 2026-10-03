import { block, DRAFT_LABEL, section, type LegalDocument } from "./types";

export const TERMS: LegalDocument = Object.freeze({
  title: block("legal.terms.title", "Terms", ["C-30"]),
  draftLabel: DRAFT_LABEL,
  sections: Object.freeze([
    section(
      block("legal.terms.purpose.heading", "What this site is"),
      block(
        "legal.terms.purpose.text",
        "This site describes NEWMA, a proposed platform, and offers a demo of how it is designed to work.",
        ["C-22"],
      ),
    ),
    section(
      block("legal.terms.demo.heading", "The demo"),
      block(
        "legal.terms.demo.text",
        "The demo runs on synthetic data. It is not evidence of scientific performance, deployment or compliance.",
        ["C-01"],
      ),
    ),
    section(
      block("legal.terms.advice.heading", "No advice"),
      block(
        "legal.terms.advice.text",
        "Nothing on this site is scientific, legal or financial advice.",
        ["C-52"],
      ),
    ),
    section(
      block("legal.terms.scope.heading", "What this draft does not cover"),
      block(
        "legal.terms.scope.text",
        "This draft names no jurisdiction or governing law. Those are to be decided with legal advice before it is published.",
        ["C-31"],
      ),
    ),
    section(
      block("legal.terms.contact.heading", "Contact"),
      block("legal.terms.contact.text", "Contact details to be supplied by LivFul.", ["C-29"]),
    ),
  ]),
});
