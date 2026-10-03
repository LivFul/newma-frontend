import { ImageResponse } from "next/og";
import { PARTS } from "@/components/ecosystem-graphic/geometry";
import { DETAIL_COPY } from "@/content/ecosystem/detail-copy";
import { ECOSYSTEM, ECOSYSTEM_SLUGS, isEcosystemSlug } from "@/content/ecosystem/registry";
import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/lib/seo/og";

export const alt = DETAIL_COPY.ogAlt.text;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const dynamicParams = false;

export function generateStaticParams() {
  return ECOSYSTEM_SLUGS.map((slug) => ({ slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isEcosystemSlug(slug)) throw new Error(`Unknown ecosystem slug: ${slug}`);
  const part = PARTS.find((p) => p.slug === slug)!;
  return new ImageResponse(
    <OgCard
      title={ECOSYSTEM[slug].title}
      kicker={ECOSYSTEM[slug].descriptor}
      glyph={part.glyph}
      tone={part.tone}
    />,
    { ...OG_SIZE },
  );
}
