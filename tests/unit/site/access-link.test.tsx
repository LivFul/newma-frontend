import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const trackEvent = vi.fn();
vi.mock("@/lib/analytics/events", () => ({ trackEvent: (e: unknown) => trackEvent(e) }));

import { AccessLink } from "@/components/site/access-link";

describe("AccessLink", () => {
  beforeEach(() => trackEvent.mockClear());

  it("is a plain anchor to /access", () => {
    render(<AccessLink>Access NEWMA</AccessLink>);
    const link = screen.getByRole("link", { name: "Access NEWMA" });
    expect(link).toHaveAttribute("href", "/access");
    expect(link.tagName).toBe("A");
  });
  it("calls the tracker once per click with the access event only", async () => {
    const user = userEvent.setup();
    render(<AccessLink>Access NEWMA</AccessLink>);
    const link = screen.getByRole("link", { name: "Access NEWMA" });
    link.addEventListener("click", (e) => e.preventDefault());
    await user.click(link);
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith({ name: "access_newma_click" });
    await user.click(link);
    expect(trackEvent).toHaveBeenCalledTimes(2);
  });
  it("applies the variant and className", () => {
    render(
      <AccessLink variant="secondary" className="min-h-11">
        Access NEWMA
      </AccessLink>,
    );
    const link = screen.getByRole("link", { name: "Access NEWMA" });
    expect(link.className).toMatch(/min-h-11/);
    expect(link.className).toMatch(/\bglass-control\b/);
  });
});
