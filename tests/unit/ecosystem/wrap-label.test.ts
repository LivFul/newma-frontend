import { describe, expect, it } from "vitest";
import { wrapHeroLabel } from "@/components/ecosystem-graphic/wrap-label";
import { HERO_LABELS } from "@/content/ecosystem/registry";

describe("wrapHeroLabel", () => {
  it("keeps short labels on one line", () => {
    expect(wrapHeroLabel("Interface")).toEqual(["Interface"]);
    expect(wrapHeroLabel("Wet Lab")).toEqual(["Wet Lab"]);
    expect(wrapHeroLabel(HERO_LABELS["agentic-compute"].title)).toEqual(["Agentic Compute"]);
    expect(wrapHeroLabel(HERO_LABELS.interface.descriptor)).toEqual(["People and API"]);
  });

  it("splits on an ampersand and at the nearest space to the middle", () => {
    expect(wrapHeroLabel(HERO_LABELS["data-knowledge"].title)).toEqual(["Data &", "Knowledge"]);
    expect(wrapHeroLabel(HERO_LABELS["provenance-dlt"].title)).toEqual(["Provenance &", "DLT"]);
    expect(wrapHeroLabel(HERO_LABELS["scientific-review"].title)).toEqual(["Scientific", "Review"]);
    expect(wrapHeroLabel("Where people sign in")).toEqual(["Where people", "sign in"]);
  });
});
