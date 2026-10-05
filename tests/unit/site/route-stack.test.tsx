// Value: protects=detail sheet index is 1-based from the top of the stack and only that layer is lit; fails_when=the index is zero-based or every layer is dimmed; why_new=ecosystem e2e asserts the page title, not the sheet index; seam=none
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RouteStack } from "@/components/site/route-stack";
import { ECOSYSTEM_SLUGS, type EcosystemSlug } from "@/content/ecosystem/registry";
import { SURVEY_LABELS } from "@/content/home/survey";

describe("RouteStack", () => {
  it("numbers the current sheet from the top and lights only that layer", () => {
    const cases: ReadonlyArray<readonly [EcosystemSlug, number]> = [
      ["interface", 1],
      ["scientific-review", 3],
      ["provenance-dlt", ECOSYSTEM_SLUGS.length],
    ];
    for (const [slug, sheet] of cases) {
      const { container, unmount } = render(<RouteStack current={slug} />);
      expect(container).toHaveTextContent(
        `${SURVEY_LABELS.sheet.text} ${sheet} / ${ECOSYSTEM_SLUGS.length}`,
      );
      const swatches = [...container.querySelectorAll("svg")];
      expect(swatches).toHaveLength(ECOSYSTEM_SLUGS.length);
      swatches.forEach((swatch, index) => {
        expect(swatch.classList.contains("opacity-25"), slug).toBe(index !== sheet - 1);
      });
      unmount();
    }
  });
});
