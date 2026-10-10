import { ProductStepsSection } from "@/components/site/product-steps-section";
import { WorkflowSection } from "@/components/site/workflow-section";
import { MARKETING_PAGES } from "@/content/home/copy";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata = pageMetadata({
  path: "/how-it-works",
  title: MARKETING_PAGES.howItWorks.title.text,
  description: MARKETING_PAGES.howItWorks.description.text,
});

export default function HowItWorksPage() {
  return (
    <>
      <ProductStepsSection pageTitle />
      <WorkflowSection />
    </>
  );
}
