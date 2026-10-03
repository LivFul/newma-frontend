import { AboutLivful } from "@/components/site/about-livful";
import { ComponentIndex } from "@/components/site/component-index";
import { HeroSection } from "@/components/site/hero-section";
import { ProductIntro } from "@/components/site/product-intro";

export default function Home() {
  return (
    <>
      <HeroSection />
      <ProductIntro />
      <ComponentIndex />
      <AboutLivful />
    </>
  );
}
