import { HERO } from "@/content/copy";

export function Hero() {
  return (
    <section aria-label={HERO.text}>
      <h1>{HERO.text}</h1>
      <span aria-hidden="true">/</span>
    </section>
  );
}
