import { ClosingSection } from "@/components/site/closing-section";
import { ProductOverviewSection } from "@/components/site/product-overview-section";
import { MARKETING_PAGES } from "@/content/home/copy";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata = pageMetadata({
  path: "/overview",
  title: MARKETING_PAGES.overview.title.text,
  description: MARKETING_PAGES.overview.description.text,
});

export default function OverviewPage() {
  return (
    <>
      <ProductOverviewSection pageTitle />
      <ClosingSection />
    </>
  );
}
