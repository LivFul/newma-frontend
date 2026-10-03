import { ECOSYSTEM, metaDescription, type EcosystemSlug } from "@/content/ecosystem/registry";
import { absoluteUrl, SITE_NAME } from "@/lib/site";

type JsonLd = Readonly<Record<string, unknown>>;
const CONTEXT = "https://schema.org";

const orgId = () => `${absoluteUrl("/")}#organization`;
const siteId = () => `${absoluteUrl("/")}#website`;

// No logo, contact point or sameAs: none exists in any source (assumptions A-P4-01, A-P4-02).
export function organizationJsonLd() {
  return {
    "@context": CONTEXT,
    "@type": "Organization",
    "@id": orgId(),
    name: "LivFul",
    url: absoluteUrl("/"),
  } as const;
}

export function websiteJsonLd() {
  return {
    "@context": CONTEXT,
    "@type": "WebSite",
    "@id": siteId(),
    name: SITE_NAME,
    url: absoluteUrl("/"),
    publisher: { "@id": orgId() },
  } as const;
}

// No dates, authors or citations: the pages carry none and the internal sources are not republished.
export function techArticleJsonLd(slug: EcosystemSlug) {
  const entry = ECOSYSTEM[slug];
  return {
    "@context": CONTEXT,
    "@type": "TechArticle",
    headline: entry.title,
    description: metaDescription(entry.summary),
    url: absoluteUrl(`/ecosystem/${slug}`),
    mainEntityOfPage: absoluteUrl(`/ecosystem/${slug}`),
    // Inlined, not bare @id references: structured data is read per page, and these nodes are only
    // defined in full on the home page.
    isPartOf: { "@type": "WebSite", "@id": siteId(), name: SITE_NAME, url: absoluteUrl("/") },
    publisher: { "@type": "Organization", "@id": orgId(), name: "LivFul", url: absoluteUrl("/") },
    inLanguage: "en",
  } as const;
}

/** JSON for an inline script: every < is escaped so content can never close the tag (Next JSON-LD guide). */
export function serializeJsonLd(value: JsonLd): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
