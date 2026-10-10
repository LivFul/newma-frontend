import { ComponentIndex } from "@/components/site/component-index";
import { MARKETING_PAGES } from "@/content/home/copy";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata = pageMetadata({
  path: "/ecosystem",
  title: MARKETING_PAGES.ecosystem.title.text,
  description: MARKETING_PAGES.ecosystem.description.text,
});

export default function EcosystemIndexPage() {
  return <ComponentIndex pageTitle />;
}
