// Value: protects=on-sheet route ends read Field and Patient and stay out of the accessibility tree; fails_when=those labels are dropped, swapped, or the terrain svg loses aria-hidden; why_new=the hero map-key test never reads the Field and Patient labels; seam=none
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SurveyTerrain } from "@/components/site/survey-terrain";

describe("SurveyTerrain", () => {
  it("names the route ends Field and Patient without exposing the drawing", () => {
    const { container } = render(<SurveyTerrain />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");
    const places = [...svg!.querySelectorAll("text")].map((node) => node.textContent);
    expect(places).toEqual(["Field", "Patient"]);
  });
});
