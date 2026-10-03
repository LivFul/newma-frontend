import { HERO_HELP_ITEMS, HERO_HELP_SUMMARY } from "@/content/home/hero-help";

// Native disclosure: works without JavaScript and is operable with Enter and Space.
export function KeyboardHelp() {
  return (
    <details className="eco-help mx-auto max-w-[34rem] text-sm text-fg-muted">
      <summary className="inline-flex min-h-11 cursor-pointer items-center text-fg underline underline-offset-4">
        {HERO_HELP_SUMMARY.text}
      </summary>
      <ul className="list-disc space-y-1 pb-3 pl-6">
        {HERO_HELP_ITEMS.map((item) => (
          <li key={item.id}>{item.text}</li>
        ))}
      </ul>
    </details>
  );
}
