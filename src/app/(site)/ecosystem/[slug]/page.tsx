import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ComponentBody } from "@/components/site/component-body";
import { DemoLink } from "@/components/site/demo-link";
import { DetailHeader } from "@/components/site/detail-header";
import { JsonLd } from "@/components/site/json-ld";
import { RelatedComponents } from "@/components/site/related-components";
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
  return (
    <article className="px-5 py-10 md:px-12 md:py-14">
      <JsonLd data={techArticleJsonLd(slug)} />
      <div className="grid w-full gap-x-16 gap-y-12 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-5 lg:self-start lg:[@media(min-height:56rem)]:sticky lg:[@media(min-height:56rem)]:top-[calc(var(--size-header)+2.5rem)]">
          <DetailHeader entry={entry} />
        </div>
        <div className="min-w-0 lg:col-span-7 lg:border-l lg:border-border lg:pl-16">
          <ComponentBody entry={entry} />
          <section aria-labelledby="fit-heading" className="mt-10 border-t border-border pt-10">
            <h2 id="fit-heading" className="text-2xl font-medium tracking-[-0.015em]">
              {DETAIL_COPY.fitHeading.text}
            </h2>
            <p className="mt-4 max-w-[52ch] text-xl leading-snug text-fg-muted">{entry.fit}</p>
          </section>
          <DemoLink entry={entry} />
          <RelatedComponents current={slug} />
          <p className="mt-10">
            <Link
              href="/#components"
              className="inline-flex min-h-11 items-center text-fg-muted underline hover:text-fg"
            >
              {DETAIL_COPY.backToEcosystem.text}
            </Link>
          </p>
        </div>
      </div>
    </article>
  );
}
