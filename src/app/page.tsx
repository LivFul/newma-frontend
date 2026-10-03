import { EcosystemGraphic } from "@/components/ecosystem-graphic/ecosystem-graphic";

// Temporary mount for Task 1; replaced by the (site) home in Task 3 and 4.
export default function Home() {
  return (
    <main id="main" tabIndex={-1} className="mx-auto max-w-5xl p-8">
      <h1 className="text-3xl font-semibold">NEWMA</h1>
      <EcosystemGraphic />
    </main>
  );
}
