import { describe, expect, it } from "vitest";
import {
  organizationJsonLd,
  serializeJsonLd,
  techArticleJsonLd,
  websiteJsonLd,
} from "@/lib/seo/json-ld";
import { ECOSYSTEM, ECOSYSTEM_SLUGS, metaDescription } from "@/content/ecosystem/registry";
import { FALLBACK_SITE_URL } from "@/lib/site";

describe("JSON-LD builders", () => {
  it("describes the organisation with no logo, contact point or sameAs", () => {
    const org = organizationJsonLd();
    expect(org).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "LivFul",
      url: `${FALLBACK_SITE_URL}/`,
    });
    for (const forbidden of ["logo", "contactPoint", "sameAs", "email", "telephone", "address"]) {
      expect(org).not.toHaveProperty(forbidden);
    }
  });
  it("describes the website and links the publisher by @id", () => {
    const site = websiteJsonLd();
    expect(site).toMatchObject({ "@type": "WebSite", name: "NEWMA", url: `${FALLBACK_SITE_URL}/` });
    expect(site.publisher).toEqual({ "@id": organizationJsonLd()["@id"] });
  });
  it("describes each component page as a TechArticle with no dates, authors or citations", () => {
    for (const slug of ECOSYSTEM_SLUGS) {
      const article = techArticleJsonLd(slug);
      expect(article).toMatchObject({
        "@type": "TechArticle",
        headline: ECOSYSTEM[slug].title,
        description: metaDescription(ECOSYSTEM[slug].summary),
        url: `${FALLBACK_SITE_URL}/ecosystem/${slug}`,
        inLanguage: "en",
      });
      for (const forbidden of ["datePublished", "dateModified", "author", "citation"]) {
        expect(article).not.toHaveProperty(forbidden);
      }
      expect(article.isPartOf).toEqual({ "@id": websiteJsonLd()["@id"] });
      expect(article.publisher).toEqual({ "@id": organizationJsonLd()["@id"] });
    }
  });
  it("uses the canonical origin even when VERCEL_URL is set", () => {
    process.env.VERCEL_URL = "preview-abc.vercel.app";
    try {
      expect(organizationJsonLd().url).toBe(`${FALLBACK_SITE_URL}/`);
    } finally {
      delete process.env.VERCEL_URL;
    }
  });
});

describe("serializeJsonLd", () => {
  it("escapes every < so markup cannot close the script tag", () => {
    const text = serializeJsonLd({
      "@type": "Thing",
      name: "</script><img src=x onerror=alert(1)>",
    });
    expect(text).not.toContain("<");
    expect(text).toContain("\\u003c/script>");
    expect(JSON.parse(text).name).toBe("</script><img src=x onerror=alert(1)>");
  });
  it("escapes U+2028 and U+2029 line separators", () => {
    const text = serializeJsonLd({ name: "a\u2028b\u2029c" });
    expect(text).not.toMatch(/[\u2028\u2029]/);
    expect(JSON.parse(text).name).toBe("a\u2028b\u2029c");
  });
  it("round-trips real documents as JSON", () => {
    for (const doc of [organizationJsonLd(), websiteJsonLd(), techArticleJsonLd("wet-lab")]) {
      expect(JSON.parse(serializeJsonLd(doc))).toEqual(JSON.parse(JSON.stringify(doc)));
    }
  });
});
