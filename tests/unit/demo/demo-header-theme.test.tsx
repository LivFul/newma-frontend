import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DemoHeader } from "@/app/(platform)/demo/_components/demo-header";
import { ThemeSync } from "@/components/site/theme-sync";
import { THEME_STORAGE_KEY } from "@/lib/theme/state";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => "/demo",
}));

const session = {
  persona: "scientist" as const,
  tenant_id: "tenant-abc",
  expires_at: "2030-01-01T00:00:00.000Z",
  created_at: "2029-12-31T00:00:00.000Z",
};

describe("DemoHeader with dark theme", () => {
  beforeEach(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    document.documentElement.classList.remove("light");
    document.documentElement.classList.add("dark");
    document.documentElement.dataset.theme = "dark";
  });

  it("renders signed-in chrome on semantic dark tokens", () => {
    render(
      <>
        <ThemeSync />
        <DemoHeader session={session} />
      </>,
    );
    expect(screen.getByTestId("current-persona")).toHaveTextContent("Scientist");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});
