import { describe, expect, it, vi } from "vitest";
import { pageMetadata } from "@/lib/seo/metadata";
import { ECOSYSTEM, ECOSYSTEM_SLUGS, metaDescription } from "@/content/ecosystem/registry";
import { LEGAL_APPROVED } from "@/lib/site";

vi.mock("next/navigation", () => ({ notFound: () => undefined }));

const MIN = 120;
const MAX = 160;
const MAX_TITLE = 60;

describe("pageMetadata", () => {
  it("builds canonical, Open Graph and Twitter fields from one path", () => {
    const meta = pageMetadata({ path: "/ecosystem/wet-lab", title: "T", description: "D" });
    expect(meta.title).toBe("T");
    expect(meta.description).toBe("D");
    expect(meta.alternates?.canonical).toBe("/ecosystem/wet-lab");
    expect(meta.openGraph).toMatchObject({
      type: "website",
      siteName: "NEWMA",
      url: "/ecosystem/wet-lab",
      title: "T",
      description: "D",
    });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image" });
    expect(meta.robots).toEqual({ index: true, follow: true });
  });
  it("marks a page noindex when index is false", () => {
    const meta = pageMetadata({
      path: "/legal/privacy",
      title: "T",
      description: "D",
      index: false,
    });
    expect(meta.robots).toEqual({ index: false, follow: true });
  });
});

describe("home metadata", () => {
  it("has a title of at most 60 characters and a 120 to 160 character description", async () => {
    const { metadata } = await import("@/app/(site)/page");
    const title = String(metadata.title);
    expect(title).toBe("NEWMA | Ethnobotanical Drug Discovery by LivFul");
    expect(title.length).toBeLessThanOrEqual(MAX_TITLE);
    const description = String(metadata.description);
    expect(description.length).toBeGreaterThanOrEqual(MIN);
    expect(description.length).toBeLessThanOrEqual(MAX);
    expect(metadata.alternates?.canonical).toBe("/");
  });
});

describe("ecosystem detail metadata", () => {
  it("gives each page its own title, canonical path and sentence-boundary description", async () => {
    const { generateMetadata } = await import("@/app/(site)/ecosystem/[slug]/page");
    const seen = new Set<string>();
    for (const slug of ECOSYSTEM_SLUGS) {
      const meta = await generateMetadata({ params: Promise.resolve({ slug }) });
      expect(meta.title).toBe(`${ECOSYSTEM[slug].title} — NEWMA ecosystem`);
      expect(meta.alternates?.canonical).toBe(`/ecosystem/${slug}`);
      expect(meta.description).toBe(metaDescription(ECOSYSTEM[slug].summary));
      const description = String(meta.description);
      expect(description.length).toBeGreaterThanOrEqual(MIN);
      expect(description.length).toBeLessThanOrEqual(MAX);
      expect(seen.has(description)).toBe(false);
      seen.add(description);
      expect(meta.robots).toEqual({ index: true, follow: true });
    }
  });
});

describe("legal metadata", () => {
  it("is noindex until the legal text is approved", async () => {
    expect(LEGAL_APPROVED).toBe(false);
    for (const page of ["privacy", "terms"]) {
      const { metadata } = await import(`@/app/(site)/legal/${page}/page`);
      expect(metadata.robots).toEqual({ index: false, follow: true });
      expect(metadata.alternates?.canonical).toBe(`/legal/${page}`);
      expect(String(metadata.description).length).toBeGreaterThanOrEqual(MIN);
      expect(String(metadata.description).length).toBeLessThanOrEqual(MAX);
    }
  });
});
