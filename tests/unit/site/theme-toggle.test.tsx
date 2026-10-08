import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SiteHeader } from "@/components/site/site-header";
import { THEME_STORAGE_KEY } from "@/lib/theme/state";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

describe("ThemeToggle in SiteHeader", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark", "light");
  });

  it("stores dark when chosen from the theme control", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const sheet = document.getElementById("mobile-sections")!;
    const group = within(sheet).getByRole("radiogroup", { name: "Theme" });
    expect(within(group).getAllByRole("radio")).toHaveLength(3);
    await user.click(within(group).getByRole("radio", { name: "Dark" }));
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
