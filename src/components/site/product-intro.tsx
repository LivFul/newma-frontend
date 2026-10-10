import { ProductOverviewSection } from "./product-overview-section";
import { ProductStepsSection } from "./product-steps-section";

/** @deprecated Homepage no longer composes the full intro; use overview and steps sections on dedicated routes. */
export function ProductIntro() {
  return (
    <>
      <ProductOverviewSection />
      <ProductStepsSection />
    </>
  );
}
