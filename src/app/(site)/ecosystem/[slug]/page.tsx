import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DemoLink } from "@/components/site/demo-link";
import { DetailHeader } from "@/components/site/detail-header";
import { JsonLd } from "@/components/site/json-ld";
import { SourcesList } from "@/components/site/sources-list";
import { DETAIL_COPY } from "@/content/ecosystem/detail-copy";
import {
  ECOSYSTEM,
  ECOSYSTEM_SLUGS,
  isEcosystemSlug,
  metaDescription,
} from "@/content/ecosystem/registry";
import { techArticleJsonLd } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/metadata";

type Params = { params: Promise<{ slug: string }> };

// Compiled at build and rendered as a server component: zero client JS for the prose, a 404 for any
// unknown slug (assumption A-P4-08).
export const dynamicParams = false;

export function generateStaticParams() {
  return ECOSYSTEM_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  if (!isEcosystemSlug(slug)) notFound();
  const entry = ECOSYSTEM[slug];
  return pageMetadata({
    path: `/ecosystem/${slug}`,
    title: `${entry.title} \u2014 NEWMA ecosystem`,
    description: metaDescription(entry.summary),
  });
}

export default async function EcosystemPage({ params }: Params) {
  const { slug } = await params;
  if (!isEcosystemSlug(slug)) notFound();
  const entry = ECOSYSTEM[slug];
  const { default: Body } = await import(`@/content/ecosystem/${slug}.mdx`);
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 md:px-8 md:py-16">
      <JsonLd data={techArticleJsonLd(slug)} />
      <DetailHeader entry={entry} />
      <section aria-labelledby="fit-heading" className="mt-12 border-t border-border pt-8">
        <h2 id="fit-heading" className="font-display text-2xl tracking-tight">
          {DETAIL_COPY.fitHeading.text}
        </h2>
        <p className="mt-4 max-w-[62ch]">{entry.fit}</p>
      </section>
      <Body />
      <p className="mt-12 max-w-[62ch] text-sm text-fg-muted">{DETAIL_COPY.proposed.text}</p>
      <SourcesList entry={entry} />
      <DemoLink entry={entry} />
    </article>
  );
}
