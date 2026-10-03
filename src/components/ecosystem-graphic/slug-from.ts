import { isEcosystemSlug, type EcosystemSlug } from "@/content/ecosystem/registry";

/** The ecosystem slug of the hero part that contains the event target, if any. */
export function slugFrom(target: EventTarget | null): EcosystemSlug | null {
  const slug = (target as Element | null)?.closest?.("[data-slug]")?.getAttribute("data-slug");
  return slug && isEcosystemSlug(slug) ? slug : null;
}
