import type { MetadataRoute } from "next";
import { ECOSYSTEM_SLUGS } from "@/content/ecosystem/registry";
import { absoluteUrl, LEGAL_APPROVED } from "@/lib/site";

// Only the pages meant to be indexed. No lastModified: the site makes no date claims. Never the demo,
// sign-in or primitives pages, and the legal pages only once they are approved.
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    "/overview",
    "/how-it-works",
    "/ecosystem",
    "/about",
    ...ECOSYSTEM_SLUGS.map((slug) => `/ecosystem/${slug}`),
    ...(LEGAL_APPROVED ? ["/legal/privacy", "/legal/terms"] : []),
  ];
  return paths.map((path) => ({ url: absoluteUrl(path) }));
}
