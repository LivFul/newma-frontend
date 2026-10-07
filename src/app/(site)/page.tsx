import { AboutNewma } from "@/components/site/about-newma";
import { ClosingSection } from "@/components/site/closing-section";
import { ComponentIndex } from "@/components/site/component-index";
import { HeroSection } from "@/components/site/hero-section";
import { JsonLd } from "@/components/site/json-ld";
import { ProductIntro } from "@/components/site/product-intro";
import { WorkflowSection } from "@/components/site/workflow-section";
import { HOME_META } from "@/content/home/copy";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata = pageMetadata({
  path: "/",
  title: HOME_META.title.text,
  description: HOME_META.description.text,
});

export default function Home() {
  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      <HeroSection />
      <ProductIntro />
      <WorkflowSection />
      <ComponentIndex />
      <AboutNewma />
      <ClosingSection />
    </>
  );
}
