import { HeroSection } from "@/components/site/hero-section";
import { JsonLd } from "@/components/site/json-ld";
import { LegacyHomeHashRedirect } from "@/components/site/legacy-home-hash";
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
      <LegacyHomeHashRedirect />
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      <HeroSection />
    </>
  );
}
