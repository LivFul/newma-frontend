import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DemoLink } from "@/components/site/demo-link";
import { DetailHeader } from "@/components/site/detail-header";
import { JsonLd } from "@/components/site/json-ld";
import { RelatedComponents } from "@/components/site/related-components";
import { SourcesList } from "@/components/site/sources-list";
import { DETAIL_COPY, detailTitle } from "@/content/ecosystem/detail-copy";
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
    title: detailTitle(entry),
    description: metaDescription(entry.summary),
  });
}

export default async function EcosystemPage({ params }: Params) {
  const { slug } = await params;
  if (!isEcosystemSlug(slug)) notFound();
  const entry = ECOSYSTEM[slug];
  const { default: Body } = await import(`@/content/ecosystem/${slug}.mdx`);
  return (
    <article className="px-5 py-10 md:px-12 md:py-14">
      <JsonLd data={techArticleJsonLd(slug)} />
      <div className="grid w-full gap-x-16 gap-y-12 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-5 lg:self-start lg:[@media(min-height:56rem)]:sticky lg:[@media(min-height:56rem)]:top-[calc(var(--size-header)+2.5rem)]">
          <DetailHeader entry={entry} />
        </div>
        <div className="min-w-0 lg:col-span-7 lg:border-l lg:border-border lg:pl-16">
          <section aria-labelledby="fit-heading">
            <h2 id="fit-heading" className="text-2xl font-medium tracking-[-0.015em]">
              {DETAIL_COPY.fitHeading.text}
            </h2>
            <p className="mt-4 max-w-[52ch] text-xl leading-snug text-fg-muted">{entry.fit}</p>
          </section>
          <Body />
          <SourcesList entry={entry} />
          <DemoLink entry={entry} />
          <RelatedComponents current={slug} />
        </div>
      </div>
    </article>
  );
}
