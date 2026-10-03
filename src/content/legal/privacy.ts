import { block, DRAFT_LABEL, section, type LegalDocument } from "./types";

export const PRIVACY: LegalDocument = Object.freeze({
  title: block("legal.privacy.title", "Privacy", ["C-30"]),
  description: block(
    "legal.privacy.description",
    "Draft privacy notice for the NEWMA site: static public pages, cookieless analytics and a synthetic-data demo. Not legal advice.",
    ["C-50"],
  ),
  draftLabel: DRAFT_LABEL,
  sections: Object.freeze([
    section(
      block("legal.privacy.pages.heading", "The public pages"),
      block(
        "legal.privacy.pages.text",
        "The public pages of this site are static documents. They have no accounts, no forms and no advertising.",
        ["C-52"],
      ),
    ),
    section(
      block("legal.privacy.analytics.heading", "Analytics"),
      block(
        "legal.privacy.analytics.text",
        "This site uses Vercel Web Analytics, which is cookieless. It counts two interactions: a click on Access NEWMA and the opening of a component page. The events carry no identifiers beyond the name of the component.",
        ["C-51"],
      ),
    ),
    section(
      block("legal.privacy.demo.heading", "The demo"),
      block(
        "legal.privacy.demo.text",
        "The demo uses synthetic data. Signing in means choosing a persona, and no password or personal detail is requested. The demo sets one session cookie so that your chosen persona persists, and it is removed when you sign out or the session expires.",
        ["C-52"],
      ),
    ),
    section(
      block("legal.privacy.scope.heading", "What this draft does not cover"),
      block(
        "legal.privacy.scope.text",
        "This draft names no controller, jurisdiction or legal regime. Those are to be decided with legal advice before it is published.",
        ["C-31"],
      ),
    ),
    section(
      block("legal.privacy.contact.heading", "Contact"),
      block("legal.privacy.contact.text", "Contact details to be supplied by LivFul.", ["C-29"]),
    ),
  ]),
});
