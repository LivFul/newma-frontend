import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";

export type PageMetadataInput = Readonly<{
  /** Site-relative path; Next resolves it against metadataBase (the canonical origin). */
  path: string;
  title: string;
  description: string;
  index?: boolean;
}>;

// One title, one description, one canonical per page. Open Graph and Twitter repeat them, and the
// image comes from the colocated opengraph-image file convention.
export function pageMetadata({
  path,
  title,
  description,
  index = true,
}: PageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", siteName: SITE_NAME, url: path, title, description },
    twitter: { card: "summary_large_image", title, description },
    robots: { index, follow: true },
  };
}
