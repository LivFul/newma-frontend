import { EcosystemGraphic } from "@/components/ecosystem-graphic/ecosystem-graphic";

// Temporary composition for Task 3; Task 4 replaces it with the real home sections.
export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:px-8">
      <h1 className="font-display text-display">
        From authorized knowledge to evidence-backed discovery decisions
      </h1>
      <section id="product" aria-labelledby="product-heading" className="py-12">
        <h2 id="product-heading" className="text-2xl">
          Product
        </h2>
        <EcosystemGraphic />
      </section>
      <section id="about" aria-labelledby="about-heading" className="py-12">
        <h2 id="about-heading" className="text-2xl">
          About LivFul
        </h2>
      </section>
    </div>
  );
}
